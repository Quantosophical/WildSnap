-- Create Clans table
CREATE TABLE public.clans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(20) NOT NULL UNIQUE,
    code VARCHAR(6) NOT NULL UNIQUE,
    motto VARCHAR(50),
    emblem VARCHAR(50),
    color_theme VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clan Members mapping
CREATE TABLE public.clan_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clan_id UUID REFERENCES public.clans(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id) -- A user can only be in one clan
);

-- Update users table with new fields
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS streak INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_streak INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_capture_date DATE,
ADD COLUMN IF NOT EXISTS shields INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS conservation_points INT DEFAULT 0;

-- Mastery Tracking (User <-> Species)
CREATE TABLE public.mastery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    species VARCHAR(100) NOT NULL,
    capture_count INT DEFAULT 1,
    last_captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, species)
);

-- Bounties
CREATE TABLE public.bounties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_species VARCHAR(100) NOT NULL,
    posted_by UUID REFERENCES public.users(id) ON DELETE SET NULL, -- Null means system generated
    reward_points INT NOT NULL,
    difficulty VARCHAR(20),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    claims_remaining INT DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Field Notes / Captures extension
-- Adding new fields to existing captures table
ALTER TABLE public.captures
ADD COLUMN IF NOT EXISTS behavior VARCHAR(50),
ADD COLUMN IF NOT EXISTS behavior_multiplier NUMERIC(3,1) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS weather_code INT,
ADD COLUMN IF NOT EXISTS weather_bonus NUMERIC(3,1) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS streak_day INT,
ADD COLUMN IF NOT EXISTS is_endangered BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS expedition_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS bounty_id UUID REFERENCES public.bounties(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS city_region VARCHAR(100);

-- Enable RLS and setup basic policies for new tables
ALTER TABLE public.clans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bounties ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read clans
CREATE POLICY "Clans are viewable by everyone." ON public.clans
    FOR SELECT USING (auth.role() = 'authenticated');
    
-- Allow clan creation
CREATE POLICY "Users can create clans." ON public.clans
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Clan members viewable by all
CREATE POLICY "Clan members are viewable by everyone." ON public.clan_members
    FOR SELECT USING (auth.role() = 'authenticated');

-- Users can join clan
CREATE POLICY "Users can join clans." ON public.clan_members
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Mastery viewable by all
CREATE POLICY "Mastery is viewable by everyone." ON public.mastery
    FOR SELECT USING (auth.role() = 'authenticated');

-- Users can update their own mastery
CREATE POLICY "Users can insert their own mastery." ON public.mastery
    FOR ALL USING (auth.uid() = user_id);

-- Bounties viewable by all
CREATE POLICY "Bounties are viewable by everyone." ON public.bounties
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow inserts to bounties
CREATE POLICY "Users can post bounties." ON public.bounties
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
