#!/bin/bash

# Start Development Environment
set -e

echo "🚀 Starting CRM MVP development environment..."

# Check if setup has been run
if [ ! -f ".env.local" ]; then
    echo "⚠️  Local environment not set up. Running setup first..."
    ./scripts/dev/setup-local.sh
    exit $?
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Navigate to project root
cd "$(dirname "$0")/../.."

# Start backend with Docker Compose
echo "🏗️  Starting backend services..."
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 5

# Start frontend in development mode
echo "🌐 Starting frontend development server..."
cd apps/frontend && npm run dev &
FRONTEND_PID=$!

echo "✅ Development environment started!"
echo ""
echo "📊 Service URLs:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:3001"
echo "   Database:  postgresql://localhost:5432/crm_dev"
echo ""
echo "📋 Useful commands:"
echo "   View backend logs: docker-compose -f docker-compose.dev.yml logs -f"
echo "   Stop all:         ./scripts/dev/stop.sh"
echo "   Reset database:   ./scripts/dev/reset-local.sh"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for Ctrl+C
trap 'echo "\n🛑 Stopping services..."; kill $FRONTEND_PID 2>/dev/null; docker-compose -f docker-compose.dev.yml down; exit 0' INT
wait