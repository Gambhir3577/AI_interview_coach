"""
Main CLI Application Module for AI Coach Interviewer
Provides interactive mock interview workflows, real-time stopwatch timing,
keyword evaluations, filler word diagnostics, follow-up probes, and session reports.
"""

import os
import sys
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

# Relative imports support both module execution and direct script execution
try:
    from .evaluator import evaluate_answer
    from .question_generator import get_interview_question
    from .storage import format_history_table, get_progress_comparison, save_session
except ImportError:
    from evaluator import evaluate_answer
    from question_generator import get_interview_question
    from storage import format_history_table, get_progress_comparison, save_session


DOMAINS = {
    "1": "HR",
    "2": "Technical",
    "3": "Behavioral",
    "4": "Mixed"
}

DIFFICULTIES = {
    "1": "Easy",
    "2": "Medium",
    "3": "Hard",
    "4": "Any"
}


def clear_screen() -> None:
    """Clears terminal screen cross-platform."""
    os.system("cls" if os.name == "nt" else "clear")


def print_banner() -> None:
    """Displays the AI Coach Interviewer ASCII banner."""
    print("=" * 75)
    print("           🎤  AI COACH INTERVIEWER — MOCK PRACTICE STUDIO  🎤")
    print("        Speech Fluency • Keyword Scoring • STAR Storytelling • AI Probing")
    print("=" * 75)


def prompt_selection(title: str, options: Dict[str, str], default_key: str = "1") -> str:
    """
    Prompts the user to choose an option from a dictionary map.
    
    Args:
        title: Header description.
        options: Dictionary of choices.
        default_key: Default choice if user presses enter.
        
    Returns:
        Selected option string.
    """
    print(f"\n{title}")
    for key, val in options.items():
        print(f"  [{key}] {val}")
    
    while True:
        choice = input(f"Select option [Default: {default_key}]: ").strip()
        if not choice:
            return options[default_key]
        if choice in options:
            return options[choice]
        print(f"Invalid selection. Please choose from {list(options.keys())}.")


