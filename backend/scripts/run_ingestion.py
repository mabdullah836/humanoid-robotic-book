#!/usr/bin/env python3
"""
Run the ingestion pipeline from the backend root.

Usage (from repo root or backend/):
  python -m scripts.run_ingestion --mode local --path ../docs
  python -m scripts.run_ingestion --mode sitemap --sitemap https://yoursite.com/sitemap.xml

Or from backend/:
  uv run python -m scripts.run_ingestion --mode local --path ../docs
  uv run python scripts/run_ingestion.py --mode local --path ../docs

Requires: PYTHONPATH or run from backend so that 'src' is importable.
"""

import os
import sys

# Ensure backend root is on path so "src" resolves
BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

# Delegate to the main ingestion module
from src.ingestion.ingest import main

if __name__ == "__main__":
    sys.exit(main())
