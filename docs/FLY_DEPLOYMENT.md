# 🚀 Fly.io Deployment Guide

Complete guide for deploying your CRM MVP to Fly.io with PostgreSQL and Redis.

## 🎯 Why Fly.io?

- **Global Edge Network**: Apps run close to users worldwide
- **Docker-Native**: Perfect for our containerized application
- **Always-On Free Tier**: 3 shared VMs, no sleep mode
- **Built-in PostgreSQL**: Managed database with automatic backups
- **Production-Ready**: Used by serious applications

## 📋 Prerequisites

1. **Fly.io Account**: Sign up at [fly.io](https://fly.io)
2. **Fly CLI**: Install with `brew install flyctl`
3. **Docker**: Ensure Docker is running locally
4. **Git**: Code should be committed to git

## 🚀 Quick Start Deployment

### Step 1: Install and Login
```bash
# Install Fly CLI
brew install flyctl

# Login to Fly.io
flyctl auth login
```

### Step 2: Launch Your App
```bash
# Navigate to project root
cd /path/to/crm-mvp

# Launch app (will create fly.toml)
fly launch
```

**During `fly launch`:**
- Choose app name (e.g., `your-crm-app`)
- Select region: **Mumbai (bom)** for Indian users
- Choose VM size: **shared-cpu-1x** (free tier)
- **Don't deploy yet** - we need to set up databases first

### Step 3: Use Our Automated Script
```bash
# Run our comprehensive deployment script
./scripts/deploy/deploy-flyio.sh
```

This script will:
- ✅ Set up PostgreSQL database
- ✅ Configure Redis instance
- ✅ Set environment secrets
- ✅ Create persistent storage
- ✅ Deploy the application
- ✅ Run health checks

## 🗄️ Database Setup

### PostgreSQL (Automatic via script)
```bash
# Create PostgreSQL instance
flyctl postgres create --name your-app-db --region bom

# Attach to your app
flyctl postgres attach your-app-db --app your-app
```

### Redis (Automatic via script)
```bash
# Create Redis instance
flyctl redis create --name your-app-redis --region bom --plan free

# Connection URL is automatically added to secrets
```

## 🔐 Environment Configuration

### Required Secrets
```bash
# Set via flyctl secrets set KEY=value
flyctl secrets set \
    JWT_SECRET="your-super-secret-jwt-key" \
    SESSION_SECRET="your-session-secret" \
    NODE_ENV="production"

# Optional API keys
flyctl secrets set \
    WHATSAPP_API_TOKEN="your-whatsapp-token" \
    ANTHROPIC_API_KEY="your-anthropic-key" \
    OPENAI_API_KEY="your-openai-key"
```

### View Current Secrets
```bash
flyctl secrets list --app your-app
```

## 🔄 Manual Deployment

If you prefer manual control:

```bash
# Build and deploy
flyctl deploy

# Deploy specific Dockerfile
flyctl deploy --dockerfile infra/docker/Dockerfile.prod

# Deploy with build args
flyctl deploy --build-arg NODE_ENV=production
```

## 📊 Monitoring & Management

### View Application Status
```bash
# Check app status
flyctl status

# View running machines
flyctl machines list

# Check resource usage
flyctl dashboard
```

### View Logs
```bash
# Real-time logs
flyctl logs

# Filter by instance
flyctl logs --app your-app

# Follow logs
flyctl logs -f
```

### Database Management
```bash
# Connect to PostgreSQL
flyctl postgres connect --app your-app-db

# Proxy database locally
flyctl proxy 5432 --app your-app-db

# View database status
flyctl postgres status --app your-app-db
```

## 🔧 Scaling & Performance

### Scale Machines
```bash
# Scale to 2 instances
flyctl scale count 2

# Scale to larger VM
flyctl scale vm shared-cpu-2x

# Scale memory
flyctl scale memory 2048
```

### Performance Monitoring
```bash
# View metrics
flyctl dashboard

# Check machine status
flyctl machines list

# SSH into machine
flyctl ssh console
```

## 🌐 Custom Domain Setup

### Add Your Domain
```bash
# Add domain
flyctl certs create your-domain.com

# Add www subdomain
flyctl certs create www.your-domain.com

# Check certificate status
flyctl certs list
```

### DNS Configuration
Add these DNS records to your domain:
```
A     your-domain.com        -> [Fly.io IPv4]
AAAA  your-domain.com        -> [Fly.io IPv6]
CNAME www.your-domain.com    -> your-app.fly.dev
```

Get IP addresses:
```bash
flyctl ips list
```

## 🔒 Security Best Practices

### 1. Environment Secrets
- ✅ Never commit secrets to git
- ✅ Use `flyctl secrets set` for sensitive data
- ✅ Rotate secrets regularly

### 2. Database Security
- ✅ Use connection pooling
- ✅ Enable SSL connections
- ✅ Regular backups (automatic with Fly PostgreSQL)

### 3. Application Security
- ✅ Enable HTTPS (automatic with Fly.io)
- ✅ Configure CORS properly
- ✅ Set up rate limiting

## 🚨 Troubleshooting

### Common Issues

**1. Build Failures**
```bash
# Check build logs
flyctl logs

# Local build test
docker build -f infra/docker/Dockerfile.prod .

# Clear builder cache
flyctl deploy --build-only --no-cache
```

**2. Database Connection Issues**
```bash
# Check database status
flyctl postgres status --app your-app-db

# Test connection
flyctl postgres connect --app your-app-db

# View connection string
flyctl secrets list | grep DATABASE
```

**3. App Won't Start**
```bash
# Check machine status
flyctl machines list

# View detailed logs
flyctl logs -f

# SSH into machine
flyctl ssh console

# Restart machine
flyctl machines restart <machine-id>
```

**4. Health Check Failures**
```bash
# Test health endpoint locally
curl https://your-app.fly.dev/health

# Check internal health
flyctl ssh console
curl localhost:8080/health
```

### Debug Commands
```bash
# Machine information
flyctl machines show <machine-id>

# App configuration
flyctl config show

# Volume information
flyctl volumes list

# Network debugging
flyctl ssh console
curl -v localhost:8080/health
```

## 💰 Cost Optimization

### Free Tier Limits
- **3 shared-cpu-1x machines** (256MB RAM each)
- **3GB persistent volumes**
- **160GB outbound transfer**
- **PostgreSQL**: 3GB storage
- **Redis**: Free plan available

### Optimization Tips
1. **Use shared VMs** for development
2. **Auto-stop machines** during low traffic
3. **Optimize Docker image** size
4. **Use volume mounts** for persistent data

### Monitor Usage
```bash
# Check current usage
flyctl dashboard

# View billing
flyctl orgs show

# Set spending limits
# (Available in Fly.io dashboard)
```

## 🎛️ Advanced Configuration

### Fly.toml Customization
```toml
# Custom machine configuration
[machine]
  memory = "1gb"
  cpu_kind = "shared"
  cpus = 1

# Multiple regions
primary_region = "bom"
[[regions]]
  code = "sin"  # Singapore backup
```

### Multiple Environments
```bash
# Create staging app
flyctl apps create your-app-staging

# Deploy to staging
flyctl deploy --app your-app-staging

# Switch between apps
flyctl config use your-app-production
```

## 📈 Production Checklist

- [ ] Custom domain configured
- [ ] SSL certificates active
- [ ] Database backups enabled
- [ ] Environment secrets set
- [ ] Health checks passing
- [ ] Monitoring dashboard configured
- [ ] WhatsApp webhook URL updated
- [ ] Performance testing completed
- [ ] Error tracking enabled

## 🆘 Support

- **Fly.io Docs**: [fly.io/docs](https://fly.io/docs)
- **Community**: [community.fly.io](https://community.fly.io)
- **Status**: [status.fly.io](https://status.fly.io)
- **GitHub Issues**: [Our repository issues](https://github.com/shreyanshjain7174/crm-mvp/issues)

---

**🎉 Happy deploying!** Your CRM MVP will be running globally on Fly.io's edge network.