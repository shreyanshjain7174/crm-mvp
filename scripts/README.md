# 📜 CRM MVP Scripts

Organized automation scripts for development, deployment, and CI/CD.

## 📁 Directory Structure

```
scripts/
├── dev/                # Development scripts
│   ├── start.sh       # Start all services
│   ├── stop.sh        # Stop all services
│   └── restart.sh     # Restart services
├── deploy/            # Deployment scripts (future)
├── ci/                # CI/CD scripts (future)
├── check-ci.sh        # Run CI checks locally
└── quick-commit.sh    # Quick git commit helper
```

## 🚀 Quick Start

```bash
# Start complete development environment
./scripts/dev/start.sh

# Stop all services
./scripts/dev/stop.sh

# Restart services
./scripts/dev/restart.sh
```

## 🛠️ Development Scripts (`/dev`)

### start.sh
Starts all services using Docker Compose:
- Creates necessary directories (data/postgres, data/redis, logs)
- Starts PostgreSQL, Redis, Backend, Frontend, and Nginx
- Shows service URLs and health status
- Provides helpful command tips

### stop.sh
Gracefully stops all running services:
- Shuts down all Docker containers
- Preserves data volumes for next session
- Shows cleanup options

### restart.sh
Quickly restarts all services:
- Stops all containers
- Starts them fresh
- Useful after configuration changes

## Access Information

After running `npm run dev:setup`:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Database**: localhost:5432
- **Redis**: localhost:6379

### Test Login Credentials

- **Email**: `demo@crm.dev`
- **Password**: `password`

### Database Access (pgAdmin)

- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `crm_dev_db`
- **Username**: `crm_dev_user`
- **Password**: `dev_password`

## Troubleshooting

### Check Logs
```bash
# Backend logs
tail -f logs/backend.log

# Frontend logs  
tail -f logs/frontend.log
```

### Manual Service Start
```bash
# If scripts fail, you can start services manually:
cd apps/backend && npm run dev
cd apps/frontend && npm run dev
```

### Port Conflicts
```bash
# Check what's using the ports
lsof -i :3000
lsof -i :3001
lsof -i :5432
lsof -i :6379

# Kill conflicting processes
npm run dev:teardown
```

### Container Issues
```bash
# Check container status
podman ps -a

# View container logs
podman logs crm-dev-db
podman logs redis-dev
```

## Progressive Disclosure Testing

Once the environment is running:

1. **Login** at http://localhost:3000 with `demo@crm.dev` / `password`
2. **Observe** the blank dashboard with single CTA
3. **Add your first contact** to see features unlock
4. **Experience** the progressive feature revelation system

The system will guide you through:
- Stage 1: First contact → unlock contact management
- Stage 2: First message → unlock WhatsApp features  
- Stage 3: 10+ contacts → unlock pipeline view
- Stage 4: 5+ messages → unlock AI assistant
- Stage 5: 25+ AI interactions → unlock advanced features

## Development Workflow

```bash
# Start fresh development session
npm run dev:teardown && npm run dev:setup

# Quick restart (keeps containers)
pkill -f "npm run dev"
cd apps/backend && npm run dev &
cd apps/frontend && npm run dev &

# Full reset with clean install
npm run dev:teardown
rm -rf node_modules apps/*/node_modules
npm install
npm run dev:setup
```