/*
  # Create Teams and Roles System

  ## Overview
  This migration creates a comprehensive team-based access control system with three roles:
  - System User: Full access to all teams and courses
  - Team Leader: Manage assigned team(s) and their courses
  - Member: View and take courses within assigned team(s)

  ## New Tables
  
  ### `teams`
  - `id` (uuid, primary key)
  - `name` (text, unique) - Team name
  - `description` (text) - Team description
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `user_roles`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles) - User
  - `role` (text) - One of: system_user, team_leader, member
  - `created_at` (timestamptz)
  - Unique constraint on user_id (one role per user)

  ### `team_members`
  - `id` (uuid, primary key)
  - `team_id` (uuid, references teams)
  - `user_id` (uuid, references profiles)
  - `created_at` (timestamptz)
  - Unique constraint on (team_id, user_id)

  ### `team_courses`
  - `id` (uuid, primary key)
  - `team_id` (uuid, references teams)
  - `course_id` (uuid, references courses)
  - `created_at` (timestamptz)
  - Unique constraint on (team_id, course_id)

  ## Security
  - Enable RLS on all new tables
  - System users can access everything
  - Team leaders can manage their assigned teams
  - Members can only view courses in their teams
*/

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('system_user', 'team_leader', 'member')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Create team_courses table
CREATE TABLE IF NOT EXISTS team_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(team_id, course_id)
);

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_courses ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid uuid)
RETURNS text AS $$
  SELECT role FROM user_roles WHERE user_id = user_uuid;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function to check if user is system user
CREATE OR REPLACE FUNCTION is_system_user(user_uuid uuid)
RETURNS boolean AS $$
  SELECT EXISTS(
    SELECT 1 FROM user_roles 
    WHERE user_id = user_uuid AND role = 'system_user'
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function to check if user is team leader of a team
CREATE OR REPLACE FUNCTION is_team_leader_of(user_uuid uuid, team_uuid uuid)
RETURNS boolean AS $$
  SELECT EXISTS(
    SELECT 1 FROM user_roles ur
    INNER JOIN team_members tm ON tm.user_id = ur.user_id
    WHERE ur.user_id = user_uuid 
    AND ur.role = 'team_leader'
    AND tm.team_id = team_uuid
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function to check if user is member of a team
CREATE OR REPLACE FUNCTION is_member_of(user_uuid uuid, team_uuid uuid)
RETURNS boolean AS $$
  SELECT EXISTS(
    SELECT 1 FROM team_members 
    WHERE user_id = user_uuid AND team_id = team_uuid
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- RLS Policies for teams table
CREATE POLICY "System users can manage all teams"
  ON teams FOR ALL
  TO authenticated
  USING (is_system_user(auth.uid()));

CREATE POLICY "Team leaders can view their teams"
  ON teams FOR SELECT
  TO authenticated
  USING (
    is_team_leader_of(auth.uid(), id)
  );

CREATE POLICY "Members can view their teams"
  ON teams FOR SELECT
  TO authenticated
  USING (
    is_member_of(auth.uid(), id)
  );

-- RLS Policies for user_roles table
CREATE POLICY "System users can manage all roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (is_system_user(auth.uid()));

CREATE POLICY "Users can view their own role"
  ON user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Team leaders can view roles of their team members"
  ON user_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS(
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = user_roles.user_id
      AND is_team_leader_of(auth.uid(), tm.team_id)
    )
  );

-- RLS Policies for team_members table
CREATE POLICY "System users can manage all team members"
  ON team_members FOR ALL
  TO authenticated
  USING (is_system_user(auth.uid()));

CREATE POLICY "Team leaders can manage their team members"
  ON team_members FOR ALL
  TO authenticated
  USING (is_team_leader_of(auth.uid(), team_id));

CREATE POLICY "Members can view their team memberships"
  ON team_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for team_courses table
CREATE POLICY "System users can manage all team courses"
  ON team_courses FOR ALL
  TO authenticated
  USING (is_system_user(auth.uid()));

CREATE POLICY "Team leaders can manage their team courses"
  ON team_courses FOR ALL
  TO authenticated
  USING (is_team_leader_of(auth.uid(), team_id));

CREATE POLICY "Members can view their team courses"
  ON team_courses FOR SELECT
  TO authenticated
  USING (is_member_of(auth.uid(), team_id));

-- Update courses RLS policies to work with teams
DROP POLICY IF EXISTS "Anyone can view published courses" ON courses;

CREATE POLICY "System users can view all courses"
  ON courses FOR SELECT
  TO authenticated
  USING (is_system_user(auth.uid()));

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

-- Update enrollments RLS policies
DROP POLICY IF EXISTS "Users can view own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Users can create own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Users can update own enrollments" ON enrollments;

CREATE POLICY "Users can view own enrollments"
  ON enrollments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System users can view all enrollments"
  ON enrollments FOR SELECT
  TO authenticated
  USING (is_system_user(auth.uid()));

CREATE POLICY "Team leaders can view their team enrollments"
  ON enrollments FOR SELECT
  TO authenticated
  USING (
    EXISTS(
      SELECT 1 FROM team_courses tc
      INNER JOIN team_members tm ON tm.team_id = tc.team_id
      WHERE tc.course_id = enrollments.course_id
      AND tm.user_id = enrollments.user_id
      AND is_team_leader_of(auth.uid(), tc.team_id)
    )
  );

CREATE POLICY "Members can enroll in their team courses"
  ON enrollments FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS(
      SELECT 1 FROM team_courses tc
      WHERE tc.course_id = enrollments.course_id
      AND is_member_of(auth.uid(), tc.team_id)
    )
  );

CREATE POLICY "Users can update own enrollments"
  ON enrollments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
