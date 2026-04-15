import { useState } from 'react'
import { NOTE_TYPE, NOTE_TYPE_LABELS, STATUS_LABELS, CAN_ADD_MECHANIC_NOTE, ROLE } from '../lib/constants.js'
import MaintenanceBadge from './MaintenanceBadge.jsx'

function fmtDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: '2-digit',
    hour: 'numeric', minute: '2-digit',
  })
}

const NOTE_TYPE_COLORS = {
  [NOTE_TYPE.DRIVER]:   { color: '#60a5fa', label: 'Driver' },
  [NOTE_TYPE.MECHANIC]: { color: 'var(--primary)', label: 'Mechanic' },
  [NOTE_TYPE.WORK]:     { color: 'var(--status-ready)', label: 'Work Done' },
}

const STATUS_COLORS = {
  ready:  'var(--status-ready)',
  issues: 'var(--status-issues)',
  oos:    'var(--status-oos)',
}

export default function NotesDrawer({ truck, profile, onAddNote, onClose }) {
  const [noteType, setNoteType] = useState(
    profile?.role === ROLE.DRIVER ? NOTE_TYPE.DRIVER : NOTE_TYPE.MECHANIC
  )
  const [noteBody, setNoteBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('history')

  const canAddMechNote = CAN_ADD_MECHANIC_NOTE.includes(profile?.role)
  const isDriver = profile?.role === ROLE.DRIVER

  // Merge notes + status history into one timeline, sorted newest first
  const notes = (truck.truck_notes || []).map(n => ({ ...n, _type: 'note' }))
  const history = (truck.status_history || []).map(h => ({ ...h, _type: 'history' }))
  const timeline = [...notes, ...history].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  async function handleAddNote(e) {
    e.preventDefault()
    if (!noteBody.trim()) return
    setSubmitting(true)
    await onAddNote(truck, noteType, noteBody.trim())
    setNoteBody('')
    setSubmitting(false)
  }

  // Available note types based on role
  const availableNoteTypes = isDriver
    ? [NOTE_TYPE.DRIVER]
    : [NOTE_TYPE.DRIVER, NOTE_TYPE.MECHANIC, NOTE_TYPE.WORK]

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer-panel">
        {/* Header */}
        <div className="drawer-header">
          <div>
            <div className="flex items-center gap-2">
              <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.125rem', color: 'var(--on-surface)' }}>
                {truck.unit_number}
              </h2>
              <span className={`status-badge status-badge-${truck.current_status}`}>
                {STATUS_LABELS[truck.current_status]}
              </span>
            </div>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--on-surface-muted)' }}>
              {truck.vin} · {truck.locations?.name || 'No location'}
            </p>
          </div>
          <button className="btn-ghost" onClick={onClose} style={{ padding: '0.25rem', fontSize: '1rem' }}>
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex" style={{ borderBottom: '1px solid var(--outline)', padding: '0 1.5rem', flexShrink: 0 }}>
          {[['history', 'History'], ['maintenance', 'Maintenance']].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                padding: '0.75rem 0',
                marginRight: '1.5rem',
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${activeTab === id ? 'var(--primary)' : 'transparent'}`,
                color: activeTab === id ? 'var(--primary)' : 'var(--on-surface-muted)',
                fontWeight: activeTab === id ? 700 : 500,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'color 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="drawer-body">
          {activeTab === 'history' && (
            <>
              {/* Add note form */}
              <form onSubmit={handleAddNote} style={{ marginBottom: '1.75rem' }}>
                <p style={{
                  fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase',
                  letterSpacing: '0.08em', color: 'var(--on-surface-muted)', marginBottom: '0.75rem',
                }}>
                  Add Note
                </p>

                {!isDriver && (
                  <div className="flex gap-2 mb-3" style={{ flexWrap: 'wrap' }}>
                    {availableNoteTypes.map(t => (
                      <button
                        key={t}
                        type="button"
                        className={noteType === t ? 'btn-primary' : 'btn-secondary'}
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
                        onClick={() => setNoteType(t)}
                      >
                        {NOTE_TYPE_LABELS[t]}
                      </button>
                    ))}
                  </div>
                )}

                <textarea
                  className="form-textarea"
                  placeholder={
                    noteType === NOTE_TYPE.DRIVER   ? 'Describe what the driver observed…' :
                    noteType === NOTE_TYPE.MECHANIC ? 'Describe diagnosis, issue, or status…' :
                    'Describe work that was completed…'
                  }
                  value={noteBody}
                  onChange={e => setNoteBody(e.target.value)}
                  style={{ minHeight: '5rem', marginBottom: '0.75rem' }}
                />
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting || !noteBody.trim()}
                  style={{ width: '100%' }}
                >
                  {submitting ? 'Saving…' : `Add ${NOTE_TYPE_LABELS[noteType]}`}
                </button>
              </form>

              {/* Timeline */}
              <p style={{
                fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase',
                letterSpacing: '0.08em', color: 'var(--on-surface-muted)', marginBottom: '1rem',
              }}>
                Full History ({timeline.length} entries)
              </p>

              {timeline.length === 0 && (
                <p style={{ color: 'var(--on-surface-muted)', fontSize: '0.875rem' }}>No history yet.</p>
              )}

              <div className="flex flex-col gap-3">
                {timeline.map((entry, idx) => (
                  <div key={idx} style={{
                    padding: '0.875rem 1rem',
                    background: 'var(--surface-high)',
                    border: '1px solid var(--outline-variant)',
                    borderRadius: '0.5rem',
                  }}>
                    {entry._type === 'note' ? (
                      <>
                        <div className="flex items-center justify-between mb-1">
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            color: NOTE_TYPE_COLORS[entry.note_type]?.color || 'var(--primary)',
                          }}>
                            {NOTE_TYPE_COLORS[entry.note_type]?.label || entry.note_type}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--on-surface-muted)' }}>
                            {fmtDateTime(entry.created_at)}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--on-surface)', lineHeight: 1.5 }}>
                          {entry.body}
                        </p>
                        {entry.created_by && (
                          <p style={{ margin: '0.35rem 0 0', fontSize: '0.72rem', color: 'var(--on-surface-muted)' }}>
                            — {entry.created_by}
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-1">
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--on-surface-muted)' }}>
                            Status Change
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--on-surface-muted)' }}>
                            {fmtDateTime(entry.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: '0.8rem', color: STATUS_COLORS[entry.old_status] || 'var(--on-surface-muted)' }}>
                            {STATUS_LABELS[entry.old_status] || entry.old_status}
                          </span>
                          <span style={{ color: 'var(--on-surface-muted)', fontSize: '0.75rem' }}>→</span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: STATUS_COLORS[entry.new_status] || 'var(--on-surface)' }}>
                            {STATUS_LABELS[entry.new_status] || entry.new_status}
                          </span>
                        </div>
                        {entry.comment && (
                          <p style={{ margin: '0.35rem 0 0', fontSize: '0.8125rem', color: 'var(--on-surface)' }}>
                            {entry.comment}
                          </p>
                        )}
                        {entry.changed_by && (
                          <p style={{ margin: '0.35rem 0 0', fontSize: '0.72rem', color: 'var(--on-surface-muted)' }}>
                            — {entry.changed_by}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'maintenance' && (
            <>
              <div style={{
                padding: '1.25rem',
                background: 'var(--surface-high)',
                border: '1px solid var(--outline)',
                borderRadius: '0.625rem',
                marginBottom: '1.5rem',
              }}>
                <p style={{
                  fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase',
                  letterSpacing: '0.08em', color: 'var(--on-surface-muted)', marginBottom: '1rem',
                }}>
                  PM Schedule
                </p>
                {truck.maintenance ? (
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      ['Last PM Date',     truck.maintenance.last_pm_date ? new Date(truck.maintenance.last_pm_date).toLocaleDateString() : '—'],
                      ['Last PM Mileage',  truck.maintenance.last_pm_mileage?.toLocaleString() || '—'],
                      ['Next PM Due',      truck.maintenance.next_pm_date ? new Date(truck.maintenance.next_pm_date).toLocaleDateString() : '—'],
                      ['Next PM Mileage',  truck.maintenance.next_pm_mileage?.toLocaleString() || '—'],
                    ].map(([label, val]) => (
                      <div key={label}>
                        <p style={{ margin: 0, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--on-surface-muted)' }}>
                          {label}
                        </p>
                        <p style={{ margin: '0.25rem 0 0', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--on-surface)' }}>
                          {val}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--on-surface-muted)', fontSize: '0.875rem', margin: 0 }}>
                    No maintenance record on file.
                  </p>
                )}
                <div style={{ marginTop: '1rem' }}>
                  <MaintenanceBadge nextPmDate={truck.maintenance?.next_pm_date} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