def conduct_single_question_round(
    q_num: int,
    total_q: int,
    domain: str,
    difficulty: str
) -> Dict[str, Any]:
    """
    Executes a single question interview turn, including timing, evaluation,
    and optional follow-up probing.
    
    Args:
        q_num: Current question index (1-based).
        total_q: Total questions in session.
        domain: Target domain or 'Mixed'.
        difficulty: Target difficulty or 'Any'.
        
    Returns:
        Dictionary record of the completed question turn.
    """
    import random

    actual_domain = random.choice(["HR", "Technical", "Behavioral"]) if domain == "Mixed" else domain
    actual_difficulty = random.choice(["Easy", "Medium", "Hard"]) if difficulty == "Any" else difficulty

    print("\n" + "-" * 75)
    print(f"  QUESTION {q_num} OF {total_q}  |  Domain: {actual_domain}  |  Difficulty: {actual_difficulty}")
    print("-" * 75)

    # Fetch question (Claude AI or Fallback Bank)
    q_data = get_interview_question(actual_domain, actual_difficulty)
    
    print(f"\nSource: {q_data.get('source', 'Question Bank')}")
    print(f"\n💡 Question:")
    print(f"   \"{q_data['question_text']}\"")
    print("\n[Timer starts when you press ENTER. Type your answer and press ENTER when finished.]")
    input("👉 Press ENTER to start answering...")

    # Start Timer
    print("\n⏱️  TIMER RUNNING... Speak or type your answer below:")
    start_time = time.perf_counter()
    user_answer = input("\nYour Answer: ").strip()
    end_time = time.perf_counter()
    time_taken = end_time - start_time

    # Evaluate Answer
    eval_result = evaluate_answer(
        answer=user_answer,
        expected_keywords=q_data.get("expected_keywords", []),
        time_taken_seconds=time_taken,
        time_limit_seconds=90.0
    )

    # Display Real-Time Feedback Card
    print("\n" + "=" * 55)
    print("           📊 ANSWER SCORECARD")
    print("=" * 55)
    print(f" ⭐ Score:             {eval_result['score']} / 10")
    print(f" ⏱️  Time Taken:        {eval_result['time_taken_seconds']}s ({eval_result['timing_feedback']})")
    print(f" 📝 Word Count:        {eval_result['word_count']} words ({eval_result['length_feedback']})")
    print(f" 🔍 Keywords Matched:  {len(eval_result['matched_keywords'])} / {len(q_data.get('expected_keywords', []))}")
    if eval_result['matched_keywords']:
        print(f"    • Found:   {', '.join(eval_result['matched_keywords'])}")
    if eval_result['missing_keywords']:
        print(f"    • Missing: {', '.join(eval_result['missing_keywords'])}")
    print(f" 🗣️  Fluency:           {eval_result['fluency_note']}")
    if eval_result['total_fillers'] > 0:
        print(f"    • Fillers used: {dict(eval_result['filler_breakdown'])}")
    print("=" * 55)

    follow_up_record = None

    # Trigger Follow-Up Question if answer is weak or brief
    if eval_result["trigger_follow_up"]:
        follow_up_text = q_data.get(
            "follow_up_question",
            "Can you elaborate on your specific technical implementation and quantifiable results?"
        )
        print("\n" + "~" * 75)
        print(" 🎙️  INTERVIEWER FOLLOW-UP PROBE (Triggered due to brief answer or low score)")
        print(f" \"{follow_up_text}\"")
        print("~" * 75)
        input("👉 Press ENTER to start answering the follow-up question...")

        print("\n⏱️  TIMER RUNNING for follow-up response:")
        fu_start = time.perf_counter()
        fu_answer = input("\nFollow-up Answer: ").strip()
        fu_end = time.perf_counter()
        fu_time = fu_end - fu_start

        fu_eval = evaluate_answer(
            answer=fu_answer,
            expected_keywords=q_data.get("expected_keywords", []),
            time_taken_seconds=fu_time,
            time_limit_seconds=60.0
        )

        print(f"\n Follow-up Score: {fu_eval['score']}/10  |  Word Count: {fu_eval['word_count']}  |  Time: {fu_eval['time_taken_seconds']}s")
        print(f" Follow-up Fluency: {fu_eval['fluency_note']}")

        follow_up_record = {
            "follow_up_question": follow_up_text,
            "user_answer": fu_answer,
            "evaluation": fu_eval
        }

    return {
        "question_id": q_data.get("id", f"q_{q_num}"),
        "domain": actual_domain,
        "difficulty": actual_difficulty,
        "question_text": q_data["question_text"],
        "user_answer": user_answer,
        "evaluation": eval_result,
        "follow_up": follow_up_record
    }


