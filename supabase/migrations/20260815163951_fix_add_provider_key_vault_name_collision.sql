CREATE OR REPLACE FUNCTION public.add_provider_key(
  p_label text,
  p_provider text,
  p_api_key text,
  p_custom_base_url text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'vault', 'pg_temp'
AS $function$
declare
  v_secret_id uuid;
  v_key_id uuid;
  v_vault_name text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if p_label is null or length(trim(p_label)) = 0 then
    raise exception 'Label is required';
  end if;

  if p_api_key is null or length(trim(p_api_key)) = 0 then
    raise exception 'API key is required';
  end if;

  -- Vault's "name" column is globally unique across ALL users, not scoped
  -- per user. Using the raw label directly (e.g. "test") would collide the
  -- moment any two users (or the same user twice) pick the same label.
  -- Generate a globally-unique vault name instead; the human-readable label
  -- is already stored separately in key_labels.label for display/routing.
  v_vault_name := auth.uid()::text || ':' || gen_random_uuid()::text;

  v_secret_id := vault.create_secret(p_api_key, v_vault_name);

  insert into public.key_labels (user_id, label, provider, custom_base_url, vault_secret_id)
  values (auth.uid(), p_label, p_provider, p_custom_base_url, v_secret_id)
  returning id into v_key_id;

  return v_key_id;
end;
$function$;
