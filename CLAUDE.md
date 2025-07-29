# AI Agent Platform for SME CRMs

## Project Overview
Building the operating system for AI agents in CRM, not the agents themselves. Platform-first approach focused on enabling third-party AI agents through standardized protocols.

## 🏗️ NEW ORGANIZED PROJECT STRUCTURE (2025)

```
crm-mvp/
├── apps/                     # Applications
│   ├── backend/             # Node.js/Fastify backend
│   └── frontend/            # Next.js frontend
├── packages/                # Shared libraries (moved from libs/)
│   ├── agent-sdk/          # AI agent development kit
│   └── agent-protocol/     # Universal agent protocol
├── docs/                   # All documentation (organized)
│   ├── README.md           # Main project overview
│   ├── DEVELOPMENT.md      # Development setup guide
│   ├── DEPLOYMENT.md       # Production deployment guide
│   ├── API.md             # API documentation
│   ├── ARCHITECTURE.md    # System design
│   ├── CONFIGURATION.md   # Environment variables
│   └── features/          # Feature-specific docs
├── scripts/               # All automation scripts (organized)
│   ├── dev/              # Development scripts
│   ├── deploy/           # Deployment scripts
│   └── ci/               # CI/CD scripts
├── infra/                # Infrastructure as code
│   ├── docker/           # Docker configurations
│   └── nginx/            # Nginx configurations
├── examples/             # Integration examples (moved from integrations/)
│   └── cozmox-voice-agent/
├── logs/                 # All log files (moved from root)
└── temp/                # Temporary files
```

### Key Improvements Made:
1. **Eliminated redundancy**: Removed duplicate proxy setups (proxy-server.js)
2. **Organized documentation**: Split 451-line README into focused documents
3. **Cleaner scripts**: Simplified development scripts in `/scripts/dev/`
4. **Better structure**: Clear separation of apps, packages, docs, and infrastructure
5. **Professional layout**: Industry-standard project organization

## AI Assistant Guidelines
- **Message Efficiency**: Minimize messages due to usage limits. Batch multiple operations in single responses.
- **Proactive Execution**: Complete tasks fully without asking for confirmation at each step.
- **Comprehensive Actions**: When given a task, execute all necessary steps to completion.
- **Single Response**: Combine analysis, implementation, testing, and verification in one response when possible.

### MCP Tool Usage Strategy
- **Security First**: Always run Semgrep security scans on new code before deployment
- **Research Integration**: Use Exa/Ref/DeepWiki for understanding technologies, APIs, and best practices
- **Database Safety**: Use Neon branching for safe schema changes and migrations
- **Deployment Automation**: Leverage Fly.io MCP for production deployments and monitoring
- **Quality Assurance**: Use Playwright for automated E2E testing of critical user flows
- **Documentation Discovery**: Search for implementation patterns and solutions using MCP research tools

### Proactive MCP Integration Examples
```typescript
// When implementing new features:
1. Research similar implementations using DeepWiki
2. Check security implications with Semgrep  
3. Test database changes on Neon branch
4. Validate UI changes with Playwright
5. Deploy safely to Fly.io with monitoring

// When debugging issues:
1. Search for solutions using Ref documentation
2. Analyze similar codebases with DeepWiki
3. Check for security vulnerabilities with Semgrep
4. Test fixes with browser automation
5. Deploy fixes with confidence
```

## Development Standards

### Code Quality
- Clean Architecture principles with proper separation of concerns
- TypeScript with strict type checking
- Zod schema validation for all API endpoints
- Comprehensive error handling with structured logging
- Test-driven development with meaningful test coverage

### Commit Standards (STRICT RULES)
- **MANDATORY**: Signed commits only: `git commit -s -m "type: description"`
- **MANDATORY**: Feature branches with pull requests to main - NO direct commits
- **FORBIDDEN**: AI/LLM-generated commit messages or language
- **REQUIRED**: Natural, human language - "fixed login bug" NOT "implement robust authentication mechanism"  
- **REQUIRED**: Conventional commit prefixes: feat, fix, refactor, test, docs
- **MANDATORY**: All CI checks must pass before merge
- **ABSOLUTELY FORBIDDEN**: Co-authored commits - only signed commits by actual developer
- **RULE**: Keep messages under 50 characters for summary line

