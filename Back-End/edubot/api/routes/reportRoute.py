# Add parent directories to the path to enable imports from submodules
import sys, os


from flask import Blueprint, request, g
from flask_cors import cross_origin
from peewee import PeeweeException, fn
import json
import datetime

from edubot.data.models.students import Students
from edubot.data.models.interactions import Interactions
from edubot.data.models.answers import Answers
from edubot.data.models.questions import Questions
from edubot.data.models.competencies import Competencies
from edubot.data.models.ovas import OVAs
from edubot.data.models.resources import Resources
from edubot.data.models.ova_progress import OVAProgress
from edubot.data.models.attempts import Attempts
from edubot.data.models.interventions import Interventions

from edubot.api.auth import require_auth
# A15: fonte única de inatividade (multi-sinal) — evita a cópia divergente que
# quebrava com o SQLite (string − date = TypeError) e só olhava `interactions`.
from edubot.services.student_context import _days_without_access

app_report = Blueprint("report", __name__)


@app_report.route('/student/report/<int:student_id>', methods=['GET'])
@cross_origin()
# A3: exige token e restringe o acesso. Antes /student/report/<id> devolvia
# nome, desempenho e histórico de QUALQUER aluno sem login. Agora só o próprio
# aluno ou um tutor/admin pode ver o relatório de um aluno.
@require_auth
def student_report(student_id):
    try:
        requester = g.student
        is_staff = getattr(requester, "role", "aluno") in ("tutor", "admin") or bool(getattr(requester, "is_admin", False))
        if requester.student_id != student_id and not is_staff:
            return json.dumps({'error': 'forbidden'}), 403

        # Basic student info
        student = Students.get_or_none(Students.student_id == student_id)
        if not student:
            return json.dumps({'error': 'student not found'}), 404

        # dias_sem_acesso (multi-sinal, fonte única em student_context — A2/A15)
        dias_sem_acesso = _days_without_access(student)

        # recursos_consumidos_percentual (avg perc_scrolled)
        avg_perc = OVAProgress.select(fn.AVG(OVAProgress.perc_scrolled)).where(OVAProgress.student_id == student).scalar()
        recursos_consumidos_percentual = int(avg_perc) if avg_perc is not None else None

        # media_quizzes: average fraction correct across competencies/ovas (use Answers as correct answers)
        # total questions registered
        total_questions = Questions.select(fn.COUNT(Questions.question_id)).scalar() or 0
        correct_cnt = Answers.select(fn.COUNT(Answers.answer_id)).where(Answers.student_id == student).scalar() or 0
        media_quizzes = None
        if total_questions > 0:
            media_quizzes = round((correct_cnt / total_questions) * 5, 2)  # scale to 0-5 like example

        # erros_frequentes_topicos: using Attempts if available, otherwise empty
        frequent_errors = []
        wrongs = (Attempts
                  .select(Questions.competency_id.alias('competency_id'), fn.COUNT(Attempts.attempt_id).alias('wrong_count'))
                  .join(Questions, on=(Attempts.question_id == Questions.question_id))
                  .where((Attempts.student_id == student) & (Attempts.is_correct == False))
                  .group_by(Questions.competency_id)
                  .order_by(fn.COUNT(Attempts.attempt_id).desc())
                  .limit(5)
                  .dicts())
        for w in wrongs:
            comp_id = w.get('competency_id')
            comp = Competencies.get_or_none(Competencies.competency_id == comp_id)
            if comp:
                frequent_errors.append(comp.competency_description)

        # atividades_pendentes: count of ova_progress where completed is False
        pending = OVAProgress.select().where((OVAProgress.student_id == student) & (OVAProgress.completed == False)).count()

        # competencias: derive status by competency correct rate
        competencias_list = []
        comp_totals = (Questions.select(Questions.competency_id, fn.COUNT(Questions.question_id).alias('total_q'))
                       .group_by(Questions.competency_id))
        for ct in comp_totals:
            comp_id = ct.competency_id
            total_q = ct.total_q
            correct = (Answers.select(fn.COUNT(Answers.answer_id)).join(Questions).where((Answers.student_id == student) & (Questions.competency_id == comp_id))).scalar() or 0
            ratio = correct / total_q if total_q > 0 else 0
            if ratio >= 0.8:
                status = 'desenvolvida'
            elif ratio >= 0.4:
                status = 'parcialmente desenvolvida'
            elif correct > 0:
                status = 'em desenvolvimento'
            else:
                status = 'não iniciada'
            comp = Competencies.get_or_none(Competencies.competency_id == comp_id)
            competencias_list.append({
                'nome': comp.competency_description if comp else f'competency_{comp_id}',
                'status': status
            })

        # historico_intervencoes
        interventions = []
        for it in Interventions.select().where(Interventions.student_id == student).order_by(Interventions.date.desc()).limit(10):
            interventions.append({
                'data': it.date.strftime('%Y-%m-%d'),
                'tipo': it.type,
                'descricao': it.description,
                'resultado': it.result
            })

        # modulo: take most recent OVA subject name and its resources
        recent_ova = (Interactions.select(Interactions.ova_id)
                      .where(Interactions.student_id == student)
                      .order_by(Interactions.interaction_date.desc())
                      .first())
        modulo = {'nome': None, 'total_recursos': 0, 'recursos_disponiveis': []}
        if recent_ova:
            ova_obj = OVAs.get_or_none(OVAs.ova_id == recent_ova.ova_id)
            if ova_obj:
                subject_id = ova_obj.subject_id
                # Use subject name as module name
                from edubot.data.models.subjects import Subjects
                subj = Subjects.get_or_none(Subjects.subject_id == subject_id)
                modulo['nome'] = subj.subject_name if subj else None
                # resources for OVAs in this subject
                res_q = (Resources.select(Resources.resource_title)
                         .join(OVAs, on=(Resources.ova_id == OVAs.ova_id))
                         .where(OVAs.subject_id == subject_id))
                recursos = [r.resource_title for r in res_q]
                modulo['recursos_disponiveis'] = recursos
                modulo['total_recursos'] = len(recursos)

        result = {
            'estudante': {
                'id': f'stu_{student.student_id:03d}',
                'nome': student.student_name,
                'dias_sem_acesso': dias_sem_acesso,
                'recursos_consumidos_percentual': recursos_consumidos_percentual,
                'media_quizzes': media_quizzes,
                'erros_frequentes_topicos': frequent_errors,
                'atividades_pendentes': pending,
                'competencias': competencias_list,
                'historico_intervencoes': interventions
            },
            'modulo': modulo
        }

        return json.dumps(result, default=str), 200
    except PeeweeException as err:
        return json.dumps({'Error': f'{err}'}), 500
