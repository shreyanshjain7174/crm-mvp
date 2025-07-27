#!/bin/bash

# 🛑 CRM MVP Production Stop Script
# Gracefully stops all production services

echo "🛑 Stopping CRM MVP Production Services..."

# Navigate to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

# Show current status
echo "📊 Current service status:"
docker-compose -f infra/docker/docker-compose.yml ps

# Confirm before stopping
read -p "⚠️  Are you sure you want to stop all production services? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Operation cancelled"
    exit 1
fi

# Stop all services gracefully
echo "🛑 Stopping all services..."
docker-compose -f infra/docker/docker-compose.yml stop

# Wait for services to stop
echo "⏳ Waiting for services to stop..."
sleep 5

# Bring down containers (keeps volumes)
echo "📦 Removing containers (data volumes preserved)..."
docker-compose -f infra/docker/docker-compose.yml down

echo ""
echo "✅ Production services stopped!"
echo ""
echo "💾 Data volumes are preserved. To remove them:"
echo "   docker-compose -f infra/docker/docker-compose.yml down -v"
echo ""
echo "🔄 To restart services:"
echo "   ./scripts/deploy/deploy-production.sh"
echo ""
echo "🧹 To clean up everything (including images):"
echo "   docker-compose -f infra/docker/docker-compose.yml down -v --rmi all"
echo "   docker system prune -a -f"