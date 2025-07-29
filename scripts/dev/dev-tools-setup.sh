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

# Create development environment variables template (if not exists)
if [ ! -f ".env.example" ]; then
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
else
    echo "⏭️  .env.example already exists, skipping..."
fi

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

# Note: Package.json scripts would need to be manually added to the main package.json
echo "📝 Suggested package.json scripts (add these manually):"
echo '  "dev:tools": "scripts/dev/dev-tools-setup.sh"'
echo '  "dev:analyze": "scripts/dev/analyze-bundle.sh"'
echo '  "dev:perf": "scripts/dev/check-performance.sh"'
echo '  "dev:clean": "rm -rf apps/frontend/.next apps/backend/dist node_modules/*/node_modules"'
echo '  "dev:reset": "npm run dev:clean && npm install"'
echo '  "code:format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\""'
echo '  "code:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md}\""'

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

# All tools configured