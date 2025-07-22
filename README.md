# 🚀 AI-Powered CRM for Indian SMEs

An advanced **Agentic CRM** system designed specifically for Indian SMEs with comprehensive WhatsApp integration, AI-powered automation, and real-time monitoring capabilities.

## ✨ Features

- 🤖 **AI Agent System**: Multi-agent architecture with LangGraph workflow orchestration
- 🔧 **Visual Workflow Builder**: Drag-and-drop interface for creating AI agent workflows
- 📱 **WhatsApp Integration**: Facebook WhatsApp Cloud API with automated responses
- 🎯 **Progressive CRM**: Feature discovery system that grows with user expertise
- 📊 **Real-time Dashboard**: Live monitoring with Socket.io and comprehensive analytics
- 🔄 **Event-Driven Architecture**: Scalable microservices with Redis Streams
- 👥 **Human-in-the-Loop**: Intelligent approval workflows for AI-generated content
- 📈 **Agent Monitoring**: Complete execution history and performance tracking
- 🔐 **Authentication**: JWT-based security with protected routes
- 💰 **Cost-Optimized**: Built for budget-conscious Indian SMEs

## 🎯 AI Agent Capabilities

### Specialized AI Agents
- **Lead Qualification Agent**: Automated lead scoring and categorization
- **Message Generation Agent**: Context-aware WhatsApp responses
- **Follow-up Scheduler Agent**: Optimal timing for lead nurturing
- **Intent Recognition Agent**: Customer intent analysis and routing
- **Context Memory Agent**: Conversation history and embeddings

### Workflow Automation
- **Visual Workflow Builder**: Drag-and-drop interface with 14+ node types
- **Lead Qualification & Response**: 5-step automated workflow
- **Follow-up Sequence**: 4-step nurturing automation
- **Real-time Execution**: Live workflow monitoring with step-by-step tracking
- **Human Approval**: Critical decisions routed for human review
- **Progressive Feature Discovery**: Features unlock based on user interaction patterns

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- Docker and Docker Compose (or Podman)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/shreyanshjain7174/crm-mvp.git
   cd crm-mvp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy example environment files
   cp .env.example .env.local
   cp .env.production .env
   
   # Edit environment variables as needed
   nano .env.local
   ```

4. **Start development server (Containerized)**
   ```bash
   # Using Docker or Podman (auto-detected)
   ./start-dev.sh
   
   # Or manually with Docker Compose
   docker-compose up -d
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Database: PostgreSQL on port 5432
   - Redis: Redis on port 6379

### Alternative Local Development

For non-containerized development:
```bash
# Install dependencies
npm install

# Start frontend only (with demo mode)
npm run dev:frontend

# Start backend only (requires database)
npm run dev:backend
```

## 🔧 Configuration

### Environment Variables

#### Root Environment (.env.local)
```bash
# Database Configuration
DATABASE_URL=postgresql://crm_user:crm_password@localhost:5432/crm_db
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key
SESSION_SECRET=your-session-secret

# WhatsApp API Configuration (AISensy)
AISENSY_API_KEY=your-aisensy-api-key
AISENSY_CAMPAIGN_NAME=your-campaign-name
AISENSY_WEBHOOK_SECRET=your-webhook-secret

# AI Configuration
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_ENVIRONMENT=your-pinecone-environment

# Application URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001
WEBHOOK_URL=https://yourdomain.com/api/whatsapp/webhook
```

#### Frontend Environment (.env.local)
```bash
# API Endpoints
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3002

# Feature Flags
NEXT_PUBLIC_DEMO_MODE=false
GITHUB_PAGES=false
```

### WhatsApp Setup (Facebook Cloud API)

1. Create a Facebook App in Meta for Developers
2. Set up WhatsApp Business API product
3. Get your permanent access token and phone number ID
4. Configure webhook URL: `https://yourdomain.com/api/whatsapp/webhook`
5. Update environment variables with your Facebook credentials

**Facebook WhatsApp Cloud API Features:**
- Free tier with 1000 conversations/month
- Direct integration with Meta services
- Support for templates, media, and interactive messages
- Automatic contact creation for new numbers

### AI Configuration

