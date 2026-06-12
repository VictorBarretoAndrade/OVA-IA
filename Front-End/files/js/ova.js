import {
    registerInteraction,
    getOVAQuestions,
    getOVAResources,
    saveOVAProgress,
    saveResourceProgress
}
from "./request.js";

import { makeQuestions } from "./make.js";
// MELHORIA (4.1): players de vídeo e áudio como componentes separados
import { createVideoPlayer } from "./components/video-player.js";
import { createAudioPlayer } from "./components/audio-player.js";

// OVA considered concluded when the student scrolled at least this much
const OVA_COMPLETED_PERC = 90;
// How often (seconds) the reading progress is persisted to the backend
const SYNC_INTERVAL_S = 15;

$(document).ready(function() {
    sessionStorage.setItem("past_page", "iframe");

    const ova_id = localStorage.getItem("ova_id");

    /*
    BUGFIX (B4): read_time and perc_scrolled used to be stored in GLOBAL
    localStorage keys, so progress from one OVA leaked into every other OVA.
    The keys are now namespaced by ova_id.
    */
    const readTimeKey = `read_time_${ova_id}`;
    const percScrolledKey = `perc_scrolled_${ova_id}`;

    let timePassed = parseInt(localStorage.getItem(readTimeKey)) || 0;
    if (localStorage.getItem(percScrolledKey) == null) {
        localStorage.setItem(percScrolledKey, 0);
    }

    let maxScrolled = parseInt(localStorage.getItem(percScrolledKey)) || 0;

    /*
    BUGFIX (B4): the counter used to overwrite read_time with the checkpoint
    threshold instead of the real elapsed time. Now the real elapsed time is
    accumulated and persisted both locally and in the backend (ova_progress),
    which previously never received any data.
    */
    setInterval(function () {
        timePassed++;
        localStorage.setItem(readTimeKey, timePassed);
    }, 1000);

    // MELHORIA (4.1/4.2): periodically sync the reading progress to the backend
    function syncProgress() {
        saveOVAProgress({
            ova_id: ova_id,
            read_time: timePassed,
            perc_scrolled: maxScrolled,
            completed: maxScrolled >= OVA_COMPLETED_PERC
        }).catch(error => console.log(error));
    }
    setInterval(syncProgress, SYNC_INTERVAL_S * 1000);

    // Redirect to the login page if the user is not logged in
    const logged = JSON.parse(localStorage.getItem("logged"));
    if (logged == null || logged === false) {
        window.location.href = "login.html";
    }

    /*
    Divide the page scroll into n points (5), and the user needs to
    pass each point within at least total_time / n_points (360/5) seconds
    */
    let scrollPoints = generateScrollPoints(360, 5, percScrolledKey);

    const carrousels = $("section").find(".carrousel");
    const accordionItems = $(".accordion-item");

    getOVAQuestions()
    .then(response => makeQuestions(response))
    .catch(error => console.log(error));

    // MELHORIA (4.1): render the OVA's media resources (videos, podcasts and
    // practical activities) from the database, with consumption tracking
    getOVAResources(ova_id)
    .then(response => renderMediaResources(response))
    .catch(error => console.log(error));

    // This section counts the total number of interactions in the OVA

    let accordionView = [];

    /*
    For each accordion item, if the student opens the item,
    it registers an interaction, sending to the API the description,
    along with the name of the item and the section it belongs to
    */
    accordionItems.each(index => {
        const accordionItem = accordionItems.eq(index);
        accordionView.push(false);
        accordionItem.find(".accordion-header").on("click", function(e) {
            e.preventDefault();
            if (accordionItem.find(".accordion-button").hasClass("collapsed")) {
                accordionItems.find(".accordion-button").addClass("collapsed");
                accordionItems.find(".accordion-collapse").removeClass("show");
                accordionItem.find(".accordion-button").removeClass("collapsed");
                accordionItem.find(".accordion-collapse").addClass("show");
                if (!accordionView[index]) {
                    const itemName = accordionItem.find(".accordion-button").html();
                    const action = `The user read the ${itemName} accordion`;
                    registerInteraction(action)
                    .then(response => console.log("success"))
                    .catch(error => console.log(error));
                }
            } else {
                accordionItem.find(".accordion-button").addClass("collapsed");
                accordionItem.find(".accordion-collapse").removeClass("show");
            }
        });
    });

    /*
    Animation to display the section content to the user only when
    they reach that point
    */
    const sections = $(".section-content");
    $(window).on("scroll", function () {
        const s = $(window).scrollTop(),
            d = $(document).height(),
            c = $(window).height();

        $.each(sections, function(index) {
            const section = sections.eq(index);
            if (s - section.parent().offset().top >= - c / 2) {
                section.animate({
                    left: "0px",
                    opacity: 1
                }, 500);
            }
        });

        const scrollPercent = (s / (d - c)) * 100;

        // Track the maximum scroll reached (per-OVA — see BUGFIX B4)
        if (scrollPercent > maxScrolled) {
            maxScrolled = Math.min(100, Math.round(scrollPercent));
            localStorage.setItem(percScrolledKey, maxScrolled);
        }

        /**
        When the student reaches a new scroll point, the API registers
        that the student reached that point.
        */
        scrollPoints.forEach(async point => {
            if (scrollPercent >= point.perc && point.status === false && timePassed >= point.time) {
                point.status = true;
                const action = `This student reached ${point.perc}% in this OVA`;
                await registerInteraction(action)
                .then(response => console.log("success"))
                .catch(error => console.log(error));
                // Persist the new milestone right away
                syncProgress();
            }
        });
    });

    // Displays the first carrousel item in each carrousel
    let carrouselsActualParts = {};
    carrousels.each(index => {
        const carrousel = carrousels.eq(index);
        const parts = carrousel.find(".parts").children();
        parts.each(index => {
            const part = parts.eq(index);
            if (index == 0) part.show();
            else part.hide();
        });
        carrouselsActualParts[carrousel.data("carrousel-name")] = 0;
    });

    /*
    When the student navigates through the carrousel items, the API
    registers that the student made an interaction with that specific carrousel
    */
    carrousels.each(index => {
        const carrousel = carrousels.eq(index);
        let action = `The user x passed the image in the carrousel of ${carrousel.data("carrousel-name")}`;
        carrousel.find(".arrow-left").on("click", async function() {
            changePart(-1, carrousel, carrouselsActualParts);
            await registerInteraction(action)
            .then(response => console.log("success"))
            .catch(error => console.log(error));
        });
        carrousel.find(".arrow-right").on("click", async function() {
            changePart(1, carrousel, carrouselsActualParts);
            await registerInteraction(action)
            .then(response => console.log("success"))
            .catch(error => console.log(error));
        });
    });
});

