/*
MELHORIA (4.1) — Componente de player de ÁUDIO/PODCAST (separado do de vídeo).

Recebe uma URL qualquer (arquivo direto hoje; quando a hospedagem for
definida, a mesma abstração serve para S3/local — e um media_type "spotify"
pode ganhar um ramo de embed aqui sem tocar no resto do código).

Rastreia o TEMPO DE ESCUTA real (segundos com o áudio efetivamente tocando,
acumulados mesmo com pause/seek) e a conclusão. Reporta via
onProgress({ seconds, perc, completed }) a cada 10s de escuta, no pause e no
fim — a página persiste via /progress/resource.
*/

const COMPLETED_PERC = 90;   // podcast considerado concluído a partir de 90%
const REPORT_EVERY_S = 10;   // reporta a cada 10 segundos de escuta acumulada

/*
Creates the audio player inside `container` (a DOM element).
options: { url, title, durationSeconds, initialSeconds, onProgress }
*/
export function createAudioPlayer(container, options) {
    const { url, title, durationSeconds = 0, initialSeconds = 0, onProgress } = options;

    const wrapper = document.createElement("div");
    wrapper.className = "audio-player-component my-4 p-3 border rounded-3 bg-light";
    wrapper.innerHTML = `
        <h3 class="fs-5 mb-2"><i class="bi bi-headphones me-2"></i>${title || "Podcast"}</h3>
        <audio controls class="w-100" preload="metadata"></audio>
        <small class="text-muted listened-label d-block mt-1"></small>
    `;
    container.appendChild(wrapper);

    const audio = wrapper.querySelector("audio");
    const label = wrapper.querySelector(".listened-label");
    audio.src = url;

    // Cumulative listening time, restored from the backend (resource_progress)
    let listenedSeconds = initialSeconds;
    let lastReported = initialSeconds;
    let ticker = null;

    function totalDuration() {
        // Prefer the real metadata duration; fall back to the catalogued one
        return (audio.duration && isFinite(audio.duration)) ? audio.duration : durationSeconds;
    }

    function currentPerc() {
        const total = totalDuration();
        return total ? Math.min(100, Math.round(100 * listenedSeconds / total)) : 0;
    }

    function updateLabel() {
        const min = Math.floor(listenedSeconds / 60);
        const sec = Math.round(listenedSeconds % 60);
        label.textContent = `Tempo de escuta: ${min}m${String(sec).padStart(2, "0")}s (${currentPerc()}%)`;
    }

    function report(completed = false) {
        lastReported = listenedSeconds;
        if (onProgress) onProgress({
            seconds: Math.round(listenedSeconds),
            perc: currentPerc(),
            completed: completed || currentPerc() >= COMPLETED_PERC
        });
    }

    // Count one second of listening per real second while playing
    audio.addEventListener("play", () => {
        if (ticker) return;
        ticker = setInterval(() => {
            listenedSeconds++;
            updateLabel();
            if (listenedSeconds - lastReported >= REPORT_EVERY_S) report();
        }, 1000);
    });

    function stopTicker() {
        if (ticker) { clearInterval(ticker); ticker = null; }
    }

    audio.addEventListener("pause", () => { stopTicker(); report(); });
    audio.addEventListener("ended", () => { stopTicker(); report(true); });

    updateLabel();
    return wrapper;
}
