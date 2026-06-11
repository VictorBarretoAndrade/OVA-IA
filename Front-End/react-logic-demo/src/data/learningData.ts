import { LearningContent, Exercise, QuizQuestion, StudentState } from "../types";

export const contents: LearningContent[] = [
  {
    id: "algoritmos",
    title: "Algoritmos",
    type: "Texto",
    durationMinutes: 12,
    summary: "Introdução ao conceito de sequência finita de passos para resolver problemas.",
    competencies: ["Pensamento Algorítmico", "Raciocínio Lógico"],
    body: [
      "Um algoritmo é uma sequência organizada de instruções que transforma uma entrada em uma saída desejada. Antes de pensar em linguagem de programação, o aluno aprende a decompor um problema, ordenar decisões e testar se o caminho proposto realmente resolve a situação.",
      "Na prática, algoritmos aparecem em receitas, rotas, checklists e procedimentos. Em programação, eles ajudam a reduzir ambiguidades: cada passo precisa ser claro, executável e verificável."
    ]
  },
  {
    id: "variaveis",
    title: "Variáveis",
    type: "Texto",
    durationMinutes: 10,
    summary: "Como armazenar informações e reutilizá-las durante a execução de um algoritmo.",
    competencies: ["Pensamento Algorítmico", "Resolução de Problemas"],
    body: [
      "Variáveis são espaços nomeados para guardar valores. Elas permitem que um algoritmo lembre dados como idade, nota, preço ou resultado de um cálculo.",
      "Ao declarar uma variável, o aluno deve escolher nomes claros e tipos compatíveis com o uso esperado. Essa escolha melhora a leitura do algoritmo e reduz erros de interpretação."
    ]
  },
  {
    id: "condicionais",
    title: "Estruturas condicionais",
    type: "Video",
    durationMinutes: 14,
    summary: "Uso de IF/ELSE para tomar decisões com base em condições.",
    competencies: ["Estruturas Condicionais", "Raciocínio Lógico"],
    body: [
      "Estruturas condicionais permitem que o algoritmo siga caminhos diferentes. Quando uma condição é verdadeira, um bloco é executado; quando é falsa, outro caminho pode ser escolhido.",
      "Esse conceito é essencial para regras como aprovar ou reprovar, aplicar desconto, validar acesso e classificar dados."
    ]
  },
  {
    id: "repeticao",
    title: "Estruturas de repetição",
    type: "Podcast",
    durationMinutes: 11,
    summary: "Como repetir passos com FOR e WHILE sem duplicar instruções.",
    competencies: ["Estruturas de Repetição", "Resolução de Problemas"],
    body: [
      "Laços de repetição executam um conjunto de comandos várias vezes. O FOR é indicado quando a quantidade de repetições é conhecida; o WHILE funciona bem quando a repetição depende de uma condição.",
      "Repetições tornam algoritmos mais compactos e ajudam a resolver problemas como somatórios, contagens, buscas e validações sucessivas."
    ]
  }
];

export const exercises: Exercise[] = [
  {
    id: "ex-variaveis",
    title: "Declarar variáveis",
    prompt: "Crie três variáveis para armazenar nome, idade e média final de um aluno.",
    expected: "Exemplo: nome = 'João'; idade = 18; mediaFinal = 8.5.",
    competencies: ["Pensamento Algorítmico"]
  },
  {
    id: "ex-algoritmo",
    title: "Algoritmo simples",
    prompt: "Descreva um algoritmo para calcular a média de duas notas.",
    expected: "Ler nota1 e nota2, somar os valores, dividir por 2 e exibir o resultado.",
    competencies: ["Pensamento Algorítmico", "Resolução de Problemas"]
  },
  {
    id: "ex-ifelse",
    title: "Utilizar IF/ELSE",
    prompt: "Escreva a lógica para exibir 'Aprovado' quando a média for maior ou igual a 7, caso contrário 'Revisar conteúdo'.",
    expected: "Se media >= 7, mostrar Aprovado; senão, mostrar Revisar conteúdo.",
    competencies: ["Estruturas Condicionais"]
  },
  {
    id: "ex-for",
    title: "Utilizar FOR",
    prompt: "Crie um laço que mostre os números de 1 a 5.",
    expected: "Para i de 1 até 5, exibir i.",
    competencies: ["Estruturas de Repetição"]
  },
  {
    id: "ex-logico",
    title: "Problema lógico",
    prompt: "Um aluno pode fazer prova substitutiva se faltou à prova e apresentou justificativa. Monte a condição lógica.",
    expected: "podeFazerSubstitutiva = faltouProva && apresentouJustificativa.",
    competencies: ["Raciocínio Lógico", "Estruturas Condicionais"]
  }
];

