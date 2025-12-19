# Linux Server Setup Guide

## 🐧 Complete Linux Deployment

This guide covers deployment on Ubuntu/RHEL/CentOS servers for production use.

---

## 📋 Prerequisites

### System Requirements
- **OS:** Ubuntu 20.04+, RHEL 8+, or CentOS 8+
- **RAM:** 4GB minimum, 8GB recommended
- **CPU:** 2 cores minimum, 4 cores recommended
- **Storage:** 10GB minimum

### Software Requirements
- Python 3.10+
- Node.js 18+
- Redis 6.0+
- Nginx (for production)
- PM2 or systemd (for process management)

---

## 🚀 Quick Setup (Development)

### Option 1: Automated Setup Script

```bash
# Make setup script executable
chmod +x setup-linux.sh

# Run setup (installs everything)
./setup-linux.sh

# Start services
./start-linux.sh
```

### Option 2: Manual Setup

```bash
# 1. Install system dependencies
sudo apt update
sudo apt install -y python3.10 python3.10-venv python3-pip nodejs npm redis-server

# 2. Backend setup
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 3. Frontend setup
cd ../frontend
npm install

# 4. Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# 5. Start services
# Terminal 1
cd backend && source venv/bin/activate && python app/main.py

# Terminal 2
cd frontend && npm run dev
```

---

## 🏭 Production Deployment

### 1. System Preparation

#### Ubuntu/Debian
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y \
    python3.10 \
    python3.10-venv \
    python3-pip \
    nodejs \
    npm \
    redis-server \
    nginx \
    git \
    curl \
    build-essential

# Install PM2 for process management
sudo npm install -g pm2
```

#### RHEL/CentOS
```bash
# Update system
sudo dnf update -y

# Install EPEL repository
sudo dnf install -y epel-release

# Install dependencies
sudo dnf install -y \
    python3.10 \
    python3-pip \
    nodejs \
    npm \
    redis \
    nginx \
    git \
    gcc \
    gcc-c++ \
    make

# Install PM2
sudo npm install -g pm2
```

### 2. Create Service User

```bash
# Create dedicated user
sudo useradd -m -s /bin/bash pricingapp
sudo usermod -aG sudo pricingapp

# Switch to service user
sudo su - pricingapp

# Create application directory
mkdir -p /home/pricingapp/pricing-workflow-poc
cd /home/pricingapp/pricing-workflow-poc
```

### 3. Deploy Application

```bash
# Extract application
tar -xzf pricing-workflow-poc-linux.tar.gz
cd pricing-workflow-poc

# Backend setup
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create production config
cat > .env << EOF
API_HOST=0.0.0.0
API_PORT=8000
REDIS_HOST=localhost
REDIS_PORT=6379
LLM_API_URL=http://your-llm-server:8080/generate
ORACLE_HOST=your-oracle-server
ORACLE_PORT=1521
ORACLE_SERVICE=PRICING
ORACLE_USER=pricing_user
ORACLE_PASSWORD=${ORACLE_PASSWORD}
EOF

# Frontend setup
cd ../frontend
npm install
npm run build  # Creates production build
```

### 4. Configure Redis

```bash
# Edit Redis config
sudo nano /etc/redis/redis.conf

# Update these settings:
# bind 127.0.0.1  # Only local connections
# requirepass your_redis_password  # Set password
# maxmemory 2gb  # Set memory limit
# maxmemory-policy allkeys-lru  # Eviction policy

# Restart Redis
sudo systemctl restart redis-server
sudo systemctl enable redis-server

# Verify Redis
redis-cli ping
# Should return: PONG
```

### 5. Setup PM2 Process Manager

```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'pricing-backend',
      cwd: '/home/pricingapp/pricing-workflow-poc/backend',
      script: 'venv/bin/python',
      args: 'app/main.py',
      interpreter: 'none',
      env: {
        PYTHONPATH: '/home/pricingapp/pricing-workflow-poc/backend'
      },
      instances: 2,
      exec_mode: 'cluster',
      max_memory_restart: '1G',
      error_file: '/var/log/pricing-backend-error.log',
      out_file: '/var/log/pricing-backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'pricing-frontend',
      cwd: '/home/pricingapp/pricing-workflow-poc/frontend',
      script: 'npm',
      args: 'run preview -- --port 5173 --host 0.0.0.0',
      instances: 1,
      error_file: '/var/log/pricing-frontend-error.log',
      out_file: '/var/log/pricing-frontend-out.log'
    }
  ]
};
EOF

