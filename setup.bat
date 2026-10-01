@echo off
REM VoteSetu setup & launch script (Windows)
REM
REM What this does:
REM   1. Creates a local Python virtual environment (.\venv).
REM   2. Installs requirements.txt into it.
REM   3. Starts the VoteSetu server and opens it in your browser.
REM
REM Usage: double-click this file in File Explorer.

cd /d "%~dp0"

echo ==================================================================
echo   VoteSetu setup
echo ==================================================================

where python >nul 2>nul
if errorlevel 1 (
    echo ERROR: Python was not found on this system.
    echo Install it from https://www.python.org/downloads/ and re-run this script.
    echo IMPORTANT: during install, check "Add python.exe to PATH".
    pause
    exit /b 1
)

if not exist venv (
    echo Creating virtual environment (.\venv)...
    python -m venv venv
)

call venv\Scripts\activate.bat

echo Installing dependencies (this may take a minute the first time)...
python -m pip install --quiet --upgrade pip
python -m pip install --quiet -r requirements.txt

echo.
echo ==================================================================
echo   Starting VoteSetu at http://127.0.0.1:5000
echo   (An admin key will be printed below -- you'll need it for the
echo    /admin page. Close this window to stop the server.)
echo ==================================================================
echo.

start "" http://127.0.0.1:5000
python app.py

pause
