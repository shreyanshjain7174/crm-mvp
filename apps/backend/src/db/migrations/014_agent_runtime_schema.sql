-- Agent Runtime Database Schema
-- Migration: 014_agent_runtime_schema.sql

-- Agent Executions Table
-- Tracks all agent execution instances and their results
CREATE TABLE IF NOT EXISTS agent_executions (
    id VARCHAR(100) PRIMARY KEY,
    agent_id VARCHAR(100) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'timeout', 'stopped')),
    trigger_type VARCHAR(50) NOT NULL DEFAULT 'manual' CHECK (trigger_type IN ('manual', 'schedule', 'webhook', 'event')),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    execution_duration_ms INTEGER GENERATED ALWAYS AS (
        CASE 
            WHEN end_time IS NOT NULL THEN EXTRACT(EPOCH FROM (end_time - start_time)) * 1000
            ELSE NULL
        END
    ) STORED,
    input JSONB,
    output JSONB,
    error TEXT,
    resource_usage JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent Runtime Sessions Table
-- Tracks active agent sessions and their sandboxes
CREATE TABLE IF NOT EXISTS agent_runtime_sessions (
    id VARCHAR(100) PRIMARY KEY,
    agent_id VARCHAR(100) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sandbox_id VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'idle', 'terminated', 'error')),
    resource_limits JSONB NOT NULL,
    permissions JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    terminated_at TIMESTAMP WITH TIME ZONE,
    
    -- Cleanup sessions after 24 hours of inactivity
    CONSTRAINT valid_session_duration CHECK (
        terminated_at IS NULL OR 
        terminated_at > created_at
    )
);

-- Agent Resource Usage Table
-- Detailed tracking of resource consumption for billing and monitoring
CREATE TABLE IF NOT EXISTS agent_resource_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id VARCHAR(100) REFERENCES agent_executions(id) ON DELETE CASCADE,
    session_id VARCHAR(100) REFERENCES agent_runtime_sessions(id) ON DELETE CASCADE,
    agent_id VARCHAR(100) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource_type VARCHAR(50) NOT NULL, -- 'cpu', 'memory', 'api_calls', 'storage', 'network'
    usage_amount DECIMAL(10,2) NOT NULL, -- Amount used (e.g., 150.5 MB, 2.3 seconds, 45 calls)
    usage_unit VARCHAR(20) NOT NULL, -- 'MB', 'seconds', 'calls', 'bytes'
    cost_cents INTEGER DEFAULT 0, -- Cost in cents for billing
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    billing_period DATE GENERATED ALWAYS AS (DATE(recorded_at)) STORED
);

-- Agent Error Logs Table
-- Detailed error tracking and debugging information
CREATE TABLE IF NOT EXISTS agent_error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id VARCHAR(100) REFERENCES agent_executions(id) ON DELETE CASCADE,
    agent_id VARCHAR(100) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    error_type VARCHAR(100) NOT NULL, -- 'syntax_error', 'runtime_error', 'permission_denied', 'timeout', 'resource_limit'
    error_message TEXT NOT NULL,
    error_stack TEXT,
    error_context JSONB, -- Additional context like line number, variable values, etc.
    severity VARCHAR(20) NOT NULL DEFAULT 'error' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent Performance Metrics Table
-- Performance tracking for optimization and monitoring
CREATE TABLE IF NOT EXISTS agent_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id VARCHAR(100) REFERENCES agent_executions(id) ON DELETE CASCADE,
    agent_id VARCHAR(100) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL, -- 'execution_time', 'memory_peak', 'api_calls_count', 'sandbox_startup_time'
    metric_value DECIMAL(15,4) NOT NULL,
    metric_unit VARCHAR(20) NOT NULL, -- 'ms', 'MB', 'count', 'percentage'
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Composite index for efficient queries
    UNIQUE(execution_id, metric_name)
);

