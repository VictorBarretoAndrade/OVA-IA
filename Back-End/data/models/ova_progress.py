from base import BaseModel
from students import Students
from ovas import OVAs
from peewee import *


class OVAProgress(BaseModel):
    progress_id = IntegerField(primary_key=True)
    student_id = ForeignKeyField(Students, backref="ova_progress", on_delete="cascade", on_update="cascade")
    ova_id = ForeignKeyField(OVAs, backref="ova_progress", on_delete="cascade", on_update="cascade")
    read_time = IntegerField(null=True)  # seconds
    perc_scrolled = IntegerField(null=True)  # 0-100
    completed = BooleanField(default=False)
    last_access = DateTimeField(null=True)
