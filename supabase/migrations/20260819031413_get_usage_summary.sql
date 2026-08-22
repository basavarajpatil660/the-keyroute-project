CREATE OR REPLACE FUNCTION public.get_usage_summary(p_range_days integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_start_date date := (now() at time zone 'utc')::date - (p_range_days || ' days')::interval;
  v_end_date date := (now() at time zone 'utc')::date;
  v_summary jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated' USING ERRCODE = '42501';
  END IF;

  WITH daily_series AS (
    SELECT
      gs.day::date AS day,
      COALESCE(ul.requests, 0) AS requests,
      COALESCE(ul.errors, 0) AS errors
    FROM generate_series(v_start_date, v_end_date, '1 day'::interval) gs(day)
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*) AS requests,
        COUNT(*) FILTER (WHERE status_code >= 400) AS errors
      FROM usage_logs
      WHERE user_id = v_user_id
        AND created_at >= gs.day
        AND created_at < gs.day + '1 day'::interval
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
      AND created_at >= v_start_date
      AND created_at < v_end_date + '1 day'::interval
  )
  SELECT jsonb_build_object(
    'total_requests', t.total_requests,
    'total_errors', t.total_errors,
    'error_rate', t.error_rate,
    'avg_latency_ms', t.avg_latency_ms,
    'daily_series', (
      SELECT jsonb_agg(jsonb_build_object(
        'day', ds.day,
        'requests', ds.requests,
        'errors', ds.errors
      ) ORDER BY ds.day ASC)
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

-- Lock down privileges to match the rest of the codebase's RPCs exactly:
-- revoke the default PUBLIC execute grant first, THEN grant only to authenticated.
-- Revoking from anon alone is not sufficient — anon inherits execute via PUBLIC
-- unless PUBLIC itself is revoked.
REVOKE ALL ON FUNCTION public.get_usage_summary(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_usage_summary(integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_usage_summary(integer) TO authenticated;
