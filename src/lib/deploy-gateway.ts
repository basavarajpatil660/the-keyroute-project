// One-click "Deploy Gateway" helpers.
//
// Provisions the user's OWN Supabase project via the Supabase Management API
// (https://api.supabase.com), using a personal access token (PAT) the user
// pastes in for this one action. The PAT is held only in React state for the
// duration of the request chain and discarded immediately afterwards — it is
// never written to Supabase, localStorage, sessionStorage, or any log, and is
// sent nowhere except api.supabase.com.
//
// Steps: apply every SQL file in supabase/migrations → deploy
// supabase/functions/gateway → poll the public function URL until it responds.

import gatewaySource from '../../supabase/functions/gateway/index.ts?raw'
import { provisionOwnerAccount } from './owner'

const MANAGEMENT_API = 'https://api.supabase.com'

export const GATEWAY_FUNCTION_SLUG = 'gateway'
export const GATEWAY_SOURCE_FILE = 'index.ts'

// Every .sql file in supabase/migrations is bundled automatically — adding a
// new migration to the folder is enough for the Deploy Gateway flow to pick
// it up; no code change needed here.
const migrationModules = import.meta.glob('../../supabase/migrations/*.sql', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export const GATEWAY_MIGRATIONS: { name: string; sql: string }[] = Object.entries(migrationModules)
  .map(([path, sql]) => ({
    name: path.split('/').pop() ?? path,
    sql,
  }))
  // Filenames are <utc-timestamp>_<name>.sql with fixed-width zero-padded
  // timestamps, so lexical order IS chronological application order.
  .sort((a, b) => a.name.localeCompare(b.name))

// Pulls the 20-char project ref out of a project URL like
// https://<ref>.supabase.co — returns null if it doesn't look like one.
export function extractProjectRef(projectUrl: string): string | null {
  try {
    const hostname = new URL(projectUrl.trim()).hostname
    const match = hostname.match(/^([a-z0-9]{20})\.supabase\.co$/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

export function gatewayFunctionUrl(ref: string): string {
  return `https://${ref}.supabase.co/functions/v1/${GATEWAY_FUNCTION_SLUG}`
}

async function managementFetch(pat: string, path: string, init?: RequestInit): Promise<Response> {
  let res: Response
  try {
    res = await fetch(`${MANAGEMENT_API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${pat}`,
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    })
  } catch {
    // fetch() only rejects here on NETWORK-level failures — HTTP error
    // statuses still return a Response below via readErrorMessage.
    throw new Error(
      `Network error calling ${init?.method ?? 'GET'} ${path} — this usually means a blocked request (ad-blocker/privacy extension), no internet connection, or a CORS preflight rejection. Check your browser's DevTools Network tab for the specific request to api.supabase.com.`
    )
  }
  return res
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json()
    const msg = body?.message || body?.error || body?.msg
    if (typeof msg === 'string' && msg.length > 0) return `${fallback} (${res.status}): ${msg}`
  } catch {
    // response wasn't JSON
  }
  return `${fallback} (${res.status} ${res.statusText})`
}

// Step 1 — run every migration SQL file against the project, in order.
// First failure stops the sequence so the UI can show exactly which file
// broke and why.
async function runMigrations(
  pat: string,
  ref: string,
  onStep: (step: string) => void,
): Promise<void> {
  for (const migration of GATEWAY_MIGRATIONS) {
    onStep(`Applying migration ${migration.name}…`)
    const res = await managementFetch(pat, `/v1/projects/${ref}/database/query`, {
      method: 'POST',
      body: JSON.stringify({ query: migration.sql }),
    })
    if (!res.ok) {
      throw new Error(await readErrorMessage(res, `Migration ${migration.name} failed`))
    }
  }
}

// Step 2 — deploy supabase/functions/gateway as an edge function named
// "gateway". verify_jwt must be false: callers authenticate with platform
// keys (Bearer pk_live_...), not Supabase JWTs.
async function deployGatewayFunction(
  pat: string,
  ref: string,
  onStep: (step: string) => void,
): Promise<void> {
  onStep('Deploying gateway edge function…')
  const res = await managementFetch(pat, `/v1/projects/${ref}/functions/deploy`, {
    method: 'POST',
    body: JSON.stringify({
      slug: GATEWAY_FUNCTION_SLUG,
      verify_jwt: false,
      metadata: { entrypoint_path: GATEWAY_SOURCE_FILE },
      files: [{ name: GATEWAY_SOURCE_FILE, content: gatewaySource }],
    }),
  })
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, 'Gateway function deploy failed'))
  }
}

// Step 3 — poll the public endpoint until it answers. Any HTTP response at
// all means the route is live; keep polling through network errors and 404s
// while the deployment propagates.
async function pollGatewayEndpoint(
  url: string,
  onStep: (step: string) => void,
  timeoutMs = 45000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs
  let lastStatus = 0
  while (Date.now() < deadline) {
    onStep('Waiting for the gateway to respond…')
    try {
      const res = await fetch(url, { method: 'OPTIONS' })
      // The deployed function answers OPTIONS itself with 204 + CORS headers.
      if (res.status === 204) return
      lastStatus = res.status
    } catch {
      // Network error — not live yet (or CORS preflight rejected), retry.
    }
    await new Promise(resolve => setTimeout(resolve, 2500))
  }
  throw new Error(
    lastStatus > 0
      ? `Gateway endpoint did not become ready within ${timeoutMs / 1000}s (last status: ${lastStatus}). It may still be propagating — check the Supabase dashboard.`
      : `Gateway endpoint did not respond within ${timeoutMs / 1000}s. It may still be propagating — check the Supabase dashboard.`
  )
}

// Best-effort: fresh Supabase projects default to "confirm email" on signup,
// which would leave the silent owner account without a session (and the
// install stuck behind invisible auth). Flip autoconfirm on via the
// Management API while we hold the PAT. Failures are non-fatal — signUp's
// session check in provisionOwnerAccount surfaces it clearly if this didn't
// take effect.
async function relaxEmailConfirmation(pat: string, ref: string): Promise<void> {
  try {
    await managementFetch(pat, `/v1/projects/${ref}/config/auth`, {
      method: 'PATCH',
      body: JSON.stringify({ mailer_autoconfirm: true }),
    })
  } catch {
    // best effort only
  }
}

export interface DeployResult {
  ref: string
  gatewayUrl: string
  ownerEmail?: string
}

// Orchestrates the full flow. Runs everything with the PAT, then the caller
// discards it — nothing here persists it anywhere.
export async function deployGateway(
  pat: string,
  projectUrl: string,
  onStep: (step: string) => void,
): Promise<DeployResult> {
  const ref = extractProjectRef(projectUrl)
  if (!ref) {
    throw new Error('Could not read a valid project ref from the project URL (expected https://<ref>.supabase.co).')
  }

  await runMigrations(pat, ref, onStep)

  // Silent owner account: one machine-generated auth user per install, so
  // every auth.uid()-scoped RPC keeps working with no visible login UI.
  onStep('Preparing authentication for the owner account…')
  await relaxEmailConfirmation(pat, ref)
  onStep('Provisioning the silent owner account…')
  const owner = await provisionOwnerAccount()

  await deployGatewayFunction(pat, ref, onStep)
  await pollGatewayEndpoint(gatewayFunctionUrl(ref), onStep)

  return { ref, gatewayUrl: gatewayFunctionUrl(ref), ownerEmail: owner.email }
}
