# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Agentic CRM for Indian SMEs - An AI-first customer relationship management platform focused on WhatsApp integration and automated lead nurturing. The system uses multiple specialized AI agents to handle different aspects of customer interaction and sales processes.

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

### Complete CI/CD Pipeline Fixes (July 2024)
- **Docker Build Issues Fixed**: ✅ Complete resolution of NPM workspace structure issues
  - Fixed build context from app-specific to root directory
  - Updated all Dockerfiles to handle NPM workspace dependencies correctly
  - Resolved TypeScript compilation issues in Docker builds
  - Added proper multi-stage builds for dev/prod dependency separation
  - Fixed user creation conflicts in Docker containers
  - Optimized build performance and reduced CI timeout from 20+ minutes to under 10 minutes

- **Facebook WhatsApp API Integration**: ✅ Migrated from paid AiSensy to free Facebook WhatsApp Cloud API
  - Complete backend migration to Facebook Graph API v21.0
  - Updated webhook schemas and message handling
  - Implemented proper Facebook webhook verification
  - Added test phone numbers and message sending functionality
  - Configured ngrok tunneling for local webhook testing
  - Added comprehensive error handling and logging

- **GitHub Pages Deployment**: ✅ Fixed static site generation and deployment
  - Updated Next.js configuration for proper static export
  - Fixed base path configuration for project repository (`/crm-mvp`)
  - Enhanced demo mode detection for GitHub Pages (`shreyanshjain7174.github.io`)
  - Added proper authentication flow for static deployment
  - Improved home page routing and loading states

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
- **CI/CD**: ✅ GitHub Actions with automated testing, building, and deployment

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

### Next Steps for Production
1. **Full Production Deployment**: Deploy to staging environment
2. **Socket.io Configuration**: Set up WebSocket server for real-time features
3. **AI Service Integration**: Complete Python AI service production setup
4. **Performance Monitoring**: Add Sentry and performance tracking
5. **Security Audit**: Complete security review and penetration testing

## Deployment Strategy Notes

- For now other than the sensitive information push the changes in the main branch, after this point we will use one staging branch and the main branch will be our production branch

## Commit Guidelines
- Never use co-authored commits only user signed off commits.

## Secrets and API Keys
- Pinecone API Key: pcsk_6jpGA2_6ZDynb5Up9bqCaNdbz7oVVuBTLDQupJCZ3piQBSFkNe9k7C2HnSfqh65fQwcPSN