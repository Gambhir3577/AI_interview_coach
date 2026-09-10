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

from app.db import (
    InterviewDebrief,
    InterviewSession,
    MentorReview,
    Question,
    TailoredJDQuestion,
    UserGamification,
    get_db,
    init_db,
)
from app.face_tracking_service import analyze_video_frames_mediapipe
from app.llm_service import (
    evaluate_content_feedback,
    generate_follow_up_probe,
    generate_interview_debrief_analysis,
    generate_role_cheat_sheet,
    generate_tailored_jd_questions,
    simulate_salary_negotiation_turn,
)
from app.models import (
    AnalysisReport,
    AnalyticsTrendsResponse,
    BadgeItem,
    CheatSheetGenerateRequest,
    CheatSheetResponse,
    ContentFeedback,
    DebriefRequest,
    DebriefResponse,
    DomainProficiency,
    EyeContactMetrics,
    FollowUpQAItem,
    FollowUpQuestionRequest,
    FollowUpQuestionResponse,
    GamificationProfileResponse,
    MentorReviewRequest,
    MentorReviewResponse,
    QuestionResponse,
    ResumeJDGenerateRequest,
    ResumeJDGenerateResponse,
    SalaryNegotiationTurnRequest,
    SalaryNegotiationTurnResponse,
    SessionHistorySummary,
    WeakSpotAlert,
)
from app.speech_metrics import analyze_speech
from app.whisper_service import extract_audio_from_video, transcribe_audio

app = FastAPI(
    title="AI Interview Coach Pro API",
    description="Multimodal AI interview feedback platform with role-specific tracks, company presets, voice mock interviews, salary negotiation, analytics, and debriefing.",
    version="2.0.0"
)

# Enable CORS
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


# ==========================================
# 1. Question Bank & Tracks
# ==========================================
@app.get("/questions", response_model=QuestionResponse)
def get_random_question(
    category: str | None = Query(None),
    role: str | None = Query(None),
    difficulty: str | None = Query(None),
    company_preset: str | None = Query(None),
    language: str | None = Query(None),
    db: Session = Depends(get_db)
):
    """Returns a random question filtered by category, role, difficulty, or company style preset."""
    query = db.query(Question)
    if category and category.lower() != "all":
        query = query.filter(Question.category == category.lower())
    if role and role.lower() != "all":
        query = query.filter(Question.role == role.lower())
    if difficulty and difficulty.lower() != "all":
        query = query.filter(Question.difficulty.ilike(f"%{difficulty}%"))
    if company_preset and company_preset.lower() != "all" and company_preset.lower() != "general":
        query = query.filter(Question.company_preset == company_preset.lower())
    if language and language.lower() != "all":
        query = query.filter(Question.language == language.lower())

    question = query.order_by(func.random()).first()
    if not question:
        # Fallback to general random question
        question = db.query(Question).order_by(func.random()).first()
        if not question:
            raise HTTPException(status_code=404, detail="No questions found in bank.")

    return QuestionResponse(
        id=question.id,
        category=question.category,
        role=question.role or "general",
        company_preset=question.company_preset or "general",
        question_text=question.question_text,
        tips=question.tips,
        difficulty=question.difficulty or "Intermediate",
        language=question.language or "en",
        star_guidance=question.star_guidance
    )


@app.get("/questions/all", response_model=list[QuestionResponse])
def get_all_questions(
    category: str | None = Query(None),
    role: str | None = Query(None),
    difficulty: str | None = Query(None),
    company_preset: str | None = Query(None),
    language: str | None = Query(None),
    db: Session = Depends(get_db)
):
    """Returns all questions with flexible multi-attribute filtering."""
    query = db.query(Question)
    if category and category.lower() != "all":
        query = query.filter(Question.category == category.lower())
    if role and role.lower() != "all":
        query = query.filter(Question.role == role.lower())
    if difficulty and difficulty.lower() != "all":
        query = query.filter(Question.difficulty.ilike(f"%{difficulty}%"))
    if company_preset and company_preset.lower() != "all":
        query = query.filter(Question.company_preset == company_preset.lower())
    if language and language.lower() != "all":
        query = query.filter(Question.language == language.lower())

    questions = query.order_by(Question.id.asc()).all()
    return [
        QuestionResponse(
            id=q.id,
            category=q.category,
            role=q.role or "general",
            company_preset=q.company_preset or "general",
            question_text=q.question_text,
            tips=q.tips,
            difficulty=q.difficulty or "Intermediate",
            language=q.language or "en",
            star_guidance=q.star_guidance
        )
        for q in questions
    ]


