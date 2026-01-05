/*
  # Remove Allowed Teams Restriction

  ## Overview
  This migration removes the allowed_teams table that was preventing users from seeing
  available teams during onboarding. The table will be kept for future use but team
  selection will show all teams to users without a team assignment.

  ## Changes
  
  1. Drop the allowed_teams table and its constraints
  
  ## Notes
  - Users without a team will now be able to see all available teams
  - Team admins can still manage team membership through the team management interface
*/

-- Drop the allowed_teams table
DROP TABLE IF EXISTS allowed_teams CASCADE;
