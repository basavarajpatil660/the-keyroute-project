alter table public.key_labels
  add column if not exists vault_secret_id uuid;

create or replace function public.add_provider_key(
  p_label text,
  p_provider text,
  p_api_key text,
  p_custom_base_url text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, vault, pg_temp
as $$
declare
  v_secret_id uuid;
  v_key_id uuid;
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

  v_secret_id := vault.create_secret(p_api_key, p_label);

  insert into public.key_labels (user_id, label, provider, custom_base_url, vault_secret_id)
  values (auth.uid(), p_label, p_provider, p_custom_base_url, v_secret_id)
  returning id into v_key_id;

  return v_key_id;
end;
$$;

revoke all on function public.add_provider_key(text, text, text, text) from public;
grant execute on function public.add_provider_key(text, text, text, text) to authenticated;
