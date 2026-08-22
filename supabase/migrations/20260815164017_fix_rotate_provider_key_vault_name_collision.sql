CREATE OR REPLACE FUNCTION public.rotate_provider_key(p_key_id uuid, p_new_api_key text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'vault'
AS $function$
declare
  v_secret_id uuid;
begin
  if p_new_api_key is null or length(trim(p_new_api_key)) = 0 then
    raise exception 'API key is required';
  end if;

  select vault_secret_id into v_secret_id
  from public.key_labels
  where id = p_key_id and user_id = auth.uid() and is_active;

  if v_secret_id is null then
    raise exception 'Key not found';
  end if;

  -- Only update the secret value. Do NOT pass the label as the vault name —
  -- vault.secrets.name is unique across ALL users, so writing the raw label
  -- there caused rotation to collide whenever any two keys anywhere shared
  -- a label. Passing NULL leaves the existing (already-unique) vault name
  -- untouched, per vault.update_secret's coalesce(new_name, s.name) behavior.
  perform vault.update_secret(v_secret_id, trim(p_new_api_key));
end;
$function$;
