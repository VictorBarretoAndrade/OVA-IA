/*
MELHORIA (OVA nativo) — Quiz embutido na própria página do OVA (espelha o que o
make.js fazia no leitor legado, dentro da seção "Conclusão").

As questões vêm de POST /question/ova (SEM gabarito) e a correção é server-side
em POST /question/answer — mesma garantia anti-fraude do componente Quiz da aba.
*/
import { CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { OvaQuestion, answerQuestion, getOVAQuestions } from "../../services/api";
import { useToast } from "../ui/Toast";

const LETTERS = "abcdefghijklmnopqrstuvwxyz";

interface OvaQuizProps {
  ovaId: number;
  studentId: number;
  onTracked: () => void;
}

export const OvaQuiz = ({ ovaId, studentId, onTracked }: OvaQuizProps) => {
  const [questions, setQuestions] = useState<OvaQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [feedback, setFeedback] = useState<Record<number, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    let active = true;
    getOVAQuestions(ovaId, studentId)
      .then((data) => active && setQuestions(data))
      .catch(() => active && setQuestions([]));
    return () => {
      active = false;
    };
  }, [ovaId, studentId]);

  const verify = async () => {
    setSubmitting(true);
    const next: Record<number, boolean> = {};
    let failed = false;
    for (const question of questions) {
      const selected = answers[question.question_id];
      if (selected === undefined) continue;
      try {
        const graded = await answerQuestion(studentId, question.question_id, LETTERS[selected]);
        next[question.question_id] = graded.is_correct;
      } catch {
        failed = true;
      }
    }
    setFeedback(next);
    setSubmitting(false);
    if (failed) toast.error("Algumas respostas não puderam ser corrigidas. Verifique a conexão.");
    onTracked();
  };

  if (questions.length === 0) {
    return <p className="text-muted">Nenhuma questão cadastrada para este OVA.</p>;
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="space-y-5">
      {questions.map((question, index) => {
        const graded = feedback[question.question_id];
        return (
          <div
            key={question.question_id}
            className={`rounded-[8px] border bg-white p-5 ${
              graded === undefined ? "border-line" : graded ? "border-emerald-300" : "border-rose-300"
            }`}
          >
            <h4 className="font-bold text-ink">
              {index + 1}. {question.statement}
            </h4>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {question.alternatives.map((option, optionIndex) => (
                <label
                  key={option}
                  className={`flex cursor-pointer items-center rounded-[8px] border px-4 py-2.5 text-sm transition ${
                    answers[question.question_id] === optionIndex
                      ? "border-brand bg-indigo-50"
                      : "border-line bg-white hover:border-slate-300"
                  }`}
                >
                  <input
                    className="mr-3"
                    type="radio"
                    name={`q-${question.question_id}`}
                    checked={answers[question.question_id] === optionIndex}
                    onChange={() =>
                      setAnswers((current) => ({ ...current, [question.question_id]: optionIndex }))
                    }
                  />
                  <span className="mr-1.5 font-bold text-muted">{LETTERS[optionIndex]})</span>
                  {option}
                </label>
              ))}
            </div>
            {graded !== undefined && (
              <p
                className={`mt-3 flex items-center gap-2 font-semibold ${
                  graded ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                {graded ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                {graded ? "Correta!" : "Incorreta."}
              </p>
            )}
          </div>
        );
      })}

      <button
        onClick={verify}
        disabled={submitting || answeredCount < questions.length}
        className="h-12 rounded-[8px] bg-coral px-6 font-bold text-white transition disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {submitting ? "Corrigindo no servidor..." : "Verificar respostas"}
      </button>
    </div>
  );
};
