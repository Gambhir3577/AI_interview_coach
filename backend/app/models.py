from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class QuestionResponse(BaseModel):
    id: int
    category: str
    role: str = "general"
    company_preset: str = "general"
    question_text: str
    tips: Optional[str] = None
    difficulty: str = "Intermediate"
    language: str = "en"
    star_guidance: Optional[str] = None


class PauseDetail(BaseModel):
    start_time: float
    end_time: float
    duration_seconds: float


class SpeechMetrics(BaseModel):
    total_words: int
    duration_seconds: float
    wpm: float
    wpm_status: str  # "Too Slow", "Slightly Slow", "Ideal Pace", "Slightly Fast", "Too Fast"
    ideal_wpm_range: str = "120 - 160 WPM"
    filler_count: int
    filler_rate_per_100: float
    filler_breakdown: Dict[str, int]
    pauses_over_3s: int
    total_pause_time: float
    pause_details: List[PauseDetail] = Field(default_factory=list)
    confidence_score: int = Field(75, ge=0, le=100, description="Estimated vocal confidence index")
    hesitation_rate: float = Field(0.0, description="Hesitations and filler pause frequency per minute")
    sentiment_tone: str = "Calm & Professional"  # "Assertive", "Enthusiastic", "Calm & Professional", "Analytical", "Hesitant"
    cadence_consistency: str = "Steady & Controlled"


class FrameGazeSample(BaseModel):
    timestamp_sec: float
    looking_at_camera: bool
    confidence: float = 1.0


class EyeContactMetrics(BaseModel):
    eye_contact_percentage: float
    total_frames_analyzed: int
    looking_at_camera_frames: int
    timeline_sampled: List[FrameGazeSample] = Field(default_factory=list)
    posture_score: int = Field(85, ge=0, le=100)
    posture_status: str = "Centered & Stable"  # "Centered & Stable", "Slightly Off-Center", "High Head Movement"
    disclaimer: str = (
        "Engagement & eye-contact proxy calculated via facial landmark and iris alignment. "
        "Does not measure subconscious intent."
    )


class StarStageBreakdown(BaseModel):
    situation_score: Optional[int] = Field(None, ge=1, le=10)
    task_score: Optional[int] = Field(None, ge=1, le=10)
    action_score: Optional[int] = Field(None, ge=1, le=10)
    result_score: Optional[int] = Field(None, ge=1, le=10)
    feedback: Optional[str] = None


class ContentFeedback(BaseModel):
    relevance_score: int = Field(..., ge=1, le=10, description="1-10 relevance to question")
    structure_score: int = Field(..., ge=1, le=10, description="1-10 organization of answer")
    clarity_score: int = Field(7, ge=1, le=10, description="1-10 clarity & precision of expression")
    depth_score: int = Field(7, ge=1, le=10, description="1-10 domain/technical depth")
    uses_star_method: Optional[bool] = Field(
        None, description="Only relevant for behavioral questions, otherwise null"
    )
    star_stage_breakdown: Optional[StarStageBreakdown] = None
    strengths: List[str] = Field(default_factory=list)
    improvements: List[str] = Field(default_factory=list)
    weak_spots: List[str] = Field(default_factory=list)
    model_answer: str = Field("", description="Polished, structured rewritten model response for comparison")
    overall_summary: str


class HighlightedToken(BaseModel):
    text: str
    is_filler: bool
    filler_type: Optional[str] = None


class FollowUpQAItem(BaseModel):
    question: str
    answer: str
    timestamp: str = ""


class AnalysisReport(BaseModel):
    session_id: str
    question_id: int
    category: str
    role: str = "general"
    company_preset: str = "general"
    difficulty: str = "Intermediate"
    question_text: str
    transcript: str
    tokens: List[HighlightedToken] = Field(default_factory=list)
    speech_metrics: SpeechMetrics
    eye_contact_metrics: EyeContactMetrics
    content_feedback: ContentFeedback
    overall_score: int = Field(..., ge=0, le=100)
    timer_limit_sec: int = 90
    follow_up_qa: List[FollowUpQAItem] = Field(default_factory=list)
    created_at: str


class SessionHistorySummary(BaseModel):
    id: str
    question_id: int
    category: str
    role: str = "general"
    company_preset: str = "general"
    difficulty: str = "Intermediate"
    question_text: str
    duration_seconds: float
    overall_score: int
    wpm: float
    wpm_status: str
    filler_count: int
    eye_contact_percentage: float
    confidence_score: int = 75
    relevance_score: int
    structure_score: int
    clarity_score: int = 7
    created_at: str


# --- Probing Follow-Up Models ---
class FollowUpQuestionRequest(BaseModel):
    question_id: int
    question_text: str
    category: str = "behavioral"
    role: str = "general"
    difficulty: str = "Intermediate"
    transcript: str
    previous_answers: List[str] = Field(default_factory=list)


