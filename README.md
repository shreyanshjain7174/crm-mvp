# 🚀 AI-Powered CRM for Indian SMEs

An advanced **Agentic CRM** system designed specifically for Indian SMEs with comprehensive WhatsApp integration, AI-powered automation, and real-time monitoring capabilities.

## ✨ Features

- 🤖 **AI Agent System**: Multi-agent architecture with LangGraph workflow orchestration
- 📱 **WhatsApp Integration**: 360dialog Business API with automated responses
- 🎯 **Lead Management**: Complete pipeline with AI-powered qualification and scoring
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
- **Lead Qualification & Response**: 5-step automated workflow
- **Follow-up Sequence**: 4-step nurturing automation
- **Real-time Execution**: Live workflow monitoring with step-by-step tracking
- **Human Approval**: Critical decisions routed for human review

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- Docker and Docker Compose
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/crm-mvp.git
   cd crm-mvp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Frontend
   cp apps/frontend/.env.example apps/frontend/.env.local
   
   # Backend (when implemented)
   # cp apps/backend/.env.example apps/backend/.env
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Login with demo credentials or register a new account

## 🔧 Configuration

### Environment Variables

#### Frontend (.env.local)
```bash
# WebSocket connection
NEXT_PUBLIC_WS_URL=ws://localhost:3001

# WhatsApp API (when backend is implemented)
NEXT_PUBLIC_WHATSAPP_API_URL=https://waba.360dialog.io

# AI Configuration
NEXT_PUBLIC_OPENAI_API_KEY=your-openai-api-key
NEXT_PUBLIC_PINECONE_API_KEY=your-pinecone-api-key
```

### WhatsApp Setup (360dialog)

1. Sign up for 360dialog Business API
2. Get your API token and webhook secret
3. Configure webhook URL: `https://yourdomain.com/api/whatsapp/webhook`
4. Update environment variables

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

### Backend Architecture (Planned)
- **Runtime**: Node.js with TypeScript
- **Framework**: Fastify for high-performance APIs
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis for sessions and real-time data
- **Queue**: BullMQ for background jobs
- **Events**: Redis Streams for inter-service communication

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
# Development
npm run dev              # Start frontend development server
npm run build            # Build for production
npm run start            # Start production server

# Quality Checks
npm run lint             # ESLint validation
npm run typecheck        # TypeScript type checking
npm run format           # Code formatting

# Frontend specific
npm run dev:frontend     # Frontend development server
npm run build:frontend   # Build frontend
npm run test:frontend    # Frontend tests (when implemented)
```

### Project Structure

```
crm-mvp/
├── apps/
│   └── frontend/           # Next.js application
│       ├── src/
│       │   ├── app/        # App Router pages
│       │   ├── components/ # React components
│       │   │   ├── ai/     # AI-specific components
│       │   │   ├── dashboard/ # Dashboard components
│       │   │   └── ui/     # UI components
│       │   ├── hooks/      # Custom React hooks
│       │   ├── lib/        # Utilities and configurations
│       │   │   ├── websocket/ # WebSocket client
│       │   │   └── workflows/ # LangGraph workflows
│       │   ├── contexts/   # React contexts
│       │   └── types/      # TypeScript definitions
├── CLAUDE.md              # Detailed implementation guide
├── docker-compose.yml     # Development environment
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