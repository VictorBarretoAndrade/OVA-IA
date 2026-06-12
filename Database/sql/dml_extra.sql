-- MELHORIA (4.1): seed dos recursos de cada OVA, incluindo vídeo e podcast.
--
-- A hospedagem definitiva dos arquivos ainda NÃO foi decidida: o par
-- (resource_url, media_type) é a abstração que permite trocar depois entre
-- uploads próprios (S3/local) e embeds externos (YouTube/Spotify) sem mudar o
-- schema. As URLs de podcast abaixo são placeholders públicos de teste
-- (media_type 'upload' = arquivo direto tocável pelo player HTML5).
use ova_db;

insert into resources
(resource_id, ova_id, resource_type, resource_title, resource_url, media_type, duration_seconds)
values
-- OVA 1: Computação Quântica
(1, 1, "texto",     "Leitura: A Jornada Quântica",                   NULL, NULL, NULL),
(2, 1, "video",     "Vídeo: Introdução à Computação Quântica",       "https://www.youtube.com/watch?v=7NWN3wivxhA", "youtube", NULL),
(3, 1, "video",     "Vídeo: Qubits e Superposição",                  "https://www.youtube.com/watch?v=hp4wXxE4fxg", "youtube", NULL),
(4, 1, "podcast",   "Podcast: Conversas Quânticas (ep. 1)",          "https://www.soundhelix.com/examples/audio/SoundHelix-Song-1.mp3", "upload", 372),
(5, 1, "quiz",      "Quiz: Computação Quântica",                     NULL, NULL, NULL),
(6, 1, "atividade", "Atividade prática: simule um qubit no IBM Quantum Composer", NULL, NULL, NULL),
-- OVA 2: Cálculo
(7,  2, "texto",     "Leitura: Limites e Derivadas",                 NULL, NULL, NULL),
(8,  2, "video",     "Vídeo: A essência do Cálculo",                 "https://www.youtube.com/watch?v=WUvTyaaNkzM", "youtube", NULL),
(9,  2, "podcast",   "Podcast: Cálculo no dia a dia (ep. 1)",        "https://www.soundhelix.com/examples/audio/SoundHelix-Song-2.mp3", "upload", 425),
(10, 2, "quiz",      "Quiz: Cálculo",                                NULL, NULL, NULL),
(11, 2, "atividade", "Atividade prática: resolva a lista de limites e envie ao professor", NULL, NULL, NULL),
-- OVA 3: Cálculo 2
(12, 3, "texto",     "Leitura: Integrais e Aplicações",              NULL, NULL, NULL),
(13, 3, "video",     "Vídeo: Integração — ideia central",            "https://www.youtube.com/watch?v=rfG8ce4nNh0", "youtube", NULL),
(14, 3, "podcast",   "Podcast: Histórias do Cálculo (ep. 2)",        "https://www.soundhelix.com/examples/audio/SoundHelix-Song-3.mp3", "upload", 380),
(15, 3, "quiz",      "Quiz: Cálculo 2",                              NULL, NULL, NULL),
(16, 3, "atividade", "Atividade prática: modele um problema de otimização", NULL, NULL, NULL);
