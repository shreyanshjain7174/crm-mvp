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

[... rest of the existing content remains unchanged ...]

## Deployment Strategy Notes

- For now other than the sensitive information push the changes in the main branch, after this point we will use one staging branch and the main branch will be our production branch