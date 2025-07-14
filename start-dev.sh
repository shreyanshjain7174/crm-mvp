#!/bin/bash

echo "🚀 Starting CRM MVP Development Environment..."

# Check if PostgreSQL and Redis are running
if ! pgrep -x "postgres" > /dev/null; then
    echo "📊 Starting PostgreSQL..."
    brew services start postgresql@15
fi

if ! pgrep -x "redis-server" > /dev/null; then
    echo "🔴 Starting Redis..."
    brew services start redis
fi

# Wait a moment for services to start
sleep 2

echo "🔧 Backend starting on http://localhost:3001"
echo "🌐 Frontend starting on http://localhost:3000"
echo "📡 Socket.io server on http://localhost:3002"
echo ""
echo "To stop: Ctrl+C or run 'pkill -f \"npm run dev\"'"
echo ""

# Start both frontend and backend
npm run dev