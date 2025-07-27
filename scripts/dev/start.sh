#!/bin/bash

# CRM MVP Development Start Script
echo "🚀 Starting CRM MVP Development Environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Navigate to project root
cd "$(dirname "$0")/../.."

# Create data directories if they don't exist
mkdir -p data/postgres data/redis logs

# Start all services
echo "📦 Starting all services with Docker Compose..."
docker-compose -f infra/docker/docker-compose.dev.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo "🔍 Checking service status..."
docker-compose -f infra/docker/docker-compose.dev.yml ps

echo "✅ Development environment is ready!"
echo ""
echo "📊 Service URLs:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:3001"
echo "   Nginx:     http://localhost:8080"
echo "   Database:  postgresql://localhost:5432/crm_dev_db"
echo ""
echo "📋 Useful commands:"
echo "   View logs:    docker-compose -f infra/docker/docker-compose.dev.yml logs -f"
echo "   Stop all:     ./scripts/dev/stop.sh"
echo "   Restart:      ./scripts/dev/restart.sh"