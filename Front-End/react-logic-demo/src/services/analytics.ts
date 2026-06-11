import { contents, exercises, quizQuestions } from "../data/learningData";
import { CompetencyName, CompetencyStatus, StudentState } from "../types";

const allCompetencies: CompetencyName[] = [
  "Pensamento Algorítmico",
  "Resolução de Problemas",
  "Estruturas Condicionais",
  "Estruturas de Repetição",
  "Raciocínio Lógico"
];

const statusFromScore = (score: number): CompetencyStatus => {
  if (score >= 80) return "Desenvolvida";
  if (score >= 55) return "Parcialmente desenvolvida";
  if (score > 0) return "Em desenvolvimento";
  return "Não iniciada";
};

export const recalculateStudent = (state: StudentState): StudentState => {
  const completedContents = state.conteudos.filter((item) => item.completed).length;
  const completedExercises = state.exercicios.historico.filter((item) => item.completed).length;
  const quizAverage = state.quizzes.historico.length
    ? Number((state.quizzes.historico.reduce((sum, attempt) => sum + attempt.score, 0) / state.quizzes.historico.length).toFixed(1))
    : 0;

  const progress = Math.round(
    ((completedContents / contents.length) * 0.4 +
      (completedExercises / exercises.length) * 0.3 +
      (state.quizzes.historico.length ? Math.min(quizAverage / 10, 1) : 0) * 0.3) *
      100
  );

  const contentTime = state.conteudos.reduce((sum, item) => sum + item.secondsSpent, 0);
  const scores = allCompetencies.map((competency) => {
    const contentMatches = contents.filter((content) => content.competencies.includes(competency));
    const completedContentMatches = contentMatches.filter((content) =>
      state.conteudos.find((item) => item.contentId === content.id && item.completed)
    );
    const exerciseMatches = exercises.filter((exercise) => exercise.competencies.includes(competency));
    const completedExerciseMatches = exerciseMatches.filter((exercise) =>
      state.exercicios.historico.find((item) => item.exerciseId === exercise.id && item.completed)
    );
    const quizMatches = quizQuestions.filter((question) => question.topic === competency);
    const lastQuiz = state.quizzes.historico[state.quizzes.historico.length - 1];
    const quizPenalty = lastQuiz ? lastQuiz.topicErrors.filter((topic) => topic === competency).length : quizMatches.length;
    const quizScore = lastQuiz ? Math.max(0, ((quizMatches.length - quizPenalty) / Math.max(quizMatches.length, 1)) * 100) : 0;

    const score = Math.round(
      (completedContentMatches.length / Math.max(contentMatches.length, 1)) * 35 +
        (completedExerciseMatches.length / Math.max(exerciseMatches.length, 1)) * 30 +
        (quizScore / 100) * 35
    );

    return {
      nome: competency,
      score,
      status: statusFromScore(score)
    };
  });

  const today = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(new Date());
  const previousEvolution = state.evolucao.filter((entry) => entry.data !== today);

  return {
    ...state,
    modulo: {
      ...state.modulo,
      progresso: progress
    },
    engajamento: {
      ...state.engajamento,
      tempo_total_estudo: Math.round(contentTime / 60),
      ultimo_acesso: new Date().toISOString()
    },
    quizzes: {
      ...state.quizzes,
      media: quizAverage,
      tentativas: state.quizzes.historico.length
    },
    exercicios: {
      realizados: completedExercises,
      pendentes: exercises.length - completedExercises,
      historico: state.exercicios.historico
    },
    competencias: scores,
    evolucao: [
      ...previousEvolution.slice(-6),
      {
        data: today,
        progresso: progress,
        nota: quizAverage,
        competencias: Math.round(scores.reduce((sum, item) => sum + item.score, 0) / scores.length)
      }
    ]
  };
};

export const toExpectedJson = (state: StudentState) => ({
  aluno: state.aluno,
  modulo: state.modulo,
  engajamento: {
    tempo_total_estudo: state.engajamento.tempo_total_estudo,
    ultimo_acesso: state.engajamento.ultimo_acesso
  },
  quizzes: {
    media: state.quizzes.media,
    tentativas: state.quizzes.tentativas
  },
  exercicios: {
    realizados: state.exercicios.realizados,
    pendentes: state.exercicios.pendentes
  },
  competencias: state.competencias.map(({ nome, status }) => ({ nome, status }))
});
