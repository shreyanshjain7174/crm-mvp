#!/bin/bash

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║            🔧 AI AGENT PLATFORM DEVELOPMENT                  ║"
echo "║              Starting Core CRM Foundation...                ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check container runtime availability (Docker or Podman)
CONTAINER_CMD=""
COMPOSE_CMD=""

# Function to print colored status messages
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_ai_status() {
    echo -e "${PURPLE}[AI]${NC} $1"
}

# Function to check and kill processes using specific ports
check_and_kill_port() {
    local port=$1
    local service_name=$2
    
    print_status "🔍 Checking port $port for conflicts..."
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
    print_status "🐳 Using Docker as container runtime"
    
    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        print_error "❌ Docker daemon is not running"
        print_error "Please start Docker Desktop and try again"
        exit 1
    fi
else
    print_error "❌ Docker is not available"
    print_error "Please install Docker Desktop: https://www.docker.com/products/docker-desktop/"
    exit 1
fi

print_status "🔧 Container runtime available - starting platform development environment..."

# Check for port conflicts before starting
print_status "🔍 Checking for port conflicts..."
check_and_kill_port 3000 "Frontend" || exit 1
check_and_kill_port 3001 "Backend API" || exit 1
check_and_kill_port 3002 "Backend Secondary" || exit 1
check_and_kill_port 5432 "PostgreSQL" || exit 1
check_and_kill_port 6379 "Redis" || exit 1
check_and_kill_port 5050 "pgAdmin" || exit 1

# Note: AI service ports (8000, 8001, 11434) will be used for future agent platform

print_success "✅ Port cleanup completed"

# Use core development configuration
COMPOSE_FILE="docker-compose.dev.yml"
print_status "🔧 Using platform development configuration"

# Initial cleanup
print_status "🧹 Cleaning up existing containers..."
$COMPOSE_CMD -f $COMPOSE_FILE down --remove-orphans 2>/dev/null || true

# Function to start services with retry mechanism
start_services_with_retry() {
    local max_retries=2
    local retry_count=0
    
    while [ $retry_count -lt $max_retries ]; do
        print_status "🔨 Building and starting platform services (attempt $((retry_count + 1))/$max_retries)..."
        
        # Try to start services
        if $COMPOSE_CMD -f $COMPOSE_FILE up --build -d; then
            print_success "✅ Services started successfully"
            
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
            $COMPOSE_CMD -f $COMPOSE_FILE down --remove-orphans 2>/dev/null || true
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
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║              🔧 AI AGENT PLATFORM READY! 🔧                 ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    
    echo -e "\n${CYAN}📱 Core Application:${NC}"
    echo -e "   Frontend:     ${BLUE}http://localhost:3000${NC}"
    echo -e "   Backend API:  ${BLUE}http://localhost:3001${NC}"
    echo -e "   Socket.io:    ${BLUE}http://localhost:3002${NC}"

    echo -e "\n${CYAN}🗄️ Database Services:${NC}"
    echo -e "   PostgreSQL:   ${BLUE}localhost:5432${NC} (crm_dev/crm_dev_user)"
    echo -e "   Redis Cache:  ${BLUE}localhost:6379${NC}"
    echo -e "   pgAdmin:      ${BLUE}http://localhost:5050${NC} (admin@example.com)"
    
    echo -e "\n${PURPLE}🔧 Platform Status:${NC}"
    print_status "📋 Core CRM foundation ready for agent integration"
    print_status "🔌 Agent marketplace ports reserved: 8000, 8001, 11434"
    print_status "🎯 Ready for Universal Agent Protocol development"
    
    echo -e "\n${CYAN}🐳 Container Status:${NC}"
    $CONTAINER_CMD ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}" | grep -E "(NAMES|crm-dev)" || true
    
    echo -e "\n${CYAN}🚀 Quick Commands:${NC}"
    echo -e "   Stop services:     ${YELLOW}Ctrl+C or ./stop-dev.sh${NC}"
    echo -e "   View logs:         ${YELLOW}$COMPOSE_CMD -f $COMPOSE_FILE logs -f${NC}"
    echo -e "   Restart service:   ${YELLOW}$COMPOSE_CMD -f $COMPOSE_FILE restart <service>${NC}"
    echo -e "   Run tests:         ${YELLOW}npm run test${NC}"
    echo -e "   Lint & typecheck:  ${YELLOW}npm run lint && npm run typecheck${NC}"
    echo ""
}

# Enhanced cleanup function
cleanup() {
    echo ""
    print_status "🧹 Stopping containers..."
    $COMPOSE_CMD -f $COMPOSE_FILE down --remove-orphans 2>/dev/null || true
    
    # Docker cleanup is handled by compose down
    
    echo "✅ Development environment stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start services with retry mechanism
if start_services_with_retry; then
    monitor_services
    
    # Platform is ready for agent development
    
    # Follow logs for all services
    print_status "📜 Following logs for all services (Ctrl+C to stop)..."
    $COMPOSE_CMD -f $COMPOSE_FILE logs -f
else
    print_error "💥 Failed to start platform development environment"
    exit 1
fi