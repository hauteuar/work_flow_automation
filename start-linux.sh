#!/bin/bash
# Start all services for Pricing Workflow POC (Development Mode)

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "=========================================="
echo "Starting Pricing Workflow POC"
echo "=========================================="
echo ""

# Check Redis
echo -n "Checking Redis... "
if redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not running${NC}"
    echo "Starting Redis..."
    sudo systemctl start redis-server 2>/dev/null || sudo systemctl start redis 2>/dev/null
    sleep 2
    if redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Redis started${NC}"
    else
        echo -e "${YELLOW}⚠ Redis not available (will use in-memory cache)${NC}"
    fi
fi

# Create log directory if doesn't exist
mkdir -p logs

# Start Backend
echo ""
echo "Starting Backend (FastAPI)..."
cd backend
source venv/bin/activate
nohup python app/main.py > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../logs/backend.pid
cd ..
echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"

# Wait for backend to be ready
echo -n "Waiting for backend to be ready"
for i in {1..10}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo -e " ${GREEN}✓${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

# Start Frontend
echo ""
echo "Starting Frontend (Vite)..."
cd frontend
nohup npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../logs/frontend.pid
cd ..
echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"

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
echo "Logs:"
echo "  Backend:  tail -f logs/backend.log"
echo "  Frontend: tail -f logs/frontend.log"
echo ""
echo "To stop services:"
echo "  ./stop-linux.sh"
echo "  or: kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo -e "${GREEN}Open your browser to: http://localhost:5173${NC}"
echo ""
