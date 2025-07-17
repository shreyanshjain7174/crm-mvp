# Backend Dockerfile - Optimized Multi-stage Build
FROM node:18-slim AS deps

# Install dependencies, setup workspace, install packages, and generate Prisma client
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy root package.json and lock file first
COPY package*.json ./

# Copy backend-specific package.json
COPY apps/backend/package*.json ./apps/backend/

# Copy prisma schema
COPY apps/backend/prisma ./apps/backend/prisma/

# Install all dependencies (including dev dependencies for build)
RUN npm ci --frozen-lockfile --prefer-offline && \
    npm cache clean --force

# Generate Prisma client
WORKDIR /app/apps/backend
RUN npx prisma generate

# Build stage
FROM node:18-slim AS builder
WORKDIR /app

# Copy all source code
COPY . .

# Copy node_modules from deps stage (includes workspace dependencies)
COPY --from=deps /app/node_modules ./node_modules

# Build the backend from root directory using npm workspace
RUN npm run build:backend

# Production dependencies stage
FROM node:18-slim AS prod-deps

RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy root package.json and lock file first
COPY package*.json ./

# Copy backend-specific package.json
COPY apps/backend/package*.json ./apps/backend/

# Copy prisma schema
COPY apps/backend/prisma ./apps/backend/prisma/

# Install only production dependencies
RUN npm ci --only=production --frozen-lockfile --prefer-offline && \
    npm cache clean --force

# Generate Prisma client
WORKDIR /app/apps/backend
RUN npx prisma generate

# Production stage - Ultra lightweight
FROM node:18-slim AS runner

# Install dependencies, create user, and setup workspace in one layer
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    tini \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 1001 appuser \
    && useradd --system --uid 1001 -g appuser appuser

WORKDIR /app

# Copy files and generate Prisma client
COPY --from=prod-deps --chown=appuser:appuser /app/node_modules ./node_modules
COPY --from=prod-deps --chown=appuser:appuser /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder --chown=appuser:appuser /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder --chown=appuser:appuser /app/apps/backend/package*.json ./apps/backend/

# Generate Prisma client
WORKDIR /app/apps/backend
RUN npx prisma generate

# Switch to non-root user
USER appuser

# Health check, expose port, and start application
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "const http=require('http');const req=http.request({host:'localhost',port:3001,path:'/health',timeout:5000},res=>process.exit(res.statusCode===200?0:1));req.on('error',()=>process.exit(1));req.end();"

EXPOSE 3001
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "apps/backend/dist/index.js"]