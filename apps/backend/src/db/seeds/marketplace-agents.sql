-- Sample Marketplace Agents
-- This file contains sample data for the marketplace to showcase functionality

-- First, ensure the agent_registry table exists and has the required columns
-- (The actual table creation is handled by migrations)

-- Sample agents for the marketplace
INSERT INTO agent_registry (
  agent_id,
  name,
  version,
  provider_name,
  provider_website,
  provider_verified,
  description,
  full_description,
  category,
  tags,
  capabilities,
  pricing_model,
  price,
  currency,
  free_trial_days,
  min_plan_level,
  required_features,
  screenshots,
  featured,
  featured_order,
  verified,
  status,
  created_at,
  updated_at
) VALUES 

-- WhatsApp Auto Responder
(
  'whatsapp-auto-responder',
  '1.2.0',
  'CRM Agents Inc',
  'https://crmagents.com',
  true,
  'Automatically respond to WhatsApp messages with intelligent AI responses',
  'The WhatsApp Auto Responder agent uses advanced AI to understand customer queries and provide intelligent, context-aware responses. It can handle common questions, qualify leads, book appointments, and escalate complex issues to human agents. Perfect for businesses that receive high volumes of WhatsApp messages.',
  'whatsapp',
  ARRAY['messaging', 'automation', 'ai', 'customer-service'],
  ARRAY['auto-response', 'lead-qualification', 'appointment-booking', 'escalation'],
  'freemium',
  29.99,
  'USD',
  14,
  null,
  ARRAY['messaging:whatsapp'],
  ARRAY['https://example.com/screenshot1.png', 'https://example.com/screenshot2.png'],
  true,
  1,
  true,
  'active',
  NOW() - INTERVAL '15 days',
  NOW() - INTERVAL '5 days'
),

-- AI Lead Scoring
(
  'lead-scoring-ai',
  '2.1.0',
  'SmartCRM Solutions',
  'https://smartcrm.io',
  true,
  'Intelligent lead scoring based on behavior and engagement patterns',
  'Advanced machine learning agent that analyzes customer behavior, engagement patterns, and demographic data to assign accurate lead scores. Helps prioritize follow-ups and improves conversion rates by focusing efforts on high-quality prospects.',
  'data',
  ARRAY['analytics', 'lead-scoring', 'machine-learning', 'predictive'],
  ARRAY['lead-analysis', 'scoring', 'predictions', 'behavior-tracking'],
  'subscription',
  49.99,
  'USD',
  7,
  'pro',
  ARRAY['analytics:view'],
  ARRAY['https://example.com/lead-scoring-1.png'],
  true,
  2,
  true,
  'active',
  NOW() - INTERVAL '20 days',
  NOW() - INTERVAL '3 days'
),

-- Voice Call Assistant
(
  'voice-assistant',
  '1.0.5',
  'VoiceAI Technologies',
  'https://voiceai.tech',
  false,
  'AI-powered voice assistant for making and receiving calls',
  'Revolutionary voice AI that can handle inbound and outbound calls with natural conversation flow. Capable of appointment booking, lead qualification, customer support, and call routing. Supports multiple languages and accents.',
  'voice',
  ARRAY['voice', 'calls', 'automation', 'ai'],
  ARRAY['call-handling', 'appointment-booking', 'lead-qualification', 'multilingual'],
  'usage',
  0.15,
  'USD',
  null,
  null,
  ARRAY['calling:outbound'],
  ARRAY['https://example.com/voice-ai-1.png', 'https://example.com/voice-ai-2.png', 'https://example.com/voice-ai-3.png'],
  true,
  3,
  false,
  'active',
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '2 days'
),

-- Email Marketing Automation
(
  'email-marketing-pro',
  '3.2.1',
  'Marketing Automation Hub',
  'https://marketingautohub.com',
  true,
  'Advanced email marketing automation with AI-powered personalization',
  'Comprehensive email marketing solution that creates personalized campaigns based on customer behavior, purchase history, and engagement patterns. Features drag-and-drop email builder, A/B testing, analytics, and automated drip campaigns.',
  'automation',
  ARRAY['email', 'marketing', 'automation', 'personalization'],
  ARRAY['campaign-creation', 'personalization', 'analytics', 'ab-testing'],
  'subscription',
  79.99,
  'USD',
  30,
  'pro',
  ARRAY['email:marketing'],
  ARRAY['https://example.com/email-1.png'],
  false,
  null,
  true,
  'active',
  NOW() - INTERVAL '25 days',
  NOW() - INTERVAL '1 day'
),

