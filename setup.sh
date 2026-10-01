#!/bin/bash
# VoteSetu setup & launch script (macOS / Linux)
#
# What this does:
#   1. Creates a local Python virtual environment (./venv) so VoteSetu's
#      dependencies don't clash with anything else on your system.
#   2. Installs requirements.txt into it.
#   3. Starts the VoteSetu server and opens it in your browser.
#
# Usage:
#   Double-click this file (if your OS runs .sh/.command files directly),
#   or from a terminal:  ./setup.sh

set -e
cd "$(dirname "$0")"

echo "=================================================================="
echo "  VoteSetu setup"
echo "=================================================================="

PYTHON_BIN="python3"
if ! command -v python3 >/dev/null 2>&1; then
  if command -v python >/dev/null 2>&1; then
    PYTHON_BIN="python"
  else
    echo "ERROR: Python 3 was not found on this system."
    echo "Install it from https://www.python.org/downloads/ and re-run this script."
    read -p "Press Enter to close..." _
    exit 1
  fi
fi
echo "Using $($PYTHON_BIN --version)"

if [ ! -d "venv" ]; then
  echo "Creating virtual environment (./venv)..."
  "$PYTHON_BIN" -m venv venv
fi

# shellcheck disable=SC1091
source venv/bin/activate

echo "Installing dependencies (this may take a minute the first time)..."
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt

echo ""
echo "=================================================================="
echo "  Starting VoteSetu at http://127.0.0.1:5000"
echo "  (An admin key will be printed below -- you'll need it for the"
echo "   /admin page. Press CTRL+C in this window to stop the server.)"
echo "=================================================================="
echo ""

# Try to open the browser a couple of seconds after the server starts.
(
  sleep 2
  if command -v open >/dev/null 2>&1; then
    open "http://127.0.0.1:5000"        # macOS
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "http://127.0.0.1:5000"    # Linux
  fi
) &

python app.py
