# MELHORIA (4.3) — Rota do agente EduBot.
#
#   GET /edubot/recommendation -> gera a recomendação para o aluno LOGADO
#                                 (perfil completo -> edubot_agent -> JSON)
#
# Cada recomendação gerada é persistida na tabela "interventions", que passa a
# funcionar como histórico de intervenções do EduBot (consumido pelo painel e
# devolvido dentro do próprio perfil em historico_intervencoes).

# Add parent directories to the path to enable imports from submodules
import sys, os


from flask import Blueprint, request, g
from flask_cors import cross_origin
from peewee import PeeweeException
import json
import datetime

from edubot.data.models.interventions import Interventions
from edubot.data.models.ovas import OVAs
from edubot.data.models.competencies import Competencies

from edubot.api.auth import require_auth
from edubot.services.student_context import build_student_profile
from edubot.agent import get_recommendation
from edubot.agent.tutor import tutor_reply
from edubot.agent.external_sources import search_external
from edubot.agent.coach import coach_message

app_edubot = Blueprint("edubot", __name__)


@app_edubot.route("/edubot/recommendation", methods=["GET"])
@cross_origin()
@require_auth
def edubot_recommendation():
    try:
        # 1. Monta o perfil completo do aluno logado (contexto 4.2)
        profile = build_student_profile(g.student)

        # 2. Chama o agente (mock Bedrock por enquanto — ver edubot_agent/)
        recommendation = get_recommendation(profile)

        # 3. Persiste como intervenção para compor o histórico — deduplicado (A8).
        #    O endpoint é um GET consultado a cada clique do aluno; sem dedup,
        #    cinco cliques criavam cinco intervenções "pendente" iguais poluindo
        #    o histórico e o próprio perfil que o agente lê. Só cria se ainda não
        #    houver uma intervenção pendente do mesmo tipo no dia.
        today = datetime.date.today()
        already = (
            Interventions
            .select()
            .where(
                (Interventions.student_id == g.student) &
                (Interventions.date == today) &
                (Interventions.type == recommendation["tipo"]) &
                (Interventions.result == "pendente")
            )
            .exists()
        )
        if not already:
            Interventions.create(
                student_id=g.student,
                date=today,
                type=recommendation["tipo"],
                description=recommendation["mensagem_aluno"],
                result="pendente"
            )

        return json.dumps({
            "recommendation": recommendation,
            "profile_summary": {
                "dias_sem_acesso": profile["dias_sem_acesso"],
                "percentual_consumido": profile["recursos"]["percentual_consumido"],
                "taxa_erro_quiz": profile["quiz"]["taxa_erro"],
                "atividades_pendentes": profile["atividades_pendentes"],
                "preferencia_formato": profile["preferencia_formato"]
            }
        }, default=str), 200
    except PeeweeException as err:
        return json.dumps({"Error": f"{err}"}), 500


# MELHORIA (Tutor IA por OVA) — chat de tutoria restrito ao conteúdo do OVA.
#
#   POST /edubot/tutor-chat  body: [{ova_id, context, messages}]
#
# O tutor responde com base SOMENTE no material do OVA (grounding). O título é
# resolvido do banco (validando o ova_id); o material (context) é o texto do
# conteúdo que o aluno consumiu, enviado pelo frontend. O "cérebro" está mockado
# (ver edubot_agent/tutor.py) — o contrato já é o da LLM real.
@app_edubot.route("/edubot/tutor-chat", methods=["POST"])
@cross_origin()
@require_auth
def edubot_tutor_chat():
    try:
        data = request.get_json()[0]
    except (TypeError, IndexError, KeyError):
        return json.dumps({"Error": "Invalid payload"}), 400

    ova_id = data.get("ova_id")
    ova = OVAs.get_or_none(OVAs.ova_id == ova_id) if ova_id is not None else None
    if ova is None:
        return json.dumps({"Error": "Unknown ova_id"}), 400

    # Aceita apenas papéis válidos e mensagens não vazias (sanitização básica).
    messages = []
    for m in (data.get("messages") or []):
        role = m.get("role")
        content = (m.get("content") or "").strip()
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})
    if not messages or messages[-1]["role"] != "user":
        return json.dumps({"Error": "A última mensagem deve ser do aluno (user)."}), 400

    result = tutor_reply(
        titulo=ova.ova_name,
        context=data.get("context") or "",
        messages=messages,
    )
    return json.dumps({
        "reply": result["reply"],
        "ova_id": ova_id,
        "ova_name": ova.ova_name,
        "model_id": result["model_id"],
        "mock": result["mock"],
        "sources": result.get("sources", []),
    }, default=str), 200


# MELHORIA (Roteiro Cena 4) — materiais externos (bases científicas) por
# competência. Cruza a lacuna de competência com artigos de fora da plataforma.
@app_edubot.route("/edubot/external-resources", methods=["GET"])
@cross_origin()
@require_auth
def edubot_external_resources():
    competency_id = request.args.get("competency_id", type=int)
    comp = Competencies.get_or_none(Competencies.competency_id == competency_id) if competency_id else None
    if comp is None:
        return json.dumps({"Error": "Unknown competency_id"}), 400

    resultados = search_external(comp.competency_description, limit=3)
    return json.dumps({
        "competency_id": competency_id,
        "competencia": comp.competency_description,
        "resultados": resultados,
    }, default=str), 200


# MELHORIA (Roteiro Cena 3) — fala do EduBot (coach) sobre o progresso do aluno,
# gerada por IA (Bedrock) sob demanda. Se a IA não estiver disponível, devolve
# message=null e o frontend usa o texto local (determinístico).
@app_edubot.route("/edubot/coach-message", methods=["GET"])
@cross_origin()
@require_auth
def edubot_coach_message():
    lang = request.args.get("lang", "pt")
    try:
        profile = build_student_profile(g.student)
    except PeeweeException as err:
        return json.dumps({"Error": f"{err}"}), 500

    result = coach_message(profile, lang=lang)
    if not result:
        return json.dumps({"message": None, "ai": False}), 200
    text, model_id = result
    return json.dumps({"message": text, "ai": True, "model_id": model_id}, default=str), 200
