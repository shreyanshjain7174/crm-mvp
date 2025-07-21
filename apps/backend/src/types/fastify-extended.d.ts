/**
 * Extended Fastify Type Declarations
 * 
 * Adds custom properties to Fastify request and instance objects
 */

import 'fastify'

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string
      userId: string
      email: string
      name?: string
    }
  }
}