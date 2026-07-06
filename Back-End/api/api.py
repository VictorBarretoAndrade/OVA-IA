# Import the main libraries
import logging

from flask import Flask, jsonify
from werkzeug.exceptions import HTTPException
from flask_cors import CORS

# Import the API routes
from routes.loginRoute import app_login
from routes.ovaRoute import app_ova
from routes.courseRoute import app_course
from routes.interactionRoute import app_interaction
from routes.studentRoute import app_student
from routes.plotRoute import app_plot
from routes.questionRoute import app_question
from routes.reportRoute import app_report
# MELHORIA (4.1/4.2/4.3): rastreamento de consumo e agente EduBot
from routes.progressRoute import app_progress
from routes.edubotRoute import app_edubot
# MELHORIA (OVA personalizada): agente de tool-use que monta OVA de reforço
from routes.personalizedOvaRoute import app_personalized_ova
# MELHORIA (Roteiro Cena 4): painel do tutor + central de alertas
from routes.tutorRoute import app_tutor

# Create the Flask app and configure CORS
app = Flask(__name__)
cors = CORS(app)

logger = logging.getLogger("edubot.api")


# Error handler global (A10) — respostas de erro coerentes em JSON.
#
# Antes, cada rota capturava só PeeweeException e devolvia 501 (Not Implemented);
# qualquer outro erro (payload malformado, IndexError do envelope [data], etc.)
# virava um 500 sem corpo. Estes handlers garantem que TODA falha volte como
# JSON com o status HTTP correto.
@app.errorhandler(HTTPException)
def handle_http_exception(err):
    return jsonify({"error": err.description, "status": err.code}), err.code


@app.errorhandler(Exception)
def handle_unexpected_exception(err):
    # Erros inesperados: loga o stack trace no servidor, devolve 500 genérico
    # ao cliente (sem vazar detalhes internos).
    logger.exception("Erro não tratado na requisição")
    return jsonify({"error": "Erro interno do servidor", "status": 500}), 500

# Register the API routes as blueprints
app.register_blueprint(app_login)
app.register_blueprint(app_ova)
app.register_blueprint(app_course)
app.register_blueprint(app_interaction)
app.register_blueprint(app_student)
app.register_blueprint(app_plot)
app.register_blueprint(app_question)
app.register_blueprint(app_report)
app.register_blueprint(app_progress)
app.register_blueprint(app_edubot)
app.register_blueprint(app_personalized_ova)
app.register_blueprint(app_tutor)

# Start the application
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8090)
