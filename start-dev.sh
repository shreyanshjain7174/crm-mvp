#!/bin/bash

echo "🚀 Starting CRM MVP Development Environment (Core Services Only)..."

# Check container runtime availability (Docker or Podman)
CONTAINER_CMD=""
COMPOSE_CMD=""

# Function to check and kill processes using specific ports
check_and_kill_port() {
    local port=$1
    local service_name=$2
    
    echo "🔍 Checking port $port for conflicts..."
    local pids=$(lsof -ti:$port 2>/dev/null)
    
    if [ ! -z "$pids" ]; then
        echo "⚠️  Port $port is in use by process(es): $pids"
        echo "🔪 Killing conflicting processes for $service_name..."
        
        # Try multiple kill attempts with escalating force
        for signal in TERM KILL; do
            echo "$pids" | xargs kill -$signal 2>/dev/null || true
            sleep 2
            
            # Check if port is now free
            if ! lsof -ti:$port &>/dev/null; then
                echo "✅ Port $port is now free"
                return 0
            fi
        done
        
        # If still not free, try sudo (for system services)
        echo "🔧 Trying with elevated privileges..."
        echo "$pids" | xargs sudo kill -9 2>/dev/null || true
        sleep 3
        
        # Final check
        if lsof -ti:$port &>/dev/null; then
            echo "❌ Failed to free port $port. Manual intervention required:"
            echo "   Run: sudo lsof -ti:$port | xargs sudo kill -9"
            echo "   Or: sudo pkill -f $service_name"
            return 1
        else
            echo "✅ Port $port is now free"
        fi
    else
        echo "✅ Port $port is available"
    fi
    return 0
}

if command -v docker &> /dev/null; then
    CONTAINER_CMD="docker"
    COMPOSE_CMD="docker compose"
    echo "🐳 Using Docker as container runtime"
    
    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        echo "❌ Docker daemon is not running"
        echo "Please start Docker Desktop and try again"
        exit 1
    fi
else
    echo "❌ Docker is not available"
    echo "Please install Docker Desktop: https://www.docker.com/products/docker-desktop/"
    exit 1
fi

echo "🐳 Container runtime available - starting core environment..."

# Check for port conflicts before starting
echo "🔍 Checking for port conflicts..."
check_and_kill_port 3000 "Frontend" || exit 1
check_and_kill_port 3001 "Backend API" || exit 1
check_and_kill_port 3002 "Backend Secondary" || exit 1
check_and_kill_port 5432 "PostgreSQL" || exit 1
check_and_kill_port 6379 "Redis" || exit 1
check_and_kill_port 5050 "pgAdmin" || exit 1

echo "✅ Port cleanup completed"

# Docker is ready to use immediately

# Initial cleanup
echo "🧹 Cleaning up existing containers..."
$COMPOSE_CMD -f docker-compose.dev.yml down --remove-orphans 2>/dev/null || true

# Function to start services with retry mechanism
start_services_with_retry() {
    local max_retries=2
    local retry_count=0
    
    while [ $retry_count -lt $max_retries ]; do
        echo "🔨 Building and starting core services (attempt $((retry_count + 1))/$max_retries)..."
        
        # Try to start services
        if $COMPOSE_CMD -f docker-compose.dev.yml up --build -d; then
            echo "✅ Services started successfully"
            
            # Wait a moment and check if all containers are running
            sleep 10
            local failed_containers=$($CONTAINER_CMD ps -a --format "{{.Names}} {{.Status}}" | grep -E "(crm-dev)" | grep -v "Up" | cut -d' ' -f1)
            
            if [ -z "$failed_containers" ]; then
                echo "🎉 All containers are running successfully!"
                return 0
            else
                echo "⚠️  Some containers failed to start: $failed_containers"
                
                # Get logs for failed containers
                for container in $failed_containers; do
                    echo "📋 Logs for $container:"
                    $CONTAINER_CMD logs --tail 20 $container 2>/dev/null || true
                done
            fi
        else
            echo "❌ Failed to start services"
        fi
        
        retry_count=$((retry_count + 1))
        
        if [ $retry_count -lt $max_retries ]; then
            echo "🔄 Retrying in 5 seconds..."
            sleep 5
            
            # Clean up before retry
            $COMPOSE_CMD -f docker-compose.dev.yml down --remove-orphans 2>/dev/null || true
        fi
    done
    
    echo "❌ Failed to start services after $max_retries attempts"
    echo "🔍 Please check the logs above for specific errors"
    echo "💡 You may need to:"
    echo "   - Restart your container runtime ($CONTAINER_CMD)"
    echo "   - Check for system resource constraints"
    echo "   - Manually run: $COMPOSE_CMD -f docker-compose.dev.yml logs"
    return 1
}

# Function to monitor and display service status
monitor_services() {
    echo ""
    echo "🔧 Backend API will be available on http://localhost:3001"
    echo "🌐 Frontend UI will be available on http://localhost:3000"
    echo "📊 Database: PostgreSQL (localhost:5432)"
    echo "🗄️  Database Admin: pgAdmin (http://localhost:5050)"
    echo "   └── Email: admin@example.com | Password: dev_admin_password"
    echo "🔴 Cache: Redis (localhost:6379)"
    echo ""
    echo "💡 Core CRM development mode - AI services disabled for stability"
    echo "🐳 All services running in containers with hot reload"
    echo ""
    echo "📋 Container Status:"
    $CONTAINER_CMD ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}" | grep -E "(NAMES|crm-dev)" || true
    echo ""
    echo "To stop: Ctrl+C or run './stop-dev.sh'"
    echo "To view logs: '$COMPOSE_CMD -f docker-compose.dev.yml logs -f'"
    echo "To restart a service: '$COMPOSE_CMD -f docker-compose.dev.yml restart <service>'"
    echo ""
}

# Enhanced cleanup function
cleanup() {
    echo ""
    echo "🧹 Stopping containers..."
    $COMPOSE_CMD -f docker-compose.dev.yml down --remove-orphans 2>/dev/null || true
    
    # Docker cleanup is handled by compose down
    
    echo "✅ Development environment stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start services with retry mechanism
if start_services_with_retry; then
    monitor_services
    
    # Follow logs for all services
    echo "📜 Following logs for all services (Ctrl+C to stop)..."
    $COMPOSE_CMD -f docker-compose.dev.yml logs -f
else
    echo "💥 Failed to start core development environment"
    exit 1
fi