# Multi-stage optimized Dockerfile for backend-only production
# Stage 1: Dependencies installer (production only)
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app/backend

# Copy backend package.json and install production dependencies directly
COPY apps/backend/package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

# Stage 2: Builder
FROM node:22-alpine AS builder  
RUN apk add --no-cache libc6-compat make g++ python3
WORKDIR /app/backend

# Copy backend package.json and install all dependencies 
COPY apps/backend/package*.json ./
RUN npm install --legacy-peer-deps

# Copy backend source and build
COPY apps/backend/ ./
RUN npm run build

# Stage 3: Runtime
FROM node:22-alpine AS runtime
RUN apk add --no-cache curl dumb-init && \
    rm -rf /var/cache/apk/*

WORKDIR /app

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512"

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy production dependencies and built app
COPY --from=deps --chown=nodejs:nodejs /app/backend/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/backend/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/backend/types ./types
COPY --from=builder --chown=nodejs:nodejs /app/backend/package.json ./package.json

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]