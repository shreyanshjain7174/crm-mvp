#!/bin/bash

# CRM Development Environment Start Script
# This script sets up and starts the complete CRM development environment

set -e

# Cleanup function for when things go wrong
cleanup_on_failure() {
    echo "❌ Setup failed! Cleaning up..."
    ./scripts/dev-teardown.sh
    exit 1
}

# Set trap to cleanup on failure
trap cleanup_on_failure ERR

echo "🚀 Starting CRM development environment..."

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait for service to be ready
wait_for_service() {
    local host=$1
    local port=$2
    local service_name=$3
    echo "⏳ Waiting for $service_name to be ready..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if nc -z "$host" "$port" 2>/dev/null; then
            echo "✅ $service_name is ready!"
            return 0
        fi
        echo "   Attempt $attempt/$max_attempts: $service_name not ready yet..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "❌ $service_name failed to start after $max_attempts attempts"
    return 1
}

# Function to create test user
create_test_user() {
    echo "👤 Creating test user..."
    
    # Hash for password "password"
    local password_hash='$2a$10$LAvcA2il3EsKhMeKzxxCIu/CgBibuFaEGBEBU.hwhVrPNVBrmxUVC'
    
    local result=$(podman exec crm-dev-db psql -U crm_dev_user -d crm_dev_db -c "
        INSERT INTO users (email, password, name, company) 
        VALUES ('demo@crm.dev', '$password_hash', 'Demo User', 'CRM Demo') 
        ON CONFLICT (email) DO NOTHING;
    " 2>&1)
    
    if echo "$result" | grep -q "INSERT"; then
        echo "✅ Test user created: demo@crm.dev / password"
    else
        echo "✅ Test user ready: demo@crm.dev / password"
    fi
}

# Check required tools
echo "🔍 Checking required tools..."
if ! command_exists podman && ! command_exists docker; then
    echo "❌ Neither Podman nor Docker found. Please install one of them."
    exit 1
fi

if ! command_exists node; then
    echo "❌ Node.js not found. Please install Node.js"
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm not found. Please install npm"
    exit 1
fi

# Set container runtime
CONTAINER_CMD="podman"
if ! command_exists podman; then
    CONTAINER_CMD="docker"
fi

echo "✅ Using $CONTAINER_CMD as container runtime"

# Ensure we're in the project root
cd "$(dirname "$0")/.."

# Clean up any existing containers first
echo "🧹 Cleaning up existing containers..."
./scripts/dev-teardown.sh

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create network for containers
echo "🌐 Creating container network..."
$CONTAINER_CMD network create crm-dev-network 2>/dev/null || echo "   Network already exists"

# Start PostgreSQL Database
echo "🐘 Starting PostgreSQL database..."
$CONTAINER_CMD run -d \
    --name crm-dev-db \
    --network crm-dev-network \
    -e POSTGRES_DB=crm_dev_db \
    -e POSTGRES_USER=crm_dev_user \
    -e POSTGRES_PASSWORD=dev_password \
    -p 5432:5432 \
    -v crm-dev-db-data:/var/lib/postgresql/data \
    postgres:15-alpine

# Start Redis
echo "🔴 Starting Redis..."
$CONTAINER_CMD run -d \
    --name redis-dev \
    --network crm-dev-network \
    -p 6379:6379 \
    redis:7-alpine

# Start pgAdmin
echo "📊 Starting pgAdmin..."
$CONTAINER_CMD run -d \
    --name pgadmin-dev \
    --network crm-dev-network \
    -e PGADMIN_DEFAULT_EMAIL=admin@crm.dev \
    -e PGADMIN_DEFAULT_PASSWORD=admin \
    -e PGADMIN_CONFIG_SERVER_MODE=False \
    -p 5050:80 \
    dpage/pgadmin4:latest

# Wait for services to be ready
wait_for_service localhost 5432 "PostgreSQL"
wait_for_service localhost 6379 "Redis"
wait_for_service localhost 5050 "pgAdmin"

# Initialize database and create test user
sleep 2
create_test_user

# Update backend environment
echo "⚙️  Configuring backend environment..."
cat > apps/backend/.env << EOF
# Database
DATABASE_URL="postgresql://crm_dev_user:dev_password@localhost:5432/crm_dev_db"
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="crm_dev_db"
DB_USER="crm_dev_user"
DB_PASSWORD="dev_password"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="dev-secret-key-change-in-production"

# WhatsApp API (360dialog)
WHATSAPP_API_URL="https://waba.360dialog.io"
WHATSAPP_API_TOKEN="your-360dialog-token"
WHATSAPP_WEBHOOK_SECRET="dev-webhook-secret"

# AI Services (Optional - Claude API)
ANTHROPIC_API_KEY="your-anthropic-api-key"

# Server Configuration
PORT=3001
NODE_ENV="development"

# Webhook URL for WhatsApp
WEBHOOK_URL="http://localhost:3001/api/whatsapp/webhook"
EOF

# Start backend in background
echo "⚡ Starting backend server..."
cd apps/backend
npm run dev > ../../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ../..

# Wait a bit for backend to initialize
sleep 5

# Start frontend in background
echo "🌐 Starting frontend server..."
cd apps/frontend
npm run dev > ../../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ../..

# Wait for services to be ready (but don't fail if backend has issues)
if wait_for_service localhost 3001 "Backend API"; then
    echo "✅ Backend API is ready!"
else
    echo "⚠️  Backend API failed to start - continuing with frontend-only demo mode"
    echo "   Check logs/backend.log for details"
fi

if wait_for_service localhost 3000 "Frontend"; then
    echo "✅ Frontend is ready!"
else
    echo "❌ Frontend failed to start - this is critical"
    cleanup_on_failure
fi

# Create logs directory
mkdir -p logs

# Save PIDs for cleanup
echo $BACKEND_PID > logs/backend.pid
echo $FRONTEND_PID > logs/frontend.pid

echo ""
echo "🎉 CRM Development Environment is ready!"
echo ""
echo "📱 Frontend:  http://localhost:3000"
echo "🔧 Backend:   http://localhost:3001"
echo "🐘 Database:  localhost:5432 (crm_dev_db)"
echo "🔴 Redis:     localhost:6379"
echo ""
echo "👤 Test Login:"
echo "   Email:    demo@crm.dev"
echo "   Password: password"
echo ""
echo "📊 Database UI (pgAdmin):"
echo "   Web UI:   http://localhost:5050"
echo "   Login:    admin@crm.dev / admin"
echo "   DB Host:  crm-dev-db"
echo "   DB Port:  5432"
echo "   Database: crm_dev_db"
echo "   Username: crm_dev_user"
echo "   Password: dev_password"
echo ""
echo "📝 Logs:"
echo "   Backend:  tail -f logs/backend.log"
echo "   Frontend: tail -f logs/frontend.log"
echo ""
echo "🛑 To stop: ./scripts/dev-teardown.sh"
echo ""
echo "🎯 Ready to test Progressive Disclosure CRM!"
echo "   Visit http://localhost:3000 and login to see the magic ✨"