/*
  # Add Course Visibility and Team Course Access Control

  ## Overview
  This migration adds public/private course visibility control to manage course access:
  - Public courses: Any authenticated user can view and enroll
  - Private courses: Only team members can view and enroll (via team_courses table)
  - System users: Can view and enroll in any course regardless of visibility

  ## Changes

  ### 1. Courses Table
  - Add `is_public` column (boolean, default false) to mark courses as public or private

  ### 2. Team Courses Table
  - No structural changes needed - existing table already links courses to teams

  ## Updated RLS Policies
  
  ### Courses Table Policies
  - System users can view all courses (unchanged)
  - All authenticated users can view public courses (new)
  - Team leaders can view courses assigned to their teams (unchanged)
  - Members can view courses assigned to their teams (unchanged)

  ### Enrollments Table Policies
  - Users can enroll in public courses (new)
  - Users can enroll in private courses only if they're team members (updated)
  - System users can enroll in any course (implicit through course access)

  ## Security Notes
  - is_public defaults to false for security (courses are private by default)
  - RLS ensures private courses are only accessible to authorized team members
  - System users maintain full access regardless of visibility settings
*/

-- Add is_public column to courses table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE courses ADD COLUMN is_public boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Drop existing course RLS policies
DROP POLICY IF EXISTS "System users can view all courses" ON courses;
DROP POLICY IF EXISTS "Team leaders can view their team courses" ON courses;
DROP POLICY IF EXISTS "Members can view their team courses" ON courses;

-- Create new comprehensive RLS policies for courses
CREATE POLICY "System users can view all courses"
  ON courses FOR SELECT
  TO authenticated
  USING (is_system_user(auth.uid()));

CREATE POLICY "All users can view public courses"
  ON courses FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Team leaders can view their team courses"
  ON courses FOR SELECT
  TO authenticated
  USING (
    EXISTS(
      SELECT 1 FROM team_courses tc
      WHERE tc.course_id = courses.id
      AND is_team_leader_of(auth.uid(), tc.team_id)
    )
  );

CREATE POLICY "Members can view their team courses"
  ON courses FOR SELECT
  TO authenticated
  USING (
    EXISTS(
      SELECT 1 FROM team_courses tc
      WHERE tc.course_id = courses.id
      AND is_member_of(auth.uid(), tc.team_id)
    )
  );

-- Drop and recreate enrollment policies with public/private logic
DROP POLICY IF EXISTS "Members can enroll in their team courses" ON enrollments;

CREATE POLICY "Users can enroll in public courses"
  ON enrollments FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS(
      SELECT 1 FROM courses
      WHERE courses.id = enrollments.course_id
      AND courses.is_public = true
    )
  );

CREATE POLICY "Members can enroll in private team courses"
  ON enrollments FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS(
      SELECT 1 FROM courses
      INNER JOIN team_courses tc ON tc.course_id = courses.id
      WHERE courses.id = enrollments.course_id
      AND courses.is_public = false
      AND is_member_of(auth.uid(), tc.team_id)
    )
  );

CREATE POLICY "System users can enroll in any course"
  ON enrollments FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    is_system_user(auth.uid())
  );

-- Add helpful comment
COMMENT ON COLUMN courses.is_public IS 'When true, course is visible and enrollable by all users. When false, only team members can access.';
