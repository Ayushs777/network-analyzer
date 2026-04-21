@echo off
setlocal enabledelayedexpansion
title NetViz Command Center - SETUP & RUN
color 0A

echo.
echo ============================================================
echo        NETVIZ COMMAND CENTER - SETUP ^& LAUNCHER
echo        For fresh PC installation and startup
echo ============================================================
echo.

REM ─────────────────────────────────────────────
REM  STEP 0: Check for Administrator privileges
REM ─────────────────────────────────────────────
net session >nul 2>&1
if errorlevel 1 (
    echo [WARNING] This script is NOT running as Administrator.
    echo           Packet capture (raw sockets) requires admin rights.
    echo           The app will still run but may fall back to demo mode.
    echo.
    echo    To fix: Right-click this file ^> "Run as administrator"
    echo.
    timeout /t 4 /nobreak > nul
)

REM ─────────────────────────────────────────────
REM  STEP 1: Check Python is installed
REM ─────────────────────────────────────────────
echo [1/6] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ERROR] Python not found on this PC!
    echo.
    echo  Please install Python 3.10 or higher from:
    echo  https://www.python.org/downloads/
    echo.
    echo  IMPORTANT: During install, check "Add Python to PATH"
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('python --version 2^>^&1') do echo          Found: %%v
echo.

REM ─────────────────────────────────────────────
REM  STEP 2: Check Node.js is installed
REM ─────────────────────────────────────────────
echo [2/6] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ERROR] Node.js not found on this PC!
    echo.
    echo  Please install Node.js v18 or higher from:
    echo  https://nodejs.org/en/download/
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version 2^>^&1') do echo          Found: Node.js %%v
for /f "tokens=*" %%v in ('npm --version 2^>^&1') do echo          Found: npm %%v
echo.

REM ─────────────────────────────────────────────
REM  STEP 3: Set up Python virtual environment
REM ─────────────────────────────────────────────
echo [3/6] Setting up Python virtual environment...
cd /d "%~dp0"

if exist "venv\Scripts\activate.bat" (
    echo          Existing venv found. Skipping creation.
) else (
    echo          Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment.
        pause
        exit /b 1
    )
    echo          Virtual environment created successfully.
)
echo.

REM ─────────────────────────────────────────────
REM  STEP 4: Install Python dependencies
REM ─────────────────────────────────────────────
echo [4/6] Installing Python backend dependencies...
echo          This may take a few minutes on a fresh install...
echo.
call venv\Scripts\activate.bat
pip install --upgrade pip -q
pip install -r requirements.txt
if errorlevel 1 (
    echo.
    echo [ERROR] Failed to install Python packages.
    echo         Check your internet connection and try again.
    pause
    exit /b 1
)
echo.
echo          Python dependencies installed successfully.
echo.

REM ─────────────────────────────────────────────
REM  STEP 5: Install frontend Node dependencies
REM ─────────────────────────────────────────────
echo [5/6] Installing Frontend (Node.js) dependencies...
cd /d "%~dp0frontend"
if exist "node_modules\" (
    echo          node_modules already present. Skipping install.
) else (
    echo          Running npm install... (may take 1-2 minutes)
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed.
        echo         Check your internet connection and try again.
        pause
        exit /b 1
    )
    echo          Frontend dependencies installed successfully.
)
echo.
cd /d "%~dp0"

REM ─────────────────────────────────────────────
REM  STEP 6: Launch Backend and Frontend servers
REM ─────────────────────────────────────────────
echo [6/6] Launching servers...
echo.

echo          Starting Backend  ^(port 8000^)...
start "NetViz Backend (http://localhost:8000)" cmd /k "cd /d "%~dp0" && call venv\Scripts\activate.bat && echo. && echo  ==========================================  && echo    NETVIZ BACKEND - Running on port 8000   && echo    API Docs: http://localhost:8000/api/docs && echo  ==========================================  && echo. && python -m uvicorn backend.app.main:app --reload --port 8000 --host 0.0.0.0"

echo          Waiting 5 seconds for backend to initialise...
timeout /t 5 /nobreak > nul

echo          Starting Frontend ^(port 5173^)...
start "NetViz Frontend (http://localhost:5173)" cmd /k "cd /d "%~dp0frontend" && echo. && echo  ==========================================  && echo    NETVIZ FRONTEND - Running on port 5173  && echo    Dashboard: http://localhost:5173        && echo  ==========================================  && echo. && npm run dev"

echo          Waiting 4 seconds for frontend to initialise...
timeout /t 4 /nobreak > nul

REM ─────────────────────────────────────────────
REM  Open the dashboard in the default browser
REM ─────────────────────────────────────────────
echo.
echo ============================================================
echo   Setup complete! Opening dashboard in browser...
echo ============================================================
start http://localhost:5173

echo.
echo   Services are now running in separate windows:
echo.
echo   Frontend  : http://localhost:5173
echo   Backend   : http://localhost:8000
echo   API Docs  : http://localhost:8000/api/docs
echo.
echo   [HOW TO STOP]
echo   Close the two black terminal windows to stop the servers.
echo.
echo   [NEXT TIME]
echo   Run START.bat instead (skips installation steps).
echo.
pause
