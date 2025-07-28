#!/bin/bash

# Bundle Analysis Script
set -e

echo "📊 Analyzing Next.js bundle size..."

# Navigate to frontend directory
cd "$(dirname "$0")/../../apps/frontend"

# Install bundle analyzer if not present
if ! npm list @next/bundle-analyzer > /dev/null 2>&1; then
    echo "Installing bundle analyzer..."
    npm install --save-dev @next/bundle-analyzer
fi

# Create temporary config for analysis
cat > next.config.analyze.js << 'EOF'
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: true,
})

const nextConfig = require('./next.config.js')

module.exports = withBundleAnalyzer(nextConfig)
EOF

# Build with analyzer
echo "🏗️  Building with bundle analyzer..."
ANALYZE=true npx next build

# Cleanup
rm -f next.config.analyze.js

echo "✅ Bundle analysis complete!"
echo "📈 Check the opened browser tabs for detailed analysis"
echo "💡 Look for:"
echo "   - Large dependencies that could be code-split"
echo "   - Duplicate packages"
echo "   - Unused code that can be tree-shaken"