/*
MELHORIA (4.1): renders the media resources (video/podcast/atividade) of the
OVA inside the "Recursos Adicionais" section. Each player receives only a URL
(the hosting decision — S3, local upload, YouTube, Spotify — stays open) and
reports consumption back, which is persisted in resource_progress and also
registered as an interaction.
*/
function renderMediaResources(resources) {
    // Reuse the existing "Recursos Adicionais" section of the OVA page when
    // present; create an equivalent one otherwise (keeps the current visual)
    let container = $("#resources .container").get(0);
    if (!container) {
        const section = $(`
            <section id="resources">
                <h1 class="title text-light bg-primary text-center py-5">Recursos Adicionais</h1>
                <div class="container p-5 position-relative"></div>
            </section>
        `);
        $("body").append(section);
        container = section.find(".container").get(0);
    }

    const saveProgress = (resource, state, label) => {
        saveResourceProgress({
            resource_id: resource.resource_id,
            perc_consumed: state.perc || 0,
            seconds_consumed: state.seconds || 0,
            completed: state.completed || false
        }).catch(error => console.log(error));
        registerInteraction(label).catch(error => console.log(error));
    };

    resources.forEach(resource => {
        if (resource.resource_type === "video") {
            createVideoPlayer(container, {
                url: resource.resource_url,
                mediaType: resource.media_type,
                title: resource.resource_title,
                initialPerc: resource.perc_consumed,
                onProgress: state => saveProgress(
                    resource, state,
                    `Watched ${state.perc}% of the "${resource.resource_title}" video`)
            });
        } else if (resource.resource_type === "podcast") {
            createAudioPlayer(container, {
                url: resource.resource_url,
                title: resource.resource_title,
                durationSeconds: resource.duration_seconds,
                initialSeconds: resource.seconds_consumed,
                onProgress: state => saveProgress(
                    resource, state,
                    `Listened ${state.seconds}s of the "${resource.resource_title}" podcast`)
            });
        } else if (resource.resource_type === "atividade") {
            // Practical activity: simple card with a completion button
            const done = resource.completed;
            const card = $(`
                <div class="activity-resource my-4 p-3 border rounded-3 d-flex justify-content-between align-items-center">
                    <span class="fs-5"><i class="bi bi-clipboard-check me-2"></i>${resource.resource_title}</span>
                    <button class="btn ${done ? "btn-success disabled" : "btn-outline-success"}">
                        ${done ? "Concluída ✓" : "Marcar como concluída"}
                    </button>
                </div>
            `);
            card.find("button").on("click", function() {
                saveProgress(resource, { perc: 100, completed: true },
                    `Completed the "${resource.resource_title}" activity`);
                $(this).addClass("btn-success disabled").removeClass("btn-outline-success").html("Concluída ✓");
            });
            $(container).append(card);
        }
        // "texto" and "quiz" resources are the OVA page itself — already
        // tracked by scroll/read time and by quiz attempts respectively
    });
}

