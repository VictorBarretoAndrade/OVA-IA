/*
INTEGRAÇÃO (4.1) — A "Área de Conteúdo" deixou de listar conteúdos fictícios e
passou a mostrar os recursos REAIS de cada OVA (GET /ova/<id>/resources):
  - texto     -> abre o leitor clássico (iframe.html), que já rastreia
                 scroll/tempo de leitura via /progress/ova
  - video     -> VideoPlayer (YouTube ou arquivo) com % assistido persistido
  - podcast   -> AudioPlayer com tempo de escuta persistido
  - atividade -> botão "Marcar como concluída"
  - quiz      -> atalho para a aba Quiz
Todo consumo vai para POST /progress/resource e atualiza o perfil.
*/
import { BookOpenText, CheckCircle2, ExternalLink, FileText, ListChecks } from "lucide-react";
import { useEffect, useState } from "react";
import {
  OvaResource,
  StudentProfile,
  getOVAResources,
  saveResourceProgress
} from "../services/api";
import { CLASSIC_BASE_URL } from "../services/config";
import { useToast } from "./ui/Toast";
import { VideoPlayer, MediaProgress } from "./players/VideoPlayer";
import { AudioPlayer } from "./players/AudioPlayer";

interface ContentsProps {
  profile: StudentProfile;
  onTracked: () => void;
}

// URL do leitor clássico. O Apache serve este app em http://localhost:8010/app/,
// na MESMA origem das páginas clássicas — por isso o localStorage (token,
// ova_id, ova_link) é compartilhado entre os dois frontends.
const classicReaderUrl = () => `${CLASSIC_BASE_URL}/html/iframe.html`;

