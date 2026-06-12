/*
MELHORIA (4.1) — Componente de player de VÍDEO.

Recebe uma URL qualquer e decide como renderizar:
  - URL do YouTube (media_type "youtube" ou URL reconhecível) -> embed via
    YouTube IFrame API, com polling de progresso;
  - Qualquer outra URL (media_type "upload": S3, arquivo local servido pelo
    Apache, etc.) -> <video> HTML5 nativo.

A decisão de hospedagem fica em aberto de propósito: o componente só conhece
a URL. O consumo é reportado pelo callback onProgress({ perc, seconds,
completed }) em checkpoints de 10%, e a página decide o que fazer (persistir
via /progress/resource e registrar interação).

BUGFIX (B3): o player antigo (video-player.js global) salvava SEGUNDOS
assistidos no localStorage e comparava com checkpoints em PERCENTUAL, fazendo
os checkpoints dispararem errado após recarregar. Aqui o estado inicial vem do
backend (initialPerc, vindo de resource_progress) e a comparação é sempre em
percentual.
*/

const COMPLETED_PERC = 90; // vídeo considerado concluído a partir de 90%

// Loads the YouTube IFrame API once per document and resolves when ready
let ytApiPromise = null;
function loadYouTubeAPI() {
    if (ytApiPromise) return ytApiPromise;
    ytApiPromise = new Promise(resolve => {
        if (window.YT && window.YT.Player) return resolve(window.YT);
        const previous = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
            if (previous) previous();
            resolve(window.YT);
        };
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
    });
    return ytApiPromise;
}

// Extracts the video id from the usual YouTube URL shapes
export function youtubeIdFromUrl(url) {
    const match = (url || "").match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/);
    return match ? match[1] : null;
}

/*
Creates the video player inside `container` (a DOM element).
options: { url, mediaType, title, initialPerc, onProgress }
*/
export function createVideoPlayer(container, options) {
    const { url, mediaType, title, initialPerc = 0, onProgress } = options;
    const ytId = (mediaType === "youtube" || /youtu/.test(url || "")) ? youtubeIdFromUrl(url) : null;

    const wrapper = document.createElement("div");
    wrapper.className = "video-player-component my-4";
    wrapper.innerHTML = `
        <h3 class="fs-5 mb-2">${title || "Vídeo"}</h3>
        <div class="ratio ratio-16x9 player-slot"></div>
        <div class="progress mt-2" style="height: 6px;">
            <div class="progress-bar bg-primary" role="progressbar" style="width: ${initialPerc}%"></div>
        </div>
        <small class="text-muted watched-label">${initialPerc}% assistido</small>
    `;
    container.appendChild(wrapper);

    const slot = wrapper.querySelector(".player-slot");
    const bar = wrapper.querySelector(".progress-bar");
    const label = wrapper.querySelector(".watched-label");

    // Checkpoints every 10%; the ones already reached (backend state) start done
    const checkpoints = {};
    for (let p = 10; p <= 100; p += 10) checkpoints[p] = p <= initialPerc;

    function report(perc, seconds) {
        bar.style.width = `${perc}%`;
        label.textContent = `${perc}% assistido`;
        if (onProgress) onProgress({
            perc: perc,
            seconds: Math.round(seconds),
            completed: perc >= COMPLETED_PERC
        });
    }

    // Shared progress logic: fires the callback only when a new 10% checkpoint
    // is crossed, to avoid flooding the API with requests
    function handleTime(currentSeconds, durationSeconds) {
        if (!durationSeconds) return;
        const perc = Math.min(100, Math.floor(100 * currentSeconds / durationSeconds));
        Object.keys(checkpoints).forEach(point => {
            point = Number(point);
            if (perc >= point && !checkpoints[point]) {
                checkpoints[point] = true;
                report(point, currentSeconds);
            }
        });
    }

    if (ytId) {
        // --- YouTube embed -------------------------------------------------
        const target = document.createElement("div");
        slot.appendChild(target);
        loadYouTubeAPI().then(YT => {
            const player = new YT.Player(target, {
                videoId: ytId,
                events: {
                    onReady: () => {
                        // Poll once per second while the document lives
                        setInterval(() => {
                            const duration = player.getDuration ? player.getDuration() : 0;
                            const current = player.getCurrentTime ? player.getCurrentTime() : 0;
                            if (duration > 0) handleTime(current, duration);
                        }, 1000);
                    }
                }
            });
        });
    } else {
        // --- Generic hosted file (upload/S3/local) -------------------------
        const video = document.createElement("video");
        video.controls = true;
        video.src = url;
        video.className = "w-100";
        slot.appendChild(video);
        video.addEventListener("timeupdate", () => handleTime(video.currentTime, video.duration));
        video.addEventListener("ended", () => handleTime(video.duration, video.duration));
    }

    return wrapper;
}
