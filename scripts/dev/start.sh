#!/bin/bash

# CRM MVP Development Environment - One-Click Start
set -e

echo "🚀 Starting CRM MVP Development Environment..."

# Navigate to project root
cd "$(dirname "$0")/../.."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to check if a process is running on a port
check_port() {
    local port=$1
    if lsof -ti:$port >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Check if Docker is running
echo -e "${BLUE}🔍 Checking system requirements...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}"

# Step 1: Setup environment files if needed
echo -e "${BLUE}📁 Checking environment configuration...${NC}"
setup_needed=false

if [ ! -f "apps/frontend/.env.local" ]; then
    echo -e "${YELLOW}⚙️  Creating frontend environment configuration...${NC}"
    cat > apps/frontend/.env.local << 'EOF'
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_AI_EMPLOYEES_ENABLED=true
NEXT_PUBLIC_ENVIRONMENT=development
EOF
    setup_needed=true
fi

if [ ! -f "apps/backend/.env" ]; then
    echo -e "${YELLOW}⚙️  Creating backend environment configuration...${NC}"
    cat > apps/backend/.env << 'EOF'
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://crm_dev_user:dev_password@localhost:5432/crm_dev_db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crm_dev_db
DB_USER=crm_dev_user
DB_PASSWORD=dev_password
JWT_SECRET=dev-jwt-secret-key-123
REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=debug
EOF
    setup_needed=true
fi

if [ "$setup_needed" = true ]; then
    echo -e "${GREEN}✅ Environment configuration created${NC}"
else
    echo -e "${GREEN}✅ Environment configuration already exists${NC}"
fi

# Step 2: Install dependencies if needed
echo -e "${BLUE}📦 Checking dependencies...${NC}"
deps_needed=false

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing root dependencies...${NC}"
    npm install --silent
    deps_needed=true
fi

if [ ! -d "apps/frontend/node_modules" ]; then
    echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
    cd apps/frontend && npm install --silent && cd ../..
    deps_needed=true
fi

if [ ! -d "apps/backend/node_modules" ]; then
    echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
    cd apps/backend && npm install --silent && cd ../..
    deps_needed=true
fi

if [ "$deps_needed" = true ]; then
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi

# Step 3: Start database and Redis services
echo -e "${BLUE}🐘 Starting database and cache services...${NC}"
docker-compose -f infra/docker/docker-compose.dev.yml up -d db redis >/dev/null 2>&1

# Wait for database to be ready
echo -e "${YELLOW}⏳ Waiting for database connection...${NC}"
for i in {1..15}; do
    if docker-compose -f infra/docker/docker-compose.dev.yml exec -T db pg_isready -U crm_dev_user -d crm_dev_db >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Database is ready${NC}"
        break
    fi
    if [ $i -eq 15 ]; then
        echo -e "${RED}❌ Database failed to start${NC}"
        exit 1
    fi
    sleep 2
done

# Step 4: Start applications
echo -e "${BLUE}🌐 Starting applications...${NC}"

# Check if ports are already in use
if check_port 3000; then
    echo -e "${YELLOW}⚠️  Port 3000 already in use (frontend may already be running)${NC}"
fi

if check_port 3001; then
    echo -e "${YELLOW}⚠️  Port 3001 already in use (backend may already be running)${NC}"
fi

# Start backend
echo -e "${YELLOW}🔧 Starting backend server...${NC}"
cd apps/backend
npm run dev > ../../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ../..

# Wait a moment for backend to start
sleep 3

# Start frontend
echo -e "${YELLOW}🎨 Starting frontend server...${NC}"
cd apps/frontend
npm run dev > ../../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ../..

# Create logs directory if it doesn't exist
mkdir -p logs

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 5

# Check if services are running
if check_port 3001; then
    echo -e "${GREEN}✅ Backend server is running${NC}"
else
    echo -e "${RED}❌ Backend server failed to start${NC}"
fi

if check_port 3000; then
    echo -e "${GREEN}✅ Frontend server is running${NC}"
else
    echo -e "${RED}❌ Frontend server failed to start${NC}"
fi

echo ""
echo -e "${GREEN}🎉 CRM MVP Development Environment is fully ready!${NC}"
echo ""
echo -e "${BLUE}📊 Your application is available at:${NC}"
echo "   🌐 Frontend:  http://localhost:3000"
echo "   🔧 Backend:   http://localhost:3001"
echo "   🐘 Database:  localhost:5432"
echo ""
echo -e "${YELLOW}📋 Useful commands:${NC}"
echo "   📊 View logs:     tail -f logs/frontend.log logs/backend.log"
echo "   🛑 Stop all:      ./scripts/dev/stop.sh"
echo "   🔄 Restart:       ./scripts/dev/restart.sh"
echo ""
echo -e "${GREEN}Press Ctrl+C to stop all services${NC}"

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping all services...${NC}"
    
    # Kill application processes
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    
    # Stop Docker services
    docker-compose -f infra/docker/docker-compose.dev.yml down >/dev/null 2>&1 || true
    
    echo -e "${GREEN}✅ All services stopped${NC}"
    exit 0
}

# Set up signal handling
trap cleanup INT TERM

# Wait for user to stop
wait