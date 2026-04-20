#!/bin/bash
# Quick setup script for production
# Run this before first deployment

set -e

PROJECT_ROOT="$(dirname "$0")"
cd "$PROJECT_ROOT"

echo "=== Network Analyzer Deployment Setup ==="
echo ""

# Backend setup
echo "[1/4] Setting up backend..."
cd backend

if [ ! -d venv ]; then
    echo "  Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate

echo "  Installing dependencies..."
pip install -q -r ../requirements.txt
pip install -q gunicorn

echo "  ✓ Backend ready"

# Frontend setup
cd ../frontend
echo "[2/4] Setting up frontend..."

if [ ! -d node_modules ]; then
    echo "  Installing npm packages..."
    npm install
fi

echo "  Building frontend..."
npm run build
echo "  ✓ Frontend ready"

# Configuration
echo "[3/4] Checking configuration..."
cd ../backend

if [ ! -f .env ]; then
    echo "  Creating .env from template..."
    cp .env.example .env
else
    echo "  .env already exists"
fi
echo "  ✓ Configuration ready"

# Summary
cd ..
echo "[4/4] Deployment summary"
echo ""
echo "  Backend location:     $(pwd)/backend"
echo "  Frontend build:       $(pwd)/frontend/dist"
echo "  Database:             $(pwd)/backend/network_analyzer.db"
echo ""
echo "✓ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Start backend:  ./start-backend.sh"
echo "  2. Serve frontend: Nginx/Apache pointing to ./frontend/dist"
echo "  3. Access app:     http://localhost"
echo ""
