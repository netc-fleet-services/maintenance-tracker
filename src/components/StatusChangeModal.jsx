import { useState } from 'react'
import { STATUS, STATUS_LABELS, CAN_ADD_MECHANIC_NOTE, NOTE_TYPE } from '../lib/constants.js'

const STATUS_DESCRIPTIONS = {
  [STATUS.READY]:  'This truck will be visible in the Ready for Use section and available for dispatch.',
  [STATUS.ISSUES]: 'This truck will appear in Known Issues — operable but needs attention.',
  [STATUS.OOS]:    'This truck will be marked Out of Service and unavailable for dispatch.',
}

export default function StatusChangeModal({ truck, targetStatus, profile, onConfirm, onClose }) {
  const [newStatus, setNewStatus] = useState(targetStatus || STATUS.READY)
  const [note, setNote] = useState('')
  const [waitingOn, setWaitingOn] = useState(truck.waiting_on || '')
  const [submitting, setSubmitting] = useState(false)

  const isToOOS = newStatus === STATUS.OOS

  async function handleConfirm() {
    setSubmitting(true)
    await onConfirm(truck, newStatus, note, waitingOn)
    setSubmitting(false)
  }

  const showWaitingOn = newStatus === STATUS.ISSUES || newStatus === STATUS.OOS

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.125rem', color: 'var(--on-surface)' }}>
              Change Status
            </h2>
            <p style={{ margin: '0.25rem 0 0', color: 'var(--on-surface-muted)', fontSize: '0.875rem' }}>
              Unit {truck.unit_number} · {truck.vin}
            </p>
          </div>
          <button className="btn-ghost" onClick={onClose} style={{ padding: '0.25rem' }}>✕</button>
        </div>

        {/* New status selector */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label className="form-label">New Status</label>
          <select
            className="form-select"
            value={newStatus}
            onChange={e => setNewStatus(e.target.value)}
          >
            {Object.entries(STATUS_LABELS)
              .filter(([val]) => val !== truck.current_status)
              .map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))
            }
          </select>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: 'var(--on-surface-muted)' }}>
            {STATUS_DESCRIPTIONS[newStatus]}
          </p>
        </div>

        {/* Waiting On (for Issues / OOS) */}
        {showWaitingOn && (
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Waiting On</label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g. Waiting on hydraulic hose, Waiting on vendor…"
              value={waitingOn}
              onChange={e => setWaitingOn(e.target.value)}
            />
          </div>
        )}

        {/* Optional note */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label className="form-label">
            Note <span style={{ color: 'var(--on-surface-muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
          </label>
          <textarea
            className="form-textarea"
            placeholder="Add context about this status change…"
            value={note}
            onChange={e => setNote(e.target.value)}
            style={{ minHeight: '5rem' }}
          />
        </div>

        {/* OOS confirmation warning */}
        {isToOOS && (
          <div style={{
            marginBottom: '1.25rem',
            padding: '0.75rem 1rem',
            background: 'var(--status-oos-bg)',
            border: '1px solid var(--status-oos-border)',
            borderRadius: '0.5rem',
            fontSize: '0.8125rem',
            color: 'var(--status-oos)',
          }}>
            ⚠ This truck will be unavailable for dispatch.
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            className="btn-primary"
            style={{ flex: 1 }}
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting ? 'Saving…' : `Move to ${STATUS_LABELS[newStatus]}`}
          </button>
          <button className="btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
