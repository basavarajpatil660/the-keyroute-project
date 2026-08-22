create unique index if not exists idx_supabase_connections_user_active
  on public.supabase_connections(user_id)
  where is_active;
