import json
import os
import shutil
import tempfile
import uuid
from datetime import datetime, timezone

from fastapi import Depends, FastAPI, File, Form, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.sql.expression import func

from app.db import InterviewSession, Question, get_db, init_db
from app.face_tracking_service import analyze_video_frames_mediapipe
from app.llm_service import evaluate_content_feedback
from app.models import (
    AnalysisReport,
    ContentFeedback,
    EyeContactMetrics,
    QuestionResponse,
    SessionHistorySummary,
)
from app.speech_metrics import analyze_speech
from app.whisper_service import extract_audio_from_video, transcribe_audio

app = FastAPI(
    title="AI Interview Coach API",
    description="Automated interview feedback analyzing speech pace, filler words, content quality, and eye contact.",
    version="1.0.0"
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "whisper_model": os.environ.get("WHISPER_MODEL", "base"),
        "anthropic_configured": bool(os.environ.get("ANTHROPIC_API_KEY", "").strip())
    }


@app.get("/questions", response_model=QuestionResponse)
def get_random_question(
    category: str | None = Query(None, description="Category: 'hr', 'technical', or 'behavioral'"),
    db: Session = Depends(get_db)
):
    """Returns a random interview question, optionally filtered by category."""
    query = db.query(Question)
    if category and category.lower() != "all":
        query = query.filter(Question.category == category.lower())
    
    question = query.order_by(func.random()).first()
    if not question:
        raise HTTPException(status_code=404, detail="No questions found for the requested category.")
    
    return QuestionResponse(
        id=question.id,
        category=question.category,
        question_text=question.question_text,
        tips=question.tips,
        difficulty=question.difficulty
    )


@app.get("/questions/all", response_model=list[QuestionResponse])
def get_all_questions(
    category: str | None = Query(None),
    db: Session = Depends(get_db)
):
    """Returns all questions in the bank."""
    query = db.query(Question)
    if category and category.lower() != "all":
        query = query.filter(Question.category == category.lower())
    
    questions = query.order_by(Question.id.asc()).all()
    return [
        QuestionResponse(
            id=q.id,
            category=q.category,
            question_text=q.question_text,
            tips=q.tips,
            difficulty=q.difficulty
        )
        for q in questions
    ]


def calculate_overall_composite_score(
    relevance_score: int,  # 1-10
    structure_score: int,  # 1-10
    wpm: float,
    filler_rate_per_100: float,
    eye_contact_pct: float
) -> int:
    """
    Computes a balanced composite score (0-100) combining:
    - Content Relevance (25%)
    - Content Structure (25%)
    - Speaking Pace WPM (20%)
    - Fluency / Filler Control (15%)
    - Eye Contact Engagement (15%)
    """
    # Content sub-score (0-50)
    content_sub = (relevance_score * 2.5) + (structure_score * 2.5)

    # Pace sub-score (0-20)
    if 120 <= wpm <= 160:
        pace_sub = 20.0
    elif 100 <= wpm < 120 or 160 < wpm <= 180:
        pace_sub = 15.0
    elif 80 <= wpm < 100 or 180 < wpm <= 200:
        pace_sub = 10.0
    else:
        pace_sub = 5.0 if wpm > 0 else 0.0

    # Filler sub-score (0-15)
    if filler_rate_per_100 <= 1.5:
        filler_sub = 15.0
    elif filler_rate_per_100 <= 3.5:
        filler_sub = 12.0
    elif filler_rate_per_100 <= 6.0:
        filler_sub = 8.0
    else:
        filler_sub = 4.0

    # Eye contact sub-score (0-15)
    eye_sub = (eye_contact_pct / 100.0) * 15.0

    overall = int(round(content_sub + pace_sub + filler_sub + eye_sub))
    return max(0, min(100, overall))


