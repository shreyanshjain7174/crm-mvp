-- Agent Runtime & Sandbox System Schema
-- This migration creates the core tables for agent management, sandboxing, and runtime execution

-- Agent Registry: All available agents in the marketplace
CREATE TABLE agent_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id VARCHAR(255) UNIQUE NOT NULL, -- e.g., 'whatsapp-auto-responder'
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    provider_name VARCHAR(255) NOT NULL,
    provider_website VARCHAR(500),
    provider_support VARCHAR(500),
    
    -- Description & Metadata
    description TEXT NOT NULL,
    long_description TEXT,
    icon_url VARCHAR(500),
    screenshots TEXT[], -- Array of image URLs
    
    -- Capabilities & Category
    capabilities TEXT[] NOT NULL, -- Array of capability strings
    category VARCHAR(50) NOT NULL CHECK (category IN ('communication', 'sales', 'marketing', 'analytics', 'data', 'automation', 'other')),
    tags TEXT[],
    
    -- Permissions & Requirements
    permissions TEXT[] NOT NULL, -- Array of permission strings like 'contacts:read'
    dependencies TEXT[],
    minimum_crm_version VARCHAR(50),
    
    -- Commercial Information
    pricing_model VARCHAR(20) NOT NULL CHECK (pricing_model IN ('free', 'fixed', 'usage-based', 'tiered', 'freemium')),
    pricing_data JSONB NOT NULL, -- Stores pricing details based on model
    terms_url VARCHAR(500),
    privacy_url VARCHAR(500),
    
    -- Marketplace Metadata
    rating DECIMAL(2,1) DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,
    install_count INTEGER DEFAULT 0,
    featured BOOLEAN DEFAULT FALSE,
    trending BOOLEAN DEFAULT FALSE,
    
    -- Technical Configuration
    runtime VARCHAR(20) NOT NULL CHECK (runtime IN ('nodejs', 'browser', 'external')),
    endpoints JSONB, -- webhook, api, websocket URLs
    config_schema JSONB, -- Configuration form schema
    
    -- Status & Tracking
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'deprecated', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    CONSTRAINT unique_agent_version UNIQUE (agent_id, version)
);

-- Installed Agents: Agents installed by businesses
CREATE TABLE installed_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    agent_id VARCHAR(255) NOT NULL, -- References agent_registry.agent_id
    instance_name VARCHAR(255), -- Optional custom name for this instance
    
    -- Installation Details
    installed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    installed_version VARCHAR(50) NOT NULL,
    installer_user_id UUID,
    
    -- Runtime Status
    status VARCHAR(20) DEFAULT 'installing' CHECK (status IN ('installing', 'active', 'paused', 'error', 'uninstalling')),
    last_active_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    
    -- Configuration
    config JSONB DEFAULT '{}',
    permissions_granted TEXT[] NOT NULL,
    
    -- Resource Usage Tracking
    resource_limits JSONB, -- Memory, CPU, storage limits
    last_resource_check TIMESTAMP WITH TIME ZONE,
    
    -- Audit Trail
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_business_agent UNIQUE (business_id, agent_id),
    CONSTRAINT fk_agent_registry FOREIGN KEY (agent_id) REFERENCES agent_registry(agent_id) ON DELETE CASCADE
);

-- Agent Runtime Sessions: Active execution sessions
CREATE TABLE agent_runtime_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    installed_agent_id UUID NOT NULL REFERENCES installed_agents(id) ON DELETE CASCADE,
    
    -- Session Details
    session_token VARCHAR(255) UNIQUE NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'starting' CHECK (status IN ('starting', 'running', 'paused', 'stopping', 'crashed')),
    
    -- Process Information
    process_id VARCHAR(100), -- External process ID if applicable
    worker_node VARCHAR(255), -- Which worker node is running this
    
    -- Resource Usage
    memory_usage_mb INTEGER DEFAULT 0,
    cpu_usage_percent DECIMAL(5,2) DEFAULT 0.0,
    api_calls_count INTEGER DEFAULT 0,
    api_calls_last_minute INTEGER DEFAULT 0,
    
    -- Error Tracking
    error_count INTEGER DEFAULT 0,
    last_error TEXT,
    last_error_at TIMESTAMP WITH TIME ZONE,
    
    -- Performance Metrics
    events_processed INTEGER DEFAULT 0,
    avg_response_time_ms INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 100.0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent Events: Communication between CRM and agents
