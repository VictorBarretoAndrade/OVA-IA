-- MELHORIA (4.1): seed dos recursos de cada OVA, incluindo vídeo e podcast.
--
-- A hospedagem definitiva dos arquivos ainda NÃO foi decidida: o par
-- (resource_url, media_type) é a abstração que permite trocar depois entre
-- uploads próprios (S3/local) e embeds externos (YouTube/Spotify) sem mudar o
-- schema. As URLs de podcast abaixo são placeholders públicos de teste
-- (media_type 'upload' = arquivo direto tocável pelo player HTML5).
use ova_db;

-- MELHORIA (OVA personalizada): a coluna competency_id classifica cada recurso
-- por competência, transformando `resources` no banco de conteúdo de remediação
-- que o agente EduBot consulta por assunto. Recursos genéricos do OVA
-- (quiz/atividade) ficam com competency_id NULL.
insert into resources
(resource_id, ova_id, resource_type, resource_title, resource_url, media_type, duration_seconds, competency_id)
values
-- OVA 1: Computação Quântica
(1, 1, "texto",     "Leitura: A Jornada Quântica",                   NULL, NULL, NULL, 1),
(2, 1, "video",     "Vídeo: Introdução à Computação Quântica",       "https://www.youtube.com/watch?v=7NWN3wivxhA", "youtube", NULL, 1),
(3, 1, "video",     "Vídeo: Qubits e Superposição",                  "https://www.youtube.com/watch?v=hp4wXxE4fxg", "youtube", NULL, 1),
(4, 1, "podcast",   "Podcast: Conversas Quânticas (ep. 1)",          "https://www.soundhelix.com/examples/audio/SoundHelix-Song-1.mp3", "upload", 372, 2),
(5, 1, "quiz",      "Quiz: Computação Quântica",                     NULL, NULL, NULL, NULL),
(6, 1, "atividade", "Atividade prática: simule um qubit no IBM Quantum Composer", NULL, NULL, NULL, NULL),
-- OVA 2: Cálculo
(7,  2, "texto",     "Leitura: Limites e Derivadas",                 NULL, NULL, NULL, 5),
(8,  2, "video",     "Vídeo: A essência do Cálculo",                 "https://www.youtube.com/watch?v=WUvTyaaNkzM", "youtube", NULL, 4),
(9,  2, "podcast",   "Podcast: Cálculo no dia a dia (ep. 1)",        "https://www.soundhelix.com/examples/audio/SoundHelix-Song-2.mp3", "upload", 425, 5),
(10, 2, "quiz",      "Quiz: Cálculo",                                NULL, NULL, NULL, NULL),
(11, 2, "atividade", "Atividade prática: resolva a lista de limites e envie ao professor", NULL, NULL, NULL, NULL),
-- OVA 3: Cálculo 2
(12, 3, "texto",     "Leitura: Integrais e Aplicações",              NULL, NULL, NULL, 4),
(13, 3, "video",     "Vídeo: Integração — ideia central",            "https://www.youtube.com/watch?v=rfG8ce4nNh0", "youtube", NULL, 4),
(14, 3, "podcast",   "Podcast: Histórias do Cálculo (ep. 2)",        "https://www.soundhelix.com/examples/audio/SoundHelix-Song-3.mp3", "upload", 380, 6),
(15, 3, "quiz",      "Quiz: Cálculo 2",                              NULL, NULL, NULL, NULL),
(16, 3, "atividade", "Atividade prática: modele um problema de otimização", NULL, NULL, NULL, NULL);

-- MELHORIA (OVA personalizada): BANCO DE REMEDIAÇÃO.
-- Recursos extras de reforço, um vídeo + um texto por competência, usados pelo
-- agente para montar a OVA personalizada quando o aluno vai mal naquele assunto.
-- (media_type 'link' = texto externo que o leitor abre em nova aba/embed.)
insert into resources
(resource_id, ova_id, resource_type, resource_title, resource_url, media_type, duration_seconds, competency_id)
values
-- Competência 1 — princípios da computação quântica
(17, 1, "video", "Reforço: Princípios da Computação Quântica em 10 min", "https://www.youtube.com/watch?v=jHoEjvuPoB8", "youtube", NULL, 1),
(18, 1, "texto", "Reforço (texto): O que é computação quântica?",        "https://www.ibm.com/br-pt/topics/quantum-computing", "link", NULL, 1),
-- Competência 2 — aplicações da computação quântica
(19, 1, "video", "Reforço: Aplicações reais da Computação Quântica",     "https://www.youtube.com/watch?v=e3fz3dqhN44", "youtube", NULL, 2),
(20, 1, "texto", "Reforço (texto): Casos de uso da computação quântica", "https://en.wikipedia.org/wiki/Quantum_computing#Applications", "link", NULL, 2),
-- Competência 3 — desafios e limitações
(21, 1, "video", "Reforço: Por que é difícil construir um computador quântico", "https://www.youtube.com/watch?v=g_IaVepNDT4", "youtube", NULL, 3),
(22, 1, "texto", "Reforço (texto): Decoerência e correção de erros",     "https://en.wikipedia.org/wiki/Quantum_decoherence", "link", NULL, 3),
-- Competência 4 — derivadas e integrais
(23, 2, "video", "Reforço: Derivadas do zero (3Blue1Brown)",             "https://www.youtube.com/watch?v=9vKqVkMQHKk", "youtube", NULL, 4),
(24, 2, "texto", "Reforço (texto): Regras de derivação",                 "https://pt.khanacademy.org/math/calculus-1/cs1-derivatives-definition-and-basic-rules", "link", NULL, 4),
-- Competência 5 — limites
(25, 2, "video", "Reforço: Entendendo limites de forma intuitiva",       "https://www.youtube.com/watch?v=kfF40MiS7zA", "youtube", NULL, 5),
(26, 2, "texto", "Reforço (texto): Limites e continuidade",              "https://pt.khanacademy.org/math/calculus-1/cs1-limits-and-continuity", "link", NULL, 5),
-- Competência 6 — máximos e mínimos
(27, 3, "video", "Reforço: Máximos e mínimos com derivadas",             "https://www.youtube.com/watch?v=pInFesXIfg8", "youtube", NULL, 6),
(28, 3, "texto", "Reforço (texto): Otimização e pontos críticos",        "https://pt.khanacademy.org/math/calculus-1/cs1-applications-of-derivatives", "link", NULL, 6);
