# Optimized single-stage Dockerfile for Fly.io
# Target: Stable deployment with reasonable size

FROM node:22-alpine

# Install essential dependencies
RUN apk add --no-cache curl make g++ python3 linux-headers

WORKDIR /app

# Copy package files for better caching
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY apps/frontend/package*.json ./apps/frontend/
COPY packages/ ./packages/

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code  
COPY . .

# Build backend
WORKDIR /app/apps/backend
RUN npm run build

# Build frontend
WORKDIR /app/apps/frontend
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# Back to root
WORKDIR /app

# Copy TypeScript definitions that are needed at runtime
COPY apps/backend/types ./apps/backend/types

# Remove dev dependencies and clean up  
RUN npm prune --production && \
    apk del make g++ python3 linux-headers && \
    rm -rf /var/cache/apk/* /tmp/* ~/.npm

# Create robust startup script with crash handling
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'set -e' >> /app/start.sh && \
    echo 'echo "Starting CRM MVP..."' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Function to cleanup and exit' >> /app/start.sh && \
    echo 'cleanup() {' >> /app/start.sh && \
    echo '  echo "Received signal, shutting down..."' >> /app/start.sh && \
    echo '  if [ ! -z "$BACKEND_PID" ]; then' >> /app/start.sh && \
    echo '    echo "Stopping backend (PID: $BACKEND_PID)..."' >> /app/start.sh && \
    echo '    kill $BACKEND_PID 2>/dev/null || true' >> /app/start.sh && \
    echo '  fi' >> /app/start.sh && \
    echo '  if [ ! -z "$FRONTEND_PID" ]; then' >> /app/start.sh && \
    echo '    echo "Stopping frontend (PID: $FRONTEND_PID)..."' >> /app/start.sh && \
    echo '    kill $FRONTEND_PID 2>/dev/null || true' >> /app/start.sh && \
    echo '  fi' >> /app/start.sh && \
    echo '  exit 1' >> /app/start.sh && \
    echo '}' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Set up signal handlers' >> /app/start.sh && \
    echo 'trap cleanup TERM INT QUIT' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Start backend' >> /app/start.sh && \
    echo 'echo "Starting backend on port 3001..."' >> /app/start.sh && \
    echo 'cd /app/apps/backend && node dist/index.js &' >> /app/start.sh && \
    echo 'BACKEND_PID=$!' >> /app/start.sh && \
    echo 'echo "Backend started with PID: $BACKEND_PID"' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Start frontend' >> /app/start.sh && \
    echo 'echo "Starting frontend on port 3000..."' >> /app/start.sh && \
    echo 'cd /app/apps/frontend && npm start &' >> /app/start.sh && \
    echo 'FRONTEND_PID=$!' >> /app/start.sh && \
    echo 'echo "Frontend started with PID: $FRONTEND_PID"' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Monitor processes and exit if either crashes' >> /app/start.sh && \
    echo 'while true; do' >> /app/start.sh && \
    echo '  sleep 5' >> /app/start.sh && \
    echo '  if ! kill -0 $BACKEND_PID 2>/dev/null; then' >> /app/start.sh && \
    echo '    echo "Backend crashed! Shutting down all services..."' >> /app/start.sh && \
    echo '    cleanup' >> /app/start.sh && \
    echo '  fi' >> /app/start.sh && \
    echo '  if ! kill -0 $FRONTEND_PID 2>/dev/null; then' >> /app/start.sh && \
    echo '    echo "Frontend crashed! Shutting down all services..."' >> /app/start.sh && \
    echo '    cleanup' >> /app/start.sh && \
    echo '  fi' >> /app/start.sh && \
    echo 'done' >> /app/start.sh && \
    chmod +x /app/start.sh

EXPOSE 3000 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000 || curl -f http://localhost:3001/health || exit 1

CMD ["/app/start.sh"]