/*
  # Add Image and Social Media Links to Events

  1. Changes to events table
    - Add `end_date` (timestamptz) - Optional end date/time for events
    - Add `image_url` (text) - Event cover image URL
    - Add `facebook_url` (text) - Facebook event/page link
    - Add `instagram_url` (text) - Instagram post/profile link
    - Add `twitter_url` (text) - Twitter/X post link
    - Add `whatsapp_url` (text) - WhatsApp group/channel link
    - Add `other_url` (text) - Any other relevant link

  2. Notes
    - All new fields are optional
    - end_date allows for multi-day or time-ranged events
    - Social media links help promote events across platforms
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE events ADD COLUMN end_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE events ADD COLUMN image_url text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'facebook_url'
  ) THEN
    ALTER TABLE events ADD COLUMN facebook_url text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'instagram_url'
  ) THEN
    ALTER TABLE events ADD COLUMN instagram_url text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'twitter_url'
  ) THEN
    ALTER TABLE events ADD COLUMN twitter_url text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'whatsapp_url'
  ) THEN
    ALTER TABLE events ADD COLUMN whatsapp_url text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'other_url'
  ) THEN
    ALTER TABLE events ADD COLUMN other_url text DEFAULT '';
  END IF;
END $$;