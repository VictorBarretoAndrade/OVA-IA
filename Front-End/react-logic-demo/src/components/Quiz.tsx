import { useMemo, useState } from "react";
import { quizQuestions } from "../data/learningData";
import { CompetencyName, StudentState } from "../types";
import { recalculateStudent } from "../services/analytics";

interface QuizProps {
  state: StudentState;
  onUpdate: (state: StudentState) => void;
}

export const Quiz = ({ state, onUpdate }: QuizProps) => {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const initialResult = state.quizzes.historico[state.quizzes.historico.length - 1];
  const [resultId, setResultId] = useState<string | null>(initialResult?.id ?? null);

  const latestResult = useMemo(() => state.quizzes.historico.find((attempt) => attempt.id === resultId), [resultId, state.quizzes.historico]);

  const finishQuiz = () => {
    const wrongTopics: CompetencyName[] = [];
    let correct = 0;

    quizQuestions.forEach((question) => {
      if (answers[question.id] === question.answerIndex) {
        correct += 1;
      } else {
        wrongTopics.push(question.topic);
      }
    });

    const attempt = {
      id: crypto.randomUUID(),
      score: Number(((correct / quizQuestions.length) * 10).toFixed(1)),
      correct,
      wrong: quizQuestions.length - correct,
      topicErrors: wrongTopics,
      createdAt: new Date().toISOString()
    };

    const next = recalculateStudent({
      ...state,
      quizzes: {
        ...state.quizzes,
        historico: [...state.quizzes.historico, attempt]
      }
    });
    onUpdate(next);
    setResultId(attempt.id);
  };

  return (
    <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div>
        <h1 className="text-3xl font-bold text-ink">Quiz de Lógica de Programação</h1>
        <p className="mt-2 text-muted">10 questões de múltipla escolha com feedback por tópico.</p>
        <div className="mt-6 space-y-5">
          {quizQuestions.map((question, index) => (
            <div key={question.id} className="rounded-[8px] border border-line bg-white p-6">
              <div className="text-sm font-semibold text-brand">Questão {index + 1} · {question.topic}</div>
              <h2 className="mt-2 text-lg font-bold text-ink">{question.statement}</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {question.options.map((option, optionIndex) => (
                  <label
                    key={option}
                    className={`flex min-h-12 cursor-pointer items-center rounded-[8px] border px-4 py-3 ${
                      answers[question.id] === optionIndex ? "border-brand bg-indigo-50" : "border-line bg-white"
                    }`}
                  >
                    <input
                      className="mr-3"
                      type="radio"
                      checked={answers[question.id] === optionIndex}
                      onChange={() => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={finishQuiz}
          disabled={Object.keys(answers).length < quizQuestions.length}
          className="mt-6 h-12 rounded-[8px] bg-coral px-6 font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Finalizar quiz
        </button>
      </div>

      <aside className="h-fit rounded-[8px] border border-line bg-white p-6 shadow-soft">
        <h2 className="text-xl font-bold text-ink">Feedback automático</h2>
        {latestResult ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-[8px] bg-slate-50 p-5">
              <div className="text-sm text-muted">Nota</div>
              <div className="text-4xl font-bold text-ink">{latestResult.score.toFixed(1)}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[8px] bg-emerald-50 p-4 text-emerald-800">
                <div className="text-sm">Acertos</div>
                <div className="text-2xl font-bold">{latestResult.correct}</div>
              </div>
              <div className="rounded-[8px] bg-rose-50 p-4 text-rose-800">
                <div className="text-sm">Erros</div>
                <div className="text-2xl font-bold">{latestResult.wrong}</div>
              </div>
            </div>
            <div>
              <div className="font-semibold text-ink">Tópicos com maior dificuldade</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {Array.from(new Set(latestResult.topicErrors)).length ? (
                  Array.from(new Set(latestResult.topicErrors)).map((topic) => (
                    <span key={topic} className="rounded-[8px] bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800">
                      {topic}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-muted">Nenhum tópico crítico no último quiz.</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-muted">Finalize o quiz para visualizar nota, acertos, erros e tópicos prioritários.</p>
        )}
      </aside>
    </section>
  );
};
