# Linux Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Prerequisites Check
```bash
# Check Python (need 3.10+)
python3 --version

# Check Node.js (need 18+)
node --version

# Check Redis
redis-cli ping
```

---

## ⚡ Option 1: Automated Setup (Recommended)

```bash
# Extract archive
tar -xzf pricing-workflow-poc-linux.tar.gz
cd pricing-workflow-poc

# Make scripts executable
chmod +x *.sh

# Run automated setup (installs everything)
./setup-linux.sh

# Start all services
./start-linux.sh

# Open browser
firefox http://localhost:5173
```

**That's it!** ✅

---

## 🔧 Option 2: Manual Setup

```bash
# 1. Install system dependencies
sudo apt update
sudo apt install -y python3.10 python3.10-venv python3-pip nodejs npm redis-server

# 2. Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# 3. Backend setup
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
API_HOST=0.0.0.0
API_PORT=8000
REDIS_HOST=localhost
REDIS_PORT=6379
LLM_API_URL=http://your-llm-server:8080/generate
EOF

# 4. Frontend setup
cd ../frontend
npm install

# 5. Start services
# Terminal 1
cd backend && source venv/bin/activate && python app/main.py

# Terminal 2
cd frontend && npm run dev
```

---

## ✅ Verify It's Working

### Test 1: Backend Health
```bash
curl http://localhost:8000/health
# Should return: {"status":"healthy"}
```

### Test 2: List Agents
```bash
curl http://localhost:8000/api/agents
# Should return list of agents
```

### Test 3: Test Compression
```bash
curl -X POST "http://localhost:8000/api/test/compress" \
  -H "Content-Type: application/json" \
  -d '{"text":"The pricing job failed because of timeout. The timeout was caused by network issues.","max_tokens":100}'
```

### Test 4: Frontend
```bash
# Open browser
firefox http://localhost:5173
# or
google-chrome http://localhost:5173
```

---

## 🔄 Common Commands

### Start Services
```bash
./start-linux.sh
```

### Stop Services
```bash
./stop-linux.sh
```

### View Logs
```bash
tail -f logs/backend.log
tail -f logs/frontend.log
```

### Restart Redis
```bash
sudo systemctl restart redis-server
```

### Check Service Status
```bash
ps aux | grep "python app/main.py"
ps aux | grep "npm run dev"
```

---

## 🏭 Production Deployment

### Option 1: PM2 (Recommended)
```bash
# Install PM2
sudo npm install -g pm2

# Start with PM2
pm2 start ecosystem.config.js

# Save configuration
pm2 save

# Setup startup script
pm2 startup systemd
# Run the command it outputs

# Monitor
pm2 monit
pm2 logs
```

### Option 2: Systemd Services
```bash
# See systemd-services.txt for full instructions

# Copy service files
sudo cp pricing-backend.service /etc/systemd/system/
sudo cp pricing-frontend.service /etc/systemd/system/

# Start services
sudo systemctl start pricing-backend
sudo systemctl start pricing-frontend

# Enable on boot
sudo systemctl enable pricing-backend
sudo systemctl enable pricing-frontend
```

### Option 3: Nginx Reverse Proxy
```bash
# See LINUX_SETUP.md for full Nginx configuration

# Basic nginx config
sudo nano /etc/nginx/sites-available/pricing-workflow

# Enable site
sudo ln -s /etc/nginx/sites-available/pricing-workflow /etc/nginx/sites-enabled/

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🐛 Troubleshooting

### Redis Not Running
```bash
sudo systemctl start redis-server
redis-cli ping  # Should return PONG
```

### Port Already in Use
```bash
# Check what's using port 8000
sudo lsof -i :8000

# Kill process
sudo kill -9 $(sudo lsof -t -i:8000)
```

### Backend Won't Start
```bash
# Check Python environment
cd backend
source venv/bin/activate
python --version  # Should be 3.10+

# Check installed packages
pip list | grep fastapi
pip list | grep pydantic

# Reinstall if needed
pip install -r requirements.txt --force-reinstall
```

### Frontend Won't Start
```bash
cd frontend

# Clear and reinstall
rm -rf node_modules package-lock.json
npm install

# Try different port
npm run dev -- --port 3000
```

### Permission Denied
```bash
# Make scripts executable
chmod +x *.sh

# Fix ownership
sudo chown -R $USER:$USER .
```

---

## 📊 Monitoring

### Check All Services
```bash
# Backend
curl http://localhost:8000/health

# Frontend
curl http://localhost:5173/

# Redis
redis-cli ping
```

### View Resource Usage
```bash
# Install htop
sudo apt install htop

# Monitor
htop
```

### Check Logs
```bash
# Backend logs
tail -f logs/backend.log

# Frontend logs
tail -f logs/frontend.log

# System logs (if using systemd)
sudo journalctl -u pricing-backend -f
sudo journalctl -u pricing-frontend -f
```

---

## 🔐 Security Checklist

Before production:

- [ ] Update .env with secure credentials
- [ ] Set Redis password
- [ ] Configure firewall (ufw/firewalld)
- [ ] Enable SSL with Let's Encrypt
- [ ] Set up log rotation
- [ ] Configure backups
- [ ] Restrict file permissions (chmod 600 .env)
- [ ] Run as non-root user

---

## 📚 Documentation

- **LINUX_SETUP.md** - Complete production deployment guide
- **README.md** - Full project documentation
- **DEMO_GUIDE.md** - Demo walkthrough
- **PROJECT_SUMMARY.md** - Architecture overview

---

## 🎯 Quick Commands Reference

```bash
# Setup
./setup-linux.sh

# Start (development)
./start-linux.sh

# Start (production with PM2)
pm2 start ecosystem.config.js

# Stop
./stop-linux.sh
# or
pm2 stop all

# Restart
pm2 restart all

# Logs
tail -f logs/*.log
pm2 logs

# Status
pm2 status
systemctl status pricing-backend
```

---

## ✨ You're Ready!

Access your application:
- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **Health:** http://localhost:8000/health

Happy deploying! 🚀