### Architecture Principles

#### Backend (Node.js/Fastify)
- Route handlers focus solely on HTTP concerns
- Business logic encapsulated in service classes  
- Data access through repository pattern
- Dependency injection for testability
- Resource-based REST API design

#### Frontend (Next.js/TypeScript)
- Component composition over inheritance
- Custom hooks for business logic
- Zustand for client state management
- Server components where possible
- Progressive enhancement strategy

### Testing Strategy
- Unit tests for business logic
- Integration tests for API endpoints
- Component tests for UI interactions
- E2E tests for critical user flows
- Manual testing documentation for complex features

## Technical Stack

### Core Technologies
- **Backend**: Node.js, Fastify, TypeScript, PostgreSQL
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Database**: PostgreSQL with raw SQL migrations
- **Authentication**: JWT with role-based access control
- **Real-time**: Socket.io for agent communication

### Development Tools
- **Testing**: Jest, Supertest, React Testing Library
- **Quality**: ESLint, Prettier, TypeScript compiler
- **CI/CD**: GitHub Actions with comprehensive validation
- **Monitoring**: Winston logging, error tracking
- **MCP Tools**: Advanced development capabilities via Model Context Protocol

## Available MCP Tools & Services

### Code Analysis & Security
- **Semgrep**: Static code analysis, security vulnerability detection, custom rule creation
  - Use for: Security scanning, code quality checks, custom vulnerability patterns
  - Commands: `semgrep_scan`, `security_check`, `semgrep_findings`

### Cloud Infrastructure & Deployment  
- **Fly.io**: Production deployment, machine management, scaling
  - Use for: App deployment, machine monitoring, SSL certificates, IP management
  - Commands: `fly-apps-create`, `fly-machine-list`, `fly-certs-add`, `fly-logs`

- **Neon**: PostgreSQL database management, branching, migrations
  - Use for: Database operations, schema changes, query optimization, auth setup
  - Commands: `run_sql`, `prepare_database_migration`, `provision_neon_auth`

### Web Research & Documentation
- **Exa AI**: Advanced web search, research, content extraction
  - Use for: Market research, competitor analysis, technical documentation
  - Commands: `web_search_exa`, `company_research_exa`, `github_search_exa`

- **Ref**: Documentation search, API references, technical guides
  - Use for: Finding documentation, API specs, integration guides
  - Commands: `ref_search_documentation`, `ref_read_url`

- **DeepWiki**: GitHub repository analysis, codebase understanding
  - Use for: Understanding open source projects, code patterns, architecture analysis
  - Commands: `read_wiki_structure`, `ask_question`, `read_wiki_contents`

### Browser Automation & Testing
- **Playwright**: Browser automation, E2E testing, web scraping
  - Use for: Automated testing, UI validation, web app interaction
  - Commands: `browser_navigate`, `browser_click`, `browser_screenshot`

### Development Workflow Integration
```bash
# Security Analysis Workflow
1. Run semgrep security scan on new code
2. Address vulnerabilities before deployment
3. Create custom rules for project-specific patterns

# Database Management Workflow  
1. Use Neon for schema migrations and branching
2. Test changes in temporary branches
3. Apply migrations to production safely

# Research & Documentation Workflow
1. Use Exa for market/competitor research
2. Use Ref for technical documentation
3. Use DeepWiki for understanding codebases

# Deployment & Monitoring Workflow
1. Deploy to Fly.io with automated CI/CD
2. Monitor performance and logs
3. Scale based on usage patterns
```

## Universal Agent Protocol

### Core Concepts
```typescript
interface AgentAdapter {
  connect(credentials: AgentCredentials): Promise<Session>
  disconnect(sessionId: string): Promise<void>
  sendData(data: CRMData): Promise<ProcessingResult>
  receiveData(): Observable<AgentData>
  query(params: QueryParams): Promise<QueryResult>
}
```

### Integration Flow
1. Agent authentication and capability discovery
2. Permission-based resource access
3. Bidirectional data synchronization
4. Real-time event notifications
5. Secure sandbox execution environment

