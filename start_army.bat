@echo off
title Whop Agent Army OS
echo ========================================================
echo        WHOP AGENT ARMY - VIRTUAL HEADQUARTERS
echo ========================================================
echo.
echo Starting FastAPI Backend with Unorouter Free Mesh...
start "Whop Agent Army Backend" cmd /k "python -m uvicorn backend.server:app --host 0.0.0.0 --port 8000"

timeout /t 3 /nobreak > nul

echo Starting Frontend Virtual Office Dashboard...
cd frontend
start "Whop Agent Army Frontend" cmd /k "npm run dev -- --host"

echo.
echo ========================================================
echo Virtual Office is LIVE!
echo Dashboard URL: http://localhost:5173
echo Backend API:   http://localhost:8000
echo ========================================================
echo.
