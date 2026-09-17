"""
Storage & Progress Tracker Module
Manages session persistence to a local JSON history file and computes
historical progress metrics across practice runs.
"""

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

HISTORY_FILE_PATH = Path(__file__).parent / "interview_history.json"


def load_history(filepath: Optional[Path] = None) -> List[Dict[str, Any]]:
    """
    Loads historical session records from the JSON history file.
    
    Args:
        filepath: Optional path to history file.
        
    Returns:
        List of past session dictionaries.
    """
    target = filepath or HISTORY_FILE_PATH
    if not target.exists():
        return []

    try:
        with open(target, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                return data
            if isinstance(data, dict) and "sessions" in data:
                return data["sessions"]
            return []
    except Exception as e:
        print(f"\n[Warning] Could not parse history file ({target.name}): {e}")
        return []


def save_session(session_record: Dict[str, Any], filepath: Optional[Path] = None) -> bool:
    """
    Appends a new interview session record to the JSON history file.
    
    Args:
        session_record: Dictionary containing full session details.
        filepath: Optional path to history file.
        
    Returns:
        True if successfully saved, False otherwise.
    """
    target = filepath or HISTORY_FILE_PATH
    history = load_history(target)
    history.append(session_record)

    try:
        with open(target, "w", encoding="utf-8") as f:
            json.dump(history, f, indent=2)
        return True
    except Exception as e:
        print(f"\n[Error] Failed to save session to {target.name}: {e}")
        return False


def get_progress_comparison(filepath: Optional[Path] = None) -> Dict[str, Any]:
    """
    Compares the user's last session score against previous sessions to track improvement.
    
    Args:
        filepath: Optional path to history file.
        
    Returns:
        Dictionary containing comparison summary stats.
    """
    history = load_history(filepath)
    if not history:
        return {
            "has_history": False,
            "total_sessions": 0,
            "message": "👋 Welcome to your first mock interview practice session! Let's establish your baseline score."
        }

    total_sessions = len(history)
    latest_session = history[-1]
    latest_avg = latest_session.get("average_score", 0.0)

    if total_sessions == 1:
        return {
            "has_history": True,
            "total_sessions": 1,
            "latest_score": latest_avg,
            "historical_avg": latest_avg,
            "delta": 0.0,
            "trend": "baseline",
            "message": f"📊 Previous Baseline Session: Average Score of {latest_avg:.1f}/10. Aim to beat it today!"
        }

    # Compare latest against previous session and all-time average
    prev_session = history[-2]
    prev_avg = prev_session.get("average_score", 0.0)
    all_scores = [s.get("average_score", 0.0) for s in history]
    overall_avg = sum(all_scores) / len(all_scores)
    
    delta = round(latest_avg - prev_avg, 1)

    if delta > 0:
        trend = "improved"
        indicator = "📈 IMPROVED"
        msg = f"{indicator}: Your average score increased by +{delta:.1f} pts (from {prev_avg:.1f} to {latest_avg:.1f}/10)!"
    elif delta < 0:
        trend = "declined"
        indicator = "📉 DECLINED"
        msg = f"{indicator}: Your average score dropped by {delta:.1f} pts (from {prev_avg:.1f} to {latest_avg:.1f}/10). Let's rebound!"
    else:
        trend = "steady"
        indicator = "➡️ STEADY"
        msg = f"{indicator}: Your score remained steady at {latest_avg:.1f}/10 compared to your last session."

    return {
        "has_history": True,
        "total_sessions": total_sessions,
        "latest_score": latest_avg,
        "prev_score": prev_avg,
        "overall_avg": round(overall_avg, 1),
        "delta": delta,
        "trend": trend,
        "message": msg
    }


def format_history_table(filepath: Optional[Path] = None) -> str:
    """
    Renders a formatted textual table of all past practice sessions.
    
    Args:
        filepath: Optional path to history file.
        
    Returns:
        Formatted multi-line string table.
    """
    history = load_history(filepath)
    if not history:
        return "\n  [No past interview sessions found. Start an interview to record your progress!]\n"

    lines = []
    lines.append("\n" + "=" * 78)
    lines.append("                  PAST INTERVIEW SESSIONS & PROGRESS HISTORY")
    lines.append("=" * 78)
    lines.append(f"{'#':<3} | {'Date & Time':<17} | {'Domain':<12} | {'Level':<8} | {'Q Count':<7} | {'Avg Score':<10} | {'Avg Time'}")
    lines.append("-" * 78)

    for idx, s in enumerate(history, 1):
        ts = s.get("timestamp", "")
        # Clean timestamp format
        try:
            dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            date_str = dt.strftime("%Y-%m-%d %H:%M")
        except Exception:
            date_str = ts[:16] if len(ts) >= 16 else ts

        domain = s.get("domain", "Mixed")
        difficulty = s.get("difficulty", "Mixed")
        q_count = str(s.get("questions_count", len(s.get("question_records", []))))
        avg_score = f"{s.get('average_score', 0.0):.1f}/10"
        avg_time = f"{s.get('average_time_seconds', 0.0):.1f}s"

        lines.append(f"{idx:<3} | {date_str:<17} | {domain:<12} | {difficulty:<8} | {q_count:<7} | {avg_score:<10} | {avg_time}")

    lines.append("=" * 78)
    
    # Summary footer
    all_scores = [s.get("average_score", 0.0) for s in history]
    overall_avg = sum(all_scores) / len(all_scores) if all_scores else 0.0
    lines.append(f"  Total Sessions: {len(history)}   |   Cumulative Average Score: {overall_avg:.1f}/10")
    lines.append("=" * 78 + "\n")

    return "\n".join(lines)
