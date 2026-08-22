// Keyroute gateway — Supabase Edge Function (Deno runtime).
//
// This is the entire data plane of the gateway. Once deployed into a user's
// Supabase project it runs permanently and independently — the React dashboard
// is a control panel only and never needs to be running for this to work.
//
// Invocable at: https://<project-ref>.supabase.co/functions/v1/gateway
// (also accepts the /chat/completions suffix so OpenAI-compatible SDKs can use
// the function URL directly as their base_url).
//
// Environment: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected
// automatically by the Supabase Edge runtime for every function in the
// project. Nothing is read from or required by the frontend app.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Keeps background work (usage logging) alive after the response has been
// returned — the Edge Functions equivalent of Vercel's waitUntil().
function waitUntil(promise: Promise<unknown>) {
  const runtime = (globalThis as { EdgeRuntime?: { waitUntil: (p: Promise<unknown>) => void } }).EdgeRuntime
  if (runtime?.waitUntil) {
    runtime.waitUntil(promise)
  } else {
    promise.catch(() => {}) // fire-and-forget fallback (e.g. local `serve` testing)
  }
}

// OpenAI-compatible chat/completions endpoints. Gemini's is Google's own
// OpenAI-compatibility layer, not the native Gemini API shape.
const PROVIDER_ENDPOINTS: Record<string, string> = {
  openai: 'https://api.openai.com/v1/chat/completions',
  groq: 'https://api.groq.com/openai/v1/chat/completions',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
}

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
}

interface LogUsageArgs {
  userId: string
  platformKeyId: string
  label: string | null
  provider: string | null
  model: string
  statusCode: number
  latencyMs: number
  promptTokens?: number | null
  completionTokens?: number | null
  errorMessage?: string | null
  tokensEstimated?: boolean
}

async function logUsage(supabase: ReturnType<typeof createClient>, a: LogUsageArgs) {
  try {
    await supabase.rpc('log_usage', {
      p_user_id: a.userId,
      p_platform_key_id: a.platformKeyId,
      p_label: a.label,
      p_provider: a.provider,
      p_model: a.model,
      p_status_code: a.statusCode,
      p_latency_ms: a.latencyMs,
      p_prompt_tokens: a.promptTokens ?? null,
      p_completion_tokens: a.completionTokens ?? null,
      p_error_message: a.errorMessage ?? null,
      p_tokens_estimated: a.tokensEstimated ?? false,
    })
  } catch (err) {
    // Never let a logging failure break the actual response to the caller.
    console.error('log_usage failed', err)
  }
}

// Rough token estimate when a provider doesn't report real usage (Mistral,
// so far). Not billing-accurate — just the standard ~4 chars/token rule of
// thumb for English text. Good enough for a dashboard number, not a lawyer.
function estimateTokens(text: string): number {
  return Math.max(1, Math.round(text.length / 4))
}

function estimatePromptTokens(messages: unknown): number {
  if (!Array.isArray(messages)) return 0
  let totalChars = 0
  for (const m of messages) {
    const content = (m as { content?: unknown })?.content
    if (typeof content === 'string') totalChars += content.length
  }
  return totalChars > 0 ? Math.max(1, Math.round(totalChars / 4)) : 0
}

