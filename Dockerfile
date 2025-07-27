# Simplified optimized Dockerfile for Fly.io
# Fixing both image size and runtime issues

FROM node:22-alpine

# Install essential dependencies including build tools
RUN apk add --no-cache \
    curl \
    make \
    g++ \
    python3 \
    linux-headers

WORKDIR /app

# Copy package files for better layer caching
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY apps/frontend/package*.json ./apps/frontend/
COPY packages/ ./packages/

# Install dependencies with production optimizations
RUN npm ci --legacy-peer-deps --production=false && \
    npm cache clean --force

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

# Clean up development dependencies and build tools to reduce size
WORKDIR /app
RUN npm prune --production && \
    apk del make g++ python3 linux-headers && \
    rm -rf /var/cache/apk/* && \
    rm -rf /tmp/* && \
    rm -rf ~/.npm

# Create optimized startup script
RUN echo '#!/bin/sh\n\
echo "Starting CRM MVP Production Server..."\n\
echo "Backend starting on port 3001..."\n\
cd /app/apps/backend && node dist/index.js &\n\
BACKEND_PID=$!\n\
echo "Frontend starting on port 3000..."\n\
cd /app/apps/frontend && npm start &\n\
FRONTEND_PID=$!\n\
echo "Both services started. PIDs: Backend=$BACKEND_PID, Frontend=$FRONTEND_PID"\n\
wait $BACKEND_PID $FRONTEND_PID' > /app/start.sh && \
    chmod +x /app/start.sh

EXPOSE 3000 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/health || curl -f http://localhost:3001/health || exit 1

CMD ["/app/start.sh"]