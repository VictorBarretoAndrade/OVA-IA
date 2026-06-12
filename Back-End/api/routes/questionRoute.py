# Add parent directories to the path to enable imports from submodules
import sys, os

root = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
sys.path.append(root)
sys.path.append(os.path.abspath(os.path.join(os.getcwd(), 'data/models')))
sys.path.append(os.path.abspath(os.path.join(os.getcwd(), 'data')))

# Import necessary libraries
from flask import Blueprint, request
from flask_cors import cross_origin
from peewee import PeeweeException # ORM library
import json

# Import the necessary ORM classes
from questions import Questions
from answers import Answers
from students import Students
from attempts import Attempts

# Create a route blueprint as a reusable component
app_question = Blueprint("question", __name__)


# BUGFIX: the MySQL JSONField returns a dict, but under the SQLite dev fallback
# (see data/models/base.py) the same column comes back as a raw string, which
# crashed these routes locally. Accept both representations.
def _alternatives_list(question):
    alternatives = question.alternatives
    if isinstance(alternatives, str):
        alternatives = json.loads(alternatives)
    return alternatives["alternatives"]

# Return all the questions from the database
@app_question.route("/question/all", methods=["GET"])
# Activate cross-origin to accept requests from another domain
@cross_origin()
def show_all_questions():
    if request.method == "GET":
        try:
            # Get all the questions
            questions = Questions.select()
            question_list = []
            # For each question, append its id, statement and alternatives.
            # BUGFIX (B9): the correct answer is no longer sent to the client —
            # grading is done server-side in /question/answer.
            for question in questions:
                question_dict = {
                    "question_id": question.question_id,
                    "statement": question.statement,
                    "alternatives": _alternatives_list(question)
                }
                question_list.append(question_dict.copy())
            # Return the result array
            return json.dumps(question_list)
        except PeeweeException as err:
            # Handle the error by returning the description of the error
            return json.dumps({"Error": f"{err}"}), 501
    else:
        # Return this if the HTTP method is not GET
        return "Wrong Request Methods. Only GET Allowed", 405

# Given an OVA, return all the questions of this OVA
@app_question.route("/question/ova", methods=["POST"])
# Activate cross-origin to accept requests from another domain
@cross_origin()
def show_ova_questions():
    if request.method == "POST":
        try:
            question_data = request.get_json()[0]
            # Get all the questions of the given OVA
            questions = Questions.select().where(Questions.ova_id == question_data["ova_id"])
            questions_ids = [question.question_id for question in questions]

            # Get all the questions of the ova given by the student
            answers_ids = Answers.select(Answers.question_id).where(Answers.student_id == question_data["student_id"], Answers.question_id.in_(questions_ids))
            answers_ids = [id.question_id.question_id for id in answers_ids]

            question_list = []
            # For each question, append its id, statement, alternatives,
            # whether it was already answered, and the competency it works.
            # BUGFIX (B5/B9): the "answer" field (the correct alternative) used to be
            # shipped to the browser and rendered into a data-correct attribute,
            # exposing the answer key in the DOM. The quiz is now graded by the
            # backend (see /question/answer below).
            for question in questions:
                question_dict = {
                    "question_id": question.question_id,
                    "statement": question.statement,
                    "alternatives": _alternatives_list(question),
                    "answered": question.question_id in answers_ids,
                    "competency_id": question.competency_id.competency_id
                }
                question_list.append(question_dict.copy())
            # Return the result array
            return json.dumps(question_list)
        except PeeweeException as err:
            # Handle the error by returning the description of the error
            return json.dumps({"Error": f"{err}"}), 501
    else:
        # Return this if the HTTP method is not POST
        return "Wrong Request Methods. Only POST Allowed", 405

# Grades an answer sent by the student and records the attempt.
@app_question.route("/question/answer", methods=['POST'])
@cross_origin()
def answer_question():
    if request.method == 'POST':
        try:
            answer_data = request.get_json()[0]

            student = Students.select().where(Students.student_id == answer_data["student_id"]).first()
            question = Questions.select().where(Questions.question_id == answer_data["question_id"]).first()
            if student is None or question is None:
                return json.dumps({"Error": "Unknown student_id or question_id"}), 400

            # BUGFIX (B5): grading used to happen in the browser (the client sent
            # an "is_correct" flag computed against a data-correct DOM attribute).
            # The selected alternative is now compared with the stored answer here,
            # so the answer key never leaves the server and the result can't be forged.
            selected = str(answer_data.get("selected", "")).strip().lower()
            is_correct = selected == str(question.answer).strip().lower()

            # IMPROVEMENT (Passo 3): every attempt (right or wrong) is now persisted
            # in the "attempts" table — it existed but was never written to. Wrong
            # attempts feed the EduBot rule "errou mais de 50% do quiz".
            Attempts.create(
                student_id = student,
                question_id = question,
                is_correct = is_correct
            )

            # Keep the original behavior: store the first correct answer in "answers"
            answer = Answers.select(Answers.question_id).where(
                Answers.question_id == question.question_id,
                Answers.student_id == student.student_id
            ).first()
            if is_correct and answer is None:
                Answers.create(
                    student_id = student,
                    question_id = question
                )

            # The frontend uses this flag to show "Correct!"/"Incorrect."
            return json.dumps({"is_correct": is_correct}), 200
        except PeeweeException as err:
            # Handle the error by returning the description of the error
            return json.dumps({"Error": f"{err}"}), 501
    else:
        # Return this if the HTTP method is not POST
        return "Wrong Request Methods. Only POST Allowed", 405