/*
The function to generate the scroll points, given a minimum read time
and the number of points.
*/
function generateScrollPoints(readTime, n_points, percScrolledKey) {
    let points = [];
    const perc = 100 / n_points;
    const perc_time = readTime / n_points;
    // BUGFIX (B4): reads the per-OVA key instead of the old global one
    const alreadyScrolled = JSON.parse(localStorage.getItem(percScrolledKey));
    for (let i = 1; i <= n_points; i++) {
        /*
        The percentage of the point, the minimum time, and
        whether the student has already achieved that point.
        */
        points.push({
            perc: perc * i,
            time: perc_time * i,
            status: perc * i <= alreadyScrolled
        });
    }

    return points;
}

// Function to change the item of the carousels
function changePart(side, carrousel, carrouselsActualParts) {
    const parts = carrousel.find(".parts").children();
    let actualPart = carrouselsActualParts[carrousel.data("carrousel-name")];
    actualPart = actualPart + side;
    if (side > 0 && actualPart == parts.length) {
        actualPart = 0;
    } else if (side < 0 && actualPart < 0) {
        actualPart = parts.length - 1;
    }

    carrouselsActualParts[carrousel.data("carrousel-name")] = actualPart;
    parts.each(index => {
        const part = parts.eq(index);
        if (index == actualPart) part.show();
        else part.hide();
    });
    changeDots(carrousel, actualPart);
}

// Function to change the dot of the current item of the carousel
function changeDots(carrousel, part) {
    const dots = carrousel.find(".dots").children();
    dots.each(index => {
        const dot = dots.eq(index);
        if (index == part) {
            dot.addClass("bi-circle-fill");
            dot.removeClass("bi-circle");
            dot.addClass("fs-5");
        } else {
            dot.removeClass("bi-circle-fill");
            dot.addClass("bi-circle");
            dot.removeClass("fs-5");
        }
    });
}
