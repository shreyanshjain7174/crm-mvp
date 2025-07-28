#!/bin/bash

# Local Development Setup Script
set -e

echo "🚀 Setting up CRM MVP for local development..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop first.${NC}"
    exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  .env.local not found. Creating from example...${NC}"
    cp .env.local.example .env.local
    echo -e "${GREEN}✅ Created .env.local from example${NC}"
    echo -e "${YELLOW}📝 Please review and update .env.local with your configuration${NC}"
fi

# Stop any existing containers
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
docker-compose -f docker-compose.dev.yml down --remove-orphans 2>/dev/null || true

# Build and start development environment
echo -e "${YELLOW}🏗️  Building development environment...${NC}"
docker-compose -f docker-compose.dev.yml up --build -d

# Wait for database to be ready
echo -e "${YELLOW}⏳ Waiting for database to be ready...${NC}"
timeout 60 bash -c 'until docker-compose -f docker-compose.dev.yml exec -T postgres pg_isready -U crm_user -d crm_dev; do sleep 2; done'

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database is ready!${NC}"
else
    echo -e "${RED}❌ Database failed to start within 60 seconds${NC}"
    exit 1
fi

# Install frontend dependencies if needed
if [ ! -d "apps/frontend/node_modules" ]; then
    echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
    cd apps/frontend && npm install --legacy-peer-deps && cd ../..
fi

echo -e "${GREEN}🎉 Local development environment is ready!${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Update .env.local with your API keys (optional)"
echo "2. Start frontend: npm run dev:frontend"
echo "3. Check backend logs: docker-compose -f docker-compose.dev.yml logs -f backend-dev"
echo ""
echo -e "${GREEN}🌐 Your application will be available at:${NC}"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo "   Database: localhost:5432 (crm_dev/crm_user)"
echo ""
echo -e "${YELLOW}🔧 Useful commands:${NC}"
echo "   Stop: docker-compose -f docker-compose.dev.yml down"
echo "   Logs: docker-compose -f docker-compose.dev.yml logs -f"
echo "   Reset: ./scripts/dev/reset-local.sh"