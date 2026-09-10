import json
import os
import sqlite3
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
    text,
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
    category: Mapped[str] = mapped_column(String(50), index=True, nullable=False)  # "hr", "technical", "behavioral", "system_design", "product", "data_science"
    role: Mapped[str] = mapped_column(String(50), index=True, default="general")  # "swe", "pm", "data_science", "system_design", "behavioral", "marketing", "finance", "general"
    company_preset: Mapped[str] = mapped_column(String(50), index=True, default="general")  # "general", "amazon", "google", "meta", "apple", "microsoft", "mckinsey"
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    tips: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    difficulty: Mapped[str] = mapped_column(String(20), default="Intermediate")  # "Junior", "Intermediate", "Senior", "Lead"
    language: Mapped[str] = mapped_column(String(10), default="en")  # "en", "es", "fr", "de", "zh", "hi", "ja", "pt"
    star_guidance: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON string with S, T, A, R hints
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, default=lambda: str(uuid.uuid4()))
    question_id: Mapped[int] = mapped_column(Integer, nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="general")
    company_preset: Mapped[str] = mapped_column(String(50), default="general")
    difficulty: Mapped[str] = mapped_column(String(20), default="Intermediate")
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    duration_seconds: Mapped[float] = mapped_column(Float, default=0.0)
    timer_limit_sec: Mapped[int] = mapped_column(Integer, default=90)
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
    confidence_score: Mapped[int] = mapped_column(Integer, default=75)
    hesitation_rate: Mapped[float] = mapped_column(Float, default=0.0)
    sentiment_tone: Mapped[str] = mapped_column(String(50), default="Calm & Professional")
    
    # Eye Contact & Body Language Metrics
    eye_contact_percentage: Mapped[float] = mapped_column(Float, default=0.0)
    total_frames_analyzed: Mapped[int] = mapped_column(Integer, default=0)
    looking_at_camera_frames: Mapped[int] = mapped_column(Integer, default=0)
    timeline_sampled: Mapped[str] = mapped_column(Text, default="[]")  # JSON string
    posture_score: Mapped[int] = mapped_column(Integer, default=85)
    posture_status: Mapped[str] = mapped_column(String(50), default="Centered & Stable")
    
    # Content Feedback (Multi-dimensional Rubric & Model Answer)
    relevance_score: Mapped[int] = mapped_column(Integer, default=7)
    structure_score: Mapped[int] = mapped_column(Integer, default=7)
    clarity_score: Mapped[int] = mapped_column(Integer, default=7)
    depth_score: Mapped[int] = mapped_column(Integer, default=7)
    uses_star_method: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    strengths: Mapped[str] = mapped_column(Text, default="[]")  # JSON string
    improvements: Mapped[str] = mapped_column(Text, default="[]")  # JSON string
    weak_areas: Mapped[str] = mapped_column(Text, default="[]")  # JSON string
    model_answer: Mapped[str] = mapped_column(Text, default="")
    follow_up_qa: Mapped[str] = mapped_column(Text, default="[]")  # JSON array of {question, answer}
    overall_summary: Mapped[str] = mapped_column(Text, default="")
    
    # Overall Composite Score
    overall_score: Mapped[int] = mapped_column(Integer, default=75)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


