import { FastifyRequest, FastifyReply } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    user: {
      userId: string;
      email: string;
    };
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const token = request.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      reply.status(401).send({ error: 'No token provided' });
      return;
    }
    
    const decoded = request.server.jwt.verify(token) as { userId: string; email: string };
    request.user = decoded;
  } catch (error) {
    reply.status(401).send({ error: 'Invalid token' });
  }
}