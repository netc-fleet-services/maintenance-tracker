import { PM_SOON_DAYS } from '../lib/constants.js'

export function getPMStatus(nextPmDate) {
  if (!nextPmDate) return null
  const now = new Date()
  const due = new Date(nextPmDate)
  const daysUntil = (due - now) / (1000 * 60 * 60 * 24)
  if (daysUntil < 0) return 'overdue'
  if (daysUntil <= PM_SOON_DAYS) return 'soon'
  return 'ok'
}

const PM_LABELS = { ok: 'PM OK', soon: 'PM Soon', overdue: 'PM Overdue' }

export default function MaintenanceBadge({ nextPmDate }) {
  const status = getPMStatus(nextPmDate)
  if (!status) return <span style={{ color: 'var(--on-surface-muted)', fontSize: '0.75rem' }}>—</span>

  const dateStr = new Date(nextPmDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })

  return (
    <div className="flex flex-col gap-0.5">
      <span className={`pm-badge pm-${status}`}>{PM_LABELS[status]}</span>
      <span style={{ fontSize: '0.68rem', color: 'var(--on-surface-muted)' }}>{dateStr}</span>
    </div>
  )
}
