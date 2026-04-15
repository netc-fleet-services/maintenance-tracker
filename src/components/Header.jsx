import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../App.jsx'

function ThemeToggle() {
  function toggle() {
    const html = document.documentElement
    const next = html.classList.contains('theme-dark') ? 'theme-light' : 'theme-dark'
    html.className = next
    localStorage.setItem('netc-theme', next)
  }

  return (
    <button className="theme-toggle-btn" onClick={toggle} title="Toggle theme">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="5" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    </button>
  )
}

export default function Header() {
  const { profile, session } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const isAdmin = profile?.role === 'admin'

  return (
    <header style={{
      background: 'var(--surface-container)',
      borderBottom: '1px solid var(--outline)',
      position: 'sticky',
      top: 0,
      zIndex: 30,
    }}>
      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        padding: '0 1.25rem',
        height: '3.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
      }}>
        {/* Logo */}
        <div className="flex items-center gap-2 flex-shrink-0" style={{ color: 'var(--primary)' }}>
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="7" fill="var(--primary-container)" />
            <path d="M6 22 L6 14 L12 10 L18 14 L18 22 M12 22 L12 16 L16 16 L16 22"
              stroke="var(--primary)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" fill="none" />
            <path d="M20 12 L26 12 M26 16 L22 16 M26 20 L22 20"
              stroke="var(--primary)" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
          <span style={{
            fontWeight: 800,
            fontSize: '0.9375rem',
            color: 'var(--on-surface)',
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
          }}>
            Fleet Tracker
          </span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Right side */}
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button className="btn-ghost" onClick={() => navigate('/admin')}>
              Settings
            </button>
          )}
          <ThemeToggle />
          {profile && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.25rem 0.5rem',
              borderRadius: '0.375rem',
              cursor: 'default',
            }}>
              <div style={{
                width: '1.75rem',
                height: '1.75rem',
                borderRadius: '50%',
                background: 'var(--primary-container)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: 'var(--on-primary-container)',
                flexShrink: 0,
              }}>
                {(profile.email || session?.user?.email || '?')[0].toUpperCase()}
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-muted)', display: 'none' }} className="sm:block">
                {profile.email || session?.user?.email}
              </span>
            </div>
          )}
          <button className="btn-secondary" style={{ fontSize: '0.8rem' }} onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </div>
    </header>
  )
}
