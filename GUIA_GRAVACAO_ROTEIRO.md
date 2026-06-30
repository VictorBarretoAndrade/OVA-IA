# Guia de gravação — passo a passo (onde clicar) por cena do roteiro

Roteiro de cliques para gravar o vídeo de 8 minutos na plataforma **rodando**.
Cada cena traz o que dizer (resumo), **onde clicar** e o que aparece na tela.

## Antes de gravar (preparação)

1. Suba a plataforma: na pasta `OVA-IA`, rode `docker compose up -d` e espere
   o MySQL (uns segundos). Confirme em `docker compose ps` (3 serviços `running`).
2. Abra **http://localhost:8010/app/** e dê **Ctrl+F5** (evita cache).
3. Credenciais:
   - **Aluno:** RA `1` / senha `1`
   - **Tutor:** RA `2` / senha `2`
4. (Opcional) Para a IA do tutor responder com o Claude **real** na gravação,
   configure a key da AWS antes — ver [IA_AWS_SETUP.md](IA_AWS_SETUP.md). Sem
   isso, o tutor responde em **modo mock** (determinístico, serve para a demo).

> ⚠️ **Ainda não implementado:** o **avatar animado com voz (TTS)** das Cenas 3 e
> 5. Onde o roteiro pede o avatar, use **narração em voz over** sobre as telas de
> feedback/gráficos (indicado abaixo em cada ponto).

---

## CENA 1 — Introdução (0:00–0:45)

**Narração** (tom empático): o desafio de personalizar o ensino em massa.

**Tela:** imagens de abertura / vinheta (edição de vídeo) → termine na **tela de
login** da plataforma.

- **Clique:** campo RA → digite `1`; campo senha → digite `1`.
- **Clique:** botão **Entrar**.
- Aparece o **Dashboard** do aluno.

---

## CENA 2 — App em ação: rastreamento + IA embarcada (0:45–3:00)

**Narração:** ambiente totalmente rastreável; conteúdo em módulos/aulas; IA
embarcada dialoga com o material.

### a) Navegar a disciplina
- Na **barra lateral**, **clique em "Conteúdos"**.
- Na lista à esquerda, **clique no card "Fundamentos de Computação na Nuvem"**.
- **Clique no botão "Abrir conteúdo"** (canto direito do card).
- Abre o **leitor de OVA nativo**. **Role a página** mostrando:
  - o **hero** azul com a introdução,
  - a seção **"Modelos de Serviço"** → **clique nas setas/bolinhas do carrossel**
    (IaaS → PaaS → SaaS),
  - a seção **"Modelos de Implantação"** → **clique nos itens do acordeão**
    (Nuvem Pública / Privada / Híbrida) para expandir,
  - repare na **barra de progresso de leitura** no topo subindo conforme rola.

### b) Mídias rastreadas (mostrar rapidamente)
- Continue rolando até **"Recursos adicionais"**: dá **play no vídeo** alguns
  segundos (a barra "% assistido" registra o consumo).

### c) IA generativa embarcada (ponto-chave da cena)
- O painel **"Assistente do conteúdo"** já está aberto à direita (se estiver
  recolhido, **clique na aba "Pergunte à IA"** na borda direita, ou no botão
  **"Tirar dúvidas com a IA"** no topo).
- **Clique no campo de texto** do chat e **digite uma pergunta sobre o conteúdo**,
  ex.: *"o que é IaaS?"* → **clique no botão enviar (avião)**.
- A resposta aparece **e mostra o chip de fonte** (📌 com o nome da seção do
  material) — destaque isso: *"a IA responde com referência direta ao material"*.
- Faça uma 2ª pergunta de uma das **sugestões** exibidas, se quiser.

> Narração de fechamento da cena: cada clique/leitura/mídia/pergunta vira dado
> para o perfil de aprendizagem.

---

## CENA 3 — EduBot, gráficos e feedback (3:00–5:00)

**Narração:** o EduBot gera um extrato do aprendizado; mensura competências.

### a) Painel de desempenho / competências
- **Clique em "Meu Desempenho"** na barra lateral.
- Mostre a **"Teia de competências"** (gráfico **radar**) — *"o quanto cada
  competência foi desenvolvida"*.
- Role para os gráficos **"Leitura por OVA"** e **"Consumo por tipo de recurso"**.