-- Customer Support Chatbot
(
  'support-chatbot-deluxe',
  '2.0.0',
  'Support Solutions Inc',
  'https://supportsolutions.io',
  true,
  'Intelligent customer support chatbot with human handoff',
  'Advanced chatbot that handles customer inquiries across multiple channels. Uses natural language processing to understand complex queries, access knowledge bases, and provide accurate solutions. Seamlessly escalates to human agents when needed.',
  'support',
  ARRAY['support', 'chatbot', 'automation', 'multilingual'],
  ARRAY['query-handling', 'knowledge-base', 'escalation', 'multilingual-support'],
  'freemium',
  39.99,
  'USD',
  21,
  null,
  ARRAY['messaging:chat'],
  ARRAY['https://example.com/chatbot-1.png', 'https://example.com/chatbot-2.png'],
  false,
  null,
  true,
  'active',
  NOW() - INTERVAL '12 days',
  NOW() - INTERVAL '4 days'
),

-- Social Media Monitor
(
  'social-media-monitor',
  '1.3.2',
  'SocialWatch Analytics',
  'https://socialwatch.com',
  false,
  'Monitor brand mentions and social media engagement',
  'Comprehensive social media monitoring tool that tracks brand mentions, sentiment analysis, competitor activity, and engagement metrics across all major platforms. Provides real-time alerts and detailed analytics reports.',
  'data',
  ARRAY['social-media', 'monitoring', 'analytics', 'sentiment'],
  ARRAY['brand-monitoring', 'sentiment-analysis', 'competitor-tracking', 'reporting'],
  'subscription',
  29.99,
  'USD',
  14,
  'standard',
  ARRAY['social:monitoring'],
  ARRAY[],
  false,
  null,
  false,
  'active',
  NOW() - INTERVAL '8 days',
  NOW() - INTERVAL '1 day'
),

-- Pipeline Optimizer
(
  'pipeline-optimizer-ai',
  '1.1.0',
  'Sales Intelligence Corp',
  'https://salesintel.pro',
  true,
  'AI-powered sales pipeline optimization and forecasting',
  'Machine learning agent that analyzes your sales pipeline to identify bottlenecks, predict deal outcomes, and recommend actions to improve conversion rates. Provides detailed forecasting and pipeline health metrics.',
  'data',
  ARRAY['sales', 'pipeline', 'ai', 'forecasting'],
  ARRAY['pipeline-analysis', 'forecasting', 'optimization', 'recommendations'],
  'subscription',
  99.99,
  'USD',
  14,
  'enterprise',
  ARRAY['pipeline:view', 'analytics:advanced'],
  ARRAY['https://example.com/pipeline-1.png'],
  false,
  null,
  true,
  'active',
  NOW() - INTERVAL '18 days',
  NOW() - INTERVAL '6 days'
),

-- WhatsApp Scheduler
(
  'whatsapp-scheduler',
  '1.0.3',
  'Messaging Solutions Ltd',
  'https://messagingsolutions.com',
  true,
  'Schedule and automate WhatsApp message campaigns',
  'Powerful scheduling tool for WhatsApp business communications. Plan and send bulk messages, set up automated follow-up sequences, and track message delivery and engagement rates. Perfect for marketing campaigns and customer outreach.',
  'whatsapp',
  ARRAY['whatsapp', 'scheduling', 'campaigns', 'bulk-messaging'],
  ARRAY['message-scheduling', 'bulk-sending', 'campaign-management', 'analytics'],
  'freemium',
  19.99,
  'USD',
  7,
  null,
  ARRAY['messaging:whatsapp'],
  ARRAY['https://example.com/scheduler-1.png', 'https://example.com/scheduler-2.png'],
  false,
  null,
  true,
  'active',
  NOW() - INTERVAL '6 days',
  NOW() - INTERVAL '1 day'
)

