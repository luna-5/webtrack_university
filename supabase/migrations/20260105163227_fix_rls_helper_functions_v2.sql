/*
  # Fix RLS Helper Functions to Work Correctly in Policy Context
  
  ## Overview
  This migration fixes the helper functions used in RLS policies to ensure they can
  properly read from RLS-protected tables when evaluating policies.
  
  ## Changes
  1. Replace helper functions with improved versions that set search_path
  2. Ensure functions are STABLE for better query optimization
  3. Grant proper execute permissions
  
  ## Security Notes
  - Functions are SECURITY DEFINER but only return boolean authorization checks
  - No sensitive data is exposed, only authorization decisions
  - Functions are marked STABLE for better query optimization
*/

-- Replace get_user_role function
CREATE OR REPLACE FUNCTION get_user_role(user_uuid uuid)
RETURNS text 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM user_roles WHERE user_id = user_uuid LIMIT 1;
$$;

-- Replace is_system_user function
CREATE OR REPLACE FUNCTION is_system_user(user_uuid uuid)
RETURNS boolean 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM user_roles 
    WHERE user_id = user_uuid AND role = 'system_user'
  );
$$;

-- Replace is_team_leader_of function
CREATE OR REPLACE FUNCTION is_team_leader_of(user_uuid uuid, team_uuid uuid)
RETURNS boolean 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM user_roles ur
    INNER JOIN team_members tm ON tm.user_id = ur.user_id
    WHERE ur.user_id = user_uuid 
    AND ur.role = 'team_leader'
    AND tm.team_id = team_uuid
  );
$$;

-- Replace is_member_of function
CREATE OR REPLACE FUNCTION is_member_of(user_uuid uuid, team_uuid uuid)
RETURNS boolean 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM team_members 
    WHERE user_id = user_uuid AND team_id = team_uuid
  );
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_system_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_team_leader_of(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_member_of(uuid, uuid) TO authenticated;

-- Grant execute permissions to anon for read-only functions (if needed for public access)
GRANT EXECUTE ON FUNCTION is_system_user(uuid) TO anon;
GRANT EXECUTE ON FUNCTION is_team_leader_of(uuid, uuid) TO anon;
GRANT EXECUTE ON FUNCTION is_member_of(uuid, uuid) TO anon;
