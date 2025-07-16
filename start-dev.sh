#!/bin/bash

echo "🚀 Starting CRM MVP Development Environment (Containerized)..."

# Check container runtime availability (Docker or Podman)
CONTAINER_CMD=""
COMPOSE_CMD=""

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

# Stop any existing containers
echo "🧹 Cleaning up existing containers..."
$COMPOSE_CMD -f docker-compose.dev.yml down --remove-orphans 2>/dev/null || true

# Build and start all services
echo "🔨 Building and starting all services..."
echo "🔧 Backend API will be available on http://localhost:3001"
echo "🌐 Frontend UI will be available on http://localhost:3000"
echo "📊 Database: PostgreSQL (localhost:5432)"
echo "🔴 Cache: Redis (localhost:6379)"
echo ""
echo "💡 Demo mode is DISABLED - using containerized backend with persistent data"
echo "🐳 All services running in containers with hot reload"
echo ""
echo "To stop: Ctrl+C or run '$COMPOSE_CMD -f docker-compose.dev.yml down'"
echo "To view logs: '$COMPOSE_CMD -f docker-compose.dev.yml logs -f'"
echo ""

# Cleanup function for Podman
cleanup() {
    echo "🧹 Stopping containers..."
    $COMPOSE_CMD -f docker-compose.dev.yml down --remove-orphans 2>/dev/null || true
    
    if [ "$CONTAINER_CMD" = "podman" ] && [ ! -z "$PODMAN_SERVICE_PID" ]; then
        echo "🛑 Stopping Podman service..."
        kill $PODMAN_SERVICE_PID 2>/dev/null || true
        rm -f /tmp/podman.sock
    fi
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start the development environment
$COMPOSE_CMD -f docker-compose.dev.yml up --build