from base import BaseModel
from ovas import OVAs
from peewee import *


class Resources(BaseModel):
    resource_id = IntegerField(primary_key=True)
    ova_id = ForeignKeyField(OVAs, backref="resources", on_delete="cascade", on_update="cascade")
    resource_type = CharField(max_length=50)
    resource_title = CharField(max_length=255)