-- Agent Sandbox Events Table
-- Real-time events from sandbox execution for monitoring
CREATE TABLE IF NOT EXISTS agent_sandbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(100) REFERENCES agent_runtime_sessions(id) ON DELETE CASCADE,
    execution_id VARCHAR(100) REFERENCES agent_executions(id) ON DELETE SET NULL,
    agent_id VARCHAR(100) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL, -- 'sandbox_created', 'code_executed', 'api_called', 'error_occurred', 'resource_warning'
    event_data JSONB NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent Billing Summary Table (for optimization)
-- Pre-aggregated billing data for faster reporting
CREATE TABLE IF NOT EXISTS agent_billing_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agent_id VARCHAR(100) NOT NULL,
    billing_period DATE NOT NULL,
    total_executions INTEGER DEFAULT 0,
    total_execution_time_ms BIGINT DEFAULT 0,
    total_memory_usage_mb DECIMAL(10,2) DEFAULT 0,
    total_api_calls INTEGER DEFAULT 0,
    total_cost_cents INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one summary per user/agent/period
    UNIQUE(user_id, agent_id, billing_period)
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_agent_executions_user_agent ON agent_executions(user_id, agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_executions_status ON agent_executions(status);
CREATE INDEX IF NOT EXISTS idx_agent_executions_start_time ON agent_executions(start_time);
CREATE INDEX IF NOT EXISTS idx_agent_executions_session ON agent_executions(session_id);

CREATE INDEX IF NOT EXISTS idx_agent_runtime_sessions_user ON agent_runtime_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_runtime_sessions_agent ON agent_runtime_sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_runtime_sessions_status ON agent_runtime_sessions(status);
CREATE INDEX IF NOT EXISTS idx_agent_runtime_sessions_last_activity ON agent_runtime_sessions(last_activity_at);

CREATE INDEX IF NOT EXISTS idx_agent_resource_usage_user ON agent_resource_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_resource_usage_execution ON agent_resource_usage(execution_id);
CREATE INDEX IF NOT EXISTS idx_agent_resource_usage_billing_period ON agent_resource_usage(billing_period);
CREATE INDEX IF NOT EXISTS idx_agent_resource_usage_type ON agent_resource_usage(resource_type);

CREATE INDEX IF NOT EXISTS idx_agent_error_logs_user ON agent_error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_error_logs_agent ON agent_error_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_error_logs_execution ON agent_error_logs(execution_id);
CREATE INDEX IF NOT EXISTS idx_agent_error_logs_type ON agent_error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_agent_error_logs_created_at ON agent_error_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_agent_performance_metrics_execution ON agent_performance_metrics(execution_id);
CREATE INDEX IF NOT EXISTS idx_agent_performance_metrics_agent ON agent_performance_metrics(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_performance_metrics_name ON agent_performance_metrics(metric_name);

CREATE INDEX IF NOT EXISTS idx_agent_sandbox_events_session ON agent_sandbox_events(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_sandbox_events_execution ON agent_sandbox_events(execution_id);
CREATE INDEX IF NOT EXISTS idx_agent_sandbox_events_agent ON agent_sandbox_events(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_sandbox_events_type ON agent_sandbox_events(event_type);
CREATE INDEX IF NOT EXISTS idx_agent_sandbox_events_created_at ON agent_sandbox_events(created_at);

CREATE INDEX IF NOT EXISTS idx_agent_billing_summary_user ON agent_billing_summary(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_billing_summary_period ON agent_billing_summary(billing_period);
CREATE INDEX IF NOT EXISTS idx_agent_billing_summary_agent ON agent_billing_summary(agent_id);

-- Functions for automatic resource usage aggregation
CREATE OR REPLACE FUNCTION update_agent_billing_summary()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO agent_billing_summary (
        user_id, agent_id, billing_period, 
        total_executions, total_execution_time_ms, total_memory_usage_mb, 
        total_api_calls, total_cost_cents, updated_at
    )
    SELECT 
        NEW.user_id,
        NEW.agent_id,
        NEW.billing_period,
        1, -- execution count
        CASE WHEN NEW.resource_type = 'cpu' THEN NEW.usage_amount::BIGINT ELSE 0 END,
        CASE WHEN NEW.resource_type = 'memory' THEN NEW.usage_amount ELSE 0 END,
        CASE WHEN NEW.resource_type = 'api_calls' THEN NEW.usage_amount::INTEGER ELSE 0 END,
        NEW.cost_cents,
        NOW()
    ON CONFLICT (user_id, agent_id, billing_period) DO UPDATE SET
        total_executions = agent_billing_summary.total_executions + 1,
        total_execution_time_ms = agent_billing_summary.total_execution_time_ms + 
            CASE WHEN NEW.resource_type = 'cpu' THEN NEW.usage_amount::BIGINT ELSE 0 END,
        total_memory_usage_mb = agent_billing_summary.total_memory_usage_mb + 
            CASE WHEN NEW.resource_type = 'memory' THEN NEW.usage_amount ELSE 0 END,
        total_api_calls = agent_billing_summary.total_api_calls + 
            CASE WHEN NEW.resource_type = 'api_calls' THEN NEW.usage_amount::INTEGER ELSE 0 END,
        total_cost_cents = agent_billing_summary.total_cost_cents + NEW.cost_cents,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update billing summary
CREATE TRIGGER trigger_update_agent_billing_summary
    AFTER INSERT ON agent_resource_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_billing_summary();

-- Function to cleanup old sessions
CREATE OR REPLACE FUNCTION cleanup_inactive_agent_sessions()
RETURNS INTEGER AS $$
DECLARE
    cleaned_count INTEGER;
BEGIN
    -- Mark sessions as terminated if inactive for more than 1 hour
    UPDATE agent_runtime_sessions 
    SET status = 'terminated', terminated_at = NOW()
    WHERE status IN ('active', 'idle') 
    AND last_activity_at < NOW() - INTERVAL '1 hour'
    AND terminated_at IS NULL;
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    
    -- Delete old terminated sessions (older than 24 hours)
    DELETE FROM agent_runtime_sessions 
    WHERE status = 'terminated' 
    AND terminated_at < NOW() - INTERVAL '24 hours';
    
    RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql;

-- Add table comments for documentation
COMMENT ON TABLE agent_executions IS 'Tracks all agent execution instances and their results';
COMMENT ON TABLE agent_runtime_sessions IS 'Active agent sessions and their sandbox environments';
COMMENT ON TABLE agent_resource_usage IS 'Detailed resource consumption tracking for billing';
COMMENT ON TABLE agent_error_logs IS 'Comprehensive error logging for debugging and monitoring';
COMMENT ON TABLE agent_performance_metrics IS 'Performance metrics for optimization';
COMMENT ON TABLE agent_sandbox_events IS 'Real-time events from sandbox execution';
COMMENT ON TABLE agent_billing_summary IS 'Pre-aggregated billing data for reporting';

-- Sample data for development/testing
INSERT INTO agent_executions (
    id, agent_id, user_id, session_id, status, trigger_type, 
    start_time, end_time, input, output, resource_usage
) 
SELECT 
    'exec_demo_' || generate_random_uuid()::text,
    'agent_crm_assistant',
    id as user_id,
    'session_demo_' || generate_random_uuid()::text,
    'completed',
    'manual',
    NOW() - INTERVAL '1 hour',
    NOW() - INTERVAL '45 minutes',
    '{"action": "analyze_leads", "filters": {"status": "hot"}}',
    '{"analyzed_leads": 5, "recommendations": ["Follow up with lead #1", "Send proposal to lead #3"]}',
    '{"executionTime": 15000, "memoryUsed": 45.2, "apiCallsMade": 8}'
FROM users 
WHERE email = 'demo@example.com'
ON CONFLICT (id) DO NOTHING;