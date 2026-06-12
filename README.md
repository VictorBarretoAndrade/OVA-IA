```
git clone https://github.com/PERSONALIZED-CONTENT-RECOMMENDER/OVA-Rastreamento.git
```

# Running
```
cd OVA-Rastreamento
docker compose up
```
access the url http://localhost:8010/html/login.html

> **Nota:** em um volume MySQL já existente (criado antes destas mudanças), aplique as
> migrações manualmente: `docker compose exec -T ova_mysql sh -c "mysql -uroot -pPassword-1 ova_db < /docker-entrypoint-initdb.d/ddl_extra.sql"`
> e o mesmo para `dml_extra.sql`. Em um volume novo, os scripts rodam sozinhos no init.

# EduBot Track

- **Lista completa de arquivos alterados + passo a passo de execução:** [ALTERACOES_EDUBOT.md](ALTERACOES_EDUBOT.md)
- **Mapeamento do código, bugs corrigidos e justificativa da arquitetura:** [ANALISE.md](ANALISE.md)

Resumo do que existe agora:

- **Recursos com vídeo e podcast (4.1)** — tabela `resources` com `resource_url` +
  `media_type` (abstração de hospedagem: upload próprio ou embed externo) e tabela
  `resource_progress` (% assistido, tempo de escuta, conclusão). Players separados em
  `Front-End/files/js/components/` (`video-player.js`, `audio-player.js`), que recebem
  qualquer URL.
- **Autenticação e contexto do aluno (4.2)** — token assinado emitido no `/login`
  (header `Authorization: Bearer`), decorator `require_auth` e `GET /student/me` com o
  perfil completo (consumo, competências, inatividade, preferência de formato).
  Defina `EDUBOT_SECRET` em produção.
- **Agente de IA (4.3)** — módulo `Back-End/edubot_agent/` com o prompt do Claude
  Sonnet (AWS Bedrock) já escrito e parametrizado e um cliente **mockado** que responde
  no formato real da API. `GET /edubot/recommendation` gera e persiste a recomendação.
  A chamada real ao Bedrock ainda **não** está conectada (por decisão de projeto).
- **Painel do aluno (4.4)** — `http://localhost:8010/html/painel.html`: recursos
  consumidos por OVA, status das competências e última recomendação do EduBot.

## Endpoints novos

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/ova/<id>/resources` | ✔ | Recursos do OVA + progresso do aluno logado |
| POST | `/progress/ova` | ✔ | Upsert de leitura/scroll/conclusão do OVA |
| POST | `/progress/resource` | ✔ | Upsert de consumo de um recurso (vídeo/podcast/atividade) |
| GET | `/student/me` | ✔ | Perfil completo do aluno logado |
| GET | `/edubot/recommendation` | ✔ | Recomendação do agente (mock Bedrock) |

## Teste local sem Docker

```powershell
cd Back-End
pip install -r requirements.txt
python tools/init_test_db.py   # cria dev_ova.db (SQLite) com dados de exemplo
python api/api.py              # API em http://127.0.0.1:8090 (login RA 1 / senha 1)
```
