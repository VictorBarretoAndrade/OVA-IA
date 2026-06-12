/*
INTEGRAÇÃO (B5/B9) — O quiz deixou de usar questões fictícias corrigidas no
navegador: as questões vêm de POST /question/ova (SEM o gabarito) e cada
resposta é corrigida pelo SERVIDOR via POST /question/answer, que também
registra a tentativa (alimentando a regra "errou > 50% do quiz" do EduBot).
*/
import { useEffect, useState } from "react";
import {
  OvaQuestion,
  StudentProfile,
  answerQuestion,
  getOVAQuestions,
  getSession
} from "../services/api";

interface QuizProps {
  profile: StudentProfile;
  onTracked: () => void;
}

const LETTERS = "abcdefghijklmnopqrstuvwxyz";

interface QuizResult {
  correct: number;
  wrong: number;
  score: number;
}

export const Quiz = ({ profile, onTracked }: QuizProps) => {
  const [activeOvaId, setActiveOvaId] = useState(profile.ovas[0]?.ova_id ?? 0);
  const [questions, setQuestions] = useState<OvaQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [feedback, setFeedback] = useState<Record<number, boolean>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const session = getSession();

  useEffect(() => {
    if (!activeOvaId || !session) return;
    setAnswers({});
    setFeedback({});
    setResult(null);
    getOVAQuestions(activeOvaId, session.student_id)
      .then(setQuestions)
      .catch(() => setQuestions([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOvaId]);

  const finishQuiz = async () => {
    if (!session) return;
    setSubmitting(true);
    const newFeedback: Record<number, boolean> = {};
    let correct = 0;

    // Cada questão é corrigida pelo backend — o gabarito nunca chega ao navegador
    for (const question of questions) {
      const selectedIndex = answers[question.question_id];
      const selectedLetter = LETTERS[selectedIndex];
      try {
        const graded = await answerQuestion(session.student_id, question.question_id, selectedLetter);
        newFeedback[question.question_id] = graded.is_correct;
        if (graded.is_correct) correct += 1;
      } catch (error) {
        console.error(error);
      }
    }

    setFeedback(newFeedback);
    setResult({
      correct,
      wrong: questions.length - correct,
      score: Number(((correct / Math.max(questions.length, 1)) * 10).toFixed(1))
    });
    setSubmitting(false);
    onTracked();
  };

  return (
    <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div>
        <h1 className="text-3xl font-bold text-ink">Quiz</h1>
        <p className="mt-2 text-muted">Questões corrigidas pelo servidor — cada tentativa alimenta o EduBot.</p>

        <div className="mt-5 flex flex-wrap gap-2">
          {profile.ovas.map((ova) => (
            <button
              key={ova.ova_id}
              onClick={() => setActiveOvaId(ova.ova_id)}
              className={`rounded-[8px] border px-4 py-2 font-semibold transition ${
                activeOvaId === ova.ova_id ? "border-brand bg-indigo-50 text-indigo-800" : "border-line bg-white text-muted"
              }`}
            >
              {ova.ova_name}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-5">
          {questions.map((question, index) => {
            const graded = feedback[question.question_id];
            return (
              <div
                key={question.question_id}
                className={`rounded-[8px] border bg-white p-6 ${
                  graded === undefined ? "border-line" : graded ? "border-emerald-300" : "border-rose-300"
                }`}
              >
                <div className="text-sm font-semibold text-brand">
                  Questão {index + 1}
                  {question.answered && " · já respondida corretamente antes"}
                </div>
                <h2 className="mt-2 text-lg font-bold text-ink">{question.statement}</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {question.alternatives.map((option, optionIndex) => (
                    <label
                      key={option}
                      className={`flex min-h-12 cursor-pointer items-center rounded-[8px] border px-4 py-3 ${
                        answers[question.question_id] === optionIndex ? "border-brand bg-indigo-50" : "border-line bg-white"
                      }`}
                    >
                      <input
                        className="mr-3"
                        type="radio"
                        checked={answers[question.question_id] === optionIndex}
                        onChange={() =>
                          setAnswers((current) => ({ ...current, [question.question_id]: optionIndex }))
                        }
                      />
                      <span className="mr-2 font-bold text-muted">{LETTERS[optionIndex]})</span>
                      {option}
                    </label>
                  ))}
                </div>
                {graded !== undefined && (
                  <p className={`mt-3 font-semibold ${graded ? "text-emerald-700" : "text-rose-700"}`}>
                    {graded ? "Correta!" : "Incorreta."}
                  </p>
                )}
              </div>
            );
          })}
          {questions.length === 0 && (
            <p className="rounded-[8px] border border-line bg-white p-6 text-muted">
              Nenhuma questão cadastrada para este OVA.
            </p>
          )}
        </div>

        {questions.length > 0 && (
          <button
            onClick={finishQuiz}
            disabled={submitting || Object.keys(answers).length < questions.length}
            className="mt-6 h-12 rounded-[8px] bg-coral px-6 font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {submitting ? "Corrigindo no servidor..." : "Finalizar quiz"}
          </button>
        )}
      </div>

      <aside className="h-fit rounded-[8px] border border-line bg-white p-6 shadow-soft">
        <h2 className="text-xl font-bold text-ink">Feedback automático</h2>
        {result ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-[8px] bg-slate-50 p-5">
              <div className="text-sm text-muted">Nota</div>
              <div className="text-4xl font-bold text-ink">{result.score.toFixed(1)}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[8px] bg-emerald-50 p-4 text-emerald-800">
                <div className="text-sm">Acertos</div>
                <div className="text-2xl font-bold">{result.correct}</div>
              </div>
              <div className="rounded-[8px] bg-rose-50 p-4 text-rose-800">
                <div className="text-sm">Erros</div>
                <div className="text-2xl font-bold">{result.wrong}</div>
              </div>
            </div>
            <p className="text-sm text-muted">
              As tentativas foram registradas. Visite o <strong>Tutor IA</strong> para receber uma recomendação
              baseada no seu desempenho.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3 text-muted">
            <p>Finalize o quiz para visualizar nota, acertos e erros.</p>
            <div className="rounded-[8px] bg-slate-50 p-4 text-sm">
              <div className="font-semibold text-ink">Seu histórico</div>
              <p className="mt-1">
                {profile.quiz.tentativas} tentativa(s) ·{" "}
                {profile.quiz.taxa_erro != null
                  ? `${Math.round(profile.quiz.taxa_erro * 100)}% de erro`
                  : "sem registros ainda"}
              </p>
            </div>
          </div>
        )}
      </aside>
    </section>
  );
};
