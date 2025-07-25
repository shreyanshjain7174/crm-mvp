-- Create achievements tables for CRM functionality

-- User achievements tracking
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id VARCHAR(100) NOT NULL,
  achievement_name VARCHAR(255) NOT NULL,
  achievement_description TEXT,
  achievement_category VARCHAR(50) NOT NULL,
  achievement_rarity VARCHAR(20) NOT NULL CHECK (achievement_rarity IN ('common', 'rare', 'epic', 'legendary')),
  points INTEGER NOT NULL DEFAULT 0,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- User progress stats tracking
CREATE TABLE IF NOT EXISTS user_progress_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stat_name VARCHAR(100) NOT NULL,
  stat_value INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, stat_name)
);

-- User stage progression
CREATE TABLE IF NOT EXISTS user_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_stage INTEGER NOT NULL DEFAULT 1,
  stage_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Achievement definitions (reference data)
CREATE TABLE IF NOT EXISTS achievement_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  achievement_id VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  rarity VARCHAR(20) NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  points INTEGER NOT NULL DEFAULT 0,
  requirements JSONB DEFAULT '[]',
  icon VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_category ON user_achievements(achievement_category);
CREATE INDEX IF NOT EXISTS idx_user_achievements_rarity ON user_achievements(achievement_rarity);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked_at ON user_achievements(unlocked_at);

CREATE INDEX IF NOT EXISTS idx_user_progress_stats_user_id ON user_progress_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_stats_stat_name ON user_progress_stats(stat_name);

CREATE INDEX IF NOT EXISTS idx_user_stages_user_id ON user_stages(user_id);

CREATE INDEX IF NOT EXISTS idx_achievement_definitions_achievement_id ON achievement_definitions(achievement_id);
CREATE INDEX IF NOT EXISTS idx_achievement_definitions_category ON achievement_definitions(category);
CREATE INDEX IF NOT EXISTS idx_achievement_definitions_rarity ON achievement_definitions(rarity);

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_achievements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_achievements_updated_at
  BEFORE UPDATE ON user_achievements
  FOR EACH ROW
  EXECUTE FUNCTION update_achievements_updated_at();

CREATE TRIGGER trigger_user_progress_stats_updated_at
  BEFORE UPDATE ON user_progress_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_achievements_updated_at();

CREATE TRIGGER trigger_user_stages_updated_at
  BEFORE UPDATE ON user_stages
  FOR EACH ROW
  EXECUTE FUNCTION update_achievements_updated_at();

CREATE TRIGGER trigger_achievement_definitions_updated_at
  BEFORE UPDATE ON achievement_definitions
  FOR EACH ROW
  EXECUTE FUNCTION update_achievements_updated_at();

-- Insert sample achievement definitions
INSERT INTO achievement_definitions (achievement_id, name, description, category, rarity, points, requirements) VALUES
('first-lead', 'First Lead', 'Add your first lead to the CRM', 'milestone', 'common', 10, '[{"type": "stat", "condition": "totalLeads >= 1"}]'),
('lead-master-10', 'Lead Master', 'Manage 10 leads in your CRM', 'milestone', 'common', 25, '[{"type": "stat", "condition": "totalLeads >= 10"}]'),
('lead-champion-50', 'Lead Champion', 'Reach 50 leads in your pipeline', 'milestone', 'rare', 100, '[{"type": "stat", "condition": "totalLeads >= 50"}]'),
('lead-legend-100', 'Lead Legend', 'Accumulate 100 leads', 'milestone', 'epic', 250, '[{"type": "stat", "condition": "totalLeads >= 100"}]'),
('lead-deity-500', 'Lead Deity', 'Manage an empire of 500 leads', 'milestone', 'legendary', 1000, '[{"type": "stat", "condition": "totalLeads >= 500"}]'),

('first-contact', 'First Contact', 'Add your first contact', 'milestone', 'common', 10, '[{"type": "stat", "condition": "totalContacts >= 1"}]'),
('contact-collector-25', 'Contact Collector', 'Build a network of 25 contacts', 'milestone', 'common', 50, '[{"type": "stat", "condition": "totalContacts >= 25"}]'),
('network-builder-100', 'Network Builder', 'Expand to 100 contacts', 'milestone', 'rare', 150, '[{"type": "stat", "condition": "totalContacts >= 100"}]'),

('first-message', 'First Message', 'Send your first message through the CRM', 'milestone', 'common', 5, '[{"type": "stat", "condition": "totalMessages >= 1"}]'),
('communicator-100', 'Active Communicator', 'Send 100 messages', 'milestone', 'common', 75, '[{"type": "stat", "condition": "totalMessages >= 100"}]'),
('message-master-500', 'Message Master', 'Exchange 500 messages', 'milestone', 'rare', 200, '[{"type": "stat", "condition": "totalMessages >= 500"}]'),

('ai-explorer', 'AI Explorer', 'Use AI assistance for the first time', 'feature', 'common', 15, '[{"type": "stat", "condition": "aiResponsesUsed >= 1"}]'),
('ai-enthusiast', 'AI Enthusiast', 'Use AI assistance 50 times', 'feature', 'rare', 100, '[{"type": "stat", "condition": "aiResponsesUsed >= 50"}]'),
('ai-master', 'AI Master', 'Harness AI power 200 times', 'feature', 'epic', 300, '[{"type": "stat", "condition": "aiResponsesUsed >= 200"}]'),

('pipeline-pro', 'Pipeline Pro', 'Use the pipeline view to manage leads', 'feature', 'common', 20, '[{"type": "feature", "condition": "pipeline:view"}]'),
('automation-ace', 'Automation Ace', 'Set up your first automation workflow', 'feature', 'rare', 150, '[{"type": "feature", "condition": "automation:create"}]'),
('integration-expert', 'Integration Expert', 'Connect external integrations', 'feature', 'rare', 125, '[{"type": "feature", "condition": "integrations:connect"}]'),

('daily-user', 'Daily User', 'Use the CRM for 7 consecutive days', 'usage', 'common', 30, '[{"type": "stat", "condition": "daysActive >= 7"}]'),
('week-warrior', 'Week Warrior', 'Stay active for 30 days', 'usage', 'rare', 100, '[{"type": "stat", "condition": "daysActive >= 30"}]'),
('month-master', 'Month Master', 'Maintain a 100-day streak', 'usage', 'epic', 500, '[{"type": "stat", "condition": "daysActive >= 100"}]'),

('speed-demon', 'Speed Demon', 'Respond to a message within 5 minutes', 'efficiency', 'common', 25, '[{"type": "stat", "condition": "fastResponses >= 1"}]'),
('quick-draw', 'Quick Draw', 'Make 10 rapid responses', 'efficiency', 'rare', 75, '[{"type": "stat", "condition": "fastResponses >= 10"}]'),
('efficiency-expert', 'Efficiency Expert', 'Achieve 50 quick responses', 'efficiency', 'epic', 200, '[{"type": "stat", "condition": "fastResponses >= 50"}]')

ON CONFLICT (achievement_id) DO NOTHING;