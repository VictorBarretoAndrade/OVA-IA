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
import datetime

# Import ORM classes used in the routes
from students import Students
from ovas import OVAs
from interactions import Interactions

# Create a route blueprint as a reusable component
app_interaction = Blueprint("interaction", __name__)

# Define a route to register a user interaction with an OVA
@app_interaction.route("/interaction/register", methods=["POST"])
# Enable cross-origin requests from other domains
@cross_origin()
def register_interaction():
    if request.method == "POST":
        try:
            # Retrieve the JSON payload sent in the request
            interaction_data = request.get_json()[0]

            # Retrieve the student ID involved in the interaction
            student = Students.select().where(Students.student_id == interaction_data["student_id"]).first()
            # Retrieve the OVA ID with which the student interacted
            ova = OVAs.select().where(OVAs.ova_id == interaction_data["ova_id"]).first()

            # BUGFIX (B8): the original code created the interaction even when the
            # student or OVA didn't exist, inserting NULL foreign keys silently.
            if student is None or ova is None:
                return json.dumps({"Error": "Unknown student_id or ova_id"}), 400

            # BUGFIX (B8): date used the non-ISO "%Y/%m/%d" format; standardized to
            # ISO 8601 so date arithmetic (e.g. days of inactivity) works reliably.
            now = datetime.datetime.now()
            interaction = Interactions.create(
                interaction_date = now.strftime("%Y-%m-%d"),
                interaction_time = now.strftime("%H:%M:%S"),
                student_action = interaction_data["action"],
                student_id = student,
                ova_id = ova
            )

            # Return a success message if the operation was completed
            return json.dumps("New interaction registered!"), 200
        # Handle errors and return the error description
        except PeeweeException as err:
            return json.dumps({"Error": f"{err}"}), 501
    else:
        # Return a message if the HTTP method is not POST
        return "Wrong Request Methods. Only POST Allowed", 405
