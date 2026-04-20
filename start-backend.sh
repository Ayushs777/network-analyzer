#!/bin/bash
# Start Network Analyzer Backend with Gunicorn on Linux/macOS
# Run as: ./start-backend.sh

cd "$(dirname "$0")/backend"

# Activate virtual environment if it exists
if [ -f venv/bin/activate ]; then
    source venv/bin/activate
fi

# Install dependencies if needed
python -m pip install -q gunicorn

# Start backend with gunicorn
echo "Starting Network Analyzer Backend on http://0.0.0.0:8000"
gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8000