# ==========================================
# 2. Comprehensive Multimodal Analysis Pipeline
# ==========================================
def calculate_overall_composite_score(
    relevance_score: int,
    structure_score: int,
    clarity_score: int,
    depth_score: int,
    wpm: float,
    filler_rate_per_100: float,
    eye_contact_pct: float,
    posture_score: int,
    confidence_score: int
) -> int:
    """Computes a balanced 0-100 composite index combining content, speech delivery, body language, and confidence."""
    # Content sub-score (0-40)
    content_sub = (relevance_score * 1.0) + (structure_score * 1.0) + (clarity_score * 1.0) + (depth_score * 1.0)

    # Speaking Pace (0-15)
    if 120 <= wpm <= 160:
        pace_sub = 15.0
    elif 100 <= wpm < 120 or 160 < wpm <= 180:
        pace_sub = 11.0
    elif 80 <= wpm < 100 or 180 < wpm <= 200:
        pace_sub = 7.0
    else:
        pace_sub = 4.0 if wpm > 0 else 0.0

    # Filler Control (0-15)
    if filler_rate_per_100 <= 1.5:
        filler_sub = 15.0
    elif filler_rate_per_100 <= 3.5:
        filler_sub = 11.0
    elif filler_rate_per_100 <= 6.0:
        filler_sub = 7.0
    else:
        filler_sub = 3.0

    # Eye contact & Posture (0-15)
    eye_sub = (eye_contact_pct / 100.0) * 8.0 + (posture_score / 100.0) * 7.0

    # Confidence Index (0-15)
    conf_sub = (confidence_score / 100.0) * 15.0

    overall = int(round(content_sub + pace_sub + filler_sub + eye_sub + conf_sub))
    return max(0, min(100, overall))