- **OpenAI GPT-4o**: Primary LLM for AI agents
- **Pinecone**: Vector database for embeddings and RAG
- **LangGraph**: Workflow orchestration and agent coordination

## 🏗️ Architecture

### Frontend Stack
- **Framework**: Next.js 14 with App Router and TypeScript
- **Styling**: Tailwind CSS + Shadcn/ui components
- **State Management**: Zustand for client state, React Query for server state
- **Real-time**: Socket.io client for live updates

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Fastify for high-performance APIs
- **Database**: PostgreSQL with direct `pg` driver
- **Caching**: Redis for sessions and real-time data
- **Queue**: BullMQ for background jobs
- **Events**: Redis Streams for inter-service communication
- **Containers**: Docker/Podman with multi-stage builds
- **CI/CD**: GitHub Actions with automated testing and deployment

### AI System
- **Orchestration**: LangGraph for agent coordination
- **LLM Provider**: OpenAI GPT-4o (primary), Gemini (fallback)
- **Vector Store**: Pinecone for embeddings and RAG
- **Workflow Engine**: Custom LangGraph workflows

## 📱 Dashboard Features

### Live AI Agent Dashboard
- Real-time agent status monitoring (active/processing/idle/error)
- Performance metrics (CPU, Memory, Response time)
- Task execution tracking with progress indicators
- Agent pause/resume controls
- Error tracking and success rate monitoring

### Workflow Execution Interface
- Visual workflow execution with step-by-step progress
- Real-time state updates and performance metrics
- Pause/Resume/Cancel workflow operations
- Human approval integration for critical steps

### Agent Monitoring & History
- Complete execution logs with input/output tracking
- Performance analytics and resource usage monitoring
- Error tracking with retry mechanisms
- Filterable execution history with CSV export

### Human-in-the-Loop Approvals
- Intelligent approval workflows for AI-generated content
- Risk assessment and confidence scoring
- Time-based expiration with visual indicators
- Bulk approval actions and priority queuing

### Real-time Notifications
- Live notification system for all events
- Connection status with latency monitoring
- Categorized notifications with action indicators
- Mark as read/unread functionality

## 🔌 WebSocket Events

### Agent Events
- `agent:status_update` - Agent status changes
- `agent:task_started` - Task initiation
- `agent:task_completed` - Task completion
- `agent:task_failed` - Task failure
- `agent:performance_update` - Performance metrics

### Workflow Events
- `workflow:execution_started` - Workflow initiation
- `workflow:step_started` - Step execution
- `workflow:step_completed` - Step completion
- `workflow:execution_completed` - Workflow completion
- `workflow:approval_required` - Human approval needed

### System Events
- `system:health_update` - System health status
- `system:alert` - Critical alerts
- `lead:created` - New lead creation
- `message:received` - New message received

## 🛠️ Development

### Available Scripts

```bash
# Development (Containerized)
./start-dev.sh           # Start full stack with Docker/Podman
docker-compose up -d     # Start all services in background
docker-compose down      # Stop all services
docker-compose logs -f   # View logs from all services

# Development (Local)
npm run dev              # Start frontend development server
npm run dev:frontend     # Start frontend only
npm run dev:backend      # Start backend only
npm run dev:all          # Start all services locally

# Production
npm run build            # Build all applications
npm run start            # Start production servers
docker-compose -f docker-compose.prod.yml up -d  # Production deployment

# Quality Checks
npm run lint             # ESLint validation
npm run typecheck        # TypeScript type checking
npm run format           # Code formatting
npm run test             # Run all tests

# Database Operations
npm run db:migrate       # Run database migrations
npm run db:seed          # Seed database with sample data
npm run db:studio        # Open database studio
```

## 🐳 Docker Deployment

### Development Environment

The application uses Docker Compose for easy development setup:

