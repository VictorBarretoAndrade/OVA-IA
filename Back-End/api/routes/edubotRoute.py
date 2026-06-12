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

root = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
sys.path.append(root)
sys.path.append(os.getcwd())  # Back-End/ no path para importar edubot_agent
sys.path.append(os.path.abspath(os.path.join(os.getcwd(), 'data/models')))
sys.path.append(os.path.abspath(os.path.join(os.getcwd(), 'data')))

from flask import Blueprint, g
from flask_cors import cross_origin
from peewee import PeeweeException
import json
import datetime

from interventions import Interventions

from auth import require_auth
from services.student_context import build_student_profile
from edubot_agent import get_recommendation

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

        # 3. Persiste como intervenção para compor o histórico
        Interventions.create(
            student_id=g.student,
            date=datetime.date.today(),
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
        return json.dumps({"Error": f"{err}"}), 501
