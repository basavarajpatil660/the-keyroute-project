// Same-origin proxy for deploying the gateway edge function.
//
// The Management API's POST /v1/projects/{ref}/functions/deploy expects a
// real multipart/form-data body — NOT JSON:
//   - a "metadata" part holding a JSON STRING ({name, entrypoint_path, ...})
//   - one "file" part per source file, each part carrying its filename
// (https://supabase.com/docs/reference/api/v1-deploy-a-function)
//
// This proxy accepts the dashboard's small JSON payload and converts it into
// that FormData server-side. FormData/Blob are globals in BOTH runtimes this
// runs in — Vercel edge functions and the Vite dev-server's plain Node — so
// no dependencies and no context-specific code paths. fetch() sets the
// multipart boundary itself; the forwarded request carries NO manual
// Content-Type header (hand-setting one is what causes "Invalid multipart
// boundary" errors).
//
// verify_jwt must stay false: gateway callers authenticate with platform
// keys (Bearer pk_live_...), not Supabase JWTs — mirrored in config.toml.
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

    const { ref, slug, verify_jwt, metadata, files } = body
    if (!isValidProjectRef(ref)) {
      return json({ error: { message: 'A valid project ref is required (20-character Supabase project ref)' } }, 400)
    }
    if (typeof slug !== 'string' || slug.trim().length === 0) {
      return json({ error: { message: 'A non-empty "slug" string is required' } }, 400)
    }
    if (!Array.isArray(files) || files.length === 0) {
      return json({ error: { message: 'A non-empty "files" array is required' } }, 400)
    }
    for (const f of files) {
      if (
        !f || typeof f !== 'object' ||
        typeof (f as { name?: unknown }).name !== 'string' ||
        typeof (f as { content?: unknown }).content !== 'string'
      ) {
        return json({ error: { message: 'Every file needs string "name" and "content" fields' } }, 400)
      }
    }

    const entrypointPath =
      metadata && typeof metadata === 'object' && !Array.isArray(metadata)
        ? (metadata as { entrypoint_path?: unknown }).entrypoint_path
        : undefined

    // Build the multipart body exactly as the endpoint documents it:
    // metadata as a stringified-JSON field, files as Blob parts with filenames.
    const form = new FormData()
    form.append(
      'metadata',
      JSON.stringify({
        name: slug,
        entrypoint_path: typeof entrypointPath === 'string' && entrypointPath.length > 0 ? entrypointPath : 'index.ts',
        ...(verify_jwt === undefined ? {} : { verify_jwt: Boolean(verify_jwt) }),
      })
    )
    for (const f of files as { name: string; content: string }[]) {
      form.append('file', new Blob([f.content], { type: 'application/typescript' }), f.name)
    }

    return forward(pat, `/v1/projects/${ref}/functions/deploy?slug=${encodeURIComponent(slug)}`, {
      method: 'POST',
      body: form,
    })
  })
}
