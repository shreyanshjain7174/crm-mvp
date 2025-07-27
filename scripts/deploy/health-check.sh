#!/bin/bash

# 🏥 CRM MVP Health Check Script
# Verifies all services are running correctly

echo "🏥 Running CRM MVP Health Checks..."
echo ""

# Navigate to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

# Track overall health
HEALTH_STATUS=0

# Function to check service
check_service() {
    local name=$1
    local url=$2
    local expected_code=${3:-200}
    
    if curl -f -s -o /dev/null -w "%{http_code}" "$url" | grep -q "$expected_code"; then
        echo "✅ $name is healthy"
    else
        echo "❌ $name health check failed"
        HEALTH_STATUS=1
    fi
}

# Check Docker services
echo "🐳 Docker Service Status:"
docker-compose -f infra/docker/docker-compose.yml ps
echo ""

# Check individual services
echo "🌐 Service Health Checks:"

# Backend API
check_service "Backend API" "http://localhost:3001/health" "200"

# Frontend
check_service "Frontend" "http://localhost:3000" "200"

# Nginx Proxy
check_service "Nginx Proxy" "http://localhost:8080" "200"

# Database
echo -n "Checking Database... "
if docker exec crm-db pg_isready -U "${POSTGRES_USER:-crm_user}" -d "${POSTGRES_DB:-crm_db}" > /dev/null 2>&1; then
    echo "✅ Database is healthy"
else
    echo "❌ Database health check failed"
    HEALTH_STATUS=1
fi

# Redis
echo -n "Checking Redis... "
if docker exec crm-redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is healthy"
else
    echo "❌ Redis health check failed"
    HEALTH_STATUS=1
fi

echo ""

# API Endpoint checks
echo "🔍 API Endpoint Checks:"
check_service "Auth endpoint" "http://localhost:3001/api/auth/health" "200"
check_service "Contacts endpoint" "http://localhost:3001/api/contacts" "401"  # Should return 401 without auth

echo ""

# Resource usage
echo "📊 Resource Usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" | grep "crm-"

echo ""

# Check logs for errors
echo "📋 Recent Error Logs:"
echo "Backend errors (last 5):"
docker-compose -f infra/docker/docker-compose.yml logs backend 2>&1 | grep -i error | tail -5 || echo "  No recent errors"

echo ""
echo "Frontend errors (last 5):"
docker-compose -f infra/docker/docker-compose.yml logs frontend 2>&1 | grep -i error | tail -5 || echo "  No recent errors"

echo ""

# Overall status
if [ $HEALTH_STATUS -eq 0 ]; then
    echo "✅ All health checks passed!"
else
    echo "❌ Some health checks failed. Please investigate."
    exit 1
fi