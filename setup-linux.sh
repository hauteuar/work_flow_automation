#!/bin/bash
# Pricing Workflow POC - Linux Setup Script
# Supports Ubuntu/Debian and RHEL/CentOS

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Pricing Workflow POC - Linux Setup"
echo "=========================================="
echo ""

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo -e "${RED}Cannot detect OS${NC}"
    exit 1
fi

echo "Detected OS: $OS"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${YELLOW}Warning: Running as root. Consider using a regular user.${NC}"
fi

# Function to check command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Install system dependencies
echo "=========================================="
echo "Installing System Dependencies"
echo "=========================================="
echo ""

if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    echo "Installing for Ubuntu/Debian..."
    
    sudo apt update
    
    # Install Python 3.10+
    if ! command_exists python3.10; then
        echo "Installing Python 3.10..."
        sudo apt install -y python3.10 python3.10-venv python3-pip
    fi
    
    # Install Node.js
    if ! command_exists node; then
        echo "Installing Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt install -y nodejs
    fi
    
    # Install Redis
    if ! command_exists redis-server; then
        echo "Installing Redis..."
        sudo apt install -y redis-server
        sudo systemctl start redis-server
        sudo systemctl enable redis-server
    fi
    
    # Install build tools
    sudo apt install -y build-essential git curl

elif [ "$OS" = "rhel" ] || [ "$OS" = "centos" ] || [ "$OS" = "fedora" ]; then
    echo "Installing for RHEL/CentOS/Fedora..."
    
    sudo dnf update -y
    
    # Install Python 3.10+
    if ! command_exists python3.10; then
        echo "Installing Python 3.10..."
        sudo dnf install -y python3.10 python3-pip
    fi
    
    # Install Node.js
    if ! command_exists node; then
        echo "Installing Node.js..."
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo dnf install -y nodejs
    fi
    
    # Install Redis
    if ! command_exists redis-server; then
        echo "Installing Redis..."
        sudo dnf install -y redis
        sudo systemctl start redis
        sudo systemctl enable redis
    fi
    
    # Install build tools
    sudo dnf install -y gcc gcc-c++ make git curl

else
    echo -e "${RED}Unsupported OS: $OS${NC}"
    exit 1
fi

echo -e "${GREEN}✓ System dependencies installed${NC}"
echo ""

# Verify installations
echo "=========================================="
echo "Verifying Installations"
echo "=========================================="
echo ""

echo -n "Python: "
python3 --version || echo -e "${RED}FAILED${NC}"

echo -n "Node.js: "
node --version || echo -e "${RED}FAILED${NC}"

echo -n "npm: "
npm --version || echo -e "${RED}FAILED${NC}"

echo -n "Redis: "
redis-cli ping || echo -e "${RED}FAILED${NC}"

echo ""

# Setup Backend
echo "=========================================="
echo "Setting Up Backend"
echo "=========================================="
echo ""

cd backend

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
    echo -e "${GREEN}✓ Virtual environment created${NC}"
else
    echo -e "${YELLOW}Virtual environment already exists${NC}"
fi

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip -q

# Install Python packages
echo "Installing Python packages..."
pip install -r requirements.txt -q

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend packages installed${NC}"
else
    echo -e "${RED}✗ Backend package installation failed${NC}"
    exit 1
fi

# Verify critical packages
echo "Verifying critical packages..."
python -c "import fastapi; print('FastAPI:', fastapi.__version__)" || exit 1
python -c "import pydantic; print('Pydantic:', pydantic.__version__)" || exit 1

echo ""

# Create .env if doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cat > .env << 'EOF'
# API Settings
API_HOST=0.0.0.0
API_PORT=8000

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# LLM Server (update with your server)
LLM_API_URL=http://localhost:8080/generate
LLM_MODEL=llama-3-70b

# Oracle (update with your credentials)
ORACLE_HOST=localhost
ORACLE_PORT=1521
ORACLE_SERVICE=PRICING
ORACLE_USER=pricing_user
ORACLE_PASSWORD=change_me
EOF
    echo -e "${GREEN}✓ Created .env file${NC}"
    echo -e "${YELLOW}⚠ Please update .env with your credentials${NC}"
else
    echo -e "${YELLOW}.env file already exists${NC}"
fi

cd ..

# Setup Frontend
echo ""
echo "=========================================="
echo "Setting Up Frontend"
echo "=========================================="
echo ""

cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing Node packages..."
    npm install
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Frontend packages installed${NC}"
    else
        echo -e "${RED}✗ Frontend package installation failed${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}node_modules already exists${NC}"
fi

cd ..

# Create log directory
echo ""
echo "Creating log directory..."
sudo mkdir -p /var/log/pricing-workflow
sudo chown $(whoami):$(whoami) /var/log/pricing-workflow
echo -e "${GREEN}✓ Log directory created${NC}"

# Setup complete
echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "To start the application:"
echo ""
echo "  Option 1: Use start script"
echo "    ./start-linux.sh"
echo ""
echo "  Option 2: Manual start"
echo "    # Terminal 1 - Backend"
echo "    cd backend && source venv/bin/activate && python app/main.py"
echo ""
echo "    # Terminal 2 - Frontend"
echo "    cd frontend && npm run dev"
echo ""
echo "  Option 3: Production with PM2"
echo "    sudo npm install -g pm2"
echo "    pm2 start ecosystem.config.js"
echo ""
echo "Then open: http://localhost:5173"
echo ""
echo -e "${YELLOW}⚠ Don't forget to update backend/.env with your credentials${NC}"
echo ""
echo "For production deployment, see LINUX_SETUP.md"
echo ""
