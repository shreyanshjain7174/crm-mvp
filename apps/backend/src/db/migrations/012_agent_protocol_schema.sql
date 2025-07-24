-- Universal Agent Protocol Database Schema
-- Migration: 012_agent_protocol_schema.sql

-- Agent Sessions Table
-- Tracks active connections between agents and the platform
CREATE TABLE IF NOT EXISTS agent_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_installation_id UUID NOT NULL REFERENCES agent_installations(id) ON DELETE CASCADE,
    instance_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error')),
    manifest JSONB,
    metrics JSONB,
    connected_at TIMESTAMP WITH TIME ZONE,
    disconnected_at TIMESTAMP WITH TIME ZONE,
    last_heartbeat TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one session per agent instance
    UNIQUE(agent_installation_id, instance_id)
);

-- Agent Data Queue Table
-- Temporary storage for data being sent to agents
CREATE TABLE IF NOT EXISTS agent_data_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_installation_id UUID NOT NULL REFERENCES agent_installations(id) ON DELETE CASCADE,
    instance_id VARCHAR(255) NOT NULL,
    data_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed', 'expired')),
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT
);

-- Agent Event Subscriptions Table
-- Tracks which events each agent is subscribed to
CREATE TABLE IF NOT EXISTS agent_event_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_installation_id UUID NOT NULL REFERENCES agent_installations(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    filters JSONB,
    webhook_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate subscriptions
    UNIQUE(agent_installation_id, event_type)
);

-- Agent Protocol Events Table
-- Log of all events sent/received through the protocol
CREATE TABLE IF NOT EXISTS agent_protocol_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_installation_id UUID REFERENCES agent_installations(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    payload JSONB NOT NULL,
    source VARCHAR(100),
    destination VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed')),
    response_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT
);

-- Agent Synchronization Status Table
-- Tracks data sync status between agents and CRM
CREATE TABLE IF NOT EXISTS agent_sync_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_installation_id UUID NOT NULL REFERENCES agent_installations(id) ON DELETE CASCADE,
    entity_type VARCHAR(100) NOT NULL, -- 'contacts', 'messages', 'leads', etc.
    entity_id UUID,
    sync_direction VARCHAR(20) NOT NULL CHECK (sync_direction IN ('to_agent', 'from_agent', 'bidirectional')),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'syncing', 'synced', 'conflict', 'failed')),
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_data JSONB,
    conflict_data JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent Registry Table
-- Stores agent capabilities and manifests
CREATE TABLE IF NOT EXISTS agent_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    provider VARCHAR(255) NOT NULL,
    description TEXT,
    manifest JSONB NOT NULL,
    capabilities JSONB NOT NULL,
    requirements JSONB,
    ui_components JSONB,
    webhook_endpoints JSONB,
    api_schema JSONB,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deprecated', 'maintenance', 'disabled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    
    -- Ensure unique agent versions
    UNIQUE(agent_id, version)
);

-- Agent Permissions Table
-- Granular permission system for agents
CREATE TABLE IF NOT EXISTS agent_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_installation_id UUID NOT NULL REFERENCES agent_installations(id) ON DELETE CASCADE,
    permission_type VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100), -- 'contacts', 'messages', 'leads', etc.
    resource_id UUID,
    allowed_actions JSONB NOT NULL, -- ['read', 'write', 'delete', etc.]
    conditions JSONB, -- Additional permission conditions
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    
    -- Prevent duplicate permissions
    UNIQUE(agent_installation_id, permission_type, resource_type, resource_id)
);

-- Agent Webhooks Table
-- Webhook endpoints registered by agents
CREATE TABLE IF NOT EXISTS agent_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_installation_id UUID NOT NULL REFERENCES agent_installations(id) ON DELETE CASCADE,
    webhook_url TEXT NOT NULL,
    event_types JSONB NOT NULL, -- Array of event types to receive
    secret_token VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    last_delivery_at TIMESTAMP WITH TIME ZONE,
    total_deliveries INTEGER DEFAULT 0,
    failed_deliveries INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent Webhook Deliveries Table
-- Log of webhook delivery attempts
CREATE TABLE IF NOT EXISTS agent_webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID NOT NULL REFERENCES agent_webhooks(id) ON DELETE CASCADE,
    event_id UUID REFERENCES agent_protocol_events(id),
    url TEXT NOT NULL,
    http_method VARCHAR(10) DEFAULT 'POST',
    headers JSONB,
    payload JSONB NOT NULL,
    response_status INTEGER,
    response_body TEXT,
    response_headers JSONB,
    delivery_duration_ms INTEGER,
    attempt_number INTEGER DEFAULT 1,
    max_attempts INTEGER DEFAULT 3,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed', 'retrying')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT
);

