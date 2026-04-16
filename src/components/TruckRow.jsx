import { useState, useRef, useEffect } from 'react'
import { STATUS, STATUS_LABELS, CAN_CHANGE_STATUS, ROLE, CATEGORY_LABELS } from '../lib/constants.js'
import MaintenanceBadge from './MaintenanceBadge.jsx'

// Inline-editable Waiting On cell
function WaitingOnCell({ truck, canEdit, onUpdateWaitingOn }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue]     = useState('')
  const inputRef              = useRef(null)

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus()
  }, [editing])

  function handleOpen(e) {
    if (!canEdit) return
    e.stopPropagation()
    setValue(truck.waiting_on || '')
    setEditing(true)
  }

  function handleCancel() { setEditing(false) }

  async function handleSave() {
    await onUpdateWaitingOn(truck.id, value.trim())
    setEditing(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') handleCancel()
  }

  if (editing) {
    return (
      <td data-label="Waiting On" style={{ padding: '0.4rem 0.875rem', minWidth: 180 }}>
        <input
          ref={inputRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          placeholder="What is it waiting on?"
          style={{
            width: '100%',
            padding: '0.3rem 0.5rem',
            background: 'var(--surface-high)',
            border: '1px solid var(--primary)',
            borderRadius: '0.375rem',
            color: 'var(--on-surface)',
            fontSize: '0.8rem',
            fontFamily: 'inherit',
            outline: 'none',
          }}
        />
      </td>
    )
  }

  return (
    <td
      data-label="Waiting On"
      onClick={canEdit ? handleOpen : undefined}
      title={canEdit ? 'Click to edit' : undefined}
      style={{ cursor: canEdit ? 'text' : 'default' }}
    >
      {truck.waiting_on
        ? <span style={{ fontSize: '0.8rem', color: 'var(--status-issues)' }}>{truck.waiting_on}</span>
        : canEdit
          ? <span style={{ color: 'var(--on-surface-muted)', fontStyle: 'italic', fontSize: '0.75rem' }}>+ add</span>
          : <span style={{ color: 'var(--on-surface-muted)', fontSize: '0.75rem' }}>—</span>
      }
    </td>
  )
}

const STATUS_SELECT_STYLES = {
  [STATUS.READY]: {
    color: 'var(--status-ready)',
    background: 'var(--status-ready-bg)',
    borderColor: 'var(--status-ready-border)',
  },
  [STATUS.ISSUES]: {
    color: 'var(--status-issues)',
    background: 'var(--status-issues-bg)',
    borderColor: 'var(--status-issues-border)',
  },
  [STATUS.OOS]: {
    color: 'var(--status-oos)',
    background: 'var(--status-oos-bg)',
    borderColor: 'var(--status-oos-border)',
  },
}

export default function TruckRow({ truck, currentStatus, profile, onStatusChange, onViewHistory, onUpdateWaitingOn }) {
  const [changing, setChanging] = useState(false)
  const role            = profile?.role
  const canChangeStatus = CAN_CHANGE_STATUS.includes(role)
  const canEditWaitingOn = role !== ROLE.DRIVER

  async function handleStatusSelect(e) {
    const newStatus = e.target.value
    if (newStatus === currentStatus || changing) return
    setChanging(true)
    const email  = profile?.email || 'Unknown'
    const name   = email.includes('@') ? email.split('@')[0] : email
    const now    = new Date()
    const dateStr = now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    const comment = `Status changed from ${STATUS_LABELS[currentStatus]} to ${STATUS_LABELS[newStatus]} by ${name} on ${dateStr} ${timeStr}`
    const waitingOn = newStatus === STATUS.READY ? null : truck.waiting_on
    await onStatusChange(truck, newStatus, comment, waitingOn)
    setChanging(false)
  }

  const selectStyle = {
    padding: '0.3rem 1.5rem 0.3rem 0.5rem',
    borderRadius: '0.4rem',
    fontSize: '0.78rem',
    fontWeight: 600,
    fontFamily: 'inherit',
    cursor: canChangeStatus && !changing ? 'pointer' : 'default',
    opacity: changing ? 0.6 : 1,
    border: '1px solid',
    outline: 'none',
    appearance: 'none',
    WebkitAppearance: 'none',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 0.4rem center',
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' fill='%238a7e6e' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E\")",
    ...STATUS_SELECT_STYLES[currentStatus],
  }

  return (
    <tr>
      {/* Unit */}
      <td data-label="Unit" style={{ fontWeight: 700, color: 'var(--on-surface)', letterSpacing: '0.02em' }}>
        {truck.unit_number}
      </td>

      {/* Category */}
      <td data-label="Category" style={{ fontSize: '0.8rem', color: 'var(--on-surface-muted)', whiteSpace: 'nowrap' }}>
        {CATEGORY_LABELS[truck.category] || '—'}
      </td>

      {/* Location */}
      <td data-label="Location" style={{ fontSize: '0.8rem', color: 'var(--on-surface-muted)', whiteSpace: 'nowrap' }}>
        {truck.locations?.name || '—'}
      </td>

      {/* Waiting On — inline editable for non-drivers */}
      <WaitingOnCell
        truck={truck}
        canEdit={canEditWaitingOn}
        onUpdateWaitingOn={onUpdateWaitingOn}
      />

      {/* Next PM */}
      <td data-label="Next PM">
        <MaintenanceBadge nextPmDate={truck.maintenance?.next_pm_date} />
      </td>

      {/* Status dropdown */}
      <td data-label="Status">
        {canChangeStatus ? (
          <select
            value={currentStatus}
            onChange={handleStatusSelect}
            disabled={changing}
            style={selectStyle}
          >
            {Object.entries(STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        ) : (
          <span className={`status-badge status-badge-${currentStatus}`}>
            {STATUS_LABELS[currentStatus]}
          </span>
        )}
      </td>

      {/* History */}
      <td data-label="">
        <button className="btn-ghost" onClick={() => onViewHistory(truck)}>
          History
        </button>
      </td>
    </tr>
  )
}
