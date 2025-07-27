#!/bin/bash

# 🌐 CRM MVP Deploy with Ngrok Script
# Deploys the app and exposes it via ngrok for remote access

echo "🌐 Deploying CRM MVP with Ngrok tunnel..."

# Navigate to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ Ngrok is not installed."
    echo "📥 Please install ngrok:"
    echo "   brew install ngrok  # macOS"
    echo "   or download from https://ngrok.com/download"
    exit 1
fi

# Check ngrok auth
if ! ngrok config check &> /dev/null; then
    echo "⚠️  Ngrok is not authenticated."
    echo "Please run: ngrok config add-authtoken YOUR_AUTH_TOKEN"
    echo "Get your token from: https://dashboard.ngrok.com/get-started/your-authtoken"
    exit 1
fi

# First deploy the production stack
echo "🚀 Starting production deployment..."
./scripts/deploy/deploy-production.sh

# Wait for services to be ready
echo ""
echo "⏳ Waiting for services to stabilize..."
sleep 10

# Start ngrok tunnel
echo ""
echo "🌐 Starting Ngrok tunnel..."
echo "This will expose your local app to the internet"
echo ""

# Kill any existing ngrok processes
pkill -f ngrok || true

# Start ngrok in background for the nginx proxy (port 8080)
nohup ngrok http 8080 --log=stdout > logs/ngrok.log 2>&1 &
NGROK_PID=$!

echo "⏳ Waiting for ngrok to start..."
sleep 5

# Get ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*"' | grep -o 'https://[^"]*' | head -1)

if [ -z "$NGROK_URL" ]; then
    echo "❌ Failed to get ngrok URL"
    echo "Check logs/ngrok.log for details"
    kill $NGROK_PID
    exit 1
fi

echo ""
echo "✅ Deployment complete with Ngrok!"
echo ""
echo "🌐 Public Access URLs:"
echo "   Public URL:        $NGROK_URL"
echo "   Ngrok Dashboard:   http://localhost:4040"
echo ""
echo "🏠 Local Access URLs:"
echo "   Local App:         http://localhost:8080"
echo "   Frontend:          http://localhost:3000"
echo "   Backend API:       http://localhost:3001"
echo ""
echo "📱 WhatsApp Webhook URL:"
echo "   $NGROK_URL/api/whatsapp/webhook"
echo ""
echo "⚠️  Important Notes:"
echo "   - This URL changes each time you restart ngrok"
echo "   - Update your WhatsApp webhook URL in Facebook/Meta dashboard"
echo "   - The tunnel will close when you stop this script"
echo ""
echo "🛑 To stop everything:"
echo "   ./scripts/deploy/stop-with-ngrok.sh"
echo ""
echo "📋 Ngrok process PID: $NGROK_PID"
echo "Ngrok is running in background. Check logs/ngrok.log for details."