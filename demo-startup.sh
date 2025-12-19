#!/bin/bash

# Pricing Workflow POC - Demo Startup Script
# This script starts all services and runs demo tests

echo "=========================================="
echo "Pricing Workflow POC - Demo Setup"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Redis
echo -n "Checking Redis... "
if redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not running${NC}"
    echo "Starting Redis..."
    redis-server --daemonize yes
    sleep 2
    if redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Redis started${NC}"
    else
        echo -e "${RED}✗ Failed to start Redis${NC}"
        echo "Please start Redis manually: redis-server"
        exit 1
    fi
fi

# Check Python environment
echo -n "Checking Python environment... "
if [ -d "backend/venv" ]; then
    echo -e "${GREEN}✓ Found${NC}"
else
    echo -e "${YELLOW}! Creating virtual environment${NC}"
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
    echo -e "${GREEN}✓ Environment created${NC}"
fi

# Check Node modules
echo -n "Checking Node modules... "
if [ -d "frontend/node_modules" ]; then
    echo -e "${GREEN}✓ Found${NC}"
else
    echo -e "${YELLOW}! Installing dependencies${NC}"
    cd frontend
    npm install
    cd ..
    echo -e "${GREEN}✓ Dependencies installed${NC}"
fi

echo ""
echo "=========================================="
echo "Starting Services"
echo "=========================================="
echo ""

# Start backend
echo "Starting Backend (FastAPI)..."
cd backend
source venv/bin/activate
python app/main.py &
BACKEND_PID=$!
cd ..
echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"
sleep 3

# Test backend
echo -n "Testing backend... "
if curl -s http://localhost:8000/health > /dev/null; then
    echo -e "${GREEN}✓ Backend healthy${NC}"
else
    echo -e "${RED}✗ Backend not responding${NC}"
    kill $BACKEND_PID
    exit 1
fi

# Start frontend
echo "Starting Frontend (Vite)..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..
echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"
sleep 3

echo ""
echo "=========================================="
echo "Services Running"
echo "=========================================="
echo ""
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo "Redis:    localhost:6379"
echo ""
echo "API Docs: http://localhost:8000/docs"
echo ""

echo "=========================================="
echo "Demo Tests"
echo "=========================================="
echo ""

# Test 1: List agents
echo "Test 1: List Available Agents"
echo "GET /api/agents"
curl -s http://localhost:8000/api/agents | python3 -m json.tool
echo ""

# Test 2: Get pricing agent skills
echo ""
echo "Test 2: Get Pricing Agent Skills"
echo "GET /api/agents/pricing_agent/skills"
curl -s http://localhost:8000/api/agents/pricing_agent/skills | python3 -m json.tool | head -30
echo "..."
echo ""

# Test 3: Test compression
echo ""
echo "Test 3: Test Compression Engine"
echo "POST /api/test/compress"
TEST_TEXT="The pricing job failed because the database connection timed out. The database connection timeout occurred at 2:15 AM. The timeout was due to network issues. Network issues caused the failure. The pricing system needs to be restarted."
RESPONSE=$(curl -s -X POST "http://localhost:8000/api/test/compress?text=${TEST_TEXT}&max_tokens=100")
echo "$RESPONSE" | python3 -m json.tool
echo ""

# Test 4: Cache stats
echo ""
echo "Test 4: Cache Statistics"
echo "GET /api/cache/stats"
curl -s http://localhost:8000/api/cache/stats | python3 -m json.tool
echo ""

echo ""
echo "=========================================="
echo "Demo Ready!"
echo "=========================================="
echo ""
echo "Open your browser to: ${GREEN}http://localhost:5173${NC}"
echo ""
echo "Try these scenarios:"
echo "  1. Check pricing for a specific CUSIP"
echo "  2. Investigate pricing failures"
echo "  3. Build a workflow using drag-and-drop"
echo ""
echo "To stop services:"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo "  or press Ctrl+C twice"
echo ""

# Keep script running
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT TERM
wait
