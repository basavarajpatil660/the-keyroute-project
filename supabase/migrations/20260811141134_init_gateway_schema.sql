-- Enable needed extensions
create extension if not exists pgcrypto;

-- 1. Profiles: one row per platform user (linked to Supabase Auth)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  created_at timestamptz not null default now()
);

-- 2. Supabase connections: reference to the USER's OWN Supabase project
-- where their real provider keys live. We never store their provider keys directly.
create table public.supabase_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_url text not null,
  service_key_encrypted text not null, -- encrypted at app layer before insert
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Key labels: metadata only, NOT the actual provider key.
-- Lets the routing engine resolve "openai-work/gpt-4o" -> provider without
-- hitting the user's Supabase just to check if a label exists.
create table public.key_labels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null,
  provider text not null, -- e.g. 'openai', 'gemini', 'groq', 'custom'
  custom_base_url text, -- only used when provider = 'custom'
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, label)
);

-- 4. Platform keys: the single unified key issued to the user.
-- Only the hash is stored; the plaintext is shown once at creation time.
create table public.platform_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  key_hash text not null unique,
  key_prefix text not null, -- short visible prefix, e.g. "pk_live_ab12" for UI display
  name text,
  revoked boolean not null default false,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

-- 5. Usage logs: every request that passed through the gateway
create table public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  platform_key_id uuid references public.platform_keys(id) on delete set null,
  label_used text,
  provider text,
  model text,
  status_code int,
  latency_ms int,
  prompt_tokens int,
  completion_tokens int,
  error_message text,
  created_at timestamptz not null default now()
);

-- Indexes for common lookups
create index idx_key_labels_user on public.key_labels(user_id);
create index idx_platform_keys_hash on public.platform_keys(key_hash);
create index idx_usage_logs_user_created on public.usage_logs(user_id, created_at desc);

-- Row Level Security: users only ever see their own data
alter table public.profiles enable row level security;
alter table public.supabase_connections enable row level security;
alter table public.key_labels enable row level security;
alter table public.platform_keys enable row level security;
alter table public.usage_logs enable row level security;

create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "own connections" on public.supabase_connections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own key labels" on public.key_labels
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own platform keys" on public.platform_keys
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own usage logs" on public.usage_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
