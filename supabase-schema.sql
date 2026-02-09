-- ============================================
-- SANGRAM - KEAM Preparation App Schema
-- ============================================
-- This schema can be run multiple times safely
-- It uses "IF NOT EXISTS" and "DROP ... IF EXISTS"
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================

-- Only create if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    CREATE TABLE public.profiles (
      id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      full_name TEXT,
      avatar_url TEXT,
      target_exam TEXT DEFAULT 'KEAM',
      bio TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;
END $$;

-- RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- QUESTIONS TABLE
-- ============================================

-- Add new columns if table exists, otherwise create
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'questions') THEN
    CREATE TABLE public.questions (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      exam TEXT NOT NULL DEFAULT 'KEAM',
      subject TEXT NOT NULL,
      chapter TEXT NOT NULL,
      topic TEXT,
      question_text TEXT NOT NULL,
      question_image_url TEXT,
      options JSONB NOT NULL,
      option_images JSONB,
      correct_answer TEXT NOT NULL,
      explanation TEXT,
      explanation_image_url TEXT,
      difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
      hints JSONB,
      year INTEGER,
      source TEXT,
      tags JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  ELSE
    -- Add columns if they don't exist
    BEGIN ALTER TABLE public.questions ADD COLUMN slug TEXT UNIQUE; EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN ALTER TABLE public.questions ADD COLUMN title TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN ALTER TABLE public.questions ADD COLUMN topic TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN ALTER TABLE public.questions ADD COLUMN question_image_url TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN ALTER TABLE public.questions ADD COLUMN option_images JSONB; EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN ALTER TABLE public.questions ADD COLUMN explanation_image_url TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN ALTER TABLE public.questions ADD COLUMN source TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN ALTER TABLE public.questions ADD COLUMN tags JSONB; EXCEPTION WHEN duplicate_column THEN NULL; END;
  END IF;
END $$;

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Questions are viewable by authenticated users" ON public.questions;
DROP POLICY IF EXISTS "Questions are viewable by everyone" ON public.questions;
CREATE POLICY "Questions are viewable by everyone"
  ON public.questions FOR SELECT USING (true);

-- ============================================
-- USER PROGRESS TABLE
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_progress') THEN
    CREATE TABLE public.user_progress (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
      selected_answer TEXT NOT NULL,
      is_correct BOOLEAN NOT NULL,
      time_spent_seconds INTEGER,
      attempt_number INTEGER DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, question_id)
    );
  END IF;
END $$;

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON public.user_progress;

CREATE POLICY "Users can view own progress"
  ON public.user_progress FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON public.user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON public.user_progress FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- CHAPTERS TABLE
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chapters') THEN
    CREATE TABLE public.chapters (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      exam TEXT NOT NULL DEFAULT 'KEAM',
      subject TEXT NOT NULL,
      chapter_name TEXT NOT NULL,
      chapter_number INTEGER,
      topics JSONB,
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(exam, subject, chapter_name)
    );
  END IF;
END $$;

ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Chapters are viewable by everyone" ON public.chapters;
CREATE POLICY "Chapters are viewable by everyone"
  ON public.chapters FOR SELECT USING (true);

