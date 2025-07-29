# Optimized multi-stage Dockerfile for backend-only production
# Target: <200MB final image size

# Stage 1: Ultra-minimal dependencies installer
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy and install production dependencies only
COPY apps/backend/package*.json ./
RUN npm ci --omit=dev --omit=optional --no-audit --no-fund \
    && npm cache clean --force \
    && rm -rf ~/.npm

# Stage 2: Minimal builder
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat make g++ python3
WORKDIR /app

# Install all dependencies for building
COPY apps/backend/package*.json ./
RUN npm ci --no-audit --no-fund

# Copy source and build with optimizations
COPY apps/backend/ ./
RUN npm run build \
    && npm prune --production \
    && npm cache clean --force \
    && rm -rf ~/.npm \
    && rm -rf src/ \
    && rm -rf node_modules/@types \
    && rm -rf node_modules/.cache

# Stage 3: Ultra-minimal runtime (distroless-style)
FROM node:22-alpine AS runtime

# Install only essential runtime dependencies
RUN apk add --no-cache \
    dumb-init \
    curl \
    tini \
    && rm -rf /var/cache/apk/* \
    && rm -rf /tmp/* \
    && rm -rf /usr/share/man \
    && rm -rf /usr/share/doc

WORKDIR /app

# Optimized environment variables
ENV NODE_ENV=production \
    NODE_OPTIONS="--max-old-space-size=256 --enable-source-maps=false" \
    NPM_CONFIG_LOGLEVEL=warn \
    TINI_SUBREAPER=true

# Create minimal non-root user
RUN addgroup -g 1001 -S nodejs \
    && adduser -S nodejs -u 1001 -G nodejs

# Copy only essential files with minimal permissions
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json

# Remove unnecessary files to minimize image size
RUN find ./node_modules -name "*.md" -delete \
    && find ./node_modules -name "*.ts" -delete \
    && find ./node_modules -name "test" -type d -exec rm -rf {} + \
    && find ./node_modules -name "tests" -type d -exec rm -rf {} + \
    && find ./node_modules -name "*.map" -delete \
    && find ./node_modules -name "LICENSE*" -delete \
    && find ./node_modules -name "CHANGELOG*" -delete \
    && rm -rf ./node_modules/.bin \
    && rm -rf ./node_modules/.cache

USER nodejs

EXPOSE 3000

# Optimized healthcheck
HEALTHCHECK --interval=45s --timeout=5s --start-period=20s --retries=2 \
    CMD curl -sf http://localhost:3000/health || exit 1

# Use tini for proper signal handling
ENTRYPOINT ["tini", "--"]
CMD ["node", "--enable-source-maps=false", "dist/index.js"]