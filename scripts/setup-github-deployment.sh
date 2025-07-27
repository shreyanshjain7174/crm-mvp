#!/bin/bash

# 🚀 GitHub + Fly.io Deployment Setup Script
# Automates the setup of CI/CD pipeline

set -e

echo "🚀 Setting up GitHub + Fly.io Deployment Pipeline..."
echo "=================================================="

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

echo -e "${BLUE}📋 Step 1: Generate Fly.io API Token${NC}"
echo "Generating API token for GitHub Actions..."

# Generate API token
API_TOKEN=$(flyctl auth token)

echo -e "${GREEN}✅ API Token generated${NC}"
echo ""
echo -e "${YELLOW}📝 IMPORTANT: Add this token to your GitHub repository${NC}"
echo ""
echo "1. Go to your GitHub repository"
echo "2. Navigate to Settings → Secrets and variables → Actions"
echo "3. Click 'New repository secret'"
echo "4. Name: FLY_API_TOKEN"
echo "5. Value: $API_TOKEN"
echo ""
echo -e "${RED}⚠️  Keep this token secure! Don't share it.${NC}"
echo ""

read -p "Press Enter after adding the token to GitHub..."

echo ""
echo -e "${BLUE}📋 Step 2: Setup GitHub Workflow${NC}"

# Check if workflow exists
if [ -f ".github/workflows/fly-deploy.yml" ]; then
    echo -e "${GREEN}✅ GitHub workflow already exists${NC}"
else
    echo -e "${RED}❌ GitHub workflow not found${NC}"
    echo "Please ensure .github/workflows/fly-deploy.yml exists"
    exit 1
fi

echo ""
echo -e "${BLUE}📋 Step 3: Test Local CI Checks${NC}"
echo "Running the same checks that GitHub Actions will run..."

# Run linting
echo "🔍 Running ESLint..."
if npm run lint; then
    echo -e "${GREEN}✅ Linting passed${NC}"
else
    echo -e "${RED}❌ Linting failed${NC}"
    echo "Fix linting issues before deploying"
    exit 1
fi

# Run type checking
echo "🔍 Running TypeScript check..."
if npm run typecheck; then
    echo -e "${GREEN}✅ Type checking passed${NC}"
else
    echo -e "${RED}❌ Type checking failed${NC}"
    echo "Fix type errors before deploying"
    exit 1
fi

# Skip tests for now as they require database setup
echo -e "${YELLOW}⏭️  Skipping tests (require database setup)${NC}"

echo ""
echo -e "${BLUE}📋 Step 4: Commit and Push Workflow${NC}"

# Check if changes need to be committed
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Committing GitHub Actions workflow..."
    
    git add .github/workflows/fly-deploy.yml
    git add docs/GITHUB_DEPLOYMENT.md
    git add scripts/setup-github-deployment.sh
    
    git commit -s -m "feat: add GitHub Actions CI/CD workflow for Fly.io deployment

- Add comprehensive CI/CD pipeline with quality gates
- Include staging deployment for pull requests  
- Add deployment documentation and setup script
- Enable automatic deployments from GitHub main branch"
    
    echo -e "${GREEN}✅ Changes committed${NC}"
else
    echo -e "${GREEN}✅ No changes to commit${NC}"
fi

echo ""
echo -e "${YELLOW}🚀 Ready to deploy!${NC}"
echo "Choose deployment method:"
echo ""
echo "1. Push to GitHub (recommended for CI/CD setup)"
echo "2. Manual deployment with flyctl"
echo ""

read -p "Enter choice (1-2): " choice

case $choice in
    1)
        echo ""
        echo -e "${BLUE}📤 Pushing to GitHub...${NC}"
        
        # Get current branch
        BRANCH=$(git branch --show-current)
        
        if [ "$BRANCH" = "main" ]; then
            echo "Pushing to main branch - this will trigger automatic deployment!"
            read -p "Continue? (y/N): " confirm
            if [[ $confirm =~ ^[Yy]$ ]]; then
                git push origin main
                echo ""
                echo -e "${GREEN}🎉 Pushed to GitHub!${NC}"
                echo ""
                echo "🔍 Check deployment progress:"
                echo "   GitHub: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^/]*\/[^/]*\).git/\1/')/actions"
                echo "   Fly.io: flyctl logs --app crm-mvp"
            else
                echo "Deployment cancelled"
            fi
        else
            echo "Current branch: $BRANCH"
            echo "Pushing to non-main branch (will not auto-deploy)"
            git push origin "$BRANCH"
            echo ""
            echo -e "${GREEN}✅ Pushed to GitHub${NC}"
            echo "Create a PR to trigger staging deployment"
        fi
        ;;
    2)
        echo ""
        echo -e "${BLUE}🚀 Manual deployment...${NC}"
        flyctl deploy
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "================================================================"
echo -e "${GREEN}🎉 GitHub + Fly.io Deployment Setup Complete!${NC}"
echo "================================================================"
echo ""
echo -e "${BLUE}📱 What happens next:${NC}"
echo "   • Push to main → automatic production deployment"
echo "   • Create PR → automatic staging deployment"  
echo "   • All deployments run tests first"
echo ""
echo -e "${BLUE}🛠️  Useful commands:${NC}"
echo "   • Check status:     flyctl status --app crm-mvp"
echo "   • View logs:        flyctl logs --app crm-mvp"
echo "   • GitHub Actions:   Check the Actions tab in your repo"
echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo "   • Deployment Guide: docs/GITHUB_DEPLOYMENT.md"
echo "   • Fly.io Guide:     docs/FLY_DEPLOYMENT.md"
echo ""
echo -e "${YELLOW}💡 Pro tip: Set up Slack/Discord notifications in the workflow!${NC}"