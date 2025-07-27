import { FastifyRequest, FastifyReply } from 'fastify';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader) {
      reply.status(401).send({ error: 'No token provided' });
      return;
    }
    
    // Check if header starts with 'Bearer ' (exact case and space)
    if (!authHeader.startsWith('Bearer ')) {
      // Special case: if it's just the token without Bearer prefix, treat as no token
      if (!authHeader.includes(' ')) {
        reply.status(401).send({ error: 'No token provided' });
        return;
      }
      // Otherwise it's malformed (wrong case, extra spaces, etc.) - let JWT verify handle it
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      reply.status(401).send({ error: 'No token provided' });
      return;
    }
    
    const decoded = request.server.jwt.verify(token) as { userId: string; email: string };
    (request as any).user = decoded;
  } catch (error) {
    reply.status(401).send({ error: 'Invalid token' });
  }
}