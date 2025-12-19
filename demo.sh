#!/bin/bash

# Demo Script for Pricing Workflow POC
# This script demonstrates the system capabilities

echo "================================================"
echo "🚀 Pricing Workflow POC - Demo Script"
echo "================================================"
echo ""

# Check if backend is running
if ! curl -s http://localhost:8000/health > /dev/null; then
    echo "❌ Backend is not running on port 8000"
    echo "   Start it with: cd backend/app && python main.py"
    exit 1
fi

echo "✅ Backend is running"

# Check if frontend is running
if ! curl -s http://localhost:5173 > /dev/null; then
    echo "❌ Frontend is not running on port 5173"
    echo "   Start it with: cd frontend && npm run dev"
    exit 1
fi

echo "✅ Frontend is running"

# Check Redis
if ! redis-cli ping > /dev/null 2>&1; then
    echo "❌ Redis is not running"
    echo "   Start it with: redis-server"
    exit 1
fi

echo "✅ Redis is running"
echo ""

echo "================================================"
echo "📊 Demo Walkthrough"
echo "================================================"
echo ""
echo "1. Open your browser: http://localhost:5173"
echo ""
echo "2. Build your first workflow:"
echo "   - Drag 'Oracle Database' from left panel"
echo "   - Enter mock credentials (demo mode):"
echo "     Host: demo-oracle.local"
echo "     Port: 1521"
echo "     Service: PRICING_DB"
echo "     User: demo_user"
echo "     Password: demo123"
echo "   - Select Action: 'Check Pricing Status'"
echo ""
echo "   - Drag 'Unix/Linux Server' below Oracle node"
echo "   - Enter mock credentials:"
echo "     Host: demo-unix.local"
echo "     Port: 22"
echo "     User: demo_user"
echo "     Password: demo123"
echo "   - Select Action: 'Check Pricing Job Logs'"
echo ""
echo "   - Connect nodes by dragging from bottom of Oracle"
echo "     to top of Unix node"
echo ""
echo "3. Save workflow:"
echo "   - Name it 'Pricing Investigation'"
echo "   - Click 'Save Workflow'"
echo ""
echo "4. Execute workflow:"
echo "   - Click 'Execute' button"
echo "   - Enter CUSIP: 912828ZG8"
echo "   - Watch real-time execution in right panel"
echo ""
echo "5. Chat with AI:"
echo "   - Type: 'Explain the workflow results'"
echo "   - AI will analyze and provide insights"
echo ""

echo "================================================"
echo "🎯 Demo Scenarios"
echo "================================================"
echo ""
echo "Scenario 1: Failed Pricing Investigation"
echo "  Oracle → Check pricing status for CUSIP"
echo "  Unix → Grep logs for error messages"
echo "  LLM → Analyze and suggest fix"
echo ""
echo "Scenario 2: Bulk Reconciliation"
echo "  Oracle → Get all failed pricings from today"
echo "  Unix → Check if pricing job is running"
echo "  Oracle → Update status for each"
echo ""
echo "Scenario 3: Proactive Monitoring"
echo "  Unix → Tail pricing logs in real-time"
echo "  LLM → Detect anomalies"
echo "  Oracle → Mark suspicious entries"
echo ""

echo "================================================"
echo "📝 Sample CUSIPs for Testing"
echo "================================================"
echo ""
echo "  912828ZG8 - US Treasury (failed pricing)"
echo "  459200JZ8 - IBM Corp Bond (successful)"
echo "  037833AE9 - Apple Inc (pending)"
echo ""

echo "================================================"
echo "✨ Key Features to Demonstrate"
echo "================================================"
echo ""
echo "  ✅ Drag & drop workflow builder"
echo "  ✅ Dynamic credential management"
echo "  ✅ Real-time execution monitoring"
echo "  ✅ WebSocket updates"
echo "  ✅ Redis caching"
echo "  ✅ MCP server abstraction"
echo "  ✅ AI-powered chat assistance"
echo ""

echo "================================================"
echo "🎬 Ready to Demo!"
echo "================================================"
echo ""
echo "Open: http://localhost:5173"
echo ""
