import { useState } from 'react'
import { supabase } from '../lib/supabase.js'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
    // On success, App.jsx's onAuthStateChange fires and redirects automatically
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: 'var(--surface)' }}
    >
      {/* Logo / wordmark */}
      <div className="mb-10 text-center">
        <div
          className="inline-flex items-center gap-2 mb-4"
          style={{ color: 'var(--primary)' }}
        >
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="var(--primary-container)" />
            <path d="M6 22 L6 14 L12 10 L18 14 L18 22 M12 22 L12 16 L16 16 L16 22"
              stroke="var(--primary)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" fill="none" />
            <path d="M20 12 L26 12 M26 16 L22 16 M26 20 L22 20"
              stroke="var(--primary)" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
          <span style={{
            fontWeight: 800,
            fontSize: '1.125rem',
            color: 'var(--on-surface)',
            letterSpacing: '-0.01em',
          }}>
            NETC Fleet
          </span>
        </div>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'var(--on-surface)',
          margin: 0,
          letterSpacing: '-0.01em',
        }}>
          Maintenance Tracker
        </h1>
        <p style={{ color: 'var(--on-surface-muted)', fontSize: '0.875rem', marginTop: '0.375rem' }}>
          Sign in to manage your fleet
        </p>
      </div>

      {/* Login card */}
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: 'var(--surface-container)',
        border: '1px solid var(--outline)',
        borderRadius: '0.875rem',
        padding: '2rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <div>
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div style={{
              padding: '0.75rem 1rem',
              background: 'var(--error-container)',
              border: '1px solid var(--error)',
              borderRadius: '0.5rem',
              color: 'var(--error)',
              fontSize: '0.875rem',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ marginTop: '0.25rem', height: '2.75rem' }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>

      <p style={{ color: 'var(--on-surface-muted)', fontSize: '0.75rem', marginTop: '2rem' }}>
        Contact your administrator to request access.
      </p>
    </div>
  )
}