export const quizQuestions: QuizQuestion[] = [
  {
    id: "q1",
    topic: "Pensamento Algorítmico",
    statement: "O que melhor define um algoritmo?",
    options: ["Um erro de código", "Uma sequência finita de passos", "Um tipo de computador", "Uma linguagem específica"],
    answerIndex: 1
  },
  {
    id: "q2",
    topic: "Pensamento Algorítmico",
    statement: "Qual característica torna um passo de algoritmo adequado?",
    options: ["Ser ambíguo", "Ser executável e claro", "Ser decorativo", "Ser sempre escrito em inglês"],
    answerIndex: 1
  },
  {
    id: "q3",
    topic: "Resolução de Problemas",
    statement: "Para calcular a média de duas notas, qual operação é essencial?",
    options: ["Multiplicar por 10", "Somar e dividir por 2", "Subtrair a menor nota", "Ordenar alfabeticamente"],
    answerIndex: 1
  },
  {
    id: "q4",
    topic: "Resolução de Problemas",
    statement: "Por que decompor um problema ajuda na programação?",
    options: ["Elimina a necessidade de testes", "Divide a solução em partes menores", "Impede o uso de variáveis", "Torna o código invisível"],
    answerIndex: 1
  },
  {
    id: "q5",
    topic: "Estruturas Condicionais",
    statement: "Qual estrutura é usada para escolher entre dois caminhos?",
    options: ["IF/ELSE", "PRINT", "INPUT", "COMMENT"],
    answerIndex: 0
  },
  {
    id: "q6",
    topic: "Estruturas Condicionais",
    statement: "Em 'se média >= 7', a expressão média >= 7 é uma:",
    options: ["Variável de texto", "Condição lógica", "Biblioteca", "Repetição infinita"],
    answerIndex: 1
  },
  {
    id: "q7",
    topic: "Estruturas de Repetição",
    statement: "Quando o FOR costuma ser mais indicado?",
    options: ["Quando nunca há repetição", "Quando o número de repetições é conhecido", "Apenas para textos", "Somente em páginas web"],
    answerIndex: 1
  },
  {
    id: "q8",
    topic: "Estruturas de Repetição",
    statement: "Qual risco existe em um WHILE mal planejado?",
    options: ["Loop infinito", "Variável com nome curto", "Comentário longo", "Excesso de cores"],
    answerIndex: 0
  },
  {
    id: "q9",
    topic: "Raciocínio Lógico",
    statement: "Na condição 'faltouProva && apresentouJustificativa', o operador && significa:",
    options: ["Ou", "E", "Não", "Divisão"],
    answerIndex: 1
  },
  {
    id: "q10",
    topic: "Raciocínio Lógico",
    statement: "Uma condição booleana retorna principalmente:",
    options: ["Verdadeiro ou falso", "Apenas números decimais", "Uma imagem", "Um arquivo JSON"],
    answerIndex: 0
  }
];

export const initialStudentState: StudentState = {
  aluno: {
    id: "stu_001",
    nome: "João Silva"
  },
  modulo: {
    nome: "Lógica de Programação",
    progresso: 32
  },
  engajamento: {
    tempo_total_estudo: 142,
    ultimo_acesso: new Date().toISOString(),
    acessos: [new Date(Date.now() - 86400000 * 4).toISOString(), new Date(Date.now() - 86400000 * 2).toISOString()]
  },
  quizzes: {
    media: 0,
    tentativas: 0,
    historico: []
  },
  exercicios: {
    realizados: 0,
    pendentes: exercises.length,
    historico: exercises.map((exercise) => ({
      exerciseId: exercise.id,
      completed: false,
      answer: ""
    }))
  },
  conteudos: contents.map((content, index) => ({
    contentId: content.id,
    secondsSpent: index === 0 ? 620 : index === 1 ? 260 : 0,
    completed: index === 0,
    lastAccess: new Date(Date.now() - 86400000 * (index + 1)).toISOString()
  })),
  competencias: [
    { nome: "Pensamento Algorítmico", status: "Em desenvolvimento", score: 38 },
    { nome: "Resolução de Problemas", status: "Não iniciada", score: 16 },
    { nome: "Estruturas Condicionais", status: "Não iniciada", score: 8 },
    { nome: "Estruturas de Repetição", status: "Não iniciada", score: 4 },
    { nome: "Raciocínio Lógico", status: "Em desenvolvimento", score: 28 }
  ],
  evolucao: [
    { data: "01/06", progresso: 8, nota: 0, competencias: 6 },
    { data: "02/06", progresso: 16, nota: 0, competencias: 12 },
    { data: "03/06", progresso: 24, nota: 0, competencias: 18 },
    { data: "05/06", progresso: 32, nota: 0, competencias: 22 }
  ]
};
