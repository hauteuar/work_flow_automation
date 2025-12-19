# Quick Start Guide

## Prerequisites

- Docker & Docker Compose installed
- Access to Oracle database (connection details)
- SSH access to Unix pricing servers
- LLM API endpoint running (your GPU server)

## Installation (5 minutes)

### 1. Clone/Extract the POC
```bash
cd pricing-workflow-poc
```

### 2. Configure Environment
```bash
cp .env.example .env
nano .env  # Edit with your credentials
```

**Required changes in .env:**
```bash
# Oracle
ORACLE_HOST=your-oracle-host.com
ORACLE_USER=your_user
ORACLE_PASSWORD=your_password

# Unix Server
PRICING_SERVER_HOST=your-unix-host.com
PRICING_SERVER_USER=your_user
PRICING_SERVER_KEY_PATH=/path/to/your/key

# LLM API
LLM_API_URL=http://your-gpu-server:8080
```

### 3. Start Services
```bash
docker-compose up -d
```

### 4. Verify Everything is Running
```bash
# Check containers
docker-compose ps

# Check backend health
curl http://localhost:8000/health

# Check logs
docker-compose logs -f backend
```

### 5. Access the Application
- **Frontend:** http://localhost:3000
- **API Docs:** http://localhost:8000/docs
- **Health Check:** http://localhost:8000/health

## First Test

### Option 1: Via Web UI
1. Open http://localhost:3000
2. Type: "Did we receive the Bloomberg file today?"
3. Watch the workflow execute!

### Option 2: Via API
```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Did we receive the Bloomberg file today?"
  }'
```

## Example Queries to Try

1. **File Inquiry:**
   - "Did we receive the Bloomberg file today?"
   - "Check if ICE 2PM file arrived"
   - "Show me today's file processing status"

2. **CUSIP Investigation:**
   - "Why is CUSIP 912828ZG8 not priced?"
   - "Check pricing for CUSIP 912828ZG8"
   - "Is CUSIP 912828ZG8 priced today?"

3. **Rejection Analysis:**
   - "How many rejections today?"
   - "Analyze today's pricing rejections"
   - "Why so many Bloomberg rejections?"

4. **File Processing:**
   - "The ICE file is missing, investigate"
   - "Why didn't the Bloomberg file process?"
   - "Pricing job failed, what happened?"

5. **Reports:**
   - "Give me today's pricing summary"
   - "EOD report"
   - "How did pricing go today?"

## Troubleshooting

### Backend won't start
```bash
# Check logs
docker-compose logs backend

# Common issues:
# 1. Oracle connection - verify ORACLE_HOST, credentials
# 2. SSH connection - verify PRICING_SERVER_HOST, key file
# 3. LLM API - verify LLM_API_URL is accessible
```

### Oracle connection fails
```bash
# Test Oracle connectivity
docker-compose exec backend python -c "
import oracledb
conn = oracledb.connect(user='USER', password='PASS', dsn='HOST:1521/SERVICE')
print('Connected!')
"
```

### SSH connection fails
```bash
# Test SSH connectivity
docker-compose exec backend python -c "
import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('HOST', username='USER', key_filename='/path/to/key')
print('Connected!')
"
```

### LLM API not responding
```bash
# Test LLM API
curl -X POST http://your-gpu-server:8080/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello", "max_tokens": 10}'
```

## Development Mode

### Run Backend Locally (without Docker)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Run Frontend Locally (without Docker)
```bash
cd frontend
npm install
npm run dev
```

### Test Individual MCP Servers
```bash
cd backend
python -m app.mcp_servers.oracle_mcp  # Test Oracle MCP
python -m app.mcp_servers.unix_mcp    # Test Unix MCP
```

## Configuration Tips

### Adjusting LLM Parameters
In `.env`:
```bash
LLM_TEMPERATURE=0.1  # Lower = more deterministic
LLM_MAX_TOKENS=2048  # Increase for longer responses
LLM_TIMEOUT=120      # Increase if LLM is slow
```

### Performance Tuning
In `.env`:
```bash
ORACLE_POOL_MAX=20           # Increase for more concurrent queries
WORKFLOW_TIMEOUT=600         # Increase for complex workflows
MAX_CONCURRENT_WORKFLOWS=20  # Increase for more parallelism
```

### Adding Custom Skills
1. Create new .md file in `skills/` directory
2. Restart backend: `docker-compose restart backend`
3. LLM will automatically use new context

## Next Steps

1. **Test with real data:** Update demo queries with actual CUSIPs and dates
2. **Add more workflows:** See `skills/workflow_patterns.md` for templates
3. **Integrate with Slack/Teams:** Use API endpoints
4. **Add monitoring:** Set up Prometheus/Grafana
5. **Deploy to staging:** Update docker-compose for staging env

## Support

- **Logs:** `docker-compose logs -f`
- **Shell Access:** `docker-compose exec backend bash`
- **Database Queries:** Check `skills/oracle_schema.md`
- **File Paths:** Check `skills/unix_paths.md`

## Clean Up

```bash
# Stop services
docker-compose down

# Remove volumes (careful - deletes Redis data)
docker-compose down -v

# Remove everything
docker-compose down -v --rmi all
```
