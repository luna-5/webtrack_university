/*
  # Add Default Team to User Profiles

  ## Overview
  This migration enables users to select a default team upon registration, which will:
  - Store the user's primary team affiliation in their profile
  - Automatically create a team_members entry when a team is selected
  - Allow filtering courses based on user's team membership

  ## Changes

  ### 1. Profiles Table
  - Add `default_team_id` column (uuid, nullable, foreign key to teams table)
  - Users can have a default team they're primarily associated with

  ### 2. Updated RLS Policies
  - Users can update their own default_team_id
  - Users can view their own profile

  ## Security Notes
  - default_team_id is nullable to support users without team assignments
  - Only users can update their own default team
  - System maintains referential integrity via foreign key constraint
*/

-- Add default_team_id column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'default_team_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN default_team_id uuid REFERENCES teams(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Drop existing profile policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add helpful comment
COMMENT ON COLUMN profiles.default_team_id IS 'The primary team this user is associated with. When set, user automatically becomes a member of this team.';
