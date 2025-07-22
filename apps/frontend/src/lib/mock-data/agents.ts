import type { AgentManifest } from '../../types/agent-types';

export const mockAgents: AgentManifest[] = [
  {
    id: 'whatsapp-auto-responder',
    name: 'WhatsApp Auto-Responder',
    version: '1.2.0',
    provider: {
      name: 'CRM Platform',
      website: 'https://crm-platform.com',
      support: 'support@crm-platform.com'
    },
    description: 'Automatically responds to WhatsApp messages with smart templates and escalation',
    longDescription: 'The WhatsApp Auto-Responder intelligently handles incoming messages when you\'re unavailable. It can detect customer intent, use appropriate templates, and escalate complex queries to human agents.',
    icon: '/agents/whatsapp-responder.png',
    capabilities: ['whatsapp', 'auto-reply', 'templates', 'escalation'],
    category: 'communication',
    tags: ['whatsapp', 'automation', 'customer-service'],
    permissions: ['messages:read', 'messages:write', 'contacts:read'],
    pricing: { model: 'freemium', freeLimit: 100, paidRate: 0.05 },
    rating: 4.8,
    reviews: '2.3k',
    installs: '12k+',
    featured: true,
    trending: true,
    runtime: 'nodejs'
  },
  {
    id: 'cozmox-voice-agent',
    name: 'Cozmox Voice Assistant',
    version: '2.1.0',
    provider: {
      name: 'Cozmox AI',
      website: 'https://cozmox.ai',
      support: 'support@cozmox.ai'
    },
    description: 'AI-powered voice agent for outbound calls, appointment scheduling, and lead qualification',
    longDescription: 'Cozmox Voice Assistant makes natural phone calls to your leads, qualifies prospects, schedules appointments, and follows up automatically. Sounds completely human.',
    icon: '/agents/cozmox.png',
    capabilities: ['voice', 'outbound-calls', 'scheduling', 'lead-qualification'],
    category: 'sales',
    tags: ['voice', 'calls', 'automation', 'scheduling'],
    permissions: ['contacts:read', 'contacts:write', 'tasks:write'],
    pricing: { model: 'usage-based', rate: 0.25, unit: 'call' },
    rating: 4.9,
    reviews: '1.8k',
    installs: '8.5k+',
    featured: true,
    runtime: 'external',
    endpoints: {
      api: 'https://api.cozmox.ai/v1',
      webhook: 'https://api.cozmox.ai/webhooks'
    }
  },
  {
    id: 'apollo-data-enricher',
    name: 'Apollo Data Enricher',
    version: '1.5.2',
    provider: {
      name: 'Apollo.io',
      website: 'https://apollo.io',
      support: 'support@apollo.io'
    },
    description: 'Automatically enriches contact data with emails, phone numbers, company info, and social profiles',
    capabilities: ['data-enrichment', 'contact-discovery', 'email-finder'],
    category: 'data',
    tags: ['data', 'enrichment', 'prospecting'],
    permissions: ['contacts:read', 'contacts:write'],
    pricing: { model: 'usage-based', rate: 0.10, unit: 'enrichment' },
    rating: 4.7,
    reviews: '950',
    installs: '5.2k+',
    runtime: 'external'
  },
  {
    id: 'sentiment-analyzer',
    name: 'Message Sentiment Analyzer',
    version: '1.0.8',
    provider: {
      name: 'Analytics Pro',
      website: 'https://analytics-pro.com'
    },
    description: 'Analyzes customer message sentiment and flags negative interactions for immediate attention',
    capabilities: ['sentiment-analysis', 'alerts', 'analytics'],
    category: 'analytics',
    tags: ['sentiment', 'analytics', 'monitoring'],
    permissions: ['messages:read', 'analytics:read'],
    pricing: { model: 'fixed', price: 299, period: 'monthly' },
    rating: 4.4,
    reviews: '420',
    installs: '2.8k+',
    runtime: 'nodejs'
  },
  {
    id: 'follow-up-scheduler',
    name: 'Smart Follow-up Scheduler',
    version: '2.0.1',
    provider: {
      name: 'CRM Platform',
      website: 'https://crm-platform.com'
    },
    description: 'Automatically schedules and sends follow-up messages based on lead behavior and engagement',
    capabilities: ['follow-ups', 'scheduling', 'automation', 'behavioral-triggers'],
    category: 'automation',
    tags: ['follow-up', 'automation', 'scheduling'],
    permissions: ['messages:write', 'contacts:read', 'tasks:write'],
    pricing: { model: 'free' },
    rating: 4.6,
    reviews: '1.1k',
    installs: '15k+',
    trending: true,
    runtime: 'nodejs'
  },
  {
    id: 'lead-scorer',
    name: 'AI Lead Scorer',
    version: '1.3.0',
    provider: {
      name: 'SalesAI',
      website: 'https://salesai.com'
    },
    description: 'Scores leads based on engagement, profile data, and behavioral patterns using machine learning',
    capabilities: ['lead-scoring', 'ml-analysis', 'prioritization'],
    category: 'sales',
    tags: ['scoring', 'leads', 'ai', 'prioritization'],
    permissions: ['contacts:read', 'messages:read', 'analytics:read'],
    pricing: { 
      model: 'tiered', 
      tiers: [
        { limit: 1000, price: 99 },
        { limit: 5000, price: 299 },
        { limit: 999999, price: 799 }
      ]
    },
    rating: 4.5,
    reviews: '680',
    installs: '3.9k+',
    runtime: 'external'
  },
  {
    id: 'campaign-optimizer',
    name: 'Campaign Optimizer',
    version: '1.1.5',
    provider: {
      name: 'MarketingBot',
      website: 'https://marketingbot.ai'
    },
    description: 'Optimizes marketing campaigns by analyzing performance and suggesting improvements',
    capabilities: ['campaign-optimization', 'performance-analysis', 'recommendations'],
    category: 'marketing',
    tags: ['campaigns', 'optimization', 'marketing', 'analysis'],
    permissions: ['analytics:read', 'messages:read'],
    pricing: { model: 'fixed', price: 199, period: 'monthly' },
    rating: 4.3,
    reviews: '340',
    installs: '1.9k+',
    runtime: 'browser'
  },
  {
    id: 'meeting-scheduler',
    name: 'Calendar Meeting Scheduler',
    version: '2.2.0',
    provider: {
      name: 'TimeSync',
      website: 'https://timesync.com'
    },
    description: 'Integrates with your calendar to automatically schedule meetings with prospects',
    capabilities: ['calendar-integration', 'meeting-scheduling', 'availability-checking'],
    category: 'automation',
    tags: ['calendar', 'meetings', 'scheduling', 'integration'],
    permissions: ['contacts:read', 'tasks:write', 'integrations:manage'],
    pricing: { model: 'fixed', price: 49, period: 'monthly' },
    rating: 4.7,
    reviews: '820',
    installs: '4.1k+',
    runtime: 'external',
    endpoints: {
      api: 'https://api.timesync.com/v2'
    }
  },
  {
    id: 'competitor-monitor',
    name: 'Competitor Price Monitor',
    version: '1.0.3',
    provider: {
      name: 'CompetitorWatch',
      website: 'https://competitorwatch.com'
    },
    description: 'Monitors competitor pricing and sends alerts when prices change',
    capabilities: ['price-monitoring', 'competitor-analysis', 'alerts'],
    category: 'analytics',
    tags: ['competitors', 'pricing', 'monitoring', 'alerts'],
    permissions: ['analytics:read'],
    pricing: { model: 'usage-based', rate: 0.02, unit: 'check' },
    rating: 4.2,
    reviews: '180',
    installs: '890+',
    runtime: 'external'
  },
  {
    id: 'social-media-poster',
    name: 'Social Media Poster',
    version: '1.4.7',
    provider: {
      name: 'SocialFlow',
      website: 'https://socialflow.io'
    },
    description: 'Automatically posts to social media based on CRM activities and lead interactions',
    capabilities: ['social-posting', 'content-automation', 'multi-platform'],
    category: 'marketing',
    tags: ['social-media', 'posting', 'automation', 'content'],
    permissions: ['contacts:read', 'integrations:manage'],
    pricing: { model: 'fixed', price: 79, period: 'monthly' },
    rating: 4.1,
    reviews: '520',
    installs: '2.3k+',
    runtime: 'external'
  }
];