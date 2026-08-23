// Shared plumbing for the three same-origin /api proxies
// (management-proxy, deploy-function-proxy, auth-config-proxy).
//
// WHY THESE EXIST: the browser needs to call the Supabase Management API
// (https://api.supabase.com) with the user's personal access token to run the
// one-click Deploy Gateway flow. Routing those calls through same-origin /api
// endpoints instead of hitting api.supabase.com directly keeps every request
// same-origin - no cross-origin preflight quirks on a third-party domain, and
// no ad-blocker false positives.
//
// RUNS IN TWO CONTEXTS, UNCHANGED:
// 1. Deployed to Vercel: each proxy file is an edge function (plain Web
//    Request/Response handler, exactly like api/v1/chat/completions.ts).
// 2. Locally via `npm run dev`: vite.config.ts registers a dev-server
//    middleware that calls these very handlers inside the Vite process -
//    no external relay service of any kind; requests never leave the user's
//    machine except to reach api.supabase.com itself.
//
// Everything here uses only standard fetch/Request/Response APIs, which are
// available in both edge runtimes and Node 18+.

export const SUPABASE_MANAGEMENT_API = 'https://api.supabase.com'

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
}

export function preflight(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

export function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  })
}

export async function readJsonBody(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await req.json()
    if (body && typeof body === 'object' && !Array.isArray(body)) {
      return body as Record<string, unknown>
    }
    return null
  } catch {
    return null
  }
}

export function extractAccessToken(req: Request): string | null {
  const header = req.headers.get('authorization') || ''
  const token = header.replace(/^Bearer\s+/i, '').trim()
  return token || null
}

// Supabase project refs are exactly 20 lowercase alphanumeric characters.
export function isValidProjectRef(ref: unknown): ref is string {
  return typeof ref === 'string' && /^[a-z0-9]{20}$/.test(ref)
}

// Forwards one request to the Management API and passes the upstream status +
// body straight back to the browser (with CORS added). Uses plain fetch() so
// it behaves identically under Vercel's edge runtime and plain Node.
//
// A FormData body bypasses JSON serialization AND skips the manual
// Content-Type header entirely — fetch generates the multipart boundary
// itself. Hand-setting Content-Type on a FormData body is what produces
// "Invalid multipart boundary" errors on /functions/deploy.
//
// Only NETWORK-level failures throw here - HTTP error statuses still come
// back as a normal Response so callers can surface the upstream message.
export async function forward(
  pat: string,
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<Response> {
  const isMultipart = typeof FormData !== 'undefined' && init?.body instanceof FormData
  let upstream: Response
  try {
    upstream = await fetch(`${SUPABASE_MANAGEMENT_API}${path}`, {
      method: init?.method ?? 'POST',
      headers: isMultipart
        ? { Authorization: `Bearer ${pat}` }
        : {
            Authorization: `Bearer ${pat}`,
            'Content-Type': 'application/json',
          },
      body: isMultipart
        ? (init?.body as FormData)
        : init?.body !== undefined
          ? JSON.stringify(init.body)
          : undefined,
    })
  } catch {
    throw new Error(
      `Could not reach ${SUPABASE_MANAGEMENT_API}${path} from the server side. Check this machine's internet connection and retry.`
    )
  }

  const text = await upstream.text()
  return new Response(text, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('content-type') || 'application/json',
      ...CORS_HEADERS,
    },
  })
}

// Common envelope for all three proxies: CORS preflight, method check, PAT
// extraction, and network-failure-to-502 mapping. The `run` callback returns
// the forwarded upstream Response.
export async function handleProxyRequest(
  req: Request,
  run: (pat: string) => Promise<Response>,
): Promise<Response> {
  if (req.method === 'OPTIONS') return preflight()
  if (req.method !== 'POST') {
    return json({ error: { message: 'Method not allowed' } }, 405)
  }
  const pat = extractAccessToken(req)
  if (!pat) {
    return json(
      { error: { message: 'Missing Authorization header (expected: Bearer sbp_)' } },
      401
    )
  }
  try {
    return await run(pat)
  } catch (err) {
    return json(
      { error: { message: err instanceof Error ? err.message : 'Upstream request failed' } },
      502
    )
  }
}
