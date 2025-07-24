#!/bin/bash

# Quick Commit Script with Full CI Validation
# Automates the complete commit workflow with quality checks

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if commit message is provided
if [ -z "$1" ]; then
    print_error "Please provide a commit message"
    echo "Usage: ./scripts/quick-commit.sh \"your commit message\""
    echo "Example: ./scripts/quick-commit.sh \"fix: resolve user authentication issue\""
    exit 1
fi

COMMIT_MESSAGE="$1"

print_status "Starting quick commit workflow with CI validation..."

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not in a git repository"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "src" ]; then
    print_error "Please run this script from the backend root directory"
    exit 1
fi

# Track timing
START_TIME=$(date +%s)

print_status "Step 1/6: Running comprehensive CI checks..."
if ./scripts/check-ci.sh; then
    print_success "All CI checks passed"
else
    print_error "CI checks failed - cannot commit"
    exit 1
fi

print_status "Step 2/6: Checking git status..."
if ! git diff --quiet || ! git diff --cached --quiet; then
    print_status "Changes detected, proceeding with commit"
else
    print_warning "No changes to commit"
    exit 0
fi

print_status "Step 3/6: Adding all changes to staging..."
git add .

print_status "Step 4/6: Showing staged changes..."
echo ""
echo "Staged changes:"
echo "==============="
git diff --cached --stat
echo ""

print_status "Step 5/6: Creating signed commit..."
if git commit -s -m "$COMMIT_MESSAGE"; then
    print_success "Commit created successfully"
else
    print_error "Commit failed"
    exit 1
fi

print_status "Step 6/6: Showing commit details..."
echo ""
echo "Commit Details:"
echo "==============="
git log -1 --oneline
git log -1 --stat
echo ""

# Calculate total time
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

print_success "Quick commit completed successfully in ${DURATION}s!"

echo ""
echo "Workflow Summary:"
echo "================="
echo "✓ CI Validation (lint, typecheck, tests, coverage)"
echo "✓ All changes staged"
echo "✓ Signed commit created"
echo "✓ Changes verified"

echo ""
echo "Next Steps:"
echo "==========="
echo "- Review commit: git show HEAD"
echo "- Push to remote: git push origin $(git branch --show-current)"
echo "- Create pull request if needed"

# Optional: Show current branch status
CURRENT_BRANCH=$(git branch --show-current)
UPSTREAM=$(git rev-parse --abbrev-ref @{u} 2>/dev/null || echo "no-upstream")

if [ "$UPSTREAM" != "no-upstream" ]; then
    COMMITS_AHEAD=$(git rev-list --count HEAD ^$UPSTREAM 2>/dev/null || echo "0")
    COMMITS_BEHIND=$(git rev-list --count $UPSTREAM ^HEAD 2>/dev/null || echo "0")
    
    echo ""
    echo "Branch Status:"
    echo "=============="
    echo "Current branch: $CURRENT_BRANCH"
    echo "Upstream: $UPSTREAM"
    echo "Commits ahead: $COMMITS_AHEAD"
    echo "Commits behind: $COMMITS_BEHIND"
fi

exit 0