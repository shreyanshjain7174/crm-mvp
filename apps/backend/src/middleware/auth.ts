import { FastifyRequest, FastifyReply } from 'fastify';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const token = request.headers.authorization?.replace('Bearer ', '');
    
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