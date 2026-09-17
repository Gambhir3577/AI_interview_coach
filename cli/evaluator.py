"""
Answer Evaluator & Fluency Analyzer Module
Implements keyword-based scoring, answer length validation, filler word counting,
and follow-up question trigger logic.
"""

import re
from typing import Any, Dict, List, Set, Tuple

# Common filler words and phrases to detect in spoken/typed answers
FILLER_WORDS = [
    "um",
    "uh",
    "like",
    "actually",
    "basically",
    "literally",
    "you know",
    "sort of",
    "kind of",
    "i mean",
    "honestly",
    "right"
]


def count_words(text: str) -> int:
    """
    Returns the total word count in the given text.
    
    Args:
        text: Candidate response text.
        
    Returns:
        Integer count of words.
    """
    return len(text.strip().split()) if text.strip() else 0


def count_filler_words(text: str) -> Tuple[int, Dict[str, int], str]:
    """
    Counts filler words and phrases in the candidate's answer.
    
    Args:
        text: Candidate response text.
        
    Returns:
        Tuple of (total_filler_count, filler_breakdown_dict, fluency_note).
    """
    if not text.strip():
        return 0, {}, "No answer provided."

    lower_text = text.lower()
    breakdown: Dict[str, int] = {}
    total_fillers = 0

    # 1. Match multi-word phrases first
    for phrase in ["you know", "sort of", "kind of", "i mean"]:
        count = len(re.findall(r"\b" + re.escape(phrase) + r"\b", lower_text))
        if count > 0:
            breakdown[phrase] = count
            total_fillers += count
            # Remove matched multi-word phrase to avoid double counting individual words
            lower_text = re.sub(r"\b" + re.escape(phrase) + r"\b", " ", lower_text)

    # 2. Match single-word fillers
    single_fillers = [w for w in FILLER_WORDS if " " not in w]
    tokens = re.findall(r"\b[a-z]+\b", lower_text)
    for token in tokens:
        if token in single_fillers:
            breakdown[token] = breakdown.get(token, 0) + 1
            total_fillers += 1

    # Fluency assessment note
    word_count = count_words(text)
    if total_fillers == 0:
        fluency_note = "⭐ Excellent fluency! Zero filler words detected."
    elif total_fillers <= 2:
        fluency_note = f"👍 Good fluency. Minor filler usage ({total_fillers} found)."
    else:
        filler_rate = (total_fillers / max(1, word_count)) * 100
        fluency_note = (
            f"⚠️ Noticeable filler density ({total_fillers} fillers, ~{filler_rate:.1f}% of words). "
            f"Tip: Practice comfortable pauses instead of filler words like 'um' or 'basically'."
        )

    return total_fillers, breakdown, fluency_note


def score_keywords(answer: str, expected_keywords: List[str]) -> Tuple[int, List[str], List[str]]:
    """
    Scores the candidate's answer out of 10 based on the presence of expected keywords.
    
    Args:
        answer: Candidate response text.
        expected_keywords: List of target domain keywords/concepts.
        
    Returns:
        Tuple of (score_out_of_10, matched_keywords_list, missing_keywords_list).
    """
    if not answer.strip() or not expected_keywords:
        return 0, [], expected_keywords

    clean_answer = answer.lower()
    matched: List[str] = []
    missing: List[str] = []

    for kw in expected_keywords:
        kw_clean = kw.lower().strip()
        # Substring or word boundary search
        pattern = r"\b" + re.escape(kw_clean)
        if re.search(pattern, clean_answer) or kw_clean in clean_answer:
            matched.append(kw)
        else:
            missing.append(kw)

    total_expected = len(expected_keywords)
    match_ratio = len(matched) / max(1, total_expected)

    # Base score proportional to matched keyword ratio
    raw_score = match_ratio * 10.0

    # Length calibration bonus: reward substantial, well-articulated answers (>= 30 words)
    words = count_words(answer)
    if words >= 30 and len(matched) >= 1:
        raw_score = min(10.0, raw_score + 1.0)
    elif words < 10:
        # Severe penalty for answers under 10 words
        raw_score = min(3.0, raw_score)

    score_out_of_10 = max(0, min(10, round(raw_score)))
    return score_out_of_10, matched, missing


def evaluate_answer(
    answer: str,
    expected_keywords: List[str],
    time_taken_seconds: float,
    time_limit_seconds: float = 90.0
) -> Dict[str, Any]:
    """
    Comprehensive evaluation of an interview answer.
    
    Args:
        answer: The candidate's text answer.
        expected_keywords: List of expected domain keywords.
        time_taken_seconds: Duration in seconds taken to answer.
        time_limit_seconds: Recommended time limit threshold (default 90s).
        
    Returns:
        A dictionary with score, metrics, length check, filler counts, and follow-up trigger.
    """
    word_count = count_words(answer)
    is_too_brief = word_count < 10
    
    score, matched_kw, missing_kw = score_keywords(answer, expected_keywords)
    total_fillers, filler_breakdown, fluency_note = count_filler_words(answer)
    
    exceeded_time = time_taken_seconds > time_limit_seconds

    # Brevity feedback
    if is_too_brief:
        length_feedback = (
            f"⚠️ Answer is too brief ({word_count} words). "
            f"Tip: Aim for at least 30-80 words using the STAR method (Situation, Task, Action, Result)."
        )
    elif word_count < 25:
        length_feedback = f"ℹ️ Concise answer ({word_count} words). Adding concrete examples would strengthen impact."
    else:
        length_feedback = f"✅ Good response length ({word_count} words)."

    # Timing feedback
    if exceeded_time:
        timing_feedback = (
            f"⏱️ Time limit exceeded ({time_taken_seconds:.1f}s vs {time_limit_seconds:.0f}s limit). "
            f"Work on delivering punchier, structured summaries."
        )
    else:
        timing_feedback = f"⏱️ Excellent timing ({time_taken_seconds:.1f}s within {time_limit_seconds:.0f}s limit)."

    # Follow-up question trigger logic: trigger if low score (< 5) or too brief (< 10 words)
    trigger_follow_up = (score < 5) or is_too_brief

    return {
        "score": score,
        "word_count": word_count,
        "is_too_brief": is_too_brief,
        "length_feedback": length_feedback,
        "time_taken_seconds": round(time_taken_seconds, 1),
        "exceeded_time": exceeded_time,
        "timing_feedback": timing_feedback,
        "matched_keywords": matched_kw,
        "missing_keywords": missing_kw,
        "total_fillers": total_fillers,
        "filler_breakdown": filler_breakdown,
        "fluency_note": fluency_note,
        "trigger_follow_up": trigger_follow_up
    }
