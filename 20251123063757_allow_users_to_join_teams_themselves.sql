/*
  # Allow Users to Join Teams

  ## Overview
  This migration adds a new RLS policy that allows users to add themselves to teams.
  This is necessary for the team selection flow during onboarding.

  ## Changes
  
  1. Add INSERT policy for team_members
     - Users can insert a team_member record for themselves
     - They can only set their own user_id (not someone else's)
  
  ## Security
  - Users can only add themselves, not other users
  - The WITH CHECK ensures user_id matches the authenticated user
  - Existing policies for system users and team leaders remain unchanged
*/

-- Allow users to add themselves to teams
CREATE POLICY "Users can join teams themselves"
  ON team_members
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
