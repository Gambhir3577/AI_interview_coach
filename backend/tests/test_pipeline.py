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


def test_question_bank_seeding():
    db = SessionLocal()
    try:
        count = db.query(Question).count()
        assert count == 30, f"Expected 30 seed questions, found {count}"

        hr_count = db.query(Question).filter(Question.category == "hr").count()
        tech_count = db.query(Question).filter(Question.category == "technical").count()
        beh_count = db.query(Question).filter(Question.category == "behavioral").count()

        assert hr_count == 10
        assert tech_count == 10
        assert beh_count == 10
    finally:
        db.close()


def test_get_questions_by_category():
    for category in ["hr", "technical", "behavioral"]:
        response = client.get(f"/questions?category={category}")
        assert response.status_code == 200
        data = response.json()
        assert data["category"] == category
        assert len(data["question_text"]) > 10


def test_get_all_questions():
    response = client.get("/questions/all")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 30


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
    # 140 words in 1 minute -> 140 WPM (Ideal)
    wpm, status = calculate_wpm(140, 60.0)
    assert wpm == 140.0
    assert status == "Ideal Pace"

    # 80 words in 1 minute -> 80 WPM (Too Slow)
    wpm, status = calculate_wpm(80, 60.0)
    assert wpm == 80.0
    assert status == "Too Slow"

    # 200 words in 1 minute -> 200 WPM (Too Fast)
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
    assert len(feedback.improvements) >= 1
