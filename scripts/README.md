# 📜 CRM MVP Scripts

Organized automation scripts for development, deployment, and CI/CD.

## 📁 Directory Structure

```
scripts/
├── dev/                     # Development scripts
│   ├── setup-local.sh      # Setup local development environment
│   ├── start.sh            # Start all development services
│   ├── stop.sh             # Stop all services
│   ├── restart.sh          # Restart services
│   └── reset-local.sh      # Reset local database and data
├── deploy/                  # Production deployment scripts
│   ├── deploy-production.sh # Complete production deployment
│   ├── manage-production.sh # Production management (start/stop/scale)
│   └── health-check.sh      # Production health checks
├── check-ci.sh             # Run CI checks locally
└── README.md               # This documentation
```

## 🚀 Quick Start

### Local Development
```bash
# First time setup
./scripts/dev/setup-local.sh

# Start development environment
./scripts/dev/start.sh

# Stop all services
./scripts/dev/stop.sh

# Restart services
./scripts/dev/restart.sh
```

### Production Management
```bash
# Deploy to production
./scripts/deploy/manage-production.sh deploy

# Start/stop production backend
./scripts/deploy/manage-production.sh start
./scripts/deploy/manage-production.sh stop

# Check production status
./scripts/deploy/manage-production.sh status
```

## 🛠️ Development Scripts (`/dev`)

### setup-local.sh
Initial setup for local development:
- Creates `.env.local` configuration file
- Installs all dependencies (frontend/backend)
- Sets up PostgreSQL database and Redis
- Creates initial test data
- Verifies all services are working

### start.sh
Starts development environment:
- Starts PostgreSQL and Redis via Docker
- Starts backend development server
- Starts frontend with hot reload
- Shows service URLs and status

### stop.sh
Stops all development services:
- Shuts down Docker containers
- Kills Node.js processes
- Preserves data for next session

### restart.sh
Restarts services:
- Stops all services
- Starts them fresh
- Useful after configuration changes

### reset-local.sh
Resets local development environment:
- Drops and recreates database
- Clears Redis cache
- Regenerates test data

## 🚀 Production Scripts (`/deploy`)

### deploy-production.sh
Complete production deployment:
- Checks git status and branch
- Builds applications
- Deploys backend to Fly.io
- Deploys frontend to Vercel
- Runs health checks

### manage-production.sh  
Production management commands:
- `deploy` - Deploy to production
- `start/stop` - Control backend scaling
- `status` - Check service status
- `logs` - View production logs
- `scale` - Scale backend instances

### health-check.sh
Production health monitoring:
- Tests API endpoints
- Checks database connectivity
- Validates service responses

## 🌐 Access Information

After running `./scripts/dev/setup-local.sh`:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001  
- **Database**: postgresql://localhost:5432/crm_dev
- **Redis**: localhost:6379

### Test Login Credentials

- **Email**: `demo@crm.dev`
- **Password**: `password`

### Database Access

- **Connection String**: `postgresql://crm_user:crm_password@localhost:5432/crm_dev`
- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `crm_dev`
- **Username**: `crm_user`
- **Password**: `crm_password`

### Production URLs

- **Frontend**: [Vercel URL from dashboard]
- **Backend**: https://crm-backend-api.fly.dev

## 🔧 Troubleshooting

### Development Issues

```bash
# Check Docker containers
docker ps -a
docker-compose -f docker-compose.dev.yml logs

# Check what's using ports
lsof -i :3000  # Frontend
lsof -i :3001  # Backend  
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis

# Reset everything
./scripts/dev/stop.sh
./scripts/dev/reset-local.sh
./scripts/dev/start.sh
```

### Production Issues

```bash
# Check production status
./scripts/deploy/manage-production.sh status

# View production logs
./scripts/deploy/manage-production.sh logs

# Run health checks
./scripts/deploy/health-check.sh

# Restart production
./scripts/deploy/manage-production.sh restart
```

## 🎯 Testing & Workflow

### Local Development Testing

1. **Setup**: Run `./scripts/dev/setup-local.sh`
2. **Start**: Run `./scripts/dev/start.sh`
3. **Login**: Visit http://localhost:3000 with `demo@crm.dev` / `password`
4. **Test**: Experience progressive feature unlocking

### Progressive Feature System

The dashboard unlocks features based on user activity:
- **Stage 1**: First contact → unlock contact management
- **Stage 2**: First message → unlock messaging features  
- **Stage 3**: 10+ contacts → unlock pipeline view
- **Stage 4**: 5+ messages → unlock AI assistant
- **Stage 5**: 25+ interactions → unlock advanced features

### CI/CD Workflow

```bash
# Run CI checks locally
./scripts/check-ci.sh

# Manual production deployment
# 1. Push to main branch
# 2. Go to GitHub Actions
# 3. Run "Deploy to Production" workflow manually
# 4. Monitor deployment progress

# Alternative: Direct deployment
./scripts/deploy/manage-production.sh deploy
```

### Development Workflow

```bash
# Daily development
./scripts/dev/start.sh      # Start everything
# ... develop ...
./scripts/dev/stop.sh       # Stop when done

# Reset for testing
./scripts/dev/reset-local.sh  # Fresh database/data
./scripts/dev/restart.sh     # Restart services
```