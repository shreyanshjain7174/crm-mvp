#!/bin/bash

# AI Platform CI Check Script
# Automated pre-commit validation with verbose logging

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Progress indicators
CHECKMARK="✅"
CROSS="❌"
HOURGLASS="⏳"
ROCKET="🚀"

echo -e "${BLUE}${ROCKET} AI Platform CI Validation Pipeline${NC}"
echo "============================================="
echo

# Function to run command with timing and logging
run_check() {
    local name="$1"
    local command="$2"
    
    echo -e "${YELLOW}${HOURGLASS} Running: $name${NC}"
    echo "Command: $command"
    
    start_time=$(date +%s)
    
    if eval "$command" 2>&1 | tee /tmp/ci_output.log; then
        end_time=$(date +%s)
        duration=$((end_time - start_time))
        echo -e "${GREEN}${CHECKMARK} $name completed in ${duration}s${NC}"
        echo
        return 0
    else
        end_time=$(date +%s)
        duration=$((end_time - start_time))
        echo -e "${RED}${CROSS} $name failed after ${duration}s${NC}"
        echo "Error output:"
        tail -20 /tmp/ci_output.log
        echo
        return 1
    fi
}

# Track overall status
overall_status=0
total_start_time=$(date +%s)

echo -e "${BLUE}📋 Running comprehensive CI checks...${NC}"
echo

# 1. ESLint Check
if ! run_check "ESLint (Frontend + Backend)" "npm run lint"; then
    overall_status=1
fi

# 2. TypeScript Check
if ! run_check "TypeScript Compilation" "npm run typecheck"; then
    overall_status=1
fi

# 3. Build Check (optional, can be enabled)
# if ! run_check "Production Build" "npm run build"; then
#     overall_status=1
# fi

# 4. Test Suite (if tests exist)
if [ -f "package.json" ] && grep -q '"test"' package.json; then
    if ! run_check "Test Suite" "npm run test"; then
        overall_status=1
    fi
fi

# 5. Git Status Check
echo -e "${YELLOW}${HOURGLASS} Checking Git Status${NC}"
git_status=$(git status --porcelain)
if [ -n "$git_status" ]; then
    echo -e "${YELLOW}⚠️  Uncommitted changes detected:${NC}"
    git status --short
    echo
else
    echo -e "${GREEN}${CHECKMARK} Git working directory is clean${NC}"
    echo
fi

# Final Summary
total_end_time=$(date +%s)
total_duration=$((total_end_time - total_start_time))

echo "============================================="

if [ $overall_status -eq 0 ]; then
    echo -e "${GREEN}${CHECKMARK} All CI checks passed! ${ROCKET}${NC}"
    echo -e "${GREEN}Total execution time: ${total_duration}s${NC}"
    echo
    echo -e "${BLUE}🎯 Ready to commit and push!${NC}"
    echo "Next steps:"
    echo "  git add ."
    echo "  git commit -s -m 'your message'"
    echo "  git push"
else
    echo -e "${RED}${CROSS} CI checks failed!${NC}"
    echo -e "${RED}Total execution time: ${total_duration}s${NC}"
    echo
    echo -e "${YELLOW}🔧 Please fix the issues above before committing.${NC}"
    exit 1
fi

echo
echo -e "${BLUE}💡 Proactive AI Platform Principle:${NC}"
echo "   Automate repetitive tasks, just like our AI agents do for users!"