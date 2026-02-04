#!/bin/bash
# Navigate to backend directory to ensure app module path is correct
cd backend

# Check if venv exists and use it
if [ -d "venv" ]; then
    echo "Starting backend server using venv..."
    ./venv/bin/uvicorn app.main:app --reload --port 8000
else
    echo "Error: backend/venv not found. Please set up the virtual environment."
    exit 1
fi