// Passes SSE bytes straight through to the client, completely unaltered —
// this transform sits directly in the response pipeline, so it's
// guaranteed to run to completion (including onUsage) before the response
// finishes, with no reliance on background/waitUntil execution that Edge
// runtimes may or may not keep alive after the response is returned.
//
// Watches for the final chunk's `usage` object, present when the upstream
// request included stream_options: { include_usage: true } (supported by
// OpenAI and Groq). Also accumulates the actual streamed completion text as
// a fallback estimate for providers (Mistral, confirmed) that ignore that
// flag and never send real usage — real numbers are always preferred over
// the estimate when both are available.
function createUsageCapturingTransform(
  onUsage: (usage: { promptTokens: number | null; completionTokens: number | null; estimated: boolean }) => void
) {
  let buffer = ''
  let realPromptTokens: number | null = null
  let realCompletionTokens: number | null = null
  let completionText = ''
  const decoder = new TextDecoder()

  return new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      controller.enqueue(chunk) // pass through untouched, first and always

      buffer += decoder.decode(chunk, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? '' // keep any incomplete trailing line for next chunk

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        const payload = trimmed.slice(5).trim()
        if (payload === '[DONE]' || payload === '') continue
        try {
          const parsed = JSON.parse(payload)
          if (parsed?.usage) {
            realPromptTokens = parsed.usage.prompt_tokens ?? realPromptTokens
            realCompletionTokens = parsed.usage.completion_tokens ?? realCompletionTokens
          }
          // Accumulate actual generated text as a fallback in case this
          // provider never sends a real usage object at all.
          const delta = parsed?.choices?.[0]?.delta?.content
          if (typeof delta === 'string') completionText += delta
        } catch {
          // Malformed/partial SSE line — normal mid-stream, ignore.
        }
      }
    },
    flush() {
      const haveReal = realPromptTokens !== null && realCompletionTokens !== null
      onUsage({
        promptTokens: realPromptTokens,
        completionTokens: haveReal ? realCompletionTokens : estimateTokens(completionText),
        estimated: !haveReal,
      })
    },
  })
}

