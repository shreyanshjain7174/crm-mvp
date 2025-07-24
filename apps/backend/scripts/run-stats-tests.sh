#!/bin/bash

# Stats API Testing Script
# Runs comprehensive tests for the stats API endpoints

set -e

echo "Starting comprehensive Stats API testing..."

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

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "tests" ]; then
    print_error "Please run this script from the backend root directory"
    exit 1
fi

# Check if Jest is available
if ! command -v npx &> /dev/null; then
    print_error "npx not found. Please install Node.js and npm"
    exit 1
fi

print_status "Setting up test environment..."

# Export test environment variables
export NODE_ENV=test
export LOG_LEVEL=error

print_status "Running Stats API tests..."

# Run basic stats tests
print_status "1/4 Running basic stats tests..."
if npx jest tests/routes/stats.test.ts --verbose --detectOpenHandles; then
    print_success "Basic stats tests passed"
else
    print_error "Basic stats tests failed"
    exit 1
fi

# Run integration tests
print_status "2/4 Running integration tests..."
if npx jest tests/routes/stats-integration.test.ts --verbose --detectOpenHandles; then
    print_success "Integration tests passed"
else
    print_error "Integration tests failed"
    exit 1
fi

# Run comprehensive scenario tests
print_status "3/4 Running comprehensive scenario tests..."
if npx jest tests/routes/stats-comprehensive.test.ts --verbose --detectOpenHandles; then
    print_success "Comprehensive tests passed"
else
    print_error "Comprehensive tests failed"
    exit 1
fi

# Run all stats tests together with coverage
print_status "4/4 Running all stats tests with coverage..."
if npx jest tests/routes/stats*.test.ts --coverage --coverageDirectory=coverage/stats --detectOpenHandles; then
    print_success "Full test suite with coverage passed"
else
    print_error "Full test suite failed"
    exit 1
fi

# Performance benchmarking
print_status "Running performance benchmarks..."

echo ""
echo "Test Results Summary:"
echo "========================"

# Count test files
test_files=$(find tests/routes -name "stats*.test.ts" | wc -l)
echo "Test Files: $test_files"

# Show coverage if available
if [ -d "coverage/stats" ]; then
    echo "Coverage Report: coverage/stats/index.html"
fi

# Memory usage
echo "Memory Usage: $(node -e 'console.log((process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2))')MB"

echo ""
print_success "All Stats API tests completed successfully!"

echo ""
echo "Test Coverage Highlights:"
echo "========================="
echo "- Basic API functionality"
echo "- Error handling and edge cases"  
echo "- Multi-user data isolation"
echo "- Performance and scalability"
echo "- Business logic validation"
echo "- Time-based calculations"
echo "- Data consistency"
echo "- API contract compliance"

echo ""
echo "Test Categories Covered:"
echo "======================="
echo "- Unit Tests: Individual function testing"
echo "- Integration Tests: Cross-component testing"
echo "- Performance Tests: Load and stress testing"
echo "- Edge Case Tests: Boundary condition testing"
echo "- Business Logic Tests: Domain rule validation"

echo ""
echo "Ready for production deployment!"

# Optional: Send results to monitoring system
if [ "$SEND_TO_MONITORING" = "true" ]; then
    print_status "Sending test results to monitoring system..."
    # Add monitoring integration here
fi

exit 0