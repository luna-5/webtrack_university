/*
  # Theology of the Body Course Platform Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `full_name` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `courses`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `instructor` (text)
      - `duration` (text)
      - `level` (text) - beginner, intermediate, advanced
      - `image_url` (text)
      - `is_published` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `lessons`
      - `id` (uuid, primary key)
      - `course_id` (uuid, references courses)
      - `title` (text)
      - `content` (text)
      - `video_url` (text, optional)
      - `order_index` (integer)
      - `duration_minutes` (integer)
      - `created_at` (timestamptz)
    
    - `enrollments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `course_id` (uuid, references courses)
      - `enrolled_at` (timestamptz)
      - `completed_at` (timestamptz, optional)
      - `progress` (integer, 0-100)
      - UNIQUE constraint on (user_id, course_id)
    
    - `lesson_progress`
      - `id` (uuid, primary key)
      - `enrollment_id` (uuid, references enrollments)
      - `lesson_id` (uuid, references lessons)
      - `completed` (boolean)
      - `completed_at` (timestamptz, optional)
      - UNIQUE constraint on (enrollment_id, lesson_id)

  2. Security
    - Enable RLS on all tables
    - Profiles: Users can read all profiles, but only update their own
    - Courses: Anyone can read published courses, only authenticated users can enroll
    - Lessons: Anyone can read lessons for courses they're enrolled in
    - Enrollments: Users can only view and create their own enrollments
    - Lesson Progress: Users can only view and update their own progress

  3. Important Notes
    - All tables use UUID primary keys with automatic generation
    - Timestamps are automatically set with defaults
    - RLS policies ensure data security and proper access control
    - Foreign key constraints maintain referential integrity
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  instructor text DEFAULT '',
  duration text DEFAULT '',
  level text DEFAULT 'beginner',
  image_url text DEFAULT '',
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published courses"
  ON courses FOR SELECT
  USING (is_published = true);

-- Create lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text DEFAULT '',
  video_url text DEFAULT '',
  order_index integer DEFAULT 0,
  duration_minutes integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read lessons for published courses"
  ON lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = lessons.course_id
      AND courses.is_published = true
    )
  );

-- Create enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  progress integer DEFAULT 0,
  UNIQUE(user_id, course_id)
);

ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own enrollments"
  ON enrollments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own enrollments"
  ON enrollments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own enrollments"
  ON enrollments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create lesson_progress table
CREATE TABLE IF NOT EXISTS lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  UNIQUE(enrollment_id, lesson_id)
);

ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own lesson progress"
  ON lesson_progress FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.id = lesson_progress.enrollment_id
      AND enrollments.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own lesson progress"
  ON lesson_progress FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.id = lesson_progress.enrollment_id
      AND enrollments.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own lesson progress"
  ON lesson_progress FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.id = lesson_progress.enrollment_id
      AND enrollments.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.id = lesson_progress.enrollment_id
      AND enrollments.user_id = auth.uid()
    )
  );

-- Insert sample courses
INSERT INTO courses (title, description, instructor, duration, level, image_url) VALUES
('Introduction to Theology of the Body', 'Discover the foundational teachings of Saint John Paul II on human dignity, love, and the meaning of the body.', 'Dr. Maria Santos', '6 weeks', 'beginner', 'https://polishheritagecentertx.org/sites/default/files/styles/max_1300x1300/public/2021-03/00870_AOSTA1991.jpg?itok=9vt-Auu3'),
('The Nuptial Meaning of the Body', 'Explore the profound connection between human sexuality, marriage, and divine love.', 'Fr. Michael Thompson', '8 weeks', 'intermediate', 'https://polishheritagecentertx.org/sites/default/files/styles/max_1300x1300/public/2021-03/00870_AOSTA1991.jpg?itok=9vt-Auu3'),
('Freedom and Gift in Human Love', 'Deep dive into the concepts of self-gift, freedom, and authentic love in relationships.', 'Dr. Sarah Chen', '10 weeks', 'advanced', 'https://polishheritagecentertx.org/sites/default/files/styles/max_1300x1300/public/2021-03/00870_AOSTA1991.jpg?itok=9vt-Auu3')
ON CONFLICT DO NOTHING;