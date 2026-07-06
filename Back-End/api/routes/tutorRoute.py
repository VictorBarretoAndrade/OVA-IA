# MELHORIA (Roteiro Cena 4) — Painel do Tutor + Central de Alertas.
#
#   GET  /tutor/turma     -> alunos (com atividade) do curso do tutor + KPIs
#   GET  /tutor/alerts    -> alertas preventivos da turma
#   POST /tutor/evaluate  -> roda as regras do EduBot sobre a turma, gerando
#                            intervenções e alertas para alunos em risco
#
# Todas exigem token (@require_auth) E papel de tutor/admin (g.student.role).
import sys, os

root = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
sys.path.append(root)
sys.path.append(os.getcwd())
sys.path.append(os.path.abspath(os.path.join(os.getcwd(), 'data/models')))
sys.path.append(os.path.abspath(os.path.join(os.getcwd(), 'data')))

from flask import Blueprint, g
from flask_cors import cross_origin
from peewee import PeeweeException, fn
import json
import datetime

from students import Students
from interactions import Interactions
from ova_progress import OVAProgress
from attempts import Attempts
from alerts import Alerts

from auth import require_auth
from services.student_context import build_student_profile
from edubot_agent import get_recommendation

app_tutor = Blueprint("tutor", __name__)

# Máximo de alunos avaliados por requisição (proteção: o curso de exemplo tem 500)
MAX_TURMA = 60


def _is_tutor():
    role = getattr(g.student, "role", "aluno") or "aluno"
    return role in ("tutor", "admin") or bool(g.student.is_admin)


def _active_student_ids():
    """IDs de alunos que têm ALGUMA atividade (interação/progresso/tentativa).
    Mantém o painel relevante e rápido sem varrer os 500 alunos do seed."""
    ids = set()
    for query in (
        Interactions.select(Interactions.student_id).distinct().tuples(),
        OVAProgress.select(OVAProgress.student_id).distinct().tuples(),
        Attempts.select(Attempts.student_id).distinct().tuples(),
    ):
        for row in query:
            if row[0] is not None:
                ids.add(row[0])
    return ids


def _turma_students():
    course_id = g.student.course_id
    active = _active_student_ids()
    if not active:
        return []
    query = (Students
             .select()
             .where((Students.course_id == course_id) &
                    (Students.student_id.in_(list(active))) &
                    (Students.role == "aluno"))
             .limit(MAX_TURMA))
    return list(query)


def _days_without_access(student):
    last = (Interactions
            .select(fn.MAX(Interactions.interaction_date))
            .where(Interactions.student_id == student)
            .scalar())
    if not last:
        return None
    if isinstance(last, str):
        last = datetime.date.fromisoformat(last.replace("/", "-"))
    if isinstance(last, datetime.datetime):
        last = last.date()
    return (datetime.date.today() - last).days


def _student_summary(student):
    consumo = (OVAProgress
               .select(fn.AVG(OVAProgress.perc_scrolled))
               .where(OVAProgress.student_id == student)
               .scalar())
    total = Attempts.select().where(Attempts.student_id == student).count()
    wrong = (Attempts
             .select()
             .where((Attempts.student_id == student) & (Attempts.is_correct == False))
             .count())
    abertos = (Alerts
               .select()
               .where((Alerts.student_id == student) & (Alerts.read == False))
               .count())
    return {
        "student_id": student.student_id,
        "nome": student.student_name,
        "ra": student.ra,
        "dias_sem_acesso": _days_without_access(student),
        "consumo_percentual": int(consumo) if consumo is not None else 0,
        "taxa_erro": round(wrong / total, 2) if total else None,
        "alertas_abertos": abertos,
    }


@app_tutor.route("/tutor/turma", methods=["GET"])
@cross_origin()
@require_auth
def tutor_turma():
    if not _is_tutor():
        return json.dumps({"Error": "Acesso restrito a tutores."}), 403
    try:
        alunos = [_student_summary(s) for s in _turma_students()]
        # ordena por mais críticos primeiro (mais alertas, depois menos consumo)
        alunos.sort(key=lambda a: (-a["alertas_abertos"], a["consumo_percentual"]))
        return json.dumps({"total": len(alunos), "alunos": alunos}, default=str), 200
    except PeeweeException as err:
        return json.dumps({"Error": f"{err}"}), 500


@app_tutor.route("/tutor/alerts", methods=["GET"])
@cross_origin()
@require_auth
def tutor_alerts():
    if not _is_tutor():
        return json.dumps({"Error": "Acesso restrito a tutores."}), 403
    try:
        course_id = g.student.course_id
        rows = (Alerts
                .select(Alerts, Students)
                .join(Students)
                .where(Students.course_id == course_id)
                .order_by(Alerts.created_at.desc())
                .limit(50))
        out = [{
            "alert_id": a.alert_id,
            "student_id": a.student_id.student_id,
            "aluno": a.student_id.student_name,
            "type": a.type,
            "message": a.message,
            "severity": a.severity,
            "created_at": str(a.created_at),
            "read": bool(a.read),
        } for a in rows]
        return json.dumps({"alertas": out}, default=str), 200
    except PeeweeException as err:
        return json.dumps({"Error": f"{err}"}), 500


@app_tutor.route("/tutor/evaluate", methods=["POST"])
@cross_origin()
@require_auth
def tutor_evaluate():
    if not _is_tutor():
        return json.dumps({"Error": "Acesso restrito a tutores."}), 403
    try:
        criados = 0
        for student in _turma_students():
            profile = build_student_profile(student)
            rec = get_recommendation(profile)
            if rec.get("prioridade") not in ("alta", "media"):
                continue
            # Evita duplicar: só cria se não houver alerta ABERTO do mesmo tipo
            ja_existe = (Alerts
                         .select()
                         .where((Alerts.student_id == student) &
                                (Alerts.type == rec["tipo"]) &
                                (Alerts.read == False))
                         .exists())
            if ja_existe:
                continue
            from interventions import Interventions
            Interventions.create(
                student_id=student, date=datetime.date.today(),
                type=rec["tipo"], description=rec["mensagem_aluno"], result="pendente")
            Alerts.create(
                student_id=student, type=rec["tipo"],
                message=f"{student.student_name}: {rec['titulo']}",
                severity=rec["prioridade"], created_at=datetime.datetime.now(), read=False)
            criados += 1
        return json.dumps({"alertas_criados": criados}), 200
    except PeeweeException as err:
        return json.dumps({"Error": f"{err}"}), 500
