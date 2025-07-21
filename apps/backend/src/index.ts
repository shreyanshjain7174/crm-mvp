import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { pool, initializeDatabase } from './db/connection';
import { leadRoutes } from './routes/leads';
import { messageRoutes } from './routes/messages';
import { whatsappRoutes } from './routes/whatsapp';
import { aiRoutes } from './routes/ai';
import { aiIntegrationRoutes } from './routes/ai-integration';
import { authRoutes } from './routes/auth';
import { statsRoutes } from './routes/stats';
import agentRoutes from './routes/agents';
import { authenticate } from './middleware/auth';
import { logger } from './utils/logger';
import { socketService } from './services/socket-service';

dotenv.config();

declare module 'fastify' {
  interface FastifyInstance {
    db: typeof pool;
    io: Server;
    authenticate: typeof authenticate;
  }
}

async function buildApp() {
  const app = fastify({ 
    logger: true,
    disableRequestLogging: false 
  });

  // Register plugins
  await app.register(cors, {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
  });
  
  await app.register(helmet, {
    contentSecurityPolicy: false // Allow Socket.io
  });
  
  await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'fallback-secret'
  });

  // Initialize database
  await initializeDatabase();
  
  // Initialize Socket.io after server is ready
  let io: Server;
  
  // Decorate fastify instance
  app.decorate('db', pool);
  app.decorate('authenticate', authenticate);
  
  // Add Socket.io setup hook
  app.addHook('onReady', async () => {
    io = new Server(app.server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      path: '/socket.io/',
      transports: ['websocket', 'polling']
    });

    // Socket.io connection handling
    io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);
      
      socket.on('authenticate', (token) => {
        try {
          const decoded = app.jwt.verify(token);
          socket.data.user = decoded;
          socket.join(`user_${socket.data.user.userId}`);
          logger.info(`User authenticated: ${socket.data.user.email}`);
        } catch (error) {
          logger.error('Socket authentication failed:', error);
          socket.emit('auth_error', { message: 'Authentication failed' });
        }
      });

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });

    app.decorate('io', io);
    
    // Initialize socket service
    socketService.initialize(io);
    
    logger.info('Socket.io server initialized');
  });

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
  await app.register(statsRoutes, { prefix: '/api/stats' });
  await app.register(agentRoutes, { prefix: '/api/agents' });

  return app;
}

async function start() {
  try {
    const app = await buildApp();
    
    const port = parseInt(process.env.PORT || '3001');
    
    await app.listen({ port, host: '0.0.0.0' });
    
    logger.info(`Backend server with Socket.io listening on port ${port}`);
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