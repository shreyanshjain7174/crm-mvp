# Frontend Dockerfile - Optimized Multi-stage Build
FROM node:18-alpine AS deps

# Install dependencies, setup workspace, and install packages
RUN apk add --no-cache libc6-compat && rm -rf /var/cache/apk/*
WORKDIR /app

# Copy root package.json and lock file first
COPY package*.json ./

# Copy frontend-specific package.json
COPY apps/frontend/package*.json ./apps/frontend/

# Install dependencies using workspace with better caching
RUN npm ci --frozen-lockfile --prefer-offline && npm cache clean --force

# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Copy all source code
COPY . .

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Build the frontend
WORKDIR /app/apps/frontend
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 DOCKER_BUILD=true
RUN npm run build

# Production stage - Ultra lightweight
FROM node:18-alpine AS runner

# Install runtime deps, create user, and setup environment
RUN apk add --no-cache dumb-init && \
    rm -rf /var/cache/apk/* && \
    addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup appuser

WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME="0.0.0.0"

# Copy production files
COPY --from=builder /app/apps/frontend/public ./public
COPY --from=builder --chown=appuser:appgroup /app/apps/frontend/.next/standalone ./
COPY --from=builder --chown=appuser:appgroup /app/apps/frontend/.next/static ./.next/static

# Switch to non-root user, add health check, and start
USER appuser
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "const http=require('http');const req=http.request({host:'localhost',port:3000,path:'/health',timeout:5000},res=>process.exit(res.statusCode===200?0:1));req.on('error',()=>process.exit(1));req.end();"

EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]