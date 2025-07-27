#!/bin/bash

# 🛑 Stop CRM MVP with Ngrok
# Stops both the production deployment and ngrok tunnel

echo "🛑 Stopping CRM MVP and Ngrok tunnel..."

# Kill ngrok process
echo "🌐 Stopping Ngrok tunnel..."
pkill -f ngrok || echo "  Ngrok was not running"

# Stop production services
echo ""
./scripts/deploy/stop-production.sh

echo ""
echo "✅ All services stopped!"