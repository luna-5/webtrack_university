/*
  # Add Lesson Management Policies
  
  ## Overview
  This migration adds INSERT, UPDATE, and DELETE policies for the lessons table
  to allow authorized users to manage lessons.
  
  ## Changes
  
  ### Lessons Table Policies (New)
  1. **INSERT Policies**
     - System users can create lessons for any course
     - Team leaders can create lessons for courses assigned to their teams
  
  2. **UPDATE Policies**
     - System users can update any lesson
     - Team leaders can update lessons for courses assigned to their teams
  
  3. **DELETE Policies**
     - System users can delete any lesson
     - Team leaders can delete lessons for courses assigned to their teams
  
  ## Security Notes
  - Only system users and team leaders can manage lessons
  - Team leaders can only manage lessons for courses assigned to their teams
  - Members cannot create, update, or delete lessons (read-only access)
  - All policies require authentication
*/

-- INSERT Policies for lessons
CREATE POLICY "System users can create lessons"
  ON lessons FOR INSERT
  TO authenticated
  WITH CHECK (
    is_system_user(auth.uid())
  );

CREATE POLICY "Team leaders can create lessons for their team courses"
  ON lessons FOR INSERT
  TO authenticated
  WITH CHECK (
    get_user_role(auth.uid()) = 'team_leader' AND
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = lessons.course_id
      AND courses.team_id IS NOT NULL
      AND is_team_leader_of(auth.uid(), courses.team_id)
    )
  );

-- UPDATE Policies for lessons
CREATE POLICY "System users can update all lessons"
  ON lessons FOR UPDATE
  TO authenticated
  USING (is_system_user(auth.uid()))
  WITH CHECK (is_system_user(auth.uid()));

CREATE POLICY "Team leaders can update lessons for their team courses"
  ON lessons FOR UPDATE
  TO authenticated
  USING (
    get_user_role(auth.uid()) = 'team_leader' AND
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = lessons.course_id
      AND courses.team_id IS NOT NULL
      AND is_team_leader_of(auth.uid(), courses.team_id)
    )
  )
  WITH CHECK (
    get_user_role(auth.uid()) = 'team_leader' AND
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = lessons.course_id
      AND courses.team_id IS NOT NULL
      AND is_team_leader_of(auth.uid(), courses.team_id)
    )
  );

-- DELETE Policies for lessons
CREATE POLICY "System users can delete all lessons"
  ON lessons FOR DELETE
  TO authenticated
  USING (is_system_user(auth.uid()));

CREATE POLICY "Team leaders can delete lessons for their team courses"
  ON lessons FOR DELETE
  TO authenticated
  USING (
    get_user_role(auth.uid()) = 'team_leader' AND
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = lessons.course_id
      AND courses.team_id IS NOT NULL
      AND is_team_leader_of(auth.uid(), courses.team_id)
    )
  );
