-- 1. Daily activity for the heatmap: one row per day for the last N days,
--    zero-filled for days with no requests, so the frontend can bin straight
--    into HeatmapColumn[] without doing its own gap-filling.
create or replace function public.get_activity_heatmap(p_days integer default 365)
returns table(activity_date date, request_count integer, total_tokens integer)
language sql
security definer
set search_path to 'public'
as $$
  select
    d.day::date as activity_date,
    coalesce(count(u.id), 0)::integer as request_count,
    coalesce(sum(coalesce(u.prompt_tokens, 0) + coalesce(u.completion_tokens, 0)), 0)::integer as total_tokens
  from generate_series(
    (current_date - (greatest(p_days, 1) - 1)),
    current_date,
    interval '1 day'
  ) as d(day)
  left join public.usage_logs u
    on u.user_id = auth.uid()
    and u.created_at::date = d.day::date
  group by d.day
  order by d.day;
$$;

revoke all on function public.get_activity_heatmap(integer) from public;
revoke all on function public.get_activity_heatmap(integer) from anon;
grant execute on function public.get_activity_heatmap(integer) to authenticated;

-- 2. Profile header stats: name, email, member-since, and lifetime token/request totals.
create or replace function public.get_profile_summary()
returns table(
  display_name text,
  email text,
  member_since timestamptz,
  total_requests bigint,
  total_tokens_in bigint,
  total_tokens_out bigint
)
language sql
security definer
set search_path to 'public'
as $$
  select
    p.display_name,
    p.email,
    p.created_at as member_since,
    coalesce(count(u.id), 0) as total_requests,
    coalesce(sum(u.prompt_tokens), 0) as total_tokens_in,
    coalesce(sum(u.completion_tokens), 0) as total_tokens_out
  from public.profiles p
  left join public.usage_logs u on u.user_id = p.id
  where p.id = auth.uid()
  group by p.id, p.display_name, p.email, p.created_at;
$$;

revoke all on function public.get_profile_summary() from public;
revoke all on function public.get_profile_summary() from anon;
grant execute on function public.get_profile_summary() to authenticated;

-- 3. Rename (display name only — avatar is not user-editable, password change
--    goes through supabase.auth.updateUser client-side, no RPC needed for that).
create or replace function public.update_display_name(p_new_name text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if p_new_name is null or length(trim(p_new_name)) = 0 then
    raise exception 'Name is required';
  end if;

  if length(trim(p_new_name)) > 60 then
    raise exception 'Name is too long (max 60 characters)';
  end if;

  update public.profiles
  set display_name = trim(p_new_name)
  where id = auth.uid();

  if not found then
    raise exception 'Profile not found';
  end if;
end;
$$;

revoke all on function public.update_display_name(text) from public;
revoke all on function public.update_display_name(text) from anon;
grant execute on function public.update_display_name(text) to authenticated;