def start_interview_session() -> None:
    """Orchestrates a complete mock interview session from setup to summary."""
    print("\n" + "=" * 75)
    print("                   STARTING NEW INTERVIEW SESSION")
    print("=" * 75)

    # 1. Progress Comparison with previous runs
    progress = get_progress_comparison()
    print(f"\n{progress['message']}\n")

    # 2. Select Domain & Difficulty
    domain = prompt_selection("1. Select Question Domain:", DOMAINS, default_key="4")
    difficulty = prompt_selection("2. Select Difficulty Tier:", DIFFICULTIES, default_key="4")

    # 3. Select Number of Questions
    while True:
        num_str = input("\n3. How many questions would you like to practice? [1-10, Default: 3]: ").strip()
        if not num_str:
            num_questions = 3
            break
        if num_str.isdigit() and 1 <= int(num_str) <= 10:
            num_questions = int(num_str)
            break
        print("Please enter a valid number between 1 and 10.")

    print(f"\n🎯 Configuration: {num_questions} questions | Domain: {domain} | Level: {difficulty}")
    print("Each question has a 90-second recommended time limit. Let's begin!")
    input("\nPress ENTER to start the session...")

    session_start_iso = datetime.now(timezone.utc).isoformat()
    question_records: List[Dict[str, Any]] = []

    for i in range(1, num_questions + 1):
        record = conduct_single_question_round(i, num_questions, domain, difficulty)
        question_records.append(record)
        if i < num_questions:
            input("\nPress ENTER to move to the next question...")

    # 4. Compute Session Analytics & Summary
    total_scores = [r["evaluation"]["score"] for r in question_records]
    total_times = [r["evaluation"]["time_taken_seconds"] for r in question_records]
    total_fillers = sum(r["evaluation"]["total_fillers"] for r in question_records)

    avg_score = sum(total_scores) / len(total_scores) if total_scores else 0.0
    avg_time = sum(total_times) / len(total_times) if total_times else 0.0

    # Domain breakdown for strongest and weakest areas
    domain_scores: Dict[str, List[int]] = {}
    for r in question_records:
        d = r["domain"]
        domain_scores.setdefault(d, []).append(r["evaluation"]["score"])

    domain_averages = {d: sum(scores) / len(scores) for d, scores in domain_scores.items()}
    sorted_domains = sorted(domain_averages.items(), key=lambda x: x[1], reverse=True)
    
    strongest_area = f"{sorted_domains[0][0]} ({sorted_domains[0][1]:.1f}/10)" if sorted_domains else "N/A"
    weakest_area = f"{sorted_domains[-1][0]} ({sorted_domains[-1][1]:.1f}/10)" if sorted_domains else "N/A"

    # Print Session Summary Report
    print("\n" + "=" * 75)
    print("                     🏁 SESSION SUMMARY REPORT 🏁")
    print("=" * 75)
    print(f"  • Overall Session Score:     {avg_score:.1f} / 10  ({sum(total_scores)} / {len(total_scores) * 10} pts)")
    print(f"  • Average Time Per Question: {avg_time:.1f} seconds")
    print(f"  • Total Filler Words Used:   {total_fillers}")
    print(f"  • Strongest Performance:     {strongest_area}")
    print(f"  • Area for Growth:           {weakest_area}")
    print("-" * 75)
    print("  📋 Domain Score Breakdown:")
    for d, s in domain_averages.items():
        print(f"     - {d:<12}: {s:.1f}/10")
    print("=" * 75)

    # Save Session Record to File
    session_data = {
        "session_id": f"sess_{int(time.time())}",
        "timestamp": session_start_iso,
        "domain": domain,
        "difficulty": difficulty,
        "questions_count": num_questions,
        "total_score": sum(total_scores),
        "average_score": round(avg_score, 1),
        "average_time_seconds": round(avg_time, 1),
        "total_fillers": total_fillers,
        "strongest_area": strongest_area,
        "weakest_area": weakest_area,
        "question_records": question_records
    }

    if save_session(session_data):
        print("💾 Session results successfully saved to local history (interview_history.json)!")

    input("\nPress ENTER to return to the main menu...")


def view_progress_history() -> None:
    """Displays historical interview sessions and overall trend."""
    print(format_history_table())
    input("Press ENTER to return to the main menu...")


def main_cli_loop() -> None:
    """Main CLI Menu Loop for the application."""
    while True:
        clear_screen()
        print_banner()
        print("\n  [1] Start Interview Session")
        print("  [2] View Progress History")
        print("  [3] Exit")
        print("-" * 75)
        
        choice = input("Enter your choice (1/2/3): ").strip()

        if choice == "1":
            start_interview_session()
        elif choice == "2":
            view_progress_history()
        elif choice == "3":
            print("\n👋 Thank you for practicing with AI Coach Interviewer. Best of luck with your interviews!\n")
            sys.exit(0)
        else:
            print("\n[!] Invalid selection. Please enter 1, 2, or 3.")
            time.sleep(1)


if __name__ == "__main__":
    try:
        main_cli_loop()
    except KeyboardInterrupt:
        print("\n\n[Session interrupted by user. Exiting gracefully...]")
        sys.exit(0)
