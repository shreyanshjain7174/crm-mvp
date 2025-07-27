#!/bin/bash

# 🔄 CRM MVP Production Restart Script
# Restarts all production services with minimal downtime

echo "🔄 Restarting CRM MVP Production Services..."

# Navigate to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

# Check if services are running
echo "📊 Current service status:"
docker-compose -f infra/docker/docker-compose.yml ps

# Restart strategy selection
echo ""
echo "Select restart strategy:"
echo "1) Rolling restart (minimal downtime)"
echo "2) Full restart (stop all, then start)"
echo "3) Rebuild and restart (pull latest images)"
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo "🔄 Performing rolling restart..."
        # Restart each service one by one
        for service in db redis backend frontend nginx; do
            echo "   Restarting $service..."
            docker-compose -f infra/docker/docker-compose.yml restart $service
            sleep 5
        done
        ;;
    2)
        echo "🛑 Stopping all services..."
        docker-compose -f infra/docker/docker-compose.yml stop
        
        echo "🚀 Starting all services..."
        docker-compose -f infra/docker/docker-compose.yml up -d
        ;;
    3)
        echo "🔨 Rebuilding and restarting..."
        # Pull latest images
        docker-compose -f infra/docker/docker-compose.yml pull
        
        # Rebuild local images
        docker-compose -f infra/docker/docker-compose.yml build
        
        # Restart with new images
        docker-compose -f infra/docker/docker-compose.yml up -d
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

# Wait for services to be healthy
echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo ""
echo "🔍 Service Status:"
docker-compose -f infra/docker/docker-compose.yml ps

# Run health check
./scripts/deploy/health-check.sh

echo ""
echo "✅ Production services restarted!"