-- CLEANUP EXISTING SKELETON TABLES
drop table if exists expedition_progress cascade;
drop table if exists expeditions cascade;
drop table if exists user_badges cascade;
drop table if exists notifications cascade;
drop table if exists war_contributions cascade;
drop table if exists clan_wars cascade;
drop table if exists clan_announcements cascade;
drop table if exists clan_messages cascade;
drop table if exists mission_contributions cascade;
drop table if exists clan_missions cascade;
drop table if exists challenges cascade;
drop table if exists cheers cascade;
drop table if exists friend_requests cascade;
drop table if exists friendships cascade;
drop table if exists captures cascade;
drop table if exists clans cascade;
drop table if exists users cascade;

-- USERS
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  friend_code text unique not null,
  avatar_color text default '#39ff6a',
  avatar_url text,
  level integer default 1,
  xp integer default 0,
  rank_title text default 'NOVICE SPOTTER',
  current_streak integer default 0,
  best_streak integer default 0,
  last_capture_date date,
  streak_shields integer default 0,
  total_captures integer default 0,
  total_points integer default 0,
  rarest_catch text default null,
  clan_id uuid, -- Reference added later
  clan_role text default null,
  last_seen timestamptz default now(),
  created_at timestamptz default now()
);

-- EXPEDITIONS
create table if not exists expeditions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  type text not null,
  target_count integer not null,
  reward_points integer not null,
  reward_badge text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz default now()
);

-- CLANS
create table if not exists clans (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  tag text unique not null,
  motto text,
  war_cry text,
  emblem_config jsonb not null,
  type text default 'open',
  min_level integer default 1,
  focus text,
  level integer default 1,
  xp integer default 0,
  trophy_count integer default 0,
  invite_code text unique not null,
  founder_id uuid references users(id),
  created_at timestamptz default now()
);

-- Add clan foreign key to users
alter table users drop constraint if exists users_clan_id_fkey;
alter table users add constraint users_clan_id_fkey foreign key (clan_id) references clans(id) on delete set null;

-- CLAN WARS
create table if not exists clan_wars (
  id uuid primary key default gen_random_uuid(),
  attacker_clan_id uuid references clans(id) on delete cascade,
  defender_clan_id uuid references clans(id) on delete cascade,
  attacker_score integer default 0,
  defender_score integer default 0,
  status text default 'pending',
  winner_clan_id uuid references clans(id),
  trophies_awarded integer default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz default now()
);

-- CAPTURES
create table if not exists captures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  animal_name text not null,
  species text not null,
  rarity text not null,
  behavior text,
  behavior_multiplier float default 1.0,
  points_earned integer not null,
  image_url text,
  lat float,
  lng float,
  location_name text,
  city_region text,
  weather_code integer,
  weather_bonus float default 1.0,
  stat_speed integer default 50,
  stat_stealth integer default 50,
  stat_aggression integer default 50,
  fun_fact text,
  expedition_id uuid references expeditions(id),
  war_id uuid references clan_wars(id),
  created_at timestamptz default now()
);

-- FRIENDS
create table if not exists friendships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  friend_id uuid references users(id) on delete cascade,
  status text default 'pending',
  friendship_streak integer default 0,
  best_friendship_streak integer default 0,
  last_mutual_date date,
  shields_available integer default 0,
  created_at timestamptz default now(),
  unique(user_id, friend_id)
);

-- FRIEND REQUESTS
create table if not exists friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references users(id) on delete cascade,
  receiver_id uuid references users(id) on delete cascade,
  status text default 'pending',
  created_at timestamptz default now(),
  unique(sender_id, receiver_id)
);

-- CHEERS
create table if not exists cheers (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references users(id) on delete cascade,
  receiver_id uuid references users(id) on delete cascade,
  message text not null,
  seen boolean default false,
  created_at timestamptz default now()
);

