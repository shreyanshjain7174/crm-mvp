#!/bin/bash

# Setup Fly.io secrets for external database and Redis
# Run this script after updating the values below with your actual credentials

echo "Setting up Fly.io secrets for external database and Redis..."

# Database Configuration (REQUIRED)
# Option 1: Use DATABASE_URL (recommended)
flyctl secrets set DATABASE_URL="postgresql://username:password@your-db-host:5432/dbname" --app crm-mvp

# Option 2: Use individual database variables (alternative to DATABASE_URL)
# flyctl secrets set DB_HOST="your-database-host.com" --app crm-mvp
# flyctl secrets set DB_PORT="5432" --app crm-mvp  
# flyctl secrets set DB_NAME="crm_production" --app crm-mvp
# flyctl secrets set DB_USER="crm_user" --app crm-mvp
# flyctl secrets set DB_PASSWORD="your-secure-password" --app crm-mvp

# Redis Configuration (REQUIRED)
flyctl secrets set REDIS_URL="redis://username:password@your-redis-host:6379" --app crm-mvp

# Application Configuration (REQUIRED)
flyctl secrets set JWT_SECRET="your-super-secure-jwt-secret-key-here" --app crm-mvp
flyctl secrets set NODE_ENV="production" --app crm-mvp

# Frontend URL for CORS (REQUIRED)
flyctl secrets set FRONTEND_URL="https://crm-mvp.fly.dev" --app crm-mvp

# Optional: AI Integration
# flyctl secrets set ANTHROPIC_API_KEY="your-anthropic-api-key" --app crm-mvp

# Optional: WhatsApp Integration  
# flyctl secrets set WHATSAPP_ACCESS_TOKEN="your-whatsapp-access-token" --app crm-mvp
# flyctl secrets set WHATSAPP_PHONE_NUMBER_ID="your-phone-number-id" --app crm-mvp
# flyctl secrets set WHATSAPP_WEBHOOK_VERIFY_TOKEN="your-webhook-verify-token" --app crm-mvp
# flyctl secrets set WHATSAPP_APP_SECRET="your-app-secret" --app crm-mvp

echo "Secrets setup complete!"
echo ""
echo "IMPORTANT: Update the DATABASE_URL and REDIS_URL with your actual connection strings"
echo "Then run: flyctl deploy --app crm-mvp"