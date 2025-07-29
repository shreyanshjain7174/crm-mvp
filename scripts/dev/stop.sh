#!/bin/bash

# CRM MVP Development Environment - Stop All Services
echo "🛑 Stopping CRM MVP Development Environment..."

# Navigate to project root
cd "$(dirname "$0")/../.."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Kill processes on ports 3000 and 3001
echo -e "${YELLOW}🔧 Stopping application servers...${NC}"

# Kill frontend (port 3000)
if lsof -ti:3000 >/dev/null 2>&1; then
    kill -9 $(lsof -ti:3000) 2>/dev/null || true
    echo "✅ Frontend server stopped"
fi

# Kill backend (port 3001)  
if lsof -ti:3001 >/dev/null 2>&1; then
    kill -9 $(lsof -ti:3001) 2>/dev/null || true
    echo "✅ Backend server stopped"
fi

# Stop Docker services
echo -e "${YELLOW}🐘 Stopping database and cache services...${NC}"
docker-compose -f docker-compose.dev.yml down >/dev/null 2>&1 || true
echo "✅ Database and Redis stopped"

echo ""
echo -e "${GREEN}🎉 All services stopped successfully!${NC}"
echo ""
echo -e "${YELLOW}To start again: ./scripts/dev/start.sh${NC}"