@app.post("/analyze", response_model=AnalysisReport)
async def analyze_interview_recording(
    video: UploadFile = File(...),
    question_id: int = Form(...),
    category: str | None = Form(None),
    role: str | None = Form("general"),
    difficulty: str | None = Form("Intermediate"),
    company_preset: str | None = Form("general"),
    timer_limit_sec: int = Form(90),
    question_text: str | None = Form(None),
    follow_up_qa_json: str | None = Form("[]"),
    db: Session = Depends(get_db)
):
    """Full multimodal processing pipeline."""
    # Look up question record
    q_record = db.query(Question).filter(Question.id == question_id).first()
    if q_record:
        actual_category = q_record.category
        actual_role = q_record.role or role or "general"
        actual_diff = q_record.difficulty or difficulty or "Intermediate"
        actual_company = q_record.company_preset or company_preset or "general"
        actual_question_text = q_record.question_text
    else:
        actual_category = category or "general"
        actual_role = role or "general"
        actual_diff = difficulty or "Intermediate"
        actual_company = company_preset or "general"
        actual_question_text = question_text or "Interview Question"

    temp_dir = tempfile.mkdtemp(prefix="interview_")
    video_ext = os.path.splitext(video.filename or "")[1] or ".webm"
    temp_video_path = os.path.join(temp_dir, f"recording{video_ext}")
    temp_audio_path = os.path.join(temp_dir, "audio.wav")

    try:
        # 1. Save uploaded video
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

        # 4. Speech Metrics, Filler & Confidence
        speech_metrics, tokens = analyze_speech(
            transcript=transcript,
            duration_seconds=duration_seconds,
            audio_wav_path=temp_audio_path if audio_extracted else None
        )

        # 5. Eye Contact & Head Posture
        eye_metrics = analyze_video_frames_mediapipe(temp_video_path, sample_fps=1.0)

        # 6. LLM Content Evaluation & Model Answer
        content_feedback = evaluate_content_feedback(
            question=actual_question_text,
            category=actual_category,
            transcript=transcript,
            role=actual_role,
            difficulty=actual_diff
        )

        # 7. Composite Overall Score
        overall_score = calculate_overall_composite_score(
            relevance_score=content_feedback.relevance_score,
            structure_score=content_feedback.structure_score,
            clarity_score=content_feedback.clarity_score,
            depth_score=content_feedback.depth_score,
            wpm=speech_metrics.wpm,
            filler_rate_per_100=speech_metrics.filler_rate_per_100,
            eye_contact_pct=eye_metrics.eye_contact_percentage,
            posture_score=eye_metrics.posture_score,
            confidence_score=speech_metrics.confidence_score
        )

        session_id = str(uuid.uuid4())
        created_at_dt = datetime.now(timezone.utc)
        created_at_str = created_at_dt.strftime("%Y-%m-%d %H:%M:%S")

        parsed_follow_ups = []
        try:
            parsed_follow_ups = json.loads(follow_up_qa_json or "[]")
        except Exception:
            parsed_follow_ups = []

        # 8. Save session in SQLite database
        session_record = InterviewSession(
            id=session_id,
            question_id=question_id,
            category=actual_category,
            role=actual_role,
            company_preset=actual_company,
            difficulty=actual_diff,
            question_text=actual_question_text,
            duration_seconds=speech_metrics.duration_seconds,
            timer_limit_sec=timer_limit_sec,
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
            confidence_score=speech_metrics.confidence_score,
            hesitation_rate=speech_metrics.hesitation_rate,
            sentiment_tone=speech_metrics.sentiment_tone,
            eye_contact_percentage=eye_metrics.eye_contact_percentage,
            total_frames_analyzed=eye_metrics.total_frames_analyzed,
            looking_at_camera_frames=eye_metrics.looking_at_camera_frames,
            timeline_sampled=json.dumps([s.dict() for s in eye_metrics.timeline_sampled]),
            posture_score=eye_metrics.posture_score,
            posture_status=eye_metrics.posture_status,
            relevance_score=content_feedback.relevance_score,
            structure_score=content_feedback.structure_score,
            clarity_score=content_feedback.clarity_score,
            depth_score=content_feedback.depth_score,
            uses_star_method=content_feedback.uses_star_method,
            strengths=json.dumps(content_feedback.strengths),
            improvements=json.dumps(content_feedback.improvements),
            weak_areas=json.dumps(content_feedback.weak_spots),
            model_answer=content_feedback.model_answer,
            follow_up_qa=json.dumps(parsed_follow_ups),
            overall_summary=content_feedback.overall_summary,
            overall_score=overall_score,
            created_at=created_at_dt
        )
        db.add(session_record)
        
        # 9. Update Gamification stats
        gamification = db.query(UserGamification).filter(UserGamification.user_id == "default_user").first()
        if not gamification:
            gamification = UserGamification(
                user_id="default_user",
                streak_days=1,
                total_practice_seconds=int(speech_metrics.duration_seconds),
                total_sessions_completed=1,
                xp_points=150,
                unlocked_badges=json.dumps(["first_pitch"]),
                last_practice_date=created_at_dt.strftime("%Y-%m-%d")
            )
            db.add(gamification)
        else:
            gamification.total_practice_seconds += int(speech_metrics.duration_seconds)
            gamification.total_sessions_completed += 1
            gamification.xp_points += 75 if overall_score >= 80 else 50
            
            # Badge checks
            unlocked = json.loads(gamification.unlocked_badges or "[]")
            if "first_pitch" not in unlocked:
                unlocked.append("first_pitch")
            if overall_score >= 85 and "star_master" not in unlocked and content_feedback.uses_star_method:
                unlocked.append("star_master")
            if speech_metrics.filler_count == 0 and speech_metrics.duration_seconds >= 30 and "zero_fillers" not in unlocked:
                unlocked.append("zero_fillers")
            if eye_metrics.eye_contact_percentage >= 80 and "locked_in" not in unlocked:
                unlocked.append("locked_in")
            if actual_company.lower() in ["amazon", "google"] and "faang_ready" not in unlocked:
                unlocked.append("faang_ready")
            gamification.unlocked_badges = json.dumps(unlocked)

        db.commit()

        follow_up_items = [FollowUpQAItem(**x) for x in parsed_follow_ups]

        return AnalysisReport(
            session_id=session_id,
            question_id=question_id,
            category=actual_category,
            role=actual_role,
            company_preset=actual_company,
            difficulty=actual_diff,
            question_text=actual_question_text,
            transcript=transcript,
            tokens=tokens,
            speech_metrics=speech_metrics,
            eye_contact_metrics=eye_metrics,
            content_feedback=content_feedback,
            overall_score=overall_score,
            timer_limit_sec=timer_limit_sec,
            follow_up_qa=follow_up_items,
            created_at=created_at_str
        )

    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


