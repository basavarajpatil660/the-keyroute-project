revoke execute on function public.rename_provider_key(uuid, text) from anon;
revoke execute on function public.rotate_provider_key(uuid, text) from anon;
revoke execute on function public.delete_provider_key(uuid) from anon;
revoke execute on function public.disconnect_supabase_connection() from anon;
revoke execute on function public.rename_provider_key(uuid, text) from public;
revoke execute on function public.rotate_provider_key(uuid, text) from public;
revoke execute on function public.delete_provider_key(uuid) from public;
revoke execute on function public.disconnect_supabase_connection() from public;
