-- delete_own_account: lets a user permanently delete their own account.
-- SECURITY DEFINER, scoped to auth.uid() — same tenant-isolation pattern as
-- every other RPC in this project.
--
-- What it does:
--   1. Deletes any Vault secrets tied to this user's key_labels. vault_secret_id
--      is NOT a real foreign key (checked pg_constraint — only a plain uuid
--      column), so ON DELETE CASCADE from profiles/key_labels will NOT clean
--      these up. Without this step, deleting an account would leave encrypted
--      provider API keys permanently orphaned in vault.secrets.
--   2. Deletes the auth.users row, which cascades (confirmed via pg_constraint,
--      confdeltype = 'c' on every relevant FK) through profiles ->
--      supabase_connections, key_labels, platform_keys, usage_logs.
--      auth.users' own child tables (sessions, refresh_tokens, identities)
--      cascade automatically as part of Supabase's built-in auth schema.
--
-- After calling this, the caller's session is invalidated (the user row is
-- gone) — the frontend must sign the user out / redirect immediately after
-- a successful call, since any further request with the old session will fail.

CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated' USING ERRCODE = '42501';
  END IF;

  -- Clean up orphan-prone Vault secrets BEFORE the cascade deletes key_labels
  -- out from under us (need the vault_secret_id values while they still exist).
  DELETE FROM vault.secrets
  WHERE id IN (
    SELECT vault_secret_id
    FROM key_labels
    WHERE user_id = v_user_id
      AND vault_secret_id IS NOT NULL
  );

  -- Deleting the auth.users row cascades through every public-schema table.
  DELETE FROM auth.users WHERE id = v_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_own_account() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_own_account() FROM anon;
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;
