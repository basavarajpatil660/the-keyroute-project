-- Generate a new unified platform API key for the current user.
-- Returns the PLAINTEXT key once — caller must show it to the user immediately
-- and never persist it themselves; only the hash is stored in the DB.
create or replace function public.create_platform_key(p_name text default null)
returns table(id uuid, plaintext_key text, key_prefix text)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_random text;
  v_plain text;
  v_prefix text;
  v_hash text;
  v_id uuid;
begin
  v_random := encode(extensions.gen_random_bytes(24), 'hex');
  v_plain := 'pk_live_' || v_random;
  v_prefix := 'pk_live_' || substr(v_random, 1, 8);
  v_hash := encode(extensions.digest(v_plain, 'sha256'), 'hex');

  insert into public.platform_keys (user_id, key_hash, key_prefix, name)
  values (auth.uid(), v_hash, v_prefix, p_name)
  returning platform_keys.id into v_id;

  return query select v_id, v_plain, v_prefix;
end;
$$;

-- Validate an incoming platform key (called by the proxy backend with service_role).
-- Returns the owning user_id if valid and not revoked, and bumps last_used_at.
create or replace function public.validate_platform_key(p_plain_key text)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_hash text;
  v_user_id uuid;
  v_key_id uuid;
begin
  v_hash := encode(extensions.digest(p_plain_key, 'sha256'), 'hex');

  select id, user_id into v_key_id, v_user_id
  from public.platform_keys
  where key_hash = v_hash and revoked = false;

  if v_user_id is null then
    return null;
  end if;

  update public.platform_keys set last_used_at = now() where id = v_key_id;

  return v_user_id;
end;
$$;

revoke all on function public.validate_platform_key(text) from public, anon, authenticated;
grant execute on function public.validate_platform_key(text) to service_role;

-- Resolve "key-label/model-name" style routing for a given user.
-- Returns provider + custom base url (if any) so the proxy knows where to send the request.
create or replace function public.resolve_key_label(p_user_id uuid, p_label text)
returns table(provider text, custom_base_url text)
language sql
security definer
set search_path = public
as $$
  select provider, custom_base_url
  from public.key_labels
  where user_id = p_user_id and label = p_label and is_active = true
  limit 1;
$$;

revoke all on function public.resolve_key_label(uuid, text) from public, anon, authenticated;
grant execute on function public.resolve_key_label(uuid, text) to service_role;

-- If the user has exactly one active key for a provider, auto-detect it when
-- they omit the label prefix (e.g. just "gpt-4o" instead of "openai-work/gpt-4o").
create or replace function public.auto_detect_label(p_user_id uuid, p_provider text)
returns text
language sql
security definer
set search_path = public
as $$
  select label
  from public.key_labels
  where user_id = p_user_id and provider = p_provider and is_active = true
  order by created_at asc
  limit 2
$$;

-- Log a completed request for usage/billing tracking.
create or replace function public.log_usage(
  p_user_id uuid,
  p_platform_key_id uuid,
  p_label text,
  p_provider text,
  p_model text,
  p_status_code int,
  p_latency_ms int,
  p_prompt_tokens int default null,
  p_completion_tokens int default null,
  p_error_message text default null
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.usage_logs (
    user_id, platform_key_id, label_used, provider, model,
    status_code, latency_ms, prompt_tokens, completion_tokens, error_message
  ) values (
    p_user_id, p_platform_key_id, p_label, p_provider, p_model,
    p_status_code, p_latency_ms, p_prompt_tokens, p_completion_tokens, p_error_message
  );
$$;

revoke all on function public.log_usage(uuid, uuid, text, text, text, int, int, int, int, text) from public, anon, authenticated;
grant execute on function public.log_usage(uuid, uuid, text, text, text, int, int, int, int, text) to service_role;
