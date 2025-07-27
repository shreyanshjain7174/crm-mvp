# 🛠️ Development Guide

Complete guide for setting up and developing the CRM MVP locally.

## 📋 Prerequisites

- **Node.js** 18+ and npm 9+
- **Docker** and Docker Compose (or Podman)
- **Git** for version control
- **Code Editor** (VS Code recommended)

## 🚀 Quick Setup

### 1. Clone and Install
```bash
git clone https://github.com/shreyanshjain7174/crm-mvp.git
cd crm-mvp
npm install
```

### 2. Environment Configuration
```bash
# Copy environment templates
cp .env.example .env.local
cp apps/frontend/.env.example apps/frontend/.env.local
cp apps/backend/.env.example apps/backend/.env.local

# Edit as needed
nano .env.local
```

### 3. Start Development Environment
```bash
# Easy start with our scripts
./scripts/dev/start.sh

# Or manually
docker-compose -f infra/docker/docker-compose.dev.yml up -d
```

### 4. Access Services
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Nginx Proxy**: http://localhost:8080
- **Database**: PostgreSQL on localhost:5432
- **Redis**: Redis on localhost:6379

## 🔧 Development Scripts

### Core Commands
```bash
# Start all services
./scripts/dev/start.sh

# Stop all services
./scripts/dev/stop.sh

# Restart services
./scripts/dev/restart.sh

# View logs
docker-compose -f infra/docker/docker-compose.dev.yml logs -f

# View specific service logs
docker-compose -f infra/docker/docker-compose.dev.yml logs -f backend
```

### Testing
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test suites
npm run test:backend
npm run test:frontend

# Watch mode for development
npm run test:watch
```

### Database Operations
```bash
# Reset database
docker-compose -f infra/docker/docker-compose.dev.yml down -v
docker-compose -f infra/docker/docker-compose.dev.yml up -d

# Access database directly
docker exec -it crm-db psql -U crm_dev_user -d crm_dev_db

# Run migrations manually
npm run migrate
```

## 📁 Project Structure

```
crm-mvp/
├── apps/
│   ├── backend/              # Node.js/Fastify backend
│   │   ├── src/
│   │   │   ├── routes/       # API endpoints
│   │   │   ├── services/     # Business logic
│   │   │   ├── middleware/   # Auth, validation
│   │   │   ├── db/          # Database connection & migrations
│   │   │   └── utils/       # Utility functions
│   │   ├── tests/           # Test suites
│   │   └── package.json
│   └── frontend/            # Next.js frontend
│       ├── src/
│       │   ├── app/         # App router pages
│       │   ├── components/  # React components
│       │   ├── hooks/       # Custom hooks
│       │   ├── lib/         # Utilities & API
│       │   └── stores/      # State management
│       └── package.json
├── packages/                # Shared libraries
│   ├── agent-sdk/          # AI agent development kit
│   └── agent-protocol/     # Universal agent protocol
├── docs/                   # Documentation
├── scripts/                # Development scripts
├── infra/                  # Infrastructure configs
│   ├── docker/            # Docker compositions
│   └── nginx/             # Nginx configurations
├── examples/               # Integration examples
└── logs/                  # Application logs
```

## 🔄 Development Workflow

### 1. Feature Development
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes
# ... code changes ...

# Test changes
npm test

# Commit with signed commits
git commit -s -m "feat: add new feature"

# Push and create PR
git push origin feature/new-feature
```

### 2. Backend Development
```bash
# Start backend in development mode
cd apps/backend
npm run dev

# Watch for changes
npm run dev:watch

# Run backend tests only
npm test
```

### 3. Frontend Development
```bash
# Start frontend in development mode
cd apps/frontend
npm run dev

# Enable demo mode for offline development
NEXT_PUBLIC_DEMO_MODE=true npm run dev

# Run frontend tests
npm test
```

## 🧪 Testing Strategy

### Test Types
- **Unit Tests**: Individual function testing
- **Integration Tests**: API endpoint testing
- **Component Tests**: React component testing
- **E2E Tests**: Full user flow testing

### Running Tests
```bash
# All tests
npm test

# Specific test files
npm test -- contacts.test.ts

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# CI validation locally
./scripts/check-ci.sh
```

### Test Database
Tests use a separate test database that's automatically created and cleaned up.

## 🐳 Docker Development

### Services Overview
```bash
# View all services
docker-compose -f infra/docker/docker-compose.dev.yml ps

# Service details:
# - db: PostgreSQL database
# - redis: Redis cache
# - backend: Node.js API server
# - frontend: Next.js web app
# - nginx: Reverse proxy
```

### Docker Commands
```bash
# Build specific service
docker-compose -f infra/docker/docker-compose.dev.yml build backend

# View service logs
docker-compose -f infra/docker/docker-compose.dev.yml logs -f backend

# Execute commands in containers
docker exec -it crm-backend npm test
docker exec -it crm-frontend npm run build

# Clean up everything
docker-compose -f infra/docker/docker-compose.dev.yml down -v
docker system prune -f
```

## 🔐 Environment Variables

### Backend (.env.local)
```bash
# Database
DATABASE_URL=postgresql://crm_dev_user:dev_password@localhost:5432/crm_dev_db
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=dev-jwt-secret-change-in-production
SESSION_SECRET=dev-session-secret

# WhatsApp (development)
WHATSAPP_API_TOKEN=your-dev-token
WHATSAPP_WEBHOOK_SECRET=your-webhook-secret

# AI Services
ANTHROPIC_API_KEY=your-anthropic-key
OPENAI_API_KEY=your-openai-key

# Application
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```bash
# API Configuration
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001

# Feature Flags
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_DEBUG=true

# Development
NODE_ENV=development
```

## 🔍 Debugging

### Backend Debugging
```bash
# Enable debug logs
DEBUG=* npm run dev

# Specific debug namespaces
DEBUG=crm:* npm run dev

# Database query logging
DEBUG_SQL=true npm run dev
```

### Frontend Debugging
```bash
# Enable verbose logging
NEXT_PUBLIC_DEBUG=true npm run dev

# React Developer Tools (browser extension)
# Redux DevTools (browser extension)
```

### Common Issues

1. **Port conflicts**
   ```bash
   # Check what's using ports
   lsof -i :3000
   lsof -i :3001
   
   # Kill processes if needed
   kill -9 <PID>
   ```

2. **Database connection issues**
   ```bash
   # Check if database is running
   docker-compose -f infra/docker/docker-compose.dev.yml ps db
   
   # Check database logs
   docker-compose -f infra/docker/docker-compose.dev.yml logs db
   ```

3. **Module not found errors**
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   
   # Clear next.js cache
   rm -rf apps/frontend/.next
   ```

## 📚 Useful Resources

- **Next.js Documentation**: https://nextjs.org/docs
- **Fastify Documentation**: https://www.fastify.io/docs
- **PostgreSQL Documentation**: https://www.postgresql.org/docs
- **Docker Compose Reference**: https://docs.docker.com/compose

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit a pull request

### Code Style
- Use TypeScript for all new code
- Follow existing code formatting
- Add JSDoc comments for functions
- Write tests for new features
- Use semantic commit messages

---

**Happy coding! 🚀**