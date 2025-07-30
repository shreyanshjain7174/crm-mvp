-- Create team members table for multi-user CRM organizations
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL, -- FK to organizations table (to be created)
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  department VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  permissions JSONB DEFAULT '{}'::jsonb,
  avatar_url TEXT,
  hired_date DATE,
  last_active_at TIMESTAMP,
  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMP DEFAULT NOW(),
  joined_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(organization_id, email),
  CHECK (role IN ('owner', 'admin', 'manager', 'member', 'viewer')),
  CHECK (status IN ('active', 'inactive', 'pending', 'suspended'))
);

-- Create organizations table for multi-tenant support
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  plan VARCHAR(50) DEFAULT 'free',
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(domain)
);

-- Create default organization for existing users
INSERT INTO organizations (id, name, plan) 
SELECT gen_random_uuid(), 'Default Organization', 'free'
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Default Organization');

-- Add organization_id to users table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'organization_id') THEN
    ALTER TABLE users ADD COLUMN organization_id UUID REFERENCES organizations(id);
    
    -- Assign existing users to default organization
    UPDATE users SET organization_id = (SELECT id FROM organizations WHERE name = 'Default Organization' LIMIT 1);
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_members_organization_id ON team_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON team_members(role);
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);

-- Add team member for existing users (as owners)
INSERT INTO team_members (organization_id, user_id, email, name, role, status, joined_at)
SELECT 
  u.organization_id,
  u.id,
  u.email,
  u.name,
  'owner',
  'active',
  u.created_at
FROM users u
WHERE u.organization_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM team_members tm 
  WHERE tm.user_id = u.id
);

-- Update trigger for team_members
CREATE OR REPLACE FUNCTION update_team_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_team_members_updated_at();

-- Update trigger for organizations
CREATE OR REPLACE FUNCTION update_organizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_organizations_updated_at();