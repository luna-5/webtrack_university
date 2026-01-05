/*
  # Update Team Leader Profile Viewing Policy

  ## Overview
  Updates the RLS policy for team leaders to view profiles based on
  profiles.default_team_id instead of the team_members table.

  ## Security Changes
  1. Drops old policy that used team_members table
  2. Creates new policy using profiles.default_team_id
*/

DROP POLICY IF EXISTS "Team leaders can view team member profiles" ON profiles;

CREATE POLICY "Team leaders can view team member profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    is_team_leader_of(auth.uid(), default_team_id)
  );