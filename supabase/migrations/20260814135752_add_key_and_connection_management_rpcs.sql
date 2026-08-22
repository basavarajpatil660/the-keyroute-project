-- Fix: unique(user_id, label) should only apply to ACTIVE keys, so a
-- deleted label can be reused later (same pattern as supabase_connections).
alter table public.key_labels drop constraint key_labels_user_id_label_key;
create unique index key_labels_user_id_label_active_key
  on public.key_labels (user_id, label) where is_active;

-- Rename a key's label. Never touches the secret.
create or replace function public.rename_provider_key(p_key_id uuid, p_new_label text)
returns void
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  if p_new_label is null or length(trim(p_new_label)) = 0 then
    raise exception 'Label is required';
  end if;

  update public.key_labels
  set label = trim(p_new_label)
  where id = p_key_id and user_id = auth.uid() and is_active;

  if not found then
    raise exception 'Key not found';
  end if;
end;
$$;

-- Reset (rotate) the underlying secret in place — same vault_secret_id,
-- so the old value is overwritten and never returned to the client.
create or replace function public.rotate_provider_key(p_key_id uuid, p_new_api_key text)
returns void
language plpgsql
security definer
set search_path = 'public', 'vault'
as $$
declare
  v_secret_id uuid;
  v_label text;
begin
  if p_new_api_key is null or length(trim(p_new_api_key)) = 0 then
    raise exception 'API key is required';
  end if;

  select vault_secret_id, label into v_secret_id, v_label
  from public.key_labels
  where id = p_key_id and user_id = auth.uid() and is_active;

  if v_secret_id is null then
    raise exception 'Key not found';
  end if;

  perform vault.update_secret(v_secret_id, trim(p_new_api_key), v_label, null);
end;
$$;

-- Soft-delete a provider key (keeps usage_logs history intact, frees the label for reuse).
create or replace function public.delete_provider_key(p_key_id uuid)
returns void
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  update public.key_labels
  set is_active = false
  where id = p_key_id and user_id = auth.uid() and is_active;

  if not found then
    raise exception 'Key not found';
  end if;
end;
$$;

-- Disconnect the current active Supabase connection, so a fresh one can be added.
create or replace function public.disconnect_supabase_connection()
returns void
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  update public.supabase_connections
  set is_active = false, updated_at = now()
  where user_id = auth.uid() and is_active;

  if not found then
    raise exception 'No active connection';
  end if;
end;
$$;

grant execute on function public.rename_provider_key(uuid, text) to authenticated;
grant execute on function public.rotate_provider_key(uuid, text) to authenticated;
grant execute on function public.delete_provider_key(uuid) to authenticated;
grant execute on function public.disconnect_supabase_connection() to authenticated;
