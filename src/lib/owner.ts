// Silent owner account for self-hosted installs.
//
// Self-hosted Keyroute has no visible login/signup UI. Instead, exactly one
// machine-generated "owner" Supabase Auth user is provisioned per install
// (during Deploy Gateway) and every RPC's auth.uid() resolves to it.
//
// Credentials live in ONE place: a single namespaced localStorage key, kept
// only so this browser can silently re-authenticate if the supabase-js
// session (which supabase-js itself persists) is ever lost. They never leave
// the browser except to talk to the project's own auth endpoint.
import { isSupabaseConfigured, supabase } from './supabase'

const OWNER_STORAGE_KEY = 'keyroute:owner'

// Hostname of this install's own Supabase project, used to self-diagnose
// network errors (the failing request goes to <host>/auth/v1/signup).
function projectHost(): string {
  try {
    return new URL(import.meta.env.VITE_SUPABASE_URL || '').hostname || '<your-project>.supabase.co'
  } catch {
    return '<your-project>.supabase.co'
  }
}

export interface OwnerCredentials {
  email: string
  password: string
}

export function loadOwnerCredentials(): OwnerCredentials | null {
  try {
    const raw = localStorage.getItem(OWNER_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<OwnerCredentials>
    if (typeof parsed.email === 'string' && typeof parsed.password === 'string') {
      return { email: parsed.email, password: parsed.password }
    }
    return null
  } catch {
    return null
  }
}

function saveOwnerCredentials(creds: OwnerCredentials): void {
  try {
    localStorage.setItem(OWNER_STORAGE_KEY, JSON.stringify(creds))
  } catch {
    // Storage unavailable (private mode etc.) — silent re-auth just won't
    // survive a restart; provisioning still works for this session.
  }
}

function clearOwnerCredentials(): void {
  try {
    localStorage.removeItem(OWNER_STORAGE_KEY)
  } catch {
    // ignore
  }
}

// True when this browser has owner credentials on file — used by route
// guards to distinguish "owner exists, restoring session" from "never
// deployed → send to /setup".
export function hasOwnerCredentials(): boolean {
  return loadOwnerCredentials() !== null
}

function generateOwnerEmail(): string {
  // Must use a real, resolvable TLD — Supabase Auth (GoTrue) rejects synthetic
  // domains like ".keyroute" with email_address_invalid. basavaraj.dev is the
  // project maintainer's; these accounts are auto-confirmed (mailer_autoconfirm)
  // and never send or receive actual mail.
  return `owner-${crypto.randomUUID()}@local.basavaraj.dev`
}

function generateOwnerPassword(): string {
  // 32 random bytes -> ~43 base64url characters, well past the 32-char floor.
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  let binary = ''
  bytes.forEach(b => {
    binary += String.fromCharCode(b)
  })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function looksLikeAlreadyRegistered(message: string): boolean {
  const m = message.toLowerCase()
  return m.includes('already registered') || m.includes('already exists')
}

async function signInAsOwner(creds: OwnerCredentials): Promise<boolean> {
  const { error } = await supabase.auth.signInWithPassword(creds)
  if (!error) return true
  // Credentials no longer valid on this project (project recreated, user
  // deleted via delete_own_account, …). Forget them so a fresh owner can be
  // provisioned; anything else (network etc.) propagates to the caller.
  if (error.message.toLowerCase().includes('invalid login credentials')) {
    clearOwnerCredentials()
    return false
  }
  throw error
}

/**
 * Silently re-authenticate as the stored owner if this browser has
 * credentials on file. Returns true when a session was restored.
 */
export async function restoreOwnerSession(): Promise<boolean> {
  const creds = loadOwnerCredentials()
  if (!creds) return false
  return signInAsOwner(creds)
}

/**
 * Provision the silent owner account. Called once by Deploy Gateway after
 * migrations succeed:
 * - If this browser already has owner credentials, re-authenticate with them
 *   instead of creating a second account.
 * - Otherwise create a fresh random owner via signUp and store its
 *   credentials locally.
 * - If signUp says the identity already exists (stale/foreign storage),
 *   retry once with a brand-new random identity rather than failing.
 */
export async function provisionOwnerAccount(): Promise<{ email: string; mode: 'created' | 'restored' }> {
  if (!isSupabaseConfigured) {
    throw new Error(
      'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not configured — cannot provision the owner account.'
    )
  }

  if (await restoreOwnerSession()) {
    const creds = loadOwnerCredentials()
    return { email: creds?.email ?? '', mode: 'restored' }
  }

  for (let attempt = 0; attempt < 2; attempt++) {
    const creds: OwnerCredentials = {
      email: generateOwnerEmail(),
      password: generateOwnerPassword(),
    }

    // supabase-js reports HTTP-level auth problems via the returned `error`
    // (handled below); it only THROWS when fetch itself fails at the network
    // level. Give that case a self-diagnosing message instead of a bare
    // "Failed to fetch".
    let data: Awaited<ReturnType<typeof supabase.auth.signUp>>['data']
    let error: Awaited<ReturnType<typeof supabase.auth.signUp>>['error']
    try {
      const res = await supabase.auth.signUp(creds)
      data = res.data
      error = res.error
    } catch {
      throw new Error(
        `Network error creating the owner account via Supabase Auth — check connectivity to ${projectHost()} (ad-blockers, offline states, and CORS preflight rejections all look identical here).`
      )
    }

    if (error) {
      if (looksLikeAlreadyRegistered(error.message) && attempt === 0) continue
      throw error
    }

    saveOwnerCredentials(creds)

    if (!data.session) {
      throw new Error(
        'Owner account created, but this project requires email confirmation, so no session was issued. Disable "Confirm email" in your project\'s Authentication settings and run Deploy Gateway again.'
      )
    }
    return { email: creds.email, mode: 'created' }
  }
  throw new Error('Could not provision the owner account.')
}
