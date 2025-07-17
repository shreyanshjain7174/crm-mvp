import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { pool, initializeDatabase } from './db/connection';
import { leadRoutes } from './routes/leads';
import { messageRoutes } from './routes/messages';
import { whatsappRoutes } from './routes/whatsapp';
import { aiRoutes } from './routes/ai';
import { aiIntegrationRoutes } from './routes/ai-integration';
import { authRoutes } from './routes/auth';
import { authenticate } from './middleware/auth';
import { logger } from './utils/logger';

dotenv.config();
const app = fastify({ logger: true });

const server = createServer();
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

declare module 'fastify' {
  interface FastifyInstance {
    db: typeof pool;
    io: Server;
    authenticate: typeof authenticate;
  }
}

async function buildApp() {
  // Register plugins
  await app.register(cors, {
    origin: process.env.FRONTEND_URL || "http://localhost:3000"
  });
  
  await app.register(helmet);
  
  await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'fallback-secret'
  });
  
  await app.register(websocket);

  // Initialize database
  await initializeDatabase();
  
  // Decorate fastify instance
  app.decorate('db', pool);
  app.decorate('io', io);
  app.decorate('authenticate', authenticate);

  // Health check
  app.get('/health', async (_request, _reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Register routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(leadRoutes, { prefix: '/api/leads' });
  await app.register(messageRoutes, { prefix: '/api/messages' });
  await app.register(whatsappRoutes, { prefix: '/api/whatsapp' });
  await app.register(aiRoutes, { prefix: '/api/ai' });
  await app.register(aiIntegrationRoutes, { prefix: '/api/ai-workflows' });

  return app;
}

async function start() {
  try {
    const app = await buildApp();
    
    const port = parseInt(process.env.PORT || '3001');
    
    await app.listen({ port, host: '0.0.0.0' });
    
    server.listen(port + 1, () => {
      logger.info(`Socket.io server listening on port ${port + 1}`);
    });
    
    logger.info(`Backend server listening on port ${port}`);
  } catch (err) {
    logger.error('Error starting server:', err);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

if (require.main === module) {
  start();
}

export { buildApp };