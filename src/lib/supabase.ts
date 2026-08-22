// Keyroute Supabase client.
//
// SESSION PERSISTENCE: this is a real deployed SPA (Vite + Vercel), not a
// sandboxed chat artifact — using localStorage for session storage here is
// the standard, correct approach and is what Supabase's SDK is designed
// around. persistSession/autoRefreshToken were previously disabled with a
// comment referencing a "no localStorage" rule — that rule applies to a
// different context (in-chat preview artifacts) and does not apply to this
// production app. Disabling them just broke sessions on every page refresh
// with no functional or security benefit, so both are re-enabled below.
//
// Graceful fallback: use placeholder values if env vars are absent so
// marketing pages still render without a .env.local file. Auth calls will
// fail cleanly but won't crash the app.
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // Required so Supabase can pick up the access token from the URL hash
    // after a Google OAuth redirect back to the app.
    detectSessionInUrl: true,
  },
})

// Flag so auth-dependent components can show a clear "not configured" state
export const isSupabaseConfigured =
  Boolean(import.meta.env.VITE_SUPABASE_URL) &&
  Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY)