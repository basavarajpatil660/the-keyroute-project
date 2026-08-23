// Same-origin proxy for deploying the gateway edge function.
//
// Forwards to the Supabase Management API's
// POST /v1/projects/{ref}/functions/deploy with the bundled gateway source
// (supabase/functions/gateway/index.ts, imported ?raw by deploy-gateway.ts).
// verify_jwt must be false: gateway callers authenticate with platform keys
// (Bearer pk_live_...), not Supabase JWTs - mirrored in supabase/config.toml.
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

    const { ref, slug, files, metadata } = body
    if (!isValidProjectRef(ref)) {
      return json({ error: { message: 'A valid project ref is required (20-character Supabase project ref)' } }, 400)
    }
    if (typeof slug !== 'string' || slug.trim().length === 0) {
      return json({ error: { message: 'A non-empty "slug" string is required' } }, 400)
    }
    if (!Array.isArray(files) || files.length === 0) {
      return json({ error: { message: 'A non-empty "files" array is required' } }, 400)
    }

    return forward(pat, `/v1/projects/${ref}/functions/deploy`, {
      method: 'POST',
      body: {
        slug,
        verify_jwt: false,
        metadata: metadata ?? { entrypoint_path: 'index.ts' },
        files,
      },
    })
  })
}
