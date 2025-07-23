#!/bin/bash

# CRM MVP - Deployment Script with ngrok Integration
# This script builds and deploys the CRM with optional ngrok tunneling for live testing

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="crm-mvp"
DEFAULT_PORT=3000
NGROK_CONFIG_DIR="$HOME/.ngrok2"
NGROK_CONFIG_FILE="$NGROK_CONFIG_DIR/ngrok.yml"

# Help function
show_help() {
    echo "CRM MVP Deployment Script with ngrok Integration"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help           Show this help message"
    echo "  -p, --port PORT      Port to run the application on (default: 3000)"
    echo "  -n, --ngrok          Enable ngrok tunneling for live testing"
    echo "  -d, --domain DOMAIN  Use custom ngrok domain (requires ngrok Pro)"
    echo "  -r, --region REGION  Ngrok region (us, eu, ap, au, sa, jp, in) default: us"
    echo "  -e, --env ENV        Environment (dev, staging, prod) default: dev"
    echo "  --install-ngrok      Install ngrok if not present"
    echo "  --setup-ngrok        Setup ngrok with auth token"
    echo ""
    echo "Examples:"
    echo "  $0                          # Basic deployment"
    echo "  $0 -n                       # Deploy with ngrok tunnel"
    echo "  $0 -n -d myapp.ngrok.io     # Deploy with custom ngrok domain"
    echo "  $0 -p 3001 -n -r eu         # Deploy on port 3001 with EU ngrok region"
    echo "  $0 --install-ngrok          # Install ngrok"
    echo "  $0 --setup-ngrok            # Setup ngrok authentication"
    echo ""
}

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ INFO:${NC} $1"
}

log_success() {
    echo -e "${GREEN}✅ SUCCESS:${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠ WARNING:${NC} $1"
}

log_error() {
    echo -e "${RED}❌ ERROR:${NC} $1"
}

# Check if ngrok is installed
check_ngrok() {
    if command -v ngrok &> /dev/null; then
        log_success "ngrok is installed"
        return 0
    else
        log_warning "ngrok is not installed"
        return 1
    fi
}

# Install ngrok
install_ngrok() {
    log_info "Installing ngrok..."
    
    # Detect OS
    OS=$(uname -s)
    ARCH=$(uname -m)
    
    case $OS in
        "Darwin")
            if command -v brew &> /dev/null; then
                brew install ngrok/ngrok/ngrok
            else
                log_error "Homebrew not found. Please install Homebrew first or install ngrok manually"
                exit 1
            fi
            ;;
        "Linux")
            # Download and install for Linux
            case $ARCH in
                "x86_64")
                    curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
                    echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
                    sudo apt update && sudo apt install ngrok
                    ;;
                *)
                    log_error "Unsupported architecture: $ARCH"
                    exit 1
                    ;;
            esac
            ;;
        *)
            log_error "Unsupported OS: $OS"
            exit 1
            ;;
    esac
    
    log_success "ngrok installed successfully"
}

# Setup ngrok authentication
setup_ngrok() {
    log_info "Setting up ngrok authentication..."
    
    echo "Please get your ngrok auth token from: https://dashboard.ngrok.com/get-started/your-authtoken"
    read -p "Enter your ngrok auth token: " NGROK_TOKEN
    
    if [ -z "$NGROK_TOKEN" ]; then
        log_error "No auth token provided"
        exit 1
    fi
    
    ngrok config add-authtoken "$NGROK_TOKEN"
    log_success "ngrok authentication configured"
}

