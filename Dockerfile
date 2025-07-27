# Highly optimized multi-stage Dockerfile for Fly.io
# Target: <500MB final image size

# Build stage
FROM node:22-alpine AS builder

# Install build dependencies
RUN apk add --no-cache make g++ python3 linux-headers

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY apps/frontend/package*.json ./apps/frontend/
COPY packages/ ./packages/

# Install all dependencies (including dev)
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

# Production stage
FROM node:22-alpine AS runtime

# Install only runtime dependencies
RUN apk add --no-cache curl dumb-init

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY apps/frontend/package*.json ./apps/frontend/
COPY packages/ ./packages/

# Install production dependencies only
RUN npm ci --only=production --legacy-peer-deps && \
    npm cache clean --force && \
    rm -rf /tmp/*

# Copy built applications from builder stage
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/frontend/.next ./apps/frontend/.next
COPY --from=builder /app/apps/frontend/public ./apps/frontend/public
COPY --from=builder /app/apps/frontend/next.config.js ./apps/frontend/
COPY --from=builder /app/apps/backend/src/db/migrations ./apps/backend/src/db/migrations

# Create lightweight startup script
RUN echo '#!/bin/sh\n\
echo "Starting CRM MVP..."\n\
cd /app/apps/backend && node dist/index.js &\n\
BACKEND_PID=$!\n\
cd /app/apps/frontend && npm start &\n\
FRONTEND_PID=$!\n\
echo "Services started: Backend=$BACKEND_PID Frontend=$FRONTEND_PID"\n\
wait $BACKEND_PID $FRONTEND_PID' > /app/start.sh && chmod +x /app/start.sh

# Remove unnecessary files to reduce image size
RUN rm -rf \
    /usr/local/share/.cache \
    /usr/local/share/man \
    /usr/local/share/doc \
    /var/cache/apk/* \
    /tmp/* \
    ~/.npm

EXPOSE 3000 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000 || curl -f http://localhost:3001/health || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["/app/start.sh"]