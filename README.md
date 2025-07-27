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

```bash
# Clone and install
git clone https://github.com/shreyanshjain7174/crm-mvp.git
cd crm-mvp
npm install

# Start development environment
./scripts/dev/start.sh

# Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
# Nginx: http://localhost:8080
```

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

## 🌐 Free Deployment Options

### Recommended Platforms
1. **[Railway](https://railway.app)** - Generous free tier, automatic GitHub deployment
2. **[Render](https://render.com)** - Excellent for full-stack apps, Docker support
3. **[Fly.io](https://fly.io)** - Global distribution, Docker-based deployments
4. **[Back4app](https://back4app.com)** - No credit card required, container support

All platforms support automatic deployment from your GitHub repository. See our **[Deployment Guide](./docs/DEPLOYMENT.md)** for detailed instructions.

## 🔧 Quick Commands

```bash
# Development
./scripts/dev/start.sh     # Start all services
./scripts/dev/stop.sh      # Stop all services
./scripts/dev/restart.sh   # Restart services

# Testing
npm test                   # Run test suite
npm run test:coverage      # Run with coverage

# Production
npm run build              # Build for production
docker-compose -f infra/docker/docker-compose.yml up -d  # Deploy
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