@app.post("/analyze", response_model=AnalysisReport)
async def analyze_interview_recording(
    video: UploadFile = File(...),
    question_id: int = Form(...),
    category: str | None = Form(None),
    question_text: str | None = Form(None),
    db: Session = Depends(get_db)
):
    """
    Full multimodal processing pipeline:
    1. Save uploaded video
    2. Extract audio track with ffmpeg
    3. Run Whisper transcription
    4. Compute speech metrics (WPM, fillers, pauses)
    5. Run MediaPipe/gaze tracking for eye contact engagement
    6. Evaluate content quality via Anthropic LLM
    7. Persist session to SQLite and return complete AnalysisReport
    """
    # Verify question details
    q_record = db.query(Question).filter(Question.id == question_id).first()
    if q_record:
        actual_category = q_record.category
        actual_question_text = q_record.question_text
    else:
        actual_category = category or "general"
        actual_question_text = question_text or "Interview Question"

    # Temporary directory for video/audio processing
    temp_dir = tempfile.mkdtemp(prefix="interview_")
    video_ext = os.path.splitext(video.filename or "")[1] or ".webm"
    temp_video_path = os.path.join(temp_dir, f"recording{video_ext}")
    temp_audio_path = os.path.join(temp_dir, "audio.wav")

    try:
        # 1. Save uploaded video to disk
        with open(temp_video_path, "wb") as f:
            content = await video.read()
            f.write(content)

        # 2. Extract audio track
        audio_extracted = False
        try:
            extract_audio_from_video(temp_video_path, temp_audio_path)
            audio_extracted = True
        except Exception as e:
            print(f"[Analysis Pipeline] Audio extraction warning: {e}")

        # 3. Whisper Speech-to-Text
        transcript = ""
        duration_seconds = 0.0
        if audio_extracted and os.path.exists(temp_audio_path):
            try:
                whisper_result = transcribe_audio(temp_audio_path)
                transcript = whisper_result.get("text", "").strip()
                duration_seconds = whisper_result.get("duration_seconds", 0.0)
            except Exception as e:
                print(f"[Analysis Pipeline] Whisper transcription error: {e}")
                transcript = ""

        # 4. Speech Metrics & Filler Tokenization
        speech_metrics, tokens = analyze_speech(
            transcript=transcript,
            duration_seconds=duration_seconds,
            audio_wav_path=temp_audio_path if audio_extracted else None
        )

        # 5. Eye Contact & Engagement Tracking
        eye_metrics = analyze_video_frames_mediapipe(temp_video_path, sample_fps=1.0)

        # 6. LLM Content Evaluation
        content_feedback = evaluate_content_feedback(
            question=actual_question_text,
            category=actual_category,
            transcript=transcript
        )

        # 7. Composite Overall Score
        overall_score = calculate_overall_composite_score(
            relevance_score=content_feedback.relevance_score,
            structure_score=content_feedback.structure_score,
            wpm=speech_metrics.wpm,
            filler_rate_per_100=speech_metrics.filler_rate_per_100,
            eye_contact_pct=eye_metrics.eye_contact_percentage
        )

        session_id = str(uuid.uuid4())
        created_at_dt = datetime.now(timezone.utc)
        created_at_str = created_at_dt.strftime("%Y-%m-%d %H:%M:%S")

        # 8. Save session in SQLite database
        session_record = InterviewSession(
            id=session_id,
            question_id=question_id,
            category=actual_category,
            question_text=actual_question_text,
            duration_seconds=speech_metrics.duration_seconds,
            transcript=transcript,
            total_words=speech_metrics.total_words,
            wpm=speech_metrics.wpm,
            wpm_status=speech_metrics.wpm_status,
            filler_count=speech_metrics.filler_count,
            filler_rate_per_100=speech_metrics.filler_rate_per_100,
            filler_breakdown=json.dumps(speech_metrics.filler_breakdown),
            pauses_over_3s=speech_metrics.pauses_over_3s,
            total_pause_time=speech_metrics.total_pause_time,
            pause_details=json.dumps([p.dict() for p in speech_metrics.pause_details]),
            eye_contact_percentage=eye_metrics.eye_contact_percentage,
            total_frames_analyzed=eye_metrics.total_frames_analyzed,
            looking_at_camera_frames=eye_metrics.looking_at_camera_frames,
            timeline_sampled=json.dumps([s.dict() for s in eye_metrics.timeline_sampled]),
            relevance_score=content_feedback.relevance_score,
            structure_score=content_feedback.structure_score,
            uses_star_method=content_feedback.uses_star_method,
            strengths=json.dumps(content_feedback.strengths),
            improvements=json.dumps(content_feedback.improvements),
            overall_summary=content_feedback.overall_summary,
            overall_score=overall_score,
            created_at=created_at_dt
        )
        db.add(session_record)
        db.commit()

        return AnalysisReport(
            session_id=session_id,
            question_id=question_id,
            category=actual_category,
            question_text=actual_question_text,
            transcript=transcript,
            tokens=tokens,
            speech_metrics=speech_metrics,
            eye_contact_metrics=eye_metrics,
            content_feedback=content_feedback,
            overall_score=overall_score,
            created_at=created_at_str
        )

    finally:
        # Clean up temporary files
        shutil.rmtree(temp_dir, ignore_errors=True)


@app.get("/history", response_model=list[SessionHistorySummary])
def get_session_history(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Returns summaries of past interview practice sessions."""
    sessions = db.query(InterviewSession).order_by(InterviewSession.created_at.desc()).limit(limit).all()
    results = []
    for s in sessions:
        results.append(SessionHistorySummary(
            id=s.id,
            question_id=s.question_id,
            category=s.category,
            question_text=s.question_text,
            duration_seconds=s.duration_seconds,
            overall_score=s.overall_score,
            wpm=s.wpm,
            wpm_status=s.wpm_status,
            filler_count=s.filler_count,
            eye_contact_percentage=s.eye_contact_percentage,
            relevance_score=s.relevance_score,
            structure_score=s.structure_score,
            created_at=s.created_at.strftime("%b %d, %Y %H:%M") if s.created_at else ""
        ))
    return results


@app.get("/history/{session_id}", response_model=AnalysisReport)
def get_session_detail(session_id: str, db: Session = Depends(get_db)):
    """Retrieves full analysis report for a specific past session."""
    s = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found.")

    timeline = [json.loads(x) if isinstance(x, str) else x for x in json.loads(s.timeline_sampled or "[]")]
    strengths_list = json.loads(s.strengths or "[]")
    improvements_list = json.loads(s.improvements or "[]")

    speech_metrics, tokens = analyze_speech(s.transcript or "", s.duration_seconds)
    # Restore saved pause details
    speech_metrics.pauses_over_3s = s.pauses_over_3s
    speech_metrics.total_pause_time = s.total_pause_time

    return AnalysisReport(
        session_id=s.id,
        question_id=s.question_id,
        category=s.category,
        question_text=s.question_text,
        transcript=s.transcript or "",
        tokens=tokens,
        speech_metrics=speech_metrics,
        eye_contact_metrics=EyeContactMetrics(
            eye_contact_percentage=s.eye_contact_percentage,
            total_frames_analyzed=s.total_frames_analyzed,
            looking_at_camera_frames=s.looking_at_camera_frames,
            timeline_sampled=timeline
        ),
        content_feedback=ContentFeedback(
            relevance_score=s.relevance_score,
            structure_score=s.structure_score,
            uses_star_method=s.uses_star_method,
            strengths=strengths_list,
            improvements=improvements_list,
            overall_summary=s.overall_summary or ""
        ),
        overall_score=s.overall_score,
        created_at=s.created_at.strftime("%Y-%m-%d %H:%M:%S") if s.created_at else ""
    )
