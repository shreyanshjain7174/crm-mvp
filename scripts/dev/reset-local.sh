#!/bin/bash

# Reset Local Development Environment
set -e

echo "🔄 Resetting local development environment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Stop all containers
echo -e "${YELLOW}🛑 Stopping all containers...${NC}"
docker-compose -f docker-compose.dev.yml down --remove-orphans

# Remove volumes (this will delete all data!)
read -p "⚠️  This will delete all local database data. Continue? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🗑️  Removing volumes...${NC}"
    docker-compose -f docker-compose.dev.yml down -v
    docker volume prune -f
    echo -e "${GREEN}✅ Volumes removed${NC}"
else
    echo -e "${YELLOW}⏭️  Skipping volume removal${NC}"
fi

# Remove any orphaned containers
echo -e "${YELLOW}🧹 Cleaning up...${NC}"
docker container prune -f
docker image prune -f

# Rebuild everything
echo -e "${YELLOW}🏗️  Rebuilding development environment...${NC}"
docker-compose -f docker-compose.dev.yml build --no-cache

echo -e "${GREEN}✅ Local environment reset complete!${NC}"
echo -e "${YELLOW}💡 Run './scripts/dev/setup-local.sh' to start fresh${NC}"