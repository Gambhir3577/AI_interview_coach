import os
import re

from pydub import AudioSegment  # type: ignore[import-untyped]
from pydub.silence import detect_silence  # type: ignore[import-untyped]

from app.models import HighlightedToken, PauseDetail, SpeechMetrics

# Standard and extended filler words & hedging phrases
FILLER_PATTERNS = [
    (r"\bum\b", "um"),
    (r"\buh\b", "uh"),
    (r"\byou know\b", "you know"),
    (r"\bbasically\b", "basically"),
    (r"\bactually\b", "actually"),
    (r"\bi mean\b", "i mean"),
    (r"\bkind of\b", "kind of"),
    (r"\bsort of\b", "sort of"),
    (r"\blike\b", "like"),
    (r"\bso\b", "so"),
    (r"\bright\b", "right"),
    (r"\bliterally\b", "literally"),
    (r"\bhonestly\b", "honestly"),
    (r"\bto be honest\b", "to be honest"),
    (r"\byou see\b", "you see"),
]

# Vocabulary sentiment markers
ASSERTIVE_WORDS = {"achieved", "delivered", "engineered", "spearheaded", "orchestrated", "resolved", "improved", "designed", "optimized", "led", "decided", "executed", "ensured", "boosted", "eliminated"}
HESITANT_WORDS = {"maybe", "i guess", "probably", "i think", "not sure", "sorta", "kinda", "hopefully", "i suppose"}
ENTHUSIASTIC_WORDS = {"excited", "passionate", "thrilled", "love", "fantastic", "energized", "proud", "exceptional"}


def tokenize_with_fillers(transcript: str) -> tuple[list[HighlightedToken], int, dict[str, int]]:
    """
    Tokenizes the transcript and detects filler words/phrases,
    returning highlighted tokens, total filler count, and breakdown dict.
    """
    if not transcript or not transcript.strip():
        return [], 0, {}

    # Identify all multi-word and single-word filler spans
    filler_spans = []
    text_lower = transcript.lower()

    for pattern, name in FILLER_PATTERNS:
        for match in re.finditer(pattern, text_lower):
            filler_spans.append((match.start(), match.end(), name))

    # Sort spans by start index, remove overlapping spans (prefer longer/earlier)
    filler_spans.sort(key=lambda x: (x[0], -(x[1] - x[0])))
    filtered_spans = []
    last_end = 0
    for start, end, name in filler_spans:
        if start >= last_end:
            filtered_spans.append((start, end, name))
            last_end = end

    # Build token list and counts
    breakdown: dict[str, int] = {}
    tokens: list[HighlightedToken] = []
    curr = 0

    for start, end, name in filtered_spans:
        if start > curr:
            non_filler_part = transcript[curr:start]
            parts = re.split(r"(\s+)", non_filler_part)
            for p in parts:
                if p:
                    tokens.append(HighlightedToken(text=p, is_filler=False))
        
        filler_text = transcript[start:end]
        tokens.append(HighlightedToken(text=filler_text, is_filler=True, filler_type=name))
        breakdown[name] = breakdown.get(name, 0) + 1
        curr = end

    if curr < len(transcript):
        remainder = transcript[curr:]
        parts = re.split(r"(\s+)", remainder)
        for p in parts:
            if p:
                tokens.append(HighlightedToken(text=p, is_filler=False))

    total_fillers = sum(breakdown.values())
    return tokens, total_fillers, breakdown


def calculate_wpm(word_count: int, duration_seconds: float) -> tuple[float, str]:
    """Calculates Words Per Minute and pace status."""
    if duration_seconds <= 0 or word_count == 0:
        return 0.0, "No Speech Detected"

    minutes = duration_seconds / 60.0
    wpm = round(word_count / minutes, 1)

    if wpm < 110:
        status = "Too Slow"
    elif 110 <= wpm < 120:
        status = "Slightly Slow"
    elif 120 <= wpm <= 160:
        status = "Ideal Pace"
    elif 160 < wpm <= 180:
        status = "Slightly Fast"
    else:
        status = "Too Fast"

    return wpm, status


def detect_pauses_in_audio(audio_wav_path: str, min_silence_len_ms: int = 2000, silence_thresh_db: int = -36) -> tuple[int, float, list[PauseDetail]]:
    """
    Detects long pauses in audio using pydub.
    Flags silences > 3.0 seconds as long pauses.
    """
    if not os.path.exists(audio_wav_path):
        return 0, 0.0, []

    try:
        audio = AudioSegment.from_wav(audio_wav_path)
        thresh = min(silence_thresh_db, audio.dBFS - 14) if audio.dBFS > -50 else silence_thresh_db
        silence_ranges = detect_silence(audio, min_silence_len=min_silence_len_ms, silence_thresh=thresh)
        
        pause_details: list[PauseDetail] = []
        pauses_over_3s = 0
        total_pause_time = 0.0

        for start_ms, end_ms in silence_ranges:
            dur_sec = round((end_ms - start_ms) / 1000.0, 2)
            if dur_sec >= 2.0:
                pause_details.append(PauseDetail(
                    start_time=round(start_ms / 1000.0, 2),
                    end_time=round(end_ms / 1000.0, 2),
                    duration_seconds=dur_sec
                ))
                total_pause_time += dur_sec
                if dur_sec >= 3.0:
                    pauses_over_3s += 1

        return pauses_over_3s, round(total_pause_time, 2), pause_details
    except Exception as e:
        print(f"Warning: Audio silence detection encountered: {e}")
        return 0, 0.0, []


