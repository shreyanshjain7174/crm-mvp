-- Create user_settings table for storing user preferences
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- WhatsApp settings
  whatsapp_settings JSONB DEFAULT '{
    "businessPhone": "",
    "displayName": "CRM Business",
    "welcomeMessage": "Hi! Thanks for reaching out. We''ll get back to you shortly.",
    "businessAccountId": "",
    "phoneNumberId": "",
    "autoReply": true,
    "webhookStatus": true
  }'::jsonb,
  
  -- AI settings
  ai_settings JSONB DEFAULT '{
    "confidenceThreshold": 80,
    "responseTone": "friendly",
    "businessContext": "",
    "autoScoring": true,
    "autoSuggestions": true,
    "autoFollowup": false
  }'::jsonb,
  
  -- Notification settings
  notification_settings JSONB DEFAULT '{
    "email": {
      "newLeads": true,
      "whatsappMessages": true,
      "aiSuggestions": false
    },
    "push": {
      "urgentLeads": true,
      "followupReminders": true
    }
  }'::jsonb,
  
  -- Backup settings
  backup_settings JSONB DEFAULT '{
    "autoBackup": true,
    "includeMessages": true,
    "includeAIData": false,
    "frequency": "every6hours"
  }'::jsonb,
  
  -- Appearance settings
  appearance_settings JSONB DEFAULT '{
    "theme": "system",
    "primaryColor": "#3b82f6",
    "compactMode": false,
    "showAnimations": true,
    "highContrast": false
  }'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one settings row per user
  UNIQUE(user_id)
);

-- Create index for fast user lookups
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_settings_updated_at_trigger
BEFORE UPDATE ON user_settings
FOR EACH ROW
EXECUTE FUNCTION update_user_settings_updated_at();