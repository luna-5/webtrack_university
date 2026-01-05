/*
  # Allow Users to View Team Courses Based on Default Team

  ## Overview
  This migration adds an additional RLS policy that allows users to view team courses
  based on their default_team_id in the profiles table, not just through team_members.
  This provides a fallback for users who have selected a team but haven't been added
  to team_members yet.

  ## Changes
  
  1. Add SELECT policy for team_courses
     - Users can view team_courses if the team_id matches their default_team_id in profiles
     - This supplements the existing policy that checks team_members
  
  ## Security
  - Users can only view courses for their assigned default team
  - Does not grant any write permissions
  - Existing policies remain unchanged
*/

-- Allow users to view team courses based on their default_team_id in profiles
CREATE POLICY "Users can view team courses for their default team"
  ON team_courses
  FOR SELECT
  TO authenticated
  USING (
    team_id IN (
      SELECT default_team_id 
      FROM profiles 
      WHERE id = auth.uid() 
      AND default_team_id IS NOT NULL
    )
  );
