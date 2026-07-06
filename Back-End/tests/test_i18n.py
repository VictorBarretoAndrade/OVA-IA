"""Fase 4 (A12) — conteúdo servido no idioma pedido, com fallback PT."""
import json

from edubot.data.models.ovas import OVAs
from edubot.data.models.questions import Questions
from edubot.i18n import norm_lang, tr


def test_tr_helper():
    assert tr("Cálculo", "Calculus", "en") == "Calculus"
    assert tr("Cálculo", "Calculus", "pt") == "Cálculo"
    assert tr("Cálculo", None, "en") == "Cálculo"      # fallback PT
    assert norm_lang("EN") == "en"
    assert norm_lang("xx") == "pt"
    assert norm_lang(None) == "pt"


def _seed_translations():
    OVAs.update(ova_name_en="OVA One").where(OVAs.ova_id == 1).execute()
    Questions.update(
        statement_en="What is 2+2?",
        alternatives_en={"alternatives": ["3", "4"]},
    ).where(Questions.question_id == 1).execute()


def test_profile_serves_lang(client, auth, seeded_db):
    _seed_translations()
    r_pt = client.get("/student/me", headers=auth(1))
    r_en = client.get("/student/me?lang=en", headers=auth(1))
    pt = json.loads(r_pt.data.decode())
    en = json.loads(r_en.data.decode())
    assert pt["ovas"][0]["ova_name"] == "OVA 1"
    assert en["ovas"][0]["ova_name"] == "OVA One"


def test_questions_served_in_lang_with_fallback(client, auth, seeded_db):
    _seed_translations()
    r = client.post("/question/ova?lang=en", headers=auth(1),
                    data=json.dumps({"ova_id": 1}))
    questions = {q["question_id"]: q for q in json.loads(r.data.decode())}
    # q1 tem tradução; q2 não (fallback PT)
    assert questions[1]["statement"] == "What is 2+2?"
    assert questions[2]["statement"] == "3+3?"


def test_grading_unaffected_by_lang(client, auth, seeded_db):
    _seed_translations()
    # As alternativas EN mantêm a ordem do PT — a letra "b" continua correta.
    r = client.post("/question/answer?lang=en", headers=auth(1),
                    data=json.dumps({"question_id": 1, "selected": "b"}))
    assert json.loads(r.data.decode())["is_correct"] is True
