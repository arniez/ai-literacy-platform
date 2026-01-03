#!/bin/bash

echo "========================================"
echo "AI Literacy Platform - Quick Start"
echo "========================================"
echo ""
echo "Starting servers..."
echo ""

# Start backend
echo "[Backend] Starting on http://localhost:5002"
cd server && npm run dev &
BACKEND_PID=$!

# Wait a bit
sleep 3

# Start frontend
echo "[Frontend] Starting on http://localhost:3000"
cd ../client && npm start &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo "Both servers are running!"
echo ""
echo "Backend:  http://localhost:5002/api/health"
echo "Frontend: http://localhost:3000"
echo ""
echo "Demo Login: student@student.nl / password123"
echo ""
echo "Press Ctrl+C to stop both servers"
echo "========================================"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