# ==========================================
# 3. History & Session Details
# ==========================================
@app.get("/history", response_model=list[SessionHistorySummary])
def get_session_history(
    limit: int = Query(30, ge=1, le=100),
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
            role=s.role or "general",
            company_preset=s.company_preset or "general",
            difficulty=s.difficulty or "Intermediate",
            question_text=s.question_text,
            duration_seconds=s.duration_seconds,
            overall_score=s.overall_score,
            wpm=s.wpm,
            wpm_status=s.wpm_status,
            filler_count=s.filler_count,
            eye_contact_percentage=s.eye_contact_percentage,
            confidence_score=s.confidence_score or 75,
            relevance_score=s.relevance_score,
            structure_score=s.structure_score,
            clarity_score=s.clarity_score or 7,
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
    weak_areas_list = json.loads(s.weak_areas or "[]")
    follow_up_list = [FollowUpQAItem(**item) for item in json.loads(s.follow_up_qa or "[]")]

    speech_metrics, tokens = analyze_speech(s.transcript or "", s.duration_seconds)
    speech_metrics.pauses_over_3s = s.pauses_over_3s
    speech_metrics.total_pause_time = s.total_pause_time
    speech_metrics.confidence_score = s.confidence_score or 75
    speech_metrics.hesitation_rate = s.hesitation_rate or 0.0
    speech_metrics.sentiment_tone = s.sentiment_tone or "Calm & Professional"

    return AnalysisReport(
        session_id=s.id,
        question_id=s.question_id,
        category=s.category,
        role=s.role or "general",
        company_preset=s.company_preset or "general",
        difficulty=s.difficulty or "Intermediate",
        question_text=s.question_text,
        transcript=s.transcript or "",
        tokens=tokens,
        speech_metrics=speech_metrics,
        eye_contact_metrics=EyeContactMetrics(
            eye_contact_percentage=s.eye_contact_percentage,
            total_frames_analyzed=s.total_frames_analyzed,
            looking_at_camera_frames=s.looking_at_camera_frames,
            timeline_sampled=timeline,
            posture_score=s.posture_score or 85,
            posture_status=s.posture_status or "Centered & Stable"
        ),
        content_feedback=ContentFeedback(
            relevance_score=s.relevance_score,
            structure_score=s.structure_score,
            clarity_score=s.clarity_score or 7,
            depth_score=s.depth_score or 7,
            uses_star_method=s.uses_star_method,
            strengths=strengths_list,
            improvements=improvements_list,
            weak_spots=weak_areas_list,
            model_answer=s.model_answer or "",
            overall_summary=s.overall_summary or ""
        ),
        overall_score=s.overall_score,
        timer_limit_sec=s.timer_limit_sec or 90,
        follow_up_qa=follow_up_list,
        created_at=s.created_at.strftime("%Y-%m-%d %H:%M:%S") if s.created_at else ""
    )


# ==========================================
# 4. Probing Follow-Up Endpoint
# ==========================================
@app.post("/interview/follow-up", response_model=FollowUpQuestionResponse)
def get_follow_up_question(req: FollowUpQuestionRequest):
    """Generates an adaptive interviewer follow-up question based on what user just said."""
    return generate_follow_up_probe(
        question=req.question_text,
        category=req.category,
        role=req.role,
        difficulty=req.difficulty,
        transcript=req.transcript
    )


# ==========================================
# 5. Resume / JD Matcher Endpoint
# ==========================================
@app.post("/interview/generate-from-jd", response_model=ResumeJDGenerateResponse)
def generate_questions_from_resume_and_jd(
    req: ResumeJDGenerateRequest,
    db: Session = Depends(get_db)
):
    """Extracts candidate profile & JD requirements to auto-generate 5 tailored interview questions."""
    result = generate_tailored_jd_questions(
        resume_text=req.resume_text,
        jd_text=req.jd_text,
        role=req.role,
        seniority=req.seniority,
        company=req.company,
        target_count=req.target_count
    )

    # Persist generated questions to DB for reference
    for q_item in result.questions:
        try:
            db.add(TailoredJDQuestion(
                user_id="default_user",
                role=req.role,
                company=req.company,
                job_title=f"{req.seniority} {req.role}",
                question_text=q_item.question_text,
                tips=q_item.tips,
                difficulty=q_item.difficulty,
                relevance_reason=q_item.why_relevant
            ))
        except Exception:
            pass
    db.commit()

    return result


# ==========================================
# 6. Salary Negotiation Simulator
# ==========================================
@app.post("/negotiation/chat", response_model=SalaryNegotiationTurnResponse)
def salary_negotiation_turn(req: SalaryNegotiationTurnRequest):
    """Simulates interactive salary negotiation with an AI Recruiter/Hiring Manager."""
    return simulate_salary_negotiation_turn(
        role=req.role,
        company=req.company,
        base=req.base_salary_target,
        equity=req.equity_target,
        bonus=req.bonus_target,
        history=req.history,
        candidate_message=req.candidate_message
    )


# ==========================================
# 7. Role Cheat Sheet Generator
# ==========================================
@app.post("/cheatsheet/generate", response_model=CheatSheetResponse)
def get_role_cheat_sheet(req: CheatSheetGenerateRequest):
    """Generates a comprehensive, downloadable Q&A cheat sheet for any role and seniority."""
    return generate_role_cheat_sheet(
        role=req.role,
        seniority=req.seniority,
        company=req.company,
        industry=req.industry
    )


# ==========================================
# 8. Post-Interview Debrief
# ==========================================
@app.post("/debrief/analyze", response_model=DebriefResponse)
def analyze_interview_debrief(
    req: DebriefRequest,
    db: Session = Depends(get_db)
):
    """Analyzes real candidate interview notes, calculates pass probability, and drafts thank-you email."""
    result = generate_interview_debrief_analysis(
        company=req.company,
        role=req.role,
        interview_date=req.interview_date or datetime.now().strftime("%Y-%m-%d"),
        rounds_description=req.rounds_description,
        candidate_notes=req.candidate_notes
    )

    try:
        debrief_record = InterviewDebrief(
            id=result.debrief_id,
            user_id="default_user",
            company=req.company,
            role=req.role,
            interview_date=req.interview_date,
            rounds_description=req.rounds_description,
            candidate_notes=req.candidate_notes,
            pass_probability_pct=result.pass_probability_pct,
            strengths_observed=json.dumps(result.strengths_observed),
            flags_and_risks=json.dumps(result.potential_risks_or_flags),
            next_round_tips=json.dumps(result.next_round_strategy),
            thank_you_email=result.thank_you_email_draft
        )
        db.add(debrief_record)
        db.commit()
    except Exception as e:
        print(f"[Debrief Persistence Note] {e}")

    return result


# ==========================================
# 9. Gamification & Streaks
# ==========================================
ALL_BADGES = [
    BadgeItem(id="first_pitch", title="First Pitch", description="Completed your first live interview recording.", icon="🎙️", unlocked=True, unlocked_at="2026-09-01"),
    BadgeItem(id="star_master", title="STAR Virtuoso", description="Delivered a behavioral answer adhering to STAR with score ≥ 85.", icon="★", unlocked=False),
    BadgeItem(id="zero_fillers", title="Silver Tongue", description="Zero filler words in a >30 second answer.", icon="🛡️", unlocked=False),
    BadgeItem(id="locked_in", title="Laser Focus", description="Maintained ≥ 80% eye contact camera alignment.", icon="👀", unlocked=False),
    BadgeItem(id="pace_master", title="Rhythm King", description="Maintained optimal speaking pace (130-150 WPM).", icon="⚡", unlocked=True, unlocked_at="2026-09-05"),
    BadgeItem(id="faang_ready", title="FAANG Veteran", description="Completed practice sessions for Amazon or Google presets.", icon="🚀", unlocked=False),
    BadgeItem(id="streak_warrior", title="7-Day Streak", description="Practiced consistently for 7 consecutive days.", icon="🔥", unlocked=False),
]


@app.get("/gamification/profile", response_model=GamificationProfileResponse)
def get_gamification_profile(db: Session = Depends(get_db)):
    """Returns streaks, XP, level, and unlocked achievement badges."""
    gamification = db.query(UserGamification).filter(UserGamification.user_id == "default_user").first()
    unlocked_ids = set(json.loads(gamification.unlocked_badges or "[]")) if gamification else {"first_pitch", "pace_master"}
    
    badge_list = []
    for b in ALL_BADGES:
        is_unlocked = b.id in unlocked_ids
        badge_list.append(BadgeItem(
            id=b.id,
            title=b.title,
            description=b.description,
            icon=b.icon,
            unlocked=is_unlocked,
            unlocked_at=b.unlocked_at if is_unlocked else None
        ))

    total_secs = gamification.total_practice_seconds if gamification else 420
    total_sessions = gamification.total_sessions_completed if gamification else db.query(InterviewSession).count()
    xp = gamification.xp_points if gamification else 350
    level = max(1, xp // 200)

    level_titles = ["Novice Candidate", "Confident Speaker", "Articulate Storyteller", "Interview Maestro", "Principal Leader"]
    title = level_titles[min(len(level_titles) - 1, level - 1)]

    return GamificationProfileResponse(
        user_id="default_user",
        streak_days=gamification.streak_days if gamification else 3,
        total_practice_minutes=round(total_secs / 60),
        total_sessions_completed=total_sessions,
        xp_points=xp,
        current_level=level,
        level_title=title,
        badges=badge_list,
        daily_goal_sessions=2,
        daily_completed_sessions=min(2, total_sessions)
    )


# ==========================================
# 10. Analytics & Trends Over Time
# ==========================================
@app.get("/analytics/trends", response_model=AnalyticsTrendsResponse)
def get_analytics_trends(db: Session = Depends(get_db)):
    """Computes candidate improvement trends, domain proficiency radar, and identified weak areas."""
    sessions = db.query(InterviewSession).order_by(InterviewSession.created_at.asc()).all()
    total_count = len(sessions)

    if total_count == 0:
        return AnalyticsTrendsResponse(
            total_sessions=0,
            avg_overall_score=80,
            avg_wpm=135.0,
            avg_eye_contact_pct=75.0,
            score_history_timeline=[],
            domain_proficiencies=[
                DomainProficiency(domain="Technical & Systems", score=82, session_count=0),
                DomainProficiency(domain="STAR Behavioral", score=78, session_count=0),
                DomainProficiency(domain="HR & Culture Fit", score=85, session_count=0),
                DomainProficiency(domain="Product Strategy", score=75, session_count=0),
            ],
            identified_weak_spots=[
                WeakSpotAlert(skill_name="Result Quantification", frequency_flagged=2, recommendation="Incorporate measurable business metrics (percentages, latency, revenue)."),
                WeakSpotAlert(skill_name="Filler Hesitations", frequency_flagged=1, recommendation="Pause silently for 1 second instead of saying 'like' or 'basically'.")
            ],
            adaptive_recommended_level="Intermediate"
        )

    timeline = []
    sum_score = 0
    sum_wpm = 0.0
    sum_eye = 0.0

    domain_scores: dict[str, list[int]] = {}
    weak_spots_map: dict[str, int] = {}

    for idx, s in enumerate(sessions):
        score = s.overall_score or 75
        sum_score += score
        sum_wpm += s.wpm or 130
        sum_eye += s.eye_contact_percentage or 70

        timeline.append({
            "session_number": idx + 1,
            "date": s.created_at.strftime("%b %d") if s.created_at else f"S{idx+1}",
            "overall_score": score,
            "wpm": s.wpm,
            "eye_contact": s.eye_contact_percentage,
            "category": s.category
        })

        cat_key = s.category.title()
        if cat_key not in domain_scores:
            domain_scores[cat_key] = []
        domain_scores[cat_key].append(score)

        weak_list = json.loads(s.weak_areas or "[]")
        for w in weak_list:
            weak_spots_map[w] = weak_spots_map.get(w, 0) + 1

    avg_score = round(sum_score / total_count)
    avg_wpm = round(sum_wpm / total_count, 1)
    avg_eye = round(sum_eye / total_count, 1)

    proficiencies = [
        DomainProficiency(
            domain=dom,
            score=round(sum(scs) / len(scs)),
            session_count=len(scs)
        )
        for dom, scs in domain_scores.items()
    ]

    weak_alerts = [
        WeakSpotAlert(
            skill_name=skill,
            frequency_flagged=freq,
            recommendation=f"Prioritize targeted drills on '{skill}' to eliminate recurrent score penalties."
        )
        for skill, freq in sorted(weak_spots_map.items(), key=lambda x: -x[1])[:4]
    ]

    if not weak_alerts:
        weak_alerts = [
            WeakSpotAlert(
                skill_name="Measurable Results (STAR)",
                frequency_flagged=1,
                recommendation="Anchor behavioral conclusions with concrete quantifiable impacts."
            )
        ]

    # Adaptive recommendation
    if avg_score >= 85:
        adaptive_level = "Senior / Lead (Advanced probes)"
    elif avg_score >= 70:
        adaptive_level = "Intermediate / Senior"
    else:
        adaptive_level = "Foundational / Intermediate"

    return AnalyticsTrendsResponse(
        total_sessions=total_count,
        avg_overall_score=avg_score,
        avg_wpm=avg_wpm,
        avg_eye_contact_pct=avg_eye,
        score_history_timeline=timeline,
        domain_proficiencies=proficiencies,
        identified_weak_spots=weak_alerts,
        adaptive_recommended_level=adaptive_level
    )


# ==========================================
# 11. Peer / Mentor Review Sharing
# ==========================================
@app.get("/share/{session_id}")
def get_shared_session_for_review(session_id: str, db: Session = Depends(get_db)):
    """Retrieves session report and any submitted mentor reviews for peer review sharing."""
    s = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found.")

    reviews = db.query(MentorReview).filter(MentorReview.session_id == session_id).all()
    review_items = [
        MentorReviewResponse(
            id=r.id,
            session_id=r.session_id,
            reviewer_name=r.reviewer_name,
            reviewer_role=r.reviewer_role,
            overall_rating=r.overall_rating,
            structure_rating=r.structure_rating,
            clarity_rating=r.clarity_rating,
            delivery_rating=r.delivery_rating,
            feedback_text=r.feedback_text,
            actionable_tips=json.loads(r.actionable_tips or "[]"),
            created_at=r.created_at.strftime("%b %d, %Y %H:%M") if r.created_at else ""
        )
        for r in reviews
    ]

    return {
        "session_id": s.id,
        "question_text": s.question_text,
        "category": s.category,
        "transcript": s.transcript,
        "overall_score": s.overall_score,
        "wpm": s.wpm,
        "eye_contact_percentage": s.eye_contact_percentage,
        "model_answer": s.model_answer or "",
        "reviews": review_items
    }


@app.post("/share/{session_id}/review", response_model=MentorReviewResponse)
def submit_mentor_review(
    session_id: str,
    req: MentorReviewRequest,
    db: Session = Depends(get_db)
):
    """Submits peer / mentor structured scorecard feedback for a shared session."""
    s = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found.")

    review_id = str(uuid.uuid4())
    now_dt = datetime.now(timezone.utc)
    review_record = MentorReview(
        id=review_id,
        session_id=session_id,
        reviewer_name=req.reviewer_name or "Anonymous Mentor",
        reviewer_role=req.reviewer_role or "Peer Reviewer",
        overall_rating=req.overall_rating,
        structure_rating=req.structure_rating,
        clarity_rating=req.clarity_rating,
        delivery_rating=req.delivery_rating,
        feedback_text=req.feedback_text,
        actionable_tips=json.dumps(req.actionable_tips or []),
        created_at=now_dt
    )
    db.add(review_record)
    db.commit()

    return MentorReviewResponse(
        id=review_id,
        session_id=session_id,
        reviewer_name=req.reviewer_name,
        reviewer_role=req.reviewer_role,
        overall_rating=req.overall_rating,
        structure_rating=req.structure_rating,
        clarity_rating=req.clarity_rating,
        delivery_rating=req.delivery_rating,
        feedback_text=req.feedback_text,
        actionable_tips=req.actionable_tips or [],
        created_at=now_dt.strftime("%b %d, %Y %H:%M")
    )
