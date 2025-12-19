# Pricing Workflow POC - BofA Wealth Management

AI-powered workflow automation for pricing operations with intelligent agents, MCP servers, and drag-and-drop workflow builder.

## 🎯 Overview

This POC demonstrates:
- **Intelligent Agent System** with skills.md capabilities
- **AI Bloating Compression** to reduce token usage by 40-60%
- **Prompt Engineering Engine** for optimized LLM interactions
- **MCP Servers** for Oracle DB and Unix systems
- **Visual Workflow Builder** with drag-and-drop canvas
- **Redis Caching** for performance optimization

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend                            │
│  • Workflow Canvas (React Flow)                             │
│  • Chat Interface                                            │
│  • Real-time Execution Dashboard                            │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Intelligent Orchestration Layer                 │
│  • Master Orchestrator                                       │
│  • Compression Engine (40-60% token reduction)             │
│  • Prompt Engineering (skills.md based)                     │
│  • Response Synthesis                                        │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Skill-Based Agents                          │
│  • Pricing Agent (Oracle queries, validation)              │
│  • Unix Agent (SSH, logs, job control)                     │
│  • Analysis Agent (Root cause, recommendations)            │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    MCP Server Layer                          │
│  • Oracle MCP (STDIO protocol)                              │
│  • Unix MCP (SSH client)                                    │
│  • Reporting MCP (Excel/PDF generation)                     │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│            Redis Cache + Your GPU LLM Server                 │
└─────────────────────────────────────────────────────────────┘
```

## 📋 Prerequisites

### Required Software
- **Python 3.10+**
- **Node.js 18+**
- **Redis 7+**
- **Oracle Client libraries** (for cx_Oracle)

### Oracle Instant Client Setup

**macOS:**
```bash
brew install oracle-instantclient
```

**Linux:**
```bash
# Download from Oracle website
# https://www.oracle.com/database/technologies/instant-client.html
unzip instantclient-basic-linux.x64-21.1.0.0.0.zip
export LD_LIBRARY_PATH=/path/to/instantclient_21_1:$LD_LIBRARY_PATH
```

**Windows:**
Download and install from Oracle website, add to PATH.

### Redis Setup

**macOS:**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

**Windows:**
Download from https://redis.io/download or use Docker:
```bash
docker run -d -p 6379:6379 redis:latest
```

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Clone (or extract) the project
cd pricing-workflow-poc

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Frontend setup
cd ../frontend
npm install
```

### 2. Configuration

Create `.env` file in `backend/` directory:

```env
# API Settings
API_HOST=0.0.0.0
API_PORT=8000

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Your GPU LLM Server
LLM_API_URL=http://your-gpu-server:8080/generate
LLM_MODEL=llama-3-70b
LLM_MAX_TOKENS=4096
LLM_TEMPERATURE=0.7

# Oracle Database
ORACLE_HOST=oracle-db-server.bofa.com
ORACLE_PORT=1521
ORACLE_SERVICE=PRICING
ORACLE_USER=pricing_user
ORACLE_PASSWORD=your_password

# Unix Servers (update with your servers)
# See config.py for full configuration
```

### 3. Start Services

**Terminal 1 - Redis:**
```bash
redis-server
# Should see: "Ready to accept connections"
```

**Terminal 2 - Backend:**
```bash
cd backend
source venv/bin/activate
python -m app.main
# Should see: "✓ Redis connected"
# Should see: "Uvicorn running on http://0.0.0.0:8000"
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
# Should see: "Local: http://localhost:5173"
```

### 4. Access the Application

Open browser: **http://localhost:5173**

You should see:
- Left sidebar with draggable MCP nodes
- Center canvas for workflow building
- Chat widget (if implemented)

## 🎬 Demo Scenarios

### Scenario 1: Pricing Failure Investigation

**User Action:** Type in chat or build workflow:
> "Check why pricing failed for CUSIP 912828ZG8 today"

**System Flow:**
1. **Pricing Agent** queries Oracle for pricing status
2. **LLM** analyzes error code (compressed context)
3. **Unix Agent** checks pricing server logs
4. **LLM** performs root cause analysis
5. **System** presents findings with recommendations

**Expected Output:**
```
Pricing Failure Analysis:
CUSIP: 912828ZG8
Error: E001 - Vendor timeout
Source: Bloomberg
Retried: Successfully recovered at 06:17 ET
Status: ACTIVE
```

### Scenario 2: Large Price Movement Alert

**User Action:**
> "Alert! CUSIP 594918104 moved 15% today. Investigate."

**System Flow:**
1. Query current and prior day prices
2. Calculate percentage change
3. Check for corporate actions
4. Cross-reference news sources
5. Validate against circuit breaker rules
6. Generate recommendation

### Scenario 3: Workflow Builder

**User Action:** Drag and drop nodes
1. Drag **Oracle Query** node
2. Connect to **LLM Analysis** node
3. Connect to **Unix Command** node
4. Connect to **Generate Report** node
5. Click **Execute**

## 📁 Project Structure

