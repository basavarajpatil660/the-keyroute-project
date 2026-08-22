-- get_activity_summary: server-side replacement for ActivityPage's client-side
-- aggregation. Previously the frontend fetched every raw usage_logs row in
-- range (no pagination, no limit) and reduced it in the browser — fine at a
-- few hundred rows, but doesn't scale. This does all bucketing/aggregation
-- in Postgres and returns only the small summarized shape the UI needs.
--
-- p_granularity: 'day' (default) buckets by calendar day across p_range_days.
--   'hour' ignores p_range_days and buckets the current UTC day into 24
--   hourly buckets — used for the "Today" view, since a single day bucketed
--   by day would just be one flat bar.
-- p_model: optional filter. NULL means all models. When set, request/token/
--   success/latency stats are scoped to that model, but model_breakdown
--   always reflects ALL models (unfiltered) so it stays useful as a
--   comparison view even while drilled into one model — matches the
--   existing frontend comment/behavior in ActivityPage.tsx.

CREATE OR REPLACE FUNCTION public.get_activity_summary(
  p_range_days integer DEFAULT 30,
  p_model text DEFAULT NULL,
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
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated' USING ERRCODE = '42501';
  END IF;

  IF p_granularity NOT IN ('day', 'hour') THEN
    RAISE EXCEPTION 'p_granularity must be ''day'' or ''hour''' USING ERRCODE = '22023';
  END IF;

  IF p_granularity = 'hour' THEN
    v_start_ts := date_trunc('day', v_end_ts);
  ELSE
    v_start_ts := date_trunc('day', v_end_ts) - ((p_range_days - 1) || ' days')::interval;
  END IF;

  WITH filtered_logs AS (
    SELECT *
    FROM usage_logs
    WHERE user_id = v_user_id
      AND created_at >= v_start_ts
      AND (p_model IS NULL OR model = p_model)
  ),
  time_series AS (
    SELECT
      gs.bucket,
      COALESCE(f.requests, 0) AS requests,
      COALESCE(f.prompt_tokens, 0) AS prompt_tokens,
      COALESCE(f.completion_tokens, 0) AS completion_tokens
    FROM generate_series(
      v_start_ts,
      v_end_ts,
      CASE WHEN p_granularity = 'hour' THEN '1 hour' ELSE '1 day' END::interval
    ) gs(bucket)
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*) AS requests,
        SUM(prompt_tokens) AS prompt_tokens,
        SUM(completion_tokens) AS completion_tokens
      FROM filtered_logs fl
      WHERE fl.created_at >= gs.bucket
        AND fl.created_at < gs.bucket + (CASE WHEN p_granularity = 'hour' THEN '1 hour' ELSE '1 day' END::interval)
    ) f ON true
  ),
  totals AS (
    SELECT
      COUNT(*) AS total_requests,
      COALESCE(SUM(prompt_tokens), 0) + COALESCE(SUM(completion_tokens), 0) AS total_tokens,
      ROUND(
        100.0 * COUNT(*) FILTER (WHERE status_code >= 200 AND status_code < 300) / NULLIF(COUNT(*), 0)
      ) AS success_rate,
      ROUND(AVG(latency_ms)::numeric) AS avg_latency_ms
    FROM filtered_logs
  ),
  -- Model breakdown is intentionally computed from the FULL unfiltered range
  -- (not filtered_logs) so it keeps working as a comparison view even while
  -- p_model narrows everything else — matches the existing frontend behavior.
  all_range_logs AS (
    SELECT *
    FROM usage_logs
    WHERE user_id = v_user_id
      AND created_at >= v_start_ts
  ),
  model_totals AS (
    SELECT COALESCE(model, 'unknown') AS model, COUNT(*) AS cnt
    FROM all_range_logs
    GROUP BY 1
    ORDER BY cnt DESC
  ),
  top_models AS (
    SELECT model FROM model_totals LIMIT 5
  ),
  model_buckets AS (
    SELECT
      gs.bucket,
      COALESCE(al.model, 'unknown') AS model,
      COUNT(*) AS cnt
    FROM generate_series(
      v_start_ts,
      v_end_ts,
      CASE WHEN p_granularity = 'hour' THEN '1 hour' ELSE '1 day' END::interval
    ) gs(bucket)
    LEFT JOIN all_range_logs al
      ON al.created_at >= gs.bucket
      AND al.created_at < gs.bucket + (CASE WHEN p_granularity = 'hour' THEN '1 hour' ELSE '1 day' END::interval)
    GROUP BY gs.bucket, COALESCE(al.model, 'unknown')
  ),
  model_breakdown AS (
    SELECT
      mb.bucket,
      jsonb_object_agg(
        CASE WHEN mb.model IN (SELECT model FROM top_models) THEN mb.model ELSE 'Other' END,
        mb.cnt
      ) AS values
    FROM model_buckets mb
    WHERE mb.cnt > 0
    GROUP BY mb.bucket
  ),
  top_labels AS (
    SELECT
      COALESCE(label_used, 'unlabeled') AS label,
      COUNT(*) AS requests,
      COALESCE(SUM(prompt_tokens), 0) + COALESCE(SUM(completion_tokens), 0) AS tokens
    FROM all_range_logs
    GROUP BY 1
    ORDER BY tokens DESC
    LIMIT 10
  )
  SELECT jsonb_build_object(
    'total_requests', t.total_requests,
    'total_tokens', t.total_tokens,
    'success_rate', COALESCE(t.success_rate, 0),
    'avg_latency_ms', t.avg_latency_ms,
    'time_series', (
      SELECT jsonb_agg(jsonb_build_object(
        'bucket', ts.bucket,
        'requests', ts.requests,
        'prompt_tokens', ts.prompt_tokens,
        'completion_tokens', ts.completion_tokens
      ) ORDER BY ts.bucket ASC)
      FROM time_series ts
    ),
    'model_breakdown', (
      SELECT jsonb_agg(jsonb_build_object(
        'bucket', gs.bucket,
        'values', COALESCE(mbk.values, '{}'::jsonb)
      ) ORDER BY gs.bucket ASC)
      FROM generate_series(
        v_start_ts,
        v_end_ts,
        CASE WHEN p_granularity = 'hour' THEN '1 hour' ELSE '1 day' END::interval
      ) gs(bucket)
      LEFT JOIN model_breakdown mbk ON mbk.bucket = gs.bucket
    ),
    'top_labels', (
      SELECT jsonb_agg(jsonb_build_object('label', tl.label, 'requests', tl.requests, 'tokens', tl.tokens))
      FROM top_labels tl
    ),
    'available_models', (
      SELECT jsonb_agg(mt.model ORDER BY mt.model)
      FROM model_totals mt
    )
  )
  INTO v_summary
  FROM totals t;

  RETURN v_summary;
END;
$$;

REVOKE ALL ON FUNCTION public.get_activity_summary(integer, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_activity_summary(integer, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_activity_summary(integer, text, text) TO authenticated;
