import os
import sys

from fastapi.testclient import TestClient

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db import Question, SessionLocal, init_db
from app.llm_service import extract_json_from_text, generate_heuristic_feedback
from app.main import app
from app.speech_metrics import calculate_wpm, tokenize_with_fillers

client = TestClient(app)


def setup_module():
    """Initializes SQLite database before running tests."""
    init_db()


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "whisper_model" in data


def test_get_questions_by_category():
    for category in ["hr", "technical", "behavioral"]:
        response = client.get(f"/questions?category={category}")
        assert response.status_code == 200
        data = response.json()
        assert data["category"] == category
        assert len(data["question_text"]) > 10


def test_get_questions_by_role_and_preset():
    response = client.get("/questions?role=swe&difficulty=Senior")
    assert response.status_code == 200
    data = response.json()
    assert len(data["question_text"]) > 5

    response_amazon = client.get("/questions?company_preset=amazon")
    assert response_amazon.status_code == 200
    assert "Amazon" in response_amazon.json()["question_text"]


def test_get_all_questions():
    response = client.get("/questions/all")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 15


def test_speech_metrics_filler_words():
    sample_text = "Well, um, I think that basically like you know our team actually succeeded, right?"
    tokens, total_fillers, breakdown = tokenize_with_fillers(sample_text)
    
    assert total_fillers >= 5
    assert "um" in breakdown
    assert "basically" in breakdown
    assert "like" in breakdown
    assert "you know" in breakdown
    assert "actually" in breakdown


def test_wpm_calculation():
    wpm, status = calculate_wpm(140, 60.0)
    assert wpm == 140.0
    assert status == "Ideal Pace"

    wpm, status = calculate_wpm(80, 60.0)
    assert wpm == 80.0
    assert status == "Too Slow"

    wpm, status = calculate_wpm(200, 60.0)
    assert wpm == 200.0
    assert status == "Too Fast"


def test_llm_json_extractor():
    raw_markdown = """
    Here is my evaluation:
    ```json
    {
      "relevance_score": 9,
      "structure_score": 8,
      "uses_star_method": true,
      "strengths": ["Structured problem breakdown", "Strong clarity"],
      "improvements": ["Quantify percentage impact", "Summarize takeaway"],
      "overall_summary": "Excellent structured response following STAR framework."
    }
    ```
    """
    parsed = extract_json_from_text(raw_markdown)
    assert parsed["relevance_score"] == 9
    assert parsed["structure_score"] == 8
    assert parsed["uses_star_method"] is True
    assert len(parsed["strengths"]) == 2


def test_heuristic_feedback_generator():
    question = "Tell me about a time you faced a difficult challenge."
    transcript = "In my last role at TechCorp, the situation was that our production database had high latency. My task was to optimize queries. I decided to implement Redis caching and database indexing. As a result, latency dropped by 45%."
    feedback = generate_heuristic_feedback(question, "behavioral", transcript)
    
    assert feedback.relevance_score >= 7
    assert feedback.structure_score >= 7
    assert feedback.uses_star_method is True
    assert len(feedback.strengths) >= 1
    assert len(feedback.model_answer) > 20


def test_follow_up_probing_endpoint():
    payload = {
        "question_id": 1,
        "question_text": "How do you optimize slow database queries?",
        "category": "technical",
        "role": "swe",
        "difficulty": "Senior",
        "transcript": "I added an index to the table and used Redis to cache read queries."
    }
    response = client.post("/interview/follow-up", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "follow_up_question" in data
    assert len(data["follow_up_question"]) > 10


def test_resume_jd_question_generator():
    payload = {
        "resume_text": "Experienced Python and React full-stack engineer with 4 years building microservices and REST APIs.",
        "jd_text": "We are seeking a Senior Backend Engineer to architect distributed systems handling high transaction volumes with AWS and PostgreSQL.",
        "role": "Backend Engineer",
        "seniority": "Senior",
        "company": "FinTech Corp",
        "target_count": 3
    }
    response = client.post("/interview/generate-from-jd", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["questions"]) >= 1
    assert "role_summary" in data


def test_salary_negotiation_endpoint():
    payload = {
        "role": "Staff Software Engineer",
        "company": "Stripe",
        "base_salary_target": "$220,000",
        "equity_target": "$90,000 / yr",
        "bonus_target": "$30,000",
        "history": [],
        "candidate_message": "Thank you for the initial offer. Based on my current market data and competing offers at this tier, I am targeting $220k base."
    }
    response = client.post("/negotiation/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "recruiter_response" in data
    assert data["negotiation_score"] >= 50
    assert "tactical_tips" in data


def test_cheatsheet_endpoint():
    payload = {
        "role": "Product Manager",
        "seniority": "Senior",
        "company": "Meta",
        "industry": "Social Tech"
    }
    response = client.post("/cheatsheet/generate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["top_questions"]) >= 1
    assert len(data["top_questions_to_ask_interviewer"]) >= 1


def test_debrief_endpoint():
    payload = {
        "company": "Amazon",
        "role": "Senior SDE",
        "interview_date": "2026-09-09",
        "rounds_description": "System design and LP round with Bar Raiser",
        "candidate_notes": "System design went great on distributed caching. Felt good on LP stories with data."
    }
    response = client.post("/debrief/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["pass_probability_pct"] >= 50
    assert "thank_you_email_draft" in data


def test_gamification_profile():
    response = client.get("/gamification/profile")
    assert response.status_code == 200
    data = response.json()
    assert "xp_points" in data
    assert len(data["badges"]) >= 5


def test_analytics_trends():
    response = client.get("/analytics/trends")
    assert response.status_code == 200
    data = response.json()
    assert "avg_overall_score" in data
    assert len(data["domain_proficiencies"]) >= 1
