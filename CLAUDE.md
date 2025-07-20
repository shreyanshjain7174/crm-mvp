# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Progressive Disclosure CRM for Indian SMEs** - A no-code, self-discovering customer relationship management platform that starts completely blank and progressively reveals features as users achieve milestones. The system transforms from a simple contact manager to a full AI-powered CRM through natural user progression.

### Design Philosophy
1. **Start with Zero**: Blank dashboard, single CTA - no overwhelming features
2. **Reveal on Achievement**: Features unlock based on user actions and milestones
3. **No Training Required**: Context-sensitive hints and natural discovery patterns
4. **Progressive Complexity**: Contact Manager → WhatsApp Hub → AI Assistant → Full CRM

### Target User Journey
- **Minute 1-5**: Add first contact → unlock contact list
- **Minute 5-30**: Send first WhatsApp → unlock chat interface
- **Day 1-3**: 10+ contacts → unlock pipeline and organization tools
- **Week 1**: 50+ messages → unlock AI assistant
- **Week 2+**: 10+ AI approvals → unlock automation and advanced agents

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

### AI Agent System
- **Orchestration**: LangChain for agent coordination
- **Specialized Agents**:
  - Lead Qualification Agent
  - Message Generation Agent  
  - Follow-up Scheduler Agent
  - Intent Recognition Agent
  - Context Memory Agent
- **LLM Provider**: OpenAI GPT-4o (primary), Gemini (fallback)
- **Vector Store**: Pinecone for chat embeddings and RAG

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
npm run test
npm run test:watch
npm run test:e2e

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

## Recent Major Updates

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
  - All code now passes ESLint and TypeScript checks

### Current System Status
- **Backend Services**: ✅ FastAPI + PostgreSQL + Redis fully operational
- **Frontend**: ✅ Next.js 14 with App Router, Tailwind CSS, and demo mode
- **Authentication**: ✅ JWT-based auth with demo mode support
- **Database**: ✅ PostgreSQL with raw SQL queries (migrated from Prisma for Docker compatibility)
- **AI Integration**: ✅ OpenAI GPT-4o, Anthropic Claude, and Pinecone vector store
- **WhatsApp Integration**: ✅ Facebook WhatsApp Cloud API (free tier)
- **Real-time Features**: ✅ Socket.io for live updates and notifications
- **Deployment**: ✅ Docker containerization with multi-stage builds
- **CI/CD**: ✅ GitHub Actions with automated testing, building, and deployment (sub-5 minute execution)
- **Testing**: 🔄 Comprehensive backend test strategy in implementation (0% → 90% coverage target)

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

#### Stage 4: "Busy User" (Week 1)
- **Trigger**: 50+ messages sent or repetitive patterns detected
- **Unlocks**: AI assistant suggestions, automated responses, smart replies
- **Next Hint**: "Let AI help you respond faster"
- **UI Elements**: AI suggestions panel, approval workflow

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

### Visual Design Guidelines
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

#### Phase 3: Advanced Features (Week 5-6)
- [ ] Implement Stage 3: Pipeline management
- [ ] Implement Stage 4: AI assistant integration
- [ ] Add no-code workflow builders
- [ ] Create achievement system
- [ ] Implement progress indicators

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
- Always use user signed commits with -s flag, never use co-authored commits
- PRs created by Claude should not contain co-authored commits
- All commits must be signed off by the user only

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

## Secrets and API Keys
- Pinecone API Key: pcsk_6jpGA2_6ZDynb5Up9bqCaNdbz7oVVuBTLDQupJCZ3piQBSFkNe9k7C2HnSfqh65fQwcPSN