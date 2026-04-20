import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

export default function ResetPassword() {
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [done, setDone]           = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 8)  { setError('Password must be at least 8 characters.'); return }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) { setError(error.message); return }
    setDone(true)
    setTimeout(() => navigate('/'), 2500)
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: 'var(--surface)' }}
    >
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: 'var(--surface-container)',
        border: '1px solid var(--outline)',
        borderRadius: '0.875rem',
        padding: '2rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <h2 style={{ margin: '0 0 1.5rem', fontWeight: 700, fontSize: '1.25rem', color: 'var(--on-surface)' }}>
          Set a new password
        </h2>

        {done ? (
          <div style={{
            padding: '0.875rem 1rem',
            background: 'var(--status-ready-bg)',
            border: '1px solid var(--status-ready-border)',
            borderRadius: '0.5rem',
            color: 'var(--status-ready)',
            fontSize: '0.875rem',
          }}>
            Password updated! Redirecting…
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="form-label" htmlFor="new-password">New password</label>
              <input
                id="new-password"
                type="password"
                className="form-input"
                placeholder="At least 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoFocus
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="form-label" htmlFor="confirm-password">Confirm password</label>
              <input
                id="confirm-password"
                type="password"
                className="form-input"
                placeholder="Re-enter password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
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
              style={{ height: '2.75rem', marginTop: '0.25rem' }}
            >
              {loading ? 'Saving…' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
