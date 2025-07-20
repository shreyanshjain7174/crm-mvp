#!/bin/bash

echo "🚀 Starting CRM MVP Development Environment (Containerized)..."

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
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 2
        
        # Verify port is free
        if lsof -ti:$port &>/dev/null; then
            echo "❌ Failed to free port $port. Please manually stop the conflicting service."
            return 1
        else
            echo "✅ Port $port is now free"
        fi
    else
        echo "✅ Port $port is available"
    fi
    return 0
}

# Function to force cleanup containers and pods
force_cleanup_containers() {
    echo "🧹 Performing deep cleanup of containers and pods..."
    
    if [ "$CONTAINER_CMD" = "podman" ]; then
        # Stop all running containers
        local running_containers=$(podman ps -q 2>/dev/null)
        if [ ! -z "$running_containers" ]; then
            echo "🛑 Stopping all running containers..."
            echo "$running_containers" | xargs podman stop -t 10 2>/dev/null || true
        fi
        
        # Force remove all containers with our project prefix
        local project_containers=$(podman ps -a --format "{{.Names}}" | grep -E "(crm-dev|crm-mvp|pgadmin)" 2>/dev/null)
        if [ ! -z "$project_containers" ]; then
            echo "🗑️  Removing project containers..."
            echo "$project_containers" | xargs podman rm -f 2>/dev/null || true
        fi
        
        # Remove pods
        local project_pods=$(podman pod ls --format "{{.Name}}" | grep -E "(crm|pod_)" 2>/dev/null)
        if [ ! -z "$project_pods" ]; then
            echo "🗑️  Removing project pods..."
            echo "$project_pods" | xargs podman pod rm -f 2>/dev/null || true
        fi
        
        # Clean up networks
        echo "🌐 Cleaning up networks..."
        podman network prune -f 2>/dev/null || true
        
        # System prune to clean up orphaned resources
        echo "🧽 Pruning system resources..."
        podman system prune -f 2>/dev/null || true
        
    else
        # Docker cleanup
        docker-compose -f docker-compose.dev.yml down --remove-orphans -v 2>/dev/null || true
        docker system prune -f 2>/dev/null || true
    fi
    
    echo "✅ Deep cleanup completed"
}

if command -v podman &> /dev/null; then
    CONTAINER_CMD="podman"
    COMPOSE_CMD="podman-compose"
    echo "🐳 Using Podman as container runtime"
elif command -v docker &> /dev/null; then
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
    echo "❌ Neither Docker nor Podman is available"
    echo "Please install either:"
    echo "  - Docker Desktop: https://www.docker.com/products/docker-desktop/"
    echo "  - Podman: brew install podman"
    exit 1
fi

echo "🐳 Container runtime available - starting containerized environment..."

# Check for port conflicts before starting
echo "🔍 Checking for port conflicts..."
check_and_kill_port 3000 "Frontend" || exit 1
check_and_kill_port 3001 "Backend API" || exit 1
check_and_kill_port 3002 "Backend Secondary" || exit 1
check_and_kill_port 5432 "PostgreSQL" || exit 1
check_and_kill_port 6379 "Redis" || exit 1
check_and_kill_port 5050 "pgAdmin" || exit 1
check_and_kill_port 9229 "Node.js Debug" || exit 1

# For Podman, we need to check if the machine is running
if [ "$CONTAINER_CMD" = "podman" ]; then
    if ! podman machine list --format "{{.Running}}" | grep -q "true"; then
        echo "🔧 Starting Podman machine..."
        podman machine start
        sleep 5
    fi
    
    # Use podman-compose if available, otherwise docker-compose with podman socket
    if ! command -v podman-compose &> /dev/null; then
        echo "📦 Installing podman-compose..."
        pip3 install podman-compose 2>/dev/null || {
            echo "⚠️  podman-compose not available, using docker-compose with podman socket"
            export DOCKER_HOST="unix:///tmp/podman.sock"
            podman system service --time=0 unix:///tmp/podman.sock &
            PODMAN_SERVICE_PID=$!
            sleep 2
            COMPOSE_CMD="docker-compose"
        }
    fi
fi

# Initial cleanup
echo "🧹 Cleaning up existing containers..."
$COMPOSE_CMD -f docker-compose.dev.yml down --remove-orphans 2>/dev/null || true

# Function to start services with retry mechanism
start_services_with_retry() {
    local max_retries=3
    local retry_count=0
    
    while [ $retry_count -lt $max_retries ]; do
        echo "🔨 Building and starting all services (attempt $((retry_count + 1))/$max_retries)..."
        
        # Try to start services
        if $COMPOSE_CMD -f docker-compose.dev.yml up --build -d; then
            echo "✅ Services started successfully"
            
            # Wait a moment and check if all containers are running
            sleep 10
            local failed_containers=$($CONTAINER_CMD ps -a --format "{{.Names}} {{.Status}}" | grep -E "(crm-dev|crm-mvp)" | grep -v "Up" | cut -d' ' -f1)
            
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
                
                # If it's a libpod error, try deep cleanup
                if $CONTAINER_CMD logs $failed_containers 2>&1 | grep -q "internal libpod error"; then
                    echo "🔧 Detected libpod error, performing deep cleanup..."
                    force_cleanup_containers
                fi
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
            
            # For Podman, do additional cleanup on retry
            if [ "$CONTAINER_CMD" = "podman" ]; then
                force_cleanup_containers
            fi
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
    echo "   └── Email: admin@crm-dev.local | Password: dev_admin_password"
    echo "🔴 Cache: Redis (localhost:6379)"
    echo ""
    echo "💡 Demo mode is DISABLED - using containerized backend with persistent data"
    echo "🐳 All services running in containers with hot reload"
    echo ""
    echo "📋 Container Status:"
    $CONTAINER_CMD ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(NAMES|crm-dev|crm-mvp)" || true
    echo ""
    echo "To stop: Ctrl+C or run '$COMPOSE_CMD -f docker-compose.dev.yml down'"
    echo "To view logs: '$COMPOSE_CMD -f docker-compose.dev.yml logs -f'"
    echo "To restart a service: '$COMPOSE_CMD -f docker-compose.dev.yml restart <service>'"
    echo ""
}

# Enhanced cleanup function
cleanup() {
    echo ""
    echo "🧹 Stopping containers..."
    $COMPOSE_CMD -f docker-compose.dev.yml down --remove-orphans 2>/dev/null || true
    
    if [ "$CONTAINER_CMD" = "podman" ] && [ ! -z "$PODMAN_SERVICE_PID" ]; then
        echo "🛑 Stopping Podman service..."
        kill $PODMAN_SERVICE_PID 2>/dev/null || true
        rm -f /tmp/podman.sock
    fi
    
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
    echo "💥 Failed to start development environment"
    exit 1
fi