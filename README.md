# AI Interview Coach (MVP)

A multimodal AI-powered web application that helps candidates practice mock interview questions with their webcam and microphone, producing an automated feedback report analyzing speech fluency, content quality, and eye contact.

---

## Architecture & System Design Overview

```
+-----------------------------------------------------------------------------------+
|                                 REACT FRONTEND                                    |
|                                                                                   |
|  [ Category Selection ]  --->  [ Recording Studio ]  --->  [ Comprehensive Report ]|
|  - HR / Tech / Behavioral     - Live Webcam View           - Speech Quality Card  |
|  - Random / Select Question   - Audio Meter + Timer        - Eye Contact Card     |
|  - History Modal              - MediaRecorder WebM/MP4     - Content / STAR Card  |
|                                                            - Transcript Viewer    |
+------------------------------------------+----------------------------------------+
                                           |
                                           | POST /analyze (FormData: video, q_id)
                                           v
+-----------------------------------------------------------------------------------+
|                                FASTAPI BACKEND                                    |
|                                                                                   |
|  1. Video Ingestion & Audio Track Extraction (FFmpeg / imageio-ffmpeg)            |
|  2. Speech Transcription (Local Whisper `base` -> transcript + segments)          |
|  3. Speech Metrics (Filler words per 100, WPM pace gauge, >3s pause detection)    |
|  4. Eye Tracking (MediaPipe Face Mesh -> Iris landmark centering proxy %)         |
|  5. AI Content Coach (Anthropic Claude structured JSON prompt + fallback)         |
|  6. Database Persistence (SQLite session record + history retrieval)              |
+-----------------------------------------------------------------------------------+
```

### Architectural Rationale & Design Trade-offs
Rather than training custom neural networks from scratch for an MVP, this application deliberately employs **pretrained foundation models and targeted multimodal orchestration**:
- **OpenAI Whisper (Local `base` model)**: Runs directly on-device without API latency, external dependencies, or recurring per-minute audio transcription costs.
- **MediaPipe Face Mesh (On-Device Vision)**: Extracts 468+ facial & iris landmarks to compute real-time gaze alignment as an engagement proxy metric.
- **Anthropic Claude (`claude-3-5-sonnet`)**: Leverages advanced reasoning to evaluate complex answer relevance, structural storytelling (STAR method), and actionable strengths & improvement tips.
- **SQLite Database**: Lightweight, zero-config relational store for curated question banks and candidate session histories.

---

## Tech Stack

- **Backend**: Python 3.10+ / FastAPI, SQLAlchemy, Pydantic, Uvicorn
- **Speech-to-Text**: OpenAI Whisper (Local `base` model)
- **Audio Processing**: FFmpeg / `imageio-ffmpeg`, Pydub (Silence & pause detection)
- **Computer Vision**: OpenCV, MediaPipe Face Mesh (Iris tracking)
- **AI Content Feedback**: Anthropic Claude API (`claude-3-5-sonnet` / `claude-sonnet-4-6`)
- **Frontend**: React 18, Vite, Canvas-Confetti, Lucide-React
- **Styling**: Vanilla CSS Design System with dark-mode glassmorphism

---

## Project Structure

```
AI_interview_coach/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                  # FastAPI server & /analyze pipeline
│   │   ├── models.py                # Pydantic data schemas
│   │   ├── db.py                    # SQLite models & 30-question seed bank
│   │   ├── whisper_service.py       # Audio extraction & local Whisper transcription
│   │   ├── speech_metrics.py        # WPM, filler word regex & pause detection
│   │   ├── face_tracking_service.py # MediaPipe Face Mesh & iris engagement tracking
│   │   └── llm_service.py           # Anthropic Claude structured content evaluator
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx           # Top navigation & backend status indicator
│   │   │   ├── CategorySelect.jsx   # Domain selector & question browser
│   │   │   ├── RecordingScreen.jsx  # Webcam recording studio & audio meter
│   │   │   ├── FeedbackReport.jsx   # Multimodal feedback dashboard & gauges
│   │   │   ├── Gauges.jsx           # SVG speedometers & circular score meters
│   │   │   └── HistoryModal.jsx     # Past practice session log & report reloader
│   │   ├── App.jsx                  # Main React container & routing
│   │   ├── index.css                # Glassmorphic dark design tokens
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
└── README.md
```

---

## Quickstart & Setup Guide

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate Python virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Set your Anthropic API Key for live Claude evaluations
# If not set, the app will use its built-in intelligent coach fallback evaluator
export ANTHROPIC_API_KEY="sk-ant-api..."

# Start FastAPI development server
uvicorn app.main:app --reload --port 8000
```

The backend server will start at `http://localhost:8000`. You can test interactive API documentation at `http://localhost:8000/docs`.

### 2. Frontend Setup

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Vite dev server
npm run dev
```

The React frontend will start at `http://localhost:5173`.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server & model health status |
| `GET` | `/questions?category={hr\|technical\|behavioral}` | Returns random question from domain |
| `GET` | `/questions/all` | Returns all 30 curated questions in database |
| `POST` | `/analyze` | Ingests video recording (`multipart/form-data`) + question ID, returns full report |
| `GET` | `/history` | Returns summary list of past practice sessions |
| `GET` | `/history/{session_id}` | Retrieves full feedback report for a past session |

---

## Feedback Metrics Explained

1. **Speaking Pace (WPM)**:
   - Target range: **120 – 160 WPM**.
   - Faster than 160 WPM is flagged as slightly/too fast; under 120 WPM is flagged as slightly/too slow.
2. **Filler Words**:
   - Scans for `["um", "uh", "like", "you know", "basically", "actually", "so", "i mean", "kind of", "sort of", "right"]`.
   - Computes filler occurrences per 100 words and highlights them in the spoken transcript.
3. **Pauses & Fluency**:
   - Detects audio silences > 3.0 seconds to help candidates identify unnatural hesitations.
4. **Eye Contact & Engagement**:
   - Uses MediaPipe Face Mesh to calculate the percentage of time the candidate looked into the camera.
   - *Note: Clearly labeled as an engagement/eye-contact proxy metric, not emotion detection.*
5. **Content Quality & STAR Method**:
   - Evaluates relevance (1-10), structure (1-10), STAR method adherence, strengths, and actionable improvement points.
