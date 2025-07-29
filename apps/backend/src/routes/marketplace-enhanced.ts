import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth';
import { cacheMiddleware, cacheKeyGenerators } from '../middleware/cache-middleware';
import { logger } from '../utils/logger';

interface MarketplaceAgent {
  id: string;
  agentId: string;
  name: string;
  version: string;
  provider: {
    name: string;
    website?: string;
    verified: boolean;
  };
  description: string;
  fullDescription?: string;
  category: string;
  tags: string[];
  capabilities: string[];
  pricing: {
    model: 'free' | 'subscription' | 'usage' | 'freemium';
    price?: number;
    currency?: string;
    freeTrialDays?: number;
  };
  stats: {
    installs: number;
    rating: number;
    reviews: number;
  };
  requirements: {
    minPlanLevel?: string;
    requiredFeatures?: string[];
  };
  screenshots?: string[];
  featured: boolean;
  verified: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// Sample marketplace data that works without complex database setup
const getSampleMarketplaceData = (): MarketplaceAgent[] => [
  {
    id: '1',
    agentId: 'whatsapp-auto-responder-v2',
    name: 'WhatsApp Auto Responder Pro',
    version: '2.1.0',
    provider: {
      name: 'CRM Automation Solutions',
      website: 'https://crmautomation.in',
      verified: true
    },
    description: 'Advanced WhatsApp automation with AI-powered responses and lead qualification',
    fullDescription: 'Transform your WhatsApp business communication with intelligent automation. This agent handles customer inquiries, qualifies leads, books appointments, and provides 24/7 customer support with natural language processing. Features include multi-language support, sentiment analysis, and seamless integration with your existing CRM workflows.',
    category: 'whatsapp',
    tags: ['whatsapp', 'automation', 'ai', 'leads', 'support'],
    capabilities: ['auto-response', 'lead-qualification', 'appointment-booking', 'multilingual'],
    pricing: {
      model: 'freemium',
      price: 999,
      currency: 'INR',
      freeTrialDays: 14
    },
    stats: {
      installs: 1250,
      rating: 4.8,
      reviews: 89
    },
    requirements: {},
    featured: true,
    verified: true,
    status: 'active',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z'
  },
  {
    id: '2',
    agentId: 'ai-lead-scoring-engine',
    name: 'AI Lead Scoring Engine',
    version: '1.8.0',
    provider: {
      name: 'DataCRM Analytics',
      website: 'https://datacrm.ai',
      verified: true
    },
    description: 'Intelligent lead scoring based on behavior, engagement, and demographic data',
    fullDescription: 'Boost your sales efficiency with advanced AI lead scoring. Automatically prioritize leads based on conversion probability, engagement patterns, and behavioral signals to focus your team on high-value prospects. Includes predictive analytics, custom scoring models, and seamless CRM integration.',
    category: 'data',
    tags: ['analytics', 'scoring', 'ai', 'predictions', 'sales'],
    capabilities: ['lead-scoring', 'predictive-analytics', 'behavior-analysis', 'integration-apis'],
    pricing: {
      model: 'subscription',
      price: 1499,
      currency: 'INR',
      freeTrialDays: 7
    },
    stats: {
      installs: 890,
      rating: 4.6,
      reviews: 67
    },
    requirements: {},
    featured: true,
    verified: true,
    status: 'active',
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-18T00:00:00Z'
  },
  {
    id: '3',
    agentId: 'voice-call-assistant',
    name: 'AI Voice Call Assistant',
    version: '3.0.2',
    provider: {
      name: 'VoiceAI India',
      website: 'https://voiceai.in',
      verified: true
    },
    description: 'Human-like voice AI for inbound and outbound call handling',
    fullDescription: 'Revolutionize your phone operations with AI voice technology. Handle customer calls, conduct surveys, book appointments, and provide support with natural voice interactions in Hindi and English. Advanced features include call recording, sentiment analysis, and integration with popular telephony systems.',
    category: 'voice',
    tags: ['voice', 'calls', 'ai', 'hindi', 'english'],
    capabilities: ['voice-calls', 'multilingual', 'call-routing', 'appointment-booking'],
    pricing: {
      model: 'usage',
      price: 2.5,
      currency: 'INR'
    },
    stats: {
      installs: 456,
      rating: 4.3,
      reviews: 34
    },
    requirements: {},
    featured: false,
    verified: true,
    status: 'active',
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  },
  {
    id: '4',
    agentId: 'customer-support-bot',
    name: 'Intelligent Support Bot',
    version: '4.1.0',
    provider: {
      name: 'SupportAI Technologies',
      website: 'https://supportai.tech',
      verified: true
    },
    description: '24/7 AI customer support with ticket routing and escalation',
    fullDescription: 'Provide round-the-clock customer support with intelligent chatbot technology. Handles common queries, routes complex issues, and seamlessly escalates to human agents when needed. Features knowledge base integration, multi-channel support, and detailed analytics.',
    category: 'support',
    tags: ['support', 'chatbot', 'tickets', 'automation'],
    capabilities: ['chatbot', 'ticket-routing', 'escalation', 'knowledge-base'],
    pricing: {
      model: 'freemium',
      price: 899,
      currency: 'INR',
      freeTrialDays: 21
    },
    stats: {
      installs: 2100,
      rating: 4.9,
      reviews: 156
    },
    requirements: {},
    featured: true,
    verified: true,
    status: 'active',
    createdAt: '2024-01-08T00:00:00Z',
    updatedAt: '2024-01-22T00:00:00Z'
  },
  {
    id: '5',
    agentId: 'social-media-monitor',
    name: 'Social Media Monitor',
    version: '1.5.1',
    provider: {
      name: 'SocialCRM Tools',
      verified: false
    },
    description: 'Track mentions, engage with customers, and manage social presence',
    fullDescription: 'Monitor your brand across social platforms, automatically respond to mentions, track sentiment, and engage with customers. Supports Instagram, Facebook, Twitter, and LinkedIn with comprehensive analytics and reporting.',
    category: 'automation',
    tags: ['social', 'monitoring', 'engagement', 'sentiment'],
    capabilities: ['social-monitoring', 'auto-engagement', 'sentiment-analysis', 'reporting'],
    pricing: {
      model: 'freemium',
      price: 799,
      currency: 'INR',
      freeTrialDays: 30
    },
    stats: {
      installs: 678,
      rating: 4.2,
      reviews: 45
    },
    requirements: {},
    featured: false,
    verified: false,
    status: 'active',
    createdAt: '2024-01-12T00:00:00Z',
    updatedAt: '2024-01-17T00:00:00Z'
  },
  {
    id: '6',
    agentId: 'email-campaign-optimizer',
    name: 'Email Campaign Optimizer',
    version: '2.3.0',
    provider: {
      name: 'EmailAI Solutions',
      website: 'https://emailai.co.in',
      verified: true
    },
    description: 'AI-powered email marketing with personalization and optimization',
    fullDescription: 'Maximize email marketing ROI with AI-driven personalization, optimal send times, subject line optimization, and automated follow-up sequences. Includes A/B testing, deliverability monitoring, and detailed campaign analytics.',
    category: 'automation',
    tags: ['email', 'marketing', 'optimization', 'automation'],
    capabilities: ['email-optimization', 'personalization', 'a-b-testing', 'automation'],
    pricing: {
      model: 'subscription',
      price: 1299,
      currency: 'INR',
      freeTrialDays: 14
    },
    stats: {
      installs: 720,
      rating: 4.5,
      reviews: 52
    },
    requirements: {},
    featured: false,
    verified: true,
    status: 'active',
    createdAt: '2024-01-07T00:00:00Z',
    updatedAt: '2024-01-19T00:00:00Z'
  },
  {
    id: '7',
    agentId: 'lead-enrichment-pro',
    name: 'Lead Enrichment Pro',
    version: '1.9.3',
    provider: {
      name: 'DataEnrich India',
      verified: true
    },
    description: 'Automatically enrich lead data with social, professional, and company information',
    fullDescription: 'Enhance your lead database with comprehensive data enrichment. Automatically gather social profiles, company information, job titles, and contact details to improve sales outcomes. Supports bulk processing and real-time enrichment.',
    category: 'lead-gen',
    tags: ['enrichment', 'data', 'leads', 'profiles'],
    capabilities: ['data-enrichment', 'social-profiles', 'company-data', 'contact-discovery'],
    pricing: {
      model: 'usage',
      price: 5,
      currency: 'INR'
    },
    stats: {
      installs: 543,
      rating: 4.1,
      reviews: 38
    },
    requirements: {},
    featured: false,
    verified: false,
    status: 'active',
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-14T00:00:00Z'
  },
  {
    id: '8',
    agentId: 'appointment-scheduler-ai',
    name: 'AI Appointment Scheduler',
    version: '2.0.1',
    provider: {
      name: 'ScheduleAI Systems',
      website: 'https://scheduleai.in',
      verified: true
    },
    description: 'Smart appointment booking with calendar integration and reminders',
    fullDescription: 'Streamline appointment booking with intelligent scheduling AI. Integrates with Google Calendar, sends automated reminders, handles rescheduling, and optimizes meeting slots. Features conflict detection and time zone management.',
    category: 'automation',
    tags: ['appointments', 'calendar', 'scheduling', 'automation'],
    capabilities: ['scheduling', 'calendar-sync', 'reminders', 'optimization'],
    pricing: {
      model: 'subscription',
      price: 699,
      currency: 'INR',
      freeTrialDays: 10
    },
    stats: {
      installs: 340,
      rating: 4.4,
      reviews: 29
    },
    requirements: {},
    featured: false,
    verified: true,
    status: 'active',
    createdAt: '2024-01-11T00:00:00Z',
    updatedAt: '2024-01-16T00:00:00Z'
  }
];

const getCategories = () => [
  { id: 'all', name: 'All Categories', count: 8 },
  { id: 'whatsapp', name: 'WhatsApp', count: 1 },
  { id: 'voice', name: 'Voice Agents', count: 1 },
  { id: 'data', name: 'Data & Analytics', count: 1 },
  { id: 'automation', name: 'Automation', count: 3 },
  { id: 'lead-gen', name: 'Lead Generation', count: 1 },
  { id: 'support', name: 'Customer Support', count: 1 }
];

export async function enhancedMarketplaceRoutes(fastify: FastifyInstance) {
  // Get all agents with filtering
  fastify.get('/agents', {
    preHandler: [
      cacheMiddleware({
        ttl: 300, // 5 minutes cache
        keyGenerator: cacheKeyGenerators.withQuery
      })
    ]
  }, async (request, reply) => {
    try {
      const {
        category,
        search,
        pricing = 'all',
        sort = 'popular',
        featured,
        verified,
        limit = 20,
        offset = 0
      } = request.query as any;

      let agents = getSampleMarketplaceData();

      // Apply filters
      if (category && category !== 'all') {
        agents = agents.filter(agent => agent.category === category);
      }

      if (search) {
        const searchLower = search.toLowerCase();
        agents = agents.filter(agent => 
          agent.name.toLowerCase().includes(searchLower) ||
          agent.description.toLowerCase().includes(searchLower) ||
          agent.tags.some((tag: string) => tag.toLowerCase().includes(searchLower)) ||
          agent.capabilities.some((cap: string) => cap.toLowerCase().includes(searchLower))
        );
      }

      if (pricing !== 'all') {
        agents = agents.filter(agent => agent.pricing.model === pricing);
      }

      if (featured !== undefined) {
        agents = agents.filter(agent => agent.featured === (featured === 'true'));
      }

      if (verified !== undefined) {
        agents = agents.filter(agent => agent.verified === (verified === 'true'));
      }

      // Apply sorting
      switch (sort) {
        case 'popular':
          agents.sort((a, b) => b.stats.installs - a.stats.installs);
          break;
        case 'newest':
          agents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
        case 'rating':
          agents.sort((a, b) => b.stats.rating - a.stats.rating);
          break;
        case 'name':
          agents.sort((a, b) => a.name.localeCompare(b.name));
          break;
      }

      // Apply pagination
      const startIndex = parseInt(offset.toString());
      const pageSize = parseInt(limit.toString());
      const paginatedAgents = agents.slice(startIndex, startIndex + pageSize);

      reply.send({
        success: true,
        agents: paginatedAgents,
        total: agents.length,
        offset: startIndex,
        limit: pageSize,
        hasMore: startIndex + pageSize < agents.length
      });
    } catch (error) {
      logger.error('Failed to fetch marketplace agents:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch marketplace agents'
      });
    }
  });