# Start ngrok tunnel
start_ngrok() {
    local port=$1
    local domain=$2
    local region=$3
    
    log_info "Starting ngrok tunnel on port $port..."
    
    # Build ngrok command
    NGROK_CMD="ngrok http $port"
    
    if [ ! -z "$domain" ]; then
        NGROK_CMD="$NGROK_CMD --domain=$domain"
    fi
    
    if [ ! -z "$region" ]; then
        NGROK_CMD="$NGROK_CMD --region=$region"
    fi
    
    # Start ngrok in background
    $NGROK_CMD > /dev/null 2>&1 &
    NGROK_PID=$!
    
    # Wait for ngrok to start
    sleep 3
    
    # Get ngrok URL
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url' 2>/dev/null || echo "")
    
    if [ ! -z "$NGROK_URL" ]; then
        log_success "ngrok tunnel started"
        echo ""
        echo "🌐 Your app is now live at: $NGROK_URL"
        echo "📊 ngrok dashboard: http://localhost:4040"
        echo ""
        
        # Open URLs in browser (optional)
        if command -v open &> /dev/null; then  # macOS
            read -p "Open app in browser? (y/N): " OPEN_BROWSER
            if [ "$OPEN_BROWSER" = "y" ] || [ "$OPEN_BROWSER" = "Y" ]; then
                open "$NGROK_URL"
                open "http://localhost:4040"
            fi
        fi
    else
        log_error "Failed to get ngrok URL"
        kill $NGROK_PID 2>/dev/null || true
        exit 1
    fi
}

# Build and start the application
build_and_start() {
    local port=$1
    local env=$2
    
    log_info "Building CRM MVP for $env environment..."
    
    # Install dependencies
    log_info "Installing dependencies..."
    npm install
    
    # Run linting and type checking
    log_info "Running code quality checks..."
    npm run lint
    npm run typecheck
    
    # Build the application
    case $env in
        "prod")
            log_info "Building for production..."
            npm run build
            log_info "Starting production server on port $port..."
            PORT=$port npm start &
            ;;
        "staging"|"dev")
            log_info "Starting development server on port $port..."
            PORT=$port npm run dev &
            ;;
    esac
    
    APP_PID=$!
    
    # Wait for app to start
    log_info "Waiting for application to start..."
    sleep 5
    
    # Check if app is running
    if curl -s "http://localhost:$port" > /dev/null; then
        log_success "Application started successfully on port $port"
    else
        log_error "Failed to start application"
        kill $APP_PID 2>/dev/null || true
        exit 1
    fi
}

# Cleanup function
cleanup() {
    log_info "Cleaning up..."
    
    if [ ! -z "$APP_PID" ]; then
        kill $APP_PID 2>/dev/null || true
        log_info "Application stopped"
    fi
    
    if [ ! -z "$NGROK_PID" ]; then
        kill $NGROK_PID 2>/dev/null || true
        log_info "ngrok tunnel stopped"
    fi
    
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Parse command line arguments
PORT=$DEFAULT_PORT
USE_NGROK=false
NGROK_DOMAIN=""
NGROK_REGION="us"
ENVIRONMENT="dev"

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -p|--port)
            PORT="$2"
            shift 2
            ;;
        -n|--ngrok)
            USE_NGROK=true
            shift
            ;;
        -d|--domain)
            NGROK_DOMAIN="$2"
            shift 2
            ;;
        -r|--region)
            NGROK_REGION="$2"
            shift 2
            ;;
        -e|--env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --install-ngrok)
            install_ngrok
            exit 0
            ;;
        --setup-ngrok)
            setup_ngrok
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Main deployment flow
echo "🚀 CRM MVP Deployment Script"
echo "=============================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    log_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

# If ngrok is requested, check/install it
if [ "$USE_NGROK" = true ]; then
    if ! check_ngrok; then
        read -p "Install ngrok? (y/N): " INSTALL_NGROK
        if [ "$INSTALL_NGROK" = "y" ] || [ "$INSTALL_NGROK" = "Y" ]; then
            install_ngrok
        else
            log_error "ngrok is required for live deployment"
            exit 1
        fi
    fi
    
    # Check if ngrok is authenticated
    if ! ngrok config check > /dev/null 2>&1; then
        log_warning "ngrok not authenticated"
        setup_ngrok
    fi
fi

# Build and start the application
build_and_start $PORT $ENVIRONMENT

# Start ngrok if requested
if [ "$USE_NGROK" = true ]; then
    start_ngrok $PORT "$NGROK_DOMAIN" "$NGROK_REGION"
fi

# Show status
echo ""
log_success "Deployment complete!"
echo ""
echo "📱 Local app: http://localhost:$PORT"
if [ "$USE_NGROK" = true ] && [ ! -z "$NGROK_URL" ]; then
    echo "🌐 Live app: $NGROK_URL"
    echo "📊 ngrok dashboard: http://localhost:4040"
fi
echo ""
echo "Press Ctrl+C to stop the application and ngrok tunnel"

# Keep script running
wait