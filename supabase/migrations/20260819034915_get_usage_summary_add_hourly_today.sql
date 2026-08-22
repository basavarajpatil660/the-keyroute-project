-- Adds hourly "Today" support to get_usage_summary. Changing the parameter
-- list means this is technically a new function signature — CREATE OR REPLACE
-- alone would NOT replace get_usage_summary(integer), it would create a
-- second overload alongside it (the exact duplicate-overload bug already
-- documented as a known gotcha in this codebase). Dropping the old signature
-- explicitly first avoids that.
DROP FUNCTION IF EXISTS public.get_usage_summary(integer);

CREATE OR REPLACE FUNCTION public.get_usage_summary(
  p_range_days integer DEFAULT 7,
  p_granularity text DEFAULT 'day'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_end_ts timestamptz := now() at time zone 'utc';
  v_start_ts timestamptz;
  v_summary jsonb;
  v_interval interval;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated' USING ERRCODE = '42501';
  END IF;

  IF p_granularity NOT IN ('day', 'hour') THEN
    RAISE EXCEPTION 'p_granularity must be ''day'' or ''hour''' USING ERRCODE = '22023';
  END IF;

  v_interval := CASE WHEN p_granularity = 'hour' THEN '1 hour' ELSE '1 day' END::interval;

  IF p_granularity = 'hour' THEN
    v_start_ts := date_trunc('day', v_end_ts);
  ELSE
    v_start_ts := date_trunc('day', v_end_ts) - ((p_range_days - 1) || ' days')::interval;
  END IF;

  WITH daily_series AS (
    SELECT
      gs.bucket,
      COALESCE(ul.requests, 0) AS requests,
      COALESCE(ul.errors, 0) AS errors
    FROM generate_series(v_start_ts, v_end_ts, v_interval) gs(bucket)
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*) AS requests,
        COUNT(*) FILTER (WHERE status_code >= 400) AS errors
      FROM usage_logs
      WHERE user_id = v_user_id
        AND created_at >= gs.bucket
        AND created_at < gs.bucket + v_interval
    ) ul ON true
  ),
  totals AS (
    SELECT
      COUNT(*) AS total_requests,
      COUNT(*) FILTER (WHERE status_code >= 400) AS total_errors,
      ROUND(
        100.0 * COUNT(*) FILTER (WHERE status_code >= 400) / NULLIF(COUNT(*), 0),
        2
      ) AS error_rate,
      ROUND(AVG(latency_ms)::numeric, 2) AS avg_latency_ms
    FROM usage_logs
    WHERE user_id = v_user_id
      AND created_at >= v_start_ts
      AND created_at < v_end_ts + interval '1 second'
  )
  SELECT jsonb_build_object(
    'total_requests', t.total_requests,
    'total_errors', t.total_errors,
    'error_rate', t.error_rate,
    'avg_latency_ms', t.avg_latency_ms,
    'daily_series', (
      SELECT jsonb_agg(jsonb_build_object(
        'day', ds.bucket,
        'requests', ds.requests,
        'errors', ds.errors
      ) ORDER BY ds.bucket ASC)
      FROM daily_series ds
    )
  )
  INTO v_summary
  FROM totals t;

  RETURN COALESCE(v_summary, jsonb_build_object(
    'total_requests', 0,
    'total_errors', 0,
    'error_rate', 0,
    'avg_latency_ms', 0,
    'daily_series', '[]'::jsonb
  ));
END;
$$;

REVOKE ALL ON FUNCTION public.get_usage_summary(integer, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_usage_summary(integer, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_usage_summary(integer, text) TO authenticated;
