/*
  # Add team_id column to courses table

  1. Changes
    - Add `team_id` column to courses table with foreign key reference to teams
    - Column is nullable to support existing courses without team assignment
    - Add index for faster queries by team

  2. Security
    - No RLS changes needed as existing policies handle course access
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'team_id'
  ) THEN
    ALTER TABLE courses ADD COLUMN team_id uuid REFERENCES teams(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_courses_team_id ON courses(team_id);
