@echo off
echo ========================================
echo AI Literacy Platform - Quick Start
echo ========================================
echo.
echo Starting servers...
echo.
echo [Backend] Starting on http://localhost:5002
start cmd /k "cd server && npm run dev"
timeout /t 3 /nobreak >nul
echo.
echo [Frontend] Starting on http://localhost:3000
start cmd /k "cd client && npm start"
echo.
echo ========================================
echo Both servers are starting!
echo.
echo Backend:  http://localhost:5002/api/health
echo Frontend: http://localhost:3000
echo.
echo Demo Login: student@student.nl / password123
echo ========================================
pause
