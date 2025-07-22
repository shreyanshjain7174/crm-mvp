# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Roles and Responsibilities

### Development Team Structure
This is a **solo entrepreneur project** where Claude Code serves as the primary technical co-founder, handling all aspects of full-stack development, architecture, and technical decision-making.

### Claude's Primary Responsibilities

#### 1. **Technical Leadership & Architecture**
- Make all architectural decisions balancing scalability, maintainability, and cost
- Design database schemas, API structures, and frontend component hierarchies
- Ensure code quality, performance, and security best practices
- Plan and implement technical roadmap aligned with business objectives

#### 2. **Full-Stack Development**
- **Backend Development**: FastAPI/Node.js APIs, database design, authentication, AI integration
- **Frontend Development**: React/Next.js components, state management, responsive design
- **DevOps & Infrastructure**: Docker containerization, CI/CD pipelines, deployment automation
- **Testing & Quality Assurance**: Unit tests, integration tests, E2E testing, performance monitoring

#### 3. **Product & Business Alignment**
- Translate business requirements into technical specifications
- Prioritize features based on user value and technical complexity
- Implement progressive disclosure patterns for optimal user experience
- Optimize for Indian SME market constraints (cost, mobile-first, offline capability)

#### 4. **Code Quality & Documentation**
- Write clean, documented, maintainable code
- Maintain comprehensive documentation in CLAUDE.md
- Implement proper error handling and logging
- Ensure TypeScript type safety and ESLint compliance

#### 5. **AI/ML Integration**
- Design and implement AI agent workflows
- Integrate LLMs for customer interaction automation
- Build vector database systems for context retrieval
- Optimize AI costs while maintaining quality

### User's Responsibilities
- **Product Vision**: Define business requirements and user needs
- **Market Validation**: Gather user feedback and validate product-market fit
- **Business Operations**: Sales, marketing, customer support, legal compliance
- **Strategic Direction**: Set priorities, timeline, and resource allocation
- **Quality Assurance**: Review features, approve releases, test user workflows

### Collaboration Workflow
1. **User provides**: Business requirements, feature specifications, user feedback
2. **Claude analyzes**: Technical feasibility, implementation approach, resource requirements
3. **Claude implements**: Code, tests, documentation, deployment
4. **User reviews**: Functionality, user experience, business alignment
5. **Iterate**: Based on feedback and changing requirements

### Decision-Making Framework
- **Technical Decisions**: Claude has full autonomy (stack, architecture, implementation)
- **Product Decisions**: User sets direction, Claude provides technical input
- **Resource Allocation**: Collaborative based on technical complexity and business priority
- **Quality Standards**: Claude maintains high standards, user defines acceptance criteria

## CRITICAL PIVOT: Platform Strategy 🚨

### The Fundamental Shift
We are **NOT** building an AI agent company. We are building the **operating system for AI agents in CRM**.

### Key Realizations (Based on Tony's Analysis)
1. **AI Agents are becoming commoditized** - All voice agents do similar things
2. **Integration is the pain point** - Not the AI capability itself  
3. **UI/UX is the differentiator** - Not the AI technology
4. **Platform beats Product** - Always

## Project Overview

**AI Agent Platform for SME CRMs** - A WhatsApp-first CRM that serves as the **operating system for AI agents**. Instead of building AI agents, we build the best interface where ANY AI agent can plug in and work seamlessly. Progressive disclosure ensures users aren't overwhelmed while building toward a comprehensive AI-powered business platform.

### The New Vision: CRM as AI Agent Operating System

**Core Insight**: Creating an AI-friendly UI within CRM is much more valuable than building AI agents. We don't compete with AI agent companies - we become their preferred integration platform.

**What This Means**:
- Don't build AI agents - Build the best interface for ANY AI agent
- Don't compete with Cozmox - Let them plug into YOUR platform  
- Own the UI real estate - That's where the moat is
- Become the App Store - Not the app developer

## New Core Philosophy

**"Progressive Disclosure to AI Agent Marketplace"** - The platform evolves from simple CRM to AI agent ecosystem:
- **Day 1**: Simple contact manager
- **Week 1**: WhatsApp communication hub
- **Week 2**: **Agent Marketplace** - Install and manage AI agents  
- **Month 1**: **Multi-Agent Orchestration** - Multiple agents working together

### Platform Vision
Transform from "we build AI" to "we enable all AI" - a platform where:
- **Universal Integration**: Any AI agent can plug in with our adapter system
- **Native Experience**: All agents feel built into the CRM, not bolted on
- **One Interface**: Manage all your AI tools from a single dashboard
- **Agent Marketplace**: Discover, install, and manage AI agents like mobile apps
- **Revenue Sharing**: We take commission, agents get distribution

### Business-First Development Mantra
**"Ship fast, iterate faster, but never compromise on user experience or data security."**

Every line of code should either:
- Solve a real user problem
- Reduce operational costs  
- Improve system reliability
- Enable future growth

When in doubt, choose the solution that gets us to market faster while maintaining quality. We can always refactor later, but we can't get back lost time-to-market.

## Implementation Strategy

### Phase 1: Blank Slate Dashboard (Priority 1)

The dashboard should start completely empty with a single CTA. Features unlock based on user actions.

```typescript
// User Journey Stages
Stage 1: "First Contact" → Unlocks contact list
Stage 2: "First Message" → Unlocks chat interface  
Stage 3: "Growing Contacts" (10+) → Unlocks pipeline view
Stage 4: "Busy User" (5+ messages) → Unlocks AI assistant with pattern learning
Stage 5: "Power User" (10+ AI approvals) → Unlocks automation
```

## Architecture

