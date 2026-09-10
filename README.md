# AI Interview Coach Pro 2.0

A multimodal AI-powered web platform that helps candidates practice mock interview questions with their webcam and microphone, producing an automated feedback report analyzing multi-dimensional content rubrics (Structure, Clarity, Relevance, Depth), rewritten model answers, speaking pace, filler words, vocal confidence tone, and head posture/gaze stability.

---

## Key Features

### 1. Core Practice Experience
- **Role/Company-Specific Question Banks**: Software Engineering, Product Management, Data Science & ML, System Design, Behavioral, Growth/Marketing, and Finance across Junior, Mid, Senior, and Lead tiers.
- **Company Style Presets**: Amazon (16 Leadership Principles), Google (Structured Problem Solving & Googleyness), Meta (Fast Impact), Apple (Craft), and McKinsey (MECE Case).
- **Voice-Based Mock Interviews**: Built-in AI voice question narrator (Web Speech Synthesis) with real-time speech recognition.
- **Dynamic Follow-Up Probing**: The AI interviewer asks adaptive, context-aware follow-up questions challenging candidate answers.
- **Guided STAR Mode**: Real-time visual checkpoints for Situation (15%), Task (15%), Action (50%), and Result (20%).
- **Timed Rounds**: Configurable 30s, 60s, 90s, 2m, 3m, and 5m high-pressure countdown timer modes with audio/visual warnings.

### 2. Feedback & Analysis
- **Multi-Dimensional Rubric Scoring**: Structure, Clarity, Relevance, and Technical/Domain Depth (0-10 scales + 0-100 composite index).
- **Rewritten "Model Answer" Comparison**: Side-by-side comparison showing how the candidate's exact answer could be tightened and quantified.
- **Filler Word Detection**: Comprehensive detection of `um`, `uh`, `like`, `you know`, `basically`, `actually`, `so`, `literally`, etc.
- **Sentiment & Confidence Tone**: Vocal confidence score (0-100), hesitation rate per minute, and sentiment mood classification.
- **Gaze & Head Posture Stability**: MediaPipe Face Mesh tracking iris alignment and head posture stability.

### 3. Personalization & Motivation
- **Resume & JD Auto-Question Generator**: Upload or paste Resume + Job Description to auto-generate 5 tailored questions.
- **Candidate Analytics Dashboard**: Improvement trend lines, domain proficiency radar, weak-spot alerts, and adaptive level recommendations.
- **Gamification & Badges**: Daily practice streaks 🔥, XP levels, and unlockable achievement badges.
- **Downloadable Reports & Sharing**: PDF/HTML printable reports, JSON export, and shareable mentor review links.

### 4. Extra Utilities
- **Salary Negotiation Practice Simulator**: Interactive roleplay with an AI hiring manager negotiating Base, Equity, and Bonus packages.
- **Role-Specific Q&A Cheat Sheet Generator**: Generates top 10 anticipated questions, STAR framework blueprints, pitfalls, and printable checklists.
- **Post-Interview Debrief**: Log real interview experiences, estimate pass probability %, diagnose risks, and draft custom thank-you emails.
- **Multi-Language Support**: English, Español, Français, Deutsch, 中文, हिन्दी, 日本語, and Português.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server & model health status |
| `GET` | `/questions?role={role}&difficulty={tier}&company_preset={preset}` | Returns filtered random question |
| `GET` | `/questions/all` | Returns all questions in the bank |
| `POST` | `/analyze` | Ingests video recording (`multipart/form-data`) + question ID, returns full report |
| `GET` | `/history` | Returns summary list of past practice sessions |
| `GET` | `/history/{session_id}` | Retrieves full feedback report for a past session |
| `POST` | `/interview/follow-up` | Generates dynamic interviewer follow-up probe |
| `POST` | `/interview/generate-from-jd` | Auto-generates tailored questions from Resume and JD |
| `POST` | `/negotiation/chat` | Simulates interactive salary counteroffer turns |
| `POST` | `/cheatsheet/generate` | Generates role-specific Q&A cheat sheet |
| `POST` | `/debrief/analyze` | Analyzes candidate real interview notes & drafts thank you email |
| `GET` | `/analytics/trends` | Returns score trends over time, weak-spot radar, and proficiencies |
| `GET` | `/gamification/profile` | Returns streaks, XP, level, and unlocked badges |
| `GET` | `/share/{session_id}` | Retrieves session for peer/mentor review |
| `POST` | `/share/{session_id}/review` | Submits mentor scorecard evaluation |

---

## Quickstart Guide

### 1. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173`.