class UserGamification(Base):
    __tablename__ = "user_gamification"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(100), unique=True, index=True, default="default_user")
    streak_days: Mapped[int] = mapped_column(Integer, default=1)
    total_practice_seconds: Mapped[int] = mapped_column(Integer, default=0)
    total_sessions_completed: Mapped[int] = mapped_column(Integer, default=0)
    xp_points: Mapped[int] = mapped_column(Integer, default=100)
    unlocked_badges: Mapped[str] = mapped_column(Text, default="[]")  # JSON array of badge IDs
    last_practice_date: Mapped[str] = mapped_column(String(20), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


class TailoredJDQuestion(Base):
    __tablename__ = "tailored_jd_questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(100), default="default_user")
    role: Mapped[str] = mapped_column(String(100), default="Software Engineer")
    company: Mapped[str] = mapped_column(String(100), default="Target Company")
    job_title: Mapped[str] = mapped_column(String(150), default="Role Title")
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    tips: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    difficulty: Mapped[str] = mapped_column(String(30), default="Intermediate")
    relevance_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


class MentorReview(Base):
    __tablename__ = "mentor_reviews"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    reviewer_name: Mapped[str] = mapped_column(String(100), default="Anonymous Mentor")
    reviewer_role: Mapped[str] = mapped_column(String(100), default="Senior Interviewer")
    overall_rating: Mapped[int] = mapped_column(Integer, default=4)  # 1-5
    structure_rating: Mapped[int] = mapped_column(Integer, default=4)
    clarity_rating: Mapped[int] = mapped_column(Integer, default=4)
    delivery_rating: Mapped[int] = mapped_column(Integer, default=4)
    feedback_text: Mapped[str] = mapped_column(Text, default="")
    actionable_tips: Mapped[str] = mapped_column(Text, default="[]")  # JSON string
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


class InterviewDebrief(Base):
    __tablename__ = "interview_debriefs"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(100), default="default_user")
    company: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[str] = mapped_column(String(100), nullable=False)
    interview_date: Mapped[str] = mapped_column(String(50), default="")
    rounds_description: Mapped[str] = mapped_column(Text, default="")
    candidate_notes: Mapped[str] = mapped_column(Text, default="")
    pass_probability_pct: Mapped[int] = mapped_column(Integer, default=70)
    strengths_observed: Mapped[str] = mapped_column(Text, default="[]")  # JSON
    flags_and_risks: Mapped[str] = mapped_column(Text, default="[]")  # JSON
    next_round_tips: Mapped[str] = mapped_column(Text, default="[]")  # JSON
    thank_you_email: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


