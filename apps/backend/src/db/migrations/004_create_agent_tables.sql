-- Agent Management Database Schema
-- Creates tables for managing AI agent installations, metrics, and logs

-- Agent Installations Table
-- Stores information about agents installed for each business
CREATE TABLE IF NOT EXISTS agent_installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  version VARCHAR(50) NOT NULL,
  business_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'installing',
  config TEXT NOT NULL DEFAULT '{}',
  installed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  metadata TEXT DEFAULT '{}',
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('installing', 'running', 'stopped', 'error')),
  CONSTRAINT unique_agent_per_business UNIQUE (agent_id, business_id)
);

-- Agent Metrics Table
-- Stores performance metrics for agents over time
CREATE TABLE IF NOT EXISTS agent_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_installation_id UUID NOT NULL REFERENCES agent_installations(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  calls_processed INTEGER NOT NULL DEFAULT 0,
  successful_calls INTEGER NOT NULL DEFAULT 0,
  failed_calls INTEGER NOT NULL DEFAULT 0,
  response_time_ms INTEGER NOT NULL DEFAULT 0,
  cost_cents INTEGER NOT NULL DEFAULT 0,
  savings_cents INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_calls CHECK (calls_processed >= 0 AND successful_calls >= 0 AND failed_calls >= 0),
  CONSTRAINT valid_response_time CHECK (response_time_ms >= 0),
  CONSTRAINT calls_consistency CHECK (successful_calls + failed_calls <= calls_processed)
);

