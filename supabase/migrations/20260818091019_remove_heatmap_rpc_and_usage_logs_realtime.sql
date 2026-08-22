-- Both the activity heatmap and the live line chart are being removed.
-- get_profile_summary and update_display_name stay — they power the
-- Profile section (name, rename, email, lifetime stats) which is being kept.

drop function if exists public.get_activity_heatmap(integer);

alter publication supabase_realtime drop table public.usage_logs;
