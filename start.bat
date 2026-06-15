@echo off
cd /d "%~dp0"
echo ============================================
echo  Smart Home Energy Dashboard
echo ============================================
echo.
echo Starting FastAPI backend on port 8000...
start "Energy - Backend" cmd /k "cd backend && uvicorn main:app --reload --port 8000"

timeout /t 3 /nobreak > nul

echo Starting React frontend on port 5173...
start "Energy - Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ============================================
echo  Dashboard  : http://localhost:5173
echo  API docs   : http://localhost:8000/docs
echo ============================================
echo.
echo Two terminal windows have opened.
echo Close them to stop the servers.
pause
