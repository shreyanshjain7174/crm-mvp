#!/bin/bash

# Production Management Script
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

show_help() {
    echo -e "${BLUE}🎛️  CRM MVP Production Management${NC}"
    echo "====================================="
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  start        🚀 Deploy to production (Fly.io + Vercel)"
    echo "  stop         🛑 Stop production backend (scale to 0)"
    echo "  restart      🔄 Restart production services"
    echo "  status       📊 Check production status"
    echo "  logs         📜 View production logs"
    echo "  scale        📈 Scale backend up/down"
    echo "  deploy       🎯 Manual deployment trigger"
    echo "  health       🏥 Run health checks"
    echo ""
    echo "Examples:"
    echo "  $0 deploy    # Deploy to production"
    echo "  $0 stop      # Stop backend to save costs"
    echo "  $0 start     # Wake up backend for demo"
    echo "  $0 scale 2   # Scale to 2 instances"
}

check_prerequisites() {
    # Check Fly CLI
    if ! command -v fly &> /dev/null; then
        echo -e "${RED}❌ Fly CLI not installed${NC}"
        echo -e "${YELLOW}   Install: curl -L https://fly.io/install.sh | sh${NC}"
        exit 1
    fi

    # Check if logged in to Fly
    if ! fly auth whoami &> /dev/null; then
        echo -e "${RED}❌ Not logged in to Fly.io${NC}"
        echo -e "${YELLOW}   Login: fly auth login${NC}"
        exit 1
    fi
}

deploy_production() {
    echo -e "${BLUE}🚀 Deploying to Production${NC}"
    ./scripts/deploy/deploy-production.sh
}

stop_production() {
    echo -e "${YELLOW}🛑 Stopping production backend...${NC}"
    
    read -p "This will stop the backend and save costs. Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}❌ Operation cancelled${NC}"
        exit 1
    fi
    
    fly scale count 0 --app crm-backend-api
    echo -e "${GREEN}✅ Backend stopped (scaled to 0)${NC}"
    echo -e "${YELLOW}💡 To restart: $0 start${NC}"
}

start_production() {
    echo -e "${YELLOW}🚀 Starting production backend...${NC}"
    fly scale count 1 --app crm-backend-api
    
    echo -e "${YELLOW}⏳ Waiting for backend to be ready...${NC}"
    sleep 30
    
    if curl -f https://crm-backend-api.fly.dev/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is running and healthy${NC}"
        echo -e "${BLUE}🌐 Backend URL: https://crm-backend-api.fly.dev${NC}"
    else
        echo -e "${RED}❌ Backend health check failed${NC}"
        exit 1
    fi
}

restart_production() {
    echo -e "${YELLOW}🔄 Restarting production services...${NC}"
    fly restart --app crm-backend-api
    
    echo -e "${YELLOW}⏳ Waiting for services to restart...${NC}"
    sleep 30
    
    check_health
}

check_status() {
    echo -e "${BLUE}📊 Production Status${NC}"
    echo "==================="
    
    echo -e "${YELLOW}Backend (Fly.io):${NC}"
    fly status --app crm-backend-api
    
    echo ""
    echo -e "${YELLOW}Frontend (Vercel):${NC}"
    echo "Check Vercel dashboard for deployment status"
    
    echo ""
    echo -e "${YELLOW}Quick Health Check:${NC}"
    if curl -f https://crm-backend-api.fly.dev/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend API is responding${NC}"
    else
        echo -e "${RED}❌ Backend API is not responding${NC}"
    fi
}

view_logs() {
    echo -e "${BLUE}📜 Production Logs${NC}"
    echo "=================="
    fly logs --app crm-backend-api
}

scale_backend() {
    local count=${1:-1}
    echo -e "${YELLOW}📈 Scaling backend to $count instances...${NC}"
    fly scale count $count --app crm-backend-api
    echo -e "${GREEN}✅ Scaled to $count instances${NC}"
}

check_health() {
    echo -e "${YELLOW}🏥 Running health checks...${NC}"
    
    # Backend health
    if curl -f https://crm-backend-api.fly.dev/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend health check passed${NC}"
    else
        echo -e "${RED}❌ Backend health check failed${NC}"
        return 1
    fi
    
    # API endpoints
    echo -e "${YELLOW}   Testing API endpoints...${NC}"
    
    # Test auth endpoint
    if curl -f https://crm-backend-api.fly.dev/api/auth/me > /dev/null 2>&1; then
        echo -e "${GREEN}   ✅ Auth endpoints responding${NC}"
    else
        echo -e "${YELLOW}   ⚠️  Auth endpoint test skipped (requires token)${NC}"
    fi
    
    echo -e "${GREEN}🎉 Health checks completed${NC}"
}

# Main command processing
case "${1:-help}" in
    "deploy"|"start")
        check_prerequisites
        deploy_production
        ;;
    "stop")
        check_prerequisites
        stop_production
        ;;
    "restart")
        check_prerequisites
        restart_production
        ;;
    "status")
        check_prerequisites
        check_status
        ;;
    "logs")
        check_prerequisites
        view_logs
        ;;
    "scale")
        check_prerequisites
        scale_backend $2
        ;;
    "health")
        check_health
        ;;
    "help"|*)
        show_help
        ;;
esac