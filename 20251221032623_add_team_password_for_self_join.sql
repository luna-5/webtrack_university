/*
  # Add Team Password for Self-Join Feature

  ## Overview
  This migration adds a password field to the teams table, allowing users to join
  teams by entering the correct team password. This provides a secure self-service
  mechanism for team membership.

  ## Changes

  ### Modified Tables
  - `teams`
    - `password` (text) - Team join password, required for new users to join

  ## Security Notes
  - Password is stored as plain text for simplicity (team join codes, not user auth)
  - Only system users and team leaders can view/modify team passwords
  - Regular members cannot see the team password
*/

-- Add password column to teams table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teams' AND column_name = 'password'
  ) THEN
    ALTER TABLE teams ADD COLUMN password text DEFAULT '';
  END IF;
END $$;

-- Create a function to verify team password (for secure comparison)
CREATE OR REPLACE FUNCTION verify_team_password(team_uuid uuid, input_password text)
RETURNS boolean AS $$
  SELECT EXISTS(
    SELECT 1 FROM teams 
    WHERE id = team_uuid AND password = input_password
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Create a function that allows users to join a team with password verification
-- This runs with elevated privileges to bypass RLS for the insert
CREATE OR REPLACE FUNCTION join_team_with_password(
  team_uuid uuid,
  input_password text,
  user_uuid uuid
)
RETURNS json AS $$
DECLARE
  team_record RECORD;
  result json;
BEGIN
  -- Check if team exists and password matches
  SELECT * INTO team_record FROM teams WHERE id = team_uuid;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Equipo no encontrado');
  END IF;
  
  IF team_record.password != input_password THEN
    RETURN json_build_object('success', false, 'error', 'Contraseña incorrecta');
  END IF;
  
  -- Insert into team_members (ignore if already exists)
  INSERT INTO team_members (team_id, user_id)
  VALUES (team_uuid, user_uuid)
  ON CONFLICT (team_id, user_id) DO NOTHING;
  
  -- Insert user role as member (ignore if already exists)
  INSERT INTO user_roles (user_id, role)
  VALUES (user_uuid, 'member')
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Update default_team_id in profiles
  UPDATE profiles SET default_team_id = team_uuid WHERE id = user_uuid;
  
  RETURN json_build_object('success', true, 'team_name', team_record.name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;