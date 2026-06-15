@echo off
echo ============================================
echo  Smart Home Energy Dashboard - Setup
echo ============================================
echo.

echo [1/2] Installing Python backend dependencies...
cd backend
pip install -r requirements.txt
cd ..

echo.
echo [2/2] Installing React frontend dependencies...
cd frontend
npm install
cd ..

echo.
echo ============================================
echo  Setup complete!
echo  Run start.bat to launch the dashboard.
echo ============================================
pause
