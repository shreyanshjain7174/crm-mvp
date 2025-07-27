#!/bin/bash

# 🚀 CRM MVP Production Deployment Script
# Deploys the entire stack using production Docker Compose

set -e  # Exit on error

echo "🚀 Starting CRM MVP Production Deployment..."

# Navigate to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check environment file
if [ ! -f ".env.production" ]; then
    echo "⚠️  Production environment file not found!"
    echo "Creating from template..."
    if [ -f ".env.example" ]; then
        cp .env.example .env.production
        echo "📝 Please edit .env.production with your production values"
        echo "   nano .env.production"
        exit 1
    else
        echo "❌ No .env.example found. Please create .env.production manually."
        exit 1
    fi
fi

# Source environment variables
export $(cat .env.production | grep -v '^#' | xargs)

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p data/postgres data/redis logs

# Pull latest changes (optional - comment out if deploying from local)
# echo "📥 Pulling latest changes from git..."
# git pull origin main

# Build production images
echo "🔨 Building production images..."
docker-compose -f infra/docker/docker-compose.yml build --no-cache

# Stop any existing services
echo "🛑 Stopping existing services..."
docker-compose -f infra/docker/docker-compose.yml down

# Start production services
echo "🚀 Starting production services..."
docker-compose -f infra/docker/docker-compose.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
RETRIES=30
while [ $RETRIES -gt 0 ]; do
    if docker-compose -f infra/docker/docker-compose.yml ps | grep -q "unhealthy\|starting"; then
        echo "   Waiting for services... ($RETRIES retries left)"
        sleep 5
        RETRIES=$((RETRIES-1))
    else
        break
    fi
done

# Check service health
echo ""
echo "🔍 Service Status:"
docker-compose -f infra/docker/docker-compose.yml ps

# Verify services are accessible
echo ""
echo "🌐 Verifying service endpoints..."

# Check backend health
if curl -f -s http://localhost:3001/health > /dev/null; then
    echo "✅ Backend API is healthy"
else
    echo "❌ Backend API health check failed"
fi

# Check frontend
if curl -f -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend is accessible"
else
    echo "❌ Frontend is not accessible"
fi

# Check nginx proxy
if curl -f -s http://localhost:8080 > /dev/null; then
    echo "✅ Nginx proxy is working"
else
    echo "❌ Nginx proxy is not working"
fi

echo ""
echo "🎉 Production deployment complete!"
echo ""
echo "📊 Service URLs:"
echo "   Main App (via Nginx):  http://localhost:8080"
echo "   Frontend (direct):     http://localhost:3000"
echo "   Backend API:          http://localhost:3001"
echo "   Database:             postgresql://localhost:5432/${POSTGRES_DB:-crm_db}"
echo ""
echo "📋 Useful commands:"
echo "   View logs:         docker-compose -f infra/docker/docker-compose.yml logs -f"
echo "   View specific:     docker-compose -f infra/docker/docker-compose.yml logs -f backend"
echo "   Stop all:          ./scripts/deploy/stop-production.sh"
echo "   Restart:           ./scripts/deploy/restart-production.sh"
echo "   Health check:      ./scripts/deploy/health-check.sh"
echo ""
echo "🔒 Security reminder:"
echo "   - Ensure all secrets in .env.production are secure"
echo "   - Set up SSL/TLS for production domains"
echo "   - Configure firewall rules appropriately"
echo "   - Enable monitoring and alerting"