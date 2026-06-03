import sys, os

# Ensure project root (Back-End) is on sys.path for imports
sys.path.append(os.path.join(os.getcwd(), 'data', 'models'))
sys.path.append(os.path.join(os.getcwd(), 'data'))

from base import db
from students import Students
from courses import Courses
from subjects import Subjects
from ovas import OVAs
from competencies import Competencies
from questions import Questions
from answers import Answers
from interactions import Interactions
from resources import Resources
from ova_progress import OVAProgress
from attempts import Attempts
from interventions import Interventions


def init_db():
    db.connect()
    models = [
        Courses, Subjects, Competencies, OVAs, Students, Questions,
        Answers, Interactions, Resources, OVAProgress, Attempts, Interventions
    ]
    db.create_tables(models, safe=True)

    # Insert minimal sample data
    c = Courses.create(course_name='Engenharia')
    s = Subjects.create(subject_name='Introdução ao Machine Learning')
    comp1 = Competencies.create(competency_description='Fundamentos de ML supervisionado', subject_id=s)
    comp2 = Competencies.create(competency_description='Conceitos de treino e teste', subject_id=s)
    ova = OVAs.create(ova_name='Intro ML', link='#', num_interactions=0, subject_id=s)
    student = Students.create(ra='1', student_password='1', student_name='Ana Clara', course_id=c, is_admin=False)
    # Questions and answers
    q1 = Questions.create(statement='Q1', alternatives='[]', answer='A', ova_id=ova, competency_id=comp1)
    q2 = Questions.create(statement='Q2', alternatives='[]', answer='A', ova_id=ova, competency_id=comp2)
    # one correct answer recorded
    Answers.create(student_id=student, question_id=q1)
    # resources
    Resources.create(ova_id=ova, resource_type='Texto', resource_title='Texto introdutório')
    Resources.create(ova_id=ova, resource_type='Vídeo', resource_title='Vídeo explicativo')
    # progress
    OVAProgress.create(student_id=student, ova_id=ova, read_time=300, perc_scrolled=65, completed=False)
    # attempts (one wrong on comp2)
    Attempts.create(student_id=student, question_id=q2, is_correct=False)
    # intervention
    Interventions.create(student_id=student, date='2026-05-28', type='recomendacao_recurso', description='Sugestão de revisar o vídeo sobre treino e teste.', result='respondeu')

    db.close()


if __name__ == '__main__':
    init_db()
    print('Test DB initialized')
