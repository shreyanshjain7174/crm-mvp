# 🚀 Deployment Guide

This guide covers various deployment options for the CRM MVP, from local development to production hosting.

## 🆓 Free Hosting Options (2025 Updated)

### 1. Render (Best Overall Choice)
Render emerges as the top choice in 2025 with robust free tier and managed services.

**Features:**
- ✅ 750 hours/month runtime (no sleep)
- ✅ Fully managed PostgreSQL database (90-day retention)
- ✅ Automatic Docker builds from GitHub
- ✅ Free SSL certificates and CDN
- ✅ HTTP/2 and WebSocket support
- ✅ Zero-downtime deployments
- ✅ Built-in Redis integration

**Deployment Steps:**
1. Push your code to GitHub
2. Sign up at [render.com](https://render.com)
3. Create new Web Service from GitHub repo
4. Select Docker environment
5. Add PostgreSQL database service
6. Configure environment variables
7. Deploy automatically

**Why Render in 2025:**
- More reliable than Railway's limited $5 credit system
- Better database management than Fly.io free tier
- Simpler setup than self-hosted solutions

**Deployment Steps:**
1. Push your code to GitHub
2. Sign up at [railway.app](https://railway.app)
3. Connect your GitHub repository
4. Railway automatically detects Docker setup
5. Set environment variables in Railway dashboard
6. Deploy with one click

**Configuration:**
```bash
# Add to your repository root: railway.toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "infra/docker/Dockerfile.prod"

[deploy]
healthcheckPath = "/health"
restartPolicyType = "ON_FAILURE"
```

### 2. Railway (Quick Prototyping)
Great for rapid prototyping but limited by credit system.

**Features:**
- ⚠️ $5 one-time credit (apps stop when depleted)
- ✅ 512MB RAM, 1GB storage initially
- ✅ Excellent developer experience
- ✅ Multiple custom domains
- ✅ 100GB outbound bandwidth

**Best for:** Short-term projects and demos
**Warning:** Apps will stop running once $5 credit is used

**Deployment Steps:**
1. Connect GitHub repository at [render.com](https://render.com)
2. Create a new Web Service
3. Select your repository and branch
4. Choose Docker as build environment
5. Set environment variables
6. Deploy

### 3. Fly.io (Production-Ready Edge)
Best for applications requiring global distribution and production features.

**Features:**
- ✅ 3 shared-cpu-1x machines (always-on)
- ✅ 3GB persistent volume storage
- ✅ Global edge deployment
- ✅ Sophisticated Docker support
- ✅ Built-in load balancing
- ✅ WebSocket support
- ✅ Native PostgreSQL integration

**Best for:** Production applications with global users

**Deployment Steps:**
```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Initialize app
fly launch

# Deploy
fly deploy
```

### 4. Deta Space (Unlimited Free)
Unique platform offering truly unlimited free hosting.

**Features:**
- ✅ Completely free with no limits
- ✅ Personal cloud platform
- ✅ Built-in data storage
- ✅ No credit card required ever
- ✅ Supports Node.js applications

**Best for:** Personal projects and experimental applications

### 5. Coolify (Self-Hosted Freedom)
Open-source alternative for complete control.

**Features:**
- ✅ Completely free and open-source
- ✅ Self-hosted on your own VPS
- ✅ Zero-downtime deployments
- ✅ Git integration
- ✅ Multiple database support
- ✅ No vendor lock-in

**Best for:** Advanced users with VPS access

## 🐳 Docker Deployment

### Production Docker Setup

1. **Build production images**
   ```bash
   # Build all services
   docker-compose -f infra/docker/docker-compose.yml build
   
   # Or build individually
   docker build -t crm-backend ./apps/backend
   docker build -t crm-frontend ./apps/frontend
   ```

2. **Deploy with Docker Compose**
   ```bash
   # Production deployment
   docker-compose -f infra/docker/docker-compose.yml up -d
   
   # With custom environment
   docker-compose -f infra/docker/docker-compose.yml --env-file .env.production up -d
   ```

3. **Environment Configuration**
   ```bash
   # Copy production environment template
   cp .env.example .env.production
   
   # Edit production variables
   nano .env.production
   ```

### Production Environment Variables
```bash
# Database (Use managed database service)
DATABASE_URL=postgresql://user:pass@host:5432/crm_prod
REDIS_URL=redis://redis-host:6379

# Security
JWT_SECRET=ultra-secure-production-secret
SESSION_SECRET=another-ultra-secure-secret

# External APIs
WHATSAPP_API_TOKEN=your-production-whatsapp-token
ANTHROPIC_API_KEY=your-production-anthropic-key
OPENAI_API_KEY=your-production-openai-key

# Application URLs
FRONTEND_URL=https://your-domain.com
BACKEND_URL=https://api.your-domain.com
WEBHOOK_URL=https://api.your-domain.com/api/whatsapp/webhook

# Performance
NODE_ENV=production
DATABASE_POOL_SIZE=20
REDIS_MAX_CONNECTIONS=100
```

## ☁️ Cloud Deployment

### DigitalOcean (Advanced)
For users who need more control and are willing to pay.

1. **Create Droplet**
   ```bash
   # Use Docker Marketplace image
   # Or install Docker manually on Ubuntu 22.04
   ```

2. **Setup CI/CD with GitHub Actions**
   ```yaml
   # .github/workflows/deploy.yml
   name: Deploy to DigitalOcean
   on:
     push:
       branches: [main]
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         - name: Deploy to server
           uses: appleboy/ssh-action@v0.1.5
           with:
             host: ${{ secrets.HOST }}
             username: ${{ secrets.USERNAME }}
             key: ${{ secrets.KEY }}
             script: |
               cd /app/crm-mvp
               git pull origin main
               docker-compose -f infra/docker/docker-compose.yml up -d --build
   ```

### AWS (Enterprise)
For enterprise deployments requiring high availability.

1. **ECS Deployment**
   - Use AWS ECS with Fargate
   - Set up Application Load Balancer
   - Configure RDS for PostgreSQL
   - Use ElastiCache for Redis

2. **EKS Deployment** (Advanced)
   - Kubernetes deployment
   - Auto-scaling capabilities
   - Advanced monitoring

## 🏠 Local Development Setup (Detailed)

### Option 1: Docker-based Setup (Recommended)

**Prerequisites:**
- Docker Desktop 4.0+ with Docker Compose
- Git
- 4GB+ RAM available

```bash
# Clone and setup
git clone https://github.com/shreyanshjain7174/crm-mvp.git
cd crm-mvp

# Copy environment variables
cp .env.example .env

# Start all services
./scripts/dev/start.sh

# Wait for services to start (2-3 minutes first time)
# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Option 2: Native Development Setup

**Prerequisites:**
- Node.js 18+ with npm
- PostgreSQL 14+ installed and running
- Redis 6+ installed and running

```bash
# Install dependencies
npm install

# Setup database
psql -c "CREATE DATABASE crm_development;"
psql -c "CREATE USER crm_user WITH PASSWORD 'crm_password';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE crm_development TO crm_user;"

# Configure environment
cp .env.example .env
# Edit .env with your local database credentials

# Start backend
cd apps/backend
npm run dev

# In another terminal, start frontend
cd apps/frontend
npm run dev
```

### Environment Configuration

**Required Environment Variables:**
```bash
# Database
DATABASE_URL=postgresql://crm_user:crm_password@localhost:5432/crm_development
REDIS_URL=redis://localhost:6379

# JWT Secrets (generate new ones)
JWT_SECRET=your-super-secret-jwt-key-here
SESSION_SECRET=your-super-secret-session-key

# API Keys (optional for basic testing)
WHATSAPP_API_TOKEN=your-whatsapp-token
ANTHROPIC_API_KEY=your-anthropic-key
OPENAI_API_KEY=your-openai-key

# Frontend URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

### Common Local Development Issues

**Issue: Port conflicts**
```bash
# Check what's using ports 3000, 3001, 5432
lsof -i :3000
lsof -i :3001
lsof -i :5432

# Kill processes if needed
kill -9 <PID>
```

**Issue: Docker containers won't start**
```bash
# Clean up Docker
docker system prune -a
docker volume prune

# Restart Docker Desktop
# Try starting again
./scripts/dev/start.sh
```

**Issue: Database migration errors**
```bash
# Reset database (WARNING: loses all data)
docker-compose down -v
docker-compose up -d

# Or manually reset
psql -c "DROP DATABASE IF EXISTS crm_development;"
psql -c "CREATE DATABASE crm_development;"
```

## 🔧 Local Production Testing

Test your production build locally before deployment:

```bash
# Build production images
docker-compose -f infra/docker/docker-compose.yml build

# Run production stack locally
docker-compose -f infra/docker/docker-compose.yml up

# Access at http://localhost:8080

# Test with ngrok for webhook testing
./scripts/deploy/deploy-with-ngrok.sh
```

## 📊 Monitoring & Health Checks

### Health Check Endpoints
- Backend: `/health`
- Frontend: `/health` 
- Database: Built-in Docker health checks

### Monitoring Setup
```bash
# Add to your deployment
# Monitor logs
docker-compose logs -f

# Check service status
docker-compose ps

# Monitor resource usage
docker stats
```

## 🔒 Production Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT secrets
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable database encryption
- [ ] Configure firewall rules
- [ ] Set up backup strategy
- [ ] Enable monitoring and alerting
- [ ] Review and minimize exposed ports

## 🛠️ Troubleshooting

### Common Issues

1. **Database Connection Fails**
   ```bash
   # Check connection string
   docker-compose logs backend
   
   # Verify database is running
   docker-compose ps db
   ```

2. **Frontend Can't Reach Backend**
   ```bash
   # Check environment variables
   echo $NEXT_PUBLIC_BACKEND_URL
   
   # Verify backend is accessible
   curl http://localhost:3001/health
   ```

3. **Build Failures**
   ```bash
   # Clear Docker cache
   docker system prune -a
   
   # Rebuild from scratch
   docker-compose build --no-cache
   ```

### Support
- Check [GitHub Issues](https://github.com/shreyanshjain7174/crm-mvp/issues)
- Review logs: `docker-compose logs`
- Verify health checks: `curl http://localhost:8080/health`

---

**Need help?** Open an issue on GitHub or check our troubleshooting guide.