### Frontend Stack
- **Framework**: Next.js 14+ with App Router and TypeScript
- **Styling**: Tailwind CSS + Shadcn/ui components
- **State**: Zustand for client state, React Query for server state
- **Real-time**: Socket.io client for live chat updates

### Backend Architecture
- **Pattern**: Microservices with event-driven architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Fastify for high performance APIs
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis for sessions and real-time data
- **Queue**: BullMQ for background jobs
- **Events**: Redis Streams for inter-service communication

### AI Agent Platform Architecture 🚨 NEW

#### Universal Agent Protocol
Every AI agent must implement this interface:
```typescript
interface UniversalAgentAdapter {
  // Core capabilities
  connect(): Promise<void>
  disconnect(): Promise<void>
  
  // Data flow
  sendToAgent(data: CRMData): Promise<void>
  receiveFromAgent(): Observable<AgentData>
  
  // UI requirements  
  getConfigUI(): ReactComponent
  getActionButtons(): ActionButton[]
  getDataDisplay(): DataRenderer
}
```

#### Agent Marketplace System
```typescript
const AgentMarketplace = {
  featured: [
    {
      name: "Cozmox Voice Assistant",
      provider: "Cozmox AI", 
      installs: "10K+",
      price: "Free to install, usage-based",
      capabilities: ["voice", "outbound", "scheduling"]
    },
    {
      name: "WhatsApp AI Responder", 
      provider: "Local AI Co",
      installs: "50K+",
      price: "₹999/month",
      capabilities: ["whatsapp", "auto-reply", "local"]
    }
  ]
}
```

#### Platform Services
- **Agent Registry**: Discovery and installation system
- **Universal Data Layer**: Normalized data sync across all agents
- **Permission System**: Granular access control for agents
- **Event Bus**: Real-time communication between agents and CRM
- **Revenue Engine**: Commission tracking and payment processing

### Core Services
- **lead-service**: Lead management and lifecycle
- **chat-service**: WhatsApp integration and message handling
- **ai-orchestrator**: AI agent coordination and prompt management
- **notification-service**: Automated follow-ups and alerts
- **analytics-service**: Metrics and reporting

## Development Commands

```bash
# Install dependencies
npm install

# Development mode (all services)
npm run dev

# Run specific service
npm run dev:frontend
npm run dev:lead-service
npm run dev:chat-service

# Database operations
npm run db:migrate
npm run db:seed
npm run db:studio

# Testing
npm run test           # Run all tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage report
npm run test:e2e       # Run end-to-end tests

# Linting and formatting
npm run lint
npm run format
npm run typecheck

# Build and deployment
npm run build
npm run start
npm run docker:build
npm run deploy:staging
npm run deploy:prod
```

## Test-Driven Development Workflow

### Feature Development Process
```bash
# 1. Create feature branch
git checkout -b feature/whatsapp-templates

# 2. Write tests first (TDD)
npm run test:watch

# 3. Implement feature
# - Start with the simplest case
# - Add complexity incrementally
# - Refactor as you go

# 4. Update documentation
# - Add JSDoc comments
# - Update README if needed
# - Add to changelog

# 5. Submit PR with:
# - Clear description
# - Screenshots/videos
# - Test coverage report
# - Performance impact
```

### Development Principles
- **You're not just writing code - you're building a business**
- **Platform First**: Every feature should enable agents, not compete with them
- Write tests first, then implement (TDD approach)
- Start with the simplest case, add complexity incrementally  
- Refactor continuously as you go
- Every feature should solve a real user problem
- Prioritize time-to-market while maintaining quality
- Document as you build, not after

## New Business Model: Platform Economics 🚨

### Revenue Transformation
**Old Model (Product)**:
- Build AI agents
- Charge for AI usage
- Compete with specialists
- High development cost
- Limited differentiation

**New Model (Platform)**:
- Agent marketplace (30% commission)
- CRM subscription (₹999-4999/month)
- Premium integrations
- Enterprise API access
- Developer ecosystem

### Go-to-Market Strategy 2.0

#### Phase 1: Basic CRM with Agent-Ready Architecture
- Launch simple CRM (contacts, WhatsApp)
- But with agent hooks built-in
- Open API documentation
- Court agent developers

#### Phase 2: First Agent Partnerships  
- Partner with 3-5 agent companies
- Build adapters together
- Showcase seamless integration
- "Powered by [Agent], Enhanced by [YourCRM]"

#### Phase 3: Open Marketplace
- Self-service agent onboarding
- Revenue sharing model
- Featured agents program
- Success stories marketing

### Why This Wins
- **Network Effects**: More agents → more users → more agents
- **Defensible Moat**: Switching cost increases with each agent
- **Lower CAC**: Agents bring their own users
- **Higher LTV**: Multiple revenue streams per customer
- **Reduced Risk**: Not dependent on your AI being best

### Success Metrics
- Number of agents in marketplace
- Installs per agent
- Cross-agent usage (users with 2+ agents)
- Developer sign-ups
- Revenue per user (CRM + agent commissions)

## Critical Development Guidelines

### Package Management & Dependencies
- **ALWAYS** update package.json when importing new modules or libraries
- **NEVER** commit code with missing dependencies that exist in node_modules but not in package.json
- When adding new npm packages, use `npm install <package>` to ensure package.json and package-lock.json are updated
- For TypeScript types, add to devDependencies: `npm install --save-dev @types/<package>`

### Pre-Commit Requirements
- **ALWAYS** run `npm run lint` before pushing any changes
- **ALWAYS** run `npm run typecheck` before pushing any changes
- Fix all ESLint errors and warnings before committing
- Resolve all TypeScript compilation errors before pushing
- Both frontend and backend must pass lint and typecheck

### CI/CD Pipeline Requirements
The following checks must pass in CI:
1. TypeScript compilation (frontend & backend)
2. ESLint checks (frontend & backend)  
3. Unit tests (when available)
4. Build process completion

