-- Migration: Add staff management and RBAC support
-- Adds columns for staff invitations, activity tracking, and permissions

-- Add staff management columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb;

-- Create role_permissions table for granular permission control
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'staff', 'kitchen', 'customer')),
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role, resource, action)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_invited_by ON users(invited_by);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON activity_log(action);
CREATE INDEX IF NOT EXISTS idx_activity_log_resource ON activity_log(resource);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);

-- Insert default role permissions
INSERT INTO role_permissions (role, resource, action) VALUES
-- Owner permissions (all)
('owner', '*', '*'),

-- Manager permissions
('manager', 'menu', 'view'),
('manager', 'menu', 'create'),
('manager', 'menu', 'edit'),
('manager', 'menu', 'delete'),
('manager', 'orders', 'view'),
('manager', 'orders', 'update_status'),
('manager', 'orders', 'cancel'),
('manager', 'analytics', 'view'),
('manager', 'customers', 'view'),
('manager', 'customers', 'manage'),
('manager', 'broadcasts', 'view'),
('manager', 'broadcasts', 'create'),
('manager', 'broadcasts', 'send'),
('manager', 'feedback', 'view'),
('manager', 'feedback', 'respond'),
('manager', 'birthday', 'view'),
('manager', 'birthday', 'configure'),
('manager', 'staff', 'view'),
('manager', 'floor_map', 'view'),
('manager', 'floor_map', 'manage'),

-- Staff permissions
('staff', 'orders', 'view'),
('staff', 'orders', 'update_status'),
('staff', 'menu', 'view'),
('staff', 'analytics', 'view_basic'),

-- Kitchen permissions
('kitchen', 'kitchen', 'view'),
('kitchen', 'kitchen', 'update_status'),

-- Customer permissions
('customer', 'menu', 'view'),
('customer', 'orders', 'create'),
('customer', 'orders', 'view_own'),
('customer', 'cart', 'manage'),
('customer', 'loyalty', 'view_own'),
('customer', 'feedback', 'create')
ON CONFLICT (role, resource, action) DO NOTHING;

-- Enable Row Level Security on role_permissions
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for role_permissions
CREATE POLICY "Users can view role permissions"
  ON role_permissions
  FOR SELECT
  USING (true);

CREATE POLICY "Only owners can manage role permissions"
  ON role_permissions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role = 'owner'
    )
  );

-- Update existing RLS policies to consider is_active
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

CREATE POLICY "Users can view own profile"
  ON users
  FOR SELECT
  USING (auth_user_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  USING (auth_user_id = auth.uid());

CREATE POLICY "Owners can view all users in their cafe"
  ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users AS owner_user
      WHERE owner_user.auth_user_id = auth.uid()
      AND owner_user.role = 'owner'
      AND owner_user.cafe_id = users.cafe_id
    )
  );

CREATE POLICY "Managers can view staff in their cafe"
  ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users AS manager_user
      WHERE manager_user.auth_user_id = auth.uid()
      AND manager_user.role IN ('owner', 'manager')
      AND manager_user.cafe_id = users.cafe_id
    )
  );

CREATE POLICY "Owners can manage staff in their cafe"
  ON users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users AS owner_user
      WHERE owner_user.auth_user_id = auth.uid()
      AND owner_user.role = 'owner'
      AND owner_user.cafe_id = users.cafe_id
    )
  );

-- Create function to check if user has permission
CREATE OR REPLACE FUNCTION user_has_permission(
  p_user_id UUID,
  p_resource TEXT,
  p_action TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
  v_has_permission BOOLEAN;
BEGIN
  -- Get user role
  SELECT role INTO v_role
  FROM users
  WHERE auth_user_id = p_user_id
  LIMIT 1;
  
  IF v_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if owner (has all permissions)
  IF v_role = 'owner' THEN
    RETURN TRUE;
  END IF;
  
  -- Check specific permission
  SELECT EXISTS (
    SELECT 1 FROM role_permissions
    WHERE role = v_role
    AND (resource = p_resource OR resource = '*')
    AND (action = p_action OR action = '*')
  ) INTO v_has_permission;
  
  RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_role TEXT;
  v_permissions JSONB;
BEGIN
  -- Get user role
  SELECT role INTO v_role
  FROM users
  WHERE auth_user_id = p_user_id
  LIMIT 1;
  
  IF v_role IS NULL THEN
    RETURN '{}'::jsonb;
  END IF;
  
  -- Get permissions for role
  SELECT jsonb_agg(jsonb_build_object('resource', resource, 'action', action))
  INTO v_permissions
  FROM role_permissions
  WHERE role = v_role;
  
  RETURN COALESCE(v_permissions, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON COLUMN users.invited_by IS 'User ID who invited this staff member';
COMMENT ON COLUMN users.is_active IS 'Whether the staff member is currently active';
COMMENT ON COLUMN users.permissions IS 'Custom permissions override (JSONB)';
COMMENT ON TABLE role_permissions IS 'Defines permissions for each role';
