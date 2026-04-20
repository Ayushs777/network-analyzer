@echo off
REM Start Network Analyzer Backend with Gunicorn on Windows
REM This script requires gunicorn to be installed: pip install gunicorn

cd /d "%~dp0backend"

REM Activate virtual environment if it exists
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
)

REM Install dependencies if needed
python -m pip install -q gunicorn

REM Start backend with gunicorn
echo Starting Network Analyzer Backend on http://0.0.0.0:8000
gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8000

pause
