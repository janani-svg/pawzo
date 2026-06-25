#!/bin/bash
cd "$(dirname "$0")"
source venv/Scripts/activate
uvicorn main:app --reload --port 8000
