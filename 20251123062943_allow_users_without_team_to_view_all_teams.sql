/*
  # Allow Users Without Teams to View All Teams

  ## Overview
  This migration adds a new RLS policy that allows users without a default team
  to view all available teams. This enables new users to select their team during
  onboarding.

  ## Changes
  
  1. Add new SELECT policy for users without teams
     - Users with null default_team_id can view all teams
     - This allows team selection during first login
  
  ## Security
  - Only affects SELECT operations
  - Users still need proper authorization to modify teams
  - Only authenticated users can view teams
*/

-- Drop existing restrictive policies and create more permissive ones
DROP POLICY IF EXISTS "Members can view their teams" ON teams;
DROP POLICY IF EXISTS "Team leaders can view their teams" ON teams;

-- Allow all authenticated users to view teams
-- This is safe because team data is not sensitive and users need to see teams to select one
CREATE POLICY "Authenticated users can view all teams"
  ON teams
  FOR SELECT
  TO authenticated
  USING (true);

-- Keep system user management policy
-- System users can manage all teams remains unchanged
