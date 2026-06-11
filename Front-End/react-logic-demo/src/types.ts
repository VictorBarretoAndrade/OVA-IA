export type CompetencyName =
  | "Pensamento Algorítmico"
  | "Resolução de Problemas"
  | "Estruturas Condicionais"
  | "Estruturas de Repetição"
  | "Raciocínio Lógico";

export type CompetencyStatus =
  | "Não iniciada"
  | "Em desenvolvimento"
  | "Parcialmente desenvolvida"
  | "Desenvolvida";

export type ContentType = "Texto" | "Video" | "Podcast";

export interface LearningContent {
  id: string;
  title: string;
  type: ContentType;
  durationMinutes: number;
  summary: string;
  body: string[];
  competencies: CompetencyName[];
}

export interface Exercise {
  id: string;
  title: string;
  prompt: string;
  expected: string;
  competencies: CompetencyName[];
}

export interface QuizQuestion {
  id: string;
  topic: CompetencyName;
  statement: string;
  options: string[];
  answerIndex: number;
}

export interface ContentProgress {
  contentId: string;
  secondsSpent: number;
  completed: boolean;
  lastAccess: string;
}

export interface ExerciseProgress {
  exerciseId: string;
  completed: boolean;
  answer: string;
  completedAt?: string;
}

export interface QuizAttempt {
  id: string;
  score: number;
  correct: number;
  wrong: number;
  topicErrors: CompetencyName[];
  createdAt: string;
}

export interface StudentState {
  aluno: {
    id: string;
    nome: string;
  };
  modulo: {
    nome: string;
    progresso: number;
  };
  engajamento: {
    tempo_total_estudo: number;
    ultimo_acesso: string;
    acessos: string[];
  };
  quizzes: {
    media: number;
    tentativas: number;
    historico: QuizAttempt[];
  };
  exercicios: {
    realizados: number;
    pendentes: number;
    historico: ExerciseProgress[];
  };
  conteudos: ContentProgress[];
  competencias: {
    nome: CompetencyName;
    status: CompetencyStatus;
    score: number;
  }[];
  evolucao: {
    data: string;
    progresso: number;
    nota: number;
    competencias: number;
  }[];
}
