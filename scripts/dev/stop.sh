#!/bin/bash

# CRM MVP Development Stop Script
echo "🛑 Stopping CRM MVP Development Environment..."

# Navigate to project root
cd "$(dirname "$0")/../.."

# Stop all services
docker-compose -f infra/docker/docker-compose.dev.yml down

echo "✅ Development environment stopped!"
echo ""
echo "💡 To remove volumes and clean up completely:"
echo "   docker-compose -f infra/docker/docker-compose.dev.yml down -v"
echo "   docker system prune -f"