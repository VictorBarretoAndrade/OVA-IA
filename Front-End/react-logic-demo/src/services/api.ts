/*
INTEGRAÇÃO (EduBot Track) — cliente da API Flask.

Este módulo liga o frontend React (feito no Lovable) ao backend real:
  - POST /login               -> token de sessão (4.2)
  - GET  /student/me          -> perfil completo do aluno (4.2)
  - GET  /ova/<id>/resources  -> recursos do OVA com progresso (4.1)
  - POST /progress/resource   -> consumo de vídeo/podcast/atividade (4.1)
  - POST /question/ova        -> questões do quiz (sem gabarito — B9)
  - POST /question/answer     -> correção server-side (B5)
  - GET  /edubot/recommendation -> agente EduBot (4.3)

Convenções herdadas da API: o corpo das requisições é um array com um único
objeto ([data]) e o token vai no header Authorization: Bearer.
*/

import { API_BASE_URL as BASE_URL } from "./config";

// Mesma chave usada pelo frontend clássico (files/js/request.js): como o app
// React é servido pela MESMA origem do Apache (http://localhost:8010/app/),
// o localStorage é compartilhado e a sessão vale nos dois frontends.
const TOKEN_KEY = "token";
const SESSION_KEY = "edubot.session";

export interface Session {
  student_id: number;
  course_id: number;
  is_admin: boolean;
}

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const getSession = (): Session | null => {
  const raw = localStorage.getItem(SESSION_KEY);
  try {
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(SESSION_KEY);
  // chaves do frontend clássico (login.html/iframe.html)
  localStorage.removeItem("logged");
  localStorage.removeItem("is_admin");
  localStorage.removeItem("course_id");
  localStorage.removeItem("student_id");
};

async function request<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(BASE_URL + path, {
    method: options.method ?? "GET",
    headers,
    // A API espera o payload embrulhado em um array (convenção do projeto)
    body: options.body !== undefined ? JSON.stringify([options.body]) : undefined
  });

  if (response.status === 401) {
    clearSession();
    throw new ApiError(401, "Sessão expirada — faça login novamente.");
  }
  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(response.status, text || `Erro ${response.status}`);
  }
  return (await response.json()) as T;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// ---------------------------------------------------------------------------
// Tipos espelhando as respostas do backend
// ---------------------------------------------------------------------------

export interface ResourceState {
  resource_id: number;
  titulo: string;
  tipo: "texto" | "video" | "podcast" | "quiz" | "atividade";
  url: string | null;
  media_type: string | null;
  perc_consumido: number;
  segundos_consumidos: number;
  consumido: boolean;
  concluido: boolean;
}

export interface OvaState {
  ova_id: number;
  ova_name: string;
  link: string;
  read_time: number;
  perc_scrolled: number;
  completed: boolean;
  recursos: ResourceState[];
}

export interface CompetencyState {
  competency_id: number;
  nome: string;
  acertos: number;
  total_questoes: number;
  status: "não iniciada" | "em desenvolvimento" | "desenvolvida";
}

export interface InterventionState {
  data: string;
  tipo: string;
  descricao: string | null;
  resultado: string | null;
}

export interface StudentProfile {
  estudante: { student_id: number; nome: string; ra: string; curso: string | null; role: string };
  dias_sem_acesso: number | null;
  recursos: {
    total: number;
    consumidos: number;
    percentual_consumido: number;
    por_tipo: Record<string, { total: number; consumidos: number; concluidos: number }>;
  };
  preferencia_formato: string | null;
  quiz: { tentativas: number; erros: number; taxa_erro: number | null };
  atividades_pendentes: number;
  ovas: OvaState[];
  competencias: CompetencyState[];
  historico_intervencoes: InterventionState[];
}

export interface Recommendation {
  tipo: string;
  prioridade: "alta" | "media" | "baixa";
  titulo: string;
  mensagem_aluno: string;
  acoes: string[];
  formato_preferido: string | null;
  justificativa: string;
  model_id: string;
  mock: boolean;
}

export interface OvaQuestion {
  question_id: number;
  statement: string;
  alternatives: string[];
  answered: boolean;
  competency_id: number;
}

export interface OvaResource {
  resource_id: number;
  resource_type: ResourceState["tipo"];
  resource_title: string;
  resource_url: string | null;
  media_type: string | null;
  duration_seconds: number | null;
  perc_consumed: number;
  seconds_consumed: number;
  completed: boolean;
}

// ---------------------------------------------------------------------------
// Chamadas
// ---------------------------------------------------------------------------

export async function login(ra: string, password: string): Promise<Session> {
  const data = await request<{ ids: { student_id: number; course_id: number }; is_admin: boolean; token: string }>(
    "/login",
    { method: "POST", body: { ra, password } }
  );
  const session: Session = {
    student_id: data.ids.student_id,
    course_id: data.ids.course_id,
    is_admin: data.is_admin
  };
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  // Compatibilidade com o frontend clássico: permite abrir o leitor de OVAs
  // (iframe.html) já autenticado, pois ambos vivem na mesma origem (Apache)
  localStorage.setItem("logged", "true");
  localStorage.setItem("is_admin", JSON.stringify(data.is_admin));
  localStorage.setItem("course_id", String(data.ids.course_id));
  localStorage.setItem("student_id", String(data.ids.student_id));
  return session;
}

