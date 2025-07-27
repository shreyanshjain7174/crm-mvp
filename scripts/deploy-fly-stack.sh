#!/bin/bash

# Deploy complete stack to Fly.io (PostgreSQL + Redis + App)

set -e

echo "🚀 Deploying complete CRM stack to Fly.io..."

# Deploy PostgreSQL
echo "📊 Deploying PostgreSQL..."
cd infra/fly
flyctl apps create crm-mvp-postgres --org personal || echo "PostgreSQL app already exists"
flyctl volumes create postgres_data --region bom --size 3 --app crm-mvp-postgres || echo "Volume may already exist"
flyctl secrets set POSTGRES_PASSWORD="$(openssl rand -base64 32)" --app crm-mvp-postgres
flyctl deploy --config postgres.fly.toml --app crm-mvp-postgres

# Deploy Redis  
echo "⚡ Deploying Redis..."
flyctl apps create crm-mvp-redis --org personal || echo "Redis app already exists"
flyctl volumes create redis_data --region bom --size 1 --app crm-mvp-redis || echo "Volume may already exist"
flyctl deploy --config redis.fly.toml --app crm-mvp-redis

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Get internal connection strings
echo "🔗 Setting up connection strings..."
POSTGRES_HOST=$(flyctl info --app crm-mvp-postgres --json | jq -r '.Hostname')
REDIS_HOST=$(flyctl info --app crm-mvp-redis --json | jq -r '.Hostname')

# Set secrets for main app
cd ../../
flyctl secrets set DATABASE_URL="postgresql://crm_user:$(flyctl secrets list --app crm-mvp-postgres | grep POSTGRES_PASSWORD | cut -d' ' -f1)@${POSTGRES_HOST}:5432/crm_production" --app crm-mvp
flyctl secrets set REDIS_URL="redis://${REDIS_HOST}:6379" --app crm-mvp
flyctl secrets set JWT_SECRET="$(openssl rand -base64 64)" --app crm-mvp
flyctl secrets set NODE_ENV="production" --app crm-mvp
flyctl secrets set FRONTEND_URL="https://crm-mvp.fly.dev" --app crm-mvp

# Deploy main application
echo "🎯 Deploying main application..."
flyctl deploy --app crm-mvp

echo "✅ Complete stack deployed!"
echo ""
echo "📱 Main App: https://crm-mvp.fly.dev"
echo "📊 PostgreSQL: ${POSTGRES_HOST}:5432"
echo "⚡ Redis: ${REDIS_HOST}:6379"