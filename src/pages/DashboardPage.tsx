import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { DashboardLayout } from '../components/DashboardLayout'
import { useAuthContext } from '../context/AuthProvider'
import { hasOwnerCredentials } from '../lib/owner'

// Lazy-loaded dashboard sections (named exports -> default)
const OverviewPage = lazy(() => import('./dashboard/OverviewPage').then(m => ({ default: m.OverviewPage })))
const ActivityPage = lazy(() => import('./dashboard/ActivityPage').then(m => ({ default: m.ActivityPage })))
const ConnectionsPage = lazy(() => import('./dashboard/ConnectionsPage').then(m => ({ default: m.ConnectionsPage })))
const KeysPage = lazy(() => import('./dashboard/KeysPage').then(m => ({ default: m.KeysPage })))
const UsagePage = lazy(() => import('./dashboard/UsagePage').then(m => ({ default: m.UsagePage })))
const SettingsPage = lazy(() => import('./dashboard/SettingsPage').then(m => ({ default: m.SettingsPage })))

// Loading fallback for dashboard sections
function DashboardSectionLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
      <div className="spinner" style={{ width: 24, height: 24 }} />
    </div>
  )
}

/**
 * RequireAuth — the actual security boundary for /dashboard/*.
 * Uses shared AuthProvider context to avoid duplicate session fetches.
 */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuthContext()

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-base)',
        }}
      >
        <div className="spinner" />
      </div>
    )
  }

  if (!session) {
    // No visible login UI in the self-hosted app: if this browser has owner
    // credentials we're mid-restore (brief), otherwise Deploy Gateway has
    // never run here → send to setup instead of a login page.
    if (!hasOwnerCredentials()) {
      return <Navigate to="/setup" replace />
    }
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-base)',
        }}
      >
        <div className="spinner" />
      </div>
    )
  }

  return <>{children}</>
}

export function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSectionLoader />}>
      <Routes>
        {/*
         * Connections is deliberately NOT wrapped in RequireAuth: its Deploy
         * Gateway card is what CREATES the silent owner account, so guarding
         * it behind an existing session deadlocks fresh installs (no session
         * → bounced to /setup → can never reach the button that makes one).
         * DashboardLayout handles the no-session state itself.
         */}
        <Route element={<DashboardLayout />}>
          <Route path="connections" element={<ConnectionsPage />} />
        </Route>

        {/* Every other dashboard section requires an existing owner session. */}
        <Route
          element={
            <RequireAuth>
              <DashboardLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<OverviewPage />} />
          <Route path="activity" element={<ActivityPage />} />
          <Route path="keys" element={<KeysPage />} />
          <Route path="usage" element={<UsagePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}