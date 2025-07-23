# CLAUDE.md (Condensed)

## Project: AI Agent Platform for SME CRMs
**Vision**: Build the operating system for AI agents in CRM, not the agents themselves.

## Critical Guidelines

### Commits
- Use signed commits only: `git commit -s -m`
- Create branches for all changes, make PRs
- NO co-authored commits, NO Claude attribution

### Code Standards
- Update package.json when adding dependencies
- Run `npm run lint` and `npm run typecheck` before commits
- Fix all ESLint/TypeScript errors
- Test-driven development (TDD)
- Never create files unless necessary
- No proactive documentation unless requested

## Platform Strategy

### Core Pivot
- **NOT** building AI agents → Building the **OS for AI agents**
- Platform beats Product - Always
- Own the UI real estate, not the AI capability
- Revenue: Agent marketplace (30% commission) + CRM subscription

### Progressive Disclosure Journey
1. **Stage 1** (Min 1-5): Empty dashboard → Add contact → Unlocks contact list
2. **Stage 2** (Min 5-30): Send WhatsApp → Unlocks chat interface
3. **Stage 3** (Day 1-3): 10+ contacts → Unlocks pipeline view
4. **Stage 4** (Day 1-2): 5+ messages → Unlocks AI assistant
5. **Stage 5** (Week 2+): 10+ AI approvals → Full automation

## Architecture

### Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Shadcn/ui, Zustand
- **Backend**: Node.js/Fastify, PostgreSQL, Redis, BullMQ
- **Real-time**: Socket.io
- **AI Integration**: Universal Agent Protocol (adapter system)

### Universal Agent Interface
```typescript
interface UniversalAgentAdapter {
  connect(): Promise<void>
  disconnect(): Promise<void>
  sendToAgent(data: CRMData): Promise<void>
  receiveFromAgent(): Observable<AgentData>
  getConfigUI(): ReactComponent
  getActionButtons(): ActionButton[]
  getDataDisplay(): DataRenderer
}
```

## Development Commands

```bash
# Development
npm run dev              # All services
npm run dev:frontend     # Frontend only
npm run dev:lead-service # Specific service

# Database
npm run db:migrate
npm run db:seed
npm run db:studio

# Testing & Quality
npm run test            # All tests
npm run test:watch      # Watch mode
npm run lint            # ESLint
npm run typecheck       # TypeScript check

# Build & Deploy
npm run build
npm run docker:build
npm run deploy:staging
```

## UI Theme: "Clarity"

### Colors
```css
--primary: #6366F1;        /* Indigo */
--gray-[50-950];           /* Full gray scale */
--success: #10B981;        /* Emerald */
--warning: #F59E0B;        /* Amber */
--error: #EF4444;          /* Red */
--ai-agent: #06B6D4;       /* Cyan */
--achievement: #8B5CF6;    /* Purple */
```

### Typography
- Font: Inter (sans), JetBrains Mono (mono)
- Fluid type scale: text-xs to text-3xl
- Weights: 400 (normal) to 700 (bold)

### Components
- Surface elevation system (0-2)
- Button variants: primary, ghost, agent
- 8px grid spacing system
- Border radius: sm (4px) to full

## Progressive Disclosure Implementation

### User Progress Tracking
```typescript
interface UserProgress {
  stage: 'new' | 'beginner' | 'intermediate' | 'advanced' | 'expert'
  unlockedFeatures: string[]
  stats: {
    contactsAdded: number
    messagesSent: number
    aiInteractions: number
  }
}
```

### Feature Gating
- Features unlock based on usage patterns
- Contextual hints guide users
- Celebration animations for achievements
- Empty states educate about next steps

## Current Status

### ✅ Completed
- Backend services (FastAPI → Node.js migration)
- Frontend with progressive disclosure
- JWT auth with demo mode
- Facebook WhatsApp Cloud API integration
- Docker containerization
- CI/CD pipeline (<5 min execution)
- Visual workflow builder (drag-drop)
- Comprehensive backend testing infrastructure
- **Universal Agent Protocol backend APIs** (Jan 2025)
- **Proactive Login UI with real-time validation** (Jan 2025)
- **Marketplace component architecture** (Jan 2025)

### 🔄 In Progress
- **Modern Register Page UI** (Creating to match login design)
- Agent runtime sandbox
- Developer API integration
- Revenue engine implementation

### ⏳ Next Priorities (Jan 2025)
1. **Complete Modern Register Page** - Match proactive login design
2. **Integrate Marketplace Frontend with Backend** - Replace all mock data
3. **Agent Installation Flow** - End-to-end testing
4. **Partner with 3-5 agent companies** - Begin outreach
5. **Launch self-service onboarding** - Beta testing phase

## File Structure

### Key Directories
```
apps/
├── frontend/          # Next.js app
│   ├── components/    # UI components
│   ├── stores/        # Zustand stores
│   ├── hooks/         # Custom hooks
│   └── lib/           # Utilities
├── backend/
│   └── services/      # Microservices
tests/                 # Test suites
docker/                # Docker configs
```

### Progressive Components
- `components/dashboard/ProgressiveDashboard.tsx` - Main wrapper
- `components/empty-states/*` - Stage-specific empty states
- `components/animations/*` - Feature reveals & celebrations
- `stores/userProgress.ts` - Progress tracking

## Business Model

### Platform Economics
- **Agent Marketplace**: 30% commission on agent subscriptions
- **CRM Subscription**: ₹999-4999/month tiers
- **Premium Integrations**: Enterprise features
- **Developer Ecosystem**: API access fees

### Why This Wins
- Network effects: More agents → more users → more agents
- Defensible moat: High switching costs
- Lower CAC: Agents bring users
- Higher LTV: Multiple revenue streams

## Development Principles

1. **Ship fast, iterate faster** - But never compromise UX or security
2. **Platform first** - Enable agents, don't compete with them
3. **Progressive enhancement** - Start simple, grow with user
4. **Mobile first** - Indian SMEs are mobile-heavy
5. **Test everything** - TDD approach, comprehensive coverage

## Recent Achievements Timeline

### January 2025 - Proactive UI Revolution
- **PR #64**: Proactive Login UI with real-time validation
  - Dynamic password strength meter with visual feedback
  - Smart form validation preventing invalid submissions  
  - Enhanced animations and accessibility improvements
  - All text visibility issues resolved for light theme
- **Universal Agent Protocol Backend**: Complete API infrastructure
  - Agent discovery, installation, and management endpoints
  - PostgreSQL schema with proper indexing and relationships
  - Comprehensive error handling and validation
- **Marketplace Component Architecture**: Modern glassmorphism design
  - API service layer with proper TypeScript integration
  - Responsive grid/list views with smooth animations
  - Real-time search and filtering capabilities

### Next Sprint Goals (Est. 3-4 days)
1. **Modern Register Page** - Match login design philosophy
2. **End-to-end Marketplace Testing** - Full API integration
3. **Agent Installation Demo** - Working prototype
4. **Performance Optimization** - Bundle size and loading speeds

## Secrets
- Pinecone API Key: pcsk_6jpGA2_6ZDynb5Up9bqCaNdbz7oVVuBTLDQupJCZ3piQBSFkNe9k7C2HnSfqh65fQwcPSN

## GitHub Project Management
- Project ID: PVT_kwHOApp2eM4A-WnZ
- Update task status when creating PRs or making progress
- Statuses: Backlog, Ready, In progress, In review, Done
- Priorities: P0 (Critical), P1 (High), P2 (Medium)