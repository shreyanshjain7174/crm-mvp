#!/bin/bash

# Start Development Environment Script
# This script starts all required services for the CRM MVP development

echo "🚀 Starting CRM MVP Development Environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Function to check if a container is running
container_running() {
    docker ps --format "table {{.Names}}" | grep -q "^$1$"
}

# Function to check if port is used by our container
port_used_by_container() {
    local port=$1
    local container=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null; then
        # Port is in use, check if it's our container
        if container_running "$container"; then
            return 0  # Port is used by our container
        else
            return 1  # Port is used by something else
        fi
    fi
    return 2  # Port is free
}

echo "📝 Checking services..."

# Check PostgreSQL
port_used_by_container 5432 "crm-postgres"
case $? in
    0)
        echo "✅ PostgreSQL container already running on port 5432"
        POSTGRES_RUNNING=true
        ;;
    1)
        echo "❌ Port 5432 is in use by another process. Please free it or update the port in .env"
        exit 1
        ;;
    2)
        echo "📦 PostgreSQL port is free, will start container"
        POSTGRES_RUNNING=false
        ;;
esac

# Check Redis
port_used_by_container 6379 "crm-redis"
case $? in
    0)
        echo "✅ Redis container already running on port 6379"
        REDIS_RUNNING=true
        ;;
    1)
        echo "❌ Port 6379 is in use by another process. Please free it or update the port in .env"
        exit 1
        ;;
    2)
        echo "📦 Redis port is free, will start container"
        REDIS_RUNNING=false
        ;;
esac

# Check application ports
check_app_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "❌ Port $1 is already in use. Please free it before starting."
        exit 1
    fi
}

check_app_port 3000  # Frontend
check_app_port 3001  # Backend

# Start PostgreSQL if not running
if [ "$POSTGRES_RUNNING" = false ]; then
    echo "🐳 Starting PostgreSQL container..."
    docker run -d \
        --name crm-postgres \
        -e POSTGRES_DB=crm_dev_db \
        -e POSTGRES_USER=crm_dev_user \
        -e POSTGRES_PASSWORD=dev_password \
        -p 5432:5432 \
        postgres:15-alpine || docker start crm-postgres
fi

# Start Redis if not running
if [ "$REDIS_RUNNING" = false ]; then
    echo "🐳 Starting Redis container..."
    docker run -d \
        --name crm-redis \
        -p 6379:6379 \
        redis:7-alpine || docker start crm-redis
fi

# Wait for databases to be ready
echo "⏳ Waiting for databases to be ready..."
sleep 3

# Setup database if needed
echo "🔧 Setting up database..."
docker exec crm-postgres psql -U postgres -c "CREATE USER crm_dev_user WITH PASSWORD 'dev_password';" 2>/dev/null || true
docker exec crm-postgres psql -U postgres -c "CREATE DATABASE crm_dev_db OWNER crm_dev_user;" 2>/dev/null || true
docker exec crm-postgres psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE crm_dev_db TO crm_dev_user;" 2>/dev/null || true

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
    echo "🛑 Shutting down..."
    
    # Only stop containers if we started them
    if [ "$POSTGRES_RUNNING" = false ]; then
        echo "Stopping PostgreSQL container..."
        docker stop crm-postgres >/dev/null 2>&1
    fi
    
    if [ "$REDIS_RUNNING" = false ]; then
        echo "Stopping Redis container..."
        docker stop crm-redis >/dev/null 2>&1
    fi
    
    echo "✅ Shutdown complete"
    exit 0
}

# Set up cleanup on exit
trap cleanup EXIT INT TERM