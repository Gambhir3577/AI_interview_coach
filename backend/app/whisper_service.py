import shutil
import subprocess
import wave
from typing import Any

import whisper  # type: ignore[import-untyped]

_whisper_model: Any | None = None


def get_ffmpeg_executable() -> str:
    """Finds available ffmpeg binary from PATH or imageio_ffmpeg."""
    ffmpeg_path = shutil.which("ffmpeg")
    if ffmpeg_path:
        return ffmpeg_path
    try:
        import imageio_ffmpeg  # type: ignore[import-untyped]
        return str(imageio_ffmpeg.get_ffmpeg_exe())
    except Exception:
        raise RuntimeError("No ffmpeg executable found. Please install ffmpeg or imageio-ffmpeg.")


def extract_audio_from_video(video_path: str, output_wav_path: str) -> str:
    """Extracts 16kHz mono WAV audio track from video using ffmpeg."""
    ffmpeg_exe = get_ffmpeg_executable()
    cmd = [
        ffmpeg_exe,
        "-y",
        "-i", video_path,
        "-vn",
        "-acodec", "pcm_s16le",
        "-ar", "16000",
        "-ac", "1",
        output_wav_path
    ]
    result = subprocess.run(cmd, capture_output=True, check=False)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg audio extraction failed: {result.stderr.decode('utf-8', errors='ignore')}")
    return output_wav_path


def get_audio_duration_seconds(wav_path: str) -> float:
    """Calculates duration of WAV file in seconds."""
    try:
        with wave.open(wav_path, "rb") as wf:
            frames = wf.getnframes()
            rate = wf.getframerate()
            if rate > 0:
                return float(frames) / float(rate)
    except Exception:
        pass
    return 0.0


def load_whisper_model(model_name: str = "base") -> Any:
    """Singleton loader for Whisper model."""
    global _whisper_model
    if _whisper_model is None:
        # Load whisper model
        _whisper_model = whisper.load_model(model_name)
    return _whisper_model


def transcribe_audio(audio_path: str, model_name: str = "base") -> dict[str, Any]:
    """
    Transcribes audio file using local OpenAI Whisper.
    Returns dictionary with transcript text, segments, language, and duration.
    """
    model = load_whisper_model(model_name)
    # Transcribe with fp16=False for cross-platform CPU/Apple Silicon compatibility
    result = model.transcribe(audio_path, fp16=False, word_timestamps=True)
    
    transcript = result.get("text", "").strip()
    segments = result.get("segments", [])
    duration = get_audio_duration_seconds(audio_path)
    
    if duration == 0.0 and segments:
        duration = segments[-1].get("end", 0.0)

    return {
        "text": transcript,
        "segments": segments,
        "language": result.get("language", "en"),
        "duration_seconds": max(duration, 0.1)
    }
