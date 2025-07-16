# Frontend Dockerfile - Optimized Multi-stage Build
FROM node:18-alpine AS deps

# Install dependencies, setup workspace, and install packages
RUN apk add --no-cache libc6-compat && rm -rf /var/cache/apk/*
WORKDIR /app
COPY package*.json ./
RUN npm ci --frozen-lockfile && npm cache clean --force

# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production stage - Ultra lightweight
FROM node:18-alpine AS runner

# Install runtime deps, create user, and setup environment
RUN apk add --no-cache dumb-init && \
    rm -rf /var/cache/apk/* && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME="0.0.0.0"

# Copy production files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user, add health check, and start
USER nextjs
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "const http=require('http');const req=http.request({host:'localhost',port:3000,path:'/health',timeout:5000},res=>process.exit(res.statusCode===200?0:1));req.on('error',()=>process.exit(1));req.end();"

EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]