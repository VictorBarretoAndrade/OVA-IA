import { CheckCircle2 } from "lucide-react";
import { exercises } from "../data/learningData";
import { StudentState } from "../types";
import { recalculateStudent } from "../services/analytics";

interface ExercisesProps {
  state: StudentState;
  onUpdate: (state: StudentState) => void;
}

export const Exercises = ({ state, onUpdate }: ExercisesProps) => {
  const updateAnswer = (exerciseId: string, answer: string) => {
    onUpdate({
      ...state,
      exercicios: {
        ...state.exercicios,
        historico: state.exercicios.historico.map((item) => (item.exerciseId === exerciseId ? { ...item, answer } : item))
      }
    });
  };

  const complete = (exerciseId: string) => {
    onUpdate(
      recalculateStudent({
        ...state,
        exercicios: {
          ...state.exercicios,
          historico: state.exercicios.historico.map((item) =>
            item.exerciseId === exerciseId ? { ...item, completed: true, completedAt: new Date().toISOString() } : item
          )
        }
      })
    );
  };

  return (
    <section>
      <h1 className="text-3xl font-bold text-ink">Exercícios</h1>
      <p className="mt-2 text-muted">Resolva os exercícios e registre sua solução para alimentar os indicadores pedagógicos.</p>
      <div className="mt-6 grid gap-5">
        {exercises.map((exercise) => {
          const progress = state.exercicios.historico.find((item) => item.exerciseId === exercise.id)!;
          return (
            <div key={exercise.id} className="rounded-[8px] border border-line bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-ink">{exercise.title}</h2>
                  <p className="mt-2 text-muted">{exercise.prompt}</p>
                </div>
                {progress.completed && (
                  <span className="flex items-center gap-2 rounded-[8px] bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                    <CheckCircle2 size={17} />
                    Concluído
                  </span>
                )}
              </div>
              <textarea
                value={progress.answer}
                onChange={(event) => updateAnswer(exercise.id, event.target.value)}
                className="mt-5 min-h-28 w-full rounded-[8px] border border-line p-4 outline-none focus:border-brand"
                placeholder="Digite sua solução..."
              />
              <div className="mt-4 rounded-[8px] bg-slate-50 p-4 text-sm text-muted">
                <span className="font-semibold text-ink">Referência esperada:</span> {exercise.expected}
              </div>
              <button onClick={() => complete(exercise.id)} className="mt-4 h-10 rounded-[8px] bg-ink px-4 font-semibold text-white">
                Salvar exercício
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};