-- Agent Resource Usage Table
-- Track resource consumption for billing and limits
CREATE TABLE IF NOT EXISTS agent_resource_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_installation_id UUID NOT NULL REFERENCES agent_installations(id) ON DELETE CASCADE,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cpu_seconds INTEGER DEFAULT 0,
    memory_mb_hours INTEGER DEFAULT 0,
    storage_mb INTEGER DEFAULT 0,
    api_calls INTEGER DEFAULT 0,
    webhook_deliveries INTEGER DEFAULT 0,
    data_transfer_mb INTEGER DEFAULT 0,
    cost_calculation JSONB,
    total_cost_cents INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate periods
    UNIQUE(agent_installation_id, period_start, period_end)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_sessions_installation_id ON agent_sessions(agent_installation_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_instance_id ON agent_sessions(instance_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_status ON agent_sessions(status);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_last_heartbeat ON agent_sessions(last_heartbeat);

CREATE INDEX IF NOT EXISTS idx_agent_data_queue_installation_id ON agent_data_queue(agent_installation_id);
CREATE INDEX IF NOT EXISTS idx_agent_data_queue_status ON agent_data_queue(status);
CREATE INDEX IF NOT EXISTS idx_agent_data_queue_expires_at ON agent_data_queue(expires_at);

CREATE INDEX IF NOT EXISTS idx_agent_protocol_events_installation_id ON agent_protocol_events(agent_installation_id);
CREATE INDEX IF NOT EXISTS idx_agent_protocol_events_type ON agent_protocol_events(event_type);
CREATE INDEX IF NOT EXISTS idx_agent_protocol_events_direction ON agent_protocol_events(direction);
CREATE INDEX IF NOT EXISTS idx_agent_protocol_events_created_at ON agent_protocol_events(created_at);

CREATE INDEX IF NOT EXISTS idx_agent_sync_status_installation_id ON agent_sync_status(agent_installation_id);
CREATE INDEX IF NOT EXISTS idx_agent_sync_status_entity ON agent_sync_status(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_agent_sync_status_status ON agent_sync_status(status);

CREATE INDEX IF NOT EXISTS idx_agent_registry_agent_id ON agent_registry(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_registry_status ON agent_registry(status);

CREATE INDEX IF NOT EXISTS idx_agent_permissions_installation_id ON agent_permissions(agent_installation_id);
CREATE INDEX IF NOT EXISTS idx_agent_permissions_resource ON agent_permissions(resource_type, resource_id);

CREATE INDEX IF NOT EXISTS idx_agent_webhooks_installation_id ON agent_webhooks(agent_installation_id);
CREATE INDEX IF NOT EXISTS idx_agent_webhooks_active ON agent_webhooks(is_active);

CREATE INDEX IF NOT EXISTS idx_agent_webhook_deliveries_webhook_id ON agent_webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_agent_webhook_deliveries_status ON agent_webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_agent_webhook_deliveries_created_at ON agent_webhook_deliveries(created_at);

CREATE INDEX IF NOT EXISTS idx_agent_resource_usage_installation_id ON agent_resource_usage(agent_installation_id);
CREATE INDEX IF NOT EXISTS idx_agent_resource_usage_period ON agent_resource_usage(period_start, period_end);

-- Add comments to document the schema
COMMENT ON TABLE agent_sessions IS 'Active agent connections and heartbeat tracking';
COMMENT ON TABLE agent_data_queue IS 'Temporary queue for data exchange between agents and platform';
COMMENT ON TABLE agent_event_subscriptions IS 'Event subscriptions for real-time agent notifications';
COMMENT ON TABLE agent_protocol_events IS 'Complete audit log of all agent protocol communications';
COMMENT ON TABLE agent_sync_status IS 'Data synchronization status between agents and CRM entities';
COMMENT ON TABLE agent_registry IS 'Central registry of all available agent types and capabilities';
COMMENT ON TABLE agent_permissions IS 'Granular permission system for agent access control';
COMMENT ON TABLE agent_webhooks IS 'Webhook endpoints registered by agents for event notifications';
COMMENT ON TABLE agent_webhook_deliveries IS 'Delivery log and retry tracking for webhook notifications';
COMMENT ON TABLE agent_resource_usage IS 'Resource consumption tracking for billing and rate limiting';

-- Update existing agent_installations table if needed
-- Add protocol-specific columns
DO $$ 
BEGIN
    -- Add protocol version support
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'agent_installations' AND column_name = 'protocol_version') THEN
        ALTER TABLE agent_installations ADD COLUMN protocol_version VARCHAR(20) DEFAULT '1.0.0';
    END IF;
    
    -- Add API endpoint configuration
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'agent_installations' AND column_name = 'api_endpoints') THEN
        ALTER TABLE agent_installations ADD COLUMN api_endpoints JSONB;
    END IF;
    
    -- Add sandbox configuration
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'agent_installations' AND column_name = 'sandbox_config') THEN
        ALTER TABLE agent_installations ADD COLUMN sandbox_config JSONB;
    END IF;
END $$;