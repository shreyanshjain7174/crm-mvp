import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import staticPlugin from '@fastify/static';
import path from 'path';
// Temporarily removing fastify-zod as it's causing issues
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
import agentProtocolRoutes from './routes/agent-protocol';
import agentRegistryRoutes from './routes/agent-registry';
import agentEventsRoutes from './routes/agent-events';
import agentRuntimeRoutes from './routes/agent-runtime';
import integrationsRoutes from './routes/integrations';
import billingRoutes from './routes/billing';
import { agentMonitoringRoutes } from './routes/agent-monitoring';
// import marketplaceRoutes from './routes/marketplace'; // Disabled - requires database tables
import { enhancedMarketplaceRoutes } from './routes/marketplace-enhanced';
import contactRoutes from './routes/contacts';
import achievementRoutes from './routes/achievements';
import notificationRoutes from './routes/notifications';
import { workflowRoutes } from './routes/workflows';
import { performanceRoutes } from './routes/performance';
import { authenticate } from './middleware/auth';
import { performanceMonitor } from './services/performance-monitor';
import { logger } from './utils/logger';
import { socketService } from './services/socket-service';
import { initializeAgentRuntime } from './services/agent-runtime';
import { initializeDataSeeding } from './services/data-seeder';
import { KeepAliveService } from './services/keep-alive-service';

dotenv.config();

declare module 'fastify' {
  interface FastifyInstance {
    db: typeof pool;
    io: Server;
    authenticate: typeof authenticate;
    agentRuntime?: any; // AgentRuntime type would be circular import
  }
}

async function buildApp() {
  const app = fastify({ 
    logger: true,
    disableRequestLogging: false 
  });

  // Register plugins
  await app.register(cors, {
    origin: (origin, callback) => {
      // Allow localhost, ngrok domains, and configured FRONTEND_URL
      const frontendUrls = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : [];
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        ...frontendUrls
      ].filter(Boolean);
      
      // Allow ngrok domains and vercel domains
      if (!origin || allowedOrigins.includes(origin) || 
          /\.ngrok(?:-free)?\.app$/.test(origin) ||
          /\.vercel\.app$/.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true
  });
  
  await app.register(helmet, {
    contentSecurityPolicy: false // Allow Socket.io
  });
  
  await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'fallback-secret'
  });

  // Temporarily removing fastify-zod registration

  // Initialize database with error handling
  try {
    await initializeDatabase();
    logger.info('Database initialization completed');
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error; // Critical error - don't start server
  }

  // Add performance monitoring middleware
  app.addHook('preHandler', performanceMonitor.requestTracker());
  
  // Decorate fastify instance
  app.decorate('db', pool);
  
  // Initialize realistic sample data (skip in test environment)
  if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
    try {
      await initializeDataSeeding(app);
      logger.info('Data seeding completed');
    } catch (error) {
      logger.warn('Data seeding failed (this is normal in production):', error);
    }
  }
  
  // Initialize Socket.io after server is ready
  let io: Server;
  app.decorate('authenticate', authenticate);
  
  // Add Socket.io setup hook
  app.addHook('onReady', async () => {
    io = new Server(app.server, {
      cors: {
        origin: (origin, callback) => {
          // Allow localhost, ngrok domains, and configured FRONTEND_URL
          const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001', 
            process.env.FRONTEND_URL
          ].filter(Boolean);
          
          // Allow ngrok domains
          if (!origin || allowedOrigins.includes(origin) || /\.ngrok(?:-free)?\.app$/.test(origin)) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'), false);
          }
        },
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
    
    // Initialize agent runtime
    initializeAgentRuntime(app);
    
    logger.info('Socket.io server and agent runtime initialized');
  });

  // Health check - available immediately
  app.get('/health', async (_request, _reply) => {
    return { 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'crm-backend'
    };
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
  await app.register(agentProtocolRoutes, { prefix: '/api/agents/protocol' });
  await app.register(agentRegistryRoutes, { prefix: '/api/agents/registry' });
  await app.register(agentEventsRoutes, { prefix: '/api/agents/events' });
  await app.register(agentRuntimeRoutes, { prefix: '/api/agents/runtime' });
  await app.register(integrationsRoutes, { prefix: '/api/integrations' });
  await app.register(billingRoutes, { prefix: '/api/billing' });
  await app.register(agentMonitoringRoutes, { prefix: '/api/monitoring' });
  // Use enhanced marketplace routes instead of original
  // await app.register(marketplaceRoutes, { prefix: '/api/marketplace' });
  await app.register(enhancedMarketplaceRoutes, { prefix: '/api/marketplace' });
  await app.register(contactRoutes, { prefix: '/api/contacts' });
  await app.register(achievementRoutes, { prefix: '/api/achievements' });
  await app.register(notificationRoutes, { prefix: '/api/notifications' });
  await app.register(workflowRoutes, { prefix: '/api/workflows' });
  await app.register(performanceRoutes, { prefix: '/api/performance' });

  // Serve static files from frontend build in production
  if (process.env.NODE_ENV === 'production' || process.env.SERVE_FRONTEND === 'true') {
    const frontendPath = path.join(__dirname, '../../../apps/frontend/out');
    
    // Check if frontend build exists before registering static plugin
    try {
      await import('fs').then(fs => fs.promises.access(frontendPath));
      
      // Register static file serving
      await app.register(staticPlugin, {
        root: frontendPath,
        prefix: '/',
      });

      // Fallback for SPA routing - serve index.html for non-API routes
      app.setNotFoundHandler(async (request, reply) => {
        if (request.url.startsWith('/api/') || request.url.startsWith('/socket.io/')) {
          reply.code(404).send({ error: 'Not Found' });
          return;
        }
        
        reply.type('text/html');
        return reply.sendFile('index.html');
      });
      
      logger.info('Static frontend serving enabled');
    } catch (error) {
      logger.warn('Frontend build not found, running backend-only mode', { 
        frontendPath,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  return app;
}

async function start() {
  try {
    const app = await buildApp();
    
    const port = parseInt(process.env.PORT || '3000');
    
    await app.listen({ port, host: '0.0.0.0' });
    
    logger.info(`Backend server with Socket.io listening on port ${port}`);
    
    // Start keep-alive service to prevent idle shutdown
    const keepAlive = new KeepAliveService({
      intervalMinutes: 15, // Check every 15 minutes
      logActivity: process.env.NODE_ENV !== 'production' // Log in dev only
    });
    
    keepAlive.start();
    logger.info('Keep-alive service started - backend will stay active');
    
    // Store reference for graceful shutdown
    (app as any).keepAlive = keepAlive;
  } catch (err) {
    logger.error('Error starting server:', err);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  // Stop keep-alive service
  if ((global as any).app?.keepAlive) {
    (global as any).app.keepAlive.stop();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  // Stop keep-alive service
  if ((global as any).app?.keepAlive) {
    (global as any).app.keepAlive.stop();
  }
  process.exit(0);
});

if (require.main === module) {
  start();
}

export { buildApp };