CREATE TABLE agent_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    installed_agent_id UUID REFERENCES installed_agents(id) ON DELETE CASCADE,
    
    -- Event Details
    event_type VARCHAR(100) NOT NULL, -- 'contact.created', 'message.received', etc.
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('to_agent', 'from_agent')),
    
    -- Event Data
    event_data JSONB NOT NULL,
    correlation_id UUID, -- Link related events
    
    -- Processing Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retry')),
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Performance Tracking
    processing_time_ms INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    INDEX idx_agent_events_business_type (business_id, event_type),
    INDEX idx_agent_events_status (status),
    INDEX idx_agent_events_created (created_at)
);

-- Agent Permissions: Track granular permissions for each installed agent
CREATE TABLE agent_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    installed_agent_id UUID NOT NULL REFERENCES installed_agents(id) ON DELETE CASCADE,
    
    -- Permission Details
    permission VARCHAR(100) NOT NULL, -- 'contacts:read', 'messages:write', etc.
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    granted_by_user_id UUID,
    
    -- Usage Tracking
    last_used_at TIMESTAMP WITH TIME ZONE,
    usage_count INTEGER DEFAULT 0,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_agent_permission UNIQUE (installed_agent_id, permission)
);

-- Agent Audit Log: Complete audit trail of all agent actions
CREATE TABLE agent_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    installed_agent_id UUID REFERENCES installed_agents(id) ON DELETE SET NULL,
    user_id UUID, -- User who triggered the action, if applicable
    
    -- Action Details
    action VARCHAR(100) NOT NULL, -- 'install', 'uninstall', 'start', 'stop', 'data_access', etc.
    resource_type VARCHAR(50), -- 'contact', 'message', 'lead', etc.
    resource_id UUID, -- ID of the resource being accessed
    
    -- Request Details
    permission_used VARCHAR(100), -- Which permission was used
    request_data JSONB, -- Request payload (sanitized)
    response_data JSONB, -- Response data (sanitized)
    
    -- Status & Error Tracking
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failure', 'denied')),
    error_code VARCHAR(50),
    error_message TEXT,
    
    -- Performance & Security
    ip_address INET,
    user_agent TEXT,
    execution_time_ms INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for auditing and monitoring
    INDEX idx_audit_business_action (business_id, action),
    INDEX idx_audit_agent_action (installed_agent_id, action),
    INDEX idx_audit_created (created_at),
    INDEX idx_audit_status (status)
);

-- Agent Resource Usage: Track resource consumption for billing and limits
CREATE TABLE agent_resource_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    installed_agent_id UUID NOT NULL REFERENCES installed_agents(id) ON DELETE CASCADE,
    
    -- Time Period
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Resource Metrics
    cpu_seconds_used DECIMAL(10,2) DEFAULT 0.0,
    memory_mb_hours DECIMAL(10,2) DEFAULT 0.0,
    storage_mb_used INTEGER DEFAULT 0,
    api_calls_made INTEGER DEFAULT 0,
    events_processed INTEGER DEFAULT 0,
    
    -- Data Transfer
    data_in_bytes BIGINT DEFAULT 0,
    data_out_bytes BIGINT DEFAULT 0,
    
    -- Billing Information
    billable_units DECIMAL(10,4) DEFAULT 0.0,
    cost_usd DECIMAL(10,4) DEFAULT 0.0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure no overlapping periods for same agent
    CONSTRAINT unique_agent_period UNIQUE (installed_agent_id, period_start)
);

-- Create indexes for performance
CREATE INDEX idx_agent_registry_category ON agent_registry(category);
CREATE INDEX idx_agent_registry_featured ON agent_registry(featured) WHERE featured = TRUE;
CREATE INDEX idx_agent_registry_trending ON agent_registry(trending) WHERE trending = TRUE;

CREATE INDEX idx_installed_agents_business ON installed_agents(business_id);
CREATE INDEX idx_installed_agents_status ON installed_agents(status);
CREATE INDEX idx_installed_agents_active ON installed_agents(business_id, status) WHERE status = 'active';

CREATE INDEX idx_runtime_sessions_status ON agent_runtime_sessions(status);
CREATE INDEX idx_runtime_sessions_heartbeat ON agent_runtime_sessions(last_heartbeat);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_agent_registry_updated_at BEFORE UPDATE ON agent_registry FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_installed_agents_updated_at BEFORE UPDATE ON installed_agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_runtime_sessions_updated_at BEFORE UPDATE ON agent_runtime_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();