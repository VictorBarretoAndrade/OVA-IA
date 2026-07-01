/*
MELHORIA (i18n de CONTEÚDO) — tradução dos textos que vêm do banco.

O alternador PT/EN traduz a INTERFACE. Mas competências, nomes de OVA, títulos de
recursos e atividades vêm do banco em português. Aqui mapeamos esses textos fixos
(seed) para o inglês, para que as seções de Competências, Conteúdos e Atividades
apareçam perfeitamente traduzidas quando o idioma for EN. Texto não mapeado cai
no original (PT) — degradação segura.
*/
import { Lang, useLanguage } from "../i18n";

// PT -> EN para o conteúdo semeado (competências, OVAs, recursos, atividades).
const CONTENT_EN: Record<string, string> = {
  // --- OVAs / disciplinas ---
  "Computação Quântica": "Quantum Computing",
  "Cálculo": "Calculus",
  "Cálculo 2": "Calculus 2",
  "Fundamentos de Computação na Nuvem": "Cloud Computing Fundamentals",

  // --- Competências ---
  "Compreender os princípios fundamentais da computação quântica":
    "Understand the fundamental principles of quantum computing",
  "Analisar as aplicações da computação quântica":
    "Analyze the applications of quantum computing",
  "Reconhecer os desafios e limitações técnicos da computação quântica":
    "Recognize the technical challenges and limitations of quantum computing",
  "Calcular derivadas e integrais de funções polinomiais e trigonométricas":
    "Compute derivatives and integrals of polynomial and trigonometric functions",
  "Aplicar os conceitos de limites em funções simples, incluindo a identificação de comportamentos em infinitos":
    "Apply limit concepts to simple functions, including identifying behavior at infinity",
  "Identificar pontos de máximo e mínimo em funções, utilizando o cálculo diferencial para a análise de curvas":
    "Identify maximum and minimum points of functions using differential calculus for curve analysis",
  "Compreender os modelos de serviço da computação em nuvem (IaaS, PaaS, SaaS)":
    "Understand cloud computing service models (IaaS, PaaS, SaaS)",
  "Distinguir os modelos de implantação: nuvem pública, privada e híbrida":
    "Distinguish deployment models: public, private and hybrid cloud",
  "Reconhecer benefícios econômicos e desafios de segurança da nuvem":
    "Recognize the economic benefits and security challenges of the cloud",

  // --- Recursos: Computação Quântica ---
  "Leitura: A Jornada Quântica": "Reading: The Quantum Journey",
  "Vídeo: Introdução à Computação Quântica": "Video: Introduction to Quantum Computing",
  "Vídeo: Qubits e Superposição": "Video: Qubits and Superposition",
  "Podcast: Conversas Quânticas (ep. 1)": "Podcast: Quantum Talks (ep. 1)",
  "Quiz: Computação Quântica": "Quiz: Quantum Computing",
  "Atividade prática: simule um qubit no IBM Quantum Composer":
    "Practical activity: simulate a qubit in the IBM Quantum Composer",
  "Reforço: Princípios da Computação Quântica em 10 min": "Reinforcement: Quantum Computing principles in 10 min",
  "Reforço (texto): O que é computação quântica?": "Reinforcement (text): What is quantum computing?",
  "Reforço: Aplicações reais da Computação Quântica": "Reinforcement: Real applications of Quantum Computing",
  "Reforço (texto): Casos de uso da computação quântica": "Reinforcement (text): Quantum computing use cases",
  "Reforço: Por que é difícil construir um computador quântico": "Reinforcement: Why building a quantum computer is hard",
  "Reforço (texto): Decoerência e correção de erros": "Reinforcement (text): Decoherence and error correction",

  // --- Recursos: Cálculo ---
  "Leitura: Limites e Derivadas": "Reading: Limits and Derivatives",
  "Vídeo: A essência do Cálculo": "Video: The essence of Calculus",
  "Podcast: Cálculo no dia a dia (ep. 1)": "Podcast: Calculus in everyday life (ep. 1)",
  "Quiz: Cálculo": "Quiz: Calculus",
  "Atividade prática: resolva a lista de limites e envie ao professor":
    "Practical activity: solve the limits worksheet and submit to the teacher",
  "Reforço: Derivadas do zero (3Blue1Brown)": "Reinforcement: Derivatives from scratch (3Blue1Brown)",
  "Reforço (texto): Regras de derivação": "Reinforcement (text): Differentiation rules",
  "Reforço: Entendendo limites de forma intuitiva": "Reinforcement: Understanding limits intuitively",
  "Reforço (texto): Limites e continuidade": "Reinforcement (text): Limits and continuity",

  // --- Recursos: Cálculo 2 ---
  "Leitura: Integrais e Aplicações": "Reading: Integrals and Applications",
  "Vídeo: Integração — ideia central": "Video: Integration — the core idea",
  "Podcast: Histórias do Cálculo (ep. 2)": "Podcast: Calculus Stories (ep. 2)",
  "Quiz: Cálculo 2": "Quiz: Calculus 2",
  "Atividade prática: modele um problema de otimização": "Practical activity: model an optimization problem",
  "Reforço: Máximos e mínimos com derivadas": "Reinforcement: Maxima and minima with derivatives",
  "Reforço (texto): Otimização e pontos críticos": "Reinforcement (text): Optimization and critical points",

  // --- Recursos: Computação na Nuvem ---
  "Leitura: O que é Computação na Nuvem": "Reading: What is Cloud Computing",
  "Vídeo: Computação em nuvem explicada": "Video: Cloud computing explained",
  "Podcast: Nuvem na prática (ep. 1)": "Podcast: Cloud in practice (ep. 1)",
  "Quiz: Computação na Nuvem": "Quiz: Cloud Computing",
  "Atividade prática: suba uma VM gratuita na AWS/Azure": "Practical activity: spin up a free VM on AWS/Azure",
  "Reforço: IaaS, PaaS e SaaS em 5 minutos": "Reinforcement: IaaS, PaaS and SaaS in 5 minutes",
  "Reforço: Nuvem pública, privada e híbrida": "Reinforcement: Public, private and hybrid cloud",
  "Reforço: Segurança e responsabilidade compartilhada": "Reinforcement: Security and shared responsibility",
  "Reforço (texto): O que é computação em nuvem (AWS)": "Reinforcement (text): What is cloud computing (AWS)",
  "Reforço (texto): Microsoft Azure (portal)": "Reinforcement (text): Microsoft Azure (portal)",
  "Reforço (texto): Dicionário — o que é computação em nuvem (Azure)":
    "Reinforcement (text): Dictionary — what is cloud computing (Azure)"
};

export function translateContent(pt: string | null | undefined, lang: Lang): string {
  const text = pt ?? "";
  if (lang !== "en") return text;
  return CONTENT_EN[text] ?? text;
}

// Hook: devolve ct(pt) traduzindo o conteúdo do banco no idioma atual.
export function useContentT() {
  const { lang } = useLanguage();
  return (pt: string | null | undefined) => translateContent(pt, lang);
}
