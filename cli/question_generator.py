"""
Question Generator Module
Handles dynamic question generation using the Anthropic API (claude-sonnet-4-6)
with automatic fallback to the local JSON question bank using random.choice().
"""

import json
import os
import random
from pathlib import Path
from typing import Any, Dict, List, Optional

# Path to the fallback questions JSON bank
QUESTIONS_FILE_PATH = Path(__file__).parent / "questions.json"


def load_fallback_bank(filepath: Optional[Path] = None) -> List[Dict[str, Any]]:
    """
    Loads fallback questions from the local JSON file.
    
    Args:
        filepath: Optional path to custom questions JSON file.
        
    Returns:
        A list of question dictionaries.
    """
    target_path = filepath or QUESTIONS_FILE_PATH
    try:
        if not target_path.exists():
            return []
        with open(target_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("questions", [])
    except Exception as e:
        print(f"\n[Warning] Failed to read fallback questions bank: {e}")
        return []


def pick_random_fallback(domain: str, difficulty: str, bank: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    """
    Picks a question from the local fallback bank using random.choice().
    Matches domain and difficulty when available, with progressive fallback.
    
    Args:
        domain: Target domain ('HR', 'Technical', 'Behavioral').
        difficulty: Target difficulty ('Easy', 'Medium', 'Hard').
        bank: Optional preloaded question bank.
        
    Returns:
        A dictionary containing question details.
    """
    questions = bank if bank is not None else load_fallback_bank()
    
    if not questions:
        # Ultimate fail-safe question if file is completely missing or corrupted
        return {
            "id": "failsafe_1",
            "domain": domain,
            "difficulty": difficulty,
            "question_text": "Tell me about a challenging problem you solved and the steps you took.",
            "expected_keywords": ["problem", "solution", "action", "result", "skills", "learned"],
            "follow_up_question": "What would you do differently if you faced a similar challenge today?",
            "source": "Local Fallback (Fail-safe)"
        }

    # 1. Exact match for domain and difficulty
    matches = [
        q for q in questions
        if q.get("domain", "").lower() == domain.lower()
        and q.get("difficulty", "").lower() == difficulty.lower()
    ]
    
    # 2. Relaxed match: match domain only
    if not matches:
        matches = [q for q in questions if q.get("domain", "").lower() == domain.lower()]
        
    # 3. Fallback: all questions in the bank
    if not matches:
        matches = questions

    chosen = random.choice(matches).copy()
    chosen["source"] = "Local Question Bank (Offline Fallback)"
    return chosen


def generate_ai_question(domain: str, difficulty: str, api_key: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Calls the Anthropic Claude API (claude-sonnet-4-6) to generate a customized
    interview question along with expected scoring keywords and a follow-up.
    
    Args:
        domain: Target category ('HR', 'Technical', 'Behavioral').
        difficulty: Target difficulty tier ('Easy', 'Medium', 'Hard').
        api_key: Optional explicit Anthropic API key (defaults to ANTHROPIC_API_KEY env var).
        
    Returns:
        A question dictionary if successful, or None if the API call fails.
    """
    key = api_key or os.environ.get("ANTHROPIC_API_KEY", "").strip()
    if not key:
        return None

    try:
        import anthropic
    except ImportError:
        return None

    prompt = (
        f"You are an expert technical and behavioral hiring manager conducting a mock interview.\n"
        f"Generate ONE interview question for the following criteria:\n"
        f"- Domain: {domain}\n"
        f"- Difficulty Level: {difficulty}\n\n"
        f"Respond ONLY with a valid JSON object matching this exact schema:\n"
        f"{{\n"
        f'  "question_text": "<clear, realistic interview question>",\n'
        f'  "expected_keywords": ["<keyword1>", "<keyword2>", "<keyword3>", "<keyword4>", "<keyword5>", "<keyword6>"],\n'
        f'  "follow_up_question": "<a relevant probing follow-up question to test depth>"\n'
        f"}}\n"
        f"Do not include markdown code fences, comments, or extra text. Output raw JSON only."
    )

    try:
        client = anthropic.Anthropic(api_key=key)
        # Attempt primary target model claude-sonnet-4-6, with graceful fallback to standard sonnet if alias differs
        models_to_try = ["claude-sonnet-4-6", "claude-3-7-sonnet-20250219", "claude-3-5-sonnet-20241022", "claude-3-haiku-20240307"]
        
        response_text = None
        used_model = None
        
        for model_name in models_to_try:
            try:
                message = client.messages.create(
                    model=model_name,
                    max_tokens=400,
                    temperature=0.7,
                    messages=[{"role": "user", "content": prompt}]
                )
                if message.content and len(message.content) > 0:
                    response_text = message.content[0].text
                    used_model = model_name
                    break
            except anthropic.NotFoundError:
                continue
            except Exception:
                continue

        if not response_text:
            return None

        # Clean potential markdown wrapping
        cleaned = response_text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        data = json.loads(cleaned)
        
        if not data.get("question_text") or not data.get("expected_keywords"):
            return None

        return {
            "id": f"ai_{domain.lower()}_{int(random.random() * 10000)}",
            "domain": domain,
            "difficulty": difficulty,
            "question_text": data["question_text"].strip(),
            "expected_keywords": [str(k).lower().strip() for k in data["expected_keywords"]],
            "follow_up_question": data.get(
                "follow_up_question",
                "Can you elaborate further with a specific metric or example from your experience?"
            ),
            "source": f"Anthropic AI ({used_model or 'claude-sonnet-4-6'})"
        }

    except Exception:
        # Graceful failure: return None to let caller fall back to local JSON bank
        return None


def get_interview_question(domain: str, difficulty: str) -> Dict[str, Any]:
    """
    Main entry point for retrieving an interview question.
    Tries AI generation via Anthropic API first; if unavailable,
    falls back cleanly to the local JSON question bank using random.choice().
    
    Args:
        domain: 'HR', 'Technical', or 'Behavioral'
        difficulty: 'Easy', 'Medium', or 'Hard'
        
    Returns:
        Structured question dictionary with question_text, expected_keywords, and follow_up_question.
    """
    # 1. Try AI Generation
    ai_q = generate_ai_question(domain, difficulty)
    if ai_q:
        return ai_q

    # 2. Fallback to Local JSON Bank using random.choice()
    return pick_random_fallback(domain, difficulty)
