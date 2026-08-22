create or replace function public.auto_detect_label(p_user_id uuid, p_provider text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
  v_label text;
begin
  select count(*), max(label) into v_count, v_label
  from public.key_labels
  where user_id = p_user_id and provider = p_provider and is_active = true;

  if v_count = 1 then
    return v_label;
  end if;

  return null; -- 0 or 2+ matches: ambiguous, caller must require explicit label
end;
$$;

revoke all on function public.auto_detect_label(uuid, text) from public, anon, authenticated;
grant execute on function public.auto_detect_label(uuid, text) to service_role;
