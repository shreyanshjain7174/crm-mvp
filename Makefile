# CRM MVP - Development & Deployment Commands

.PHONY: help dev dev-build prod prod-build test clean deploy setup

# Default target
help:
	@echo "CRM MVP - Available Commands:"
	@echo ""
	@echo "Development:"
	@echo "  dev          - Start development environment with hot reload"
	@echo "  dev-build    - Build and start development environment"
	@echo "  test         - Run all tests"
	@echo "  setup        - Initial setup (install deps, migrate DB)"
	@echo ""
	@echo "Production:"
	@echo "  prod         - Start production environment"
	@echo "  prod-build   - Build and start production environment"
	@echo "  deploy       - Deploy to production"
	@echo ""
	@echo "Utilities:"
	@echo "  clean        - Clean up containers and volumes"
	@echo "  logs         - Show container logs"
	@echo "  shell-be     - Access backend container shell"
	@echo "  shell-fe     - Access frontend container shell"
	@echo "  db-shell     - Access database shell"

# Development Commands
dev:
	@echo "🚀 Starting development environment..."
	docker compose -f docker-compose.dev.yml up

dev-build:
	@echo "🔨 Building and starting development environment..."
	docker compose -f docker-compose.dev.yml up --build

dev-down:
	@echo "⏹️  Stopping development environment..."
	docker compose -f docker-compose.dev.yml down

# Production Commands
prod:
	@echo "🚀 Starting production environment..."
	docker compose up

prod-build:
	@echo "🔨 Building and starting production environment..."
	docker compose up --build

prod-down:
	@echo "⏹️  Stopping production environment..."
	docker compose down

# Testing
test:
	@echo "🧪 Running tests..."
	npm run test
	cd apps/backend && npm run test
	cd apps/frontend && npm run test

test-e2e:
	@echo "🧪 Running E2E tests..."
	cd apps/frontend && npm run test:e2e

# Setup Commands
setup:
	@echo "⚙️  Initial setup..."
	npm install
	cd apps/backend && npm install
	cd apps/frontend && npm install
	@echo "✅ Setup complete!"

setup-db:
	@echo "💾 Setting up database..."
	cd apps/backend && npx prisma migrate dev
	cd apps/backend && npx prisma db seed
	@echo "✅ Database setup complete!"

# Deployment
deploy:
	@echo "🚀 Deploying to production..."
	git push origin main

# Utility Commands
clean:
	@echo "🧹 Cleaning up containers and volumes..."
	docker compose down -v
	docker compose -f docker-compose.dev.yml down -v
	docker system prune -f
	docker volume prune -f

logs:
	@echo "📋 Showing container logs..."
	docker compose logs -f

logs-be:
	@echo "📋 Showing backend logs..."
	docker compose logs -f backend

logs-fe:
	@echo "📋 Showing frontend logs..."
	docker compose logs -f frontend

# Shell Access
shell-be:
	@echo "🐚 Accessing backend container..."
	docker compose exec backend sh

shell-fe:
	@echo "🐚 Accessing frontend container..."
	docker compose exec frontend sh

shell-db:
	@echo "🐚 Accessing database..."
	docker compose exec db psql -U crm_user -d crm_db

# Health Checks
health:
	@echo "🏥 Checking container health..."
	docker compose ps

# Security Scan
security-scan:
	@echo "🔒 Running security scan..."
	docker run --rm -v $(PWD):/app -w /app aquasec/trivy fs .

# Backup Database
backup-db:
	@echo "💾 Backing up database..."
	docker compose exec db pg_dump -U crm_user crm_db > backup_$(shell date +%Y%m%d_%H%M%S).sql

# Restore Database
restore-db:
	@echo "📥 Restoring database..."
	@read -p "Enter backup file path: " backup_file; \
	docker compose exec -T db psql -U crm_user -d crm_db < $$backup_file

# Performance Monitoring
monitor:
	@echo "📊 Starting performance monitoring..."
	docker stats

# Update Dependencies
update-deps:
	@echo "⬆️  Updating dependencies..."
	npm update
	cd apps/backend && npm update
	cd apps/frontend && npm update