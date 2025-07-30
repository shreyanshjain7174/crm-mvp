import { FastifyInstance } from 'fastify';

export async function testRoutes(fastify: FastifyInstance) {
  // Simple test route without auth
  fastify.get('/health', async (request, reply) => {
    reply.send({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  // Test route with auth
  fastify.get('/auth-test', {
    preHandler: async (request, _reply) => {
      // Simple auth test
      (request as any).user = { userId: 'test-user', email: 'test@example.com' };
    }
  }, async (request, reply) => {
    reply.send({ 
      status: 'authenticated', 
      user: (request as any).user,
      timestamp: new Date().toISOString() 
    });
  });
}