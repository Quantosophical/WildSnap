-- USERS
create table if not exists users (
  id uuid primary key references auth.users(id),
  username text unique not null,
  friend_code text unique not null,
  avatar_color text default '#39ff6a',
  level integer default 1,
  xp integer default 0,
  rank_title text default 'NOVICE SPOTTER',
  current_streak integer default 0,
  best_streak integer default 0,
  streak_shields integer default 0,
  last_capture_date date,
  last_seen timestamptz default now(),
  total_captures integer default 0,
  total_points integer default 0,
  rarest_catch text,
  clan_id uuid,
  clan_role text,
  clan_contribution integer default 0,
  created_at timestamptz default now()
);

-- CAPTURES
create table if not exists captures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  animal_name text not null,
  species text not null,
  rarity text not null,
  behavior text default 'unknown',
  behavior_multiplier float default 1.0,
  points_earned integer not null,
  photo_url text,
  lat float,
  lng float,
  location_name text,
  weather_code integer,
  weather_bonus float default 1.0,
  created_at timestamptz default now()
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

-- FRIENDSHIPS
create table if not exists friendships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  friend_id uuid references users(id) on delete cascade,
  friendship_streak integer default 0,
  best_friendship_streak integer default 0,
  last_mutual_date date,
  shields_available integer default 0,
  created_at timestamptz default now(),
  unique(user_id, friend_id)
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

-- Add foreign key for users.clan_id after clans table exists
alter table users 
  add constraint fk_clan 
  foreign key (clan_id) references clans(id) 
  on delete set null;

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

-- MISSION CONTRIBUTIONS
create table if not exists mission_contributions (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid references clan_missions(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  amount integer default 0,
  updated_at timestamptz default now(),
  unique(mission_id, user_id)
);

-- CLAN MESSAGES
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

-- WAR CONTRIBUTIONS
create table if not exists war_contributions (
  id uuid primary key default gen_random_uuid(),
  war_id uuid references clan_wars(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  clan_id uuid references clans(id) on delete cascade,
  points_contributed integer default 0,
  captures_count integer default 0,
  updated_at timestamptz default now(),
  unique(war_id, user_id)
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

-- PERFORMANCE INDEXES
create index if not exists idx_captures_user_date 
  on captures(user_id, created_at desc);
create index if not exists idx_captures_rarity 
  on captures(rarity);
create index if not exists idx_friendships_user 
  on friendships(user_id, status);
create index if not exists idx_friend_requests_receiver 
  on friend_requests(receiver_id, status);
create index if not exists idx_notifications_user 
  on notifications(user_id, read, created_at desc);
create index if not exists idx_clan_messages_clan 
  on clan_messages(clan_id, created_at desc);
create index if not exists idx_users_username 
  on users(username);
create index if not exists idx_users_friend_code 
  on users(friend_code);

-- ROW LEVEL SECURITY
alter table users enable row level security;
alter table captures enable row level security;
alter table friend_requests enable row level security;
alter table friendships enable row level security;
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

-- RLS POLICIES
create policy "users_read_all" on users for select using (true);
create policy "users_update_own" on users for update 
  using (auth.uid() = id);
create policy "users_insert_own" on users for insert 
  with check (auth.uid() = id);

create policy "captures_read_all" on captures for select using (true);
create policy "captures_insert_own" on captures for insert 
  with check (auth.uid() = user_id);

create policy "friend_requests_read_own" on friend_requests 
  for select 
  using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "friend_requests_insert" on friend_requests 
  for insert with check (auth.uid() = sender_id);
create policy "friend_requests_update" on friend_requests 
  for update using (auth.uid() = receiver_id);

create policy "friendships_read_own" on friendships 
  for select 
  using (auth.uid() = user_id or auth.uid() = friend_id);
create policy "friendships_insert" on friendships 
  for insert with check (auth.uid() = user_id);
create policy "friendships_update" on friendships 
  for update 
  using (auth.uid() = user_id or auth.uid() = friend_id);

create policy "cheers_read_own" on cheers 
  for select 
  using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "cheers_insert" on cheers 
  for insert with check (auth.uid() = sender_id);

create policy "challenges_read_own" on challenges 
  for select 
  using (auth.uid()=challenger_id or auth.uid()=challenged_id);
create policy "challenges_insert" on challenges 
  for insert with check (auth.uid() = challenger_id);
create policy "challenges_update" on challenges 
  for update 
  using (auth.uid()=challenger_id or auth.uid()=challenged_id);

create policy "clans_read_all" on clans for select using (true);
create policy "clans_insert" on clans for insert 
  with check (auth.uid() = founder_id);
create policy "clans_update" on clans for update 
  using (exists (
    select 1 from users 
    where id = auth.uid() 
    and clan_id = clans.id 
    and clan_role in ('leader','co-leader')
  ));

create policy "clan_messages_read" on clan_messages 
  for select using (exists (
    select 1 from users 
    where id = auth.uid() and clan_id = clan_messages.clan_id
  ));
create policy "clan_messages_insert" on clan_messages 
  for insert with check (exists (
    select 1 from users 
    where id = auth.uid() and clan_id = clan_messages.clan_id
  ));

create policy "notifications_read_own" on notifications 
  for select using (auth.uid() = user_id);
create policy "notifications_insert" on notifications 
  for insert with check (true);
create policy "notifications_update_own" on notifications 
  for update using (auth.uid() = user_id);

create policy "badges_read_all" on user_badges 
  for select using (true);
create policy "badges_insert_own" on user_badges 
  for insert with check (auth.uid() = user_id);

create policy "expeditions_read_all" on expeditions 
  for select using (true);
create policy "expedition_progress_own" on expedition_progress 
  for select using (auth.uid() = user_id);
create policy "expedition_progress_insert" on expedition_progress 
  for insert with check (auth.uid() = user_id);
create policy "expedition_progress_update" on expedition_progress 
  for update using (auth.uid() = user_id);

create policy "war_contributions_read" on war_contributions 
  for select using (true);
create policy "war_contributions_insert" on war_contributions 
  for insert with check (auth.uid() = user_id);
create policy "war_contributions_update" on war_contributions 
  for update using (auth.uid() = user_id);

create policy "clan_missions_read" on clan_missions 
  for select using (true);

create policy "mission_contributions_read" 
  on mission_contributions for select using (true);
create policy "mission_contributions_upsert" 
  on mission_contributions for insert 
  with check (auth.uid() = user_id);