# Start applications with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd
# Run the command it outputs

# Verify services
pm2 status
pm2 logs
```

### 6. Configure Nginx Reverse Proxy

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/pricing-workflow

# Add this configuration:
cat << 'EOF' | sudo tee /etc/nginx/sites-available/pricing-workflow
server {
    listen 80;
    server_name your-domain.com;  # Change this

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts for long-running operations
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:8000/health;
        access_log off;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/pricing-workflow-access.log;
    error_log /var/log/nginx/pricing-workflow-error.log;
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/pricing-workflow /etc/nginx/sites-enabled/

# Test Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 7. Setup SSL with Let's Encrypt (Optional)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
sudo certbot renew --dry-run
```

### 8. Configure Firewall

```bash
# UFW (Ubuntu)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable

# Firewalld (RHEL/CentOS)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --reload
```

---

## 🔒 Security Hardening

### 1. Environment Variables

```bash
# Never commit .env files
# Use environment-specific configs

# Production
export ORACLE_PASSWORD='secure_password'
export REDIS_PASSWORD='secure_redis_password'
export SECRET_KEY='your-secret-key-here'
```

### 2. File Permissions

```bash
# Set proper permissions
chmod 600 backend/.env
chmod 755 backend/app
chmod 644 backend/app/*.py

# Restrict log access
sudo chmod 640 /var/log/pricing-*.log
sudo chown pricingapp:pricingapp /var/log/pricing-*.log
```

### 3. SELinux (RHEL/CentOS)

```bash
# If SELinux is enforcing
sudo semanage port -a -t http_port_t -p tcp 8000
sudo semanage port -a -t http_port_t -p tcp 5173

# Or disable SELinux (not recommended)
# sudo setenforce 0
```

---

## 📊 Monitoring & Logging

### 1. System Monitoring

```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Monitor processes
pm2 monit

# Check logs
pm2 logs pricing-backend
pm2 logs pricing-frontend

# System metrics
htop
```

### 2. Application Logs

```bash
# View logs
tail -f /var/log/pricing-backend-out.log
tail -f /var/log/pricing-backend-error.log

# Nginx logs
tail -f /var/log/nginx/pricing-workflow-access.log
tail -f /var/log/nginx/pricing-workflow-error.log

# Redis logs
sudo tail -f /var/log/redis/redis-server.log
```

### 3. Log Rotation

```bash
# Create logrotate config
sudo nano /etc/logrotate.d/pricing-workflow

# Add:
/var/log/pricing-*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    missingok
    postrotate
        pm2 reloadLogs
    endscript
}

# Test logrotate
sudo logrotate -f /etc/logrotate.d/pricing-workflow
```

---

## 🔄 Maintenance Operations

### Restart Services

```bash
# Restart backend only
pm2 restart pricing-backend

# Restart frontend only
pm2 restart pricing-frontend

# Restart all
pm2 restart all

# Reload without downtime
pm2 reload all
```

### Update Application

```bash
# Stop services
pm2 stop all

# Pull latest code (if using git)
cd /home/pricingapp/pricing-workflow-poc
git pull origin main

# Update backend
cd backend
source venv/bin/activate
pip install -r requirements.txt --upgrade

# Update frontend
cd ../frontend
npm install
npm run build

# Restart services
pm2 restart all
```

### Database Backup (if applicable)

```bash
# Backup Redis data
redis-cli --rdb /backup/redis-backup-$(date +%Y%m%d).rdb

# Or use save command
redis-cli SAVE
cp /var/lib/redis/dump.rdb /backup/
```

---

## 🐛 Troubleshooting

### Service Not Starting

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs --err

# Check ports
sudo netstat -tulpn | grep -E '8000|5173'

# Kill processes on ports
sudo kill -9 $(sudo lsof -t -i:8000)
```

### Redis Connection Issues

```bash
# Check Redis status
sudo systemctl status redis-server

# Test connection
redis-cli ping

# Check Redis logs
sudo tail -f /var/log/redis/redis-server.log
```

### Nginx Issues

```bash
# Test config
sudo nginx -t

# Check status
sudo systemctl status nginx

# Restart
sudo systemctl restart nginx

