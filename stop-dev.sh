#!/bin/bash

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_ai_status() {
    echo -e "${PURPLE}[AI]${NC} $1"
}

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║               🛑 STOPPING CRM DEVELOPMENT                   ║"
echo "║                   Shutting down services...                 ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Use Docker compose
if command -v docker &> /dev/null; then
    COMPOSE_CMD="docker compose"
    print_status "🐳 Using Docker"
else
    echo -e "${RED}❌ Docker is not available${NC}"
    echo "Please install Docker Desktop: https://www.docker.com/products/docker-desktop/"
    exit 1
fi

# Stop platform development services
print_status "🛑 Stopping platform development environment..."
$COMPOSE_CMD -f docker-compose.dev.yml down --remove-orphans
print_success "✅ Platform services stopped"

echo -e "\n${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                   ✅ SHUTDOWN COMPLETE ✅                    ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"

print_success "💾 Data volumes preserved for next startup"

echo -e "\n${CYAN}🚀 To restart:${NC}"
echo -e "   Platform development: ${YELLOW}./start-dev.sh${NC}"

echo -e "\n${YELLOW}🗑️ To completely clean up (including volumes):${NC}"
echo -e "   ${YELLOW}$COMPOSE_CMD -f docker-compose.dev.yml down -v${NC}"