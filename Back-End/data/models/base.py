from peewee import *  # ORM
import socket

# Try to use the MySQL configuration used in Docker; if host not resolvable,
# fallback to a local SQLite file for developer testing.
try:
    # Quick check if the MySQL host resolves
    socket.getaddrinfo('ova_mysql', None)
    db = MySQLDatabase(
        user="eduardo",
        password="Password-1",
        host="ova_mysql",
        port=3306,
        database="ova_db"
    )
except Exception:
    # Fallback to SQLite for local tests when MySQL container isn't available
    db = SqliteDatabase('dev_ova.db')


class BaseModel(Model):
    class Meta:
        database = db  # Define the database to be used for the model
