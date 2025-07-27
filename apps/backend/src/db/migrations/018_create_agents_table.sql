-- Simple agents table for runtime service
-- This table stores agent manifests for individual users
-- Different from agent_installations which is for business-level agent deployments

CREATE TABLE IF NOT EXISTS agents (
    id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    description TEXT,
    author VARCHAR(255),
    manifest JSONB NOT NULL,
    permissions JSONB NOT NULL,
    resource_limits JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'installed' CHECK (status IN ('installed', 'active', 'paused', 'error')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    PRIMARY KEY (id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_agents_user_status ON agents(user_id, status);

-- Update trigger
CREATE OR REPLACE FUNCTION update_agents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW 
  EXECUTE FUNCTION update_agents_updated_at();

-- Comments
COMMENT ON TABLE agents IS 'Stores agent manifests for individual users (runtime service)';
COMMENT ON COLUMN agents.manifest IS 'Complete agent manifest including code and configuration';
COMMENT ON COLUMN agents.permissions IS 'Array of permissions granted to this agent';
COMMENT ON COLUMN agents.resource_limits IS 'Resource limits for agent execution';