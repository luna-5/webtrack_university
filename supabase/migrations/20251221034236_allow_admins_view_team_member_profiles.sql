/*
  # Allow Admins and Team Leaders to View Team Member Profiles

  ## Overview
  This migration adds RLS policies that allow system users and team leaders
  to view profiles of team members. This enables the team management UI to
  display member names and emails.

  ## Security Changes
  1. System users can view all profiles
  2. Team leaders can view profiles of users in their teams
*/

-- System users can view all profiles
CREATE POLICY "System users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_system_user(auth.uid()));

-- Team leaders can view profiles of their team members
CREATE POLICY "Team leaders can view team member profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = profiles.id
      AND is_team_leader_of(auth.uid(), tm.team_id)
    )
  );