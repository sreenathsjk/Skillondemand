-- ==========================================
-- SkillBridge Database Schema for Supabase
-- Fully normalized relational modeling, Row Level Security (RLS) policies,
-- performance indices and curated initial seed rows.
-- ==========================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Define Enum Types
CREATE TYPE user_role AS ENUM ('learner', 'expert', 'admin');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');

-- 3. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'learner',
  avatar_url TEXT,
  is_banned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for Users Table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. Profiles Table (Extra details for experts)
CREATE TABLE IF NOT EXISTS public.expert_profiles (
  id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Industry Expert',
  bio TEXT NOT NULL,
  skills TEXT[] NOT NULL DEFAULT '{}',
  price_per_30_min NUMERIC NOT NULL CHECK (price_per_30_min > 0),
  price_per_60_min NUMERIC NOT NULL CHECK (price_per_60_min > 0),
  average_rating NUMERIC NOT NULL DEFAULT 5.0,
  total_sessions INTEGER NOT NULL DEFAULT 0,
  featured BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for Profiles Table
ALTER TABLE public.expert_profiles ENABLE ROW LEVEL SECURITY;

-- 5. Availability Slots Table
CREATE TABLE IF NOT EXISTS public.availability_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expert_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration INTEGER NOT NULL CHECK (duration IN (30, 60)),
  is_booked BOOLEAN NOT NULL DEFAULT false,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on Slots Table
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;

-- 6. Bookings Table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  learner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  expert_id UUID NOT NULL REFERENCES public.users(id),
  slot_id UUID NOT NULL REFERENCES public.availability_slots(id),
  date_time TIMESTAMPTZ NOT NULL,
  duration INTEGER NOT NULL CHECK (duration IN (30, 60)),
  amount_paid NUMERIC NOT NULL CHECK (amount_paid >= 0),
  platform_fee NUMERIC NOT NULL DEFAULT 0,
  expert_amount NUMERIC NOT NULL DEFAULT 0,
  status booking_status NOT NULL DEFAULT 'pending',
  meeting_link TEXT NOT NULL,
  order_id TEXT,
  payment_id TEXT,
  reviewed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on Bookings Table
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 7. Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  expert_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  learner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on Reviews Table
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- PERFORMANCE INDEXES 
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_slots_expert_date ON public.availability_slots(expert_id, date, start_time) WHERE is_booked = false;
CREATE INDEX IF NOT EXISTS idx_bookings_learner ON public.bookings(learner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_expert ON public.bookings(expert_id);
CREATE INDEX IF NOT EXISTS idx_reviews_expert ON public.reviews(expert_id);


-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Users Access Policies
CREATE POLICY "Users can view any user profile" 
  ON public.users FOR SELECT USING (true);

CREATE POLICY "Users can update their own accounts" 
  ON public.users FOR UPDATE USING (auth.uid() = id);

-- Profiles Access Policies
CREATE POLICY "Profiles are viewable by everyone" 
  ON public.expert_profiles FOR SELECT USING (true);

CREATE POLICY "Experts can edit their own profiles" 
  ON public.expert_profiles FOR UPDATE USING (auth.uid() = id);

-- Availability Slots Policies
CREATE POLICY "Slots are viewable by everyone" 
  ON public.availability_slots FOR SELECT USING (true);

CREATE POLICY "Experts can insert slots" 
  ON public.availability_slots FOR INSERT WITH CHECK (auth.uid() = expert_id);

CREATE POLICY "Experts can modify/delete slots" 
  ON public.availability_slots FOR ALL USING (auth.uid() = expert_id);

-- Bookings Access Policies
CREATE POLICY "Learners can view their own bookings" 
  ON public.bookings FOR SELECT USING (auth.uid() = learner_id);

CREATE POLICY "Experts can view bookings scheduled with them" 
  ON public.bookings FOR SELECT USING (auth.uid() = expert_id);

CREATE POLICY "Learners can insert draft bookings" 
  ON public.bookings FOR INSERT WITH CHECK (auth.uid() = learner_id);

-- Reviews Policies
CREATE POLICY "Reviews are viewable by everyone" 
  ON public.reviews FOR SELECT USING (true);

CREATE POLICY "Learners can submit reviews on confirmed meetings" 
  ON public.reviews FOR INSERT WITH CHECK (auth.uid() = learner_id);


-- ==========================================
-- CURATED SEED DATA
-- ==========================================

-- Seed Administrator User
INSERT INTO public.users (id, email, name, role, avatar_url)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'admin@skillbridge.io',
  'SkillBridge Admin',
  'admin',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80'
) ON CONFLICT DO NOTHING;

-- Seed Expert Users
INSERT INTO public.users (id, email, name, role, avatar_url)
VALUES 
(
  'e1111111-1111-1111-1111-111111111111',
  'johndoe@example.com',
  'John Doe',
  'expert',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&h=150&q=80'
),
(
  'e2222222-2222-2222-2222-222222222222',
  'priyasharma@example.com',
  'Priya Sharma',
  'expert',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80'
) ON CONFLICT DO NOTHING;

-- Seed Expert Profiles
INSERT INTO public.expert_profiles (id, title, bio, skills, price_per_30_min, price_per_60_min, average_rating, total_sessions, featured)
VALUES
(
  'e1111111-1111-1111-1111-111111111111',
  'Senior Software Architect @ Google',
  'Over 12 years of core development experience building search pipelines and low-latency API architectures. Ask me about React/Vite optimizations, scaling Express/Node setups, TypeScript safety, database modeling, and technical system design reviews.',
  ARRAY['Coding', 'System Design', 'React', 'Node.js', 'TypeScript', 'PostgreSQL'],
  40.0,
  75.0,
  4.8,
  142,
  true
),
(
  'e2222222-2222-2222-2222-222222222222',
  'Lead Data Architect & Excel Wizard',
  'Struggling with complex spreadsheet templates, lookup macros, power query setups, or relational SQL modeling? I am a Lead Data Architect specializing in converting unorganized business inputs into high-impact visual interactive dashboards.',
  ARRAY['Excel', 'SQL', 'Data Analytics', 'PowerBI', 'Python', 'Financial Modeling'],
  25.0,
  45.0,
  4.9,
  89,
  true
) ON CONFLICT DO NOTHING;
