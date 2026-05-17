-- OpenSaga Initial Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL → New Query)

-- 1. Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  banner_url TEXT,
  bio TEXT DEFAULT '',
  role TEXT DEFAULT 'CITIZEN' CHECK (role IN ('CREATOR', 'LOREKEEPER', 'ARCHITECT', 'CITIZEN', 'WANDERER')),
  reputation INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Worlds
CREATE TABLE IF NOT EXISTS worlds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  hero_image TEXT,
  genre TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'INVITE_ONLY', 'CLOSED')),
  governance TEXT DEFAULT 'COMMUNITY_VOTE' CHECK (governance IN ('CREATOR_APPROVED', 'COMMUNITY_VOTE', 'LOREKEEPER_COUNCIL')),
  voting_threshold INTEGER DEFAULT 60,
  creator_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. World Bible Sections
CREATE TABLE IF NOT EXISTS bible_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID REFERENCES worlds(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Entities (characters, lore, factions)
CREATE TABLE IF NOT EXISTS entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID REFERENCES worlds(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('CHARACTER', 'LORE', 'FACTION')),
  data JSONB NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PROPOSAL', 'CANON', 'REJECTED')),
  author_id UUID REFERENCES profiles(id) NOT NULL,
  justification TEXT,
  voting_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Votes
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('UP', 'DOWN')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(entity_id, user_id)
);

-- 6. World Membership
CREATE TABLE IF NOT EXISTS memberships (
  world_id UUID REFERENCES worlds(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'CITIZEN',
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (world_id, user_id)
);

-- 7. Activity Log
CREATE TABLE IF NOT EXISTS activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID REFERENCES worlds(id),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- Row Level Security Policies
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE worlds ENABLE ROW LEVEL SECURITY;
ALTER TABLE bible_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity ENABLE ROW LEVEL SECURITY;

-- PROFILES: Anyone can read. Users can only update their own.
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- WORLDS: Anyone can read. Authenticated users can create. Creators can update.
CREATE POLICY "Worlds are viewable by everyone"
  ON worlds FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create worlds"
  ON worlds FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their worlds"
  ON worlds FOR UPDATE USING (auth.uid() = creator_id);

-- BIBLE SECTIONS: Anyone can read. World creators can manage.
CREATE POLICY "Bible sections are viewable by everyone"
  ON bible_sections FOR SELECT USING (true);

CREATE POLICY "World creators can manage bible sections"
  ON bible_sections FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM worlds WHERE worlds.id = world_id AND worlds.creator_id = auth.uid())
  );

CREATE POLICY "World creators can update bible sections"
  ON bible_sections FOR UPDATE USING (
    EXISTS (SELECT 1 FROM worlds WHERE worlds.id = world_id AND worlds.creator_id = auth.uid())
  );

-- ENTITIES: Anyone can read. Authenticated users can create. Authors can update drafts.
CREATE POLICY "Entities are viewable by everyone"
  ON entities FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create entities"
  ON entities FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own entities"
  ON entities FOR UPDATE USING (auth.uid() = author_id);

-- VOTES: Anyone can read. Authenticated users can vote (one vote per entity enforced by UNIQUE).
CREATE POLICY "Votes are viewable by everyone"
  ON votes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote"
  ON votes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can change their vote"
  ON votes FOR UPDATE USING (auth.uid() = user_id);

-- MEMBERSHIPS: Anyone can read. Users can join/leave.
CREATE POLICY "Memberships are viewable by everyone"
  ON memberships FOR SELECT USING (true);

CREATE POLICY "Users can join worlds"
  ON memberships FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave worlds"
  ON memberships FOR DELETE USING (auth.uid() = user_id);

-- ACTIVITY: Anyone can read. System inserts (via service role or triggers).
CREATE POLICY "Activity is viewable by everyone"
  ON activity FOR SELECT USING (true);

CREATE POLICY "Authenticated users can log activity"
  ON activity FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- Indexes for Performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_worlds_creator ON worlds(creator_id);
CREATE INDEX IF NOT EXISTS idx_worlds_status ON worlds(status);
CREATE INDEX IF NOT EXISTS idx_entities_world ON entities(world_id);
CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type);
CREATE INDEX IF NOT EXISTS idx_entities_status ON entities(status);
CREATE INDEX IF NOT EXISTS idx_entities_author ON entities(author_id);
CREATE INDEX IF NOT EXISTS idx_votes_entity ON votes(entity_id);
CREATE INDEX IF NOT EXISTS idx_votes_user ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_world ON activity(world_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity(created_at DESC);

-- =============================================
-- Auto-create profile on first sign-in
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, bio)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'preferred_username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    ''
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: fire on every new auth signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
