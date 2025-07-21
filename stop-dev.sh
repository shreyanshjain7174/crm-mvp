#!/bin/bash

echo "🛑 Stopping CRM MVP Development Environment..."

# Use Docker compose
if command -v docker &> /dev/null; then
    COMPOSE_CMD="docker compose"
    echo "🐳 Using Docker"
else
    echo "❌ Docker is not available"
    echo "Please install Docker Desktop: https://www.docker.com/products/docker-desktop/"
    exit 1
fi

# Stop all containers and remove networks
$COMPOSE_CMD -f docker-compose.dev.yml down --remove-orphans

echo "✅ Development environment stopped"
echo "💾 Data volumes preserved for next startup"
echo ""
echo "To completely clean up (including volumes): $COMPOSE_CMD -f docker-compose.dev.yml down -v"