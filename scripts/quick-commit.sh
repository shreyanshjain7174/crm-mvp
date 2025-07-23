#!/bin/bash

# Quick Commit Script with CI Validation
# Automates the full commit workflow

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if commit message is provided
if [ $# -eq 0 ]; then
    echo -e "${YELLOW}❌ Usage: ./scripts/quick-commit.sh \"Your commit message\"${NC}"
    echo "Example: ./scripts/quick-commit.sh \"feat: add new proactive UI component\""
    exit 1
fi

COMMIT_MESSAGE="$1"

echo -e "${BLUE}🚀 Quick Commit Workflow${NC}"
echo "Commit message: \"$COMMIT_MESSAGE\""
echo

# Step 1: Run CI checks
echo -e "${BLUE}📋 Step 1: Running CI validation...${NC}"
if ! npm run ci-check; then
    echo -e "${YELLOW}❌ CI checks failed. Please fix issues before committing.${NC}"
    exit 1
fi

# Step 2: Stage all changes
echo -e "${BLUE}📦 Step 2: Staging changes...${NC}"
git add .

# Step 3: Commit with signed-off-by
echo -e "${BLUE}✍️  Step 3: Creating signed commit...${NC}"
git commit -s -m "$COMMIT_MESSAGE"

# Step 4: Show status
echo -e "${GREEN}✅ Commit created successfully!${NC}"
echo
echo -e "${BLUE}🎯 Next steps:${NC}"
echo "  git push                    # Push to current branch"
echo "  git push -u origin <branch> # Push new branch to remote"
echo
echo -e "${BLUE}💡 Proactive Platform Principle:${NC}"
echo "   Streamlined workflows = More time for innovation!"