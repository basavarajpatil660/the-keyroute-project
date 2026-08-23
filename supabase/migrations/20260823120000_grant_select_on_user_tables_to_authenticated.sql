-- Grant authenticated users SELECT on the four user-data tables the dashboard
-- reads directly through PostgREST. Each table already has a correctly scoped
-- RLS policy ("own <thing>": auth.uid() = user_id), but the authenticated role
-- had NO table-level grants at all, so Postgres rejected every direct read
-- with SQLSTATE 42501 ("permission denied for table ...") before RLS was ever
-- evaluated. Writes kept working throughout because they all go through
-- security-definer RPCs (upsert_supabase_connection, create_platform_key,
-- rotate/delete RPCs, log_usage), which run with their owner's privileges and
-- never consult these grants.
--
-- Per-table rationale:
--   supabase_connections — ConnectionsPage .from("supabase_connections")
--     reads connection status directly.
--   usage_logs           — OverviewPage and UsagePage read usage rows
--     directly (the get_usage_summary / get_activity_summary RPCs cover the
--     aggregate views, but raw per-request lists are direct selects).
--   key_labels           — KeysPage and OverviewPage list key labels
--     directly; mutations go through add/rotate provider-key RPCs.
--   platform_keys        — SettingsPage lists key metadata (hash/prefix only,
--     never plaintext) directly; creation/revocation go through RPCs.
--
-- Only SELECT is granted here: INSERT/UPDATE/DELETE intentionally stay behind
-- those security-definer RPCs, matching how this schema exposes mutations.
-- RLS continues to scope every returned row to its owner.

grant select on public.supabase_connections to authenticated;
grant select on public.usage_logs to authenticated;
grant select on public.key_labels to authenticated;
grant select on public.platform_keys to authenticated;