export const getMe = () => request<StudentProfile>("/student/me");

export const getEdubotRecommendation = () =>
  request<{ recommendation: Recommendation }>("/edubot/recommendation");

// ---------------------------------------------------------------------------
// MELHORIA (OVA personalizada): agente de tool-use que monta a OVA de reforço
// ---------------------------------------------------------------------------

export interface PersonalizedOVASummary {
  personalized_ova_id: number;
  titulo: string;
  status: string;
  created_at: string;
  competencia: string | null;
}

export interface PersonalizedOVAContent {
  personalized_ova_id: number;
  titulo: string;
  mensagem_aluno: string | null;
  justificativa: string | null;
  status: string;
  created_at: string;
  competencia: { competency_id: number; nome: string } | null;
  recursos: OvaResource[];
  questoes: OvaQuestion[];
}

export interface CreatedPersonalizedOVA {
  personalized_ova_id: number;
  titulo: string;
  mensagem_aluno: string;
  justificativa: string;
  target_competency_id: number | null;
  itens_recursos: number;
  itens_questoes: number;
  mock: boolean;
  model_id: string;
}

// Dispara o agente: diagnostica o assunto fraco, seleciona conteúdo e persiste
export const createPersonalizedOVA = () =>
  request<CreatedPersonalizedOVA>("/edubot/personalized-ova", { method: "POST" });

// Materiais externos (artigos científicos) recomendados por competência
export interface ExternalResource {
  titulo: string;
  url: string | null;
  fonte: string;
  ano: number | null;
}

export const getExternalResources = (competencyId: number) =>
  request<{ competency_id: number; competencia: string; resultados: ExternalResource[] }>(
    `/edubot/external-resources?competency_id=${competencyId}`
  );

export const listPersonalizedOVAs = () =>
  request<PersonalizedOVASummary[]>("/personalized-ova");

export const getPersonalizedOVA = (id: number) =>
  request<PersonalizedOVAContent>(`/personalized-ova/${id}`);

export const getOVAResources = (ovaId: number) => request<OvaResource[]>(`/ova/${ovaId}/resources`);

export const saveResourceProgress = (data: {
  resource_id: number;
  perc_consumed?: number;
  seconds_consumed?: number;
  completed?: boolean;
}) => request<string>("/progress/resource", { method: "POST", body: data });

export const saveOVAProgress = (data: {
  ova_id: number;
  read_time?: number;
  perc_scrolled?: number;
  completed?: boolean;
}) => request<string>("/progress/ova", { method: "POST", body: data });

export const getOVAQuestions = (ovaId: number, studentId: number) =>
  request<OvaQuestion[]>("/question/ova", { method: "POST", body: { ova_id: ovaId, student_id: studentId } });

export const answerQuestion = (studentId: number, questionId: number, selected: string) =>
  request<{ is_correct: boolean }>("/question/answer", {
    method: "POST",
    body: { student_id: studentId, question_id: questionId, selected }
  });

export const registerInteraction = (studentId: number, ovaId: number, action: string) =>
  request<string>("/interaction/register", {
    method: "POST",
    body: { student_id: studentId, ova_id: ovaId, action }
  });

// ---------------------------------------------------------------------------
// Painel do Tutor (Cena 4) — visão de turma + central de alertas
// ---------------------------------------------------------------------------
export interface TurmaStudent {
  student_id: number;
  nome: string;
  ra: string;
  dias_sem_acesso: number | null;
  consumo_percentual: number;
  taxa_erro: number | null;
  alertas_abertos: number;
}

export interface TutorAlert {
  alert_id: number;
  student_id: number;
  aluno: string;
  type: string;
  message: string;
  severity: string;
  created_at: string;
  read: boolean;
}

export const getTurma = () => request<{ total: number; alunos: TurmaStudent[] }>("/tutor/turma");
export const getTutorAlerts = () => request<{ alertas: TutorAlert[] }>("/tutor/alerts");
export const evaluateTurma = () =>
  request<{ alertas_criados: number }>("/tutor/evaluate", { method: "POST" });

// ---------------------------------------------------------------------------
// Tutor IA por OVA — chat de tutoria restrito ao conteúdo do OVA consumido
// ---------------------------------------------------------------------------
export interface TutorMessage {
  role: "user" | "assistant";
  content: string;
}

export interface TutorSource {
  secao: string;
  trecho: string;
}

export interface TutorReply {
  reply: string;
  ova_id: number;
  ova_name: string;
  model_id: string;
  mock: boolean;
  sources: TutorSource[];
}

// Envia a pergunta + o histórico + o material (context) do OVA. O backend
// responde como tutor preso ao conteúdo (ver edubot_agent/tutor.py).
export const tutorChat = (ovaId: number, context: string, messages: TutorMessage[]) =>
  request<TutorReply>("/edubot/tutor-chat", {
    method: "POST",
    body: { ova_id: ovaId, context, messages }
  });