## Current Architecture

### Backend Services
- **Agent Protocol**: Core communication APIs
- **Agent Registry**: Discovery and management
- **Agent Sandbox**: Secure code execution
- **Data Processor**: CRM data transformation
- **Stats Service**: Analytics and reporting
- **Contacts API**: Full CRUD operations with search and filtering
- **Achievements API**: Progress tracking and unlocking system
- **Notifications API**: Real-time alerts with preferences management

### Frontend Components
- **Progressive Dashboard**: Stage-based feature disclosure
- **Agent Marketplace**: Third-party agent discovery
- **Integration Management**: Connection configuration
- **Real-time Monitoring**: Agent status and logs

## Development Commands

### NEW Simplified Scripts (2025)
```bash
# Development (NEW organized scripts)
./scripts/dev/start.sh      # Start all services with Docker
./scripts/dev/stop.sh       # Stop all services
./scripts/dev/restart.sh    # Restart services

# Legacy commands (still available)
npm run dev                 # Start all services
npm run dev:backend         # Backend only
npm run dev:frontend        # Frontend only

# Quality Assurance
npm run lint               # ESLint validation
npm run typecheck          # TypeScript compilation
npm run test               # Run test suites
npm run ci-check           # Full CI validation locally

# Production (NEW Docker-based)
docker-compose -f infra/docker/docker-compose.yml up -d  # Production deployment
docker-compose -f infra/docker/docker-compose.dev.yml up -d  # Development

# Legacy production commands
npm run build              # Production build
npm run start              # Start production server
```

### Deployment Options (2025)
```bash
# Free hosting platforms (recommended)
# 1. Railway: Push to GitHub, auto-deploy
# 2. Render: Connect repo, select Docker
# 3. Fly.io: fly launch && fly deploy
# 4. Back4app: Container deployment, no credit card required

# See docs/DEPLOYMENT.md for detailed guides
```

## Business Model

### Revenue Streams
- **Agent Marketplace**: 30% commission on subscriptions
- **CRM Platform**: Tiered subscription model
- **Enterprise Features**: Custom integrations and support
- **Developer Tools**: API access and SDK licensing

### Competitive Advantage
- **Network Effects**: More agents attract more users
- **Platform Lock-in**: High switching costs for established workflows  
- **Developer Ecosystem**: Third-party innovation drives adoption
- **Data Network**: Improved AI through aggregated insights

## Manual Testing Procedures

### Agent Integration Testing
1. Deploy test agent using provided SDK
2. Verify authentication and connection establishment
3. Test data synchronization in both directions
4. Validate real-time event delivery
5. Confirm resource limits and security isolation

### Dashboard Feature Testing
1. Create test user account
2. Add sample CRM data (contacts, messages)
3. Verify progressive feature unlocking
4. Test all dashboard statistics calculations
5. Confirm responsive design across devices

### Performance Validation
1. Load test with 100+ concurrent agent connections
2. Verify response times under 200ms for API calls
3. Test memory usage during peak sandbox execution
4. Validate database query performance with large datasets
5. Monitor real-time WebSocket message delivery latency

## Security Considerations

### Agent Sandbox Security
- **PRODUCTION-READY**: isolated-vm based code execution (replaced vulnerable vm2)
- Resource limits: CPU, memory, network access
- Permission-based API access control
- Audit logging for all agent activities
- Secure memory isolation and context management

### Data Protection
- End-to-end encryption for agent communication
- Database encryption at rest
- PII anonymization in logs
- GDPR compliance for user data handling

## Deployment Strategy

### Environment Progression
- **Development**: Local Docker containers
- **Staging**: Kubernetes cluster with production data
- **Production**: Multi-region deployment with auto-scaling

### Monitoring and Observability
- Application performance monitoring
- Real-time error tracking and alerting
- Business metrics dashboard
- Agent performance analytics

## Data Management

### Realistic Data Seeding
- **Dynamic Data Generation**: Server startup creates realistic CRM data
- **Web-Sourced Content**: Research-based notifications, achievements, and interactions
- **MVP Showcase Ready**: Historical data for demonstrations
- **Teardown/Rebuild**: Clean slate on restart with fresh realistic data
- **No Static Hardcoding**: All data dynamically generated from templates

