# MVP Design Document: Agentic CRM for Indian SMEs

## 1. Context & Problem Statement

SMEs in India face complexity, high cost, and poor user experience with current CRMs (Zoho, Odoo, HubSpot, Telecrm, Neodove, etc). WhatsApp is a core channel but most CRMs offer poor integrationoften requiring agents to copy/paste numbers or juggle multiple tabs. SMEs lack time and technical expertise to set up automations (Zapier/n8n/etc.), and need a simple solution that just works.

**The opportunity**: Build a CRM platform from the ground up with an agentic AI-first approach.

The initial MVP will:
- Focus on lead collection + WhatsApp AI agent workflow
- Remove friction: All chat and lead actions from a single interface
- Automate repetitive messaging and record-keeping
- Be so simple that a non-tech-savvy SME owner can run their sales/support from day one

## 2. MVP Goals

- **Unified Lead & Chat Interface**: All leads and WhatsApp conversations in a single pane
- **One-click Outreach**: Send messages, follow up, or respond from the lead's page
- **AI Suggestions**: Multiple specialized AI agents suggest reply drafts, recommended templates, next actions
- **Memory**: Show previous WhatsApp chat history inline with RAG-powered context
- **Zero-config Automations**: Default follow-up flows suggested by AI based on user behavior
- **Human-in-the-loop**: User can edit/approve messages before sending

## 3. Modern Architecture (Updated)

### Frontend Stack
- **Framework**: Next.js 14+ with App Router, React Server Components, TypeScript
- **Styling**: Tailwind CSS + Shadcn/ui component library
- **State Management**: Zustand for client state, React Query for server state
- **Real-time**: Socket.io client for live chat updates and notifications
- **Testing**: Vitest + React Testing Library + Playwright E2E

### Backend Architecture
- **Pattern**: Event-driven microservices architecture
- **Runtime**: Node.js with TypeScript (Bun for performance-critical services)
- **API Framework**: Fastify for high-performance APIs with OpenAPI documentation
- **Event Bus**: Redis Streams for inter-service communication
- **Queue System**: BullMQ with Redis for background job processing
- **API Gateway**: Tyk or Kong for rate limiting, authentication, and routing

### Database & Storage
- **Primary DB**: PostgreSQL with Prisma ORM for type-safe database operations
- **Caching**: Redis for sessions, real-time data, and frequently accessed lead information
- **Vector Store**: Pinecone for chat embeddings and RAG (Retrieval Augmented Generation)
- **File Storage**: AWS S3 or similar for media attachments

### AI Agent System (Core Innovation)
- **Orchestration**: LangChain for agent coordination and workflow management
- **Specialized Agents**:
  - **Lead Qualification Agent**: Analyzes lead quality and suggests categorization
  - **Message Generation Agent**: Creates contextual WhatsApp responses
  - **Follow-up Scheduler Agent**: Determines optimal timing and content for follow-ups
  - **Intent Recognition Agent**: Understands customer intent from messages
  - **Context Memory Agent**: Maintains conversation context using RAG
- **LLM Provider**: OpenAI GPT-4o (primary), Google Gemini (fallback), with option for local models
- **Prompt Engineering**: Structured prompt templates with business context injection

### Core Microservices
- **lead-service**: Lead management, lifecycle tracking, and analytics
- **chat-service**: WhatsApp integration, message handling, and history
- **ai-orchestrator**: AI agent coordination, prompt management, and response generation
- **notification-service**: Automated follow-ups, alerts, and scheduling
- **analytics-service**: Business metrics, AI performance, and user insights
- **auth-service**: User authentication, authorization, and business profile management

### External Integrations
- **WhatsApp Business API**: 360dialog (primary), Twilio/Gupshup (fallback)
- **AI Services**: OpenAI API, Google Gemini, Pinecone vector database
- **Monitoring**: Prometheus + Grafana, Sentry for error tracking
- **Deployment**: Docker + Kubernetes, CI/CD with GitHub Actions

