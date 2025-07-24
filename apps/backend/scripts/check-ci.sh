#!/bin/bash

# Comprehensive CI Check Script
# Runs all quality checks with coverage validation

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

print_status "Starting comprehensive CI validation..."

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "src" ]; then
    print_error "Please run this script from the backend root directory"
    exit 1
fi

# Track timing
START_TIME=$(date +%s)

# Step 1: ESLint
print_status "1/4 Running ESLint..."
if npm run lint; then
    print_success "ESLint validation passed"
else
    print_error "ESLint validation failed"
    exit 1
fi

# Step 2: TypeScript Check
print_status "2/4 Running TypeScript check..."
if npm run typecheck; then
    print_success "TypeScript validation passed"
else
    print_error "TypeScript validation failed"
    exit 1
fi

# Step 3: Tests with Coverage
print_status "3/4 Running tests with coverage validation..."
if npm run coverage:check; then
    print_success "Tests and coverage validation passed"
else
    print_error "Tests or coverage validation failed"
    exit 1
fi

# Step 4: Build Check
print_status "4/4 Running build check..."
if npm run build; then
    print_success "Build check passed"
else
    print_error "Build check failed"
    exit 1
fi

# Calculate total time
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
print_success "All CI checks completed successfully in ${DURATION}s!"

echo ""
echo "CI Validation Summary:"
echo "======================"
echo "✓ ESLint: Code style and quality"
echo "✓ TypeScript: Type safety validation"
echo "✓ Tests: Functionality and coverage thresholds"
echo "✓ Build: Production readiness"

if [ -f "coverage/lcov-report/index.html" ]; then
    echo ""
    echo "Coverage Report: coverage/lcov-report/index.html"
fi

echo ""
echo "Ready for deployment!"

exit 0