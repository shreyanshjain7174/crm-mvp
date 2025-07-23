#!/bin/bash

# Start Development Environment Script
# This script starts all required services for the CRM MVP development
# 
# Usage:
#   ./start-dev.sh           # Interactive mode (default)
#   ./start-dev.sh --force   # Auto-kill processes on port conflicts
#   ./start-dev.sh --help    # Show help

# Check for command line arguments
FORCE_KILL=false
SHOW_HELP=false

for arg in "$@"; do
    case $arg in
        --force)
            FORCE_KILL=true
            ;;
        --help|-h)
            SHOW_HELP=true
            ;;
        *)
            echo "Unknown argument: $arg"
            SHOW_HELP=true
            ;;
    esac
done

if [ "$SHOW_HELP" = true ]; then
    echo "🚀 CRM MVP Development Environment Launcher"
    echo ""
    echo "Usage:"
    echo "  ./start-dev.sh           # Interactive mode (ask before killing processes)"
    echo "  ./start-dev.sh --force   # Automatically kill conflicting processes"
    echo "  ./start-dev.sh --help    # Show this help message"
    echo ""
    echo "This script will:"
    echo "  • Start PostgreSQL and Redis containers (if not running)"
    echo "  • Check and handle port conflicts for 3000 (frontend) and 3001 (backend)"
    echo "  • Install dependencies if needed"
    echo "  • Run database migrations"
    echo "  • Start both frontend and backend development servers"
    echo ""
    exit 0
fi

echo "🚀 Starting CRM MVP Development Environment..."
if [ "$FORCE_KILL" = true ]; then
    echo "⚡ Force mode enabled: Will automatically kill conflicting processes"
fi

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

# Check and handle application ports
check_and_handle_app_port() {
    local port=$1
    local service_name=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $port is already in use by another process."
        echo "🔧 Attempting to free port $port for $service_name..."
        
        # Get the PID and process name
        local pid=$(lsof -ti :$port)
        local process_name=$(ps -p $pid -o comm= 2>/dev/null || echo "unknown")
        
        echo "   Found process: $process_name (PID: $pid)"
        
        if [ "$FORCE_KILL" = true ]; then
            echo "⚡ Force mode: Killing process $pid automatically..."
            kill $pid 2>/dev/null
            sleep 2
            
            # Check if port is now free
            if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
                echo "❌ Failed to free port $port. Please manually stop the process and try again."
                exit 1
            else
                echo "✅ Port $port freed successfully"
            fi
        else
            # Offer options to the user
            echo "   Options:"
            echo "   [1] Kill the process and use port $port"
            echo "   [2] Use a different port (will require manual configuration)"
            echo "   [3] Exit and handle manually"
            read -p "   Choose option (1-3): " -n 1 -r
            echo
            
            case $REPLY in
                1)
                    echo "🔫 Killing process $pid..."
                    kill $pid 2>/dev/null
                    sleep 2
                    
                    # Check if port is now free
                    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
                        echo "❌ Failed to free port $port. Please manually stop the process and try again."
                        exit 1
                    else
                        echo "✅ Port $port freed successfully"
                    fi
                    ;;
                2)
                    # Find next available port
                    local new_port=$((port + 10))
                    while lsof -Pi :$new_port -sTCP:LISTEN -t >/dev/null ; do
                        new_port=$((new_port + 1))
                    done
                    echo "💡 Suggested alternative port: $new_port"
                    echo "⚠️  You'll need to update your environment configuration to use port $new_port"
                    echo "❌ For now, please manually free port $port or update your configuration. Exiting."
                    exit 1
                    ;;
                3|*)
                    echo "❌ Exiting. Please manually free port $port and try again."
                    exit 1
                    ;;
            esac
        fi
    else
        echo "✅ Port $port is available for $service_name"
    fi
}

check_and_handle_app_port 3000 "Frontend"
check_and_handle_app_port 3001 "Backend"

# Stop any conflicting production containers
echo "🛑 Stopping production containers if running..."
docker stop crm-postgres crm-redis 2>/dev/null || true
docker rm crm-postgres crm-redis 2>/dev/null || true

# Start development environment with docker-compose
echo "🐳 Starting development environment (PostgreSQL, Redis, pgAdmin)...")
docker-compose -f docker-compose.dev.yml up -d db redis pgadmin

# Wait for containers to be healthy
echo "⏳ Waiting for development containers to be ready..."
sleep 5

# Check if databases are running
if ! docker ps | grep -q crm-dev-db; then
    echo "❌ PostgreSQL failed to start"
    exit 1
fi

if ! docker ps | grep -q crm-dev-redis; then
    echo "❌ Redis failed to start"
    exit 1
fi

if ! docker ps | grep -q crm-dev-pgadmin; then
    echo "❌ pgAdmin failed to start"
    exit 1
fi

echo "✅ Development environment is running"
echo "🗄️  pgAdmin: http://localhost:5050 (admin@example.com / dev_admin_password)"

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
    echo "🛑 Shutting down development environment..."
    
    # Stop development containers (but keep them for reuse)
    echo "Stopping development containers..."
    docker-compose -f docker-compose.dev.yml stop
    
    echo "✅ Shutdown complete"
    echo "💡 Run './start-dev.sh' again to restart or 'docker-compose -f docker-compose.dev.yml down' to fully cleanup"
    exit 0
}

# Set up cleanup on exit
trap cleanup EXIT INT TERM