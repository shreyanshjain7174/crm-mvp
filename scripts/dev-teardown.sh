#!/bin/bash

# CRM Development Environment Teardown Script
# This script stops and removes all development containers and processes

set -e

echo "🧹 Tearing down CRM development environment..."

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Kill any running Node.js development processes
echo "🔥 Stopping Node.js development processes..."
pkill -f "next dev" || true
pkill -f "tsx watch" || true
pkill -f "npm run dev" || true

# Stop and remove Podman containers
if command_exists podman; then
    echo "🐳 Stopping and removing Podman containers..."
    
    # Stop containers
    podman stop crm-dev-db crm-dev-backend crm-dev-frontend redis-dev 2>/dev/null || true
    
    # Remove containers
    podman rm crm-dev-db crm-dev-backend crm-dev-frontend redis-dev 2>/dev/null || true
    
    # Clean up any orphaned containers with CRM-related names
    podman ps -a --format "{{.Names}}" | grep -E "(crm|postgres|redis)" | xargs -r podman rm -f 2>/dev/null || true
    
    # Remove any CRM-related images (optional - uncomment if needed)
    # podman images --format "{{.Repository}}:{{.Tag}}" | grep -E "(crm|localhost/crm)" | xargs -r podman rmi -f 2>/dev/null || true
    
    echo "✅ Podman containers cleaned up"
else
    echo "⚠️  Podman not found, skipping container cleanup"
fi

# Stop and remove Docker containers (fallback)
if command_exists docker; then
    echo "🐳 Stopping and removing Docker containers..."
    
    # Stop containers
    docker stop crm-dev-db crm-dev-backend crm-dev-frontend redis-dev 2>/dev/null || true
    
    # Remove containers
    docker rm crm-dev-db crm-dev-backend crm-dev-frontend redis-dev 2>/dev/null || true
    
    echo "✅ Docker containers cleaned up"
fi

# Clean up any stray processes on development ports
echo "🔌 Freeing up development ports..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:5432 | xargs kill -9 2>/dev/null || true
lsof -ti:6379 | xargs kill -9 2>/dev/null || true

# Clean up temporary files
echo "🗑️  Cleaning up temporary files..."
rm -rf /tmp/crm-* 2>/dev/null || true

# Optional: Clean up node_modules and reinstall (uncomment if needed)
# echo "🧹 Cleaning up node_modules..."
# rm -rf node_modules apps/*/node_modules
# npm install

echo "✅ Development environment teardown complete!"
echo ""
echo "To start fresh, run: ./scripts/dev-start.sh"