ON CONFLICT (agent_id) DO UPDATE SET
  name = EXCLUDED.name,
  version = EXCLUDED.version,
  provider_name = EXCLUDED.provider_name,
  provider_website = EXCLUDED.provider_website,
  provider_verified = EXCLUDED.provider_verified,
  description = EXCLUDED.description,
  full_description = EXCLUDED.full_description,
  category = EXCLUDED.category,
  tags = EXCLUDED.tags,
  capabilities = EXCLUDED.capabilities,
  pricing_model = EXCLUDED.pricing_model,
  price = EXCLUDED.price,
  currency = EXCLUDED.currency,
  free_trial_days = EXCLUDED.free_trial_days,
  min_plan_level = EXCLUDED.min_plan_level,
  required_features = EXCLUDED.required_features,
  screenshots = EXCLUDED.screenshots,
  featured = EXCLUDED.featured,
  featured_order = EXCLUDED.featured_order,
  verified = EXCLUDED.verified,
  status = EXCLUDED.status,
  updated_at = NOW();

-- Sample reviews for some agents
INSERT INTO agent_reviews (
  agent_id, user_id, business_id, rating, title, comment, verified_purchase, created_at
) VALUES 
(
  'whatsapp-auto-responder',
  gen_random_uuid(),
  gen_random_uuid(),
  5,
  'Game changer for our business!',
  'This agent has completely transformed how we handle WhatsApp inquiries. Response time improved dramatically and customer satisfaction is through the roof.',
  true,
  NOW() - INTERVAL '10 days'
),
(
  'whatsapp-auto-responder',
  gen_random_uuid(),
  gen_random_uuid(),
  4,
  'Great functionality, easy setup',
  'Very impressed with the AI responses. Setup was straightforward and the customization options are excellent.',
  true,
  NOW() - INTERVAL '8 days'
),
(
  'lead-scoring-ai',
  gen_random_uuid(),
  gen_random_uuid(),
  5,
  'Excellent lead qualification',
  'Our conversion rates have improved by 35% since implementing this lead scoring system. The AI is remarkably accurate.',
  true,
  NOW() - INTERVAL '15 days'
),
(
  'lead-scoring-ai',
  gen_random_uuid(),
  gen_random_uuid(),
  4,
  'Good insights but could use more customization',
  'The scoring is generally accurate but I would like more control over the scoring criteria.',
  true,
  NOW() - INTERVAL '5 days'
),
(
  'voice-assistant',
  gen_random_uuid(),
  gen_random_uuid(),
  4,
  'Impressive voice quality',
  'The voice sounds very natural and handles most conversations well. Occasional issues with complex queries.',
  false,
  NOW() - INTERVAL '3 days'
)
ON CONFLICT (agent_id, user_id) DO NOTHING;

-- Update agent install counts (simulate some installations)
INSERT INTO installed_agents (agent_id, business_id, user_id, version, status, installed_at)
SELECT 
  'whatsapp-auto-responder',
  gen_random_uuid(),
  gen_random_uuid(),
  '1.2.0',
  'active',
  NOW() - (random() * INTERVAL '30 days')
FROM generate_series(1, 1250); -- 1250 installs

INSERT INTO installed_agents (agent_id, business_id, user_id, version, status, installed_at)
SELECT 
  'lead-scoring-ai',
  gen_random_uuid(),
  gen_random_uuid(),
  '2.1.0',
  'active',
  NOW() - (random() * INTERVAL '25 days')
FROM generate_series(1, 890); -- 890 installs

INSERT INTO installed_agents (agent_id, business_id, user_id, version, status, installed_at)
SELECT 
  'voice-assistant',
  gen_random_uuid(),
  gen_random_uuid(),
  '1.0.5',
  'active',
  NOW() - (random() * INTERVAL '15 days')
FROM generate_series(1, 456); -- 456 installs

INSERT INTO installed_agents (agent_id, business_id, user_id, version, status, installed_at)
SELECT 
  'support-chatbot-deluxe',
  gen_random_uuid(),
  gen_random_uuid(),
  '2.0.0',
  'active',
  NOW() - (random() * INTERVAL '20 days')
FROM generate_series(1, 670); -- 670 installs

INSERT INTO installed_agents (agent_id, business_id, user_id, version, status, installed_at)
SELECT 
  'whatsapp-scheduler',
  gen_random_uuid(),
  gen_random_uuid(),
  '1.0.3',
  'active',
  NOW() - (random() * INTERVAL '10 days')
FROM generate_series(1, 345); -- 345 installs