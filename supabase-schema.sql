-- ============================================
-- SANGRAM - KEAM Preparation App Schema
-- ============================================
-- This schema supports:
-- - User profiles with unique usernames
-- - Questions with images/diagrams support
-- - Question slugs (short unique names like LeetCode)
-- - Progress tracking and leaderboard
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- Stores user profile information
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  target_exam TEXT DEFAULT 'KEAM',
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- QUESTIONS TABLE
-- Supports images, diagrams, and LeetCode-style slugs
-- ============================================
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Question identity (LeetCode-style)
  slug TEXT UNIQUE NOT NULL,  -- e.g., "lift-apparent-weight", "atwood-machine"
  title TEXT NOT NULL,        -- e.g., "The Lift Problem", "Atwood Machine"
  
  -- Classification
  exam TEXT NOT NULL DEFAULT 'KEAM',       -- KEAM, NEET, JEE
  subject TEXT NOT NULL,                    -- Physics, Chemistry, Mathematics
  chapter TEXT NOT NULL,                    -- Laws of Motion, Kinematics
  topic TEXT,                               -- Specific topic within chapter
  
  -- Question content  
  question_text TEXT NOT NULL,              -- Main question (can include markdown)
  question_image_url TEXT,                  -- URL to question image/diagram (stored in Supabase Storage)
  
  -- Answer options
  options JSONB NOT NULL,                   -- ["Option A", "Option B", "Option C", "Option D"]
  option_images JSONB,                      -- [null, "url_to_image", null, null] for options with images
  correct_answer TEXT NOT NULL,             -- "A", "B", "C", or "D"
  
  -- Explanation
  explanation TEXT,                         -- Detailed solution
  explanation_image_url TEXT,               -- Diagram for explanation
  
  -- Difficulty and hints
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  hints JSONB,                              -- ["Hint 1", "Hint 2"]
  
  -- Metadata
  year INTEGER,                             -- Year if from PYQ (e.g., 2023)
  source TEXT,                              -- 'original', 'pyq', 'ncert', 'custom'
  tags JSONB,                               -- ["mechanics", "friction", "important"]
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for questions
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Questions are viewable by authenticated users" ON public.questions;
CREATE POLICY "Questions are viewable by authenticated users"
  ON public.questions FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- USER PROGRESS TABLE
-- Tracks individual question attempts
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  
  -- Attempt details
  selected_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_spent_seconds INTEGER,
  attempt_number INTEGER DEFAULT 1,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one attempt record per user per question (latest)
  UNIQUE(user_id, question_id)
);

-- RLS for user_progress
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own progress" ON public.user_progress;
CREATE POLICY "Users can view own progress"
  ON public.user_progress FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own progress" ON public.user_progress;
CREATE POLICY "Users can insert own progress"
  ON public.user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own progress" ON public.user_progress;
CREATE POLICY "Users can update own progress"
  ON public.user_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- LEADERBOARD VIEW
-- Calculates rankings based on score
-- ============================================
DROP VIEW IF EXISTS public.leaderboard;
CREATE VIEW public.leaderboard AS
SELECT
  p.id as user_id,
  p.username,
  p.avatar_url,
  COALESCE(COUNT(CASE WHEN up.is_correct THEN 1 END), 0) as correct_answers,
  COALESCE(COUNT(up.id), 0) as total_attempts,
  CASE
    WHEN COUNT(up.id) > 0 THEN ROUND((COUNT(CASE WHEN up.is_correct THEN 1 END)::NUMERIC / COUNT(up.id)) * 100, 1)
    ELSE 0
  END as accuracy,
  -- Score: 10 points per correct + accuracy bonus (up to 50 for 10+ questions)
  COALESCE(COUNT(CASE WHEN up.is_correct THEN 1 END) * 10, 0) +
  CASE
    WHEN COUNT(up.id) >= 10 THEN ROUND((COUNT(CASE WHEN up.is_correct THEN 1 END)::NUMERIC / COUNT(up.id)) * 50)
    ELSE 0
  END as score
FROM public.profiles p
LEFT JOIN public.user_progress up ON p.id = up.user_id
GROUP BY p.id, p.username, p.avatar_url
ORDER BY score DESC, correct_answers DESC;

-- ============================================
-- CHAPTERS TABLE (for Learning Forum structure)
-- ============================================
CREATE TABLE IF NOT EXISTS public.chapters (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  exam TEXT NOT NULL DEFAULT 'KEAM',
  subject TEXT NOT NULL,
  chapter_name TEXT NOT NULL,
  chapter_number INTEGER,
  topics JSONB,  -- ["Topic 1", "Topic 2", "Topic 3"]
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exam, subject, chapter_name)
);

ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Chapters are viewable by everyone" ON public.chapters;
CREATE POLICY "Chapters are viewable by everyone"
  ON public.chapters FOR SELECT
  USING (true);

