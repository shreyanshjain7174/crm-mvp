-- Create notifications tables for CRM functionality

-- User notifications
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  category VARCHAR(20) NOT NULL CHECK (category IN ('lead', 'message', 'ai', 'system', 'pipeline', 'contact', 'workflow', 'achievement')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  is_read BOOLEAN DEFAULT FALSE,
  is_starred BOOLEAN DEFAULT FALSE,
  action_required BOOLEAN DEFAULT FALSE,
  action_url VARCHAR(500),
  related_entity_type VARCHAR(50),
  related_entity_id VARCHAR(100),
  related_entity_name VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User notification preferences
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(20) NOT NULL,
  in_app_enabled BOOLEAN DEFAULT TRUE,
  email_enabled BOOLEAN DEFAULT FALSE,
  push_enabled BOOLEAN DEFAULT TRUE,
  desktop_enabled BOOLEAN DEFAULT TRUE,
  sound_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category)
);

-- Notification templates for system-generated notifications
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  category VARCHAR(20) NOT NULL,
  title_template VARCHAR(255) NOT NULL,
  message_template TEXT NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  action_required BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_type ON user_notifications(type);
CREATE INDEX IF NOT EXISTS idx_user_notifications_category ON user_notifications(category);
CREATE INDEX IF NOT EXISTS idx_user_notifications_priority ON user_notifications(priority);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON user_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_starred ON user_notifications(is_starred);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON user_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_notifications_expires_at ON user_notifications(expires_at);

CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id ON user_notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_category ON user_notification_preferences(category);

CREATE INDEX IF NOT EXISTS idx_notification_templates_template_key ON notification_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_notification_templates_category ON notification_templates(category);

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_notifications_updated_at
  BEFORE UPDATE ON user_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

CREATE TRIGGER trigger_user_notification_preferences_updated_at
  BEFORE UPDATE ON user_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

CREATE TRIGGER trigger_notification_templates_updated_at
  BEFORE UPDATE ON notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- Insert default notification templates
INSERT INTO notification_templates (template_key, name, type, category, title_template, message_template, priority, action_required) VALUES
('new_lead_added', 'New Lead Added', 'info', 'lead', 'New Lead Added', '{{leadName}} has been added as a new lead from {{source}}', 'medium', TRUE),
('message_received', 'New Message Received', 'info', 'message', 'New Message Received', 'Received message from {{contactName}}: "{{messageContent}}"', 'medium', TRUE),
('ai_response_generated', 'AI Response Generated', 'success', 'ai', 'AI Response Generated', 'AI has generated a response for {{contactName}}. Review and approve to send.', 'low', TRUE),
('ai_response_approved', 'AI Response Sent', 'success', 'ai', 'AI Response Approved', 'Your AI-generated response to {{contactName}} has been successfully sent', 'low', FALSE),
('lead_score_threshold', 'Lead Score Threshold Reached', 'warning', 'pipeline', 'Lead Score Threshold Reached', '{{leadName}} has reached a lead score of {{score}}. Consider moving to qualified stage.', 'high', TRUE),
('workflow_execution_failed', 'Workflow Execution Failed', 'error', 'workflow', 'Workflow Execution Failed', 'The "{{workflowName}}" workflow failed to execute: {{errorMessage}}', 'urgent', TRUE),
('lead_converted', 'Lead Converted', 'success', 'pipeline', 'Lead Converted', 'Congratulations! {{leadName}} has been successfully converted to a customer', 'medium', FALSE),
('system_maintenance', 'System Maintenance Scheduled', 'warning', 'system', 'System Maintenance Scheduled', 'Scheduled maintenance window: {{maintenanceWindow}}', 'medium', FALSE),
('achievement_unlocked', 'Achievement Unlocked', 'success', 'achievement', 'Achievement Unlocked', 'Congratulations! You have unlocked the "{{achievementName}}" achievement and earned {{points}} points!', 'low', FALSE),
('contact_added', 'New Contact Added', 'info', 'contact', 'New Contact Added', 'New contact {{contactName}} has been added to your CRM', 'low', FALSE)

ON CONFLICT (template_key) DO NOTHING;