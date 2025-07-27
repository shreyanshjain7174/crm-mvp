#!/bin/bash

# Setup with external free services (more cost-effective)

echo "🌐 Setting up external database and Redis services..."
echo ""
echo "Option 1: Neon + Upstash (Free tiers)"
echo "1. Go to https://neon.tech - Create free PostgreSQL database"
echo "2. Go to https://upstash.com - Create free Redis database"
echo "3. Get connection strings and run:"
echo ""
echo "flyctl secrets set DATABASE_URL='postgresql://user:pass@host/db' --app crm-mvp"
echo "flyctl secrets set REDIS_URL='redis://user:pass@host:port' --app crm-mvp"
echo "flyctl secrets set JWT_SECRET='$(openssl rand -base64 64)' --app crm-mvp"
echo "flyctl secrets set NODE_ENV='production' --app crm-mvp"
echo "flyctl secrets set FRONTEND_URL='https://crm-mvp.fly.dev' --app crm-mvp"
echo ""
echo "Then deploy: flyctl deploy --app crm-mvp"
echo ""
echo "Option 2: Deploy own containers on Fly.io (costs more)"
echo "Run: ./scripts/deploy-fly-stack.sh"