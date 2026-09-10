import json
import os
import re
from typing import Any, Dict, List, Optional

import anthropic

from app.models import (
    CheatSheetQAItem,
    CheatSheetResponse,
    ContentFeedback,
    DebriefResponse,
    FollowUpQuestionResponse,
    ResumeJDGenerateResponse,
    SalaryNegotiationTurnResponse,
    StarStageBreakdown,
    TailoredQuestionItem,
)

EVALUATE_PROMPT_TEMPLATE = """You are an elite interview coach. You will be given an interview question and a candidate's spoken answer (transcribed from audio).

Question: {question}
Category: {category}
Role: {role}
Seniority Difficulty: {difficulty}
Candidate's Spoken Answer: {transcript}

Evaluate the candidate's answer constructively across structure, clarity, relevance, and depth.
Also write an exemplary, tightened "MODEL ANSWER" showing how this exact response could be delivered with maximum impact (quantified metrics, crisp STAR story, or concise technical depth).

Respond ONLY with valid JSON in this exact structure:
{{
  "relevance_score": <integer 1-10>,
  "structure_score": <integer 1-10>,
  "clarity_score": <integer 1-10>,
  "depth_score": <integer 1-10>,
  "uses_star_method": <true/false if behavioral, else null>,
  "star_stage_breakdown": {{
    "situation_score": <1-10 or null>,
    "task_score": <1-10 or null>,
    "action_score": <1-10 or null>,
    "result_score": <1-10 or null>,
    "feedback": "<1-2 sentence assessment of STAR coverage>"
  }},
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<actionable tip 1>", "<actionable tip 2>", "<actionable tip 3>"],
  "weak_spots": ["<detected weak point 1>", "<detected weak point 2>"],
  "model_answer": "<A tightened, exemplary 60-90s model response using clear metrics, concise structure, and impactful conclusion>",
  "overall_summary": "<2-3 sentence executive summary of performance>"
}}
"""

FOLLOW_UP_PROMPT_TEMPLATE = """You are an experienced interviewer conducting a mock interview for a {role} ({difficulty} level).
The candidate just answered the question: "{question}"
Candidate's answer: "{transcript}"

Generate ONE sharp, realistic follow-up probing question that challenges their answer, asks for quantifiable metrics, explores an edge case or failure mode, or digs into technical trade-offs.

Respond ONLY with valid JSON:
{{
  "follow_up_question": "<the probing question>",
  "probing_intent": "<why an interviewer asks this>",
  "suggested_focus": "<key aspect the candidate should address>"
}}
"""

RESUME_JD_PROMPT_TEMPLATE = """You are an AI recruiting expert. Given a candidate's resume and a target Job Description (JD), analyze the role requirements, extract candidate strengths & gaps, and generate 5 tailored interview questions.

Resume:
{resume_text}

Job Description:
{jd_text}

Role: {role}
Seniority: {seniority}
Company: {company}

Respond ONLY with valid JSON:
{{
  "role_summary": "<1-2 sentence synthesis of target role fit>",
  "detected_strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "identified_gaps": ["<gap/risk 1>", "<gap/risk 2>"],
  "questions": [
    {{
      "question_text": "<tailored interview question>",
      "category": "<technical|behavioral|product|system_design|hr>",
      "difficulty": "<Junior|Intermediate|Senior|Lead>",
      "tips": "<specific tip targeting candidate experience>",
      "why_relevant": "<why this question matches the JD and tests a candidate gap>"
    }}
  ]
}}
"""

NEGOTIATION_PROMPT_TEMPLATE = """You are simulating an HR Director / Hiring Manager at {company} negotiating an offer for a {role} position.
Target targets: Base {base}, Equity {equity}, Bonus {bonus}.
Conversation history:
{history_str}

Candidate just said: "{candidate_message}"

Respond in character (diplomatic, business-oriented, willing to explore trade-offs if well justified). Also provide candidate scoring and coaching feedback.
Respond ONLY with valid JSON:
{{
  "recruiter_response": "<in-character response to candidate>",
  "negotiation_score": <0-100 score of candidate's persuasion leverage & tact>,
  "leverage_assessment": "<assessment of candidate's market rationale & leverage>",
  "tone_feedback": "<e.g. Firm & Collaborative, Overly Aggressive, Too Passive>",
  "tactical_tips": ["<tactical tip 1>", "<tactical tip 2>"],
  "offer_status": "<Ongoing|Offer Improved|Firm Standoff|Agreement Reached>",
  "current_package": {{
    "base": "<e.g. $175,000>",
    "equity": "<e.g. $55,000/yr>",
    "sign_on": "<e.g. $15,000>"
  }}
}}
"""