```bash
# Start all services
./start-dev.sh

# Or manually
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Services Included

- **Frontend**: Next.js development server (port 3000)
- **Backend**: Fastify API server (port 3001)
- **Database**: PostgreSQL 15 (port 5432)
- **Cache**: Redis 7 (port 6379)
- **WebSocket**: Socket.io server (port 3002)

### Production Deployment

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up -d

# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

### Container Features

- **Multi-stage builds**: Optimized for production
- **Health checks**: Automatic service monitoring
- **Volume mounts**: Persistent data storage
- **Environment-based configuration**: Easy deployment across environments
- **Security**: Non-root user execution
- **Auto-restart**: Services restart on failure

### Project Structure

```
crm-mvp/
├── apps/
│   ├── frontend/           # Next.js application
│   │   ├── src/
│   │   │   ├── app/        # App Router pages
│   │   │   ├── components/ # React components
│   │   │   │   ├── ai/     # AI-specific components
│   │   │   │   ├── dashboard/ # Dashboard components
│   │   │   │   └── ui/     # UI components
│   │   │   ├── hooks/      # Custom React hooks
│   │   │   ├── lib/        # Utilities and configurations
│   │   │   │   ├── websocket/ # WebSocket client
│   │   │   │   └── workflows/ # LangGraph workflows
│   │   │   ├── contexts/   # React contexts
│   │   │   └── types/      # TypeScript definitions
│   │   ├── Dockerfile      # Frontend container config
│   │   └── Dockerfile.dev  # Development container config
│   └── backend/            # Fastify API server
│       ├── src/
│       │   ├── routes/     # API route handlers
│       │   ├── services/   # Business logic services
│       │   ├── agents/     # AI agent implementations
│       │   ├── middleware/ # Express middleware
│       │   ├── types/      # TypeScript definitions
│       │   └── db/         # Database connection and migrations
│       ├── Dockerfile      # Backend container config
│       └── Dockerfile.dev  # Development container config
├── .github/
│   └── workflows/
│       └── ci-cd.yml       # GitHub Actions CI/CD pipeline
├── docker-compose.yml      # Development environment
├── docker-compose.prod.yml # Production environment
├── start-dev.sh           # Development startup script
├── CLAUDE.md              # Detailed implementation guide
├── .env.example           # Environment variable template
├── .env.production        # Production environment template
└── README.md             # This file
```

## 🧪 Testing & Validation

### ✅ Completed Testing
- **TypeScript Compilation**: All type errors resolved (ES2015 target)
- **ESLint Validation**: Zero warnings or errors
- **Next.js Build**: Successfully built 14 pages
- **Development Server**: Verified running on localhost:3000
- **Authentication Flow**: JWT-based auth with protected routes
- **Real-time Features**: Socket.io integration confirmed
- **AI Agent System**: LangGraph workflows functional

### Production Readiness
- Complete authentication system with JWT tokens
- Real-time WebSocket communication with reconnection
- Comprehensive error handling and validation
- Type-safe development environment
- Scalable component architecture

## 📊 Performance & Monitoring

### System Health Monitoring
- Real-time resource monitoring (CPU, Memory, Network)
- Service health checks for all components
- Queue size and throughput monitoring
- Automated alert system for performance thresholds

### AI Agent Performance
- Response time tracking and optimization
- Success rate monitoring per agent
- Resource usage analytics
- Execution history and trend analysis

## 🔮 Future Enhancements

### Backend Implementation
- Fastify API server with PostgreSQL
- Redis integration for caching and queues
- WhatsApp webhook implementation
- AI agent orchestration service

### Advanced Features
- Multi-language support for Indian markets
- Advanced analytics and reporting
- Integration with popular CRM tools
- Mobile app for on-the-go management

### AI Capabilities
- Custom model fine-tuning for Indian SMEs
- Voice message transcription and analysis
- Predictive lead scoring
- Automated A/B testing for messages

## 📄 API Documentation

Comprehensive API documentation is available in `CLAUDE.md` including:
- Detailed implementation patterns
- WebSocket event specifications
- AI agent workflow definitions
- Database schema patterns
- Development guidelines

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use ESLint and Prettier for code formatting
- Write comprehensive tests for new features
- Update documentation for API changes
- Ensure WebSocket events are properly typed

## 📞 Support

For support and questions:
- 📧 Create an issue in the repository
- 📚 Check the detailed documentation in `CLAUDE.md`
- 💬 Review the WebSocket event specifications
- 🔍 Examine the component documentation

## 📜 License

MIT License - see LICENSE file for details

---

Built with ❤️ for Indian SMEs - Empowering small businesses with AI-powered customer relationship management.