class FollowUpQuestionResponse(BaseModel):
    follow_up_question: str
    probing_intent: str
    suggested_focus: str


# --- Resume / JD Question Generator Models ---
class ResumeJDGenerateRequest(BaseModel):
    resume_text: str
    jd_text: str
    role: str = "Software Engineer"
    seniority: str = "Senior"
    company: str = "Target Tech Corp"
    target_count: int = 5


class TailoredQuestionItem(BaseModel):
    question_text: str
    category: str
    difficulty: str
    tips: str
    why_relevant: str


class ResumeJDGenerateResponse(BaseModel):
    role_summary: str
    detected_strengths: List[str]
    identified_gaps: List[str]
    questions: List[TailoredQuestionItem]


# --- Salary Negotiation Simulator Models ---
class NegotiationTurnItem(BaseModel):
    speaker: str  # "recruiter" or "candidate"
    message: str


class SalaryNegotiationTurnRequest(BaseModel):
    role: str = "Senior Software Engineer"
    company: str = "TechCorp"
    base_salary_target: str = "$180,000"
    equity_target: str = "$60,000 / yr"
    bonus_target: str = "$25,000"
    history: List[NegotiationTurnItem] = Field(default_factory=list)
    candidate_message: str


class SalaryNegotiationTurnResponse(BaseModel):
    recruiter_response: str
    negotiation_score: int = Field(..., ge=0, le=100)
    leverage_assessment: str
    tone_feedback: str
    tactical_tips: List[str]
    offer_status: str  # "Ongoing", "Offer Improved", "Firm Standoff", "Agreement Reached"
    current_package: Dict[str, str] = Field(default_factory=dict)


# --- Role Cheat Sheet Generator Models ---
class CheatSheetGenerateRequest(BaseModel):
    role: str = "Software Engineer"
    seniority: str = "Senior"
    company: str = "General"
    industry: str = "Tech"


class CheatSheetQAItem(BaseModel):
    question: str
    category: str
    framework: str
    ideal_response_bullet_points: List[str]
    pitfalls_to_avoid: List[str]
    key_metrics_or_buzzwords: List[str]


class CheatSheetResponse(BaseModel):
    role_title: str
    seniority: str
    target_company: str
    overview: str
    top_questions: List[CheatSheetQAItem]
    top_questions_to_ask_interviewer: List[str]
    day_before_checklist: List[str]


# --- Post-Interview Debrief Models ---
class DebriefRequest(BaseModel):
    company: str
    role: str
    interview_date: str = ""
    rounds_description: str
    candidate_notes: str


class DebriefResponse(BaseModel):
    debrief_id: str
    company: str
    role: str
    pass_probability_pct: int
    strengths_observed: List[str]
    potential_risks_or_flags: List[str]
    next_round_strategy: List[str]
    thank_you_email_draft: str


# --- Mentor / Peer Review Models ---
class MentorReviewRequest(BaseModel):
    session_id: str
    reviewer_name: str
    reviewer_role: str
    overall_rating: int = Field(..., ge=1, le=5)
    structure_rating: int = Field(..., ge=1, le=5)
    clarity_rating: int = Field(..., ge=1, le=5)
    delivery_rating: int = Field(..., ge=1, le=5)
    feedback_text: str
    actionable_tips: List[str] = Field(default_factory=list)


class MentorReviewResponse(BaseModel):
    id: str
    session_id: str
    reviewer_name: str
    reviewer_role: str
    overall_rating: int
    structure_rating: int
    clarity_rating: int
    delivery_rating: int
    feedback_text: str
    actionable_tips: List[str]
    created_at: str


# --- Analytics & Gamification Models ---
class BadgeItem(BaseModel):
    id: str
    title: str
    description: str
    icon: str
    unlocked: bool
    unlocked_at: Optional[str] = None


class GamificationProfileResponse(BaseModel):
    user_id: str
    streak_days: int
    total_practice_minutes: int
    total_sessions_completed: int
    xp_points: int
    current_level: int
    level_title: str
    badges: List[BadgeItem]
    daily_goal_sessions: int = 2
    daily_completed_sessions: int = 1


class DomainProficiency(BaseModel):
    domain: str
    score: int
    session_count: int


class WeakSpotAlert(BaseModel):
    skill_name: str
    frequency_flagged: int
    recommendation: str


class AnalyticsTrendsResponse(BaseModel):
    total_sessions: int
    avg_overall_score: int
    avg_wpm: float
    avg_eye_contact_pct: float
    score_history_timeline: List[Dict[str, Any]]
    domain_proficiencies: List[DomainProficiency]
    identified_weak_spots: List[WeakSpotAlert]
    adaptive_recommended_level: str
