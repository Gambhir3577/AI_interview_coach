#!/usr/bin/env python3
"""
Root runner script for AI Coach Interviewer CLI
Run using: python run_cli.py
"""

import sys
from pathlib import Path

# Ensure CLI module is in python path
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

from cli.main import main_cli_loop

if __name__ == "__main__":
    try:
        main_cli_loop()
    except KeyboardInterrupt:
        print("\n\n[Exiting AI Coach Interviewer. Goodbye!]")
        sys.exit(0)