-- ============================================
-- LEADERBOARD VIEW
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- SAMPLE QUESTIONS (upsert - won't duplicate)
-- ============================================

-- Delete old questions without slugs and reinsert
DELETE FROM public.questions WHERE slug IS NULL;

INSERT INTO public.questions (slug, title, exam, subject, chapter, topic, question_text, options, correct_answer, explanation, difficulty, hints)
VALUES
  ('lift-apparent-weight', 'The Lift Problem', 'KEAM', 'Physics', 'Laws of Motion', 'Apparent Weight',
   'A person of mass 60 kg stands on a weighing scale in a lift. If the lift accelerates downward at 2 m/s², what is the reading on the scale? (Take g = 10 m/s²)',
   '["720 N", "600 N", "480 N", "360 N"]', 'C',
   'Apparent weight = m(g - a) = 60(10 - 2) = 60 × 8 = 480 N. When lift accelerates downward, apparent weight decreases.',
   'medium', '["Downward acceleration reduces apparent weight", "Use N = m(g - a) for downward acceleration"]'),

  ('force-velocity-change', 'Force on Moving Body', 'KEAM', 'Physics', 'Laws of Motion', 'Impulse',
   'A force of 100 N acts on a body of mass 20 kg for 10 seconds. The change in velocity of the body is:',
   '["5 m/s", "10 m/s", "20 m/s", "50 m/s"]', 'D',
   'Using impulse-momentum theorem: Ft = mΔv. Δv = Ft/m = (100 × 10)/20 = 50 m/s',
   'easy', '["Impulse = Change in momentum", "Impulse = Force × Time"]'),

  ('pulley-tension', 'Pulley System', 'KEAM', 'Physics', 'Laws of Motion', 'Tension',
   'Two masses 5 kg and 10 kg are connected by a string passing over a frictionless pulley. The tension in the string is:',
   '["33.3 N", "66.7 N", "50 N", "100 N"]', 'B',
   'For Atwood machine: T = 2m₁m₂g/(m₁+m₂) = 2(5)(10)(10)/(5+10) = 1000/15 = 66.7 N',
   'hard', '["This is an Atwood machine problem", "Write equations for both masses", "Solve simultaneous equations"]'),

  ('rocket-momentum', 'Rocket Propulsion', 'KEAM', 'Physics', 'Laws of Motion', 'Conservation of Momentum',
   'A rocket works on the principle of:',
   '["Conservation of energy", "Conservation of momentum", "Conservation of mass", "Newton''s first law"]', 'B',
   'Rocket propulsion is based on conservation of momentum. When gases are expelled backward, the rocket moves forward.',
   'easy', '["Think about action-reaction"]'),

  ('friction-angle', 'Angle of Friction', 'KEAM', 'Physics', 'Laws of Motion', 'Friction',
   'A block rests on a rough inclined plane making an angle of 30° with horizontal. If coefficient of static friction is 1/√3, the block will:',
   '["Slide down", "Remain stationary", "Move up", "Cannot be determined"]', 'B',
   'tan(30°) = 1/√3 = μs. When tan(θ) = μs, the block is on verge of sliding. It remains stationary.',
   'medium', '["Compare tan(θ) with μs", "If tan(θ) ≤ μs, block stays"]'),

  ('newtons-third-law', 'Action Reaction', 'KEAM', 'Physics', 'Laws of Motion', 'Newton''s Laws',
   'A horse pulls a cart. The horse moves forward because:',
   '["The cart pulls the horse backward", "The ground pushes the horse forward", "The horse pushes the ground backward", "Both B and C"]', 'D',
   'The horse pushes the ground backward. By Newton''s third law, ground pushes horse forward. Both statements are correct.',
   'easy', '["Apply Newton''s third law", "Consider the reaction from ground"]'),

  ('equilibrium-forces', 'Force Equilibrium', 'KEAM', 'Physics', 'Laws of Motion', 'Equilibrium',
   'Three forces F₁, F₂ and F₃ act on a particle such that it remains in equilibrium. If F₁ = 10 N, F₂ = 6 N and they are perpendicular, then F₃ is:',
   '["4 N", "8 N", "√136 N", "16 N"]', 'C',
   'For equilibrium, F₃ must balance the resultant of F₁ and F₂. F₃ = √(F₁² + F₂²) = √(100 + 36) = √136 N',
   'medium', '["Use vector addition", "F₃ = √(F₁² + F₂²) for perpendicular forces"]'),

  ('momentum-collision', 'Collision Momentum', 'KEAM', 'Physics', 'Laws of Motion', 'Conservation of Momentum',
   'A 2 kg ball moving at 4 m/s collides with a stationary 2 kg ball. If the collision is perfectly elastic, the velocities after collision are:',
   '["Both 2 m/s", "First 0, second 4 m/s", "Both 4 m/s", "First 4 m/s, second 0"]', 'B',
   'In elastic collision between equal masses, velocities are exchanged. First ball stops, second moves at 4 m/s.',
   'medium', '["Use conservation of momentum and energy", "For equal masses, velocities exchange"]'),

  ('pseudo-force', 'Non-inertial Frame', 'KEAM', 'Physics', 'Laws of Motion', 'Pseudo Force',
   'A person in a lift moving upward with acceleration ''a'' observes a ball falling. The apparent acceleration of the ball is:',
   '["g", "g + a", "g - a", "a"]', 'B',
   'In non-inertial frame (accelerating lift), pseudo force acts. Apparent acceleration = g + a (when lift accelerates up).',
   'hard', '["Apply pseudo force concept", "Lift accelerating up adds to g"]'),

  ('friction-minimum-force', 'Minimum Force', 'KEAM', 'Physics', 'Laws of Motion', 'Friction',
   'The minimum force required to move a body of mass m resting on a rough horizontal surface (coefficient of friction μ) is:',
   '["μmg", "mg/μ", "μmg/√(1+μ²)", "μmg√(1+μ²)"]', 'C',
   'Minimum force is when force is applied at angle θ where tan(θ) = μ. F_min = μmg/√(1+μ²)',
   'hard', '["Force at an angle reduces normal reaction", "Optimize the angle for minimum force"]')
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_answer = EXCLUDED.correct_answer,
  explanation = EXCLUDED.explanation,
  difficulty = EXCLUDED.difficulty,
  hints = EXCLUDED.hints,
  topic = EXCLUDED.topic,
  updated_at = NOW();

-- ============================================
-- KEAM PHYSICS CHAPTERS
-- ============================================

INSERT INTO public.chapters (exam, subject, chapter_name, chapter_number, topics)
VALUES
  ('KEAM', 'Physics', 'Units and Measurement', 1, '["SI Units", "Dimensional Analysis", "Significant Figures", "Errors"]'),
  ('KEAM', 'Physics', 'Motion in One Dimension', 2, '["Distance & Displacement", "Speed & Velocity", "Acceleration", "Equations of Motion", "Free Fall"]'),
  ('KEAM', 'Physics', 'Motion in Two Dimensions', 3, '["Projectile Motion", "Circular Motion", "Relative Motion"]'),
  ('KEAM', 'Physics', 'Laws of Motion', 4, '["Newton''s Laws", "Friction", "Circular Motion Dynamics", "Impulse & Momentum", "Equilibrium"]'),
  ('KEAM', 'Physics', 'Work, Energy and Power', 5, '["Work", "Kinetic Energy", "Potential Energy", "Conservation of Energy", "Power", "Collisions"]'),
  ('KEAM', 'Physics', 'Rotational Motion', 6, '["Moment of Inertia", "Torque", "Angular Momentum", "Rolling Motion"]'),
  ('KEAM', 'Physics', 'Gravitation', 7, '["Universal Gravitation", "Gravitational Field", "Orbital Motion", "Escape Velocity", "Satellites"]'),
  ('KEAM', 'Physics', 'Properties of Matter', 8, '["Elasticity", "Surface Tension", "Viscosity", "Fluid Mechanics"]'),
  ('KEAM', 'Physics', 'Thermodynamics', 9, '["Heat", "Laws of Thermodynamics", "Heat Engines", "Entropy", "Carnot Cycle"]'),
  ('KEAM', 'Physics', 'Oscillations', 10, '["SHM", "Pendulum", "Springs", "Damped Oscillations", "Resonance"]')
ON CONFLICT (exam, subject, chapter_name) DO UPDATE SET
  topics = EXCLUDED.topics,
  chapter_number = EXCLUDED.chapter_number;
