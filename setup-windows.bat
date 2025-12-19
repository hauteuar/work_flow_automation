@echo off
REM Pricing Workflow POC - Windows Setup Script
REM Run this from the project root directory

echo ==========================================
echo Pricing Workflow POC - Windows Setup
echo ==========================================
echo.

REM Check Python
echo Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found! Please install Python 3.10+
    pause
    exit /b 1
)
echo [OK] Python found

REM Check Node
echo Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found! Please install Node.js 18+
    pause
    exit /b 1
)
echo [OK] Node.js found

echo.
echo ==========================================
echo Setting up Backend
echo ==========================================
echo.

cd backend

REM Create virtual environment
echo Creating virtual environment...
if exist venv (
    echo [WARN] venv already exists, skipping creation
) else (
    python -m venv venv
    echo [OK] Virtual environment created
)

REM Activate and install
echo Installing Python packages...
call venv\Scripts\activate.bat

REM Upgrade pip first
python -m pip install --upgrade pip --quiet

REM Install from Windows-specific requirements
if exist requirements-windows.txt (
    echo Using requirements-windows.txt...
    pip install -r requirements-windows.txt --quiet
) else (
    echo Using requirements.txt...
    pip install -r requirements.txt --quiet
)

if errorlevel 1 (
    echo [ERROR] Package installation failed!
    echo Trying with --force-reinstall...
    pip install fastapi==0.109.0 pydantic==2.5.3 uvicorn[standard]==0.27.0 --force-reinstall
)

echo [OK] Backend packages installed

REM Verify installation
echo Verifying installation...
python -c "import fastapi; print('FastAPI:', fastapi.__version__)" 2>nul
python -c "import pydantic; print('Pydantic:', pydantic.__version__)" 2>nul

cd ..

echo.
echo ==========================================
echo Setting up Frontend
echo ==========================================
echo.

cd frontend

echo Installing Node packages...
if exist node_modules (
    echo [WARN] node_modules exists, skipping npm install
) else (
    call npm install
    echo [OK] Frontend packages installed
)

cd ..

echo.
echo ==========================================
echo Setup Complete!
echo ==========================================
echo.
echo To start the application:
echo.
echo Terminal 1 - Backend:
echo   cd backend
echo   venv\Scripts\activate
echo   python app\main.py
echo.
echo Terminal 2 - Frontend:
echo   cd frontend
echo   npm run dev
echo.
echo Then open: http://localhost:5173
echo.
echo For detailed instructions, see WINDOWS_SETUP.md
echo.
pause
