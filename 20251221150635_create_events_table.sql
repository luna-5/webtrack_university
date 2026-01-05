/*
  # Create Events Table

  1. New Tables
    - `events`
      - `id` (uuid, primary key) - Unique event identifier
      - `team_id` (uuid, foreign key) - Team the event belongs to
      - `title` (text) - Event title
      - `description` (text) - Event description
      - `event_date` (timestamptz) - When the event occurs
      - `location` (text) - Event location (optional)
      - `created_by` (uuid, foreign key) - User who created the event
      - `created_at` (timestamptz) - When the event was created
      - `updated_at` (timestamptz) - When the event was last updated

  2. Security
    - Enable RLS on `events` table
    - All authenticated users can view events for their team
    - Only system_user and team_leader can create events
    - Only system_user and team_leader can update/delete events for their team

  3. Indexes
    - Index on team_id for faster queries
    - Index on event_date for sorting
*/

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  event_date timestamptz NOT NULL,
  location text DEFAULT '',
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS events_team_id_idx ON events(team_id);
CREATE INDEX IF NOT EXISTS events_event_date_idx ON events(event_date);

CREATE POLICY "Users can view events for their team"
  ON events FOR SELECT
  TO authenticated
  USING (
    team_id IN (
      SELECT default_team_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "System users and team leaders can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('system_user', 'team_leader')
    )
  );

CREATE POLICY "System users and team leaders can update events for their team"
  ON events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN profiles p ON p.id = ur.user_id
      WHERE ur.user_id = auth.uid()
      AND (
        ur.role = 'system_user'
        OR (ur.role = 'team_leader' AND p.default_team_id = events.team_id)
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN profiles p ON p.id = ur.user_id
      WHERE ur.user_id = auth.uid()
      AND (
        ur.role = 'system_user'
        OR (ur.role = 'team_leader' AND p.default_team_id = events.team_id)
      )
    )
  );

CREATE POLICY "System users and team leaders can delete events for their team"
  ON events FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN profiles p ON p.id = ur.user_id
      WHERE ur.user_id = auth.uid()
      AND (
        ur.role = 'system_user'
        OR (ur.role = 'team_leader' AND p.default_team_id = events.team_id)
      )
    )
  );

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();