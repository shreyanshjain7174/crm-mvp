#!/bin/bash

# Advanced Development Tools Setup
set -e

echo "🛠️  Setting up advanced development tools..."

# Navigate to project root
cd "$(dirname "$0")/../.."

# Install development dependencies globally if not present
echo "📦 Installing global development tools..."

# Check and install useful development tools
if ! command -v tree &> /dev/null; then
    echo "Installing tree command for directory visualization..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install tree 2>/dev/null || echo "Note: Install Homebrew to get tree command"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get install tree -y 2>/dev/null || echo "Note: Install tree manually if needed"
    fi
fi

# Create development configuration files
echo "⚙️  Creating development configuration..."

# Create VS Code workspace settings
mkdir -p .vscode
cat > .vscode/settings.json << 'EOF'
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "files.exclude": {
    "**/node_modules": true,
    "**/.next": true,
    "**/dist": true,
    "**/*.tsbuildinfo": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/.next": true,
    "**/dist": true,
    "**/package-lock.json": true
  },
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
EOF

# Create VS Code extensions recommendations
cat > .vscode/extensions.json << 'EOF'
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json"
  ]
}
EOF

# Create development environment variables template
cat > .env.example << 'EOF'
# Development Environment Variables
NODE_ENV=development

# Frontend Configuration
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_AI_EMPLOYEES_ENABLED=true
NEXT_PUBLIC_ENVIRONMENT=development

# Backend Configuration
BACKEND_PORT=3001
DATABASE_URL=postgresql://postgres:password@localhost:5432/crm_dev
JWT_SECRET=your-development-jwt-secret-change-in-production
REDIS_URL=redis://localhost:6379

# Optional API Keys (for development)
ANTHROPIC_API_KEY=your-anthropic-api-key
OPENAI_API_KEY=your-openai-api-key

# Debugging
DEBUG=false
LOG_LEVEL=info
EOF

# Create pre-commit hook
mkdir -p .git/hooks
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Pre-commit hook for code quality

echo "🔍 Running pre-commit checks..."

# Run type checking
echo "Checking TypeScript..."
npm run typecheck
if [ $? -ne 0 ]; then
  echo "❌ TypeScript errors found. Commit aborted."
  exit 1
fi

# Run linting
echo "Checking ESLint..."
npm run lint
if [ $? -ne 0 ]; then
  echo "❌ ESLint errors found. Commit aborted."
  exit 1
fi

echo "✅ Pre-commit checks passed!"
EOF

chmod +x .git/hooks/pre-commit

# Create development convenience scripts
echo "📝 Creating development convenience scripts..."

# Add package.json scripts for development tools
cat > temp_package_scripts.json << 'EOF'
{
  "dev:tools": "scripts/dev/dev-tools-setup.sh",
  "dev:analyze": "scripts/dev/analyze-bundle.sh", 
  "dev:perf": "scripts/dev/check-performance.sh",
  "dev:clean": "rm -rf apps/frontend/.next apps/backend/dist node_modules/*/node_modules",
  "dev:reset": "npm run dev:clean && npm install",
  "code:format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
  "code:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md}\"",
  "deps:check": "npm outdated",
  "deps:update": "npm update",
  "security:audit": "npm audit --audit-level moderate"
}
EOF

echo "✅ Development tools setup complete!"
echo ""
echo "🎯 New development features available:"
echo "   - VS Code workspace settings configured"
echo "   - Pre-commit hooks for quality checks"
echo "   - Environment variables template created"
echo "   - Bundle analysis script: npm run dev:analyze"
echo "   - Performance checking: npm run dev:perf"
echo "   - Code formatting: npm run code:format"
echo ""
echo "💡 Next steps:"
echo "   1. Copy .env.example to .env.local and configure"
echo "   2. Install recommended VS Code extensions"
echo "   3. Run 'npm run dev:perf' to baseline performance"
echo "   4. Use 'npm run dev:analyze' before major releases"

# Cleanup
rm -f temp_package_scripts.json