def compute_sentiment_and_confidence(
    transcript: str,
    wpm: float,
    filler_rate_per_100: float,
    pauses_over_3s: int,
    duration_seconds: float
) -> tuple[int, float, str, str]:
    """
    Calculates vocal confidence score, hesitation rate, sentiment tone, and cadence consistency.
    """
    if not transcript or duration_seconds <= 2:
        return 50, 0.0, "Neutral", "Uncertain"

    words = re.findall(r"\b\w+\b", transcript.lower())
    total_words = len(words)
    if total_words == 0:
        return 50, 0.0, "Neutral", "Uncertain"

    # Count assertive vs hesitant markers
    assertive_count = sum(1 for w in words if w in ASSERTIVE_WORDS)
    hesitant_count = sum(1 for w in words if w in HESITANT_WORDS)
    enthusiastic_count = sum(1 for w in words if w in ENTHUSIASTIC_WORDS)

    # Base confidence score starts at 85
    confidence = 85.0

    # Penalize extreme paces
    if wpm < 100 or wpm > 175:
        confidence -= 12.0
    elif wpm < 115 or wpm > 160:
        confidence -= 6.0

    # Penalize filler rate
    if filler_rate_per_100 > 6.0:
        confidence -= 20.0
    elif filler_rate_per_100 > 3.5:
        confidence -= 12.0
    elif filler_rate_per_100 > 1.5:
        confidence -= 5.0

    # Penalize long pauses
    confidence -= (pauses_over_3s * 6.0)

    # Reward assertive vocabulary
    confidence += min(10.0, assertive_count * 2.5)
    # Penalize hesitant vocabulary
    confidence -= min(15.0, hesitant_count * 3.0)

    final_confidence = max(20, min(98, int(round(confidence))))

    # Hesitation rate per minute
    minutes = max(0.2, duration_seconds / 60.0)
    hesitation_events = (filler_rate_per_100 * total_words / 100.0) + (pauses_over_3s * 1.5) + hesitant_count
    hesitation_rate = round(hesitation_events / minutes, 1)

    # Sentiment classification
    if assertive_count >= 2 and final_confidence >= 80:
        sentiment_tone = "Assertive & Direct"
    elif enthusiastic_count >= 2:
        sentiment_tone = "Enthusiastic & High Energy"
    elif hesitant_count >= 2 or final_confidence < 60:
        sentiment_tone = "Hesitant & Guarded"
    elif "data" in words or "metric" in words or "system" in words or "algorithm" in words:
        sentiment_tone = "Analytical & Structured"
    else:
        sentiment_tone = "Calm & Professional"

    # Cadence consistency
    if 120 <= wpm <= 155 and filler_rate_per_100 <= 2.5 and pauses_over_3s == 0:
        cadence_consistency = "Steady & Highly Controlled"
    elif wpm > 165:
        cadence_consistency = "Slightly Rushed"
    elif wpm < 110:
        cadence_consistency = "Deliberate & Slow"
    else:
        cadence_consistency = "Moderate Flow"

    return final_confidence, hesitation_rate, sentiment_tone, cadence_consistency


def analyze_speech(transcript: str, duration_seconds: float, audio_wav_path: str | None = None) -> tuple[SpeechMetrics, list[HighlightedToken]]:
    """
    Full speech analysis pipeline:
    - Tokenization & filler detection
    - WPM pace calculation
    - Silence & pause detection
    - Confidence & sentiment tone calculation
    """
    clean_words = [w for w in re.findall(r"\b\w+\b", transcript)]
    total_words = len(clean_words)

    # Filler detection
    tokens, filler_count, filler_breakdown = tokenize_with_fillers(transcript)

    # Filler rate per 100 words
    filler_rate = round((filler_count / total_words) * 100.0, 1) if total_words > 0 else 0.0

    # WPM pace
    wpm, wpm_status = calculate_wpm(total_words, duration_seconds)

    # Pauses
    pauses_over_3s = 0
    total_pause_time = 0.0
    pause_details: list[PauseDetail] = []
    if audio_wav_path and os.path.exists(audio_wav_path):
        pauses_over_3s, total_pause_time, pause_details = detect_pauses_in_audio(audio_wav_path)

    # Sentiment, Confidence, Hesitation
    confidence_score, hesitation_rate, sentiment_tone, cadence_consistency = compute_sentiment_and_confidence(
        transcript=transcript,
        wpm=wpm,
        filler_rate_per_100=filler_rate,
        pauses_over_3s=pauses_over_3s,
        duration_seconds=duration_seconds
    )

    speech_metrics = SpeechMetrics(
        total_words=total_words,
        duration_seconds=round(duration_seconds, 2),
        wpm=wpm,
        wpm_status=wpm_status,
        ideal_wpm_range="120 - 160 WPM",
        filler_count=filler_count,
        filler_rate_per_100=filler_rate,
        filler_breakdown=filler_breakdown,
        pauses_over_3s=pauses_over_3s,
        total_pause_time=total_pause_time,
        pause_details=pause_details,
        confidence_score=confidence_score,
        hesitation_rate=hesitation_rate,
        sentiment_tone=sentiment_tone,
        cadence_consistency=cadence_consistency
    )

    return speech_metrics, tokens
