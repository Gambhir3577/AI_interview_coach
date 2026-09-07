from pydantic import BaseModel, Field


class QuestionResponse(BaseModel):
    id: int
    category: str
    question_text: str
    tips: str | None = None
    difficulty: str | None = "Intermediate"


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
    filler_breakdown: dict[str, int]
    pauses_over_3s: int
    total_pause_time: float
    pause_details: list[PauseDetail] = Field(default_factory=list)


class FrameGazeSample(BaseModel):
    timestamp_sec: float
    looking_at_camera: bool
    confidence: float = 1.0


class EyeContactMetrics(BaseModel):
    eye_contact_percentage: float
    total_frames_analyzed: int
    looking_at_camera_frames: int
    timeline_sampled: list[FrameGazeSample] = Field(default_factory=list)
    disclaimer: str = (
        "Engagement proxy metric calculated via facial landmark and iris alignment. "
        "Does not measure emotions or subconscious intent."
    )


class ContentFeedback(BaseModel):
    relevance_score: int = Field(..., ge=1, le=10, description="1-10 relevance to question")
    structure_score: int = Field(..., ge=1, le=10, description="1-10 organization of answer")
    uses_star_method: bool | None = Field(
        None, description="Only relevant for behavioral questions, otherwise null"
    )
    strengths: list[str] = Field(default_factory=list)
    improvements: list[str] = Field(default_factory=list)
    overall_summary: str


class HighlightedToken(BaseModel):
    text: str
    is_filler: bool
    filler_type: str | None = None


class AnalysisReport(BaseModel):
    session_id: str
    question_id: int
    category: str
    question_text: str
    transcript: str
    tokens: list[HighlightedToken] = Field(default_factory=list)
    speech_metrics: SpeechMetrics
    eye_contact_metrics: EyeContactMetrics
    content_feedback: ContentFeedback
    overall_score: int = Field(..., ge=0, le=100)
    created_at: str


class SessionHistorySummary(BaseModel):
    id: str
    question_id: int
    category: str
    question_text: str
    duration_seconds: float
    overall_score: int
    wpm: float
    wpm_status: str
    filler_count: int
    eye_contact_percentage: float
    relevance_score: int
    structure_score: int
    created_at: str
