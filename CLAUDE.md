# AI Agent Platform for SME CRMs

## Project Overview
Building the operating system for AI agents in CRM, not the agents themselves. Platform-first approach focused on enabling third-party AI agents through standardized protocols.

## AI Assistant Guidelines
- **Message Efficiency**: Minimize messages due to usage limits. Batch multiple operations in single responses.
- **Proactive Execution**: Complete tasks fully without asking for confirmation at each step.
- **Comprehensive Actions**: When given a task, execute all necessary steps to completion.
- **Single Response**: Combine analysis, implementation, testing, and verification in one response when possible.

## Development Standards

### Code Quality
- Clean Architecture principles with proper separation of concerns
- TypeScript with strict type checking
- Zod schema validation for all API endpoints
- Comprehensive error handling with structured logging
- Test-driven development with meaningful test coverage

### Commit Standards
- Signed commits: `git commit -s -m "type: description"`
- Feature branches with pull requests to main
- Conventional commit messages (feat, fix, refactor, test, docs)
- All CI checks must pass before merge

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

```bash
# Development
npm run dev                 # Start all services
npm run dev:backend         # Backend only
npm run dev:frontend        # Frontend only

# Quality Assurance
npm run lint               # ESLint validation
npm run typecheck          # TypeScript compilation
npm run test               # Run test suites
npm run ci-check           # Full CI validation locally

# Production
npm run build              # Production build
npm run start              # Start production server
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
- **PRODUCTION-READY**: Messages, Contacts, Leads, Achievements, Notifications

### Next Priorities
1. ✅ **COMPLETED**: Frontend-backend integration for all dashboard pages
2. ✅ **COMPLETED**: Realistic data seeding system
3. ✅ **COMPLETED**: Production-ready sandbox security (isolated-vm)
4. Performance optimization and caching
5. Enterprise authentication integration
6. Agent marketplace frontend integration
7. Additional dashboard pages (AI Assistant, Automation, Security, etc.)