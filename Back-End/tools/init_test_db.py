import sys, os

# Ensure project root (Back-End) is on sys.path for imports
sys.path.append(os.path.join(os.getcwd(), 'data', 'models'))
sys.path.append(os.path.join(os.getcwd(), 'data'))

from base import db
from students import Students
from courses import Courses
from subjects import Subjects
from offerings import Offerings
from ovas import OVAs
from competencies import Competencies
from questions import Questions
from answers import Answers
from interactions import Interactions
from resources import Resources
from resource_progress import ResourceProgress
from ova_progress import OVAProgress
from attempts import Attempts
from interventions import Interventions


def init_db():
    db.connect()
    models = [
        Courses, Subjects, Offerings, Competencies, OVAs, Students, Questions,
        Answers, Interactions, Resources, ResourceProgress, OVAProgress,
        Attempts, Interventions
    ]
    db.create_tables(models, safe=True)

    # Insert minimal sample data
    c = Courses.create(course_name='Engenharia')
    s = Subjects.create(subject_name='Introdução ao Machine Learning')
    Offerings.create(course_id=c, subject_id=s)
    comp1 = Competencies.create(competency_description='Fundamentos de ML supervisionado', subject_id=s)
    comp2 = Competencies.create(competency_description='Conceitos de treino e teste', subject_id=s)
    ova = OVAs.create(ova_name='Intro ML', link='#', num_interactions=0, subject_id=s)
    student = Students.create(ra='1', student_password='1', student_name='Ana Clara', course_id=c, is_admin=False)
    # Questions and answers
    q1 = Questions.create(statement='Q1', alternatives='{"alternatives": ["a1", "a2"]}', answer='a', ova_id=ova, competency_id=comp1)
    q2 = Questions.create(statement='Q2', alternatives='{"alternatives": ["a1", "a2"]}', answer='a', ova_id=ova, competency_id=comp2)
    # one correct answer recorded
    Answers.create(student_id=student, question_id=q1)
    # resources — MELHORIA (4.1): now with the URL + media type abstraction
    r_text = Resources.create(ova_id=ova, resource_type='texto', resource_title='Texto introdutório')
    r_video = Resources.create(ova_id=ova, resource_type='video', resource_title='Vídeo explicativo',
                               resource_url='https://www.youtube.com/watch?v=aircAruvnKk', media_type='youtube')
    r_pod = Resources.create(ova_id=ova, resource_type='podcast', resource_title='Podcast: ML na prática',
                             resource_url='https://www.soundhelix.com/examples/audio/SoundHelix-Song-1.mp3',
                             media_type='upload', duration_seconds=372)
    Resources.create(ova_id=ova, resource_type='quiz', resource_title='Quiz: Intro ML')
    Resources.create(ova_id=ova, resource_type='atividade', resource_title='Atividade: treine um modelo')
    # progress
    OVAProgress.create(student_id=student, ova_id=ova, read_time=300, perc_scrolled=65, completed=False)
    ResourceProgress.create(student_id=student, resource_id=r_video, perc_consumed=40, seconds_consumed=120)
    # attempts (one wrong on comp2)
    Attempts.create(student_id=student, question_id=q2, is_correct=False)
    # intervention
    Interventions.create(student_id=student, date='2026-05-28', type='recomendacao_recurso', description='Sugestão de revisar o vídeo sobre treino e teste.', result='respondeu')

    db.close()


if __name__ == '__main__':
    init_db()
    print('Test DB initialized')
