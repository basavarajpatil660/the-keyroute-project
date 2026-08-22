import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { hasOwnerCredentials, restoreOwnerSession } from '../lib/owner'
import type { Session } from '@supabase/supabase-js'

interface AuthContextValue {
  session: Session | null
  loading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function bootstrap() {
      const { data } = await supabase.auth.getSession()

      if (!data.session && mounted && hasOwnerCredentials()) {
        // No active session, but this browser has owner credentials on file
        // (Deploy Gateway ran here before). Restore the owner's session
        // silently — no login UI, no redirect, just resolve and continue.
        // On failure (stale credentials) they are cleared inside
        // restoreOwnerSession so guards can route to /setup instead.
        await restoreOwnerSession()
      }

      if (!mounted) return
      const { data: final } = await supabase.auth.getSession()
      setSession(final.session)
      setLoading(false)
    }

    bootstrap()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted) return
      setSession(s)
      setLoading(false)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ session, loading, isAuthenticated: !!session }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return ctx
}
