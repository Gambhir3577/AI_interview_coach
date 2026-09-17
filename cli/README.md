# 🎤 AI Coach Interviewer (CLI Mock Practice Tool)

A lightweight, modular Python CLI application for interactive mock interview practice. It combines dynamic Anthropic Claude question generation (`claude-sonnet-4-6`), offline JSON fallback question banks, real-time stopwatch pacing, keyword scoring, filler word analysis, probing follow-up questions, and session progress tracking.

---

## 🌟 Key Features

1. **Question Bank**: Categorized offline questions stored in `questions.json` across **HR**, **Technical**, and **Behavioral** domains across **Easy**, **Medium**, and **Hard** tiers.
2. **AI Question Generation (Claude Sonnet)**: Uses the Anthropic API (`claude-sonnet-4-6`) to dynamically generate targeted questions with expected scoring keywords and tailored follow-up probes.
3. **Random Offline Fallback**: Automatically falls back to `random.choice()` from `questions.json` if the API key is missing, network is offline, or rate-limited.
4. **Per-Question Stopwatch**: Measures exact candidate response duration with the `time` module and flags responses exceeding 90 seconds.
5. **Keyword-Based Scoring**: Checks presence of key domain concepts and calculates a calibrated score out of 10.
6. **Answer Brevity Check**: Flags answers under 10 words as "too brief" and provides actionable STAR method tips.
7. **Filler Word Counter**: Counts fillers (`um`, `like`, `actually`, `basically`, `literally`, `you know`) and outputs fluency diagnostic notes.
8. **Follow-Up Probing Triggers**: Automatically triggers a context-aware follow-up question when scores drop below 5/10 or responses are too short.
9. **Session Analytics & Summaries**: Displays total score, average answer duration, filler density, and strongest/weakest performance areas.
10. **Persistent History**: Persists session records to `interview_history.json` with UTC timestamps.
11. **Progress Comparison**: Compares the user's current session score against past performance to report improvement trends (📈 Improved / 📉 Declined).
12. **Interactive CLI Menu**: Simple 3-option menu: `[1] Start Interview`, `[2] View Progress History`, `[3] Exit`.

---

## 📂 Project Architecture

```
cli/
├── __init__.py             # Package initializer
├── questions.json          # Fixed fallback question bank
├── question_generator.py   # Claude Sonnet AI generation + random.choice fallback
├── evaluator.py            # Keyword scoring, length check, filler counter, follow-up trigger
├── storage.py              # JSON history persistence & progress delta comparison
├── main.py                 # Interactive CLI loop, stopwatch, follow-up flow, summary report
├── test_cli.py             # Automated unit tests for all features
├── requirements.txt        # Optional anthropic package
└── README.md               # Documentation & viva guide
run_cli.py                  # Convenient root-level runner
```

---

## 🚀 Setup & Execution

### 1. Install Dependencies
```bash
pip install -r cli/requirements.txt
```

### 2. Configure Anthropic API Key (Optional)
To enable dynamic AI question generation with Claude:
```bash
export ANTHROPIC_API_KEY="your-anthropic-api-key-here"
```
> **Note**: If `ANTHROPIC_API_KEY` is not set, the tool runs completely offline using the built-in `questions.json` bank without errors.

### 3. Run the Application
From the repository root:
```bash
python run_cli.py
```
Or directly via the module:
```bash
python -m cli.main
```

---

## 🧪 Running Automated Tests

A dedicated test suite validates keyword scoring, filler detection, length checks, storage persistence, and fallback question generation:

```bash
python -m unittest cli/test_cli.py
```

---

## 🎓 Viva / Interview Code Explanation Guide

When explaining this application in an interview or academic viva, highlight these architectural decisions:

1. **Separation of Concerns**:
   - `question_generator.py` manages question sourcing (AI vs local).
   - `evaluator.py` is a pure function module containing deterministic NLP rules (regex filler matching, keyword scoring, timing).
   - `storage.py` isolates I/O operations and analytics calculations.
   - `main.py` handles terminal UX, state transitions, and user prompts.

2. **Fault-Tolerant AI Integration**:
   - The application never crashes when the AI service is unavailable. The `get_interview_question()` function uses a graceful try/except wrapper that falls back to `random.choice()` from the local bank.

3. **Time Complexity & Efficiency**:
   - Filler word detection and keyword matching use pre-compiled regex word boundaries (`\b`), running in $O(N)$ linear time relative to response length.
   - History loading reads and writes compact JSON files without heavy database overhead.
