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

### Prerequisites
- Node.js 18+ and npm 9+
- Docker and Docker Compose
- Git

### Installation

1. **Clone and install**
   ```bash
   git clone https://github.com/shreyanshjain7174/crm-mvp.git
   cd crm-mvp
   npm install
   ```

2. **Start development environment**
   ```bash
   # Easy start with our dev scripts
   ./scripts/dev/start.sh
   
   # Or manually with Docker Compose
   docker-compose -f infra/docker/docker-compose.dev.yml up -d
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Nginx Proxy: http://localhost:8080

## 📚 Documentation

### Development
- **[Setup Guide](./DEVELOPMENT.md)** - Complete development environment setup
- **[API Documentation](./API.md)** - REST API endpoints and WebSocket events
- **[Architecture](./ARCHITECTURE.md)** - System design and technical architecture

### Deployment
- **[Deployment Guide](./DEPLOYMENT.md)** - Production deployment options
- **[Configuration](./CONFIGURATION.md)** - Environment variables and settings
- **[Docker Guide](./DOCKER.md)** - Container orchestration and scaling

### Features
- **[AI Agents](./features/AI_AGENTS.md)** - AI agent capabilities and workflows
- **[WhatsApp Integration](./features/WHATSAPP.md)** - WhatsApp setup and features
- **[Progressive Features](./features/PROGRESSIVE_FEATURES.md)** - Feature discovery system

### Integration Examples
- **[Voice Agent Integration](../examples/cozmox-voice-agent/README.md)** - Voice AI integration example
- **[Custom Agents](./integrations/CUSTOM_AGENTS.md)** - Building custom AI agents

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
│   ├── docker/           # Docker compositions
│   └── nginx/            # Nginx configurations
├── examples/              # Integration examples
└── logs/                 # Application logs
```

## 🌐 Deployment Options

### Free Hosting Platforms
1. **Railway** (Recommended) - Generous free tier, automatic GitHub deployment
2. **Render** - Excellent for full-stack apps, Docker support
3. **Fly.io** - Global distribution, Docker-based deployments
4. **Back4app** - 256MB RAM, 100GB transfer, no credit card required

All platforms support automatic deployment from your GitHub repository.

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
npm run start              # Start production server
```

## 📊 Current Status

### ✅ Completed Features
- Complete AI agent runtime with secure sandbox execution
- Progressive dashboard with real user statistics
- End-to-end frontend-backend integration
- Comprehensive test infrastructure (90%+ pass rate)
- Production-ready Docker setup
- Real-time notifications and messaging

### 🚧 In Development
- Advanced agent marketplace
- Enhanced workflow automation
- Enterprise authentication
- Performance optimization

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

## 📞 Support

- **Documentation**: Check our comprehensive docs above
- **Issues**: [GitHub Issues](https://github.com/shreyanshjain7174/crm-mvp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/shreyanshjain7174/crm-mvp/discussions)

---

**Built with ❤️ for Indian SMEs**