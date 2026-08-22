CREATE OR REPLACE FUNCTION public.upsert_supabase_connection(p_project_url text, p_service_key text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if p_project_url is null or length(trim(p_project_url)) = 0 then
    raise exception 'Project URL is required';
  end if;

  if p_project_url !~ '^https://[a-z0-9-]+\.supabase\.co/?$' then
    raise exception 'Project URL must be a valid Supabase project URL (https://<ref>.supabase.co)';
  end if;

  if p_service_key is null or length(trim(p_service_key)) < 20 then
    raise exception 'Service key is required and looks too short to be valid';
  end if;

  insert into public.supabase_connections (user_id, project_url, service_key_encrypted)
  values (auth.uid(), trim(p_project_url), private.encrypt_service_key(p_service_key))
  on conflict (user_id) where is_active
  do update set
    project_url = excluded.project_url,
    service_key_encrypted = excluded.service_key_encrypted,
    updated_at = now()
  returning id into v_id;

  return v_id;
end;
$function$
