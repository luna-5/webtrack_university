/*
  # Create Allowed Teams Authorization System

  ## Overview
  This migration creates a system to control which teams users are authorized to join.
  Only system users and team leaders can grant team access to users.

  ## Changes

  ### 1. New Tables
  - `allowed_teams` table
    - Links users to teams they're authorized to join
    - Users can only select from their allowed teams during onboarding
    - Created by system users or team leaders

  ### 2. RLS Policies
  - Users can view their own allowed teams
  - System users can manage all allowed team entries
  - Team leaders can manage allowed teams for their own teams

  ## Security Notes
  - Prevents unauthorized team selection
  - Only administrators can grant team access
  - RLS enforces proper access control
  - Users without allowed teams cannot proceed (must contact admin)
*/

-- Create allowed_teams table
CREATE TABLE IF NOT EXISTS allowed_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  granted_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, team_id)
);

-- Enable RLS
ALTER TABLE allowed_teams ENABLE ROW LEVEL SECURITY;

-- Users can view their own allowed teams
CREATE POLICY "Users can view own allowed teams"
  ON allowed_teams FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- System users can view all allowed teams
CREATE POLICY "System users can view all allowed teams"
  ON allowed_teams FOR SELECT
  TO authenticated
  USING (is_system_user(auth.uid()));

-- System users can insert allowed teams
CREATE POLICY "System users can insert allowed teams"
  ON allowed_teams FOR INSERT
  TO authenticated
  WITH CHECK (is_system_user(auth.uid()));

-- Team leaders can insert allowed teams for their teams
CREATE POLICY "Team leaders can insert allowed teams for their teams"
  ON allowed_teams FOR INSERT
  TO authenticated
  WITH CHECK (
    is_team_leader_of(auth.uid(), team_id)
  );

-- System users can delete allowed teams
CREATE POLICY "System users can delete allowed teams"
  ON allowed_teams FOR DELETE
  TO authenticated
  USING (is_system_user(auth.uid()));

-- Team leaders can delete allowed teams for their teams
CREATE POLICY "Team leaders can delete allowed teams for their teams"
  ON allowed_teams FOR DELETE
  TO authenticated
  USING (
    is_team_leader_of(auth.uid(), team_id)
  );

-- Add helpful comments
COMMENT ON TABLE allowed_teams IS 'Controls which teams users are authorized to join. Users can only select from teams listed here during onboarding.';
COMMENT ON COLUMN allowed_teams.user_id IS 'The user who is authorized to join the team';
COMMENT ON COLUMN allowed_teams.team_id IS 'The team the user is authorized to join';
COMMENT ON COLUMN allowed_teams.granted_by IS 'The user who granted this authorization (system user or team leader)';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_allowed_teams_user_id ON allowed_teams(user_id);
CREATE INDEX IF NOT EXISTS idx_allowed_teams_team_id ON allowed_teams(team_id);