### Database Architecture  
- **Contacts System**: Full-text search, tags, status tracking
- **Achievements System**: Progress-based unlocking, rarity tiers
- **Notifications System**: Template-based, real-time delivery
- **User Progress**: Stats tracking, stage progression

## Current Status

### Completed Features
- Universal Agent Protocol backend APIs
- **SECURE** Agent sandbox execution environment (isolated-vm)
- Progressive dashboard with real user stats
- Comprehensive test infrastructure
- CI/CD pipeline with quality gates
- **COMPLETE END-TO-END**: All major dashboard pages connected to backend
- **FULL CRUD**: Contacts, achievements, and notifications APIs
- **REAL-TIME**: Notifications, messages, and progress tracking
- **DYNAMIC DATA**: Realistic data seeding with Indian business context
- Database migrations with proper indexing and full-text search
- Real-time notification delivery via Socket.io
- **PRODUCTION-READY**: Messages, Contacts, Leads, Achievements, Notifications, Integrations
- **DOCKER SETUP**: Proxy configuration with ngrok support for development
- **INTEGRATIONS SYSTEM**: Complete backend APIs with marketplace-ready UI
- **FLY.IO DEPLOYMENT**: Successfully deployed to production with CI/CD pipeline

### Next Priorities
1. ✅ **COMPLETED**: Frontend-backend integration for all dashboard pages
2. ✅ **COMPLETED**: Realistic data seeding system
3. ✅ **COMPLETED**: Production-ready sandbox security (isolated-vm)
4. ✅ **COMPLETED**: Integrations system with Docker proxy setup
5. ✅ **COMPLETED**: Fly.io deployment with automated CI/CD
6. ✅ **COMPLETED**: Docker image optimization (622MB → 308MB, 50% reduction)
7. Performance optimization and caching
8. Enterprise authentication integration
9. Agent marketplace frontend integration
10. Additional dashboard pages (AI Assistant, Automation, Security, etc.)

## Deployment Optimization

### Current Status
- **✅ COMPLETED**: Docker image optimization (622MB → 308MB, 50% reduction)
- **⚠️ COST CONCERN**: Fly.io charges for multiple machines - apps deleted to avoid costs
- **🎯 ACHIEVED**: Multi-stage backend-only build with production optimizations
- **📦 Final Image**: 308MB uncompressed, 68MB compressed on registry

### Optimization Strategies Implemented
1. ✅ **Multi-stage Docker builds**: Separate deps, builder, and runtime stages
2. ✅ **Alpine base images**: Using node:22-alpine for minimal footprint
3. ✅ **Dependency pruning**: Production-only deps in runtime stage
4. ✅ **Backend-only focus**: Eliminated frontend from production image
5. ✅ **Security hardening**: Non-root user, dumb-init, proper signals
6. ✅ **Layer optimization**: Efficient copying and caching strategies

### Cost Optimization Notes
- **IMPORTANT**: Fly.io charges per machine - avoid multiple simultaneous deployments
- **Single service deployment**: Current Dockerfile optimized for backend-only
- **Resource settings**: fly.toml configured for 512MB RAM, shared CPU
- **Extended uptime**: Configured with min_machines_running = 1 to prevent auto-sleep
- **Keep-alive monitoring**: Automated health checks every 15 minutes to maintain activity
- **Health checks**: Proper /health endpoint for cost-effective monitoring

### Backend Uptime Management
- **Extended runtime**: Backend configured to run continuously without auto-stop
- **Keep-alive script**: `./scripts/keep-backend-alive.sh` for automated health monitoring
- **Usage**: Run `./scripts/keep-backend-alive.sh continuous` to prevent idle shutdown
- **Monitoring interval**: Health checks every 15 minutes to maintain machine activity
- **Manual check**: Use `./scripts/keep-backend-alive.sh single` for one-time health test

### Future Deployment Strategy
- Use single backend-only deployment for cost efficiency
- Frontend can be deployed separately on free hosting (Vercel, Netlify)
- Consider Railway or Render for potentially lower costs than Fly.io
- Monitor resource usage and scale appropriately