SEED_QUESTIONS = [
    # --- 1. HR & CULTURE FIT (General + Multi-difficulty) ---
    {
        "category": "hr",
        "role": "general",
        "company_preset": "general",
        "difficulty": "Junior",
        "question_text": "Tell me about yourself and what brought you to apply for this position.",
        "tips": "Walk through your academic/career timeline concisely in 60-90 seconds: present role, past foundation, and why this company is your logical next step.",
        "star_guidance": json.dumps({"S": "Current status & passion", "T": "Core skills built", "A": "Key project highlights", "R": "Why this role aligns"})
    },
    {
        "category": "hr",
        "role": "general",
        "company_preset": "general",
        "difficulty": "Intermediate",
        "question_text": "Why are you interested in joining our company over competing organizations in this industry?",
        "tips": "Cite specific initiatives, product architecture, business philosophy, or culture values that distinguish this company.",
        "star_guidance": json.dumps({"S": "Company market position", "T": "Your personal values", "A": "Concrete alignment", "R": "Mutual impact expected"})
    },
    {
        "category": "hr",
        "role": "general",
        "company_preset": "general",
        "difficulty": "Intermediate",
        "question_text": "What is an area of growth or weakness you are actively working on improving?",
        "tips": "Choose an authentic skill, explain its past impact, and outline the exact self-correction routines or coaching you established.",
        "star_guidance": json.dumps({"S": "The self-awareness moment", "T": "Actionable goal set", "A": "Tools/processes used to grow", "R": "Progress and current state"})
    },
    {
        "category": "hr",
        "role": "general",
        "company_preset": "general",
        "difficulty": "Senior",
        "question_text": "Describe your ideal work culture and the management style that brings out your best strategic performance.",
        "tips": "Highlight psychological safety, high-trust autonomy, constructive feedback loops, and alignment on clear business outcomes.",
        "star_guidance": json.dumps({"S": "High-performing environment context", "T": "Your collaboration philosophy", "A": "How you foster trust", "R": "Sustained high output"})
    },
    {
        "category": "hr",
        "role": "general",
        "company_preset": "general",
        "difficulty": "Lead",
        "question_text": "Why should we hire you over other highly qualified candidates applying for this role?",
        "tips": "Synthesize your unique combination of deep domain expertise, proven velocity, mentorship impact, and immediate business ROI.",
        "star_guidance": json.dumps({"S": "Role strategic challenge", "T": "Unique skill intersection", "A": "Proof point milestone", "R": "Rapid value delivery"})
    },

    # --- 2. SOFTWARE ENGINEERING (SWE) ---
    {
        "category": "technical",
        "role": "swe",
        "company_preset": "general",
        "difficulty": "Junior",
        "question_text": "Explain the four core principles of Object-Oriented Programming (OOP) with practical software analogies.",
        "tips": "Define Encapsulation, Abstraction, Inheritance, and Polymorphism. Give brief real-world code modularity examples.",
        "star_guidance": json.dumps({"S": "Code architecture foundation", "T": "Explain 4 pillars", "A": "Provide clear code analogy", "R": "Benefits in maintainability"})
    },
    {
        "category": "technical",
        "role": "swe",
        "company_preset": "general",
        "difficulty": "Intermediate",
        "question_text": "What are the primary differences between SQL relational databases and NoSQL document stores? When would you choose each?",
        "tips": "Compare ACID guarantees, relational joins, horizontal vs vertical scaling, schema flexibility, and read/write heavy access patterns.",
        "star_guidance": json.dumps({"S": "Data model requirements", "T": "SQL vs NoSQL trade-offs", "A": "Specific use case comparison", "R": "Recommended choice rationale"})
    },
    {
        "category": "technical",
        "role": "swe",
        "company_preset": "general",
        "difficulty": "Intermediate",
        "question_text": "How do RESTful APIs differ from GraphQL or gRPC, and what makes an HTTP method idempotent?",
        "tips": "Explain over-fetching/under-fetching, RPC vs resource-based endpoints, and why GET/PUT/DELETE are idempotent while POST is not.",
        "star_guidance": json.dumps({"S": "Client-server communication", "T": "Protocol trade-offs", "A": "Idempotency definition", "R": "Production safety impact"})
    },
    {
        "category": "technical",
        "role": "swe",
        "company_preset": "Senior",
        "difficulty": "Senior",
        "question_text": "How do you detect, isolate, and debug a non-deterministic race condition or memory leak in production?",
        "tips": "Walk through heap dumps, profiling (pprof, Valgrind), thread sanitizers, distributed tracing (OpenTelemetry), and reproducible staging tests.",
        "star_guidance": json.dumps({"S": "Production incident symptoms", "T": "Triage & telemetry", "A": "Isolation & root-cause fix", "R": "Telemetry guardrails added"})
    },
    {
        "category": "technical",
        "role": "swe",
        "company_preset": "Lead",
        "difficulty": "Lead",
        "question_text": "How do you establish engineering standards, manage technical debt, and prevent regressions across multi-team codebases?",
        "tips": "Discuss RFC design proposals, automated CI/CD linting, canary deployments, feature flags, ADRs (Architectural Decision Records), and code health sprints.",
        "star_guidance": json.dumps({"S": "Rapidly growing codebase", "T": "Balancing speed vs debt", "A": "Governance & automated tools", "R": "Measurable reliability gains"})
    },

    # --- 3. PRODUCT MANAGEMENT (PM) ---
    {
        "category": "product",
        "role": "pm",
        "company_preset": "general",
        "difficulty": "Junior",
        "question_text": "Pick your favorite mobile app. How would you improve its user engagement or retention by 20%?",
        "tips": "Identify user personas, pain points in the core funnel, brainstorm 3 prioritized solutions, and define North Star metrics.",
        "star_guidance": json.dumps({"S": "Current app & user problem", "T": "Target metric to move", "A": "Feature hypothesis & rollout", "R": "Measurement & validation"})
    },
    {
        "category": "product",
        "role": "pm",
        "company_preset": "Intermediate",
        "difficulty": "Intermediate",
        "question_text": "How do you prioritize competing feature requests from Sales, Engineering, and Executive leadership when resources are tight?",
        "tips": "Use frameworks like RICE (Reach, Impact, Confidence, Effort) or Kano model, tied directly to quarterly strategic company OKRs.",
        "star_guidance": json.dumps({"S": "Conflicting stakeholder demands", "T": "Prioritization framework", "A": "Transparent consensus building", "R": "Delivered high-ROI roadmap"})
    },
    {
        "category": "product",
        "role": "pm",
        "company_preset": "Senior",
        "difficulty": "Senior",
        "question_text": "Imagine our primary product metric (e.g., daily active users) dropped by 12% week-over-week. How do you diagnose the root cause?",
        "tips": "Systematically segment by cohort, geography, client version, external outages, seasonality, marketing campaign changes, and funnel drop-off.",
        "star_guidance": json.dumps({"S": "12% metric drop discovery", "T": "Investigation taxonomy", "A": "Data query & triage steps", "R": "Root cause remediation plan"})
    },
    {
        "category": "product",
        "role": "pm",
        "company_preset": "Lead",
        "difficulty": "Lead",
        "question_text": "How do you define a 3-year product vision for an enterprise SaaS product in a rapidly evolving, AI-disrupted market?",
        "tips": "Discuss macro market signals, customer problem validation, defensive moats, platform ecosystems, and progressive milestone phases.",
        "star_guidance": json.dumps({"S": "Market disruption threat", "T": "Multi-year north star", "A": "Ecosystem & platform strategy", "R": "Revenue & market share growth"})
    },

    # --- 4. DATA SCIENCE & MACHINE LEARNING ---
    {
        "category": "data_science",
        "role": "data_science",
        "company_preset": "general",
        "difficulty": "Junior",
        "question_text": "Explain the bias-variance tradeoff and what techniques you use to prevent overfitting in machine learning models.",
        "tips": "Discuss underfitting vs overfitting, regularization (L1/L2), cross-validation, dropout, data augmentation, and tree pruning.",
        "star_guidance": json.dumps({"S": "Model generalization problem", "T": "Bias vs variance definition", "A": "Regularization techniques", "R": "Validation score stability"})
    },
    {
        "category": "data_science",
        "role": "data_science",
        "company_preset": "Intermediate",
        "difficulty": "Intermediate",
        "question_text": "How do you design and evaluate an A/B experimentation pipeline for a recommendation engine with severe network effects?",
        "tips": "Discuss cluster-based randomization, sample size power calculations, spillover mitigation, p-value correction, and guardrail metrics.",
        "star_guidance": json.dumps({"S": "Network effect interference", "T": "Experiment design strategy", "A": "Cluster randomization & metrics", "R": "Unbiased causal inference"})
    },
    {
        "category": "data_science",
        "role": "data_science",
        "company_preset": "Senior",
        "difficulty": "Senior",
        "question_text": "How do you handle severe class imbalance in a fraud detection or anomaly classification model?",
        "tips": "Mention SMOTE, cost-sensitive loss functions (Focal Loss), Precision-Recall AUC curves vs ROC-AUC, stratified sampling, and threshold tuning.",
        "star_guidance": json.dumps({"S": "0.1% positive fraud rate", "T": "Evaluation metric selection", "A": "Sampling & loss function tuning", "R": "Recall uplift with low false alarms"})
    },
    {
        "category": "data_science",
        "role": "data_science",
        "company_preset": "Lead",
        "difficulty": "Lead",
        "question_text": "How do you architect an enterprise MLOps platform addressing model drift, data lineage, feature stores, and real-time inference latency?",
        "tips": "Discuss feature store synchronization, Feast/Hopsworks, shadow deployments, drift detection (KS-test, PSI), and auto-retraining triggers.",
        "star_guidance": json.dumps({"S": "Production model staleness", "T": "Automated MLOps architecture", "A": "Real-time monitoring & retraining", "R": "99.9% uptime & consistent accuracy"})
    },

    # --- 5. SYSTEM DESIGN & DISTRIBUTED SYSTEMS ---
    {
        "category": "system_design",
        "role": "system_design",
        "company_preset": "general",
        "difficulty": "Intermediate",
        "question_text": "Design a globally distributed URL shortening service like Bitly handling 100M new URLs created per month.",
        "tips": "Estimate read/write QPS and storage, propose Base62 hashing with distributed ID generators (Snowflake), Redis caching, and DB sharding.",
        "star_guidance": json.dumps({"S": "100M URLs scale requirement", "T": "Core functional & non-functional goals", "A": "API design, storage, caching & hashing", "R": "Sub-10ms redirect latency"})
    },
    {
        "category": "system_design",
        "role": "system_design",
        "company_preset": "Senior",
        "difficulty": "Senior",
        "question_text": "Design a real-time collaborative document editing system (like Google Docs) with offline conflict resolution.",
        "tips": "Compare Operational Transformation (OT) vs Conflict-free Replicated Data Types (CRDTs), WebSockets, message brokers, and snapshotting.",
        "star_guidance": json.dumps({"S": "Concurrent editing conflicts", "T": "Low-latency synchronization", "A": "CRDT / OT event stream design", "R": "Deterministic state convergence"})
    },
    {
        "category": "system_design",
        "role": "system_design",
        "company_preset": "Lead",
        "difficulty": "Lead",
        "question_text": "How would you design a fault-tolerant, event-driven payment processing architecture guaranteeing Exactly-Once execution?",
        "tips": "Discuss idempotency keys, transactional outbox pattern, distributed sagas, two-phase commits, Kafka partitioned topics, and reconciliation workers.",
        "star_guidance": json.dumps({"S": "Zero tolerance for double billing", "T": "Exactly-once semantics", "A": "Idempotency keys & Saga orchestrator", "R": "100% financial consistency"})
    },

    # --- 6. COMPANY PRESET: AMAZON (Leadership Principles) ---
    {
        "category": "behavioral",
        "role": "behavioral",
        "company_preset": "amazon",
        "difficulty": "Intermediate",
        "question_text": "[Amazon: Customer Obsession] Tell me about a time you went above and beyond for a customer or end user, even when it required pushing back on internal priorities.",
        "tips": "Demonstrate customer obsession over competitor focus. Detail how you gathered direct customer feedback and pivoted team roadmap.",
        "star_guidance": json.dumps({"S": "Customer pain point discovered", "T": "Internal pushback to overcome", "A": "Data-backed advocacy & customer solution", "R": "Customer satisfaction & retention score"})
    },
    {
        "category": "behavioral",
        "role": "behavioral",
        "company_preset": "amazon",
        "difficulty": "Senior",
        "question_text": "[Amazon: Ownership & Bias for Action] Tell me about a critical problem you solved where ownership was ambiguous and you had to act with incomplete data.",
        "tips": "Showcase high judgment, bias for action, calculating two-way vs one-way door decisions, and taking full responsibility for the outcome.",
        "star_guidance": json.dumps({"S": "Ambiguous orphaned incident", "T": "Calculated risk decision", "A": "Proactive fix without waiting for approval", "R": "System restored & permanent fix codified"})
    },
    {
        "category": "behavioral",
        "role": "behavioral",
        "company_preset": "amazon",
        "difficulty": "Senior",
        "question_text": "[Amazon: Have Backbone; Disagree & Commit] Describe a scenario where you strongly disagreed with a senior leader or colleague on architectural direction.",
        "tips": "Explain how you challenged respectfully with objective benchmark metrics, explored alternatives, and committed 100% once the decision was finalized.",
        "star_guidance": json.dumps({"S": "Contested architectural proposal", "T": "Your dissenting hypothesis", "A": "Data presentation & respectful debate", "R": "Agreed path & full execution commitment"})
    },
    {
        "category": "behavioral",
        "role": "behavioral",
        "company_preset": "amazon",
        "difficulty": "Lead",
        "question_text": "[Amazon: Deliver Results & Invent & Simplify] Describe the most complex engineering or product bottleneck you simplified to deliver game-changing business results.",
        "tips": "Emphasize reduction in operational complexity, automated tooling, measurable latency/cost reductions, and delivering ahead of schedule.",
        "star_guidance": json.dumps({"S": "Bloated legacy bottleneck", "T": "Radical simplification target", "A": "Inventive architecture design", "R": "Massive cost/latency reduction metrics"})
    },

    # --- 7. COMPANY PRESET: GOOGLE (Googleyness & Structured Problem Solving) ---
    {
        "category": "behavioral",
        "role": "behavioral",
        "company_preset": "google",
        "difficulty": "Intermediate",
        "question_text": "[Google: Googleyness] Tell me about a time you proactively supported a teammate or cross-functional peer who was struggling with their deliverables.",
        "tips": "Highlight intellectual humility, inclusive collaboration, psychological safety, and empowering teammates for sustained autonomy.",
        "star_guidance": json.dumps({"S": "Struggling teammate scenario", "T": "Recognizing burnout/blockers", "A": "Pair-programming & empathetic mentorship", "R": "Teammate independently shipped milestone"})
    },
    {
        "category": "technical",
        "role": "swe",
        "company_preset": "google",
        "difficulty": "Senior",
        "question_text": "[Google: Open-Ended Engineering] How would you design Google Autocomplete (Search Suggestions) to serve 5B queries a day with sub-50ms latency?",
        "tips": "Discuss Trie data structures, prefix caching, distributed inverted indexes, personalized ML ranking, and sampling query frequencies.",
        "star_guidance": json.dumps({"S": "5B daily searches scale", "T": "Prefix matching under 50ms", "A": "Distributed Trie & Redis cache clusters", "R": "Sub-30ms global response time"})
    },

    # --- 8. COMPANY PRESET: META (Move Fast & Focus on Impact) ---
    {
        "category": "behavioral",
        "role": "behavioral",
        "company_preset": "meta",
        "difficulty": "Senior",
        "question_text": "[Meta: Move Fast] Tell me about a time you had to balance engineering perfection with shipping quickly to validate a critical business hypothesis.",
        "tips": "Demonstrate understanding of calculated technical debt, feature gating, MVP scope trimming, and rapid telemetry-driven iteration.",
        "star_guidance": json.dumps({"S": "Urgent market window", "T": "MVP vs gold-plated trade-off", "A": "Scoping essentials & telemetry hooks", "R": "Shipped 3 weeks early with 40% adoption"})
    },

    # --- 9. COMPANY PRESET: MCKINSEY & CONSULTING (Case Structure & MECE) ---
    {
        "category": "product",
        "role": "general",
        "company_preset": "mckinsey",
        "difficulty": "Senior",
        "question_text": "[McKinsey Case: Market Entry] A leading European EV manufacturer is considering entering the Southeast Asian commercial fleet market. How do you structure the business case?",
        "tips": "Structure MECE (Mutually Exclusive, Collectively Exhaustive): Market attractiveness, competitive landscape, regulatory/charging barriers, unit economics, and entry modes (JV vs Greenfield).",
        "star_guidance": json.dumps({"S": "EV client expansion objective", "T": "MECE framework definition", "A": "Analyze 4 key pillars & financials", "R": "Go/No-Go recommendation with risk mitigations"})
    },

    # --- 10. MARKETING & GROWTH ---
    {
        "category": "hr",
        "role": "marketing",
        "company_preset": "general",
        "difficulty": "Intermediate",
        "question_text": "Describe a successful multi-channel growth campaign you orchestrated. How did you optimize CAC (Customer Acquisition Cost) and LTV?",
        "tips": "Detail channel attribution (Paid Search, Organic SEO, Influencer, Retargeting), A/B testing creative copy, landing page conversion rates, and payback period.",
        "star_guidance": json.dumps({"S": "Growth plateau context", "T": "Target CAC & LTV targets", "A": "Multi-channel funnel optimization", "R": "35% CAC drop and 2.4x revenue uplift"})
    },

    # --- 11. FINANCE & FINTECH ---
    {
        "category": "technical",
        "role": "finance",
        "company_preset": "general",
        "difficulty": "Senior",
        "question_text": "How do you evaluate credit risk or fraud exposure in real-time for high-volume instant loan underwriting platforms?",
        "tips": "Discuss alternative data scoring, real-time feature streaming, regulatory compliance (Fair Lending/FCRA), model explainability (SHAP values), and portfolio stress testing.",
        "star_guidance": json.dumps({"S": "Instant underwriting requirement", "T": "Balancing default rate vs approval speed", "A": "Real-time ML risk engine & SHAP explainability", "R": "Default rate reduced by 22% while boosting approvals"})
    },

    # --- 12. SALARY NEGOTIATION / ADVANCED BEHAVIORAL ---
    {
        "category": "behavioral",
        "role": "general",
        "company_preset": "general",
        "difficulty": "Intermediate",
        "question_text": "Tell me about a time you had to deliver difficult feedback to an underperforming colleague or vendor. How did you handle the conversation?",
        "tips": "Highlight radical candor, specific behavioral evidence, active listening to root roadblocks, and setting measurable 30-day performance milestones.",
        "star_guidance": json.dumps({"S": "Underperformance impacting team", "T": "Private feedback intervention", "A": "Objective observations & co-created action plan", "R": "Performance rebounded within 4 weeks"})
    },
    {
        "category": "behavioral",
        "role": "general",
        "company_preset": "general",
        "difficulty": "Senior",
        "question_text": "Describe a major project failure in your career. What was your personal responsibility, what did you learn, and how did you institutionalize that learning?",
        "tips": "Own the mistake without deflecting blame. Detail post-mortem RCA (Root Cause Analysis), prevention playbooks built, and long-term improvements.",
        "star_guidance": json.dumps({"S": "Project failure context", "T": "Your direct accountability", "A": "Post-mortem investigation & process overhaul", "R": "Zero repeat occurrences and stronger team resilience"})
    }
]


