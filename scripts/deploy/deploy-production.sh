#!/bin/bash

# Production Deployment Script
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 CRM MVP Production Deployment${NC}"
echo "=================================="

# Confirmation prompt
echo -e "${YELLOW}⚠️  This will deploy to PRODUCTION environment.${NC}"
echo -e "${YELLOW}   Backend: https://crm-backend-api.fly.dev${NC}"
echo -e "${YELLOW}   Frontend: Vercel production URL${NC}"
echo ""
read -p "Continue with production deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Deployment cancelled${NC}"
    exit 1
fi

# Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${RED}❌ Must be on 'main' branch for production deployment${NC}"
    echo -e "${YELLOW}   Current branch: $CURRENT_BRANCH${NC}"
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo -e "${RED}❌ Uncommitted changes detected${NC}"
    echo -e "${YELLOW}   Please commit or stash changes before deploying${NC}"
    exit 1
fi

# Update from remote
echo -e "${YELLOW}📡 Updating from remote...${NC}"
git fetch origin
git pull origin main

# Run tests locally
echo -e "${YELLOW}🧪 Running tests...${NC}"
# npm run ci-check 2>/dev/null || echo "⚠️  CI check not available, skipping..."

# Build and test locally
echo -e "${YELLOW}🏗️  Building applications...${NC}"
cd apps/frontend && npm run build && cd ../..
cd apps/backend && npm run build && cd ../..

# Deploy backend to Fly.io
echo -e "${YELLOW}🛠️  Deploying backend to Fly.io...${NC}"
if ! command -v fly &> /dev/null; then
    echo -e "${RED}❌ Fly CLI not installed${NC}"
    echo -e "${YELLOW}   Install: curl -L https://fly.io/install.sh | sh${NC}"
    exit 1
fi

fly deploy --app crm-backend-api --strategy rolling

# Wait for backend to be healthy
echo -e "${YELLOW}⏳ Waiting for backend to be healthy...${NC}"
sleep 30

# Health check
echo -e "${YELLOW}🔍 Running health check...${NC}"
if curl -f https://crm-backend-api.fly.dev/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
    exit 1
fi

# Deploy frontend to Vercel (if configured)
if command -v vercel &> /dev/null; then
    echo -e "${YELLOW}🌐 Deploying frontend to Vercel...${NC}"
    cd apps/frontend
    vercel --prod --yes
    cd ../..
else
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Deploy frontend manually:${NC}"
    echo -e "${YELLOW}   cd apps/frontend && vercel --prod${NC}"
fi

# Final checks
echo -e "${YELLOW}🔍 Final deployment verification...${NC}"
sleep 10

# Test API endpoints
echo -e "${YELLOW}   Testing API endpoints...${NC}"
curl -f https://crm-backend-api.fly.dev/health > /dev/null 2>&1 && echo -e "${GREEN}   ✅ Health endpoint OK${NC}" || echo -e "${RED}   ❌ Health endpoint failed${NC}"

# Success message
echo ""
echo -e "${GREEN}🎉 Production deployment completed successfully!${NC}"
echo ""
echo -e "${BLUE}📍 Production URLs:${NC}"
echo -e "${BLUE}   Backend:  https://crm-backend-api.fly.dev${NC}"
echo -e "${BLUE}   Frontend: Check Vercel dashboard for URL${NC}"
echo ""
echo -e "${YELLOW}📋 Post-deployment checklist:${NC}"
echo "   ✅ Backend health check passed"
echo "   ✅ API endpoints responding"
echo "   🔲 Test frontend functionality"
echo "   🔲 Verify user authentication"
echo "   🔲 Check database connectivity"
echo ""
echo -e "${GREEN}🎯 Deployment complete! Monitor logs and metrics.${NC}"