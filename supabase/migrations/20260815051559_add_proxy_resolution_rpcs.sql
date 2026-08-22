-- validate_platform_key needs to also return the key's own id, so usage
-- logging can reference which platform key made the call.
drop function if exists public.validate_platform_key(text);

create or replace function public.validate_platform_key(p_plain_key text)
returns table(user_id uuid, key_id uuid)
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

  select id, platform_keys.user_id, expires_at into v_key_id, v_user_id, v_expires_at
  from public.platform_keys
  where key_hash = v_hash and revoked = false;

  if v_user_id is null then
    return;
  end if;

  if v_expires_at is not null and v_expires_at < now() then
    return;
  end if;

  update public.platform_keys set last_used_at = now() where id = v_key_id;

  return query select v_user_id, v_key_id;
end;
$function$;

-- The actual missing piece: given a user + a model string (possibly
-- "label/model" or just "model" when the user has exactly one active key),
-- resolve provider + custom_base_url + the DECRYPTED provider API key in
-- one call. This is the only place a provider key is ever decrypted.
create or replace function public.resolve_provider_key(p_user_id uuid, p_model text)
returns table(provider text, custom_base_url text, api_key text, resolved_model text, label text)
language plpgsql
security definer
set search_path = 'public', 'vault'
as $$
declare
  v_label text;
  v_model text;
  v_secret_id uuid;
  v_provider text;
  v_custom_base_url text;
  v_key text;
  v_count int;
  v_slash_pos int;
begin
  v_slash_pos := position('/' in p_model);

  if v_slash_pos > 0 then
    v_label := substring(p_model from 1 for v_slash_pos - 1);
    v_model := substring(p_model from v_slash_pos + 1);
  else
    -- No prefix: only auto-select if the user has exactly one active key overall.
    select count(*), max(key_labels.label) into v_count, v_label
    from public.key_labels
    where user_id = p_user_id and is_active;

    if v_count <> 1 then
      return; -- 0 or 2+ keys: ambiguous, caller must require an explicit label prefix
    end if;
    v_model := p_model;
  end if;

  select vault_secret_id, key_labels.provider, key_labels.custom_base_url
  into v_secret_id, v_provider, v_custom_base_url
  from public.key_labels
  where user_id = p_user_id and key_labels.label = v_label and is_active
  limit 1;

  if v_secret_id is null then
    return; -- label not found for this user
  end if;

  select decrypted_secret into v_key from vault.decrypted_secrets where id = v_secret_id;

  return query select v_provider, v_custom_base_url, v_key, v_model, v_label;
end;
$$;

revoke all on function public.validate_platform_key(text) from public, anon, authenticated;
revoke all on function public.resolve_provider_key(uuid, text) from public, anon, authenticated;
grant execute on function public.validate_platform_key(text) to service_role;
grant execute on function public.resolve_provider_key(uuid, text) to service_role;
