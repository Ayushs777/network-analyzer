@echo off
title NetViz Command Center - Launcher
color 0A

echo ========================================
echo        NETVIZ COMMAND CENTER
echo ========================================
echo.

REM Check if venv exists, if not create it
if not exist "venv\Scripts\activate.bat" (
    echo [INFO] Virtual environment not found. Creating one...
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment. Please install Python.
        pause
        exit /b 1
    )
    echo [SUCCESS] Virtual environment created.
)

echo [1/2] Checking dependencies and starting Backend...
start "Backend - NetViz" cmd /k "cd /d "%~dp0" && venv\Scripts\activate.bat && pip install -q -r requirements.txt && python -m uvicorn backend.app.main:app --reload --port 8000 --host 0.0.0.0"

echo Waiting 3 seconds for backend to start...
timeout /t 3 /nobreak > nul

echo [2/2] Checking Frontend dependencies and starting...
cd /d "%~dp0frontend"
if not exist "node_modules\" (
    echo [INFO] Frontend dependencies missing. Installing...
    call npm install
)
start "Frontend - NetViz" cmd /k "npm run dev"

echo Waiting 5 seconds for frontend to start...
timeout /t 5 /nobreak > nul

echo.
echo ========================================
echo   Opening dashboard in browser...
echo ========================================
start http://localhost:5173

echo.
echo Both services are running!
echo - Backend:  http://localhost:8000
echo - Frontend: http://localhost:5173
echo - API Docs: http://localhost:8000/docs
echo.
echo Close the two black windows to stop the servers.
pause
