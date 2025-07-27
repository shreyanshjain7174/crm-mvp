// Extended Fastify type definitions for CRM backend

import { FastifyRequest } from 'fastify'

declare module 'fastify' {
  interface FastifyRequest {
    // User authentication context
    user?: {
      id: string
      email: string
      name: string
      role: string
    }
    
    // Agent context for agent routes
    agent?: {
      id: string
      name: string
      version: string
      capabilities: string[]
    }
    
    // Session management
    session?: {
      id: string
      expiresAt: Date
    }
  }
  
  interface FastifyInstance {
    // Custom authentication methods
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    
    // Agent validation
    validateAgent: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

// Additional types for agent system
export interface AgentCredentials {
  apiKey: string
  version: string
  capabilities: string[]
}

export interface AgentSession {
  id: string
  agentId: string
  connectionId: string
  startedAt: Date
  status: 'active' | 'idle' | 'disconnected'
}

export interface ProcessingResult {
  success: boolean
  data?: any
  error?: string
  processingTime: number
}