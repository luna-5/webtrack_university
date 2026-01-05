/*
  # Create Storage Bucket for Course Images

  1. New Storage Bucket
    - `course-images` - Public bucket for storing course cover images
  
  2. Security
    - Allow authenticated users to upload images
    - Allow public read access for course images
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('course-images', 'course-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view course images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'course-images');

CREATE POLICY "Authenticated users can upload course images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'course-images');

CREATE POLICY "Authenticated users can update their course images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'course-images');

CREATE POLICY "Authenticated users can delete course images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'course-images');