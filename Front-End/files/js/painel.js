/*
MELHORIA (4.4) — Painel de rastreamento do aluno.

Consome GET /student/me (contexto completo do aluno — 4.2) e
GET /edubot/recommendation (agente — 4.3) para exibir:
  - recursos consumidos por OVA (com barra de progresso por recurso)
  - status de cada competência (não iniciada / em desenvolvimento / desenvolvida)
  - última recomendação do EduBot + botão para pedir uma nova
*/
import { getMe, getEdubotRecommendation } from "./request.js";

const STATUS_BADGES = {
    "não iniciada": "secondary",
    "em desenvolvimento": "warning",
    "desenvolvida": "success"
};

const TYPE_ICONS = {
    texto: "bi-file-text",
    video: "bi-play-btn",
    podcast: "bi-headphones",
    quiz: "bi-patch-question",
    atividade: "bi-clipboard-check"
};

$(document).ready(function () {
    // Only logged-in students can see the panel
    const logged = JSON.parse(localStorage.getItem("logged"));
    if (logged == null || logged === false || localStorage.getItem("token") == null) {
        window.location.href = "login.html";
        return;
    }
    sessionStorage.setItem("past_page", "painel");

    getMe()
    .then(profile => renderPanel(profile))
    .catch(error => {
        console.log(error);
        if (error.status === 401) window.location.href = "login.html";
    });

    // Asks the agent for a fresh recommendation on demand
    $(".ask-edubot").on("click", function () {
        const button = $(this);
        button.prop("disabled", true).html("Consultando o EduBot...");
        getEdubotRecommendation()
        .then(response => {
            renderRecommendation(response.recommendation);
            button.prop("disabled", false).html("Pedir nova recomendação");
        })
        .catch(error => {
            console.log(error);
            button.prop("disabled", false).html("Pedir nova recomendação");
        });
    });
});

function renderPanel(profile) {
    $(".student-name").html(`<i class="bi bi-person-circle me-1"></i>${profile.estudante.nome}`);

    // --- summary cards -------------------------------------------------------
    const cards = [
        { label: "Recursos consumidos", value: `${profile.recursos.percentual_consumido}%`,
          sub: `${profile.recursos.consumidos} de ${profile.recursos.total}`, icon: "bi-collection-play" },
        { label: "Dias sem acesso", value: profile.dias_sem_acesso ?? "—",
          sub: "desde a última interação", icon: "bi-calendar-x" },
        { label: "Taxa de erro no quiz", value: profile.quiz.taxa_erro != null ? `${Math.round(profile.quiz.taxa_erro * 100)}%` : "—",
          sub: `${profile.quiz.tentativas} tentativa(s)`, icon: "bi-patch-question" },
        { label: "Formato preferido", value: profile.preferencia_formato ?? "—",
          sub: "maior engajamento", icon: "bi-star" }
    ];
    const summary = $(".summary-cards");
    cards.forEach(card => summary.append($(`
        <div class="col-6 col-md-3">
            <div class="card text-center shadow-sm h-100">
                <div class="card-body">
                    <i class="bi ${card.icon} fs-3 text-primary"></i>
                    <h4 class="my-1">${card.value}</h4>
                    <small class="text-muted d-block">${card.label}</small>
                    <small class="text-muted">${card.sub}</small>
                </div>
            </div>
        </div>
    `)));

    // --- resources per OVA ---------------------------------------------------
    const ovasArea = $(".ovas-area");
    profile.ovas.forEach(ova => {
        const block = $(`
            <div class="mb-4">
                <h5 class="d-flex justify-content-between">
                    <span>${ova.ova_name}</span>
                    <span class="badge bg-${ova.completed ? "success" : "secondary"}">
                        ${ova.completed ? "Concluído" : `${ova.perc_scrolled || 0}% lido`}
                    </span>
                </h5>
                <ul class="list-group resource-list"></ul>
            </div>
        `);
        const list = block.find(".resource-list");
        (ova.recursos || []).forEach(resource => {
            const icon = TYPE_ICONS[resource.tipo] || "bi-dot";
            const status = resource.concluido
                ? `<span class="badge bg-success">concluído</span>`
                : (resource.consumido
                    ? `<span class="badge bg-warning text-dark">${resource.perc_consumido}%</span>`
                    : `<span class="badge bg-secondary">não iniciado</span>`);
            list.append($(`
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <span><i class="bi ${icon} me-2 text-primary"></i>${resource.titulo}
                        <small class="text-muted">(${resource.tipo})</small></span>
                    ${status}
                </li>
            `));
        });
        ovasArea.append(block);
    });
    if (profile.ovas.length === 0) ovasArea.html(`<p class="text-muted">Nenhum OVA disponível.</p>`);

    // --- competencies --------------------------------------------------------
    const compArea = $(".competencies-area");
    profile.competencias.forEach(comp => {
        const badge = STATUS_BADGES[comp.status] || "secondary";
        compArea.append($(`
            <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center">
                    <span class="me-2">${comp.nome}</span>
                    <span class="badge bg-${badge} text-nowrap">${comp.status}</span>
                </div>
                <small class="text-muted">${comp.acertos}/${comp.total_questoes} questões corretas</small>
            </div>
        `));
    });
    if (profile.competencias.length === 0) compArea.html(`<p class="text-muted">Nenhuma competência mapeada.</p>`);

    // --- last EduBot recommendation (from the interventions history) ----------
    const last = (profile.historico_intervencoes || [])[0];
    if (last) {
        $(".edubot-area").html(`
            <p class="mb-1"><span class="badge bg-info text-dark">${last.tipo}</span>
                <small class="text-muted ms-2">${last.data}</small></p>
            <p class="m-0">${last.descricao ?? ""}</p>
        `);
    } else {
        $(".edubot-area").html(`<p class="text-muted m-0">
            Nenhuma recomendação ainda — clique em "Pedir nova recomendação".</p>`);
    }
}

// Renders a freshly generated recommendation (richer than the history entry)
function renderRecommendation(rec) {
    const acoes = (rec.acoes || []).map(a => `<li>${a}</li>`).join("");
    $(".edubot-area").html(`
        <p class="mb-1"><span class="badge bg-info text-dark">${rec.tipo}</span>
            <span class="badge bg-${rec.prioridade === "alta" ? "danger" : rec.prioridade === "media" ? "warning text-dark" : "secondary"} ms-1">prioridade ${rec.prioridade}</span>
            ${rec.mock ? '<small class="text-muted ms-2">(resposta simulada — Bedrock ainda não conectado)</small>' : ""}
        </p>
        <h5>${rec.titulo}</h5>
        <p>${rec.mensagem_aluno}</p>
        <ul>${acoes}</ul>
        <small class="text-muted">${rec.justificativa}</small>
    `);
}
