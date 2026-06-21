/*
MELHORIA (OVA personalizada) — renderiza a OVA de reforço montada pelo agente.

A OVA personalizada não tem página HTML própria: esta página lê o id pela query
string (?id=), busca o conteúdo em GET /personalized-ova/<id> e o renderiza
reaproveitando exatamente os mesmos componentes das OVAs normais — os players de
vídeo/podcast e o quiz (makeQuestions, corrigido server-side). O consumo dos
recursos é persistido em resource_progress como em qualquer OVA, então a leitura
deste reforço também realimenta o perfil do aluno e o próprio EduBot.
*/
import { getPersonalizedOVA, saveResourceProgress } from "./request.js";
import { makeQuestions } from "./make.js";
import { createVideoPlayer } from "./components/video-player.js";
import { createAudioPlayer } from "./components/audio-player.js";

$(document).ready(function () {
    const logged = JSON.parse(localStorage.getItem("logged"));
    if (logged == null || logged === false || localStorage.getItem("token") == null) {
        window.location.href = "login.html";
        return;
    }
    sessionStorage.setItem("past_page", "ova_personalizada");

    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) {
        $(".pova-title").text("OVA não informada.");
        return;
    }

    getPersonalizedOVA(id)
    .then(renderPersonalizedOVA)
    .catch(error => {
        console.log(error);
        if (error.status === 401) window.location.href = "login.html";
        else $(".pova-title").text("Não foi possível carregar a OVA de reforço.");
    });
});

function renderPersonalizedOVA(data) {
    $(".pova-title").text(data.titulo || "OVA de Reforço");
    $(".pova-message").text(data.mensagem_aluno || "");
    if (data.competencia) $(".pova-competency").text(`Foco: ${data.competencia.nome}`);
    else $(".pova-competency").hide();

    const container = document.querySelector(".pova-resources");

    // Persiste o consumo do recurso (mesmo pipeline das OVAs normais)
    const saveProgress = (resource, state) => {
        saveResourceProgress({
            resource_id: resource.resource_id,
            perc_consumed: state.perc || 0,
            seconds_consumed: state.seconds || 0,
            completed: state.completed || false
        }).catch(error => console.log(error));
    };

    (data.recursos || []).forEach(resource => {
        if (resource.resource_type === "video") {
            createVideoPlayer(container, {
                url: resource.resource_url,
                mediaType: resource.media_type,
                title: resource.resource_title,
                initialPerc: resource.perc_consumed,
                onProgress: state => saveProgress(resource, state)
            });
        } else if (resource.resource_type === "podcast") {
            createAudioPlayer(container, {
                url: resource.resource_url,
                title: resource.resource_title,
                durationSeconds: resource.duration_seconds,
                initialSeconds: resource.seconds_consumed,
                onProgress: state => saveProgress(resource, state)
            });
        } else if (resource.resource_type === "texto") {
            // Texto de reforço: link externo (media_type "link"). Abrir conta
            // como consumo/conclusão do recurso.
            const done = resource.completed;
            const card = $(`
                <div class="my-4 p-3 border rounded-3 d-flex justify-content-between align-items-center">
                    <span class="fs-5"><i class="bi bi-file-text me-2"></i>${resource.resource_title}</span>
                    <a class="btn btn-outline-primary" target="_blank" rel="noopener"
                       href="${resource.resource_url || "#"}">${done ? "Reler" : "Abrir leitura"}</a>
                </div>
            `);
            card.find("a").on("click", () => saveProgress(resource, { perc: 100, completed: true }));
            $(container).append(card);
        } else if (resource.resource_type === "atividade") {
            const done = resource.completed;
            const card = $(`
                <div class="my-4 p-3 border rounded-3 d-flex justify-content-between align-items-center">
                    <span class="fs-5"><i class="bi bi-clipboard-check me-2"></i>${resource.resource_title}</span>
                    <button class="btn ${done ? "btn-success disabled" : "btn-outline-success"}">
                        ${done ? "Concluída ✓" : "Marcar como concluída"}
                    </button>
                </div>
            `);
            card.find("button").on("click", function () {
                saveProgress(resource, { perc: 100, completed: true });
                $(this).addClass("btn-success disabled").removeClass("btn-outline-success").html("Concluída ✓");
            });
            $(container).append(card);
        }
    });

    if (!(data.recursos || []).length) {
        $(container).html(`<p class="text-muted">Nenhum recurso nesta trilha.</p>`);
    }

    // Quiz de fixação: reaproveita makeQuestions (correção no servidor, grava
    // tentativas em attempts — alimentando o diagnóstico do próprio EduBot).
    if ((data.questoes || []).length) {
        makeQuestions(data.questoes);
    } else {
        $(".pova-quiz-section").hide();
    }
}
