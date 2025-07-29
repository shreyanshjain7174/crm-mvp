#!/bin/bash

# Performance Check Script
set -e

echo "⚡ Running comprehensive performance checks..."

# Navigate to project root
cd "$(dirname "$0")/../.."

echo "🔍 1. Checking TypeScript compilation performance..."
time npm run typecheck

echo ""
echo "🔍 2. Checking ESLint performance..."
time npm run lint

echo ""
echo "🔍 3. Analyzing package sizes..."
echo "Frontend dependencies:"
if [ -d "apps/frontend" ]; then
    cd apps/frontend && npm list --depth=0 --parseable 2>/dev/null | wc -l | awk '{print "  Total packages: " $1}' || echo "  Could not count packages"
    cd ../..
else
    echo "  Frontend directory not found"
fi

echo "Backend dependencies:"
if [ -d "apps/backend" ]; then
    cd apps/backend && npm list --depth=0 --parseable 2>/dev/null | wc -l | awk '{print "  Total packages: " $1}' || echo "  Could not count packages"
    cd ../..
else
    echo "  Backend directory not found"
fi

cd ../..

echo ""
echo "🔍 4. Checking for large files..."
echo "Largest files in codebase:"
find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \
  | grep -v node_modules \
  | grep -v .next \
  | grep -v dist \
  | xargs wc -l \
  | sort -nr \
  | head -10

echo ""
echo "🔍 5. Build performance test..."
if [ -d "apps/frontend" ]; then
    echo "Frontend build time:"
    cd apps/frontend
    time npm run build > /dev/null 2>&1 || echo "  Frontend build failed"
    cd ../..
else
    echo "Frontend directory not found, skipping build test"
fi

if [ -d "apps/backend" ]; then
    echo "Backend build time:"
    cd apps/backend
    time npm run build > /dev/null 2>&1 || echo "  Backend build failed"
    cd ../..
else
    echo "Backend directory not found, skipping build test"
fi

echo ""
echo "✅ Performance analysis complete!"
echo "📊 Summary recommendations:"
echo "   - Monitor files over 500 lines for refactoring opportunities"
echo "   - Keep build times under 2 minutes for good DX"
echo "   - Consider code splitting for large components"