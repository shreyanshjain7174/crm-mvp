#!/bin/bash

# Start Development Environment Script
# This script starts all required services for the CRM MVP development

echo "🚀 Starting CRM MVP Development Environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Check if required ports are available
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "❌ Port $1 is already in use. Please free it before starting."
        exit 1
    fi
}

echo "📝 Checking port availability..."
check_port 3000  # Frontend
check_port 3001  # Backend
check_port 5432  # PostgreSQL
check_port 6379  # Redis

# Start PostgreSQL and Redis using Docker
echo "🐳 Starting PostgreSQL and Redis containers..."
docker run -d \
    --name crm-postgres \
    -e POSTGRES_DB=crm_mvp \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=postgres \
    -p 5432:5432 \
    postgres:15-alpine 2>/dev/null || docker start crm-postgres

docker run -d \
    --name crm-redis \
    -p 6379:6379 \
    redis:7-alpine 2>/dev/null || docker start crm-redis

# Wait for databases to be ready
echo "⏳ Waiting for databases to be ready..."
sleep 3

# Check if databases are running
if ! docker ps | grep -q crm-postgres; then
    echo "❌ PostgreSQL failed to start"
    exit 1
fi

if ! docker ps | grep -q crm-redis; then
    echo "❌ Redis failed to start"
    exit 1
fi

echo "✅ Databases are running"

# Check if .env file exists in backend
if [ ! -f "apps/backend/.env" ]; then
    echo "📝 Creating .env file from example..."
    cp apps/backend/.env.example apps/backend/.env
    echo "⚠️  Please update the .env file with your API keys"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run database migrations
echo "🔧 Running database migrations..."
cd apps/backend
npm run db:migrate
cd ../..

# Start the development servers
echo "🎯 Starting development servers..."
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Run both frontend and backend
npm run dev

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    docker stop crm-postgres crm-redis
    echo "✅ All services stopped"
    exit 0
}

# Set up cleanup on exit
trap cleanup EXIT INT TERM