## 4. Key User Flows (MVP)

### Lead Ingestion
- Add leads manually through optimized forms
- Import via Excel with data validation and deduplication
- Capture from web form with lead scoring
- Auto-qualify leads using AI Lead Qualification Agent

### WhatsApp Chat in CRM
- See all WhatsApp messages with each lead directly on the lead page
- Real-time message sync without opening WhatsApp Web
- Message threading and conversation history
- Media attachment handling (images, documents, voice notes)

### AI-Powered Message Suggestions
For each lead, specialized AI agents suggest:
- **Greeting/intro message** (personalized based on lead source)
- **Follow-up/reminder** (timing optimized by AI)
- **Answer to incoming message** (context-aware with chat history)
- **Next action recommendations** (e.g., "Schedule call? Send brochure?")
- User can edit/approve before sending

### Automated Follow-up Workflows
- AI nudges user to follow up based on lead status and behavior patterns
- Smart timing suggestions (e.g., "No reply in 2 days, suggest follow-up")
- Option to let AI auto-send if user opts in to specific workflows
- A/B testing different follow-up strategies

### Comprehensive Timeline & Analytics
- Show all interactions (messages sent, calls, status changes) in unified timeline
- AI-generated insights on lead engagement patterns
- Basic analytics: # of leads contacted, # of replies, # of deals closed
- Lead scoring and quality metrics from AI analysis

## 5. AI Agent Prompt Engineering

### System Context Architecture
```typescript
interface AIContext {
  business_profile: {
    company_name: string;
    industry: string;
    preferred_tone: 'professional' | 'friendly' | 'casual';
    knowledge_base: string;
    products_services: string[];
  };
  lead: {
    name: string;
    company?: string;
    source: string;
    status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'closed';
    last_message: string;
    engagement_score: number;
    chat_history: Message[];
  };
  task: 'generate_reply' | 'suggest_followup' | 'qualify_lead' | 'recommend_action';
  context_embeddings: VectorSearchResult[];
}
```

### Agent-Specific Prompts

#### Lead Qualification Agent
```
You are a lead qualification specialist for {business_name} in the {industry} industry.

Analyze the lead's messages, company info, and engagement to determine:
1. Lead quality score (1-10)
2. Buying intent level (low/medium/high)
3. Budget qualification (if discernible)
4. Decision-maker likelihood
5. Recommended next action

Consider: response time, message quality, specific product inquiries, company size indicators.
```

#### Message Generation Agent
```
You are a WhatsApp messaging specialist for {business_name}.

Generate a response that:
- Matches the business tone: {preferred_tone}
- Addresses the lead's specific question/need
- Uses context from previous conversations
- Includes relevant product/service information
- Suggests a clear next step
- Uses appropriate WhatsApp formatting (bold, bullets, emojis where suitable)

Chat history: {chat_history}
Business knowledge: {knowledge_base}
Lead context: {lead_info}
```

#### Follow-up Scheduler Agent
```
You are a follow-up timing specialist for {business_name}.

Based on:
- Lead's last interaction: {last_interaction}
- Time since last contact: {time_elapsed}
- Lead engagement pattern: {engagement_history}
- Business follow-up policies: {followup_rules}

Determine:
1. Optimal follow-up timing (immediate/hours/days)
2. Follow-up message tone (gentle/urgent/informative)
3. Specific message content suggestions
4. Alternative contact methods if WhatsApp fails
```

## 6. Technical Implementation Stack

### Development Environment
```bash
# Package Management
npm/yarn with workspaces for monorepo structure

# Development Tools
- TypeScript for type safety
- ESLint + Prettier for code formatting
- Husky for git hooks
- Conventional commits for clear git history

# Testing Stack
- Vitest for unit testing
- React Testing Library for component testing
- Playwright for E2E testing
- Jest for service testing
```