### Common Issues to Avoid
- Missing dependencies causing "Module not found" errors in CI
- Implicit 'any' types causing TypeScript compilation failures
- React Hook violations (conditional hooks, missing dependencies)
- Unescaped entities in JSX (use &apos; instead of ')
- Unused variables and imports
- Missing useCallback/useMemo for stable references in useEffect dependencies

## Recent Major Updates

### Visual Workflow Builder Implementation (July 2024) ✅ COMPLETED
- **Drag-and-Drop Interface**: ✅ Complete workflow canvas with @hello-pangea/dnd
  - Visual workflow builder with 14+ node types (trigger, action, condition, AI agent, etc.)
  - Real-time drag-and-drop from palette to canvas with visual feedback
  - Node positioning, connections, and workflow orchestration
  - Undo/redo functionality with complete state management

- **Workflow Architecture**: ✅ Comprehensive workflow system
  - Complete TypeScript type system for workflows (`/types/workflow-types.ts`)
  - Zustand store for workflow state management (`/stores/workflowBuilder.ts`)
  - Node palette with categorized components (`/components/workflow/NodePalette.tsx`)
  - Workflow canvas with connection handling (`/components/workflow/WorkflowCanvas.tsx`)
  - Node component system with validation and execution

- **Progressive Disclosure Fixes**: ✅ New user onboarding resolved
  - Fixed Add Contact button visibility for new users
  - Enabled discovery prompts for all user stages
  - Added proper action handlers for new user interactions
  - Maintained development bypass tools for testing progressive features

### Comprehensive Testing Infrastructure (July 2024) ✅ COMPLETED
- **Backend Testing Setup**: ✅ Complete Jest + Supertest testing infrastructure
  - Jest configuration with TypeScript support and ts-jest preset
  - Test database setup with PostgreSQL and proper cleanup
  - Comprehensive test fixtures and helpers for realistic scenarios
  - API endpoint testing with real database integration
  - Coverage reporting and CI/CD integration ready

- **Stats API Test Coverage**: ✅ Complete unit and integration tests
  - Dashboard stats API tests (totalLeads, activeConversations, conversionRate, hotLeads)
  - User progress API tests (stage calculation, progress percentage, requirements)
  - Growth percentage calculations and time-based edge cases
  - Database error handling and graceful failure scenarios
  - Mock data and realistic test scenarios covering all user stages

- **Test Organization**: ✅ Structured test architecture
  - `/tests/routes/` - API endpoint tests with supertest
  - `/tests/utils/` - Test helpers and Fastify app builders
  - `/tests/__fixtures__/` - Mock data and common test objects
  - `/tests/setup.ts` - Global test configuration and database cleanup
  - Separate test environment with `.env.test` configuration

- **Quality Assurance Standards**: ✅ Production-ready testing approach
  - Test-driven development practices with comprehensive coverage
  - Real database integration testing (not just mocks)
  - Performance and reliability validation
  - Error scenario testing for production resilience
  - Automated test execution ready for CI/CD pipeline

### Progressive Disclosure CRM Implementation (July 2024) ✅ COMPLETED
- **Core Philosophy**: Completely restructured CRM to implement progressive disclosure design
  - Dashboard starts completely blank with single CTA
  - Features unlock naturally through usage (no training required)
  - Progressive complexity: Contact Manager → WhatsApp Hub → AI Assistant → Full CRM
  - Natural discovery replaces traditional onboarding

- **User Progress System**: ✅ Complete user journey tracking
  - 5 distinct user stages: New → Beginner → Intermediate → Advanced → Expert
  - Persistent progress tracking with Zustand store (`/stores/userProgress.ts`)
  - Feature gates based on actual usage patterns and achievements
  - Real-time stats tracking (contacts, messages, AI interactions)

- **Progressive Navigation**: ✅ Dynamic menu system
  - Navigation items appear/disappear based on user stage (`/components/layout/ProgressiveNavigation.tsx`)
  - Visual progress indicators with stage emoji and progress bars
  - Locked features preview showing what's coming next
  - Next goal section with clear advancement requirements

- **Empty State Components**: ✅ Contextual guidance system (`/components/empty-states/`)
  - EmptyContacts: First contact onboarding with import options
  - EmptyMessages: WhatsApp integration status and capabilities
  - EmptyPipeline: Pipeline view unlock requirements (10 contacts)
  - EmptyAI: AI assistant unlock requirements (50 messages)
  - EmptyAnalytics: Advanced analytics unlock (25 AI interactions)

- **Feature Reveal Animations**: ✅ Celebration system (`/components/animations/`)
  - FeatureReveal: Modal celebrations for newly unlocked features
  - ProgressAnimation: Animated progress bars with milestone markers
  - StageTransition: Stage advancement celebrations with confetti
  - Framer Motion integration for smooth transitions

- **Stage-based Components**: ✅ Progressive dashboard system
  - NewUserStage: Clean hero section with journey roadmap
  - BeginnerStage: Progress summary with next steps guidance
  - ProgressiveDashboard: Main wrapper with conditional rendering
  - Feature-gated sections with unlock teasers

### Complete CI/CD Pipeline Fixes (July 2024) ✅ COMPLETED
- **Docker Build Issues Fixed**: ✅ Complete resolution of NPM workspace structure issues
  - Fixed build context from app-specific to root directory
  - Updated all Dockerfiles to handle NPM workspace dependencies correctly
  - Resolved TypeScript compilation issues in Docker builds
  - Added proper multi-stage builds for dev/prod dependency separation
  - Fixed user creation conflicts in Docker containers
  - Optimized build performance and reduced CI timeout from 20+ minutes to under 5 minutes

- **CI/CD Performance Optimization**: ✅ Sub-5 minute pipeline execution
  - Reduced Docker build timeout from 30 to 15 minutes
  - Added GitHub Actions cache for Docker builds (type=gha)
  - Removed no-cache flag to enable faster incremental builds
  - Use npm ci with --prefer-offline for faster dependency installation
  - Expected CI time reduction from 10+ minutes to under 5 minutes
  - Better Docker layer caching with GitHub Actions cache

- **Facebook WhatsApp API Integration**: ✅ Migrated from paid AiSensy to free Facebook WhatsApp Cloud API
  - Complete backend migration to Facebook Graph API v21.0
  - Updated webhook schemas and message handling
  - Implemented proper Facebook webhook verification
  - Added test phone numbers and message sending functionality
  - Configured ngrok tunneling for local webhook testing
  - Added comprehensive error handling and logging

- **GitHub Pages Deployment**: ✅ Removed (private repository)
  - Completely removed GitHub Pages deployment job for private repository
  - Fixed CI/CD failures caused by Pages configuration errors
  - Private repositories require GitHub Pro/Enterprise for Pages deployment
  - Streamlined CI/CD workflow for faster execution

- **ESLint and TypeScript Fixes**: ✅ Resolved all linting and compilation errors
  - Fixed unused variable errors across all backend services
  - Added proper TypeScript type checking and compilation
  - Resolved switch statement block scoping issues
  - Fixed parameter naming conventions with underscore prefixes
  - Added @hello-pangea/dnd dependency for drag-and-drop functionality
  - Fixed TypeScript implicit 'any' type errors with proper type annotations
  - Resolved React Hook violations (conditional hooks, missing dependencies)
  - Fixed unescaped entities in JSX components
  - Added useCallback/useMemo for stable function references
  - All code now passes ESLint and TypeScript checks

### Current System Status (Post-Pivot)
- **Backend Services**: ✅ FastAPI + PostgreSQL + Redis fully operational
- **Frontend**: ✅ Next.js 14 with App Router, Tailwind CSS, and progressive disclosure
- **Authentication**: ✅ JWT-based auth with demo mode support
- **Database**: ✅ PostgreSQL with raw SQL queries (migrated from Prisma for Docker compatibility)
- **WhatsApp Integration**: ✅ Facebook WhatsApp Cloud API (free tier)
- **Real-time Features**: ✅ Socket.io for live updates and notifications
- **Deployment**: ✅ Docker containerization with multi-stage builds
- **CI/CD**: ✅ GitHub Actions with automated testing, building, and deployment (sub-5 minute execution)
- **Testing**: 🔄 Comprehensive backend test strategy in implementation (0% → 90% coverage target)
- **Agent Platform**: 🔄 **NEW PRIORITY** - Universal agent adapter system
- **Agent Marketplace**: 🔄 **NEW PRIORITY** - Agent discovery and installation UI

### Strategic Pivot Status
- **Old AI Service**: ✅ Built (now becomes reference implementation)
- **Universal Agent Protocol**: 🔄 **IN PROGRESS** - Core interfaces designed, implementation started
- **Agent Marketplace UI**: ⏳ **HIGH PRIORITY** - Build discovery and installation
- **Agent Runtime & Sandbox**: ⏳ **HIGH PRIORITY** - Secure execution environment
- **Developer API**: ⏳ **MEDIUM PRIORITY** - Enable third-party agent integration
- **Revenue Engine**: ⏳ **MEDIUM PRIORITY** - Commission tracking and payments

### Production Environment Configuration
- **Environment Variables**: All configured in `.env` files
- **Docker Compose**: Separate configs for development and production
- **GitHub Container Registry**: Automated image building and pushing
- **GitHub Pages**: Static demo deployment with proper routing
- **Security**: Non-root containers, secret management, and proper CORS

### Known Issues and Limitations
- **Socket.io Server**: WebSocket integration needs production configuration
- **AI Service**: Python service integration pending full production testing
- **Multi-platform Builds**: Currently building for linux/amd64 only for performance
- **Database Migration**: Ready to migrate from SQLite to PostgreSQL for production

## Progressive Disclosure Implementation

### User Journey Stages

#### Stage 1: "First Contact" (Minute 1-5)
- **Initial State**: Empty dashboard with welcome message
- **User Action**: Add first contact
- **Unlocks**: Contact list view, basic contact management
- **Next Hint**: "Send them a WhatsApp message"
- **UI Elements**: Single CTA button, minimal navigation

#### Stage 2: "First Message" (Minute 5-30)
- **Trigger**: Send first WhatsApp message
- **Unlocks**: Chat interface, message templates, WhatsApp integration
- **Next Hint**: "Save time with message templates"
- **UI Elements**: Chat panel, template library

#### Stage 3: "Growing Contacts" (Day 1-3)
- **Trigger**: 10+ contacts added
- **Unlocks**: Pipeline view, contact tags, advanced filters, lead organization
- **Next Hint**: "Organize leads by dragging them into stages"
- **UI Elements**: Kanban board, filtering options, bulk actions

#### Stage 4: "Busy User" (Day 1-2)
- **Trigger**: 5+ messages sent (AI learns user patterns quickly)
- **Unlocks**: AI assistant suggestions, automated responses, smart replies
- **Next Hint**: "Let AI help you respond faster"
- **UI Elements**: AI suggestions panel, approval workflow
- **AI Learning**: Agentic AI analyzes user communication patterns to automate flows with intelligent suggestions

#### Stage 5: "Power User" (Week 2+)
- **Trigger**: 10+ AI approvals, consistent usage patterns
- **Unlocks**: Advanced automation workflows, custom AI agents, analytics
- **Achievement**: "CRM Master 🚀"
- **UI Elements**: Full dashboard, advanced features, monitoring tools

### Implementation Requirements

#### 1. Progressive Feature System
```typescript
// lib/features/progression.ts
interface FeatureGate {
  id: string
  stage: UserStage
  requirements: UnlockRequirement[]
  component: React.ComponentType
  unlockAnimation: AnimationType
}

interface UnlockRequirement {
  type: 'contact_count' | 'message_count' | 'ai_interactions' | 'time_based'
  threshold: number
  condition: 'gte' | 'lte' | 'equals'
}
```

#### 2. User Progress Tracking
```typescript
// stores/userProgress.ts
interface UserProgress {
  stage: 'new' | 'beginner' | 'intermediate' | 'advanced' | 'expert'
  unlockedFeatures: string[]
  achievements: Achievement[]
  stats: {
    contactsAdded: number
    messagesSent: number
    aiInteractions: number
    templatesUsed: number
    pipelineActions: number
  }
  onboardingCompleted: boolean
  lastActiveDate: Date
}
```

#### 3. Contextual Help System
```typescript
// components/help/ContextualGuide.tsx
interface ContextualHint {
  trigger: 'idle' | 'action_completed' | 'feature_unlocked' | 'error_state'
  message: string
  actionText: string
  placement: 'top' | 'bottom' | 'left' | 'right'
  priority: 'low' | 'medium' | 'high'
}
```

### File Structure Changes

#### New Component Architecture
```
apps/frontend/src/
├── components/
│   ├── dashboard/
│   │   ├── BlankDashboard.tsx (NEW) - Initial empty state
│   │   ├── ProgressiveDashboard.tsx (NEW) - Main dashboard wrapper
│   │   ├── WelcomeCard.tsx (NEW) - First-time user greeting
│   │   ├── FeatureReveal.tsx (NEW) - Animation wrapper for unlocks
│   │   └── stages/
│   │       ├── NewUserStage.tsx (NEW) - Stage 1 components
│   │       ├── BeginnerStage.tsx (NEW) - Stage 2-3 components
│   │       ├── IntermediateStage.tsx (NEW) - Stage 4 components
│   │       └── AdvancedStage.tsx (NEW) - Stage 5 components
│   ├── onboarding/
│   │   ├── SmartOnboarding.tsx (NEW) - Context-aware onboarding
│   │   ├── FeatureIntroduction.tsx (NEW) - Feature unlock celebrations
│   │   ├── AchievementSystem.tsx (NEW) - Gamification components
│   │   └── ProgressIndicator.tsx (NEW) - Journey progress display
│   ├── help/
│   │   ├── ContextualGuide.tsx (NEW) - Smart tooltips and hints
│   │   ├── DiscoveryPrompt.tsx (NEW) - Suggest next actions
│   │   └── AchievementToast.tsx (NEW) - Milestone celebrations
│   └── ui/
│       ├── EmptyState.tsx (MODIFY) - Beautiful empty states
│       ├── FeatureGate.tsx (NEW) - Feature visibility control
│       └── LoadingStates.tsx (NEW) - Progressive loading patterns
├── hooks/
│   ├── useFeatureGate.ts (NEW) - Feature unlock logic
│   ├── useUserProgress.ts (NEW) - Progress tracking
│   ├── useAchievements.ts (NEW) - Achievement system
│   └── useContextualHelp.ts (NEW) - Smart help system
├── lib/
│   ├── features/
│   │   ├── progression.ts (NEW) - Core progression logic
│   │   ├── stages.ts (NEW) - Stage definitions
│   │   ├── celebrations.ts (NEW) - Achievement animations
│   │   └── analytics.ts (NEW) - Progress tracking
│   └── constants/
│       ├── feature-requirements.ts (NEW) - Unlock conditions
│       ├── user-stages.ts (NEW) - Stage definitions
│       └── achievement-config.ts (NEW) - Achievement system
└── stores/
    ├── userProgress.ts (NEW) - Progress state management
    ├── featureGates.ts (NEW) - Feature visibility state
    └── achievements.ts (NEW) - Achievement state
```

#### Modified Existing Components
```
apps/frontend/src/
├── app/
│   ├── dashboard/
│   │   ├── page.tsx (MODIFY) - Implement progressive dashboard
│   │   ├── layout.tsx (MODIFY) - Conditional navigation
│   │   └── [...feature]/page.tsx (NEW) - Feature-specific pages
│   └── onboarding/
│       └── page.tsx (NEW) - First-time user flow
├── components/
│   ├── layout/
│   │   ├── header.tsx (MODIFY) - Progressive navigation
│   │   └── navigation.tsx (MODIFY) - Feature-gated menu items
│   └── dashboard/ (MODIFY ALL)
│       ├── dashboard-stats.tsx - Hide until Stage 3
│       ├── ai-agent-status.tsx - Hide until Stage 4
│       ├── system-monitoring.tsx - Hide until Stage 5
│       └── workflow-templates.tsx - Hide until Stage 5
```

### Next Steps for Production
1. **Progressive Disclosure Implementation**: Implement feature gating system
2. **User Journey Optimization**: A/B test unlock triggers and timings
3. **Onboarding Experience**: Create seamless first-time user flow
4. **Achievement System**: Gamify user progression with celebrations
5. **Analytics Integration**: Track user progression and feature adoption

## Animation and Interaction Patterns

## **UI Theme: "Clarity" - Built for Focus, Not Features**

### **Design Philosophy**
**"Every pixel should help the user succeed, not impress them"**

## **Color Palette**

### **Primary Colors**
```css
:root {
  /* Base Colors */
  --primary: #6366F1;        /* Indigo - Trust & Intelligence */
  --primary-hover: #5558E3;
  --primary-light: #E0E7FF;
  
  /* Neutral Grays */
  --gray-950: #030712;       /* Almost Black - Primary Text */
  --gray-900: #111827;
  --gray-800: #1F2937;
  --gray-700: #374151;
  --gray-600: #4B5563;
  --gray-500: #6B7280;
  --gray-400: #9CA3AF;
  --gray-300: #D1D5DB;
  --gray-200: #E5E7EB;
  --gray-100: #F3F4F6;
  --gray-50: #F9FAFB;
  --white: #FFFFFF;
  
  /* Semantic Colors */
  --success: #10B981;        /* Emerald Green */
  --warning: #F59E0B;        /* Amber */
  --error: #EF4444;          /* Red */
  --info: #3B82F6;           /* Blue */
}
```

### **Special Accent Colors**
```css
/* For Progressive Unlocks & Celebrations */
--unlock-gradient: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
--achievement: #8B5CF6;     /* Purple - Special moments */
--ai-agent: #06B6D4;       /* Cyan - AI features */
```

## **Typography System**

### **Font Stack**
```css
/* Primary Font - Clean & Modern */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 
             'Roboto', 'Helvetica Neue', sans-serif;

/* Monospace for Data */
--font-mono: 'JetBrains Mono', 'SF Mono', 'Monaco', 'Inconsolata', 
             'Courier New', monospace;
```

### **Type Scale**
```css
/* Fluid Typography */
--text-xs: clamp(0.75rem, 2vw, 0.8125rem);    /* 12-13px */
--text-sm: clamp(0.875rem, 2.5vw, 0.9375rem); /* 14-15px */
--text-base: 1rem;                             /* 16px */
--text-lg: clamp(1.125rem, 3vw, 1.25rem);     /* 18-20px */
--text-xl: clamp(1.25rem, 3.5vw, 1.5rem);     /* 20-24px */
--text-2xl: clamp(1.5rem, 4vw, 2rem);         /* 24-32px */
--text-3xl: clamp(2rem, 5vw, 3rem);           /* 32-48px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
```

## **Component Styling**

### **Cards & Surfaces**
```css
/* Elevation System - Subtle Depth */
.surface-0 { 
  background: var(--white);
  border: 1px solid var(--gray-200);
}

.surface-1 {
  background: var(--white);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--gray-100);
}

.surface-2 {
  background: var(--white);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

/* Glassmorphism for Special Elements */
.glass {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
```

### **Buttons**
```css
/* Primary Button */
.btn-primary {
  background: var(--primary);
  color: white;
  font-weight: 500;
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

/* Ghost Button */
.btn-ghost {
  background: transparent;
  color: var(--gray-700);
  border: 1px solid var(--gray-300);
}

/* AI Agent Button - Special */
.btn-agent {
  background: linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%);
  color: white;
  position: relative;
  overflow: hidden;
}

.btn-agent::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  transform: rotate(45deg);
  transition: 0.5s;
}

.btn-agent:hover::before {
  animation: shimmer 0.5s;
}
```

## **Layout Principles**

### **Spacing System**
```css
/* 8px Grid System */
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
```

### **Border Radius**
```css
--radius-sm: 0.25rem;   /* 4px - Subtle */
--radius-md: 0.5rem;    /* 8px - Default */
--radius-lg: 0.75rem;   /* 12px - Cards */
--radius-xl: 1rem;      /* 16px - Modals */
--radius-full: 9999px;  /* Pills */
```

### **Visual Design Guidelines**
**Inspiration**: Linear, Notion, Superhuman - clean, minimal with delightful micro-interactions
**Reference**: https://jitter.video/templates/ui-elements/ (subtle, professional animations)

### Animation Types
1. **Feature Reveal**: Fade in with subtle upward motion (300ms ease-out)
2. **Achievement Celebrations**: Confetti or subtle particle effects (800ms)
3. **Progress Indicators**: Smooth progress bars with milestone markers
4. **Contextual Tooltips**: Slide in from appropriate direction (200ms)
5. **Empty States**: Gentle breathing/pulse animations (2s loop)
6. **Loading States**: Skeleton screens with shimmer effects
7. **Micro-interactions**: Button hover, click feedback, form validation

### Interaction Patterns
```typescript
// Animation configuration
const ANIMATIONS = {
  featureReveal: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  achievement: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.9, opacity: 0 },
    transition: { duration: 0.5, ease: 'easeInOut' }
  },
  contextualHint: {
    initial: { opacity: 0, x: -10 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.2, ease: 'easeOut' }
  }
}
```

### Progressive UI Principles
1. **Minimalism First**: Start with single CTA, add complexity gradually
2. **Contextual Relevance**: Show features only when needed
3. **Natural Progression**: Each unlock should feel earned and timely
4. **Celebration Moments**: Acknowledge user achievements meaningfully
5. **Gentle Guidance**: Hints appear naturally, not intrusively
6. **Consistent Patterns**: Maintain design language across all stages

### No-Code Interface Elements
1. **Drag-and-Drop Builders**: Visual template creation
2. **If-This-Then-That Rules**: Simple automation setup
3. **Visual Workflow Designer**: Flowchart-style process builder
4. **Template Library**: Pre-built components with customization
5. **Smart Suggestions**: AI-powered recommendations based on usage

## Success Metrics and Testing

### Key Performance Indicators
1. **Time to First Value**
   - Time to first contact added: < 1 minute
   - Time to first message sent: < 5 minutes
   - Time to first pipeline action: < 30 minutes

2. **Feature Adoption Rates**
   - Stage 1 completion (first contact): 95%
   - Stage 2 completion (first message): 80%
   - Stage 3 completion (pipeline usage): 60%
   - Stage 4 completion (AI adoption): 40%
   - Stage 5 completion (power user): 20%

3. **User Engagement**
   - Daily active users retention: > 70%
   - Weekly feature discovery rate: > 2 new features
   - Monthly progression rate: > 60% advance to next stage

4. **Business Impact**
   - Lead conversion improvement: +25%
   - Response time reduction: -50%
   - User satisfaction score: > 4.5/5

### Testing Scenarios
1. **New User Journey**: Complete flow from blank dashboard to AI assistant
2. **Feature Discovery**: Each unlock should feel natural and timely
3. **Help System**: Contextual hints appear at optimal moments
4. **Mobile Experience**: Progressive disclosure works on all screen sizes
5. **Performance**: Smooth animations and quick feature reveals
6. **Accessibility**: Feature gating doesn't impede screen readers

### Migration Checklist

#### Phase 1: Foundation (Week 1-2) ✅ COMPLETED
- [x] Create user progress tracking system
- [x] Implement feature gating infrastructure
- [x] Design blank dashboard with single CTA
- [x] Build contextual help system
- [x] Add achievement/celebration components

#### Phase 2: Core Features (Week 3-4) ✅ COMPLETED
- [x] Implement Stage 1: First contact flow
- [x] Implement Stage 2: WhatsApp messaging
- [x] Create progressive navigation system
- [x] Add empty states for all sections
- [x] Build feature reveal animations

#### Phase 3: Advanced Features (Week 5-6) ✅ COMPLETED
- [x] Implement Stage 3: Pipeline management
- [x] Implement Stage 4: AI assistant integration
- [x] Add no-code workflow builders
- [x] Create achievement system
- [x] Implement progress indicators
- [x] Add system monitoring dashboard
- [x] Implement automation rules engine
- [x] Build real-time notifications system

#### Phase 4: Polish & Testing (Week 7-8)
- [ ] Add micro-interactions and polish
- [ ] Implement analytics tracking
- [ ] A/B test unlock triggers
- [ ] Mobile optimization
- [ ] Performance optimization
- [ ] User acceptance testing

#### Phase 5: Launch (Week 9-10)
- [ ] Gradual rollout to existing users
- [ ] Monitor user progression metrics
- [ ] Gather feedback and iterate
- [ ] Documentation and training
- [ ] Full production deployment

### Rollback Strategy
- [ ] Feature flags for each stage
- [ ] Ability to revert to current UI
- [ ] User preference to skip onboarding
- [ ] Admin override for power users
- [ ] Gradual migration approach

## Deployment Strategy Notes

- For now other than the sensitive information push the changes in the main branch, after this point we will use one staging branch and the main branch will be our production branch

## Commit Guidelines
- Always use user signed commits with -s flag only
- NEVER use co-authored commits
- NEVER include "Co-Authored-By: Claude" in commit messages
- NEVER include "Generated with Claude Code" or any Claude attribution in commits
- All commits must be signed off by the user only
- Keep commit messages clean and professional without any AI/Claude references

## GitHub Project Board Management
- Always update task status in GitHub project board using gh CLI
- Use project ID: PVT_kwHOApp2eM4A-WnZ for all project board operations
- Update item status when PRs are created, merged, or when significant progress is made
- Available statuses: Backlog, Ready, In progress, In review, Done
- Available priorities: P0 (Critical), P1 (High), P2 (Medium)
- Commands:
  ```bash
  # Add items to project
  gh project item-add 1 --owner shreyanshjain7174 --url <GITHUB_URL>
  
  # Update status
  gh project item-edit --project-id PVT_kwHOApp2eM4A-WnZ --id <ITEM_ID> --field-id PVTSSF_lAHOApp2eM4A-WnZzgxyDJs --single-select-option-id <STATUS_ID>
  
  # Update priority  
  gh project item-edit --project-id PVT_kwHOApp2eM4A-WnZ --id <ITEM_ID> --field-id PVTSSF_lAHOApp2eM4A-WnZzgxyDOY --single-select-option-id <PRIORITY_ID>
  ```

## UI Theme: "Clarity" - Built for Focus, Not Features 🎨

### Design Philosophy
**"Every pixel should help the user succeed, not impress them"**

We emphasize:
1. **Clarity over Complexity** - Clean, uncluttered interfaces
2. **Progressive Enhancement** - UI that grows with the user
3. **Subtle Delight** - Micro-interactions without being flashy
4. **Accessibility First** - Works for everyone
5. **Performance** - Light, fast, responsive

### Color Palette

#### Primary Colors
```css
:root {
  /* Base Colors */
  --primary: #6366F1;        /* Indigo - Trust & Intelligence */
  --primary-hover: #5558E3;
  --primary-light: #E0E7FF;
  
  /* Neutral Grays */
  --gray-950: #030712;       /* Almost Black - Primary Text */
  --gray-900: #111827;
  --gray-800: #1F2937;
  --gray-700: #374151;
  --gray-600: #4B5563;
  --gray-500: #6B7280;
  --gray-400: #9CA3AF;
  --gray-300: #D1D5DB;
  --gray-200: #E5E7EB;
  --gray-100: #F3F4F6;
  --gray-50: #F9FAFB;
  --white: #FFFFFF;
  
  /* Semantic Colors */
  --success: #10B981;        /* Emerald Green */
  --warning: #F59E0B;        /* Amber */
  --error: #EF4444;          /* Red */
  --info: #3B82F6;           /* Blue */
  
  /* Special Accent Colors - For Progressive Unlocks & Celebrations */
  --unlock-gradient: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
  --achievement: #8B5CF6;     /* Purple - Special moments */
  --ai-agent: #06B6D4;       /* Cyan - AI features */
}
```

### Typography System

```css
/* Primary Font - Clean & Modern */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 
             'Roboto', 'Helvetica Neue', sans-serif;

/* Monospace for Data */
--font-mono: 'JetBrains Mono', 'SF Mono', 'Monaco', 'Inconsolata', 
             'Courier New', monospace;

/* Fluid Typography */
--text-xs: clamp(0.75rem, 2vw, 0.8125rem);    /* 12-13px */
--text-sm: clamp(0.875rem, 2.5vw, 0.9375rem); /* 14-15px */
--text-base: 1rem;                             /* 16px */
--text-lg: clamp(1.125rem, 3vw, 1.25rem);     /* 18-20px */
--text-xl: clamp(1.25rem, 3.5vw, 1.5rem);     /* 20-24px */
--text-2xl: clamp(1.5rem, 4vw, 2rem);         /* 24-32px */
--text-3xl: clamp(2rem, 5vw, 3rem);           /* 32-48px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
```

### Component Styling Guidelines

#### Cards & Surfaces
```css
/* Elevation System - Subtle Depth */
.surface-0 { 
  background: var(--white);
  border: 1px solid var(--gray-200);
}

.surface-1 {
  background: var(--white);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--gray-100);
}

.surface-2 {
  background: var(--white);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

/* Glassmorphism for Special Elements */
.glass {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
```

#### Button System
```css
/* Primary Button */
.btn-primary {
  background: var(--primary);
  color: white;
  font-weight: 500;
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

/* Agent Button - Special Gradient */
.btn-agent {
  background: linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%);
  color: white;
  position: relative;
  overflow: hidden;
}

.btn-agent:hover::before {
  animation: shimmer 0.5s;
}
```

### Spacing System (8px Grid)
```css
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */

/* Border Radius */
--radius-sm: 0.25rem;   /* 4px - Subtle */
--radius-md: 0.5rem;    /* 8px - Default */
--radius-lg: 0.75rem;   /* 12px - Cards */
--radius-xl: 1rem;      /* 16px - Modals */
--radius-full: 9999px;  /* Pills */
```

### Progressive Disclosure Animations

```css
/* Feature Reveal */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.feature-reveal {
  animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Achievement Celebration */
@keyframes celebrate {
  0%, 100% { transform: scale(1) rotate(0deg); }
  25% { transform: scale(1.1) rotate(-5deg); }
  75% { transform: scale(1.1) rotate(5deg); }
}

.achievement {
  animation: celebrate 0.6s ease-in-out;
}
```

### Implementation Examples

#### Empty State (Blank Dashboard)
```jsx
<div className="min-h-screen bg-gray-50 flex items-center justify-center">
  <div className="text-center space-y-6 max-w-md">
    <div className="w-16 h-16 bg-primary-light rounded-full mx-auto flex items-center justify-center">
      <UserPlus className="w-8 h-8 text-primary" />
    </div>
    <h1 className="text-2xl font-semibold text-gray-900">
      Welcome to your CRM
    </h1>
    <p className="text-gray-600">
      Let's start simple. Add your first contact to begin.
    </p>
    <button className="btn-primary">
      Add Your First Contact
    </button>
  </div>
</div>
```

#### Agent Card
```jsx
<div className="surface-1 rounded-lg p-6 hover:surface-2 transition-all">
  <div className="flex items-start justify-between">
    <div className="flex items-center space-x-4">
      <div className="w-12 h-12 bg-ai-agent/10 rounded-lg flex items-center justify-center">
        <Bot className="w-6 h-6 text-ai-agent" />
      </div>
      <div>
        <h3 className="font-semibold text-gray-900">WhatsApp AI Assistant</h3>
        <p className="text-sm text-gray-600">Auto-reply to customer queries</p>
      </div>
    </div>
    <div className="text-right">
      <div className="flex items-center text-sm text-gray-500">
        <Star className="w-4 h-4 text-warning mr-1" />
        4.8 (2.3k)
      </div>
      <button className="btn-primary btn-sm mt-2">
        Install
      </button>
    </div>
  </div>
</div>
```

### Tailwind Configuration
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6366F1',
          hover: '#5558E3',
          light: '#E0E7FF',
        },
        ai: '#06B6D4',
        achievement: '#8B5CF6',
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        mono: ['JetBrains Mono', ...defaultTheme.fontFamily.mono],
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'celebrate': 'celebrate 0.6s ease-in-out',
      },
    },
  },
}
```

### Mobile-First Approach
```css
/* Base styles for mobile */
.container {
  padding: var(--space-4);
  max-width: 100%;
}

