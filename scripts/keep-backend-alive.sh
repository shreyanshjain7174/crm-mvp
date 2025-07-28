#!/bin/bash

# Keep Backend Alive Script
# This script makes periodic health checks to prevent Fly.io auto-stop
# Run this on a server or use a cron job for automated keep-alive

BACKEND_URL="https://crm-backend-api.fly.dev"
HEALTH_ENDPOINT="$BACKEND_URL/health"
LOG_FILE="./logs/keep-alive.log"

# Create logs directory if it doesn't exist
mkdir -p ./logs

# Function to make health check
check_health() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "[$timestamp] Checking backend health..." | tee -a "$LOG_FILE"
    
    # Make health check request
    response=$(curl -s -w "HTTP_CODE:%{http_code}" "$HEALTH_ENDPOINT")
    http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
    
    if [ "$http_code" = "200" ]; then
        echo "[$timestamp] ✅ Backend is healthy (HTTP $http_code)" | tee -a "$LOG_FILE"
        return 0
    else
        echo "[$timestamp] ❌ Backend health check failed (HTTP $http_code)" | tee -a "$LOG_FILE"
        return 1
    fi
}

# Function to run continuous monitoring
run_continuous() {
    echo "Starting continuous backend monitoring (every 15 minutes)..."
    echo "Press Ctrl+C to stop"
    
    while true; do
        check_health
        
        # Wait 15 minutes (900 seconds)
        # This keeps the backend active without being too aggressive
        sleep 900
    done
}

# Function to run single check
run_single() {
    check_health
}

# Main execution
case "${1:-continuous}" in
    "single")
        run_single
        ;;
    "continuous")
        run_continuous
        ;;
    *)
        echo "Usage: $0 [single|continuous]"
        echo "  single     - Make one health check"
        echo "  continuous - Keep making health checks every 15 minutes"
        exit 1
        ;;
esac