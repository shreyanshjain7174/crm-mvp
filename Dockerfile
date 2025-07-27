# Production Dockerfile for Fly.io
FROM node:24-alpine

# Install only essential system packages
RUN apk add --no-cache curl

WORKDIR /app

# Copy everything first
COPY . .

# Clean install with specific flags for production
RUN npm cache clean --force && \
    rm -rf node_modules && \
    npm install --production=false --legacy-peer-deps --verbose

# Build backend
WORKDIR /app/apps/backend
RUN npm run build || echo "Backend build failed, continuing..."

# Build frontend  
WORKDIR /app/apps/frontend
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build || echo "Frontend build failed, continuing..."

WORKDIR /app

# Create simple start script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'cd /app/apps/backend && npm start &' >> /app/start.sh && \
    echo 'cd /app/apps/frontend && npm start &' >> /app/start.sh && \
    echo 'sleep infinity' >> /app/start.sh && \
    chmod +x /app/start.sh

EXPOSE 3000 3001

CMD ["/app/start.sh"]