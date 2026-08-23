// Same-origin proxy for the Supabase auth config endpoint.
//
// Fresh Supabase projects default to "confirm email" on signup, which would
// leave Keyroute's silent owner account without a session (it has no inbox
// to click confirmation links). During Deploy Gateway this endpoint flips
// mailer_autoconfirm on via PATCH /v1/projects/{ref}/config/auth while the
// pasted personal access token is still held in memory.
//
// Runs unchanged as a Vercel edge function AND inside the Vite dev server
// (see vite.config.ts).
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

    const { ref, config: authConfig } = body
    if (!isValidProjectRef(ref)) {
      return json({ error: { message: 'A valid project ref is required (20-character Supabase project ref)' } }, 400)
    }
    if (!authConfig || typeof authConfig !== 'object' || Array.isArray(authConfig)) {
      return json({ error: { message: 'A "config" object is required' } }, 400)
    }

    return forward(pat, `/v1/projects/${ref}/config/auth`, {
      method: 'PATCH',
      body: authConfig,
    })
  })
}
