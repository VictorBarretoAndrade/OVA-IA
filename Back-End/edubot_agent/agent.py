# Núcleo do EduBot Agent (MELHORIA 4.3).
#
# get_recommendation(profile) -> dict estruturado com a recomendação.
#
# A integração real com o AWS Bedrock NÃO está ligada ainda (decisão do
# projeto). BedrockClientMock simula a resposta do endpoint invoke_model do
# Claude Sonnet com o MESMO envelope JSON da API real; a lógica das seis regras
# de decisão roda localmente para gerar um conteúdo realista. Quando a conta
# AWS estiver disponível, basta substituir BedrockClientMock por um cliente
# boto3 (ver _real_invoke_example no fim do arquivo) — o restante do código
# (prompt, parsing, rota, persistência) já está pronto.
import json
import uuid

from . import llm
from .prompt import RULES, build_system_prompt, build_user_prompt

# Modelo alvo no Bedrock (Claude Sonnet). Mantido em constante para a troca
# mock -> real não exigir busca pelo código.
BEDROCK_MODEL_ID = "anthropic.claude-sonnet-4-5-20250929-v1:0"


# ---------------------------------------------------------------------------
# Motor de regras — usado pelo mock para produzir uma resposta plausível.
# A ordem de prioridade é a mesma documentada no system prompt.
# ---------------------------------------------------------------------------
def _apply_rules(profile):
    nome = profile.get("estudante", {}).get("nome") or "estudante"
    primeiro_nome = nome.split()[0]
    dias = profile.get("dias_sem_acesso")
    consumo = profile.get("recursos", {}).get("percentual_consumido") or 0
    taxa_erro = profile.get("quiz", {}).get("taxa_erro")
    pendentes = profile.get("atividades_pendentes") or 0
    preferencia = profile.get("preferencia_formato")
    desenvolvidas = [c for c in profile.get("competencias", [])
                     if c.get("status") == "desenvolvida"]

    # Regra 1 — inatividade
    if dias is not None and dias > RULES["INACTIVITY_DAYS"]:
        return {
            "tipo": "plano_retomada",
            "prioridade": "alta",
            "titulo": "Plano de retomada dos estudos",
            "mensagem_aluno": (
                f"Oi, {primeiro_nome}! Sentimos sua falta — já são {dias} dias sem "
                "acessar a plataforma. Que tal retomar aos poucos? Separei um plano "
                "leve para os próximos 3 dias."),
            "acoes": [
                "Dia 1: revisitar por 10 minutos o último OVA acessado",
                "Dia 2: assistir/ouvir um recurso curto do OVA em andamento",
                "Dia 3: responder 2 questões do quiz para reativar a memória",
            ],
            "formato_preferido": preferencia,
            "justificativa": (
                f"Regra 1 (inatividade): aluno sem acesso há {dias} dias "
                f"(limite: {RULES['INACTIVITY_DAYS']})."),
        }

    # Regra 2 — consumo abaixo da trilha mínima
    if consumo < RULES["MIN_CONSUMPTION_PERC"]:
        return {
            "tipo": "trilha_minima",
            "prioridade": "alta",
            "titulo": "Trilha mínima de recursos essenciais",
            "mensagem_aluno": (
                f"{primeiro_nome}, você consumiu {consumo}% dos recursos disponíveis. "
                "Para não perder o fio da disciplina, foque primeiro nos itens "
                "essenciais desta trilha mínima."),
            "acoes": [
                "Ler a seção de texto principal do OVA em andamento",
                "Assistir ao vídeo introdutório do OVA",
                "Fazer o quiz ao final para consolidar",
            ],
            "formato_preferido": preferencia,
            "justificativa": (
                f"Regra 2 (trilha mínima): consumo de {consumo}% "
                f"< {RULES['MIN_CONSUMPTION_PERC']}%."),
        }

    # Regra 3 — taxa de erro alta no quiz
    if taxa_erro is not None and taxa_erro > RULES["QUIZ_ERROR_RATE"]:
        return {
            "tipo": "revisao_alternativa",
            "prioridade": "media",
            "titulo": "Revisão com explicação alternativa",
            "mensagem_aluno": (
                f"{primeiro_nome}, percebi que {round(taxa_erro * 100)}% das suas "
                "tentativas no quiz não foram bem. Acontece! Vamos revisar os mesmos "
                "tópicos por um caminho diferente — com analogias e exemplos visuais."),
            "acoes": [
                "Revisar as competências com mais erros usando o material em outro formato",
                "Assistir à explicação alternativa em vídeo (ou podcast) do tópico",
                "Refazer apenas as questões erradas após a revisão",
            ],
            "formato_preferido": preferencia,
            "justificativa": (
                f"Regra 3 (revisão alternativa): taxa de erro {taxa_erro} "
                f"> {RULES['QUIZ_ERROR_RATE']}."),
        }

    # Regra 4 — acessou mas não concluiu
    if pendentes > 0 and consumo > 0:
        return {
            "tipo": "checklist_execucao",
            "prioridade": "media",
            "titulo": "Checklist para concluir o que começou",
            "mensagem_aluno": (
                f"{primeiro_nome}, você já avançou bastante, mas tem "
                f"{pendentes} OVA(s) começado(s) e não concluído(s). Um checklist "
                "curto ajuda a fechar o ciclo!"),
            "acoes": [
                "Abrir o OVA pendente e ir direto à última seção lida",
                "Concluir a atividade prática pendente",
                "Marcar o recurso como concluído ao terminar",
            ],
            "formato_preferido": preferencia,
            "justificativa": (
                f"Regra 4 (checklist): {pendentes} atividade(s)/OVA(s) acessado(s) "
                "sem conclusão."),
        }

    # Regra 5 — competência desenvolvida
    if desenvolvidas:
        comp = desenvolvidas[0]["nome"]
        return {
            "tipo": "aprofundamento",
            "prioridade": "baixa",
            "titulo": "Desafio avançado desbloqueado",
            "mensagem_aluno": (
                f"Parabéns, {primeiro_nome}! Você desenvolveu a competência "
                f"\"{comp}\". Que tal um desafio avançado para ir além?"),
            "acoes": [
                f"Explorar material de aprofundamento sobre: {comp}",
                "Tentar o desafio avançado relacionado à competência",
                "Compartilhar o resultado com o professor",
            ],
            "formato_preferido": preferencia,
            "justificativa": (
                f"Regra 5 (aprofundamento): competência \"{comp}\" com status "
                "desenvolvida."),
        }

    # Regra 6 — recomendação baseada no formato de maior engajamento
    formato = preferencia or "texto"
    return {
        "tipo": "recomendacao_formato",
        "prioridade": "baixa",
        "titulo": "Próximos passos no seu formato favorito",
        "mensagem_aluno": (
            f"{primeiro_nome}, você está em dia! Notei que você se engaja mais com "
            f"conteúdo em {formato}. Selecionei os próximos OVAs priorizando esse "
            "formato."),
        "acoes": [
            f"Continuar a trilha priorizando recursos em {formato}",
            "Manter o ritmo de acesso para não perder a constância",
        ],
        "formato_preferido": formato,
        "justificativa": (
            "Regra 6 (preferência de formato): nenhuma intervenção corretiva "
            f"necessária; formato de maior engajamento = {formato}."),
    }


