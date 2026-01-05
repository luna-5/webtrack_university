/*
  # Add Course Management Policies
  
  ## Overview
  This migration adds INSERT, UPDATE, and DELETE policies for the courses table
  to allow authorized users to manage courses.
  
  ## Changes
  
  ### Courses Table Policies (New)
  1. **INSERT Policies**
     - System users can create any course
     - Team leaders can create courses for their teams
  
  2. **UPDATE Policies**
     - System users can update any course
     - Team leaders can update courses assigned to their teams
  
  3. **DELETE Policies**
     - System users can delete any course
     - Team leaders can delete courses assigned to their teams
  
  ## Security Notes
  - Only system users and team leaders can manage courses
  - Team leaders can only manage courses assigned to their teams
  - Members cannot create, update, or delete courses (read-only access)
  - All policies require authentication
*/

-- INSERT Policies for courses
CREATE POLICY "System users can create courses"
  ON courses FOR INSERT
  TO authenticated
  WITH CHECK (is_system_user(auth.uid()));

CREATE POLICY "Team leaders can create courses for their teams"
  ON courses FOR INSERT
  TO authenticated
  WITH CHECK (
    get_user_role(auth.uid()) = 'team_leader' AND
    (
      team_id IS NULL OR
      is_team_leader_of(auth.uid(), team_id)
    )
  );

-- UPDATE Policies for courses
CREATE POLICY "System users can update all courses"
  ON courses FOR UPDATE
  TO authenticated
  USING (is_system_user(auth.uid()))
  WITH CHECK (is_system_user(auth.uid()));

CREATE POLICY "Team leaders can update their team courses"
  ON courses FOR UPDATE
  TO authenticated
  USING (
    get_user_role(auth.uid()) = 'team_leader' AND
    team_id IS NOT NULL AND
    is_team_leader_of(auth.uid(), team_id)
  )
  WITH CHECK (
    get_user_role(auth.uid()) = 'team_leader' AND
    team_id IS NOT NULL AND
    is_team_leader_of(auth.uid(), team_id)
  );

-- DELETE Policies for courses
CREATE POLICY "System users can delete all courses"
  ON courses FOR DELETE
  TO authenticated
  USING (is_system_user(auth.uid()));

CREATE POLICY "Team leaders can delete their team courses"
  ON courses FOR DELETE
  TO authenticated
  USING (
    get_user_role(auth.uid()) = 'team_leader' AND
    team_id IS NOT NULL AND
    is_team_leader_of(auth.uid(), team_id)
  );