Deno.serve(async (req: Request): Promise<Response> => {
  const startedAt = Date.now()

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      },
    })
  }

  if (req.method !== 'POST') {
    return json({ error: { message: 'Method not allowed', type: 'invalid_request_error' } }, 405)
  }

  const authHeader = req.headers.get('authorization') || ''
  const platformKey = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!platformKey) {
    return json({ error: { message: 'Missing Authorization header (expected: Bearer pk_live_...)', type: 'authentication_error' } }, 401)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // --- Authenticate the platform key ---
  const { data: validation, error: validationError } = await supabase.rpc('validate_platform_key', {
    p_plain_key: platformKey,
  })
  const validRow = Array.isArray(validation) ? validation[0] : validation
  if (validationError || !validRow?.user_id) {
    return json({ error: { message: 'Invalid, revoked, or expired API key', type: 'authentication_error' } }, 401)
  }
  const userId: string = validRow.user_id
  const platformKeyId: string = validRow.key_id

  // --- Parse the request body ---
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: { message: 'Request body must be valid JSON', type: 'invalid_request_error' } }, 400)
  }

  const requestedModel: string | undefined = body?.model as string | undefined
  if (!requestedModel || typeof requestedModel !== 'string') {
    return json({ error: { message: '"model" is required, e.g. "openai-work/gpt-4o"', type: 'invalid_request_error' } }, 400)
  }

  // --- Resolve label -> provider + decrypted key ---
  const { data: resolved, error: resolveError } = await supabase.rpc('resolve_provider_key', {
    p_user_id: userId,
    p_model: requestedModel,
  })
  const r = Array.isArray(resolved) ? resolved[0] : resolved

  if (resolveError || !r?.api_key) {
    const msg = 'Could not resolve a provider key for that model. Prefix it with your key label, e.g. "openai-work/gpt-4o" — or add exactly one provider key to skip the prefix.'
    waitUntil(logUsage(supabase, {
      userId, platformKeyId, label: null, provider: null, model: requestedModel,
      statusCode: 400, latencyMs: Date.now() - startedAt, errorMessage: msg,
    }))
    return json({ error: { message: msg, type: 'invalid_request_error' } }, 400)
  }

  const { provider, custom_base_url, api_key, resolved_model, label } = r as {
    provider: string; custom_base_url: string | null; api_key: string; resolved_model: string; label: string
  }

  // --- Pick the upstream endpoint ---
  let upstreamUrl: string
  if (provider === 'custom') {
    if (!custom_base_url) {
      return json({ error: { message: 'This key has provider "custom" but no base URL was set', type: 'invalid_request_error' } }, 400)
    }
    upstreamUrl = custom_base_url.replace(/\/+$/, '') + '/chat/completions'
  } else if (provider === 'anthropic') {
    const msg = 'Anthropic routing is not implemented yet (message format differs from the OpenAI-compatible shape used here) — coming soon.'
    waitUntil(logUsage(supabase, {
      userId, platformKeyId, label, provider, model: resolved_model,
      statusCode: 501, latencyMs: Date.now() - startedAt, errorMessage: msg,
    }))
    return json({ error: { message: msg, type: 'not_implemented' } }, 501)
  } else if (PROVIDER_ENDPOINTS[provider]) {
    upstreamUrl = PROVIDER_ENDPOINTS[provider]
  } else {
    return json({ error: { message: `Unknown provider "${provider}"`, type: 'invalid_request_error' } }, 400)
  }

  // --- Forward the request, swapping in the resolved model + real key ---
  const upstreamBody = {
    ...body,
    model: resolved_model,
    // Ask for a final usage-bearing chunk on streamed requests. Supported
    // by OpenAI, Groq, and Mistral's OpenAI-compatible endpoints — if a
    // provider ignores unknown fields (most REST APIs do), this is a no-op
    // there and usage just stays null for that provider, nothing breaks.
    ...(body.stream ? { stream_options: { ...((body.stream_options as Record<string, unknown>) || {}), include_usage: true } } : {}),
  }

  let upstreamResponse: Response
  try {
    upstreamResponse = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${api_key}`,
      },
      body: JSON.stringify(upstreamBody),
    })
  } catch {
    waitUntil(logUsage(supabase, {
      userId, platformKeyId, label, provider, model: resolved_model,
      statusCode: 502, latencyMs: Date.now() - startedAt, errorMessage: 'Failed to reach upstream provider',
    }))
    return json({ error: { message: 'Failed to reach the provider. Try again shortly.', type: 'upstream_error' } }, 502)
  }

  const latencyMs = Date.now() - startedAt

  if (body.stream) {
    const usageTransform = createUsageCapturingTransform(({ promptTokens, completionTokens, estimated }) => {
      // This fires only after the LAST byte has already reached the client
      // — at that point the runtime may consider the request "done" and tear
      // down the isolate before a fire-and-forget fetch() finishes.
      // waitUntil() explicitly tells the runtime to keep this invocation
      // alive until the promise settles, so the log actually lands.
      waitUntil(logUsage(supabase, {
        userId, platformKeyId, label, provider, model: resolved_model,
        statusCode: upstreamResponse.status, latencyMs,
        promptTokens: promptTokens ?? estimatePromptTokens(body.messages),
        completionTokens,
        errorMessage: upstreamResponse.ok ? null : 'Upstream returned an error status',
        tokensEstimated: estimated,
      }))
    })

    const pipedStream = upstreamResponse.body
      ? upstreamResponse.body.pipeThrough(usageTransform)
      : upstreamResponse.body

    return new Response(pipedStream, {
      status: upstreamResponse.status,
      headers: {
        'Content-Type': upstreamResponse.headers.get('content-type') || 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }

  // Non-streaming: buffer once so we can pull token usage out for logging.
  const text = await upstreamResponse.text()
  let parsed: Record<string, unknown> | null = null
  try { parsed = JSON.parse(text) } catch { /* upstream returned non-JSON, pass through as-is */ }

  const parsedUsage = parsed?.usage as { prompt_tokens?: number; completion_tokens?: number } | undefined
  const parsedError = parsed?.error as { message?: string } | undefined

  waitUntil(logUsage(supabase, {
    userId, platformKeyId, label, provider, model: resolved_model,
    statusCode: upstreamResponse.status, latencyMs,
    promptTokens: parsedUsage?.prompt_tokens ?? null,
    completionTokens: parsedUsage?.completion_tokens ?? null,
    errorMessage: upstreamResponse.ok ? null : (parsedError?.message || 'Upstream returned an error status'),
    tokensEstimated: false,
  }))

  return new Response(text, {
    status: upstreamResponse.status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
})
