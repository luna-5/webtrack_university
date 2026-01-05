/*
  # Allow Self Role Assignment for New Members

  ## Overview
  This migration adds a policy that allows authenticated users to insert their own
  role as 'member' when joining a team. This enables the self-service team joining flow.

  ## Security Changes
  - Add INSERT policy on `user_roles` table for self-assignment as member only
  - Users can only set their own role and only to 'member' (not team_leader or system_user)
*/

-- Allow users to insert their own role as 'member'
CREATE POLICY "Users can set own member role"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    role = 'member'
  );