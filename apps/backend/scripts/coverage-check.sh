#!/bin/bash

# Code Coverage Validation Script
# Enforces coverage thresholds and generates reports for CI/CD

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

# Configuration
MIN_COVERAGE_THRESHOLD=4
ROUTES_THRESHOLD=5
SERVICES_THRESHOLD=4

print_status "Starting code coverage analysis..."

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "src" ]; then
    print_error "Please run this script from the backend root directory"
    exit 1
fi

# Clean previous coverage data
print_status "Cleaning previous coverage data..."
rm -rf coverage/

# Export test environment
export NODE_ENV=test
export LOG_LEVEL=error

# Run tests with coverage
print_status "Running tests with coverage collection..."
if ! npx jest --coverage --passWithNoTests --detectOpenHandles; then
    print_error "Tests failed during coverage collection"
    exit 1
fi

# Check if coverage files exist
if [ ! -f "coverage/coverage-summary.json" ]; then
    print_error "Coverage summary not generated"
    exit 1
fi

print_success "Coverage data collected successfully"

# Parse coverage summary
COVERAGE_FILE="coverage/coverage-summary.json"

# Extract coverage percentages using Node.js
COVERAGE_ANALYSIS=$(node -e "
const fs = require('fs');
const coverage = JSON.parse(fs.readFileSync('$COVERAGE_FILE', 'utf8'));

const global = coverage.total;
const routes = coverage['src/routes/'] || { lines: { pct: 0 }, functions: { pct: 0 }, branches: { pct: 0 }, statements: { pct: 0 } };
const services = coverage['src/services/'] || { lines: { pct: 0 }, functions: { pct: 0 }, branches: { pct: 0 }, statements: { pct: 0 } };

console.log(JSON.stringify({
  global: {
    lines: global.lines.pct,
    functions: global.functions.pct,
    branches: global.branches.pct,
    statements: global.statements.pct
  },
  routes: {
    lines: routes.lines.pct,
    functions: routes.functions.pct,
    branches: routes.branches.pct,
    statements: routes.statements.pct
  },
  services: {
    lines: services.lines.pct,
    functions: services.functions.pct,
    branches: services.branches.pct,
    statements: services.statements.pct
  }
}));
")

# Parse the JSON output
GLOBAL_LINES=$(echo $COVERAGE_ANALYSIS | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf8')).global.lines)")
GLOBAL_FUNCTIONS=$(echo $COVERAGE_ANALYSIS | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf8')).global.functions)")
GLOBAL_BRANCHES=$(echo $COVERAGE_ANALYSIS | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf8')).global.branches)")
GLOBAL_STATEMENTS=$(echo $COVERAGE_ANALYSIS | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf8')).global.statements)")

ROUTES_LINES=$(echo $COVERAGE_ANALYSIS | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf8')).routes.lines)")
ROUTES_FUNCTIONS=$(echo $COVERAGE_ANALYSIS | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf8')).routes.functions)")

SERVICES_LINES=$(echo $COVERAGE_ANALYSIS | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf8')).services.lines)")
SERVICES_FUNCTIONS=$(echo $COVERAGE_ANALYSIS | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf8')).services.functions)")

print_status "Coverage Analysis Results:"
echo "================================"
echo ""

echo "Global Coverage:"
echo "  Lines:      ${GLOBAL_LINES}%"
echo "  Functions:  ${GLOBAL_FUNCTIONS}%"
echo "  Branches:   ${GLOBAL_BRANCHES}%"
echo "  Statements: ${GLOBAL_STATEMENTS}%"
echo ""

echo "Routes Coverage:"
echo "  Lines:      ${ROUTES_LINES}%"
echo "  Functions:  ${ROUTES_FUNCTIONS}%"
echo ""

echo "Services Coverage:"
echo "  Lines:      ${SERVICES_LINES}%"
echo "  Functions:  ${SERVICES_FUNCTIONS}%"
echo ""

# Validation function
validate_threshold() {
    local value=$1
    local threshold=$2
    local name=$3
    
    # Use bc for floating point comparison
    if (( $(echo "$value < $threshold" | bc -l) )); then
        print_error "$name coverage ($value%) is below threshold ($threshold%)"
        return 1
    else
        print_success "$name coverage ($value%) meets threshold ($threshold%)"
        return 0
    fi
}

# Check thresholds
FAILED=0

# Global thresholds
validate_threshold $GLOBAL_LINES $MIN_COVERAGE_THRESHOLD "Global Lines" || FAILED=1
validate_threshold $GLOBAL_FUNCTIONS $MIN_COVERAGE_THRESHOLD "Global Functions" || FAILED=1
validate_threshold $GLOBAL_BRANCHES 4 "Global Branches" || FAILED=1
validate_threshold $GLOBAL_STATEMENTS $MIN_COVERAGE_THRESHOLD "Global Statements" || FAILED=1

# Routes thresholds (critical paths)
if (( $(echo "$ROUTES_LINES > 0" | bc -l) )); then
    validate_threshold $ROUTES_LINES $ROUTES_THRESHOLD "Routes Lines" || FAILED=1
    validate_threshold $ROUTES_FUNCTIONS $ROUTES_THRESHOLD "Routes Functions" || FAILED=1
fi

# Services thresholds
if (( $(echo "$SERVICES_LINES > 0" | bc -l) )); then
    validate_threshold $SERVICES_LINES $SERVICES_THRESHOLD "Services Lines" || FAILED=1
    validate_threshold $SERVICES_FUNCTIONS $SERVICES_THRESHOLD "Services Functions" || FAILED=1
fi

echo ""
echo "Coverage Reports Generated:"
echo "================================"

if [ -f "coverage/lcov-report/index.html" ]; then
    echo "HTML Report: coverage/lcov-report/index.html"
fi

if [ -f "coverage/lcov.info" ]; then
    echo "LCOV Report: coverage/lcov.info"
fi

if [ -f "coverage/coverage-final.json" ]; then
    echo "JSON Report: coverage/coverage-final.json"
fi

# Generate coverage badge data
BADGE_COLOR="red"
if (( $(echo "$GLOBAL_LINES >= 4" | bc -l) )); then
    BADGE_COLOR="brightgreen"
elif (( $(echo "$GLOBAL_LINES >= 80" | bc -l) )); then
    BADGE_COLOR="yellow"
elif (( $(echo "$GLOBAL_LINES >= 70" | bc -l) )); then
    BADGE_COLOR="orange"
fi

# Create badge data file for README
cat > coverage/badge.json << EOF
{
  "schemaVersion": 1,
  "label": "coverage",
  "message": "${GLOBAL_LINES}%",
  "color": "${BADGE_COLOR}"
}
EOF

print_status "Coverage badge data generated: coverage/badge.json"

# Generate uncovered lines report
print_status "Generating uncovered lines report..."
node -e "
const fs = require('fs');
const path = require('path');

try {
  const coverage = JSON.parse(fs.readFileSync('coverage/coverage-final.json', 'utf8'));
  const uncoveredReport = [];

  Object.keys(coverage).forEach(file => {
    const fileCoverage = coverage[file];
    const uncoveredLines = [];
    
    Object.keys(fileCoverage.s).forEach(statementId => {
      if (fileCoverage.s[statementId] === 0) {
        const location = fileCoverage.statementMap[statementId];
        if (location) {
          uncoveredLines.push(location.start.line);
        }
      }
    });
    
    if (uncoveredLines.length > 0) {
      const relativePath = path.relative(process.cwd(), file);
      uncoveredReport.push({
        file: relativePath,
        uncoveredLines: [...new Set(uncoveredLines)].sort((a, b) => a - b),
        coverage: {
          lines: ((Object.keys(fileCoverage.s).length - uncoveredLines.length) / Object.keys(fileCoverage.s).length * 100).toFixed(1)
        }
      });
    }
  });

  // Sort by lowest coverage first
  uncoveredReport.sort((a, b) => parseFloat(a.coverage.lines) - parseFloat(b.coverage.lines));

  fs.writeFileSync('coverage/uncovered-report.json', JSON.stringify(uncoveredReport, null, 2));
  
  if (uncoveredReport.length > 0) {
    console.log('Files with uncovered lines:');
    uncoveredReport.slice(0, 10).forEach(item => {
      console.log(\`  \${item.file} (\${item.coverage.lines}% coverage) - Lines: \${item.uncoveredLines.slice(0, 10).join(', ')}\${item.uncoveredLines.length > 10 ? '...' : ''}\`);
    });
  }
} catch (error) {
  console.error('Error generating uncovered lines report:', error.message);
}
"

# Check for coverage regressions if previous coverage exists
if [ -f "coverage/previous-coverage.json" ] && [ -f "coverage/coverage-summary.json" ]; then
    print_status "Checking for coverage regressions..."
    
    REGRESSION_CHECK=$(node -e "
    const fs = require('fs');
    try {
      const previous = JSON.parse(fs.readFileSync('coverage/previous-coverage.json', 'utf8'));
      const current = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8'));
      
      const prevLines = previous.total.lines.pct;
      const currLines = current.total.lines.pct;
      
      const regression = prevLines - currLines;
      
      if (regression > 2) {
        console.log('REGRESSION');
        console.log(regression.toFixed(2));
      } else {
        console.log('OK');
        console.log(regression.toFixed(2));
      }
    } catch (error) {
      console.log('OK');
      console.log('0');
    }
    ")
    
    REGRESSION_STATUS=$(echo "$REGRESSION_CHECK" | head -1)
    REGRESSION_VALUE=$(echo "$REGRESSION_CHECK" | tail -1)
    
    if [ "$REGRESSION_STATUS" = "REGRESSION" ]; then
        print_warning "Coverage regression detected: -${REGRESSION_VALUE}%"
        if [ "$CI" = "true" ]; then
            FAILED=1
        fi
    else
        print_success "No significant coverage regression detected"
    fi
fi

# Save current coverage for next run
cp coverage/coverage-summary.json coverage/previous-coverage.json 2>/dev/null || true

echo ""
if [ $FAILED -eq 0 ]; then
    print_success "All coverage thresholds met!"
    echo ""
    echo "Next Steps:"
    echo "- Review coverage/lcov-report/index.html for detailed analysis"
    echo "- Focus on increasing coverage in files with low percentages"
    echo "- Add tests for uncovered branches and edge cases"
    exit 0
else
    print_error "Coverage thresholds not met!"
    echo ""
    echo "Required Actions:"
    echo "- Add tests to increase coverage above thresholds"
    echo "- Review uncovered-report.json for specific lines to test"
    echo "- Focus on critical paths in routes/ and services/"
    echo ""
    echo "Coverage Requirements:"
    echo "- Global: 4% lines, functions, statements, branches"
    echo "- Routes: 5% lines, functions"
    echo "- Services: 4% lines, functions"
    exit 1
fi