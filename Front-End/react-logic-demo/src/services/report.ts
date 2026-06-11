import { contents } from "../data/learningData";
import { CompetencyStatus, StudentState } from "../types";

const engagementLevel = (state: StudentState) => {
  const lastAccess = new Date(state.engajamento.ultimo_acesso).getTime();
  const daysWithoutAccess = Math.max(0, Math.floor((Date.now() - lastAccess) / 86400000));
  if (daysWithoutAccess <= 2 && state.modulo.progresso >= 70) return "Alto";
  if (daysWithoutAccess <= 5 && state.modulo.progresso >= 40) return "Médio";
  return "Baixo";
};

const attentionLevel = (state: StudentState) => {
  const lastAccess = new Date(state.engajamento.ultimo_acesso).getTime();
  const daysWithoutAccess = Math.max(0, Math.floor((Date.now() - lastAccess) / 86400000));
  if (daysWithoutAccess >= 14 || (state.modulo.progresso < 30 && state.quizzes.media < 5)) return "Urgente";
  if (daysWithoutAccess >= 7 || state.quizzes.media < 5 || state.exercicios.pendentes > 2) return "Atenção";
  return "Normal";
};

const difficultyTopics = (state: StudentState) => {
  const lastAttempt = state.quizzes.historico[state.quizzes.historico.length - 1];
  return Array.from(new Set(lastAttempt?.topicErrors ?? []));
};

const translateStatus = (status: CompetencyStatus) => {
  if (status === "Desenvolvida") return "já aparece consolidada, com evidências consistentes de prática e desempenho.";
  if (status === "Parcialmente desenvolvida") return "está avançando bem, mas ainda precisa de mais prática para ganhar estabilidade.";
  if (status === "Em desenvolvimento") return "começou a ser construída, embora ainda dependa de exercícios guiados e revisão.";
  return "ainda não tem evidências suficientes de aprendizagem registrada na plataforma.";
};

export const generatePedagogicalReport = (state: StudentState) => {
  const date = new Intl.DateTimeFormat("pt-BR").format(new Date());
  const engagement = engagementLevel(state);
  const attention = attentionLevel(state);
  const topics = difficultyTopics(state);
  const pendingContents = contents
    .filter((content) => !state.conteudos.find((progress) => progress.contentId === content.id && progress.completed))
    .map((content) => content.title);
  const strongCompetencies = state.competencias.filter((item) => item.status === "Desenvolvida").map((item) => item.nome);
  const weakCompetencies = state.competencias.filter((item) => item.status !== "Desenvolvida").map((item) => item.nome);
  const risk = attention === "Urgente" ? "alto" : attention === "Atenção" ? "moderado" : "baixo";

  return `RELATÓRIO PEDAGÓGICO — ${state.aluno.nome.toUpperCase()}
Módulo: ${state.modulo.nome} | Data: ${date}
Engajamento: ${engagement} | Nível de atenção: ${attention}

VISÃO GERAL

${state.aluno.nome} está com ${state.modulo.progresso}% de progresso no módulo e acumulou ${state.engajamento.tempo_total_estudo} minutos de estudo registrados. A média atual dos quizzes é ${state.quizzes.media.toFixed(1)}, com ${state.quizzes.tentativas} tentativa(s), e ${state.exercicios.realizados} de 5 exercícios já foram concluídos. O risco de evasão neste momento é ${risk}, principalmente pela combinação entre progresso, pendências e desempenho avaliativo. ${topics.length ? `Os tópicos que mais exigem atenção são ${topics.join(", ")}.` : "Até o momento, não há um padrão crítico de erro nos tópicos avaliados."} ${pendingContents.length ? `Ainda falta concluir: ${pendingContents.join(", ")}.` : "Todos os conteúdos teóricos foram concluídos."}

DIAGNÓSTICO DE APRENDIZAGEM

O consumo de recursos indica um percurso ${engagement.toLowerCase()} de engajamento. O aluno já passou por parte dos materiais centrais, mas o percentual de ${state.modulo.progresso}% mostra que a aprendizagem ainda depende de continuidade, especialmente nos conteúdos que conectam teoria e prática. Na prática, isso significa que o estudante teve contato com fundamentos importantes, mas ainda precisa transformar esse contato em resolução autônoma de problemas.

O desempenho nas avaliações sugere ${state.quizzes.media >= 8 ? "boa consolidação dos conceitos cobrados" : state.quizzes.media >= 5 ? "compreensão parcial, com lacunas específicas que podem ser corrigidas por revisão direcionada" : "fragilidade nos conceitos avaliados e necessidade de retomada guiada"}. ${topics.length ? `As dificuldades em ${topics.join(", ")} importam porque esses conceitos sustentam a leitura de algoritmos, a escolha de caminhos lógicos e a construção de soluções repetíveis.` : "Como não há erros frequentes destacados no último quiz, o próximo passo é manter a prática para confirmar estabilidade."}

${strongCompetencies.length ? `Como ponto positivo, ${state.aluno.nome} demonstra avanço em ${strongCompetencies.join(", ")}. Essas competências podem servir como base para desafios um pouco mais abertos e exercícios de aplicação.` : `O principal ponto positivo é que já existe registro de estudo e interação, o que permite ao professor orientar a retomada com dados concretos em vez de trabalhar apenas por percepção.`}

SITUAÇÃO DAS COMPETÊNCIAS

${state.competencias.map((item) => `${item.nome}: ${translateStatus(item.status)}`).join("\n")}

ORIENTAÇÕES PARA O PROFESSOR

Nas próximas 24 a 48 horas, recomenda-se orientar ${state.aluno.nome} a concluir um ciclo curto: revisar o conteúdo de ${topics[0] ?? pendingContents[0] ?? "algoritmos"} e resolver um exercício relacionado. O contato deve ser objetivo e encorajador, deixando claro que a meta é destravar o próximo passo, não recuperar todo o módulo de uma vez.

Nas próximas semanas, acompanhe a evolução por tentativas de quiz, conclusão dos exercícios e mudança de status das competências. Se ${weakCompetencies.slice(0, 2).join(" e ") || "as competências pendentes"} permanecer(em) sem evolução, vale propor uma intervenção com exemplos resolvidos e prática guiada antes de liberar novos desafios.

PRÓXIMOS PASSOS PARA O ALUNO

O primeiro passo recomendado é concluir o conteúdo pendente mais próximo da trilha atual, para fechar a base conceitual. Em seguida, o aluno deve resolver o exercício associado a esse tema, registrando a resposta na plataforma para consolidar a prática. Depois, deve refazer o quiz e observar se a nota melhora nos tópicos que apresentaram dificuldade. Por fim, se alcançar nota igual ou superior a 8, pode avançar para um problema lógico mais aberto envolvendo decisão e repetição.

MENSAGEM PARA ENVIAR AO ALUNO

Oi, ${state.aluno.nome}! Vi que você já avançou em Lógica de Programação e tem um bom ponto de partida para continuar. O próximo passo mais importante é revisar ${topics[0] ?? pendingContents[0] ?? "o conteúdo principal"} e resolver um exercício curto logo depois. Não precisa fazer tudo de uma vez: completar esse pequeno ciclo já vai ajudar bastante. Estou acompanhando sua evolução e posso te orientar no que travar.`;
};