CHEATSHEET_PROMPT_TEMPLATE = """You are a Principal Interview Coach. Create a comprehensive interview cheat sheet for:
Role: {role}
Seniority: {seniority}
Company: {company}
Industry: {industry}

Respond ONLY with valid JSON:
{{
  "role_title": "{role}",
  "seniority": "{seniority}",
  "target_company": "{company}",
  "overview": "<Executive summary of what top interviewers look for in this role>",
  "top_questions": [
    {{
      "question": "<Interview Question>",
      "category": "<Technical|Behavioral|System Design|Leadership>",
      "framework": "<e.g. STAR, MECE, 5-Pillar System Design>",
      "ideal_response_bullet_points": ["<Key point 1>", "<Key point 2>", "<Key point 3>"],
      "pitfalls_to_avoid": ["<Pitfall 1>", "<Pitfall 2>"],
      "key_metrics_or_buzzwords": ["<Metric/Term 1>", "<Metric/Term 2>"]
    }}
  ],
  "top_questions_to_ask_interviewer": ["<Insightful question 1>", "<Insightful question 2>", "<Insightful question 3>"],
  "day_before_checklist": ["<Checklist item 1>", "<Checklist item 2>", "<Checklist item 3>"]
}}
"""

DEBRIEF_PROMPT_TEMPLATE = """You are a Career Strategist analyzing a candidate's real interview experience.
Company: {company}
Role: {role}
Interview Rounds: {rounds}
Candidate Notes: {notes}

Analyze the candidate's performance notes, identify hidden red flags or standout positives, estimate pass probability, and draft a high-impact thank-you follow-up email.

Respond ONLY with valid JSON:
{{
  "pass_probability_pct": <integer 20-95>,
  "strengths_observed": ["<positive signal 1>", "<positive signal 2>"],
  "potential_risks_or_flags": ["<risk/ambiguity 1>", "<risk/ambiguity 2>"],
  "next_round_strategy": ["<strategic tip 1>", "<strategic tip 2>", "<strategic tip 3>"],
  "thank_you_email_draft": "<Professional, customized thank you email highlighting a thoughtful response to a question discussed>"
}}
"""


