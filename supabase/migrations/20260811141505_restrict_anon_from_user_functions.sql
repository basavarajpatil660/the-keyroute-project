revoke execute on function public.create_platform_key(text) from anon;
revoke execute on function public.upsert_supabase_connection(text, text) from anon;

grant execute on function public.create_platform_key(text) to authenticated;
grant execute on function public.upsert_supabase_connection(text, text) to authenticated;
