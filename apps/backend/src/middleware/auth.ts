import { FastifyRequest, FastifyReply } from 'fastify';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    
    // In development mode, if no auth header, use default test user
    if (!authHeader && process.env.NODE_ENV !== 'production') {
      // Get the test user from database
      const userResult = await request.server.db.query(
        'SELECT id, email FROM users WHERE email = $1 LIMIT 1',
        ['test@example.com']
      );
      
      if (userResult.rows.length > 0) {
        (request as any).user = {
          userId: userResult.rows[0].id,
          email: userResult.rows[0].email
        };
        return;
      }
    }
    
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