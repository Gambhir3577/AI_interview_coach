"""
Unit Tests for AI Coach Interviewer CLI
Validates keyword scoring, filler counter, brevity checks, storage persistence,
progress tracking, and question generator fallbacks.
"""

import json
import os
import tempfile
import unittest
from pathlib import Path

from cli.evaluator import count_filler_words, count_words, evaluate_answer, score_keywords
from cli.question_generator import load_fallback_bank, pick_random_fallback
from cli.storage import format_history_table, get_progress_comparison, load_history, save_session


class TestAICoachEvaluator(unittest.TestCase):
    """Tests for evaluator keyword scoring, filler word counts, and brevity checks."""

    def test_word_count(self):
        self.assertEqual(count_words(""), 0)
        self.assertEqual(count_words("Hello world"), 2)
        self.assertEqual(count_words("  One   two   three   four "), 4)

    def test_filler_word_counter(self):
        text = "Um, I actually basically like tested this, you know, sort of thoroughly."
        count, breakdown, note = count_filler_words(text)
        self.assertGreaterEqual(count, 5)
        self.assertIn("um", breakdown)
        self.assertIn("actually", breakdown)
        self.assertIn("basically", breakdown)
        self.assertIn("you know", breakdown)
        self.assertIn("sort of", breakdown)
        self.assertIn("Noticeable filler density", note)

    def test_zero_filler_words(self):
        clean_text = "I architected a high-throughput microservice using Redis caching and database indexing."
        count, breakdown, note = count_filler_words(clean_text)
        self.assertEqual(count, 0)
        self.assertEqual(breakdown, {})
        self.assertIn("Zero filler words", note)

    def test_keyword_scoring_high(self):
        keywords = ["redis", "cache", "indexing", "performance", "sharding"]
        answer = "We integrated Redis for in-memory cache and optimized database indexing to boost query performance and sharding."
        score, matched, missing = score_keywords(answer, keywords)
        self.assertGreaterEqual(score, 8)
        self.assertEqual(len(missing), 0)
        self.assertEqual(len(matched), 5)

    def test_keyword_scoring_low(self):
        keywords = ["concurrency", "mutex", "deadlock", "threads"]
        answer = "I just wrote standard code."
        score, matched, missing = score_keywords(answer, keywords)
        self.assertLessEqual(score, 3)
        self.assertEqual(len(matched), 0)
        self.assertEqual(len(missing), 4)

    def test_evaluate_answer_too_brief_triggers_followup(self):
        result = evaluate_answer(
            answer="Yes, I did that.",
            expected_keywords=["leadership", "ownership", "conflict"],
            time_taken_seconds=12.5,
            time_limit_seconds=90.0
        )
        self.assertTrue(result["is_too_brief"])
        self.assertTrue(result["trigger_follow_up"])
        self.assertLessEqual(result["score"], 3)
        self.assertFalse(result["exceeded_time"])

    def test_evaluate_answer_timing_exceeded(self):
        result = evaluate_answer(
            answer="Here is a detailed 35 word answer demonstrating technical understanding with database indexing and query optimization across multiple microservices to ensure subsecond response times for all clients.",
            expected_keywords=["database", "indexing", "optimization", "microservices"],
            time_taken_seconds=105.0,
            time_limit_seconds=90.0
        )
        self.assertTrue(result["exceeded_time"])
        self.assertIn("Time limit exceeded", result["timing_feedback"])
        self.assertFalse(result["is_too_brief"])


class TestQuestionGenerator(unittest.TestCase):
    """Tests for fallback questions bank and random selection."""

    def test_fallback_bank_loads_correctly(self):
        bank = load_fallback_bank()
        self.assertGreater(len(bank), 10)
        for q in bank:
            self.assertIn("domain", q)
            self.assertIn("difficulty", q)
            self.assertIn("question_text", q)
            self.assertIn("expected_keywords", q)
            self.assertIn("follow_up_question", q)

    def test_pick_random_fallback(self):
        q = pick_random_fallback("Technical", "Hard")
        self.assertEqual(q["domain"], "Technical")
        self.assertEqual(q["difficulty"], "Hard")
        self.assertTrue(len(q["question_text"]) > 10)
        self.assertTrue(len(q["expected_keywords"]) >= 3)
        self.assertIn("source", q)


class TestStorageAndProgressTracking(unittest.TestCase):
    """Tests for session history persistence and progress comparisons."""

    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.history_file = Path(self.temp_dir.name) / "test_history.json"

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_save_and_load_history(self):
        session_1 = {
            "session_id": "sess_1",
            "timestamp": "2026-09-17T10:00:00+00:00",
            "domain": "Technical",
            "difficulty": "Medium",
            "questions_count": 3,
            "average_score": 6.5,
            "average_time_seconds": 45.0,
            "total_fillers": 2
        }
        self.assertTrue(save_session(session_1, self.history_file))
        
        history = load_history(self.history_file)
        self.assertEqual(len(history), 1)
        self.assertEqual(history[0]["session_id"], "sess_1")

    def test_progress_comparison_improved(self):
        # Session 1: 6.0/10
        save_session({
            "session_id": "sess_1",
            "timestamp": "2026-09-17T10:00:00+00:00",
            "average_score": 6.0
        }, self.history_file)

        # Session 2: 8.5/10 (Improved)
        save_session({
            "session_id": "sess_2",
            "timestamp": "2026-09-17T11:00:00+00:00",
            "average_score": 8.5
        }, self.history_file)

        progress = get_progress_comparison(self.history_file)
        self.assertTrue(progress["has_history"])
        self.assertEqual(progress["trend"], "improved")
        self.assertGreater(progress["delta"], 0)
        self.assertIn("IMPROVED", progress["message"])

    def test_progress_comparison_declined(self):
        # Session 1: 9.0/10
        save_session({
            "session_id": "sess_1",
            "timestamp": "2026-09-17T10:00:00+00:00",
            "average_score": 9.0
        }, self.history_file)

        # Session 2: 5.0/10 (Declined)
        save_session({
            "session_id": "sess_2",
            "timestamp": "2026-09-17T11:00:00+00:00",
            "average_score": 5.0
        }, self.history_file)

        progress = get_progress_comparison(self.history_file)
        self.assertEqual(progress["trend"], "declined")
        self.assertLess(progress["delta"], 0)
        self.assertIn("DECLINED", progress["message"])

    def test_format_history_table(self):
        save_session({
            "session_id": "sess_1",
            "timestamp": "2026-09-17T10:00:00+00:00",
            "domain": "Technical",
            "difficulty": "Medium",
            "questions_count": 3,
            "average_score": 7.5,
            "average_time_seconds": 38.2
        }, self.history_file)

        table = format_history_table(self.history_file)
        self.assertIn("PAST INTERVIEW SESSIONS", table)
        self.assertIn("Technical", table)
        self.assertIn("7.5/10", table)


if __name__ == "__main__":
    unittest.main()
