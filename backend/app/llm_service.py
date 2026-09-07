import json
import os
import re
from typing import Any

import anthropic

from app.models import ContentFeedback

LLM_PROMPT_TEMPLATE = """You are an expert interview coach. You will be given an interview question and a candidate's spoken answer (transcribed from audio, so it may have minor transcription errors — ignore those).

Question: {question}
Category: {category}
Candidate's answer: {transcript}

Evaluate the answer and respond ONLY with valid JSON in this exact format:
{{
  "relevance_score": <1-10, how directly the answer addresses the question>,
  "structure_score": <1-10, how well-organized the answer is>,
  "uses_star_method": <true/false, only relevant for behavioral questions, otherwise null>,
  "strengths": ["<specific strength 1>", "<specific strength 2>"],
  "improvements": ["<specific actionable tip 1>", "<specific actionable tip 2>", "<specific actionable tip 3>"],
  "overall_summary": "<2-3 sentence summary of the answer's quality>"
}}

Be specific and constructive, not generic. Reference actual content from the answer in your feedback.
"""


def extract_json_from_text(text: str) -> dict[str, Any]:
    """Extracts JSON object from LLM response text even if wrapped in markdown blocks."""
    text = text.strip()
    # Try direct parse
    try:
        return json.loads(text)
    except Exception:
        pass

    # Try extracting from ```json ... ``` code block
    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except Exception:
            pass

    # Try finding the outermost braces { ... }
    match = re.search(r"(\{.*\})", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except Exception:
            pass

    raise ValueError(f"Could not parse valid JSON from LLM output: {text[:200]}")


def generate_heuristic_feedback(question: str, category: str, transcript: str) -> ContentFeedback:
    """
    Intelligent local fallback evaluator when Anthropic API Key is not configured.
    Ensures immediate offline functionality and demos without failures.
    """
    words = transcript.strip().split()
    word_count = len(words)
    transcript_lower = transcript.lower()
    
    # Check STAR method indicators for behavioral questions
    has_situation = any(k in transcript_lower for k in ["situation", "when i was", "at my previous", "in my last role", "back when"])
    has_task = any(k in transcript_lower for k in ["task", "goal", "challenge", "problem was", "responsibility"])
    has_action = any(k in transcript_lower for k in ["action", "i decided", "i implemented", "i created", "i resolved", "i led", "i built"])
    has_result = any(k in transcript_lower for k in ["result", "outcome", "finally", "as a result", "achieved", "improved", "learned"])
    
    star_components_count = sum([has_situation, has_task, has_action, has_result])
    uses_star = star_components_count >= 2 if category.lower() == "behavioral" else None

    # Base scoring logic
    if word_count < 15:
        relevance = 3
        structure = 3
        strengths = ["Began attempting to address the prompt."]
        improvements = [
            "Elaborate with concrete details and examples; your answer was too brief.",
            "Provide specific context and measurable outcomes.",
            "Aim for a 60-90 second comprehensive explanation."
        ]
        summary = "Your answer was very brief. To make a strong impression, elaborate with clear examples, context, and actionable takeaways."
    elif word_count < 50 and not (category.lower() == "behavioral" and star_components_count >= 3):
        relevance = 6
        structure = 5
        strengths = [
            "Addressed the core subject of the question.",
            "Maintained a direct and concise speaking style."
        ]
        improvements = [
            "Add depth by mentioning specific technologies, metrics, or frameworks.",
            "Elaborate on the 'why' behind your decisions, not just 'what' happened.",
            "Include a summary wrap-up sentence at the end of your response."
        ]
        summary = "A concise start that directly targets the question. Expanding on technical or situational specifics will significantly elevate your delivery."
    else:
        # Detailed or well-structured answer
        relevance = 8
        structure = 8 if (category.lower() != "behavioral" or uses_star) else 7
        
        sample_phrase = " ".join(words[:6]) + "..."
        strengths = [
            f"Clear articulation of your approach when discussing '{sample_phrase}'.",
            "Demonstrated substantive depth with a natural progression of ideas."
        ]
        improvements = [
            "Quantify your results (e.g., percentages, team sizes, latency improvements) to increase credibility.",
            "Conclude with a high-impact statement reinforcing the core takeaway for the interviewer.",
            "Refine transitions between your main points to ensure seamless flow."
        ]
        if category.lower() == "behavioral" and not uses_star:
            improvements.insert(0, "Adopt the STAR framework (Situation, Task, Action, Result) for structured storytelling.")
        
        summary = f"Strong and articulate response that effectively addresses '{question[:45]}...'. Incorporating quantifiable impacts will make your answer stand out even further."

    return ContentFeedback(
        relevance_score=relevance,
        structure_score=structure,
        uses_star_method=uses_star,
        strengths=strengths,
        improvements=improvements,
        overall_summary=summary
    )


def evaluate_content_feedback(question: str, category: str, transcript: str) -> ContentFeedback:
    """
    Evaluates interview response using Anthropic Claude API.
    Falls back gracefully to heuristic feedback if API key is not present or API call fails.
    """
    api_key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    
    if not api_key:
        print("[LLM Service] No ANTHROPIC_API_KEY found in environment. Using local intelligent coach evaluator.")
        return generate_heuristic_feedback(question, category, transcript)

    model_name = os.environ.get("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")
    
    try:
        client = anthropic.Anthropic(api_key=api_key)
        prompt_content = LLM_PROMPT_TEMPLATE.format(
            question=question,
            category=category,
            transcript=transcript if transcript.strip() else "(Candidate provided no audible answer)"
        )
        
        response = client.messages.create(
            model=model_name,
            max_tokens=1000,
            messages=[
                {"role": "user", "content": prompt_content}
            ]
        )
        
        block = response.content[0]
        raw_text = getattr(block, "text", str(block))
        data = extract_json_from_text(raw_text)
        
        return ContentFeedback(
            relevance_score=int(data.get("relevance_score", 7)),
            structure_score=int(data.get("structure_score", 7)),
            uses_star_method=data.get("uses_star_method") if category.lower() == "behavioral" else None,
            strengths=data.get("strengths", ["Clear communication"]),
            improvements=data.get("improvements", ["Elaborate with additional context"]),
            overall_summary=data.get("overall_summary", "Good interview response.")
        )
    except Exception as e:
        print(f"[LLM Service] Anthropic API call failed ({e}). Falling back to heuristic evaluator.")
        return generate_heuristic_feedback(question, category, transcript)