### Deployment & DevOps
```yaml
# Docker Containerization
- Multi-stage builds for optimization
- Health checks for all services
- Security scanning with Snyk

# Kubernetes Deployment
- Helm charts for environment management
- Horizontal Pod Autoscaling
- Ingress with SSL termination
- Persistent volumes for data

# CI/CD Pipeline
- GitHub Actions for automation
- Automated testing on PR
- Security and dependency scanning
- Blue-green deployment strategy
```

### Monitoring & Observability
- **Logging**: Structured JSON logs with Winston
- **Metrics**: Prometheus with custom AI performance metrics
- **Tracing**: Jaeger for distributed request tracing
- **Alerts**: Grafana dashboards with Slack/email notifications
- **Health Checks**: Liveness and readiness probes for all services

## 7. Data Models & Schema

### Core Entities
```typescript
// Lead Management
interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  source: string;
  status: LeadStatus;
  quality_score: number;
  created_at: Date;
  updated_at: Date;
}

// WhatsApp Messages
interface Message {
  id: string;
  lead_id: string;
  direction: 'inbound' | 'outbound';
  content: string;
  message_type: 'text' | 'image' | 'document' | 'audio';
  whatsapp_message_id: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read' | 'failed';
}

// AI Suggestions
interface AISuggestion {
  id: string;
  lead_id: string;
  agent_type: string;
  suggestion_type: string;
  content: string;
  confidence_score: number;
  status: 'pending' | 'approved' | 'rejected' | 'modified';
  created_at: Date;
}
```

## 8. Security & Compliance

### Data Protection
- GDPR-compliant data handling for international leads
- Encryption at rest and in transit
- Regular security audits and penetration testing
- Secure API key management with HashiCorp Vault

### WhatsApp Compliance
- Official WhatsApp Business API compliance
- Message template approval process
- Opt-in/opt-out handling
- Rate limiting to prevent spam classification

### Access Control
- Role-based access control (RBAC)
- Multi-factor authentication (MFA)
- API rate limiting and DDoS protection
- Audit logging for all user actions

## 9. Performance & Scalability

### Optimization Strategies
- Database connection pooling and read replicas
- Redis caching for frequently accessed data
- CDN for static assets and media files
- Lazy loading for chat history pagination
- Background processing for AI operations
- Database indexing on lead queries and message lookups

### Scalability Targets
- Support 10,000+ leads per business
- Handle 1,000+ concurrent WhatsApp messages
- Sub-2-second AI response generation
- 99.9% uptime for webhook endpoints
- Horizontal scaling for increased load

## 10. Next Steps & Roadmap

### Phase 1: MVP Development (Month 1-2)
1. Set up development environment and CI/CD pipeline
2. Implement core lead management and WhatsApp integration
3. Develop initial AI agents (Message Generation + Lead Qualification)
4. Create basic frontend with lead list and chat interface
5. Deploy to staging environment with monitoring

### Phase 2: AI Enhancement (Month 3)
1. Implement remaining AI agents (Follow-up Scheduler, Intent Recognition)
2. Add RAG system with Pinecone for better context
3. Develop A/B testing framework for AI responses
4. Implement real-time notifications and updates
5. Beta testing with 3-5 pilot SMEs

### Phase 3: Scale & Polish (Month 4-6)
1. Performance optimization and load testing
2. Advanced analytics and reporting dashboard
3. Mobile-responsive design improvements
4. Integration with other communication channels (Email, SMS)
5. Marketplace launch preparation

### Open Questions for Decision
1. **AI Model Choice**: OpenAI GPT-4o vs Google Gemini for cost/performance balance?
2. **Deployment Platform**: AWS vs GCP vs Azure for WhatsApp API proximity?
3. **Pricing Strategy**: Per-lead, per-message, or subscription-based pricing?
4. **Multi-tenancy**: Single-tenant per SME vs multi-tenant architecture?
5. **Compliance**: Additional industry-specific compliance requirements (HIPAA, SOX)?