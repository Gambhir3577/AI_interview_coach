import os
import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    Integer,
    String,
    Text,
    create_engine,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker

DB_PATH = os.environ.get("DB_PATH", os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "interview_coach.db")))
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    category: Mapped[str] = mapped_column(String(50), index=True, nullable=False)  # "hr", "technical", "behavioral"
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    tips: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    difficulty: Mapped[str] = mapped_column(String(20), default="Intermediate")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, default=lambda: str(uuid.uuid4()))
    question_id: Mapped[int] = mapped_column(Integer, nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    duration_seconds: Mapped[float] = mapped_column(Float, default=0.0)
    transcript: Mapped[str] = mapped_column(Text, default="")
    
    # Speech Metrics
    total_words: Mapped[int] = mapped_column(Integer, default=0)
    wpm: Mapped[float] = mapped_column(Float, default=0.0)
    wpm_status: Mapped[str] = mapped_column(String(30), default="Ideal Pace")
    filler_count: Mapped[int] = mapped_column(Integer, default=0)
    filler_rate_per_100: Mapped[float] = mapped_column(Float, default=0.0)
    filler_breakdown: Mapped[str] = mapped_column(Text, default="{}")  # JSON string
    pauses_over_3s: Mapped[int] = mapped_column(Integer, default=0)
    total_pause_time: Mapped[float] = mapped_column(Float, default=0.0)
    pause_details: Mapped[str] = mapped_column(Text, default="[]")  # JSON string
    
    # Eye Contact Metrics
    eye_contact_percentage: Mapped[float] = mapped_column(Float, default=0.0)
    total_frames_analyzed: Mapped[int] = mapped_column(Integer, default=0)
    looking_at_camera_frames: Mapped[int] = mapped_column(Integer, default=0)
    timeline_sampled: Mapped[str] = mapped_column(Text, default="[]")  # JSON string
    
    # Content Feedback (LLM)
    relevance_score: Mapped[int] = mapped_column(Integer, default=7)
    structure_score: Mapped[int] = mapped_column(Integer, default=7)
    uses_star_method: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    strengths: Mapped[str] = mapped_column(Text, default="[]")  # JSON string
    improvements: Mapped[str] = mapped_column(Text, default="[]")  # JSON string
    overall_summary: Mapped[str] = mapped_column(Text, default="")
    
    # Overall Score
    overall_score: Mapped[int] = mapped_column(Integer, default=75)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


SEED_QUESTIONS = [
    # 10 HR Questions
    {
        "category": "hr",
        "question_text": "Tell me about yourself and your professional background.",
        "tips": "Focus on your recent career milestones, core strengths, and what brings you to this opportunity. Keep it concise (60-90 seconds).",
        "difficulty": "General"
    },
    {
        "category": "hr",
        "question_text": "Why are you interested in joining our company and this specific role?",
        "tips": "Demonstrate knowledge of company mission, product, or values, and connect them with your personal career trajectory.",
        "difficulty": "General"
    },
    {
        "category": "hr",
        "question_text": "What do you consider to be your greatest professional strength, and how has it helped you succeed?",
        "tips": "Pick a relevant skill (e.g. problem solving, cross-functional communication) and back it up with a tangible achievement.",
        "difficulty": "General"
    },
    {
        "category": "hr",
        "question_text": "What is an area of growth or weakness you are actively working on improving?",
        "tips": "Choose a genuine area of improvement, avoid cliches, and explain the concrete steps you are taking to grow.",
        "difficulty": "General"
    },
    {
        "category": "hr",
        "question_text": "Where do you see yourself professionally in the next 3 to 5 years?",
        "tips": "Show ambition and realistic career progression aligned with the role you are applying for.",
        "difficulty": "General"
    },
    {
        "category": "hr",
        "question_text": "Why are you looking to transition from your current role or company?",
        "tips": "Keep the tone positive. Emphasize moving toward new growth and challenges rather than running away from past friction.",
        "difficulty": "General"
    },
    {
        "category": "hr",
        "question_text": "How do you manage stress and maintain high productivity when working under tight deadlines?",
        "tips": "Discuss prioritization frameworks, time blocking, clear communication with stakeholders, and healthy decompression routines.",
        "difficulty": "General"
    },
    {
        "category": "hr",
        "question_text": "What kind of work environment and team culture brings out your best performance?",
        "tips": "Highlight collaboration, psychological safety, ownership, and feedback-driven environments.",
        "difficulty": "General"
    },
    {
        "category": "hr",
        "question_text": "Describe your ideal manager and the management style you respond best to.",
        "tips": "Focus on autonomy, constructive feedback, clear goal-setting, and supportive mentorship.",
        "difficulty": "General"
    },
    {
        "category": "hr",
        "question_text": "Why should we hire you over other qualified candidates applying for this position?",
        "tips": "Synthesize your unique combination of skills, quick adaptability, cultural enthusiasm, and proven track record.",
        "difficulty": "General"
    },

    # 10 Technical Questions
    {
        "category": "technical",
        "question_text": "Explain the core concepts of Object-Oriented Programming (OOP) with real-world analogies.",
        "tips": "Cover Encapsulation, Abstraction, Inheritance, and Polymorphism with practical examples.",
        "difficulty": "Intermediate"
    },
    {
        "category": "technical",
        "question_text": "What are the primary differences between SQL and NoSQL databases, and when would you choose each?",
        "tips": "Discuss schema rigidity vs flexibility, ACID guarantees, relational joins, scaling horizontally vs vertically.",
        "difficulty": "Intermediate"
    },
    {
        "category": "technical",
        "question_text": "Explain time and space complexity (Big O notation) and how you optimize algorithm performance.",
        "tips": "Define asymptotic growth, compare O(1), O(log n), O(n), O(n log n), and O(n²), and give practical caching or lookup examples.",
        "difficulty": "Intermediate"
    },
    {
        "category": "technical",
        "question_text": "How do RESTful APIs work, and what makes an HTTP method idempotent?",
        "tips": "Explain standard verbs (GET, POST, PUT, DELETE, PATCH), status codes, statelessness, and idempotency guarantees.",
        "difficulty": "Intermediate"
    },
    {
        "category": "technical",
        "question_text": "Describe how modern browser caching and Content Delivery Networks (CDNs) reduce page latency.",
        "tips": "Mention Cache-Control headers, edge server distribution, DNS routing, and static asset invalidation.",
        "difficulty": "Intermediate"
    },
    {
        "category": "technical",
        "question_text": "What is the difference between concurrency and parallelism? How are they handled in modern systems?",
        "tips": "Differentiate task interleaving vs simultaneous physical execution across multiple cores.",
        "difficulty": "Advanced"
    },
    {
        "category": "technical",
        "question_text": "Explain the purpose and mechanics of database indexing, including potential write performance trade-offs.",
        "tips": "Discuss B-Tree / Hash indexes, how they speed up search queries, and overhead during insert/update operations.",
        "difficulty": "Intermediate"
    },
    {
        "category": "technical",
        "question_text": "How do you approach debugging a high-latency issue or bottleneck in a distributed microservices system?",
        "tips": "Discuss distributed tracing (OpenTelemetry), APM metrics, database query profiling, CPU/memory profiling, and log correlation.",
        "difficulty": "Advanced"
    },
    {
        "category": "technical",
        "question_text": "What are the key security principles you follow to prevent SQL injection and Cross-Site Scripting (XSS)?",
        "tips": "Explain parameterized queries/prepared statements, input sanitization, Content Security Policy (CSP), and output encoding.",
        "difficulty": "Intermediate"
    },
    {
        "category": "technical",
        "question_text": "Explain the concept of CI/CD pipelines and how automated testing ensures deployment reliability.",
        "tips": "Cover linting, unit/integration testing, automated build artifacts, blue-green or canary deployments, and rollback strategies.",
        "difficulty": "Intermediate"
    },

    # 10 Behavioral Questions
    {
        "category": "behavioral",
        "question_text": "Tell me about a time you faced a significant obstacle or failed at a project. How did you handle it?",
        "tips": "Use the STAR method (Situation, Task, Action, Result). Focus heavily on the lessons learned and subsequent adjustments.",
        "difficulty": "Behavioral"
    },
    {
        "category": "behavioral",
        "question_text": "Describe a situation where you had to resolve a serious disagreement with a colleague or stakeholder.",
        "tips": "Highlight empathy, active listening, objective data evaluation, and finding win-win compromises.",
        "difficulty": "Behavioral"
    },
    {
        "category": "behavioral",
        "question_text": "Give an example of a time when you had to adapt quickly to sudden changes in project requirements or priorities.",
        "tips": "Explain how you re-prioritized deliverables, communicated changes to teammates, and preserved code quality.",
        "difficulty": "Behavioral"
    },
    {
        "category": "behavioral",
        "question_text": "Tell me about a time you had to deliver a difficult project under intense pressure or tight deadlines.",
        "tips": "Detail your scoping strategy, risk mitigation, focus on MVP deliverables, and transparent communication.",
        "difficulty": "Behavioral"
    },
    {
        "category": "behavioral",
        "question_text": "Describe an instance where you took initiative to solve a problem without being asked by leadership.",
        "tips": "Demonstrate proactive ownership, identifying inefficiencies, and taking measured action to add value.",
        "difficulty": "Behavioral"
    },
    {
        "category": "behavioral",
        "question_text": "Tell me about a time you received constructive criticism. What was it and how did you act on it?",
        "tips": "Demonstrate a growth mindset, humility, and specific positive behavioral changes made as a result.",
        "difficulty": "Behavioral"
    },
    {
        "category": "behavioral",
        "question_text": "Describe a scenario where you had to persuade a reluctant team member or executive to adopt your proposal.",
        "tips": "Showcase your preparation, data-backed presentation, addressing their underlying concerns, and achieving consensus.",
        "difficulty": "Behavioral"
    },
    {
        "category": "behavioral",
        "question_text": "Give an example of a complex technical decision you made and how you balanced competing trade-offs.",
        "tips": "Explain the architectural decision records, weighing time-to-market vs scalability vs technical debt.",
        "difficulty": "Behavioral"
    },
    {
        "category": "behavioral",
        "question_text": "Tell me about a time you mentored or helped a teammate who was struggling to complete their tasks.",
        "tips": "Highlight patience, pair-programming, breaking down roadblocks, and empowering them for future independence.",
        "difficulty": "Behavioral"
    },
    {
        "category": "behavioral",
        "question_text": "Describe a situation where you had to make an important decision with incomplete or ambiguous data.",
        "tips": "Discuss hypothesis testing, consulting domain experts, taking reversible risks, and iterating rapidly.",
        "difficulty": "Behavioral"
    }
]


def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        count = db.query(Question).count()
        if count == 0:
            for item in SEED_QUESTIONS:
                q = Question(
                    category=item["category"],
                    question_text=item["question_text"],
                    tips=item.get("tips"),
                    difficulty=item.get("difficulty", "Intermediate")
                )
                db.add(q)
            db.commit()
    finally:
        db.close()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