export const Contents = ({ profile, onTracked }: ContentsProps) => {
  const [activeOvaId, setActiveOvaId] = useState(profile.ovas[0]?.ova_id ?? 0);
  const [resources, setResources] = useState<OvaResource[]>([]);
  const activeOva = profile.ovas.find((ova) => ova.ova_id === activeOvaId);
  const toast = useToast();

  useEffect(() => {
    if (!activeOvaId) return;
    // Guarda contra condição de corrida: ao trocar de OVA rápido, descarta a
    // resposta de uma requisição antiga que chegue depois da nova.
    let active = true;
    getOVAResources(activeOvaId)
      .then((data) => {
        if (active) setResources(data);
      })
      .catch(() => {
        if (active) setResources([]);
      });
    return () => {
      active = false;
    };
  }, [activeOvaId]);

  const trackMedia = (resource: OvaResource) => (progress: MediaProgress) => {
    saveResourceProgress({
      resource_id: resource.resource_id,
      perc_consumed: progress.perc,
      seconds_consumed: progress.seconds,
      completed: progress.completed
    })
      .then(onTracked)
      .catch(() => toast.error("Não foi possível salvar seu progresso. Verifique a conexão."));
  };

  const trackText = (resource: OvaResource) => {
    saveResourceProgress({ resource_id: resource.resource_id, perc_consumed: 100, completed: true })
      .then(onTracked)
      .catch(() => toast.error("Não foi possível registrar a leitura."));
  };

  const completeActivity = (resource: OvaResource) => {
    saveResourceProgress({ resource_id: resource.resource_id, perc_consumed: 100, completed: true })
      .then(() => {
        setResources((current) =>
          current.map((item) =>
            item.resource_id === resource.resource_id ? { ...item, completed: true } : item
          )
        );
        onTracked();
        toast.success("Atividade marcada como concluída!");
      })
      .catch(() => toast.error("Não foi possível concluir a atividade."));
  };

  const openClassicReader = (ova: { ova_id: number; link: string }) => {
    // O leitor clássico lê o OVA selecionado do localStorage (mesma origem)
    localStorage.setItem("ova_id", String(ova.ova_id));
    localStorage.setItem("ova_link", ova.link);
    window.open(classicReaderUrl(), "_blank");
  };

  return (
    <section className="grid gap-6 xl:grid-cols-[330px_1fr]">
      <div className="space-y-3">
        <h1 className="mb-5 text-3xl font-bold text-ink">Área de Conteúdo</h1>
        {profile.ovas.map((ova) => (
          <button
            key={ova.ova_id}
            onClick={() => setActiveOvaId(ova.ova_id)}
            className={`w-full rounded-[8px] border p-5 text-left transition ${
              activeOvaId === ova.ova_id ? "border-brand bg-indigo-50" : "border-line bg-white hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-brand">OVA</span>
              {ova.completed && <CheckCircle2 className="text-teal" size={20} />}
            </div>
            <div className="mt-2 font-bold text-ink">{ova.ova_name}</div>
            <div className="mt-2 text-sm text-muted">
              {ova.perc_scrolled || 0}% lido · {Math.round((ova.read_time || 0) / 60)} min estudados
            </div>
          </button>
        ))}
      </div>

      <div className="space-y-5">
        {activeOva && (
          <div className="rounded-[8px] border border-line bg-white p-6 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-brand">Leitura interativa</p>
                <h2 className="mt-1 text-2xl font-bold text-ink">{activeOva.ova_name}</h2>
                <p className="mt-2 text-muted">
                  O texto completo, os acordeões e os carrosséis abrem no leitor de OVAs — o tempo de leitura e o
                  scroll continuam sendo rastreados normalmente.
                </p>
              </div>
              <button
                onClick={() => openClassicReader(activeOva)}
                className="flex h-11 items-center gap-2 rounded-[8px] bg-brand px-5 font-semibold text-white"
              >
                <BookOpenText size={19} />
                Abrir conteúdo
                <ExternalLink size={16} />
              </button>
            </div>
          </div>
        )}

        {resources
          .filter((resource) => resource.resource_type === "texto" && resource.resource_url)
          .map((resource) => (
            <div
              key={resource.resource_id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-[8px] border border-line bg-white p-5"
            >
              <span className="flex items-center gap-2 font-semibold text-ink">
                <FileText size={20} className="text-brand" />
                {resource.resource_title}
              </span>
              <a
                href={resource.resource_url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackText(resource)}
                className="rounded-[8px] border border-brand px-4 py-2 font-semibold text-brand transition hover:bg-indigo-50"
              >
                {resource.completed ? "Reler" : "Abrir leitura"}
              </a>
            </div>
          ))}

        {resources
          .filter((resource) => resource.resource_type === "video")
          .map((resource) => (
            <VideoPlayer
              key={resource.resource_id}
              url={resource.resource_url}
              mediaType={resource.media_type}
              title={resource.resource_title}
              initialPerc={resource.perc_consumed}
              onProgress={trackMedia(resource)}
            />
          ))}

        {resources
          .filter((resource) => resource.resource_type === "podcast")
          .map((resource) => (
            <AudioPlayer
              key={resource.resource_id}
              url={resource.resource_url}
              title={resource.resource_title}
              durationSeconds={resource.duration_seconds}
              initialSeconds={resource.seconds_consumed}
              onProgress={trackMedia(resource)}
            />
          ))}

        {resources
          .filter((resource) => resource.resource_type === "atividade")
          .map((resource) => (
            <div
              key={resource.resource_id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-[8px] border border-line bg-white p-5"
            >
              <div className="flex items-center gap-3">
                <ListChecks className="text-brand" size={24} />
                <div>
                  <div className="font-bold text-ink">{resource.resource_title}</div>
                  <div className="text-sm text-muted">Atividade prática</div>
                </div>
              </div>
              {resource.completed ? (
                <span className="flex items-center gap-2 rounded-[8px] bg-emerald-50 px-4 py-2 font-semibold text-emerald-700">
                  <CheckCircle2 size={18} />
                  Concluída
                </span>
              ) : (
                <button
                  onClick={() => completeActivity(resource)}
                  className="h-11 rounded-[8px] bg-teal px-5 font-semibold text-white"
                >
                  Marcar como concluída
                </button>
              )}
            </div>
          ))}
      </div>
    </section>
  );
};
