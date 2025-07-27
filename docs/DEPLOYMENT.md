# 🚀 Deployment Guide

This guide covers various deployment options for the CRM MVP, from local development to production hosting.

## 🆓 Free Hosting Options (Recommended)

### 1. Railway (Best Choice)
Railway offers the most generous free tier and seamless GitHub integration.

**Features:**
- 750 hours/month runtime
- Automatic Docker builds
- GitHub integration
- Free SSL certificates
- Database hosting

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

### 2. Render (Alternative)
Excellent for full-stack applications with built-in database.

**Features:**
- Free tier with 750 hours/month
- Auto-deploy from GitHub
- Built-in PostgreSQL database
- Free SSL and CDN

**Deployment Steps:**
1. Connect GitHub repository at [render.com](https://render.com)
2. Create a new Web Service
3. Select your repository and branch
4. Choose Docker as build environment
5. Set environment variables
6. Deploy

### 3. Fly.io (Global Distribution)
Best for applications requiring global distribution.

**Features:**
- Docker-native platform
- Global edge locations
- Free tier available
- CLI-based deployment

**Deployment Steps:**
```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Initialize app
fly launch

# Deploy
fly deploy
```

### 4. Back4app (No Credit Card)
Generous free tier without requiring payment details.

**Features:**
- 256MB RAM, 100GB transfer
- No credit card required
- Docker container support
- 600 active hours/month

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

## 🔧 Local Production Testing

Test your production build locally before deployment:

```bash
# Build production images
docker-compose -f infra/docker/docker-compose.yml build

# Run production stack locally
docker-compose -f infra/docker/docker-compose.yml up

# Access at http://localhost:8080
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