#!/bin/bash

echo "🛑 Stopping CRM MVP Development Environment..."

# Detect container runtime
COMPOSE_CMD=""

if command -v podman &> /dev/null; then
    if command -v podman-compose &> /dev/null; then
        COMPOSE_CMD="podman-compose"
    else
        COMPOSE_CMD="docker-compose"
        export DOCKER_HOST="unix:///tmp/podman.sock"
    fi
    echo "🐳 Using Podman"
elif command -v docker &> /dev/null; then
    COMPOSE_CMD="docker compose"
    echo "🐳 Using Docker"
else
    echo "❌ No container runtime found"
    exit 1
fi

# Stop all containers and remove networks
$COMPOSE_CMD -f docker-compose.dev.yml down --remove-orphans

echo "✅ Development environment stopped"
echo "💾 Data volumes preserved for next startup"
echo ""
echo "To completely clean up (including volumes): $COMPOSE_CMD -f docker-compose.dev.yml down -v"