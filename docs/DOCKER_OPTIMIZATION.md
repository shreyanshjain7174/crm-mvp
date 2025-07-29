# Docker Image Optimization Guide

## 🎯 Optimization Goals

- **Target Size**: <200MB (from 622MB) - 68% reduction
- **Build Time**: <3 minutes
- **Security**: Minimal attack surface
- **Performance**: Optimized runtime

## 📊 Optimization Techniques Applied

### 1. Multi-stage Build Optimization

```dockerfile
# Stage 1: Ultra-minimal dependencies installer
FROM node:22-alpine AS deps
# Only production dependencies, clean cache immediately

# Stage 2: Minimal builder  
FROM node:22-alpine AS builder
# Build and prune in same layer, remove dev files

# Stage 3: Ultra-minimal runtime
FROM node:22-alpine AS runtime
# Copy only essentials, aggressive cleanup
```

### 2. Dependency Optimization

#### Production Dependencies Only
```bash
npm ci --omit=dev --omit=optional --no-audit --no-fund
```

#### Aggressive Cleanup
```bash
# Remove unnecessary files after copy
find ./node_modules -name "*.md" -delete
find ./node_modules -name "*.ts" -delete  
find ./node_modules -name "test" -type d -exec rm -rf {} +
find ./node_modules -name "*.map" -delete
rm -rf ./node_modules/.bin
rm -rf ./node_modules/.cache
```

### 3. Base Image Optimization

- **Alpine Linux**: 5MB base vs 900MB+ for full Ubuntu
- **Node 22 Alpine**: Latest LTS with minimal footprint
- **System packages**: Only essential runtime dependencies

### 4. Runtime Optimization

#### Memory Limits
```dockerfile
ENV NODE_OPTIONS="--max-old-space-size=256 --enable-source-maps=false"
```

#### Process Management
```dockerfile
ENTRYPOINT ["tini", "--"]
CMD ["node", "--enable-source-maps=false", "dist/index.js"]
```

### 5. Build Context Optimization

#### .dockerignore Exclusions
- Frontend app (not needed for backend image)
- Development tools and configs
- Documentation and examples  
- Test files and coverage reports
- Package manager lock files
- IDE configurations

### 6. Layer Optimization

#### Efficient Layer Ordering
1. Base system packages (rarely change)
2. Package.json and dependencies (change moderately)
3. Application code (changes frequently)

#### Combined Commands
```dockerfile
RUN apk add --no-cache dumb-init curl tini \
    && rm -rf /var/cache/apk/* \
    && rm -rf /tmp/* \
    && rm -rf /usr/share/man \
    && rm -rf /usr/share/doc
```

## 🔧 Build Commands

### Standard Build
```bash
docker build -t crm-backend:latest .
```

### Optimized Build with BuildKit
```bash
DOCKER_BUILDKIT=1 docker build \
  --target runtime \
  --platform linux/amd64 \
  -t crm-backend:optimized .
```

### Multi-platform Build
```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --target runtime \
  -t crm-backend:multi-arch .
```

## 📈 Expected Size Reduction

| Component | Before | After | Reduction |
|-----------|--------|-------|-----------|
| Base Image | ~180MB | ~5MB | 97% |
| Node.js | ~50MB | ~40MB | 20% |
| Dependencies | ~300MB | ~100MB | 67% |
| Application | ~80MB | ~40MB | 50% |
| **Total** | **~622MB** | **~185MB** | **70%** |

## 🛡️ Security Improvements

### 1. Non-root User
```dockerfile
RUN addgroup -g 1001 -S nodejs \
    && adduser -S nodejs -u 1001 -G nodejs
USER nodejs
```

### 2. Minimal Attack Surface
- No shell utilities beyond essentials
- No development tools in runtime
- No source code in final image

### 3. Process Management
- Proper signal handling with `tini`
- PID 1 protection
- Graceful shutdown

## ⚡ Performance Optimizations

### 1. Memory Management
```dockerfile
ENV NODE_OPTIONS="--max-old-space-size=256"
```

### 2. Health Check Optimization
```dockerfile
HEALTHCHECK --interval=45s --timeout=5s --start-period=20s --retries=2 \
    CMD curl -sf http://localhost:3000/health || exit 1
```

### 3. Build Cache Optimization
- Layer ordering for maximum cache hits
- Separate dependency installation from code copying
- Clean operations in same RUN command

## 🚀 Deployment Strategies

### 1. Fly.io Deployment
```bash
# Optimized for Fly.io
fly deploy --build-arg NODE_ENV=production
```

### 2. Railway Deployment
```bash
# Optimized for Railway
railway up --dockerfile
```

### 3. Generic Container Platform
```bash
docker run -d \
  --name crm-backend \
  --memory=512m \
  --cpus=0.5 \
  -p 3000:3000 \
  crm-backend:optimized
```

## 📊 Monitoring & Validation

### 1. Image Size Validation
```bash
# Check final image size
docker images crm-backend:optimized

# Analyze layers
docker history crm-backend:optimized
```

### 2. Security Scanning
```bash
# Scan for vulnerabilities
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image crm-backend:optimized
```

### 3. Performance Testing
```bash
# Memory usage
docker stats crm-backend

# Startup time
time docker run --rm crm-backend:optimized node --version
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Missing Dependencies
**Problem**: Runtime errors for missing packages
**Solution**: Verify production dependencies are included

#### 2. Permission Issues  
**Problem**: File access denied
**Solution**: Check file ownership in COPY commands

#### 3. Large Image Size
**Problem**: Image still larger than expected
**Solution**: Use `docker history` to identify large layers

### Debugging Commands

```bash
# Inspect image contents
docker run -it --entrypoint /bin/sh crm-backend:optimized

# Check file sizes
docker run --rm crm-backend:optimized du -sh /app/*

# Verify dependencies
docker run --rm crm-backend:optimized npm list --production
```

## 📚 Additional Resources

- [Docker Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Alpine Linux Packages](https://pkgs.alpinelinux.org/packages)
- [Node.js Docker Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [Docker Security Best Practices](https://docs.docker.com/develop/security-best-practices/)

---

## ✅ Validation Checklist

- [ ] Image size < 200MB
- [ ] Build time < 3 minutes  
- [ ] No security vulnerabilities
- [ ] Proper signal handling
- [ ] Non-root user
- [ ] Health check functional
- [ ] Production dependencies only
- [ ] Clean layer structure