-- 1v1 CHALLENGES
create table if not exists challenges (
  id uuid primary key default gen_random_uuid(),
  challenger_id uuid references users(id) on delete cascade,
  challenged_id uuid references users(id) on delete cascade,
  type text not null,
  status text default 'pending',
  challenger_score integer default 0,
  challenged_score integer default 0,
  winner_id uuid references users(id),
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

-- CLAN MISSIONS
create table if not exists clan_missions (
  id uuid primary key default gen_random_uuid(),
  clan_id uuid references clans(id) on delete cascade,
  type text not null,
  description text not null,
  target integer not null,
  progress integer default 0,
  reward_xp integer default 200,
  reward_points integer default 200,
  status text default 'active',
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

-- CLAN MISSION CONTRIBUTIONS
create table if not exists mission_contributions (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid references clan_missions(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  amount integer default 0,
  created_at timestamptz default now()
);

-- CLAN CHAT
create table if not exists clan_messages (
  id uuid primary key default gen_random_uuid(),
  clan_id uuid references clans(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  username text not null,
  role text not null,
  message_type text not null,
  message text not null,
  created_at timestamptz default now()
);

-- CLAN ANNOUNCEMENTS
create table if not exists clan_announcements (
  id uuid primary key default gen_random_uuid(),
  clan_id uuid references clans(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  content text not null,
  pinned_until timestamptz,
  created_at timestamptz default now()
);

-- WAR CONTRIBUTIONS
create table if not exists war_contributions (
  id uuid primary key default gen_random_uuid(),
  war_id uuid references clan_wars(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  clan_id uuid references clans(id) on delete cascade,
  points_contributed integer default 0,
  captures_count integer default 0,
  created_at timestamptz default now()
);

-- NOTIFICATIONS
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  type text not null,
  message text not null,
  action_data jsonb,
  read boolean default false,
  created_at timestamptz default now()
);

-- BADGES
create table if not exists user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  badge_key text not null,
  earned_at timestamptz default now(),
  unique(user_id, badge_key)
);

-- EXPEDITION PROGRESS
create table if not exists expedition_progress (
  id uuid primary key default gen_random_uuid(),
  expedition_id uuid references expeditions(id),
  user_id uuid references users(id) on delete cascade,
  progress integer default 0,
  completed boolean default false,
  completed_at timestamptz,
  unique(expedition_id, user_id)
);

-- Enable Row Level Security on all tables
alter table users enable row level security;
alter table captures enable row level security;
alter table friendships enable row level security;
alter table friend_requests enable row level security;
alter table cheers enable row level security;
alter table challenges enable row level security;
alter table clans enable row level security;
alter table clan_missions enable row level security;
alter table mission_contributions enable row level security;
alter table clan_messages enable row level security;
alter table clan_announcements enable row level security;
alter table clan_wars enable row level security;
alter table war_contributions enable row level security;
alter table notifications enable row level security;
alter table user_badges enable row level security;
alter table expeditions enable row level security;
alter table expedition_progress enable row level security;

-- RLS POLICIES --

-- Users can read all profiles, only update their own
create policy "Public profiles" on users for select using (true);
create policy "Update own profile" on users for update using (auth.uid() = id);
create policy "Insert own profile" on users for insert with check (auth.uid() = id);

-- Captures: public read, own insert
create policy "Public captures" on captures for select using (true);
create policy "Own captures insert" on captures for insert with check (auth.uid() = user_id);

-- Friendships: read own friendships
create policy "Own friendships" on friendships for select using (auth.uid() = user_id or auth.uid() = friend_id);
create policy "Insert friendship" on friendships for insert with check (auth.uid() = user_id or auth.uid() = friend_id);
create policy "Update friendship" on friendships for update using (auth.uid() = user_id or auth.uid() = friend_id);

-- Friend requests: read own requests
create policy "Own requests" on friend_requests for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Send request" on friend_requests for insert with check (auth.uid() = sender_id);
create policy "Update request" on friend_requests for update using (auth.uid() = receiver_id);

-- Cheers: read own cheers
create policy "Own cheers" on cheers for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Send cheer" on cheers for insert with check (auth.uid() = sender_id);

-- Challenges: read own challenges
create policy "Own challenges" on challenges for select using (auth.uid() = challenger_id or auth.uid() = challenged_id);
create policy "Create challenge" on challenges for insert with check (auth.uid() = challenger_id);
create policy "Update challenge" on challenges for update using (auth.uid() = challenger_id or auth.uid() = challenged_id);

-- Clans: public read
create policy "Public clans" on clans for select using (true);
create policy "Create clan" on clans for insert with check (auth.uid() = founder_id);
create policy "Update clan" on clans for update using (
  exists (
    select 1 from users 
    where id = auth.uid() 
    and clan_id = clans.id 
    and clan_role in ('leader', 'co-leader')
  )
);

-- Clan messages: clan members only
create policy "Clan members read messages" on clan_messages for select using (
  exists (select 1 from users where id = auth.uid() and clan_id = clan_messages.clan_id)
);
create policy "Clan members send messages" on clan_messages for insert with check (
  exists (select 1 from users where id = auth.uid() and clan_id = clan_messages.clan_id)
);

-- Notifications: own only
create policy "Own notifications" on notifications for select using (auth.uid() = user_id);
create policy "Insert notifications" on notifications for insert with check (true);
create policy "Update own notifications" on notifications for update using (auth.uid() = user_id);

-- Badges: public read
create policy "Public badges" on user_badges for select using (true);
create policy "Insert own badges" on user_badges for insert with check (auth.uid() = user_id);

-- Expeditions: public read
create policy "Public expeditions" on expeditions for select using (true);

-- Expedition Progress
create policy "Own expedition progress" on expedition_progress for select using (auth.uid() = user_id);
create policy "Insert expedition progress" on expedition_progress for insert with check (auth.uid() = user_id);
create policy "Update expedition progress" on expedition_progress for update using (auth.uid() = user_id);

-- War contributions: clan members
create policy "Read war contributions" on war_contributions for select using (true);
create policy "Insert war contribution" on war_contributions for insert with check (auth.uid() = user_id);

-- SUPABASE INDEXES (add for performance)
create index if not exists idx_captures_user_id on captures(user_id, created_at desc);
create index if not exists idx_captures_rarity on captures(rarity);
create index if not exists idx_friendships_user_status on friendships(user_id, status);
create index if not exists idx_friend_requests_receiver_status on friend_requests(receiver_id, status);
create index if not exists idx_notifications_user_read on notifications(user_id, read, created_at);
create index if not exists idx_clan_messages_clan_id on clan_messages(clan_id, created_at desc);
create index if not exists idx_war_contributions_war_clan on war_contributions(war_id, clan_id);
