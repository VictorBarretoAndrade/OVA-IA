import { CheckCircle2, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { contents } from "../data/learningData";
import { StudentState } from "../types";
import { recalculateStudent } from "../services/analytics";

interface ContentAreaProps {
  state: StudentState;
  onUpdate: (state: StudentState) => void;
}

export const ContentArea = ({ state, onUpdate }: ContentAreaProps) => {
  const [activeId, setActiveId] = useState(contents[0].id);
  const active = contents.find((content) => content.id === activeId)!;
  const progress = state.conteudos.find((item) => item.contentId === activeId)!;

  useEffect(() => {
    const interval = window.setInterval(() => {
      onUpdate(
        recalculateStudent({
          ...state,
          conteudos: state.conteudos.map((item) =>
            item.contentId === activeId
              ? { ...item, secondsSpent: item.secondsSpent + 5, lastAccess: new Date().toISOString() }
              : item
          )
        })
      );
    }, 5000);

    return () => window.clearInterval(interval);
  }, [activeId, onUpdate, state]);

  const markDone = () => {
    onUpdate(
      recalculateStudent({
        ...state,
        conteudos: state.conteudos.map((item) =>
          item.contentId === activeId ? { ...item, completed: true, lastAccess: new Date().toISOString() } : item
        )
      })
    );
  };

  return (
    <section className="grid gap-6 xl:grid-cols-[330px_1fr]">
      <div className="space-y-3">
        <h1 className="mb-5 text-3xl font-bold text-ink">Área de Conteúdo</h1>
        {contents.map((content) => {
          const itemProgress = state.conteudos.find((item) => item.contentId === content.id);
          return (
            <button
              key={content.id}
              onClick={() => setActiveId(content.id)}
              className={`w-full rounded-[8px] border p-5 text-left transition ${
                activeId === content.id ? "border-brand bg-indigo-50" : "border-line bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-brand">{content.type}</span>
                {itemProgress?.completed && <CheckCircle2 className="text-teal" size={20} />}
              </div>
              <div className="mt-2 font-bold text-ink">{content.title}</div>
              <div className="mt-2 flex items-center gap-2 text-sm text-muted">
                <Clock size={15} />
                {Math.round((itemProgress?.secondsSpent ?? 0) / 60)} min estudados
              </div>
            </button>
          );
        })}
      </div>

      <article className="rounded-[8px] border border-line bg-white p-8 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-brand">{active.type}</p>
            <h2 className="mt-1 text-3xl font-bold text-ink">{active.title}</h2>
          </div>
          <button onClick={markDone} className="h-11 rounded-[8px] bg-teal px-5 font-semibold text-white">
            Marcar como concluído
          </button>
        </div>
        <p className="mt-4 text-lg text-muted">{active.summary}</p>
        <div className="mt-8 space-y-5 text-lg leading-8 text-slate-700">
          {active.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <div className="mt-8 rounded-[8px] bg-slate-50 p-5">
          <div className="font-bold text-ink">Competências relacionadas</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {active.competencies.map((competency) => (
              <span key={competency} className="rounded-[8px] bg-white px-3 py-2 text-sm font-semibold text-muted">
                {competency}
              </span>
            ))}
          </div>
        </div>
      </article>
    </section>
  );
};
