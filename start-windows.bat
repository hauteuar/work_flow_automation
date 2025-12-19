@echo off
REM Start all services for Pricing Workflow POC

echo ==========================================
echo Starting Pricing Workflow POC
echo ==========================================
echo.

REM Start Backend in new window
echo Starting Backend...
start "Backend - FastAPI" cmd /k "cd backend && venv\Scripts\activate && python app\main.py"

REM Wait a bit for backend to start
timeout /t 3 /nobreak >nul

REM Start Frontend in new window
echo Starting Frontend...
start "Frontend - Vite" cmd /k "cd frontend && npm run dev"

echo.
echo ==========================================
echo Services Starting...
echo ==========================================
echo.
echo Backend will be at: http://localhost:8000
echo Frontend will be at: http://localhost:5173
echo.
echo Two new windows will open for Backend and Frontend
echo Close those windows to stop the services
echo.
echo Press any key to exit this window...
pause >nul