  // Get featured agents
  fastify.get('/featured', {
    preHandler: [
      cacheMiddleware({
        ttl: 600, // 10 minutes cache for featured agents
        keyGenerator: () => 'marketplace:featured'
      })
    ]
  }, async (request, reply) => {
    try {
      const agents = getSampleMarketplaceData();
      const featuredAgents = agents
        .filter(agent => agent.featured)
        .sort((a, b) => b.stats.installs - a.stats.installs)
        .slice(0, 6);

      reply.send({
        success: true,
        featured: featuredAgents
      });
    } catch (error) {
      logger.error('Failed to fetch featured agents:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch featured agents'
      });
    }
  });

  // Get categories
  fastify.get('/categories', {
    preHandler: [
      cacheMiddleware({
        ttl: 3600, // 1 hour cache for categories
        keyGenerator: () => 'marketplace:categories'
      })
    ]
  }, async (request, reply) => {
    try {
      reply.send({
        success: true,
        categories: getCategories()
      });
    } catch (error) {
      logger.error('Failed to fetch categories:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch categories'
      });
    }
  });

  // Get agent by ID
  fastify.get('/agents/:id', {
    preHandler: [
      cacheMiddleware({
        ttl: 600, // 10 minutes cache
        keyGenerator: (req) => `marketplace:agent:${(req.params as any).id}`
      })
    ]
  }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const agents = getSampleMarketplaceData();
      const agent = agents.find(a => a.id === id || a.agentId === id);

      if (!agent) {
        reply.status(404).send({
          success: false,
          error: 'Agent not found'
        });
        return;
      }

      reply.send({
        success: true,
        agent
      });
    } catch (error) {
      logger.error('Failed to fetch agent:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch agent'
      });
    }
  });

  // Install agent (placeholder)
  fastify.post('/agents/:id/install', {
    preHandler: [authenticate]
  }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const agents = getSampleMarketplaceData();
      const agent = agents.find(a => a.id === id || a.agentId === id);

      if (!agent) {
        reply.status(404).send({
          success: false,
          error: 'Agent not found'
        });
        return;
      }

      // TODO: Implement actual installation logic
      // For now, just return success
      reply.send({
        success: true,
        message: `Agent "${agent.name}" has been installed successfully`,
        agent: {
          id: agent.id,
          name: agent.name,
          version: agent.version,
          status: 'installed'
        }
      });
    } catch (error) {
      logger.error('Failed to install agent:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to install agent'
      });
    }
  });

  // Get marketplace stats
  fastify.get('/stats', {
    preHandler: [
      cacheMiddleware({
        ttl: 300, // 5 minutes cache
        keyGenerator: () => 'marketplace:stats'
      })
    ]
  }, async (request, reply) => {
    try {
      const agents = getSampleMarketplaceData();
      
      const stats = {
        totalAgents: agents.length,
        featuredAgents: agents.filter(a => a.featured).length,
        verifiedAgents: agents.filter(a => a.verified).length,
        totalInstalls: agents.reduce((sum, agent) => sum + agent.stats.installs, 0),
        averageRating: agents.reduce((sum, agent) => sum + agent.stats.rating, 0) / agents.length,
        categoryCounts: getCategories().reduce((acc: Record<string, number>, cat) => {
          if (cat.id !== 'all') acc[cat.id] = cat.count;
          return acc;
        }, {}),
        pricingModels: agents.reduce((acc: Record<string, number>, agent) => {
          acc[agent.pricing.model] = (acc[agent.pricing.model] || 0) + 1;
          return acc;
        }, {}),
        topRated: agents
          .sort((a, b) => b.stats.rating - a.stats.rating)
          .slice(0, 3)
          .map(agent => ({
            id: agent.id,
            name: agent.name,
            rating: agent.stats.rating,
            installs: agent.stats.installs
          }))
      };

      reply.send({
        success: true,
        stats
      });
    } catch (error) {
      logger.error('Failed to fetch marketplace stats:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch marketplace stats'
      });
    }
  });

  // Search agents
  fastify.get('/search', {
    preHandler: [
      cacheMiddleware({
        ttl: 300, // 5 minutes cache
        keyGenerator: cacheKeyGenerators.withQuery
      })
    ]
  }, async (request, reply) => {
    try {
      const { q: query, limit = 10 } = request.query as any;

      if (!query || query.trim().length < 2) {
        reply.send({
          success: true,
          results: [],
          query: query || '',
          total: 0
        });
        return;
      }

      const agents = getSampleMarketplaceData();
      const searchLower = query.toLowerCase();
      
      const results = agents
        .filter(agent => 
          agent.name.toLowerCase().includes(searchLower) ||
          agent.description.toLowerCase().includes(searchLower) ||
          agent.tags.some((tag: string) => tag.toLowerCase().includes(searchLower)) ||
          agent.capabilities.some((cap: string) => cap.toLowerCase().includes(searchLower))
        )
        .slice(0, parseInt(limit.toString()))
        .map(agent => ({
          id: agent.id,
          agentId: agent.agentId,
          name: agent.name,
          description: agent.description,
          category: agent.category,
          rating: agent.stats.rating,
          installs: agent.stats.installs,
          featured: agent.featured,
          verified: agent.verified
        }));

      reply.send({
        success: true,
        results,
        query,
        total: results.length
      });
    } catch (error) {
      logger.error('Failed to search agents:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to search agents'
      });
    }
  });
}