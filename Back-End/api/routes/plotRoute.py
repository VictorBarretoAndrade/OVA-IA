# Add parent directories to the path to enable imports from submodules
import sys, os

root = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
sys.path.append(root)
sys.path.append(os.path.abspath(os.path.join(os.getcwd(), 'plots')))
sys.path.append(os.path.abspath(os.path.join(os.getcwd(), 'data/models')))
sys.path.append(os.path.abspath(os.path.join(os.getcwd(), 'data')))

# BUGFIX (B7): these model imports were placed BEFORE the sys.path setup and only
# worked because other routes (imported earlier in api.py) had already appended
# the model directories. Moved below the path setup so this module is self-contained.
from ovas import OVAs
from questions import Questions

# Import necessary libraries
from flask import Blueprint, request
from flask_cors import cross_origin
from peewee import PeeweeException # ORM library
import json

# Import the necessary ORM classes
from interactions import Interactions

# Import the data_analysis module for data plotting
from data_analysis import subject_performance_by_competencies, course_general_performance, ova_performance_by_students
# from data_analysis import competency_performance_by_students, subject_performance_by_competencies, course_general_performance, ova_performance_by_students

# Format the data to send to the front-end, including the type of plot,
# the data itself, and the title of the plot
def format_data(plot_type, title, data):
    d = {"type": plot_type,
        "data": data,
        "title": title,
    }
    return d

# Create a route blueprint as a reusable component
app_plot = Blueprint("plot", __name__)

# Get all the plots related to a student
@app_plot.route("/plot/student", methods=["POST"])
@cross_origin()
def get_student_plots():
    if request.method == "POST":
        try:
            student_data = request.get_json()[0]
            
            # Call the plot function for the plot module
            title, data = subject_performance_by_competencies(student_data)
            # Get the formatted data for the plot
            plot = format_data("bar", title, data)
            
            return json.dumps(plot)
        except PeeweeException as err:
            return json.dumps({"Error": f"{err}"}), 500
    else:
        # Return this if the HTTP method is not POST
        return "Wrong Request Methods. Only POST Allowed", 405

# Get all the plots related to a course
@app_plot.route("/plot/course", methods=["POST"])
@cross_origin()
def get_course_plots():
    if request.method == "POST":
        try:
            course_id = request.get_json()[0]["course_id"]
            
            # Call the plot function for the plot module
            data = course_general_performance(course_id)
            # Get the formatted data for the plot
            plot = format_data("bar", "Performance Geral do Curso", data)
            
            return json.dumps(plot)
        except PeeweeException as err:
            return json.dumps({"Error": f"{err}"}), 500
    else:
        # Return this if the HTTP method is not POST
        return "Wrong Request Methods. Only POST Allowed", 405

# Get all the plots related to an OVA
@app_plot.route("/plot/ova", methods=["POST"])
@cross_origin()
def get_ova_plots():
    if request.method == "POST":
        try:
            data = request.get_json()[0]
            
            # Call the plot function for the plot module
            data = ova_performance_by_students(data)
            # Get the formatted data for the plot
            plot = format_data("bar", "Performance dos alunos no OVA", data)
            
            return json.dumps(plot)
        except PeeweeException as err:
            return json.dumps({"Error": f"{err}"}), 500
    else:
        # Return this if the HTTP method is not POST
        return "Wrong Request Methods. Only POST Allowed", 405
    
# Get the number of interactions in an OVA
@app_plot.route("/plot/interaction/ova", methods=["POST"])
@cross_origin()
def get_interaction_plots():
    if request.method == "POST":    
        try:
            interaction_data = request.get_json()[0]
            print(interaction_data)
            
            # BUGFIX (B1): the original code used the Python "and" operator between two
            # Peewee expressions. "and" evaluates the truthiness of the first expression
            # and returns the second one, so the student filter was silently DISCARDED
            # and the count included interactions from every student. Peewee requires
            # the bitwise "&" operator to combine conditions.
            student_interactions = Interactions.select().where(
                (Interactions.student_id == interaction_data["student_id"]) &
                (Interactions.ova_id == interaction_data["ova_id"])
            ).count()
            
            num_questions = Questions.select().where(Questions.ova_id == interaction_data["ova_id"]).count()
            ova = OVAs.select(OVAs.num_interactions).where(OVAs.ova_id == interaction_data["ova_id"]).first()
            
            return json.dumps({"num_interactions": student_interactions, "total_interactions": num_questions + ova.num_interactions})
        except PeeweeException as err:
            return json.dumps({"Error": f"{err}"}), 500
    else:
        # Return this if the HTTP method is not POST
        return "Wrong Request Methods. Only POST Allowed", 405
    
# Get all the plots related to a specific competency
# @app_plot.route("/plot/competency", methods=["POST"])
# @cross_origin()
# def get_competency_plots():
#     if request.method == "POST":
#         competency_id = request.get_json()[0]["competency_id"]
        
#         # Call the plot function for the plot module
#         data = competency_performance_by_students(competency_id)
#         # Get the formatted data for the plot
#         plot = format_data("bar", "Performance dos alunos na competência", data)
        
#         return json.dumps(plot)
#     else:
#         # Return this if the HTTP method is not POST
#         return "Wrong Request Methods. Only POST Allowed", 405
