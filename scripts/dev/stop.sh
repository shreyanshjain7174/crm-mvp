#!/bin/bash

# Stop Development Environment
set -e

echo "🛑 Stopping CRM MVP development environment..."

# Navigate to project root
cd "$(dirname "$0")/../.."

# Stop Docker services
echo "📦 Stopping Docker containers..."
docker-compose -f docker-compose.dev.yml down

# Kill any remaining Node processes
echo "🔍 Cleaning up Node processes..."
pkill -f "next dev" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true

echo "✅ Development environment stopped successfully!"
echo "📊 To restart: ./scripts/dev/start.sh"
echo "🔄 To reset database: ./scripts/dev/reset-local.sh"