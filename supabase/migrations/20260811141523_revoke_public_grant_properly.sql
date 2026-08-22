revoke execute on function public.create_platform_key(text) from public;
revoke execute on function public.upsert_supabase_connection(text, text) from public;

-- re-affirm authenticated-only access
grant execute on function public.create_platform_key(text) to authenticated;
grant execute on function public.upsert_supabase_connection(text, text) to authenticated;
