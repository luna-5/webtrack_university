/*
  # Add Price Field to Events

  1. Changes to events table
    - Add `is_free` (boolean) - Indicates if the event is free (default: true)
    - Add `price` (numeric) - Event price amount (default: 0)
    - Add `currency` (text) - Currency code for the price (default: 'GTQ')

  2. Notes
    - When is_free is true, the price field is ignored
    - Price is stored as numeric for accurate decimal handling
    - Currency allows for international events with different currencies
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'is_free'
  ) THEN
    ALTER TABLE events ADD COLUMN is_free boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'price'
  ) THEN
    ALTER TABLE events ADD COLUMN price numeric(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'currency'
  ) THEN
    ALTER TABLE events ADD COLUMN currency text DEFAULT 'GTQ';
  END IF;
END $$;