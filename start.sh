#!/usr/bin/env bash

# RealBuy: Unified dev server runner for both Backend & Frontend

cleanup() {
  echo -e "\nShutting down RealBuy services..."
  kill $(jobs -p) 2>/dev/null
  exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# Free ports if previously occupied
fuser -k 8000/tcp 2>/dev/null
fuser -k 3000/tcp 2>/dev/null

# Clean stale build cache to avoid webpack chunk mismatches
rm -rf .next

echo "=========================================================="
echo " Starting RealBuy Full-Stack Platform"
echo " Backend:  http://localhost:8000 (Docs: http://localhost:8000/docs)"
echo " Frontend: http://localhost:3000"
echo " Press CTRL+C to stop both servers"
echo "=========================================================="

# 1. Start FastAPI Backend in background
./backend/venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload &

# Allow backend 1 second to bind
sleep 1

# 2. Start Next.js Frontend
export PATH="$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node 2>/dev/null | tail -n 1)/bin:$PATH"
npm run dev

wait
