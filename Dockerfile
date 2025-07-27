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

# Remove dev dependencies and clean up
RUN npm prune --production && \
    apk del make g++ python3 linux-headers && \
    rm -rf /var/cache/apk/* /tmp/* ~/.npm

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "Starting CRM MVP..."' >> /app/start.sh && \
    echo 'cd /app/apps/backend && node dist/index.js &' >> /app/start.sh && \
    echo 'BACKEND_PID=$!' >> /app/start.sh && \
    echo 'cd /app/apps/frontend && npm start &' >> /app/start.sh && \
    echo 'FRONTEND_PID=$!' >> /app/start.sh && \
    echo 'echo "Services started: Backend=$BACKEND_PID Frontend=$FRONTEND_PID"' >> /app/start.sh && \
    echo 'wait $BACKEND_PID $FRONTEND_PID' >> /app/start.sh && \
    chmod +x /app/start.sh

EXPOSE 3000 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000 || curl -f http://localhost:3001/health || exit 1

CMD ["/app/start.sh"]