/* Tablet and up */
@media (min-width: 768px) {
  .container {
    padding: var(--space-6);
    max-width: 1280px;
    margin: 0 auto;
  }
}
```

### Accessibility Requirements
```css
/* Focus States */
:focus {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
  :root {
    --gray-950: #000000;
    --white: #FFFFFF;
    --primary: #0000FF;
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Development Standards for UI 📐

### Component Requirements
- **Every component MUST use the Clarity design system**
- **Mobile-first responsive design**
- **Accessibility compliance (WCAG 2.1 AA)**
- **Performance optimized (Lighthouse 90+)**
- **TypeScript strict mode**

### Progressive Enhancement Rules
1. **Start minimal** - Single CTA, clean layout
2. **Add complexity gradually** - Based on user progression
3. **Celebrate achievements** - But subtly, not overwhelmingly
4. **Maintain consistency** - Same patterns throughout app
5. **Test on mobile first** - Most SME users are mobile-heavy

The indigo primary color suggests trust and intelligence, while the minimal shadows and clean typography keep focus on the content, not the chrome. Perfect for SMEs who want powerful tools without the learning curve!

## Secrets and API Keys
- Pinecone API Key: pcsk_6jpGA2_6ZDynb5Up9bqCaNdbz7oVVuBTLDQupJCZ3piQBSFkNe9k7C2HnSfqh65fQwcPSN