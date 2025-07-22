-- Agent Billing and Usage Tracking Schema
-- Creates tables for tracking agent usage, billing, and cost management

-- Agent installations table (tracks which agents are installed for each business)
CREATE TABLE IF NOT EXISTS agent_installations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id VARCHAR(255) NOT NULL,
    agent_id VARCHAR(255) NOT NULL,
    agent_name VARCHAR(255) NOT NULL,
    agent_provider VARCHAR(255) NOT NULL,
    agent_version VARCHAR(50) NOT NULL,
    pricing_model VARCHAR(50) NOT NULL CHECK (pricing_model IN ('free', 'subscription', 'usage', 'hybrid')),
    pricing_config JSONB NOT NULL DEFAULT '{}',
    installed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
    config JSONB DEFAULT '{}',
    UNIQUE(business_id, agent_id)
);

-- Usage events table (tracks individual usage events for billing)
CREATE TABLE IF NOT EXISTS agent_usage_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id VARCHAR(255) NOT NULL,
    agent_id VARCHAR(255) NOT NULL,
    installation_id UUID NOT NULL REFERENCES agent_installations(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB DEFAULT '{}',
    usage_amount DECIMAL(15,6) NOT NULL DEFAULT 0, -- Amount consumed (minutes, tokens, requests, etc.)
    usage_unit VARCHAR(50) NOT NULL, -- Unit of measurement (minutes, tokens, requests, etc.)
    cost_amount DECIMAL(15,6) NOT NULL DEFAULT 0, -- Cost in base currency units (paise for INR)
    currency VARCHAR(3) DEFAULT 'INR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    billing_period DATE, -- Which billing period this belongs to (YYYY-MM-01)
    processed BOOLEAN DEFAULT false -- Whether this event has been processed for billing
);

-- Billing periods table (tracks billing cycles and totals)
CREATE TABLE IF NOT EXISTS billing_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id VARCHAR(255) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'finalized', 'paid', 'overdue')),
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'INR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    finalized_at TIMESTAMP WITH TIME ZONE,
    due_date DATE,
    UNIQUE(business_id, period_start)
);

-- Agent billing summaries (aggregated usage per agent per billing period)
CREATE TABLE IF NOT EXISTS agent_billing_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id VARCHAR(255) NOT NULL,
    agent_id VARCHAR(255) NOT NULL,
    installation_id UUID NOT NULL REFERENCES agent_installations(id) ON DELETE CASCADE,
    billing_period_id UUID NOT NULL REFERENCES billing_periods(id) ON DELETE CASCADE,
    usage_summary JSONB NOT NULL DEFAULT '{}', -- Aggregated usage by unit type
    total_cost DECIMAL(15,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'INR',
    events_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(business_id, agent_id, billing_period_id)
);

-- Usage quotas and limits (track limits and overages)
CREATE TABLE IF NOT EXISTS agent_usage_quotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id VARCHAR(255) NOT NULL,
    agent_id VARCHAR(255) NOT NULL,
    installation_id UUID NOT NULL REFERENCES agent_installations(id) ON DELETE CASCADE,
    quota_type VARCHAR(50) NOT NULL, -- 'monthly', 'daily', 'lifetime'
    usage_unit VARCHAR(50) NOT NULL,
    quota_limit DECIMAL(15,6) NOT NULL,
    quota_used DECIMAL(15,6) NOT NULL DEFAULT 0,
    quota_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    quota_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    reset_schedule VARCHAR(50), -- 'monthly', 'daily', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(business_id, agent_id, quota_type, usage_unit)
);

-- Billing notifications and alerts
CREATE TABLE IF NOT EXISTS billing_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id VARCHAR(255) NOT NULL,
    agent_id VARCHAR(255),
    notification_type VARCHAR(100) NOT NULL, -- 'quota_warning', 'quota_exceeded', 'billing_due', etc.
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_installations_business ON agent_installations(business_id);
CREATE INDEX IF NOT EXISTS idx_agent_installations_status ON agent_installations(status);

CREATE INDEX IF NOT EXISTS idx_usage_events_business_agent ON agent_usage_events(business_id, agent_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_billing_period ON agent_usage_events(billing_period);
CREATE INDEX IF NOT EXISTS idx_usage_events_created_at ON agent_usage_events(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_events_processed ON agent_usage_events(processed);

CREATE INDEX IF NOT EXISTS idx_billing_periods_business ON billing_periods(business_id);
CREATE INDEX IF NOT EXISTS idx_billing_periods_status ON billing_periods(status);
CREATE INDEX IF NOT EXISTS idx_billing_periods_due_date ON billing_periods(due_date);

CREATE INDEX IF NOT EXISTS idx_billing_summaries_period ON agent_billing_summaries(billing_period_id);
CREATE INDEX IF NOT EXISTS idx_billing_summaries_business ON agent_billing_summaries(business_id);

CREATE INDEX IF NOT EXISTS idx_usage_quotas_business_agent ON agent_usage_quotas(business_id, agent_id);
CREATE INDEX IF NOT EXISTS idx_usage_quotas_period ON agent_usage_quotas(quota_period_start, quota_period_end);

CREATE INDEX IF NOT EXISTS idx_billing_notifications_business ON billing_notifications(business_id);
CREATE INDEX IF NOT EXISTS idx_billing_notifications_sent ON billing_notifications(sent);

-- Insert some sample data for testing
INSERT INTO agent_installations (business_id, agent_id, agent_name, agent_provider, agent_version, pricing_model, pricing_config) VALUES
('demo-business', 'cozmox-voice-agent', 'Cozmox Voice Assistant', 'Cozmox AI', '1.5.2', 'usage', 
 '{"perMinute": 150, "freeLimit": 60, "unit": "minutes", "currency": "INR"}'::jsonb),
('demo-business', 'whatsapp-ai-responder', 'WhatsApp AI Responder', 'Local AI Co.', '2.1.0', 'subscription',
 '{"monthlyPrice": 99900, "limits": {"messages": 5000, "apiCalls": 10000}, "currency": "INR"}'::jsonb);

-- Create current billing period
INSERT INTO billing_periods (business_id, period_start, period_end, due_date) VALUES
('demo-business', DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month') - INTERVAL '1 day', DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month') + INTERVAL '15 days');

-- Insert some sample usage events
INSERT INTO agent_usage_events (business_id, agent_id, installation_id, event_type, usage_amount, usage_unit, cost_amount, billing_period) 
SELECT 
    'demo-business',
    'cozmox-voice-agent',
    (SELECT id FROM agent_installations WHERE agent_id = 'cozmox-voice-agent' AND business_id = 'demo-business'),
    'call_completed',
    5.5,
    'minutes',
    825, -- 5.5 minutes * ₹1.50 = ₹8.25 = 825 paise
    DATE_TRUNC('month', CURRENT_DATE);

INSERT INTO agent_usage_events (business_id, agent_id, installation_id, event_type, usage_amount, usage_unit, cost_amount, billing_period)
SELECT 
    'demo-business',
    'whatsapp-ai-responder',
    (SELECT id FROM agent_installations WHERE agent_id = 'whatsapp-ai-responder' AND business_id = 'demo-business'),
    'message_sent',
    1,
    'messages',
    0, -- Subscription model, no per-message cost
    DATE_TRUNC('month', CURRENT_DATE);