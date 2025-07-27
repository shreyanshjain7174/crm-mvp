#!/bin/bash

# 🚀 Fly.io Deployment Script for CRM MVP
# Comprehensive deployment with database setup and health checks

set -e

echo "🚀 CRM MVP Fly.io Deployment Starting..."
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo -e "${RED}❌ flyctl is not installed${NC}"
    echo "Install with: brew install flyctl"
    exit 1
fi

# Check if logged in to Fly
if ! flyctl auth whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Fly.io${NC}"
    echo "Please run: flyctl auth login"
    exit 1
fi

# Navigate to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}📍 Working directory: $PROJECT_ROOT${NC}"

# Step 1: Launch app (if not exists)
echo ""
echo -e "${YELLOW}📋 Step 1: Setting up Fly.io app...${NC}"

if [ ! -f "fly.toml" ]; then
    echo "❌ fly.toml not found. Please run 'fly launch' first."
    exit 1
fi

# Get app name from fly.toml
APP_NAME=$(grep '^app = ' fly.toml | cut -d'"' -f2)
echo -e "${GREEN}🏷️  App name: $APP_NAME${NC}"

# Step 2: Setup PostgreSQL database
echo ""
echo -e "${YELLOW}📋 Step 2: Setting up PostgreSQL database...${NC}"

if ! flyctl postgres list | grep -q "${APP_NAME}-db"; then
    echo "🗄️  Creating PostgreSQL database..."
    flyctl postgres create --name "${APP_NAME}-db" --region bom --vm-size shared-cpu-1x --volume-size 3
    
    # Attach database to app
    echo "🔗 Attaching database to app..."
    flyctl postgres attach "${APP_NAME}-db" --app "$APP_NAME"
else
    echo -e "${GREEN}✅ PostgreSQL database already exists${NC}"
fi

# Step 3: Setup Redis (optional but recommended)
echo ""
echo -e "${YELLOW}📋 Step 3: Setting up Redis...${NC}"

if ! flyctl redis list | grep -q "${APP_NAME}-redis"; then
    echo "🔴 Creating Redis instance..."
    flyctl redis create --name "${APP_NAME}-redis" --region bom --plan free
    
    # Get Redis URL and set as secret
    REDIS_URL=$(flyctl redis status "${APP_NAME}-redis" --json | jq -r '.private_url')
    flyctl secrets set REDIS_URL="$REDIS_URL" --app "$APP_NAME"
else
    echo -e "${GREEN}✅ Redis instance already exists${NC}"
fi

# Step 4: Set environment secrets
echo ""
echo -e "${YELLOW}📋 Step 4: Setting up environment secrets...${NC}"

# Generate JWT secrets if not provided
JWT_SECRET=${JWT_SECRET:-$(openssl rand -hex 32)}
SESSION_SECRET=${SESSION_SECRET:-$(openssl rand -hex 32)}

echo "🔐 Setting core secrets..."
flyctl secrets set \
    JWT_SECRET="$JWT_SECRET" \
    SESSION_SECRET="$SESSION_SECRET" \
    NODE_ENV="production" \
    --app "$APP_NAME"

# Optional API keys (prompt user)
echo ""
echo -e "${BLUE}🔑 Optional API Keys Setup:${NC}"
echo "You can set these now or later via: flyctl secrets set KEY=value"

read -p "Enter WhatsApp API Token (optional): " WHATSAPP_TOKEN
if [ -n "$WHATSAPP_TOKEN" ]; then
    flyctl secrets set WHATSAPP_API_TOKEN="$WHATSAPP_TOKEN" --app "$APP_NAME"
fi

read -p "Enter Anthropic API Key (optional): " ANTHROPIC_KEY
if [ -n "$ANTHROPIC_KEY" ]; then
    flyctl secrets set ANTHROPIC_API_KEY="$ANTHROPIC_KEY" --app "$APP_NAME"
fi

read -p "Enter OpenAI API Key (optional): " OPENAI_KEY
if [ -n "$OPENAI_KEY" ]; then
    flyctl secrets set OPENAI_API_KEY="$OPENAI_KEY" --app "$APP_NAME"
fi

# Step 5: Create volume for persistent data
echo ""
echo -e "${YELLOW}📋 Step 5: Setting up persistent storage...${NC}"

if ! flyctl volumes list --app "$APP_NAME" | grep -q "crm_data"; then
    echo "💾 Creating persistent volume..."
    flyctl volumes create crm_data --size 1 --region bom --app "$APP_NAME"
else
    echo -e "${GREEN}✅ Persistent volume already exists${NC}"
fi

# Step 6: Deploy the application
echo ""
echo -e "${YELLOW}📋 Step 6: Deploying application...${NC}"

echo "🔨 Building and deploying..."
flyctl deploy --app "$APP_NAME"

# Step 7: Health check and verification
echo ""
echo -e "${YELLOW}📋 Step 7: Health check and verification...${NC}"

echo "⏳ Waiting for deployment to be ready..."
sleep 30

# Get app URL
APP_URL="https://${APP_NAME}.fly.dev"

echo "🏥 Running health checks..."
if curl -f -s "$APP_URL/health" > /dev/null; then
    echo -e "${GREEN}✅ Health check passed!${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
    echo "Check logs with: flyctl logs --app $APP_NAME"
fi

# Step 8: Display success information
echo ""
echo "================================================================"
echo -e "${GREEN}🎉 CRM MVP Successfully Deployed to Fly.io!${NC}"
echo "================================================================"
echo ""
echo -e "${BLUE}📱 Application URLs:${NC}"
echo "   🌐 Main App:        $APP_URL"
echo "   🔗 API Health:      $APP_URL/health"
echo "   📊 Dashboard:       $APP_URL/dashboard"
echo ""
echo -e "${BLUE}🛠️  Management Commands:${NC}"
echo "   View logs:          flyctl logs --app $APP_NAME"
echo "   Check status:       flyctl status --app $APP_NAME"
echo "   Scale app:          flyctl scale count 2 --app $APP_NAME"
echo "   Open console:       flyctl ssh console --app $APP_NAME"
echo ""
echo -e "${BLUE}🔐 Database Access:${NC}"
echo "   Connect to DB:      flyctl postgres connect --app ${APP_NAME}-db"
echo "   DB proxy:           flyctl proxy 5432 --app ${APP_NAME}-db"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "   1. Configure your domain: flyctl certs create your-domain.com"
echo "   2. Set up monitoring: flyctl dashboard"
echo "   3. Configure WhatsApp webhook: $APP_URL/api/whatsapp/webhook"
echo ""
echo -e "${YELLOW}💡 Tip: Use 'flyctl dashboard' to monitor your app!${NC}"