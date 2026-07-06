# Add parent directories to the path to enable imports from submodules
import sys, os

root = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
sys.path.append(root)
sys.path.append(os.path.abspath(os.path.join(os.getcwd(), 'data/models')))
sys.path.append(os.path.abspath(os.path.join(os.getcwd(), 'data')))

# Import necessary libraries
from flask import Blueprint, request, g
from flask_cors import cross_origin
from peewee import PeeweeException # ORM library
import json
import datetime

# Import ORM classes used in the routes
from ovas import OVAs
from interactions import Interactions

from auth import require_auth

# Create a route blueprint as a reusable component
app_interaction = Blueprint("interaction", __name__)

# Define a route to register a user interaction with an OVA
@app_interaction.route("/interaction/register", methods=["POST"])
# Enable cross-origin requests from other domains
@cross_origin()
# A3: exige token. O aluno vem SEMPRE do token (g.student), nunca do payload —
# antes qualquer um podia registrar interação em nome de outro aluno (IDOR).
@require_auth
def register_interaction():
    try:
        # Retrieve the JSON payload sent in the request
        interaction_data = request.get_json()[0]
    except (TypeError, IndexError, KeyError):
        return json.dumps({"Error": "Invalid payload"}), 400

    try:
        # Retrieve the OVA ID with which the student interacted
        ova = OVAs.get_or_none(OVAs.ova_id == interaction_data.get("ova_id"))
        action = str(interaction_data.get("action", "")).strip()

        # BUGFIX (B8): the original code created the interaction even when the
        # OVA didn't exist, inserting NULL foreign keys silently.
        if ova is None or not action:
            return json.dumps({"Error": "Unknown ova_id or missing action"}), 400

        # BUGFIX (B8): date used the non-ISO "%Y/%m/%d" format; standardized to
        # ISO 8601 so date arithmetic (e.g. days of inactivity) works reliably.
        now = datetime.datetime.now()
        Interactions.create(
            interaction_date = now.strftime("%Y-%m-%d"),
            interaction_time = now.strftime("%H:%M:%S"),
            student_action = action,
            student_id = g.student,   # A3: do token, não do payload
            ova_id = ova
        )

        # Return a success message if the operation was completed
        return json.dumps("New interaction registered!"), 200
    # Handle errors and return the error description
    except PeeweeException as err:
        return json.dumps({"Error": f"{err}"}), 500
