ALTER TABLE public.usage_logs
  ADD COLUMN tokens_estimated boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.log_usage(
  p_user_id uuid,
  p_platform_key_id uuid,
  p_label text,
  p_provider text,
  p_model text,
  p_status_code integer,
  p_latency_ms integer,
  p_prompt_tokens integer DEFAULT NULL::integer,
  p_completion_tokens integer DEFAULT NULL::integer,
  p_error_message text DEFAULT NULL::text,
  p_tokens_estimated boolean DEFAULT false
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  insert into public.usage_logs (
    user_id, platform_key_id, label_used, provider, model,
    status_code, latency_ms, prompt_tokens, completion_tokens, error_message,
    tokens_estimated
  ) values (
    p_user_id, p_platform_key_id, p_label, p_provider, p_model,
    p_status_code, p_latency_ms, p_prompt_tokens, p_completion_tokens, p_error_message,
    p_tokens_estimated
  );
$function$;
