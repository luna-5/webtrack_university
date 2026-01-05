/*
  # Allow Enrollment Based on Default Team

  ## Overview
  This migration adds an additional RLS policy that allows users to enroll in courses
  based on their default_team_id in the profiles table. This ensures users can enroll
  in their team's courses even if they haven't been explicitly added to team_members yet.

  ## Changes
  
  1. Add INSERT policy for enrollments
     - Users can enroll in private courses if the course is assigned to their default_team_id
     - Supplements the existing policy that checks team_members
  
  ## Security
  - Users can only enroll themselves (user_id must match auth.uid())
  - Users can only enroll in courses assigned to their default team
  - Does not affect other enrollment policies
*/

-- Allow users to enroll in courses assigned to their default team
CREATE POLICY "Users can enroll in their default team courses"
  ON enrollments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (user_id = auth.uid()) 
    AND 
    (EXISTS (
      SELECT 1
      FROM courses c
      JOIN team_courses tc ON tc.course_id = c.id
      JOIN profiles p ON p.id = auth.uid()
      WHERE c.id = enrollments.course_id
      AND c.is_public = false
      AND tc.team_id = p.default_team_id
      AND p.default_team_id IS NOT NULL
    ))
  );
