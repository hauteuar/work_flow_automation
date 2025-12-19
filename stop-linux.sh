#!/bin/bash
# Stop all services for Pricing Workflow POC

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "=========================================="
echo "Stopping Pricing Workflow POC"
echo "=========================================="
echo ""

# Stop Backend
if [ -f logs/backend.pid ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    echo -n "Stopping Backend (PID: $BACKEND_PID)... "
    kill $BACKEND_PID 2>/dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC}"
        rm logs/backend.pid
    else
        echo -e "${RED}✗ (not running)${NC}"
    fi
else
    echo "Backend PID file not found"
fi

# Stop Frontend
if [ -f logs/frontend.pid ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    echo -n "Stopping Frontend (PID: $FRONTEND_PID)... "
    kill $FRONTEND_PID 2>/dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC}"
        rm logs/frontend.pid
    else
        echo -e "${RED}✗ (not running)${NC}"
    fi
else
    echo "Frontend PID file not found"
fi

# Cleanup any stray processes
echo ""
echo "Cleaning up stray processes..."
pkill -f "python app/main.py" 2>/dev/null
pkill -f "npm run dev" 2>/dev/null

echo ""
echo -e "${GREEN}All services stopped${NC}"
echo ""