# Check logs
sudo tail -f /var/log/nginx/error.log
```

### Permission Issues

```bash
# Fix ownership
sudo chown -R pricingapp:pricingapp /home/pricingapp/pricing-workflow-poc

# Fix permissions
chmod 755 /home/pricingapp/pricing-workflow-poc
chmod 600 /home/pricingapp/pricing-workflow-poc/backend/.env
```

---

## 📈 Performance Tuning

### 1. Redis Optimization

```bash
# Edit /etc/redis/redis.conf
maxmemory 4gb
maxmemory-policy allkeys-lru
tcp-backlog 511
timeout 300

# Restart Redis
sudo systemctl restart redis-server
```

### 2. PM2 Cluster Mode

```bash
# Use all CPU cores
pm2 start ecosystem.config.js -i max

# Or specific number
pm2 scale pricing-backend 4
```

### 3. Nginx Caching

```nginx
# Add to nginx config
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m;

location /api/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_key "$request_uri";
    add_header X-Cache-Status $upstream_cache_status;
    # ... rest of proxy config
}
```

---

## 🔐 Backup Strategy

### Daily Backups

```bash
# Create backup script
cat > /home/pricingapp/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=/backup/pricing-workflow
DATE=$(date +%Y%m%d)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup application
tar -czf $BACKUP_DIR/app-$DATE.tar.gz /home/pricingapp/pricing-workflow-poc

# Backup Redis
redis-cli SAVE
cp /var/lib/redis/dump.rdb $BACKUP_DIR/redis-$DATE.rdb

# Backup logs
tar -czf $BACKUP_DIR/logs-$DATE.tar.gz /var/log/pricing-*.log

# Keep only last 7 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.rdb" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /home/pricingapp/backup.sh

# Add to crontab (runs daily at 2 AM)
crontab -e
# Add: 0 2 * * * /home/pricingapp/backup.sh >> /var/log/backup.log 2>&1
```

---

## 📋 Health Checks

```bash
# Create health check script
cat > /home/pricingapp/healthcheck.sh << 'EOF'
#!/bin/bash

# Check backend
BACKEND=$(curl -s http://localhost:8000/health | jq -r '.status')
if [ "$BACKEND" != "healthy" ]; then
    echo "Backend unhealthy, restarting..."
    pm2 restart pricing-backend
fi

# Check frontend
FRONTEND=$(curl -s http://localhost:5173/ | head -n 1)
if [ -z "$FRONTEND" ]; then
    echo "Frontend down, restarting..."
    pm2 restart pricing-frontend
fi

# Check Redis
REDIS=$(redis-cli ping)
if [ "$REDIS" != "PONG" ]; then
    echo "Redis down, restarting..."
    sudo systemctl restart redis-server
fi
EOF

chmod +x /home/pricingapp/healthcheck.sh

# Add to crontab (runs every 5 minutes)
# */5 * * * * /home/pricingapp/healthcheck.sh >> /var/log/healthcheck.log 2>&1
```

---

## 📊 Monitoring Dashboard (Optional)

### Install Prometheus + Grafana

```bash
# Install Prometheus
wget https://github.com/prometheus/prometheus/releases/download/v2.45.0/prometheus-2.45.0.linux-amd64.tar.gz
tar -xzf prometheus-2.45.0.linux-amd64.tar.gz
sudo mv prometheus-2.45.0.linux-amd64 /opt/prometheus

# Install Grafana
sudo apt install -y software-properties-common
sudo add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"
wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -
sudo apt update
sudo apt install grafana

# Start services
sudo systemctl start prometheus
sudo systemctl start grafana-server
sudo systemctl enable grafana-server
```

---

## ✅ Production Checklist

Before going live:

- [ ] All services start automatically on boot
- [ ] SSL certificate configured and auto-renewal works
- [ ] Firewall configured properly
- [ ] Backups configured and tested
- [ ] Monitoring and alerting setup
- [ ] Log rotation configured
- [ ] Health checks running
- [ ] Security hardening applied
- [ ] Load testing completed
- [ ] Documentation updated

---

## 🎉 You're Production Ready!

Access your application:
- **HTTP:** http://your-domain.com
- **HTTPS:** https://your-domain.com
- **API:** https://your-domain.com/api/
- **Health:** https://your-domain.com/health

Questions? Check README.md or contact support.