def init_db():
    Base.metadata.create_all(bind=engine)
    
    # Safe SQLite column migration helper for existing tables
    try:
        with engine.connect() as conn:
            # Check questions table columns
            res = conn.execute(text("PRAGMA table_info(questions)")).fetchall()
            existing_cols = [r[1] for r in res]
            
            if "role" not in existing_cols:
                conn.execute(text("ALTER TABLE questions ADD COLUMN role VARCHAR(50) DEFAULT 'general'"))
            if "company_preset" not in existing_cols:
                conn.execute(text("ALTER TABLE questions ADD COLUMN company_preset VARCHAR(50) DEFAULT 'general'"))
            if "language" not in existing_cols:
                conn.execute(text("ALTER TABLE questions ADD COLUMN language VARCHAR(10) DEFAULT 'en'"))
            if "star_guidance" not in existing_cols:
                conn.execute(text("ALTER TABLE questions ADD COLUMN star_guidance TEXT DEFAULT NULL"))
                
            # Check interview_sessions table columns
            res_s = conn.execute(text("PRAGMA table_info(interview_sessions)")).fetchall()
            existing_s_cols = [r[1] for r in res_s]
            
            new_s_cols = [
                ("role", "VARCHAR(50) DEFAULT 'general'"),
                ("company_preset", "VARCHAR(50) DEFAULT 'general'"),
                ("difficulty", "VARCHAR(20) DEFAULT 'Intermediate'"),
                ("timer_limit_sec", "INTEGER DEFAULT 90"),
                ("confidence_score", "INTEGER DEFAULT 75"),
                ("hesitation_rate", "FLOAT DEFAULT 0.0"),
                ("sentiment_tone", "VARCHAR(50) DEFAULT 'Calm & Professional'"),
                ("posture_score", "INTEGER DEFAULT 85"),
                ("posture_status", "VARCHAR(50) DEFAULT 'Centered & Stable'"),
                ("clarity_score", "INTEGER DEFAULT 7"),
                ("depth_score", "INTEGER DEFAULT 7"),
                ("weak_areas", "TEXT DEFAULT '[]'"),
                ("model_answer", "TEXT DEFAULT ''"),
                ("follow_up_qa", "TEXT DEFAULT '[]'")
            ]
            
            for col_name, col_def in new_s_cols:
                if col_name not in existing_s_cols:
                    conn.execute(text(f"ALTER TABLE interview_sessions ADD COLUMN {col_name} {col_def}"))
                    
            conn.commit()
    except Exception as e:
        print(f"[DB Migration Note] {e}")

    # Seed questions if empty or replenish with rich questions
    db = SessionLocal()
    try:
        amazon_count = db.query(Question).filter(Question.company_preset == "amazon").count()
        if amazon_count == 0:
            for item in SEED_QUESTIONS:
                # Check if question text already exists
                exists = db.query(Question).filter(Question.question_text == item["question_text"]).first()
                if not exists:
                    q = Question(
                        category=item["category"],
                        role=item.get("role", "general"),
                        company_preset=item.get("company_preset", "general"),
                        difficulty=item.get("difficulty", "Intermediate"),
                        language=item.get("language", "en"),
                        question_text=item["question_text"],
                        tips=item.get("tips"),
                        star_guidance=item.get("star_guidance")
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
