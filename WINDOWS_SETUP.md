# Windows Setup - Troubleshooting Guide

## ❗ Common Issues and Fixes

### Issue 1: Pydantic/FastAPI Version Conflict

**Error:**
```
TypeError: model_schema() got an unexpected keyword argument 'generic_origin'
```

**Fix:**
```bash
# Uninstall conflicting versions
pip uninstall pydantic fastapi pydantic-core -y

# Install compatible versions
pip install fastapi==0.109.0
pip install pydantic==2.5.3
pip install pydantic-settings==2.1.0
pip install uvicorn[standard]==0.27.0

# OR install from requirements.txt
pip install -r requirements.txt --force-reinstall
```

**Root Cause:** 
You have multiple Python package locations:
- `C:\Python312\Lib\site-packages` (global)
- `C:\Users\Admin\AppData\Roaming\Python\Python312\site-packages` (user)

This causes version conflicts.

**Best Solution:**
Always use a virtual environment to isolate packages:

```bash
# Create virtual environment
python -m venv venv

# Activate it
venv\Scripts\activate

# Now install packages (they go into venv, not global)
pip install -r requirements.txt
```

---

### Issue 2: Redis Not Available on Windows

**Error:**
```
Redis connection failed
```

**Fix Option 1: Use WSL (Recommended)**
```bash
# Install WSL if not already
wsl --install

# In WSL terminal
sudo apt update
sudo apt install redis-server
redis-server --daemonize yes
```

**Fix Option 2: Use Docker**
```bash
# Install Docker Desktop for Windows
# Then run:
docker run -d -p 6379:6379 redis:latest
```

**Fix Option 3: Skip Redis (Demo Mode)**
The application automatically falls back to in-memory cache if Redis is unavailable. You'll see:
```
⚠ Redis cache unavailable (using in-memory)
```
This is fine for demos!

---

### Issue 3: cx_Oracle Installation Fails

**Error:**
```
error: Microsoft Visual C++ 14.0 or greater is required
```

**Fix:**
```bash
# Install Oracle Instant Client (not needed for demo with mocks)
# Download from: https://www.oracle.com/database/technologies/instant-client/winx64-64-downloads.html

# OR skip it for demo by not using Oracle MCP
# The demo works with mock data
```

---

### Issue 4: Port Already in Use

**Error:**
```
OSError: [WinError 10048] Only one usage of each socket address
```

**Fix:**
```bash
# Find what's using port 8000
netstat -ano | findstr :8000

# Kill the process
taskkill /PID <PID_NUMBER> /F

# Or change port in config.py
API_PORT=8001
```

---

## ✅ Step-by-Step Windows Setup

### 1. Install Prerequisites

```bash
# Python 3.10+ (check)
python --version

# Node.js 18+ (check)
node --version

# Git Bash or PowerShell recommended
```

### 2. Clean Installation

```bash
# Extract downloaded archive
tar -xzf pricing-workflow-poc.tar.gz
cd pricing-workflow-poc

# Backend setup
cd backend

# Create FRESH virtual environment
python -m venv venv

# Activate it
venv\Scripts\activate

# Upgrade pip
python -m pip install --upgrade pip

# Install requirements (use --force-reinstall if issues)
pip install -r requirements.txt --force-reinstall

# Verify installation
python -c "import fastapi; print(fastapi.__version__)"
# Should print: 0.109.0
```

### 3. Configuration

Create `backend/.env`:
```env
API_HOST=0.0.0.0
API_PORT=8000

# Redis (optional for demo)
REDIS_HOST=localhost
REDIS_PORT=6379

# LLM (update with your server)
LLM_API_URL=http://localhost:8080/generate

# Oracle (not needed for demo)
ORACLE_HOST=localhost
ORACLE_PORT=1521
```

### 4. Start Backend

```bash
# From backend directory with venv activated
python app/main.py

# You should see:
# 🚀 Starting Pricing Workflow POC...
# ⚠ Redis cache unavailable (using in-memory)  # OK for demo
# ✓ Loaded 1 agents: pricing_agent
# INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 5. Test Backend

Open new terminal/PowerShell:
```bash
# Test health endpoint
curl http://localhost:8000/health

# Should return:
# {"status":"healthy","redis":false,"cache_stats":{...}}

# Test agents
curl http://localhost:8000/api/agents
```

### 6. Frontend Setup

```bash
# New terminal
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev

# Should see:
# VITE v5.0.8  ready in 500 ms
# ➜  Local:   http://localhost:5173/
```

### 7. Open Browser

Navigate to: **http://localhost:5173**

---

## 🐛 Quick Diagnostics

### Check Python Environment

```bash
# Activate venv
venv\Scripts\activate

# Check where packages are installed
pip list --local

# Should see packages in venv, not global
where python
# Should show: ...\venv\Scripts\python.exe
```

### Check Package Versions

```bash
pip show fastapi pydantic
# FastAPI: 0.109.0
# Pydantic: 2.5.3
```

### Test Imports

```python
python
>>> import fastapi
>>> import pydantic
>>> import redis
>>> # If no errors, you're good!
```

---

## 📝 Clean Reinstall (If All Else Fails)

```bash
# 1. Delete virtual environment
cd backend
rmdir /s venv

# 2. Delete Python cache
del /s /q __pycache__
del /s /q *.pyc

# 3. Create fresh venv
python -m venv venv
venv\Scripts\activate

# 4. Install specific versions one by one
pip install pydantic==2.5.3
pip install fastapi==0.109.0
pip install uvicorn[standard]==0.27.0

# 5. Install rest
pip install redis httpx aiohttp pyyaml python-dotenv

# 6. Test
python app/main.py
```

---

## 🎯 Demo Mode (Simplest Setup)

If you just want to see the demo quickly:

```bash
# 1. Backend (no Redis, no Oracle needed)
cd backend
python -m venv venv
venv\Scripts\activate
pip install fastapi==0.109.0 pydantic==2.5.3 uvicorn[standard]==0.27.0
python app/main.py

# 2. Frontend
cd frontend
npm install
npm run dev

# 3. Open http://localhost:5173
# Everything works with mocks and in-memory cache!
```

---

## 💡 Pro Tips for Windows

1. **Use Windows Terminal** (better than CMD)
2. **Use Git Bash** (for bash scripts)
3. **Run as Administrator** if permission issues
4. **Disable Antivirus** temporarily if blocking ports
5. **Use WSL2** for Redis (most reliable)

---

## 🆘 Still Having Issues?

1. Check the error message carefully
2. Google the specific error with "fastapi windows"
3. Ensure you're in the virtual environment (venv activated)
4. Make sure no other app is using port 8000 or 5173
5. Try the "Clean Reinstall" steps above

---

## ✅ Success Checklist

- [ ] Python 3.10+ installed
- [ ] Virtual environment created and activated
- [ ] FastAPI 0.109.0 installed (check with `pip show fastapi`)
- [ ] Pydantic 2.5.3 installed (check with `pip show pydantic`)
- [ ] Backend starts without errors
- [ ] Health check returns {"status": "healthy"}
- [ ] Frontend loads at http://localhost:5173

---

**You're ready to demo once all checks pass!** 🚀
