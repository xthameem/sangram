-- Supabase SQL Schema for Sangram
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  target_exam TEXT DEFAULT 'KEAM',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Questions table
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  exam TEXT NOT NULL DEFAULT 'KEAM',
  subject TEXT NOT NULL,
  chapter TEXT NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  hints JSONB,
  year INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Questions are viewable by everyone" ON public.questions
  FOR SELECT USING (true);

-- User progress table
CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_taken INTEGER, -- in seconds
  attempted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

-- Enable RLS
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress" ON public.user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON public.user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON public.user_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Leaderboard view (calculated from progress)
CREATE OR REPLACE VIEW public.leaderboard AS
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
  -- Score calculation: correct_answers * 10 + accuracy_bonus
  COALESCE(COUNT(CASE WHEN up.is_correct THEN 1 END) * 10, 0) + 
  CASE 
    WHEN COUNT(up.id) >= 10 THEN ROUND((COUNT(CASE WHEN up.is_correct THEN 1 END)::NUMERIC / COUNT(up.id)) * 50)
    ELSE 0 
  END as score
FROM public.profiles p
LEFT JOIN public.user_progress up ON p.id = up.user_id
GROUP BY p.id, p.username, p.avatar_url
ORDER BY score DESC, correct_answers DESC;

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sample questions for Laws of Motion (Physics)
INSERT INTO public.questions (exam, subject, chapter, question_text, options, correct_answer, explanation, difficulty, hints) VALUES
('KEAM', 'Physics', 'Laws of Motion', 
 'A body of mass 5 kg is acted upon by two perpendicular forces 8 N and 6 N. The magnitude and direction of the acceleration is:',
 '["2 m/s² at 37° with 8N force", "2 m/s² at 53° with 8N force", "10 m/s² at 37° with 6N force", "10 m/s² at 53° with 6N force"]',
 '2 m/s² at 37° with 8N force',
 'Resultant force = √(8² + 6²) = √100 = 10 N. Acceleration a = F/m = 10/5 = 2 m/s². Angle θ = tan⁻¹(6/8) = 37° with 8N force.',
 'medium',
 '["Use Pythagoras theorem for resultant force", "Apply Newton''s second law F = ma", "Use trigonometry for direction"]'
),
('KEAM', 'Physics', 'Laws of Motion',
 'A block of mass 10 kg is placed on an inclined plane of angle 30°. The acceleration of the block when released (assuming frictionless surface) is:',
 '["5 m/s²", "10 m/s²", "2.5 m/s²", "7.5 m/s²"]',
 '5 m/s²',
 'On a frictionless inclined plane, a = g sin θ = 10 × sin 30° = 10 × 0.5 = 5 m/s²',
 'easy',
 '["Component of gravity along the plane is g sin θ", "No friction means no opposing force"]'
),
('KEAM', 'Physics', 'Laws of Motion',
 'According to Newton''s third law, action and reaction:',
 '["Act on the same body", "Are equal in magnitude but opposite in direction", "Act on different bodies and are equal and opposite", "Cancel each other"]',
 'Act on different bodies and are equal and opposite',
 'Newton''s third law states that for every action, there is an equal and opposite reaction. Importantly, these forces act on DIFFERENT bodies, so they don''t cancel out.',
 'easy',
 '["Think about what happens when you push a wall", "Consider the forces when walking"]'
),
('KEAM', 'Physics', 'Laws of Motion',
 'A lift is moving upwards with acceleration 2 m/s². The apparent weight of a person of mass 60 kg in the lift will be:',
 '["600 N", "720 N", "480 N", "540 N"]',
 '720 N',
 'Apparent weight = m(g + a) = 60(10 + 2) = 60 × 12 = 720 N. When lift accelerates upward, apparent weight increases.',
 'medium',
 '["Consider the pseudo force in the lift frame", "Apparent weight = Normal reaction force"]'
),
('KEAM', 'Physics', 'Laws of Motion',
 'The coefficient of static friction between a body and a surface is 0.5. The weight of the body is 100 N. The minimum force required to just move the body along the surface is:',
 '["25 N", "50 N", "75 N", "100 N"]',
 '50 N',
 'Force of static friction f = μN = μmg = 0.5 × 100 = 50 N. This is the minimum force needed to overcome static friction.',
 'easy',
 '["Static friction formula: f = μN", "Normal force equals weight on horizontal surface"]'
),
('KEAM', 'Physics', 'Laws of Motion',
 'A bullet of mass 20 g moving with 500 m/s strikes a block of mass 980 g at rest. The velocity of the combined system after collision is:',
 '["5 m/s", "10 m/s", "50 m/s", "500 m/s"]',
 '10 m/s',
 'Using conservation of momentum: m₁v₁ + m₂v₂ = (m₁ + m₂)v. 0.02 × 500 + 0.98 × 0 = 1 × v. v = 10/1 = 10 m/s',
 'medium',
 '["Apply conservation of linear momentum", "Convert grams to kilograms", "This is a perfectly inelastic collision"]'
),
('KEAM', 'Physics', 'Laws of Motion',
 'A man weighing 60 kg is in a lift moving down with an acceleration of 2 m/s². The force exerted by him on the floor of the lift is:',
 '["600 N", "480 N", "720 N", "120 N"]',
 '480 N',
 'Apparent weight = m(g - a) = 60(10 - 2) = 60 × 8 = 480 N. When lift accelerates downward, apparent weight decreases.',
 'medium',
 '["Downward acceleration reduces apparent weight", "Use N = m(g - a) for downward acceleration"]'
),
('KEAM', 'Physics', 'Laws of Motion',
 'A force of 100 N acts on a body of mass 20 kg for 10 seconds. The change in velocity of the body is:',
 '["50 m/s", "100 m/s", "200 m/s", "10 m/s"]',
 '50 m/s',
 'Using impulse-momentum theorem: Ft = mΔv. Δv = Ft/m = (100 × 10)/20 = 1000/20 = 50 m/s',
 'easy',
 '["Impulse = Change in momentum", "Impulse = Force × Time"]'
),
('KEAM', 'Physics', 'Laws of Motion',
 'Two masses 5 kg and 10 kg are connected by a string passing over a frictionless pulley. The tension in the string is:',
 '["33.3 N", "66.7 N", "50 N", "100 N"]',
 '66.7 N',
 'For an Atwood machine: T = 2m₁m₂g/(m₁+m₂) = 2×5×10×10/(5+10) = 1000/15 = 66.7 N',
 'hard',
 '["This is an Atwood machine problem", "Write equations for both masses", "Solve simultaneous equations"]'
),
('KEAM', 'Physics', 'Laws of Motion',
 'A rocket works on the principle of:',
 '["Conservation of energy", "Conservation of momentum", "Newton''s first law", "Newton''s second law only"]',
 'Conservation of momentum',
 'A rocket propels by ejecting mass (exhaust gases) at high velocity. By conservation of momentum, the rocket gains momentum in the opposite direction.',
 'easy',
 '["Think about what happens when gases are expelled", "Total momentum before and after must be equal"]'
);
