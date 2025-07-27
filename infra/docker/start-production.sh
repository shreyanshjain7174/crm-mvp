#!/bin/sh

# Production startup script for Fly.io deployment
# Handles database initialization and service startup

echo "🚀 Starting CRM MVP on Fly.io..."

# Wait for database connection if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
    echo "⏳ Waiting for database connection..."
    until pg_isready -d "$DATABASE_URL" -t 30; do
        echo "Database is unavailable - sleeping"
        sleep 2
    done
    echo "✅ Database is ready!"
    
    # Run database migrations
    echo "🔄 Running database migrations..."
    cd /app/backend && node -e "
        const { initializeDatabase } = require('./dist/db/connection.js');
        initializeDatabase().then(() => {
            console.log('✅ Database initialized successfully');
            process.exit(0);
        }).catch(err => {
            console.error('❌ Database initialization failed:', err);
            process.exit(1);
        });
    "
fi

# Wait for Redis connection if REDIS_URL is set
if [ -n "$REDIS_URL" ]; then
    echo "⏳ Waiting for Redis connection..."
    until redis-cli -u "$REDIS_URL" ping > /dev/null 2>&1; do
        echo "Redis is unavailable - sleeping"
        sleep 2
    done
    echo "✅ Redis is ready!"
fi

# Start all services with supervisor
echo "🎯 Starting all services..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf