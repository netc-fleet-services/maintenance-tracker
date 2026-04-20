import { useState, useEffect, createContext, useContext } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabase.js'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import AdminSettings from './pages/AdminSettings.jsx'
import ResetPassword from './pages/ResetPassword.jsx'

// Detect auth tokens in the URL hash on initial page load (before HashRouter strips them).
// Supabase puts #access_token=...&type=recovery|invite in the URL after email link clicks.
const initialHash = new URLSearchParams(window.location.hash.replace(/^#\/?/, ''))
const isAuthCallback = initialHash.has('access_token')
const initialAuthType = initialHash.get('type') // 'recovery', 'invite', 'signup', etc.

// Auth context shared across the app
export const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

function RequireAuth({ children }) {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface)' }}>
        <div className="flex flex-col items-center gap-3">
          <div style={{
            width: 36, height: 36,
            border: '3px solid var(--outline)',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <p style={{ color: 'var(--on-surface-muted)', fontSize: '0.875rem' }}>Loading…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

function RequireAdmin({ children }) {
  const { profile } = useAuth()
  if (!['admin', 'shop_manager'].includes(profile?.role)) {
    return <Navigate to="/" replace />
  }
  return children
}

// Shown while Supabase processes auth tokens from the URL hash.
// Returns null to prevent the catch-all from redirecting away before tokens are read.
function AuthCallbackHandler() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface)' }}>
      <div style={{
        width: 36, height: 36,
        border: '3px solid var(--outline)',
        borderTopColor: 'var(--primary)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Password reset email link
      if (event === 'PASSWORD_RECOVERY') {
        setSession(session)
        navigate('/reset-password')
        return
      }

      // Invite / signup email link — user is signed in but needs to set a password.
      // Any SIGNED_IN during an auth callback means the user came via an email link.
      if (event === 'SIGNED_IN' && isAuthCallback) {
        setSession(session)
        navigate('/reset-password')
        return
      }

      setSession(session)
      if (session) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
    setLoading(false)
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading }}>
      <Routes>
        <Route path="/login" element={session && !loading ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/admin" element={<RequireAuth><RequireAdmin><AdminSettings /></RequireAdmin></RequireAuth>} />
        <Route path="/reset-password" element={<ResetPassword />} />
        {/* If the URL has auth tokens, hold here while onAuthStateChange navigates.
            Otherwise redirect unknown routes to home. */}
        <Route path="*" element={isAuthCallback ? <AuthCallbackHandler /> : <Navigate to="/" replace />} />
      </Routes>
    </AuthContext.Provider>
  )
}
