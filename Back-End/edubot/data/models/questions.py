# Import the necessary classes
from edubot.data.models.base import BaseModel
from edubot.data.models.competencies import Competencies
from edubot.data.models.ovas import OVAs
from peewee import *
from playhouse.mysql_ext import JSONField

# Class representing the questions table
class Questions(BaseModel):
    # Unique identifier for the question
    question_id = IntegerField(primary_key=True)
    # Text of the question
    statement = TextField()
    # Possible answers for the question
    alternatives = JSONField()
    # Correct answer for the question
    answer = TextField()
    # Foreign key referencing the OVA to which the question belongs
    ova_id = ForeignKeyField(OVAs, backref="questions", on_delete="cascade", on_update="cascade")
    # Foreign key referencing the competency to which the question belongs
    competency_id = ForeignKeyField(Competencies, backref="questions", on_delete="cascade", on_update="cascade")