-- ============================================
-- FUNCTION: Auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- SAMPLE QUESTIONS (Laws of Motion)
-- With slugs and structure for images
-- ============================================
INSERT INTO public.questions (slug, title, exam, subject, chapter, topic, question_text, options, correct_answer, explanation, difficulty, hints)
VALUES
  -- Question 1
  ('lift-apparent-weight', 'The Lift Problem', 'KEAM', 'Physics', 'Laws of Motion', 'Apparent Weight',
   'A person of mass 60 kg stands on a weighing scale in a lift. If the lift accelerates downward at 2 m/s², what is the reading on the scale? (Take g = 10 m/s²)',
   '["720 N", "600 N", "480 N", "360 N"]',
   'C',
   'Apparent weight = m(g - a) = 60(10 - 2) = 60 × 8 = 480 N. When lift accelerates downward, apparent weight decreases.',
   'medium',
   '["Downward acceleration reduces apparent weight", "Use N = m(g - a) for downward acceleration"]'),

  -- Question 2
  ('force-velocity-change', 'Force on Moving Body', 'KEAM', 'Physics', 'Laws of Motion', 'Impulse',
   'A force of 100 N acts on a body of mass 20 kg for 10 seconds. The change in velocity of the body is:',
   '["5 m/s", "10 m/s", "20 m/s", "50 m/s"]',
   'D',
   'Using impulse-momentum theorem: Ft = mΔv. Δv = Ft/m = (100 × 10)/20 = 50 m/s',
   'easy',
   '["Impulse = Change in momentum", "Impulse = Force × Time"]'),

  -- Question 3
  ('pulley-tension', 'Pulley System', 'KEAM', 'Physics', 'Laws of Motion', 'Tension',
   'Two masses 5 kg and 10 kg are connected by a string passing over a frictionless pulley. The tension in the string is:',
   '["33.3 N", "66.7 N", "50 N", "100 N"]',
   'B',
   'For Atwood machine: T = 2m₁m₂g/(m₁+m₂) = 2(5)(10)(10)/(5+10) = 1000/15 = 66.7 N',
   'hard',
   '["This is an Atwood machine problem", "Write equations for both masses", "Solve simultaneous equations"]'),

  -- Question 4  
  ('rocket-momentum', 'Rocket Propulsion', 'KEAM', 'Physics', 'Laws of Motion', 'Conservation of Momentum',
   'A rocket works on the principle of:',
   '["Conservation of energy", "Conservation of momentum", "Conservation of mass", "Newton''s first law"]',
   'B',
   'Rocket propulsion is based on conservation of momentum. When gases are expelled backward, the rocket moves forward.',
   'easy',
   '["Think about action-reaction"]'),

  -- Question 5
  ('friction-angle', 'Angle of Friction', 'KEAM', 'Physics', 'Laws of Motion', 'Friction',
   'A block rests on a rough inclined plane making an angle of 30° with horizontal. If coefficient of static friction is 1/√3, the block will:',
   '["Slide down", "Remain stationary", "Move up", "Cannot be determined"]',
   'B',
   'tan(30°) = 1/√3 = μs. When tan(θ) = μs, the block is on verge of sliding. It remains stationary.',
   'medium',
   '["Compare tan(θ) with μs", "If tan(θ) ≤ μs, block stays"]')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- KEAM PHYSICS CHAPTERS (from official syllabus)
-- ============================================
INSERT INTO public.chapters (exam, subject, chapter_name, chapter_number, topics)
VALUES
  ('KEAM', 'Physics', 'Units and Measurement', 1, 
   '["SI Units", "Dimensional Analysis", "Significant Figures", "Errors in Measurement"]'),
  ('KEAM', 'Physics', 'Motion in One Dimension', 2,
   '["Distance and Displacement", "Speed and Velocity", "Acceleration", "Equations of Motion", "Free Fall"]'),
  ('KEAM', 'Physics', 'Motion in Two Dimensions', 3,
   '["Projectile Motion", "Circular Motion", "Relative Motion"]'),
  ('KEAM', 'Physics', 'Laws of Motion', 4,
   '["Newton''s Laws", "Friction", "Circular Motion Dynamics", "Impulse and Momentum"]'),
  ('KEAM', 'Physics', 'Work, Energy and Power', 5,
   '["Work", "Kinetic Energy", "Potential Energy", "Conservation of Energy", "Power"]'),
  ('KEAM', 'Physics', 'Rotational Motion', 6,
   '["Moment of Inertia", "Torque", "Angular Momentum", "Rolling Motion"]'),
  ('KEAM', 'Physics', 'Gravitation', 7,
   '["Universal Gravitation", "Gravitational Field", "Orbital Motion", "Escape Velocity"]'),
  ('KEAM', 'Physics', 'Properties of Matter', 8,
   '["Elasticity", "Surface Tension", "Viscosity", "Fluid Mechanics"]'),
  ('KEAM', 'Physics', 'Thermodynamics', 9,
   '["Heat and Temperature", "Laws of Thermodynamics", "Heat Engines", "Entropy"]'),
  ('KEAM', 'Physics', 'Oscillations', 10,
   '["SHM", "Pendulum", "Springs", "Damped Oscillations"]')
ON CONFLICT (exam, subject, chapter_name) DO NOTHING;
