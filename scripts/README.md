# CRM Development Scripts

Automated scripts for managing the CRM development environment.

## Quick Start

```bash
# Start complete development environment
npm run dev:setup

# Stop and clean up everything
npm run dev:teardown
```

## What dev-start.sh does:

1. **Environment Check**: Verifies Podman/Docker, Node.js, and npm are installed
2. **Cleanup**: Removes any existing containers and processes
3. **Dependencies**: Runs `npm install` for latest packages
4. **Database**: Starts PostgreSQL container with correct credentials
5. **Cache**: Starts Redis container
6. **Configuration**: Creates proper `.env` file for backend
7. **Test User**: Creates demo user with known credentials
8. **Services**: Starts backend and frontend in background
9. **Health Checks**: Waits for all services to be ready

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
- Stage 4: 50+ messages → unlock AI assistant
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