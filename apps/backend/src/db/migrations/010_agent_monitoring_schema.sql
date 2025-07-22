-- Agent Monitoring Schema Migration
-- Creates tables for agent health checks, performance metrics, task executions, and alerts

-- Agent Health Checks
CREATE TABLE IF NOT EXISTS agent_health_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id VARCHAR(100) NOT NULL,
    connectivity VARCHAR(20) NOT NULL CHECK (connectivity IN ('pass', 'fail', 'warning')),
    authentication VARCHAR(20) NOT NULL CHECK (authentication IN ('pass', 'fail', 'warning')),
    dependencies VARCHAR(20) NOT NULL CHECK (dependencies IN ('pass', 'fail', 'warning')),
    performance VARCHAR(20) NOT NULL CHECK (performance IN ('pass', 'fail', 'warning')),
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Agent Performance Metrics
CREATE TABLE IF NOT EXISTS agent_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id VARCHAR(100) NOT NULL,
    business_id VARCHAR(100) NOT NULL,
    success_rate DECIMAL(5,2) DEFAULT 0,
    avg_response_time INTEGER DEFAULT 0, -- in milliseconds
    tasks_completed INTEGER DEFAULT 0,
    tasks_per_minute DECIMAL(8,2) DEFAULT 0,
    error_rate DECIMAL(5,2) DEFAULT 0,
    uptime DECIMAL(5,2) DEFAULT 0, -- percentage
    resource_usage JSONB DEFAULT '{}', -- CPU, memory, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Agent Task Executions
CREATE TABLE IF NOT EXISTS agent_task_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id VARCHAR(100) NOT NULL,
    agent_id VARCHAR(100) NOT NULL,
    task_type VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    duration INTEGER, -- in milliseconds
    input JSONB DEFAULT '{}',
    output JSONB DEFAULT '{}',
    error TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Agent Alerts
CREATE TABLE IF NOT EXISTS agent_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id VARCHAR(100) NOT NULL,
    agent_id VARCHAR(100) NOT NULL,
    alert_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    message TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_health_checks_agent_id ON agent_health_checks(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_health_checks_created_at ON agent_health_checks(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_performance_metrics_agent_id ON agent_performance_metrics(agent_id, business_id);
CREATE INDEX IF NOT EXISTS idx_agent_performance_metrics_created_at ON agent_performance_metrics(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_task_executions_agent_id ON agent_task_executions(agent_id, business_id);
CREATE INDEX IF NOT EXISTS idx_agent_task_executions_status ON agent_task_executions(status);
CREATE INDEX IF NOT EXISTS idx_agent_task_executions_start_time ON agent_task_executions(start_time DESC);

CREATE INDEX IF NOT EXISTS idx_agent_alerts_business_id ON agent_alerts(business_id);
CREATE INDEX IF NOT EXISTS idx_agent_alerts_agent_id ON agent_alerts(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_alerts_resolved ON agent_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_agent_alerts_created_at ON agent_alerts(created_at DESC);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_agent_health_checks_updated_at ON agent_health_checks;
CREATE TRIGGER update_agent_health_checks_updated_at
    BEFORE UPDATE ON agent_health_checks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_agent_performance_metrics_updated_at ON agent_performance_metrics;
CREATE TRIGGER update_agent_performance_metrics_updated_at
    BEFORE UPDATE ON agent_performance_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_agent_task_executions_updated_at ON agent_task_executions;
CREATE TRIGGER update_agent_task_executions_updated_at
    BEFORE UPDATE ON agent_task_executions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_agent_alerts_updated_at ON agent_alerts;
CREATE TRIGGER update_agent_alerts_updated_at
    BEFORE UPDATE ON agent_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();