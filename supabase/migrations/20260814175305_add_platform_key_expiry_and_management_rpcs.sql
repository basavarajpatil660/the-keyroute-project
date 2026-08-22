-- "Never" by default = null expires_at
alter table public.platform_keys add column if not exists expires_at timestamptz;

-- Enforce expiry at validation time
create or replace function public.validate_platform_key(p_plain_key text)
returns uuid
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_hash text;
  v_user_id uuid;
  v_key_id uuid;
  v_expires_at timestamptz;
begin
  v_hash := encode(extensions.digest(p_plain_key, 'sha256'), 'hex');

  select id, user_id, expires_at into v_key_id, v_user_id, v_expires_at
  from public.platform_keys
  where key_hash = v_hash and revoked = false;

  if v_user_id is null then
    return null;
  end if;

  if v_expires_at is not null and v_expires_at < now() then
    return null;
  end if;

  update public.platform_keys set last_used_at = now() where id = v_key_id;

  return v_user_id;
end;
$function$;

-- Rename + set/clear expiry in one call (edit modal sends both fields)
create or replace function public.update_platform_key(p_key_id uuid, p_name text, p_expires_at timestamptz)
returns void
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'Name is required';
  end if;

  update public.platform_keys
  set name = trim(p_name), expires_at = p_expires_at
  where id = p_key_id and user_id = auth.uid() and revoked = false;

  if not found then
    raise exception 'Key not found';
  end if;
end;
$$;

-- Revoke (soft delete, keeps validate_platform_key's audit trail intact)
create or replace function public.revoke_platform_key(p_key_id uuid)
returns void
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  update public.platform_keys
  set revoked = true
  where id = p_key_id and user_id = auth.uid() and revoked = false;

  if not found then
    raise exception 'Key not found';
  end if;
end;
$$;

grant execute on function public.update_platform_key(uuid, text, timestamptz) to authenticated;
grant execute on function public.revoke_platform_key(uuid) to authenticated;
revoke execute on function public.update_platform_key(uuid, text, timestamptz) from anon, public;
revoke execute on function public.revoke_platform_key(uuid) from anon, public;
