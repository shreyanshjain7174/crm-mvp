-- Agent Marketplace Schema
-- This migration adds tables required for the agent marketplace functionality

-- Agent Reviews Table
CREATE TABLE IF NOT EXISTS agent_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id VARCHAR(255) NOT NULL,
    user_id UUID NOT NULL,
    business_id UUID NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    helpful_count INTEGER DEFAULT 0,
    verified_purchase BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one review per user per agent
    UNIQUE(agent_id, user_id),
    
    -- Foreign key to agent_registry
    FOREIGN KEY (agent_id) REFERENCES agent_registry(agent_id) ON DELETE CASCADE
);

-- Add indexes for performance
CREATE INDEX idx_agent_reviews_agent_id ON agent_reviews(agent_id);
CREATE INDEX idx_agent_reviews_rating ON agent_reviews(rating);
CREATE INDEX idx_agent_reviews_created_at ON agent_reviews(created_at DESC);

-- Add missing columns to agent_registry if they don't exist
DO $$ 
BEGIN
    -- Add status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'agent_registry' AND column_name = 'status') THEN
        ALTER TABLE agent_registry ADD COLUMN status VARCHAR(20) DEFAULT 'active' 
            CHECK (status IN ('active', 'inactive', 'deprecated', 'beta'));
    END IF;
    
    -- Add featured column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'agent_registry' AND column_name = 'featured') THEN
        ALTER TABLE agent_registry ADD COLUMN featured BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add featured_order column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'agent_registry' AND column_name = 'featured_order') THEN
        ALTER TABLE agent_registry ADD COLUMN featured_order INTEGER;
    END IF;
    
    -- Add provider_verified column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'agent_registry' AND column_name = 'provider_verified') THEN
        ALTER TABLE agent_registry ADD COLUMN provider_verified BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add verified column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'agent_registry' AND column_name = 'verified') THEN
        ALTER TABLE agent_registry ADD COLUMN verified BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add full_description column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'agent_registry' AND column_name = 'full_description') THEN
        ALTER TABLE agent_registry ADD COLUMN full_description TEXT;
    END IF;
    
    -- Add changelog column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'agent_registry' AND column_name = 'changelog') THEN
        ALTER TABLE agent_registry ADD COLUMN changelog TEXT;
    END IF;
    
    -- Add documentation column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'agent_registry' AND column_name = 'documentation') THEN
        ALTER TABLE agent_registry ADD COLUMN documentation TEXT;
    END IF;
    
    -- Add price column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'agent_registry' AND column_name = 'price') THEN
        ALTER TABLE agent_registry ADD COLUMN price DECIMAL(10,2);
    END IF;
    
    -- Add currency column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'agent_registry' AND column_name = 'currency') THEN
        ALTER TABLE agent_registry ADD COLUMN currency VARCHAR(3) DEFAULT 'INR';
    END IF;
    
    -- Add free_trial_days column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'agent_registry' AND column_name = 'free_trial_days') THEN
        ALTER TABLE agent_registry ADD COLUMN free_trial_days INTEGER;
    END IF;
END $$;

-- Agent Categories Table (for better category management)
CREATE TABLE IF NOT EXISTS agent_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    parent_category_id VARCHAR(50),
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT INTO agent_categories (category_id, name, description, icon, display_order) VALUES
    ('whatsapp', 'WhatsApp', 'Agents for WhatsApp automation and messaging', 'MessageSquare', 1),
    ('voice', 'Voice Agents', 'AI-powered voice call handling', 'Phone', 2),
    ('data', 'Data & Analytics', 'Data enrichment and analytics agents', 'BarChart3', 3),
    ('automation', 'Automation', 'Workflow and process automation', 'Zap', 4),
    ('lead-gen', 'Lead Generation', 'Lead capture and qualification', 'UserPlus', 5),
    ('support', 'Customer Support', 'Customer service automation', 'Headphones', 6)
ON CONFLICT (category_id) DO NOTHING;

-- Agent Install History (for tracking installations/uninstallations)
CREATE TABLE IF NOT EXISTS agent_install_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id VARCHAR(255) NOT NULL,
    business_id UUID NOT NULL,
    user_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('install', 'uninstall', 'upgrade', 'downgrade')),
    version VARCHAR(50),
    previous_version VARCHAR(50),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX idx_agent_install_history_agent_id ON agent_install_history(agent_id);
CREATE INDEX idx_agent_install_history_business_id ON agent_install_history(business_id);
CREATE INDEX idx_agent_install_history_created_at ON agent_install_history(created_at DESC);