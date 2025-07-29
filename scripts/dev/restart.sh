#!/bin/bash

# CRM MVP Development Restart Script
echo "🔄 Restarting CRM MVP Development Environment..."

# Navigate to project root
cd "$(dirname "$0")/../.."

# Stop all services
echo "🛑 Stopping all services..."
./scripts/dev/stop.sh

# Wait a moment
sleep 2

# Start all services
echo "🚀 Starting all services..."
./scripts/dev/start.sh