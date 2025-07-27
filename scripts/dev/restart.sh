#!/bin/bash

# CRM MVP Development Restart Script
echo "🔄 Restarting CRM MVP Development Environment..."

# Navigate to project root
cd "$(dirname "$0")/../.."

# Stop and start services
echo "🛑 Stopping services..."
docker-compose -f infra/docker/docker-compose.dev.yml down

echo "🚀 Starting services..."
docker-compose -f infra/docker/docker-compose.dev.yml up -d

echo "✅ Development environment restarted!"