```
pricing-workflow-poc/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI entry
│   │   ├── config.py                  # Configuration
│   │   ├── models.py                  # Pydantic models
│   │   │
│   │   ├── intelligence/              # Intelligent Layer
│   │   │   ├── compression.py         # Token compression
│   │   │   ├── prompt_engine.py       # Prompt builder
│   │   │   └── orchestrator.py        # Master orchestrator
│   │   │
│   │   ├── agents/                    # Agent implementations
│   │   │   ├── pricing_agent.py
│   │   │   ├── unix_agent.py
│   │   │   └── analysis_agent.py
│   │   │
│   │   ├── mcp_servers/               # MCP servers
│   │   │   ├── oracle_mcp.py
│   │   │   ├── unix_mcp.py
│   │   │   └── reporting_mcp.py
│   │   │
│   │   ├── skills/                    # Agent skills
│   │   │   ├── pricing_agent/
│   │   │   │   ├── skills.md          ⭐ Core capabilities
│   │   │   │   ├── config.json
│   │   │   │   └── prompts/
│   │   │   ├── unix_agent/
│   │   │   └── analysis_agent/
│   │   │
│   │   ├── workflow/                  # Workflow engine
│   │   │   ├── engine.py
│   │   │   └── executor.py
│   │   │
│   │   └── cache/                     # Redis cache
│   │       └── redis_cache.py
│   │
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── WorkflowCanvas/        ⭐ Drag-drop builder
│   │   │   │   ├── WorkflowCanvas.jsx
│   │   │   │   ├── NodeSidebar.jsx
│   │   │   │   ├── NodeTypes.jsx
│   │   │   │   └── CanvasToolbar.jsx
│   │   │   │
│   │   │   └── Chat/
│   │   │       ├── ChatWidget.jsx
│   │   │       └── MessageList.jsx
│   │   │
│   │   └── App.jsx
│   │
│   └── package.json
│
└── README.md (this file)
```

## 🎨 Key Features

### 1. Intelligent Compression Engine

Reduces token usage by 40-60%:
```python
# Before compression: 850 tokens
"The pricing job failed because the database connection timed out. 
 The database connection timeout occurred at 2:15 AM..."

# After compression: 320 tokens (62% saved)
"Pricing job failed at 2:15 AM due to database timeout."
```

### 2. Skills-Based Agents

Each agent has a `skills.md` file:
```markdown
# Pricing Agent Skills

## Core Capabilities
- Query pricing from PRICING_MASTER table
- Calculate mid-market prices
- Validate against circuit breakers

## Oracle Queries
```sql
SELECT price, status FROM pricing_master WHERE cusip = :cusip
```

## Business Rules
- Price change > 10% requires approval
- Stale prices flagged after 24 hours
```

### 3. Redis Caching

- **LLM responses** cached for 1 hour
- **Oracle queries** cached for 5 minutes
- **Workflow state** cached for 2 hours
- Automatic cache invalidation on updates

### 4. Drag-and-Drop Workflow Builder

Visual workflow creation with:
- Oracle Query nodes
- Unix Command nodes
- LLM Analysis nodes
- Conditional branching
- Parallel execution

## 🔧 Configuration

### Adding New Agent Skills

1. Create directory: `backend/app/skills/new_agent/`
2. Create `skills.md` with capabilities
3. Create `config.json` with settings
4. Create prompt templates in `prompts/`

Example `skills.md`:
```markdown
# New Agent Skills

## Core Capabilities
- Capability 1
- Capability 2

## Business Rules
- Rule 1
- Rule 2
```

### Updating Compression Settings

Edit `backend/app/config.py`:
```python
MAX_CONTEXT_TOKENS = 2000  # Max tokens after compression
COMPRESSION_TARGET_RATIO = 0.4  # Target 40% of original
```

### Configuring Cache TTLs

```python
CACHE_LLM_RESPONSE_TTL = 3600    # 1 hour
CACHE_ORACLE_QUERY_TTL = 300     # 5 minutes
CACHE_WORKFLOW_STATE_TTL = 7200  # 2 hours
```

## 📊 Monitoring

### Cache Statistics

```bash
curl http://localhost:8000/api/cache/stats
```

Response:
```json
{
  "hits": 1250,
  "misses": 85,
  "hit_rate": 0.936,
  "total_size": 12500000
}
```

### Compression Statistics

```bash
curl http://localhost:8000/api/intelligence/compression/stats
```

Response:
```json
{
  "total_compressions": 523,
  "total_tokens_saved": 125000,
  "average_ratio": 0.42,
  "average_savings_pct": 58.0
}
```

## 🐛 Troubleshooting

### Redis Connection Failed

```bash
# Check Redis is running
redis-cli ping
# Should return: PONG

# If not running, start it:
brew services start redis  # macOS
sudo systemctl start redis # Linux
```

### Oracle Connection Issues

```bash
# Test connection
python -c "import cx_Oracle; print(cx_Oracle.clientversion())"

# If fails, check ORACLE_HOME and LD_LIBRARY_PATH
export ORACLE_HOME=/path/to/instantclient
export LD_LIBRARY_PATH=$ORACLE_HOME:$LD_LIBRARY_PATH
```

### Frontend Not Loading

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

## 🚢 Next Steps

### For Production Deployment

1. **Docker Containerization**
   ```bash
   docker-compose up -d
   ```

2. **Security Hardening**
   - Use environment variables for secrets
   - Enable HTTPS/TLS
   - Add authentication middleware

3. **Monitoring & Logging**
   - Add APM (New Relic, Datadog)
   - Centralized logging (ELK stack)
   - Prometheus metrics

4. **Scalability**
   - Add load balancer
   - Horizontal scaling with K8s
   - Redis Cluster for HA

## 📝 License

Internal BofA Wealth Management POC

## 👥 Team

- **Backend:** Python/FastAPI team
- **Frontend:** React team
- **AI/ML:** LLM integration team
- **Operations:** Pricing Ops team

## 📧 Support

For issues or questions, contact:
- Pricing Ops Team: pricing-ops@bofa.com
- Tech Support: tech-support@bofa.com

---

**Last Updated:** December 17, 2025  
**Version:** 1.0.0
