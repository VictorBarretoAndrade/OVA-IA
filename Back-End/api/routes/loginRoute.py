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

# Import ORM classes used in the routes
from students import Students
from courses import Courses

# MELHORIA (4.2): token de sessão emitido no login (ver api/auth.py)
from auth import generate_token

# Create a route blueprint as a reusable component
app_login = Blueprint('login', __name__)

# Define a route to verify if a user is in the database
@app_login.route("/login", methods=["POST"])
# Enable cross-origin requests from other domains
@cross_origin()
def login():
    if request.method == "POST":
        try:
            # Retrieve the JSON payload sent by the front-end
            login_data = request.get_json()[0]
            
            # Retrieve the student trying to log in
            student = Students.select().where(Students.ra == login_data["ra"]).first()
            
            # If credentials don't match, return an error response
            if (not student or login_data["ra"] == "") or login_data["password"] != student.student_password:
                return "Wrong RA or Password", 401
            
            # Retrieve the student's course
            course = Courses.select().where(Courses.course_id == student.course_id).first()
            
            ids = {
                "course_id": course.course_id,
                "student_id": student.student_id
            }
            
            # MELHORIA (4.2): a signed session token is now returned along with the
            # IDs. The frontend stores it and sends "Authorization: Bearer <token>"
            # on subsequent requests, so protected routes know who is logged in.
            return json.dumps({
                "Message": "Logged successfully!",
                "ids": ids,
                "is_admin": student.is_admin,
                "role": getattr(student, "role", "aluno") or "aluno",
                "token": generate_token(student.student_id)
            }), 200
        # Handle errors and return the error description
        except PeeweeException as err:
            return json.dumps({"Error": f"{err}"}), 501
    else:
        # Return a message if the HTTP method is not POST
        return "Wrong Request Methods. Only POST Allowed", 405