-- Agent Logs Table
-- Stores activity logs and events from agents
CREATE TABLE IF NOT EXISTS agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_installation_id UUID NOT NULL REFERENCES agent_installations(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  level VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  context TEXT NULL,
  error TEXT NULL,
  duration_ms INTEGER NULL,
  action VARCHAR(255) NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_log_level CHECK (level IN ('debug', 'info', 'warn', 'error')),
  CONSTRAINT valid_duration CHECK (duration_ms IS NULL OR duration_ms >= 0)
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_agent_installations_business_id ON agent_installations(business_id);
CREATE INDEX IF NOT EXISTS idx_agent_installations_user_id ON agent_installations(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_installations_status ON agent_installations(status);
CREATE INDEX IF NOT EXISTS idx_agent_installations_agent_id ON agent_installations(agent_id);

CREATE INDEX IF NOT EXISTS idx_agent_metrics_installation_id ON agent_metrics(agent_installation_id);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_timestamp ON agent_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_installation_timestamp ON agent_metrics(agent_installation_id, timestamp);

CREATE INDEX IF NOT EXISTS idx_agent_logs_installation_id ON agent_logs(agent_installation_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_timestamp ON agent_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_agent_logs_level ON agent_logs(level);
CREATE INDEX IF NOT EXISTS idx_agent_logs_installation_timestamp ON agent_logs(agent_installation_id, timestamp);

-- Triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_agent_installations_updated_at
  BEFORE UPDATE ON agent_installations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for development/testing
INSERT INTO agent_installations (
  id, agent_id, name, provider, version, business_id, user_id, 
  status, config, metadata
) VALUES 
(
  'whatsapp-ai-responder-1',
  'whatsapp-ai-responder',
  'WhatsApp AI Responder',
  'Local AI Co.',
  '2.1.0',
  'demo-business',
  'demo-user',
  'running',
  '{"responseTemplate": "Hello! Thanks for your message. We will get back to you soon.", "aiModel": "local-llama"}',
  '{"category": "whatsapp", "features": ["auto-reply", "sentiment-analysis"], "rating": 4.8}'
),
(
  'cozmox-voice-agent-1',
  'cozmox-voice-agent',
  'Cozmox Voice Assistant',
  'Cozmox AI',
  '1.5.2',
  'demo-business',
  'demo-user',
  'running',
  '{"greeting": "Hello! How can I help you today?", "businessHours": {"enabled": true, "start": "09:00", "end": "18:00"}}',
  '{"category": "voice", "features": ["call-handling", "appointment-booking"], "rating": 4.6}'
),
(
  'data-enricher-1',
  'contact-data-enricher',
  'Contact Data Enricher',
  'DataMax Solutions',
  '1.2.1',
  'demo-business',
  'demo-user',
  'stopped',
  '{"enrichmentSources": ["social", "company"], "autoEnrich": false}',
  '{"category": "data", "features": ["data-enrichment", "lead-scoring"], "rating": 4.7}'
)
ON CONFLICT (agent_id, business_id) DO NOTHING;

-- Sample metrics data
INSERT INTO agent_metrics (
  agent_installation_id, timestamp, calls_processed, successful_calls, 
  failed_calls, response_time_ms, cost_cents, savings_cents
) VALUES 
-- WhatsApp AI Responder metrics (last 7 days)
('whatsapp-ai-responder-1', CURRENT_TIMESTAMP - INTERVAL '1 day', 47, 44, 3, 1200, 50, 2340),
('whatsapp-ai-responder-1', CURRENT_TIMESTAMP - INTERVAL '2 days', 52, 49, 3, 1100, 55, 2600),
('whatsapp-ai-responder-1', CURRENT_TIMESTAMP - INTERVAL '3 days', 38, 36, 2, 1300, 40, 1900),
('whatsapp-ai-responder-1', CURRENT_TIMESTAMP - INTERVAL '4 days', 41, 39, 2, 1150, 45, 2050),
('whatsapp-ai-responder-1', CURRENT_TIMESTAMP - INTERVAL '5 days', 35, 33, 2, 1250, 38, 1750),
('whatsapp-ai-responder-1', CURRENT_TIMESTAMP - INTERVAL '6 days', 43, 40, 3, 1400, 48, 2150),
('whatsapp-ai-responder-1', CURRENT_TIMESTAMP - INTERVAL '7 days', 39, 37, 2, 1180, 42, 1950),

-- Cozmox Voice Agent metrics (last 7 days)
('cozmox-voice-agent-1', CURRENT_TIMESTAMP - INTERVAL '1 day', 12, 11, 1, 8500, 120, 890),
('cozmox-voice-agent-1', CURRENT_TIMESTAMP - INTERVAL '2 days', 15, 14, 1, 7800, 150, 1125),
('cozmox-voice-agent-1', CURRENT_TIMESTAMP - INTERVAL '3 days', 8, 8, 0, 8200, 80, 600),
('cozmox-voice-agent-1', CURRENT_TIMESTAMP - INTERVAL '4 days', 11, 10, 1, 8900, 110, 825),
('cozmox-voice-agent-1', CURRENT_TIMESTAMP - INTERVAL '5 days', 9, 9, 0, 7900, 90, 675),
('cozmox-voice-agent-1', CURRENT_TIMESTAMP - INTERVAL '6 days', 13, 12, 1, 8300, 130, 975),
('cozmox-voice-agent-1', CURRENT_TIMESTAMP - INTERVAL '7 days', 10, 10, 0, 8100, 100, 750),

-- Data Enricher metrics (last 7 days, stopped 2 hours ago)
('data-enricher-1', CURRENT_TIMESTAMP - INTERVAL '3 hours', 23, 22, 1, 800, 25, 156),
('data-enricher-1', CURRENT_TIMESTAMP - INTERVAL '1 day', 28, 27, 1, 750, 30, 189),
('data-enricher-1', CURRENT_TIMESTAMP - INTERVAL '2 days', 31, 30, 1, 820, 33, 210),
('data-enricher-1', CURRENT_TIMESTAMP - INTERVAL '3 days', 19, 19, 0, 700, 20, 128),
('data-enricher-1', CURRENT_TIMESTAMP - INTERVAL '4 days', 25, 24, 1, 780, 27, 169),
('data-enricher-1', CURRENT_TIMESTAMP - INTERVAL '5 days', 22, 22, 0, 760, 24, 149),
('data-enricher-1', CURRENT_TIMESTAMP - INTERVAL '6 days', 26, 25, 1, 790, 28, 176);

-- Sample log entries
INSERT INTO agent_logs (
  agent_installation_id, timestamp, level, message, context, duration_ms, action
) VALUES 
-- WhatsApp AI Responder logs
('whatsapp-ai-responder-1', CURRENT_TIMESTAMP - INTERVAL '2 minutes', 'info', 'WhatsApp message processed successfully', '{"phone": "+91-9876543210", "messageType": "text"}', 1200, 'AUTO_REPLY'),
('whatsapp-ai-responder-1', CURRENT_TIMESTAMP - INTERVAL '5 minutes', 'info', 'New message received from contact', '{"phone": "+91-9876543210", "content": "Hello, I need help with pricing"}', NULL, 'MESSAGE_RECEIVED'),
('whatsapp-ai-responder-1', CURRENT_TIMESTAMP - INTERVAL '8 minutes', 'info', 'Lead qualification completed', '{"contactId": "contact-123", "score": 85, "stage": "hot"}', 800, 'LEAD_QUALIFICATION'),
('whatsapp-ai-responder-1', CURRENT_TIMESTAMP - INTERVAL '12 minutes', 'warn', 'Response time above threshold', '{"threshold": 3000, "actual": 3200}', 3200, 'PERFORMANCE_WARNING'),
('whatsapp-ai-responder-1', CURRENT_TIMESTAMP - INTERVAL '15 minutes', 'info', 'Agent health check completed', '{"status": "healthy", "checks": 5}', NULL, 'HEALTH_CHECK'),

-- Cozmox Voice Agent logs
('cozmox-voice-agent-1', CURRENT_TIMESTAMP - INTERVAL '3 minutes', 'info', 'Voice call handled successfully', '{"callId": "call-456", "duration": 180, "outcome": "appointment_booked"}', 8500, 'CALL_HANDLED'),
('cozmox-voice-agent-1', CURRENT_TIMESTAMP - INTERVAL '10 minutes', 'info', 'Incoming call received', '{"phone": "+91-9876543211", "callType": "support"}', NULL, 'CALL_RECEIVED'),
('cozmox-voice-agent-1', CURRENT_TIMESTAMP - INTERVAL '25 minutes', 'info', 'Call transcription completed', '{"callId": "call-455", "confidence": 0.92}', 2100, 'TRANSCRIPTION'),

-- Data Enricher logs (stopped agent)
('data-enricher-1', CURRENT_TIMESTAMP - INTERVAL '2 hours', 'info', 'Agent stopped by user', NULL, NULL, 'STOP'),
('data-enricher-1', CURRENT_TIMESTAMP - INTERVAL '3 hours', 'info', 'Contact enrichment completed', '{"contactId": "contact-789", "fieldsUpdated": 5}', 800, 'ENRICH_CONTACT'),
('data-enricher-1', CURRENT_TIMESTAMP - INTERVAL '4 hours', 'error', 'Failed to enrich contact data', '{"contactId": "contact-790", "error": "API rate limit exceeded"}', NULL, 'ENRICH_FAILED');

-- Comments for documentation
COMMENT ON TABLE agent_installations IS 'Stores information about AI agents installed for each business';
COMMENT ON TABLE agent_metrics IS 'Stores performance and usage metrics for agents over time';
COMMENT ON TABLE agent_logs IS 'Stores activity logs and events from agents for debugging and monitoring';

COMMENT ON COLUMN agent_installations.agent_id IS 'Marketplace identifier for the agent type';
COMMENT ON COLUMN agent_installations.config IS 'JSON configuration specific to this agent installation';
COMMENT ON COLUMN agent_installations.metadata IS 'JSON metadata including features, rating, category, etc.';

COMMENT ON COLUMN agent_metrics.cost_cents IS 'Cost in cents for this time period';
COMMENT ON COLUMN agent_metrics.savings_cents IS 'Estimated cost savings in cents for this time period';

COMMENT ON COLUMN agent_logs.context IS 'JSON context data for the log entry';
COMMENT ON COLUMN agent_logs.duration_ms IS 'Duration of the operation in milliseconds';