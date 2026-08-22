-- Enable Realtime Postgres Changes on usage_logs so the live line chart can
-- subscribe to new INSERTs as requests come through the proxy. RLS on
-- usage_logs already restricts rows to their owner, and Realtime honors
-- RLS for Postgres Changes, so no additional access-control work is needed.
alter publication supabase_realtime add table public.usage_logs;
