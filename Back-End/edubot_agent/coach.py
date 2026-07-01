# MELHORIA (Roteiro Cena 3) — Mensagem falada do EduBot ("coach") gerada por IA.
#
# Gera um texto CURTO e HUMANO sobre o progresso do aluno, para o personagem
# virtualizado falar. Usa a AWS Bedrock via API key (bearer token) quando
# disponível (variável AWS_BEARER_TOKEN_BEDROCK) — SÓ SOB DEMANDA e com modelo
# barato + poucos tokens, para controlar custo. Se a chave não existir, falhar
# ou expirar, devolve None e o frontend usa o texto determinístico local.
import json
import os

# Modelo barato com throughput on-demand na Bedrock (controle de custo).
COACH_MODEL = os.getenv("EDUBOT_COACH_MODEL", "anthropic.claude-3-haiku-20240307-v1:0")
REGION = os.getenv("AWS_REGION", "us-east-1")
MAX_TOKENS = int(os.getenv("EDUBOT_COACH_MAX_TOKENS", "220"))


def has_bedrock_key():
    return bool(os.getenv("AWS_BEARER_TOKEN_BEDROCK"))


def _profile_digest(profile):
    """Resumo compacto do perfil (poucos tokens de entrada = menos custo)."""
    comp = profile.get("competencias", [])
    desenvolvidas = [c["nome"] for c in comp if c.get("status") == "desenvolvida"]
    fracas = sorted(
        [c for c in comp if (c.get("taxa_erro") or 0) > 0.5],
        key=lambda c: -(c.get("taxa_erro") or 0))
    return {
        "nome": (profile.get("estudante", {}) or {}).get("nome"),
        "percentual_consumido": profile.get("recursos", {}).get("percentual_consumido"),
        "dias_sem_acesso": profile.get("dias_sem_acesso"),
        "taxa_erro_quiz": profile.get("quiz", {}).get("taxa_erro"),
        "competencias_desenvolvidas": desenvolvidas,
        "competencia_mais_fraca": fracas[0]["nome"] if fracas else None,
    }


_SYSTEM = (
    "Você é o EduBot, um tutor virtual simpático e encorajador de uma plataforma "
    "educacional. Fale DIRETAMENTE com o aluno, em tom caloroso, humano e "
    "motivador — como um mentor que acompanha o progresso dele. Seja específico "
    "usando os dados fornecidos (percentual consumido, competências, dificuldade). "
    "Escreva de 2 a 3 frases curtas, naturais para serem FALADAS em voz alta "
    "(sem listas, sem markdown, sem emojis). Responda no idioma pedido."
)


def coach_message(profile, lang="pt"):
    """Devolve (texto, model_id) ou None se a IA não estiver disponível."""
    if not has_bedrock_key():
        return None

    idioma = "inglês" if lang == "en" else "português do Brasil"
    user = (
        f"Idioma da resposta: {idioma}.\n"
        f"Dados do aluno (JSON): {json.dumps(_profile_digest(profile), ensure_ascii=False)}\n"
        "Gere a fala do EduBot sobre o progresso deste aluno."
    )

    try:
        import boto3  # importado só quando a IA real é usada
        client = boto3.client("bedrock-runtime", region_name=REGION)
        body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": MAX_TOKENS,
            "system": _SYSTEM,
            "messages": [{"role": "user", "content": user}],
        })
        resp = client.invoke_model(modelId=COACH_MODEL, body=body)
        data = json.loads(resp["body"].read())
        text = "".join(b.get("text", "") for b in data.get("content", [])
                       if b.get("type") == "text").strip()
        return (text, data.get("model", COACH_MODEL)) if text else None
    except Exception as err:  # noqa: BLE001 — degrada para o texto local
        print(f"[coach] Bedrock indisponível ({err}); usando texto local.")
        return None