def extract_json_from_text(text: str) -> dict[str, Any]:
    """Extracts JSON object from LLM response text even if wrapped in markdown blocks."""
    text = text.strip()
    try:
        return json.loads(text)
    except Exception:
        pass

    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except Exception:
            pass

    match = re.search(r"(\{.*\})", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except Exception:
            pass

    raise ValueError(f"Could not parse valid JSON from LLM output: {text[:200]}")


# ==========================================
# 1. Content Evaluation & Model Answer
# ==========================================
def generate_heuristic_feedback(
    question: str,
    category: str,
    transcript: str,
    role: str = "general",
    difficulty: str = "Intermediate"
) -> ContentFeedback:
    """Intelligent local fallback evaluator when Anthropic API Key is not configured."""
    words = transcript.strip().split()
    word_count = len(words)
    transcript_lower = transcript.lower()

    # Check STAR components
    has_s = any(k in transcript_lower for k in ["situation", "when i was", "at my previous", "in my last role", "back when", "our team was"])
    has_t = any(k in transcript_lower for k in ["task", "goal", "challenge", "problem was", "responsibility", "objective"])
    has_a = any(k in transcript_lower for k in ["action", "i decided", "i implemented", "i created", "i resolved", "i led", "i built", "i designed"])
    has_r = any(k in transcript_lower for k in ["result", "outcome", "finally", "as a result", "achieved", "improved", "learned", "decreased", "uplift"])

    star_count = sum([has_s, has_t, has_a, has_r])
    is_behavioral = category.lower() == "behavioral" or role.lower() == "behavioral"
    uses_star = (star_count >= 2) if is_behavioral else None

    # Model answer generation heuristics
    sample_topic = question.replace("Tell me about", "").replace("Describe a", "").replace("Explain", "").strip(" ?.")
    model_answer = (
        f"In my previous role, I faced a scenario regarding {sample_topic.lower() or 'system performance'}. "
        f"The objective was to maintain high quality and reliability under tight timelines. "
        f"I spearheaded a structured approach: first diagnosing the root cause through telemetry data, "
        f"then collaborating cross-functionally to implement an automated, resilient solution. "
        f"As a result, we reduced turnaround time by 35%, eliminated recurrence, and established a reusable playbook across the organization."
    )

    if word_count < 15:
        relevance = 3
        structure = 3
        clarity = 4
        depth = 3
        strengths = ["Started addressing the topic."]
        improvements = [
            "Elaborate with concrete details, context, and numbers.",
            "Aim for a 60-90 second comprehensive explanation.",
            "Conclude with a clear outcome statement."
        ]
        weak_spots = ["Insufficient answer duration", "Lack of concrete examples"]
        summary = "Your answer was very brief. To make a memorable impression, elaborate with clear examples, technical specifics, and measurable outcomes."
    elif word_count < 45 and not (is_behavioral and star_count >= 3):
        relevance = 6
        structure = 5
        clarity = 6
        depth = 5
        strengths = [
            "Addressed the core subject of the question directly.",
            "Maintained a direct and concise speaking style."
        ]
        improvements = [
            "Add depth by mentioning specific technologies, metrics, or frameworks.",
            "Elaborate on the 'why' behind your decisions, not just 'what' happened.",
            "Include a summary wrap-up sentence at the end of your response."
        ]
        weak_spots = ["Shallow technical/situational depth"]
        summary = "A concise start that directly targets the question. Expanding on technical or situational specifics will significantly elevate your delivery."
    else:
        relevance = 8
        structure = 8 if (not is_behavioral or uses_star) else 7
        clarity = 8
        depth = 8
        sample_phrase = " ".join(words[:6]) + "..."
        strengths = [
            f"Clear articulation of your strategy when explaining '{sample_phrase}'.",
            "Demonstrated substantive domain depth with a natural progression of ideas."
        ]
        improvements = [
            "Quantify your results (e.g., percentages, team sizes, latency improvements) to increase credibility.",
            "Conclude with a high-impact statement reinforcing the core takeaway for the interviewer.",
            "Refine transitions between your main points to ensure seamless flow."
        ]
        weak_spots = []
        if is_behavioral and not uses_star:
            improvements.insert(0, "Adopt the STAR framework (Situation, Task, Action, Result) for structured storytelling.")
            weak_spots.append("Unstructured behavioral narrative")

        summary = f"Strong and articulate response that effectively addresses the core interview challenge. Incorporating quantifiable impacts will make your answer stand out even further."

    star_breakdown = None
    if is_behavioral:
        star_breakdown = StarStageBreakdown(
            situation_score=8 if has_s else 5,
            task_score=8 if has_t else 5,
            action_score=8 if has_a else 6,
            result_score=8 if has_r else 4,
            feedback="Covered key situational elements. Ensure the Result phase highlights measurable impact." if has_r else "Strong context, but needs clearer measurable Results."
        )

    return ContentFeedback(
        relevance_score=relevance,
        structure_score=structure,
        clarity_score=clarity,
        depth_score=depth,
        uses_star_method=uses_star,
        star_stage_breakdown=star_breakdown,
        strengths=strengths,
        improvements=improvements,
        weak_spots=weak_spots,
        model_answer=model_answer,
        overall_summary=summary
    )


def evaluate_content_feedback(
    question: str,
    category: str,
    transcript: str,
    role: str = "general",
    difficulty: str = "Intermediate"
) -> ContentFeedback:
    """Evaluates interview response using Anthropic Claude API or fallback heuristic."""
    api_key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    if not api_key:
        return generate_heuristic_feedback(question, category, transcript, role, difficulty)

    model_name = os.environ.get("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")
    try:
        client = anthropic.Anthropic(api_key=api_key)
        prompt_content = EVALUATE_PROMPT_TEMPLATE.format(
            question=question,
            category=category,
            role=role,
            difficulty=difficulty,
            transcript=transcript if transcript.strip() else "(Candidate provided no audible answer)"
        )
        response = client.messages.create(
            model=model_name,
            max_tokens=1500,
            messages=[{"role": "user", "content": prompt_content}]
        )
        block = response.content[0]
        raw_text = getattr(block, "text", str(block))
        data = extract_json_from_text(raw_text)

        star_data = data.get("star_stage_breakdown")
        star_breakdown = StarStageBreakdown(**star_data) if star_data else None

        return ContentFeedback(
            relevance_score=int(data.get("relevance_score", 7)),
            structure_score=int(data.get("structure_score", 7)),
            clarity_score=int(data.get("clarity_score", 7)),
            depth_score=int(data.get("depth_score", 7)),
            uses_star_method=data.get("uses_star_method"),
            star_stage_breakdown=star_breakdown,
            strengths=data.get("strengths", ["Clear communication"]),
            improvements=data.get("improvements", ["Quantify measurable impact"]),
            weak_spots=data.get("weak_spots", []),
            model_answer=data.get("model_answer", ""),
            overall_summary=data.get("overall_summary", "Solid interview response.")
        )
    except Exception as e:
        print(f"[LLM Service] Evaluation API call failed ({e}). Falling back to heuristic.")
        return generate_heuristic_feedback(question, category, transcript, role, difficulty)


# ==========================================
# 2. Dynamic Follow-Up Probing
# ==========================================
def generate_follow_up_probe(
    question: str,
    category: str,
    role: str,
    difficulty: str,
    transcript: str
) -> FollowUpQuestionResponse:
    """Generates a dynamic follow-up interviewer probing question based on what user said."""
    api_key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    if api_key:
        try:
            client = anthropic.Anthropic(api_key=api_key)
            prompt = FOLLOW_UP_PROMPT_TEMPLATE.format(
                role=role,
                difficulty=difficulty,
                question=question,
                transcript=transcript or "(brief answer)"
            )
            response = client.messages.create(
                model=os.environ.get("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022"),
                max_tokens=500,
                messages=[{"role": "user", "content": prompt}]
            )
            data = extract_json_from_text(response.content[0].text)
            return FollowUpQuestionResponse(
                follow_up_question=data.get("follow_up_question", "How did you measure the final impact of your decision?"),
                probing_intent=data.get("probing_intent", "Testing depth and metrics validation"),
                suggested_focus=data.get("suggested_focus", "Focus on quantitative metrics and trade-offs")
            )
        except Exception as e:
            print(f"[LLM Service] Follow-up generation fallback ({e})")

    # Heuristic follow-ups tailored by category & role
    transcript_lower = transcript.lower()
    if "redis" in transcript_lower or "cache" in transcript_lower:
        q = "You mentioned caching. How did you handle cache invalidation and potential cache stampede during traffic spikes?"
        intent = "Probing system resilience and edge-case handling"
    elif "team" in transcript_lower or "stakeholder" in transcript_lower:
        q = "How did you manage pushback from cross-functional stakeholders who had competing priorities?"
        intent = "Evaluating conflict-resolution and stakeholder management"
    elif "metric" not in transcript_lower and "%" not in transcript:
        q = "What specific quantitative metrics or KPIs did you track to prove this initiative was successful?"
        intent = "Verifying measurable business impact"
    elif role.lower() == "swe" or category.lower() == "technical":
        q = "If this system had to scale by 10x overnight, what would be the first bottleneck to break and how would you redesign it?"
        intent = "Testing scalability and architectural foresight"
    elif role.lower() == "pm" or category.lower() == "product":
        q = "How did you validate that this solved the core customer pain point rather than just treating a symptom?"
        intent = "Assessing user empathy and hypothesis testing"
    else:
        q = "Looking back, what is one key thing you would do differently if you faced this exact scenario again today?"
        intent = "Evaluating self-reflection and continuous learning"

    return FollowUpQuestionResponse(
        follow_up_question=q,
        probing_intent=intent,
        suggested_focus="Provide specific technical or organizational details rather than high-level generalizations."
    )


# ==========================================
# 3. Resume & Job Description Question Generator
# ==========================================
def generate_tailored_jd_questions(
    resume_text: str,
    jd_text: str,
    role: str,
    seniority: str,
    company: str,
    target_count: int = 5
) -> ResumeJDGenerateResponse:
    """Extracts candidate profile & JD requirements to auto-generate 5 tailored interview questions."""
    api_key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    if api_key:
        try:
            client = anthropic.Anthropic(api_key=api_key)
            prompt = RESUME_JD_PROMPT_TEMPLATE.format(
                resume_text=resume_text[:2500],
                jd_text=jd_text[:2500],
                role=role,
                seniority=seniority,
                company=company
            )
            response = client.messages.create(
                model=os.environ.get("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022"),
                max_tokens=1500,
                messages=[{"role": "user", "content": prompt}]
            )
            data = extract_json_from_text(response.content[0].text)
            q_list = [TailoredQuestionItem(**item) for item in data.get("questions", [])]
            return ResumeJDGenerateResponse(
                role_summary=data.get("role_summary", f"Strong alignment for {role} role at {company}"),
                detected_strengths=data.get("detected_strengths", ["Relevant technical foundation", "Demonstrated project execution"]),
                identified_gaps=data.get("identified_gaps", ["Specific enterprise scale experience", "Domain-specific tooling"]),
                questions=q_list[:target_count]
            )
        except Exception as e:
            print(f"[LLM Service] JD question generator fallback ({e})")

    # Heuristic question extraction based on JD keywords
    jd_lower = jd_text.lower()
    questions: list[TailoredQuestionItem] = []

    if "distributed" in jd_lower or "microservice" in jd_lower or "scale" in jd_lower:
        questions.append(TailoredQuestionItem(
            question_text=f"Your resume mentions backend architecture. How have you designed distributed systems to ensure high availability and sub-second latency for {company}?",
            category="system_design",
            difficulty=seniority,
            tips="Discuss caching tiers, database sharding, and circuit breakers.",
            why_relevant="Target JD explicitly emphasizes high-scale distributed services."
        ))

    if "lead" in jd_lower or "mentor" in jd_lower or "cross-functional" in jd_lower:
        questions.append(TailoredQuestionItem(
            question_text="Tell me about a time you led a cross-functional technical project across multiple teams with competing roadmaps.",
            category="behavioral",
            difficulty=seniority,
            tips="Use STAR format and emphasize stakeholder alignment frameworks.",
            why_relevant="JD requires senior leadership and cross-functional orchestration."
        ))

    if "cloud" in jd_lower or "aws" in jd_lower or "kubernetes" in jd_lower:
        questions.append(TailoredQuestionItem(
            question_text="How do you architect infrastructure CI/CD pipelines to guarantee zero-downtime rolling deployments in cloud environments?",
            category="technical",
            difficulty=seniority,
            tips="Cover canary releases, health probes, and automated rollbacks.",
            why_relevant="Core cloud infrastructure skill required by job posting."
        ))

    # General standard tailored questions if fewer than target
    questions.append(TailoredQuestionItem(
        question_text=f"Looking at your background, why is this specific {role} position at {company} the ideal next step in your career trajectory?",
        category="hr",
        difficulty=seniority,
        tips="Connect your past achievements directly with the company's product mission.",
        why_relevant="Assesses motivation, culture fit, and company research."
    ))
    questions.append(TailoredQuestionItem(
        question_text="Describe a scenario where you identified an inefficiency in your team's workflow and took the initiative to build a solution without being asked.",
        category="behavioral",
        difficulty=seniority,
        tips="Highlight proactive ownership, measurable time saved, and adoption by peers.",
        why_relevant="Tests proactive ownership and self-driven impact required in this JD."
    ))

    return ResumeJDGenerateResponse(
        role_summary=f"Tailored analysis for {role} at {company}. Strong foundational match with high-impact growth opportunities.",
        detected_strengths=["Direct domain overlap in core responsibilities", "Demonstrated problem-solving track record", "Strong technical adaptability"],
        identified_gaps=["Scale and throughput verification", "Company-specific framework mastery"],
        questions=questions[:target_count]
    )


# ==========================================
# 4. Salary Negotiation Simulator
# ==========================================
def simulate_salary_negotiation_turn(
    role: str,
    company: str,
    base: str,
    equity: str,
    bonus: str,
    history: list,
    candidate_message: str
) -> SalaryNegotiationTurnResponse:
    """Simulates realistic HR/Hiring Manager compensation negotiation turns with tactical scoring."""
    api_key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    history_str = "\n".join([f"{h.speaker}: {h.message}" for h in history]) if history else "Initial offer extended."

    if api_key:
        try:
            client = anthropic.Anthropic(api_key=api_key)
            prompt = NEGOTIATION_PROMPT_TEMPLATE.format(
                company=company,
                role=role,
                base=base,
                equity=equity,
                bonus=bonus,
                history_str=history_str,
                candidate_message=candidate_message
            )
            response = client.messages.create(
                model=os.environ.get("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022"),
                max_tokens=800,
                messages=[{"role": "user", "content": prompt}]
            )
            data = extract_json_from_text(response.content[0].text)
            return SalaryNegotiationTurnResponse(
                recruiter_response=data.get("recruiter_response", "Thank you for sharing your perspective. Let me discuss with finance."),
                negotiation_score=int(data.get("negotiation_score", 80)),
                leverage_assessment=data.get("leverage_assessment", "Clear justification provided based on market data."),
                tone_feedback=data.get("tone_feedback", "Professional and collaborative"),
                tactical_tips=data.get("tactical_tips", ["Keep focusing on mutual value creation", "Always ask for sign-on bonus flexibility"]),
                offer_status=data.get("offer_status", "Ongoing"),
                current_package=data.get("current_package", {"base": base, "equity": equity, "bonus": bonus})
            )
        except Exception as e:
            print(f"[LLM Service] Salary negotiation fallback ({e})")

    # Heuristic negotiation simulator
    msg_lower = candidate_message.lower()
    score = 75
    status = "Ongoing"
    tactical_tips = [
        "Anchor your counteroffer with concrete market compensation data.",
        "Highlight your immediate 90-day impact to justify the top of band.",
        "Consider asking for non-salary levers like sign-on bonus or additional equity."
    ]

    if "competing offer" in msg_lower or "other offer" in msg_lower:
        score += 12
        tone = "Assertive & High Leverage"
        leverage = "Strong leverage introduced via competing market opportunities."
        recruiter_reply = (
            f"I appreciate you sharing that context regarding your other opportunities. "
            f"We are extremely impressed with your technical background and genuinely want you on the {company} team. "
            f"While our base salary bands have strict internal equity limits, I can increase our sign-on bonus by $15,000 "
            f"and request an additional equity grant to match your target. How does that sound?"
        )
        status = "Offer Improved"
    elif any(k in msg_lower for k in ["market rate", "levels.fyi", "experience", "value i bring"]):
        score += 8
        tone = "Diplomatic & Data-Driven"
        leverage = "Good market justification provided with professional framing."
        recruiter_reply = (
            f"Thank you for outlining your expectations so clearly. We want to ensure our package is compelling. "
            f"I reviewed with the hiring committee, and we can stretch the base salary up to ${int(''.join(filter(str.isdigit, base)) or '170000') + 8000:,} "
            f"with an accelerated performance review at 6 months."
        )
        status = "Offer Improved"
    elif "give me" in msg_lower or "want more" in msg_lower or "too low" in msg_lower:
        score -= 15
        tone = "Blunt / Slightly Demanding"
        leverage = "Low perceived collaboration; risk of stalling negotiations."
        recruiter_reply = (
            f"We understand compensation is important, but our initial offer reflects market median for this level at {company}. "
            f"Could you help us understand the specific market data points or scope elements you're factoring in so we can advocate for you?"
        )
        status = "Firm Standoff"
    else:
        tone = "Collaborative & Constructive"
        leverage = "Solid initial negotiation posture."
        recruiter_reply = (
            f"We hear you, and we're excited about having you join us. Let me connect with the VP of Engineering "
            f"to see what flexibility we have on equity refreshers and base structure. I will have an update within 24 hours."
        )

    return SalaryNegotiationTurnResponse(
        recruiter_response=recruiter_reply,
        negotiation_score=min(95, max(40, score)),
        leverage_assessment=leverage,
        tone_feedback=tone,
        tactical_tips=tactical_tips,
        offer_status=status,
        current_package={"base": base, "equity": equity, "bonus": bonus}
    )


# ==========================================
# 5. Role Cheat Sheet Generator
# ==========================================
def generate_role_cheat_sheet(
    role: str,
    seniority: str,
    company: str = "General",
    industry: str = "Tech"
) -> CheatSheetResponse:
    """Generates a downloadable, printable role-specific Q&A cheat sheet."""
    api_key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    if api_key:
        try:
            client = anthropic.Anthropic(api_key=api_key)
            prompt = CHEATSHEET_PROMPT_TEMPLATE.format(
                role=role,
                seniority=seniority,
                company=company,
                industry=industry
            )
            response = client.messages.create(
                model=os.environ.get("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022"),
                max_tokens=1500,
                messages=[{"role": "user", "content": prompt}]
            )
            data = extract_json_from_text(response.content[0].text)
            q_items = [CheatSheetQAItem(**item) for item in data.get("top_questions", [])]
            return CheatSheetResponse(
                role_title=data.get("role_title", role),
                seniority=data.get("seniority", seniority),
                target_company=data.get("target_company", company),
                overview=data.get("overview", f"Mastery cheat sheet for {seniority} {role} candidates."),
                top_questions=q_items,
                top_questions_to_ask_interviewer=data.get("top_questions_to_ask_interviewer", []),
                day_before_checklist=data.get("day_before_checklist", [])
            )
        except Exception as e:
            print(f"[LLM Service] Cheat sheet generator fallback ({e})")

    # Heuristic Cheat Sheet
    return CheatSheetResponse(
        role_title=role,
        seniority=seniority,
        target_company=company,
        overview=f"High-impact interview playbook for {seniority} {role} roles. Focus on architectural trade-offs, structured communication, and quantifiable metrics.",
        top_questions=[
            CheatSheetQAItem(
                question="Tell me about a complex technical decision where you balanced trade-offs.",
                category="Behavioral & Architecture",
                framework="STAR + Trade-off Matrix",
                ideal_response_bullet_points=[
                    "State the business problem and timeline constraint clearly",
                    "Compare Option A vs Option B with concrete latency/cost data",
                    "Explain why the chosen path minimized long-term maintenance overhead",
                    "Highlight post-launch telemetry and 99.99% uptime outcome"
                ],
                pitfalls_to_avoid=[
                    "Focusing solely on code syntax without explaining business context",
                    "Blaming past leadership for technical constraints"
                ],
                key_metrics_or_buzzwords=["ADR (Architectural Decision Record)", "P99 Latency", "Throughput", "Technical Debt"]
            ),
            CheatSheetQAItem(
                question="How do you handle production outages and high-severity incidents?",
                category="Incident Management & Systems",
                framework="Triage -> Mitigate -> RCA -> Prevent",
                ideal_response_bullet_points=[
                    "Establish clear Incident Commander and status communication channels",
                    "Prioritize immediate user mitigation (rollback/failover) over immediate root-cause fixes",
                    "Conduct blameless post-mortem Root Cause Analysis (RCA)",
                    "Codify automated prevention guards in CI/CD within 2 sprints"
                ],
                pitfalls_to_avoid=[
                    "Debugging on live production instances without runbooks",
                    "Failing to mention blameless culture"
                ],
                key_metrics_or_buzzwords=["MTTR (Mean Time to Resolution)", "Blameless Post-Mortem", "Circuit Breakers", "Runbooks"]
            )
        ],
        top_questions_to_ask_interviewer=[
            "What is the single biggest architectural bottleneck the team plans to solve in the next 12 months?",
            "How does the engineering team balance product roadmap velocity against refactoring technical debt?",
            "What does a successful first 90 days look like for someone joining this role?"
        ],
        day_before_checklist=[
            "Review 3 core STAR stories with quantified metrics on note cards",
            "Verify microphone, HD webcam, lighting, and quiet environment",
            "Prepare 3 tailored questions to ask the hiring manager about team vision",
            "Review company core values and recent product releases"
        ]
    )


# ==========================================
# 6. Post-Interview Debrief Analysis
# ==========================================
def generate_interview_debrief_analysis(
    company: str,
    role: str,
    interview_date: str,
    rounds_description: str,
    candidate_notes: str
) -> DebriefResponse:
    """Analyzes real interview debrief notes, calculates pass probability, and drafts thank-you email."""
    api_key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    if api_key:
        try:
            client = anthropic.Anthropic(api_key=api_key)
            prompt = DEBRIEF_PROMPT_TEMPLATE.format(
                company=company,
                role=role,
                rounds=rounds_description,
                notes=candidate_notes
            )
            response = client.messages.create(
                model=os.environ.get("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022"),
                max_tokens=1000,
                messages=[{"role": "user", "content": prompt}]
            )
            data = extract_json_from_text(response.content[0].text)
            return DebriefResponse(
                debrief_id=f"debrief_{abs(hash(candidate_notes)) % 100000}",
                company=company,
                role=role,
                pass_probability_pct=int(data.get("pass_probability_pct", 75)),
                strengths_observed=data.get("strengths_observed", ["Strong rapport with interview panel"]),
                potential_risks_or_flags=data.get("potential_risks_or_flags", ["Follow-up clarification on edge case"]),
                next_round_strategy=data.get("next_round_strategy", ["Prepare deeper system design examples"]),
                thank_you_email_draft=data.get("thank_you_email_draft", "Subject: Thank you - Interview follow-up...")
            )
        except Exception as e:
            print(f"[LLM Service] Debrief analysis fallback ({e})")

    # Heuristic debrief evaluation
    notes_lower = candidate_notes.lower()
    score = 72
    strengths = ["Promptly engaged with interviewer questions", "Demonstrated clear domain passion"]
    risks = []

    if any(k in notes_lower for k in ["struggled", "blanked", "did not know", "stuck"]):
        score -= 15
        risks.append("Candidate noted hesitation on specific deep-dive questions.")
    if any(k in notes_lower for k in ["great conversation", "connected", "nodded", "impressed"]):
        score += 14
        strengths.append("Strong positive conversational rapport and affirmative interviewer feedback.")
    if any(k in notes_lower for k in ["ran out of time", "cutoff"]):
        score -= 8
        risks.append("Time management pressure prevented full conclusion.")

    pass_pct = min(92, max(30, score))

    email_draft = (
        f"Subject: Thank you - {role} Interview Follow-up\n\n"
        f"Dear {company} Interview Team,\n\n"
        f"Thank you so much for taking the time to speak with me today regarding the {role} opportunity. "
        f"I truly enjoyed our discussion around {rounds_description or 'the team’s strategic goals'} and was particularly excited to learn more about the team's engineering roadmap.\n\n"
        f"Reflecting on our conversation, I'm even more energized by the prospect of contributing to {company}’s mission and leveraging my experience in scalable problem-solving to drive immediate impact.\n\n"
        f"Please let me know if there are any additional details I can provide. I look forward to the next steps in the process.\n\n"
        f"Warm regards,\nCandidate"
    )

    return DebriefResponse(
        debrief_id=f"debrief_{abs(hash(candidate_notes)) % 100000}",
        company=company,
        role=role,
        pass_probability_pct=pass_pct,
        strengths_observed=strengths,
        potential_risks_or_flags=risks or ["No major red flags detected in debrief notes."],
        next_round_strategy=[
            "Send the drafted thank-you email within 24 hours to reinforce interest.",
            "Prepare 2 deeper examples addressing any technical topics where you felt slight hesitation.",
            "Review executive communication framing for the final hiring manager round."
        ],
        thank_you_email_draft=email_draft
    )
