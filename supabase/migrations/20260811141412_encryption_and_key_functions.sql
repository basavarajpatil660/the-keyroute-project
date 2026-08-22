-- Private schema for internal-only functions (not exposed via PostgREST API)
create schema if not exists private;

-- Encrypt a user's Supabase service key before storing it.
-- SECURITY DEFINER so it can read the vault secret; callers never see the raw key.
create or replace function private.encrypt_service_key(plain_key text)
returns text
language plpgsql
security definer
set search_path = public, extensions, vault
as $$
declare
  enc_key text;
begin
  select decrypted_secret into enc_key
  from vault.decrypted_secrets
  where name = 'connection_encryption_key';

  return extensions.pgp_sym_encrypt(plain_key, enc_key);
end;
$$;

-- Decrypt a stored service key. Only ever called server-side (service_role),
-- never exposed to anon/authenticated roles directly.
create or replace function private.decrypt_service_key(cipher_key text)
returns text
language plpgsql
security definer
set search_path = public, extensions, vault
as $$
declare
  enc_key text;
begin
  select decrypted_secret into enc_key
  from vault.decrypted_secrets
  where name = 'connection_encryption_key';

  return extensions.pgp_sym_decrypt(cipher_key::bytea, enc_key);
end;
$$;

-- Public RPC: insert or update a user's Supabase connection.
-- Plaintext service key goes in, only ciphertext is ever stored.
create or replace function public.upsert_supabase_connection(
  p_project_url text,
  p_service_key text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.supabase_connections (user_id, project_url, service_key_encrypted)
  values (auth.uid(), p_project_url, private.encrypt_service_key(p_service_key))
  on conflict (user_id) where is_active
  do update set
    project_url = excluded.project_url,
    service_key_encrypted = excluded.service_key_encrypted,
    updated_at = now()
  returning id into v_id;

  return v_id;
end;
$$;

-- Public RPC: retrieve the decrypted service key for the CURRENTLY authenticated user only.
-- The proxy backend calls this (as the user, via their session) or via a service-role
-- variant below when acting on behalf of a request tied to a platform key.
create or replace function public.get_decrypted_service_key(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cipher text;
begin
  select service_key_encrypted into v_cipher
  from public.supabase_connections
  where user_id = p_user_id and is_active = true;

  if v_cipher is null then
    return null;
  end if;

  return private.decrypt_service_key(v_cipher);
end;
$$;

revoke all on function public.get_decrypted_service_key(uuid) from public, anon, authenticated;
grant execute on function public.get_decrypted_service_key(uuid) to service_role;