### b) Feedback do EduBot (texto)
- **Clique em "Tutor IA"** na barra lateral → aparece a **recomendação do EduBot**
  baseada no desempenho (ex.: revisar com explicação alternativa após erro no quiz).
- (Opcional) No topo, **clique no sino 🔔 "Avisos do EduBot"** para mostrar o
  histórico de intervenções.

> 🎬 **Avatar/voz (pendente):** o roteiro pede o avatar falando *"Olá Ana! ...errou
> o quiz, recomendo..."*. Como ainda não há avatar, **narre esse feedback em voz
> over** sobre a tela da recomendação/gráficos. (Quando o avatar for implementado,
> ele entra exatamente aqui.)

---

## CENA 4 — Recomendação inteligente + intervenções (5:00–6:30)

**Narração:** quando a competência não é desenvolvida, o EduBot recomenda
conteúdo (interno e externo) e alerta o tutor.

### a) OVA de reforço + materiais externos (como aluno)
- **Clique em "Reforço"** na barra lateral.
- **Clique no botão "Gerar OVA de reforço"** → o agente diagnostica o assunto
  fraco e monta a trilha.
- Na OVA aberta, mostre:
  - o selo **"Foco: <competência>"** e a mensagem do EduBot,
  - os **recursos de reforço** (vídeo/texto),
  - o bloco **"Materiais externos"** → **clique em um artigo** (abre um paper
    científico da Crossref em nova aba) — *"explorar bases de dados científicas"*.

### b) Regras + alerta ao tutor (troque para a conta de tutor)
- **Clique em "Sair"** (canto inferior da barra lateral).
- Faça login como **tutor**: RA `2` / senha `2`.
- **Clique em "Turma"** na barra lateral (aba que só o tutor vê).
- Mostre os **KPIs** (Alunos ativos / Alertas abertos / Em risco) e a **tabela**
  da turma (consumo, % de erro, dias sem acesso).
- **Clique no botão "Analisar turma"** → o EduBot roda as regras
  (7 dias sem acesso / <40% de consumo / >50% de erro) e **gera os alertas**.
- Aponte para a **"Central de alertas"** à direita: o aviso do aluno em risco
  aparece — *"o EduBot envia o plano de retomada e alerta o tutor"*.

---

## CENA 5 — Inovação e visão futura (6:30–7:30)

**Narração:** arquitetura de dados; IA agêntica; visão de futuro com avatar de
especialista.

- **Tela:** volte ao **Dashboard** / **Meu Desempenho** e mostre os dados/gráficos
  fluindo (use como pano de fundo da narração sobre "arquitetura de dados").
- A parte do **avatar de especialista (ex.: Bill Gates) com voz clonada** é
  **visão de futuro** — **narre** essa parte (não há tela ainda). Opcional: use
  uma arte/conceito do avatar como ilustração na edição.

---

## CENA 6 — Chamada para ação (7:30–8:00)

**Narração** (tom inspirador): educação 100% personalizada, baseada em dados.

- **Clique em "Dashboard"** para fechar mostrando a interface principal.
- Encerre com a vinheta **"Agentic AI for Education"** (edição de vídeo).

---

## Resumo do percurso de cliques

```
Login (RA 1/1)
 └─ Conteúdos → "Fundamentos de Computação na Nuvem" → Abrir conteúdo
      → rolar (carrossel/acordeão) → play no vídeo
      → Assistente do conteúdo: perguntar → ver chip "Fonte"
 └─ Meu Desempenho → Teia de competências (radar)
 └─ Tutor IA → recomendação do EduBot   [narrar o "avatar"]
 └─ Reforço → Gerar OVA de reforço → Materiais externos (clicar num artigo)
 └─ Sair → Login (RA 2/2 — tutor)
 └─ Turma → Analisar turma → Central de alertas
 └─ Dashboard (encerramento)
```

## Pendências que viram narração (não há tela ainda)
- **Avatar animado + voz (TTS)** — Cenas 3 e 5 → narrar em voz over.
- **Voz de especialista / persona (Bill Gates)** — Cena 5 → narrar como futuro.
- **IA real (Bedrock)** — opcional: ligar a key antes para o tutor responder com
  o Claude de verdade (senão, mock).

*Guia de gravação — última atualização: 2026-06-30.*
