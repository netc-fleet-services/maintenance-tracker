import { useState, useRef, useEffect } from 'react'
import { STATUS, STATUS_LABELS, CAN_CHANGE_STATUS, ROLE, NOTE_TYPE } from '../lib/constants.js'
import { latestNote } from '../pages/Dashboard.jsx'
import MaintenanceBadge from './MaintenanceBadge.jsx'

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
}

// Inline editable note cell — clicking opens a textarea to add a new note entry
function InlineNoteCell({ truck, noteType, currentNote, canEdit, onAddNote }) {
  const [editing, setEditing]   = useState(false)
  const [body, setBody]         = useState('')
  const [saving, setSaving]     = useState(false)
  const textareaRef             = useRef(null)

  useEffect(() => {
    if (editing && textareaRef.current) textareaRef.current.focus()
  }, [editing])

  function handleOpen(e) {
    if (!canEdit) return
    e.stopPropagation()
    setBody('')
    setEditing(true)
  }

  function handleCancel() {
    setEditing(false)
    setBody('')
  }

  async function handleSave() {
    if (!body.trim()) return
    setSaving(true)
    await onAddNote(truck, noteType, body.trim())
    setSaving(false)
    setEditing(false)
    setBody('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave()
    if (e.key === 'Escape') handleCancel()
  }

  if (editing) {
    return (
      <td style={{ minWidth: 220, padding: '0.5rem 0.875rem' }}>
        <textarea
          ref={textareaRef}
          value={body}
          onChange={e => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add note… (Ctrl+Enter to save)"
          rows={3}
          style={{
            width: '100%',
            padding: '0.4rem 0.5rem',
            background: 'var(--surface-high)',
            border: '1px solid var(--primary)',
            borderRadius: '0.375rem',
            color: 'var(--on-surface)',
            fontSize: '0.78rem',
            fontFamily: 'inherit',
            resize: 'vertical',
            outline: 'none',
            boxShadow: '0 0 0 2px color-mix(in srgb, var(--primary) 20%, transparent)',
          }}
        />
        <div className="flex gap-1" style={{ marginTop: '0.375rem' }}>
          <button
            onClick={handleSave}
            disabled={saving || !body.trim()}
            style={{
              padding: '0.25rem 0.625rem',
              background: 'var(--primary)',
              color: '#0a0a0a',
              border: 'none',
              borderRadius: '0.3rem',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: saving || !body.trim() ? 'not-allowed' : 'pointer',
              opacity: saving || !body.trim() ? 0.5 : 1,
              fontFamily: 'inherit',
            }}
          >
            {saving ? '…' : 'Save'}
          </button>
          <button
            onClick={handleCancel}
            disabled={saving}
            style={{
              padding: '0.25rem 0.5rem',
              background: 'transparent',
              color: 'var(--on-surface-muted)',
              border: '1px solid var(--outline)',
              borderRadius: '0.3rem',
              fontSize: '0.72rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
        </div>
      </td>
    )
  }

  return (
    <td
      onClick={canEdit ? handleOpen : undefined}
      title={canEdit ? (currentNote ? 'Click to add a new note' : 'Click to add note') : undefined}
      style={{
        cursor: canEdit ? 'text' : 'default',
        position: 'relative',
      }}
    >
      <div className="flex items-start gap-1" style={{ minHeight: '1.5rem' }}>
        {currentNote
          ? <span className="note-pill" title={currentNote.body}>{currentNote.body}</span>
          : canEdit
            ? <span style={{ color: 'var(--outline)', fontSize: '0.75rem', fontStyle: 'italic' }}>+ add note</span>
            : <span style={{ color: 'var(--on-surface-muted)', fontSize: '0.75rem' }}>—</span>
        }
        {canEdit && currentNote && (
          <span style={{
            fontSize: '0.65rem',
            color: 'var(--outline)',
            flexShrink: 0,
            marginTop: '0.1rem',
          }}>
            +
          </span>
        )}
      </div>
    </td>
  )
}

export default function TruckRow({ truck, currentStatus, profile, onStatusChange, onViewHistory, onAddNote }) {
  const role            = profile?.role
  const canChangeStatus = CAN_CHANGE_STATUS.includes(role)

  // Role gates: drivers can add driver notes; mechanics/dispatchers/admins can add either
  const canAddDriverNote = !!role   // any authenticated user
  const canAddMechNote   = role !== ROLE.DRIVER

  const driverNote   = latestNote(truck, NOTE_TYPE.DRIVER)
  const mechNote     = latestNote(truck, NOTE_TYPE.MECHANIC)
  const lastWorkNote = latestNote(truck, NOTE_TYPE.WORK)
  const lastHistory  = (truck.status_history || [])
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]

  const otherStatuses = Object.values(STATUS).filter(s => s !== currentStatus)

  return (
    <tr>
      {/* Unit */}
      <td>
        <span style={{ fontWeight: 700, color: 'var(--on-surface)', letterSpacing: '0.02em' }}>
          {truck.unit_number}
        </span>
      </td>

      {/* VIN */}
      <td>
        <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--on-surface-muted)' }}>
          {truck.vin}
        </span>
      </td>

      {/* Location */}
      <td style={{ whiteSpace: 'nowrap', color: 'var(--on-surface-muted)', fontSize: '0.8rem' }}>
        {truck.locations?.name || '—'}
      </td>

      {/* Driver Notes — editable by all roles */}
      <InlineNoteCell
        truck={truck}
        noteType={NOTE_TYPE.DRIVER}
        currentNote={driverNote}
        canEdit={canAddDriverNote}
        onAddNote={onAddNote}
      />

      {/* Mechanic Notes — editable by mechanic / dispatcher / admin */}
      <InlineNoteCell
        truck={truck}
        noteType={NOTE_TYPE.MECHANIC}
        currentNote={mechNote}
        canEdit={canAddMechNote}
        onAddNote={onAddNote}
      />

      {/* Last Work Done — read-only in table; use History drawer to add work notes */}
      <td>
        {lastWorkNote
          ? (
            <div>
              <span className="note-pill" title={lastWorkNote.body}>{lastWorkNote.body}</span>
              <div style={{ fontSize: '0.65rem', color: 'var(--on-surface-muted)', marginTop: '0.1rem' }}>
                {fmtDate(lastWorkNote.created_at)}
              </div>
            </div>
          )
          : <span style={{ color: 'var(--on-surface-muted)', fontSize: '0.75rem' }}>—</span>
        }
      </td>

      {/* Last Status Change */}
      <td style={{ whiteSpace: 'nowrap', fontSize: '0.75rem', color: 'var(--on-surface-muted)' }}>
        {lastHistory ? fmtDate(lastHistory.created_at) : '—'}
      </td>

      {/* Changed By */}
      <td style={{ fontSize: '0.75rem', color: 'var(--on-surface-muted)', whiteSpace: 'nowrap' }}>
        {lastHistory?.changed_by || '—'}
      </td>

      {/* Waiting On (only for issues/oos) */}
      {(currentStatus === STATUS.ISSUES || currentStatus === STATUS.OOS) && (
        <td>
          {truck.waiting_on
            ? <span style={{ fontSize: '0.8rem', color: 'var(--status-issues)' }}>{truck.waiting_on}</span>
            : <span style={{ color: 'var(--on-surface-muted)', fontSize: '0.75rem' }}>—</span>
          }
        </td>
      )}

      {/* PM */}
      <td>
        <MaintenanceBadge nextPmDate={truck.maintenance?.next_pm_date} />
      </td>

      {/* Actions */}
      <td>
        <div className="flex gap-1" style={{ flexWrap: 'nowrap' }}>
          <button className="btn-ghost" onClick={() => onViewHistory(truck)}>
            History
          </button>
          {canChangeStatus && otherStatuses.map(s => (
            <button
              key={s}
              className="btn-ghost"
              style={{
                color: s === STATUS.READY ? 'var(--status-ready)' : s === STATUS.OOS ? 'var(--status-oos)' : 'var(--status-issues)',
              }}
              onClick={() => onStatusChange(truck, s)}
            >
              → {s === STATUS.READY ? 'Ready' : s === STATUS.OOS ? 'OOS' : 'Issues'}
            </button>
          ))}
        </div>
      </td>
    </tr>
  )
}