# ---------------------------------------------------------------------------
# Cliente Bedrock mockado.
# ---------------------------------------------------------------------------
class BedrockClientMock:
    """Simula bedrock-runtime.invoke_model para o Claude Sonnet.

    Devolve o corpo de resposta com o MESMO formato da Anthropic Messages API
    usada pelo Bedrock, para que o código de parsing (extract de content[0].text)
    não precise mudar quando a chamada real for ligada.
    """

    def invoke_model(self, model_id, system_prompt, user_prompt, profile):
        recommendation = _apply_rules(profile)
        # Envelope idêntico ao retornado pelo Bedrock/Anthropic Messages API
        return {
            "id": f"msg_mock_{uuid.uuid4().hex[:12]}",
            "type": "message",
            "role": "assistant",
            "model": model_id,
            "content": [
                {"type": "text", "text": json.dumps(recommendation, ensure_ascii=False)}
            ],
            "stop_reason": "end_turn",
            "usage": {"input_tokens": len(user_prompt) // 4, "output_tokens": 250},
        }


_client = BedrockClientMock()


def get_recommendation(profile):
    """Ponto de entrada do agente: perfil do aluno -> recomendação estruturada.

    O fluxo (montar prompts -> invocar modelo -> parsear o JSON do texto da
    resposta) é exatamente o que será usado com o Bedrock real.
    """
    system_prompt = build_system_prompt()
    user_prompt = build_user_prompt(profile)

    # Caminho REAL (Bedrock/Anthropic) quando configurado. O system prompt já
    # instrui o formato JSON da recomendação; o parsing é o mesmo do mock.
    if llm.is_real():
        try:
            resp = llm.messages_create(
                system=system_prompt,
                messages=[{"role": "user", "content": user_prompt}],
            )
            text = "".join(b.text for b in resp.content if b.type == "text")
            recommendation = json.loads(text)
            recommendation["model_id"] = resp.model
            recommendation["message_id"] = resp.id
            recommendation["mock"] = False
            return recommendation
        except Exception as err:  # noqa: BLE001 — degrada para o mock
            print(f"[edubot] LLM real falhou ({err}); usando mock.")

    response = _client.invoke_model(
        model_id=BEDROCK_MODEL_ID,
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        profile=profile,
    )

    # Mesmo parsing que será usado com a resposta real do Claude
    recommendation = json.loads(response["content"][0]["text"])
    recommendation["model_id"] = response["model"]
    recommendation["message_id"] = response["id"]
    recommendation["mock"] = isinstance(_client, BedrockClientMock)
    return recommendation


# ---------------------------------------------------------------------------
# Referência para a integração futura (NÃO usada hoje):
#
# import boto3
# def _real_invoke_example(system_prompt, user_prompt):
#     client = boto3.client("bedrock-runtime", region_name="us-east-1")
#     body = json.dumps({
#         "anthropic_version": "bedrock-2023-05-31",
#         "max_tokens": 1024,
#         "system": system_prompt,
#         "messages": [{"role": "user", "content": user_prompt}],
#     })
#     resp = client.invoke_model(modelId=BEDROCK_MODEL_ID, body=body)
#     return json.loads(resp["body"].read())
# ---------------------------------------------------------------------------
