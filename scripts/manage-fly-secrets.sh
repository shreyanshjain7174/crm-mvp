#!/bin/bash

# Manage Fly.io secrets - check, list, and update

APP_NAME="crm-mvp"

case "$1" in
  "list")
    echo "Listing current secrets for app: $APP_NAME"
    flyctl secrets list --app $APP_NAME
    ;;
  "check")
    echo "Checking if required secrets are set..."
    flyctl secrets list --app $APP_NAME | grep -E "(DATABASE_URL|REDIS_URL|JWT_SECRET|NODE_ENV|FRONTEND_URL)"
    ;;
  "set-database")
    if [ -z "$2" ]; then
      echo "Usage: $0 set-database 'postgresql://user:pass@host:5432/dbname'"
      exit 1
    fi
    flyctl secrets set DATABASE_URL="$2" --app $APP_NAME
    ;;
  "set-redis")
    if [ -z "$2" ]; then
      echo "Usage: $0 set-redis 'redis://user:pass@host:6379'"
      exit 1
    fi
    flyctl secrets set REDIS_URL="$2" --app $APP_NAME
    ;;
  "set-jwt")
    if [ -z "$2" ]; then
      echo "Usage: $0 set-jwt 'your-jwt-secret'"
      exit 1
    fi
    flyctl secrets set JWT_SECRET="$2" --app $APP_NAME
    ;;
  "deploy")
    echo "Deploying after secrets update..."
    flyctl deploy --app $APP_NAME
    ;;
  "logs")
    echo "Showing recent logs..."
    flyctl logs --app $APP_NAME
    ;;
  *)
    echo "Usage: $0 {list|check|set-database|set-redis|set-jwt|deploy|logs}"
    echo ""
    echo "Examples:"
    echo "  $0 list                                    # List all secrets"
    echo "  $0 check                                   # Check required secrets"
    echo "  $0 set-database 'postgresql://...'         # Set database URL"
    echo "  $0 set-redis 'redis://...'                 # Set Redis URL"
    echo "  $0 set-jwt 'your-secret-key'               # Set JWT secret"
    echo "  $0 deploy                                   # Deploy after changes"
    echo "  $0 logs                                     # View logs"
    ;;
esac