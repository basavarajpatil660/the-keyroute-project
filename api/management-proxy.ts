// Same-origin proxy for the Supabase Management API's SQL endpoint.
//
// The Deploy Gateway flow runs every migration file in supabase/migrations
// against the user's project via POST /v1/projects/{ref}/database/query.
// This endpoint accepts exactly one shape - { ref, sql } - and nothing else,
// so the pasted personal access token can only ever be used to run SQL the
// dashboard itself chose to send.
//
// Runs unchanged as a Vercel edge function AND inside the Vite dev server
// (see vite.config.ts) - plain Web Request/Response in, Response out.
import {
  forward,
  handleProxyRequest,
  isValidProjectRef,
  json,
  readJsonBody,
} from './_proxy-shared.ts'

export const config = { runtime: 'edge' }

export default async function handler(req: Request): Promise<Response> {
  return handleProxyRequest(req, async (pat) => {
    const body = await readJsonBody(req)
    if (!body) {
      return json({ error: { message: 'Request body must be valid JSON' } }, 400)
    }

    const { ref, sql } = body
    if (!isValidProjectRef(ref)) {
      return json({ error: { message: 'A valid project ref is required (20-character Supabase project ref)' } }, 400)
    }
    if (typeof sql !== 'string' || sql.trim().length === 0) {
      return json({ error: { message: 'A non-empty "sql" string is required' } }, 400)
    }

    return forward(pat, `/v1/projects/${ref}/database/query`, {
      method: 'POST',
      body: { query: sql },
    })
  })
}
