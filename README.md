# 🚀 AI-Powered CRM for Indian SMEs

An advanced **Agentic CRM** system designed specifically for Indian SMEs with comprehensive WhatsApp integration, AI-powered automation, and real-time monitoring capabilities.

## ✨ Key Features

- 🤖 **AI Agent System**: Multi-agent architecture with LangGraph workflow orchestration
- 📱 **WhatsApp Integration**: Facebook WhatsApp Cloud API with automated responses  
- 🎯 **Progressive CRM**: Feature discovery system that grows with user expertise
- 📊 **Real-time Dashboard**: Live monitoring with Socket.io and comprehensive analytics
- 👥 **Human-in-the-Loop**: Intelligent approval workflows for AI-generated content
- 🔐 **Enterprise Security**: JWT-based auth with role-based access control

## 🚀 Quick Start

### Local Development Setup

```bash
# Clone the repository
git clone https://github.com/shreyanshjain7174/crm-mvp.git
cd crm-mvp

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development environment (Docker required)
./scripts/dev/start.sh

# Alternative: Start without Docker
npm run dev
```

**Access Points:**
- 🌐 **Frontend**: http://localhost:3000
- 🔧 **Backend API**: http://localhost:3001  
- 🚀 **Nginx Proxy**: http://localhost:8080
- 📊 **Database**: PostgreSQL on localhost:5432
- 🗄️ **Redis**: localhost:6379

### Prerequisites
- **Node.js** 18+ and npm
- **Docker** and Docker Compose (for containerized setup)
- **PostgreSQL** 14+ (if running without Docker)
- **Redis** 6+ (if running without Docker)

## 📚 Documentation

| Topic | Description |
|-------|-------------|
| **[🛠️ Development Guide](./docs/DEVELOPMENT.md)** | Complete local development setup |
| **[🚀 Deployment Guide](./docs/DEPLOYMENT.md)** | Production deployment options |
| **[📖 API Documentation](./docs/API.md)** | REST API endpoints and WebSocket events |
| **[🏗️ Architecture](./docs/ARCHITECTURE.md)** | System design and technical architecture |
| **[⚙️ Configuration](./docs/CONFIGURATION.md)** | Environment variables and settings |

### Features Documentation
- **[🤖 AI Agents](./docs/features/AI_AGENTS.md)** - AI agent capabilities and workflows
- **[📱 WhatsApp Integration](./docs/features/WHATSAPP.md)** - WhatsApp setup and features
- **[🎯 Progressive Features](./docs/features/PROGRESSIVE_FEATURES.md)** - Feature discovery system

## 🎯 AI Agent Capabilities

### Specialized AI Agents
- **Lead Qualification Agent**: Automated lead scoring and categorization
- **Message Generation Agent**: Context-aware WhatsApp responses
- **Follow-up Scheduler Agent**: Optimal timing for lead nurturing
- **Intent Recognition Agent**: Customer intent analysis and routing

### Workflow Automation
- **Visual Workflow Builder**: Drag-and-drop interface with 14+ node types
- **Real-time Execution**: Live workflow monitoring with step-by-step tracking
- **Human Approval**: Critical decisions routed for human review

## 🛠️ Project Structure

```
crm-mvp/
├── apps/
│   ├── backend/           # Node.js/Fastify backend
│   └── frontend/          # Next.js frontend
├── packages/              # Shared libraries
│   ├── agent-sdk/         # AI agent development kit
│   └── agent-protocol/    # Universal agent protocol
├── docs/                  # Documentation
├── scripts/               # Development scripts
├── infra/                 # Infrastructure configs
├── examples/              # Integration examples
└── logs/                 # Application logs
```

## 🌐 Free Deployment Options (2025 Updated)

### 🏆 Top Recommended Platforms

| Platform | Free Tier | Pros | Best For |
|----------|-----------|------|----------|
| **[Render](https://render.com)** | 750 hrs/month, PostgreSQL | Fully managed, built-in DB | **Most beginners** |
| **[Railway](https://railway.app)** | $5 credit, 512MB RAM | Easy setup, great DevEx | **Quick prototypes** |
| **[Fly.io](https://fly.io)** | 3 shared VMs, 3GB storage | Global edge, Docker-native | **Production apps** |
| **[Deta Space](https://deta.space)** | Unlimited & free | No usage limits | **Personal projects** |
| **[Coolify](https://coolify.io)** | Self-hosted, open-source | Full control, no vendor lock-in | **Advanced users** |

### 🚀 Quick Deploy Commands

```bash
# Render: Push to GitHub, connect repo
# Railway: Push to GitHub, one-click deploy

# Fly.io deployment
fly launch
fly deploy

# Docker deployment (any VPS)
docker-compose -f infra/docker/docker-compose.yml up -d
```

See our **[Deployment Guide](./docs/DEPLOYMENT.md)** for platform-specific instructions and production configuration.

## 🔧 Development Commands

### Docker-based Development (Recommended)
```bash
# Start all services with Docker
./scripts/dev/start.sh

# Stop all services
./scripts/dev/stop.sh

# Restart services
./scripts/dev/restart.sh

# View logs
docker-compose logs -f

# Health check
./scripts/deploy/health-check.sh
```

### Native Development
```bash
# Start backend only
npm run dev:backend

# Start frontend only
npm run dev:frontend

# Start both (requires manual DB setup)
npm run dev
```

### Testing & Quality
```bash
# Run test suite
npm test

# Run with coverage
npm run test:coverage

# Lint code
npm run lint

# Type checking
npm run typecheck

# Full CI check (recommended before commits)
npm run ci-check
```

### Production Deployment
```bash
# Build for production
npm run build

# Deploy with Docker
docker-compose -f infra/docker/docker-compose.yml up -d

# Deploy with ngrok for testing
./scripts/deploy/deploy-with-ngrok.sh
```

## 📊 Current Status

### ✅ Production Ready
- ✅ Complete AI agent runtime with secure sandbox execution
- ✅ Progressive dashboard with real user statistics  
- ✅ End-to-end frontend-backend integration
- ✅ Comprehensive test infrastructure (90%+ pass rate)
- ✅ Production-ready Docker setup
- ✅ Real-time notifications and messaging
- ✅ Clean project structure and documentation

### 🚧 In Development
- 🔄 Advanced agent marketplace
- 🔄 Enhanced workflow automation
- 🔄 Enterprise authentication
- 🔄 Performance optimization

## 🤝 Contributing

We welcome contributions! Please check our **[Development Guide](./docs/DEVELOPMENT.md)** for setup instructions and coding standards.

## 📞 Support

- **📖 Documentation**: Comprehensive guides in the `/docs` folder
- **🐛 Issues**: [GitHub Issues](https://github.com/shreyanshjain7174/crm-mvp/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/shreyanshjain7174/crm-mvp/discussions)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

**Built with ❤️ for Indian SMEs** | **[📚 View Full Documentation](./docs/README.md)**