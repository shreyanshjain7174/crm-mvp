-- Integrations Database Schema
-- Migration: 013_integrations_schema.sql

-- User Integrations Table
-- Stores user connections to third-party services
CREATE TABLE IF NOT EXISTS user_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    integration_id VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'connected', 'disabled', 'error')),
    config JSONB NOT NULL DEFAULT '{}',
    settings JSONB NOT NULL DEFAULT '{}',
    access_token VARCHAR(500),
    refresh_token VARCHAR(500),
    token_expires_at TIMESTAMP WITH TIME ZONE,
    connected_at TIMESTAMP WITH TIME ZONE,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(50) DEFAULT 'idle' CHECK (sync_status IN ('idle', 'syncing', 'success', 'error')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one integration per user
    UNIQUE(user_id, integration_id)
);

-- Integration Logs Table
-- Audit trail for integration activities
CREATE TABLE IF NOT EXISTS integration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    integration_id VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL, -- 'connect', 'disconnect', 'sync', 'import', 'update', 'error'
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'error')),
    details JSONB,
    error_message TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Integration Data Sync Table
-- Tracks data synchronization between CRM and external services
CREATE TABLE IF NOT EXISTS integration_syncs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    integration_id VARCHAR(100) NOT NULL,
    sync_type VARCHAR(100) NOT NULL, -- 'contacts', 'messages', 'calendar', 'emails'
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('import', 'export', 'bidirectional')),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    total_records INTEGER DEFAULT 0,
    processed_records INTEGER DEFAULT 0,
    successful_records INTEGER DEFAULT 0,
    failed_records INTEGER DEFAULT 0,
    sync_data JSONB,
    error_details JSONB,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    next_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Integration Webhooks Table
-- Manages webhook endpoints for real-time data updates
CREATE TABLE IF NOT EXISTS integration_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    integration_id VARCHAR(100) NOT NULL,
    webhook_url TEXT NOT NULL,
    secret_token VARCHAR(255),
    event_types JSONB NOT NULL, -- Array of subscribed event types
    is_active BOOLEAN DEFAULT true,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    total_triggers INTEGER DEFAULT 0,
    failed_triggers INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Integration Webhook Deliveries Table
-- Log of webhook delivery attempts
CREATE TABLE IF NOT EXISTS integration_webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID NOT NULL REFERENCES integration_webhooks(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    http_status INTEGER,
    response_body TEXT,
    response_headers JSONB,
    delivery_duration_ms INTEGER,
    attempt_number INTEGER DEFAULT 1,
    max_attempts INTEGER DEFAULT 3,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed', 'retrying')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE
);

-- Integration OAuth Tokens Table
-- Secure storage for OAuth tokens (encrypted in production)
CREATE TABLE IF NOT EXISTS integration_oauth_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_integration_id UUID NOT NULL REFERENCES user_integrations(id) ON DELETE CASCADE,
    provider VARCHAR(100) NOT NULL, -- 'google', 'microsoft', 'facebook', etc.
    access_token_hash VARCHAR(255), -- Hashed token for security
    refresh_token_hash VARCHAR(255),
    token_type VARCHAR(50) DEFAULT 'Bearer',
    scope VARCHAR(500),
    expires_at TIMESTAMP WITH TIME ZONE,
    refresh_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Integration Rate Limits Table
-- Track API usage and enforce rate limits
CREATE TABLE IF NOT EXISTS integration_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    integration_id VARCHAR(100) NOT NULL,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    requests_made INTEGER DEFAULT 0,
    requests_limit INTEGER NOT NULL,
    data_transferred_mb INTEGER DEFAULT 0,
    data_limit_mb INTEGER,
    cost_cents INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent overlapping periods
    UNIQUE(user_id, integration_id, period_start)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_integrations_user_id ON user_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_integrations_status ON user_integrations(status);
CREATE INDEX IF NOT EXISTS idx_user_integrations_integration_id ON user_integrations(integration_id);

CREATE INDEX IF NOT EXISTS idx_integration_logs_user_id ON integration_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_integration_logs_integration_id ON integration_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_logs_created_at ON integration_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_integration_logs_action ON integration_logs(action);

CREATE INDEX IF NOT EXISTS idx_integration_syncs_user_id ON integration_syncs(user_id);
CREATE INDEX IF NOT EXISTS idx_integration_syncs_status ON integration_syncs(status);
CREATE INDEX IF NOT EXISTS idx_integration_syncs_next_sync ON integration_syncs(next_sync_at);

CREATE INDEX IF NOT EXISTS idx_integration_webhooks_user_id ON integration_webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_integration_webhooks_active ON integration_webhooks(is_active);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON integration_webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON integration_webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created_at ON integration_webhook_deliveries(created_at);

CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user_integration ON integration_oauth_tokens(user_integration_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_expires_at ON integration_oauth_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_rate_limits_user_integration ON integration_rate_limits(user_id, integration_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_period ON integration_rate_limits(period_start, period_end);

-- Add comments to document the schema
COMMENT ON TABLE user_integrations IS 'User connections to third-party services and their configuration';
COMMENT ON TABLE integration_logs IS 'Audit trail of all integration activities and operations';
COMMENT ON TABLE integration_syncs IS 'Data synchronization jobs between CRM and external services';
COMMENT ON TABLE integration_webhooks IS 'Webhook endpoints for real-time data updates from external services';
COMMENT ON TABLE integration_webhook_deliveries IS 'Log of webhook delivery attempts and their outcomes';
COMMENT ON TABLE integration_oauth_tokens IS 'Secure storage for OAuth access and refresh tokens';
COMMENT ON TABLE integration_rate_limits IS 'API usage tracking and rate limiting for external services';

-- Sample data for development (optional)
-- This would be removed in production
-- Keeping integrations clean by default
-- INSERT INTO user_integrations (user_id, integration_id, status, config, connected_at) 
-- SELECT 
--     id as user_id,
--     'whatsapp' as integration_id,
--     'connected' as status,
--     '{"phone_number_id": "demo_phone", "access_token": "demo_token"}' as config,
--     NOW() as connected_at
-- FROM users 
-- WHERE email = 'demo@example.com'
-- ON CONFLICT (user_id, integration_id) DO NOTHING;