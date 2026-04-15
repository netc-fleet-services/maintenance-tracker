// hub/Tool.js — NETC Fleet Maintenance Tracker hub preview
// Vanilla JS, no auth, mock data only.
// Exports Tool() → HTMLElement for the NETC Labs tool hub.

const MOCK_TRUCKS = {
  ready: [
    { unit: 'T-101', vin: '1NKWLB0X8FJ123456', location: 'Dallas',      driverNote: null,                    mechNote: null,                      lastWork: 'PM Service completed',   lastChange: '2026-04-01', changedBy: 'J. Martinez', nextPm: '2026-07-15', pmStatus: 'ok'      },
    { unit: 'T-102', vin: '1NKWLB0X8FJ234567', location: 'Houston',     driverNote: null,                    mechNote: null,                      lastWork: 'Oil change & inspection', lastChange: '2026-03-28', changedBy: 'K. Williams', nextPm: '2026-05-10', pmStatus: 'soon'    },
    { unit: 'T-103', vin: '1NKWLB0X8FJ345678', location: 'Dallas',      driverNote: null,                    mechNote: null,                      lastWork: 'Brake inspection',        lastChange: '2026-04-10', changedBy: 'R. Johnson',  nextPm: '2026-09-01', pmStatus: 'ok'      },
    { unit: 'T-107', vin: '1NKWLB0X8FJ456789', location: 'San Antonio', driverNote: null,                    mechNote: null,                      lastWork: 'Tire rotation',           lastChange: '2026-04-08', changedBy: 'A. Davis',    nextPm: '2026-08-20', pmStatus: 'ok'      },
    { unit: 'T-108', vin: '1NKWLB0X8FJ567890', location: 'Austin',      driverNote: null,                    mechNote: null,                      lastWork: 'PM Service completed',   lastChange: '2026-04-12', changedBy: 'M. Lee',      nextPm: '2026-05-05', pmStatus: 'soon'    },
  ],
  issues: [
    { unit: 'T-104', vin: '1NKWLB0X8FJ678901', location: 'San Antonio', driverNote: 'Brake warning light on', mechNote: 'Diagnosed — needs brake pads', lastWork: 'Tire rotation',     lastChange: '2026-04-08', changedBy: 'A. Davis',    nextPm: '2026-04-18', pmStatus: 'overdue', waitingOn: 'Waiting on parts' },
    { unit: 'T-105', vin: '1NKWLB0X8FJ789012', location: 'Austin',      driverNote: 'Wheel lift slow',        mechNote: 'Hydraulic line leak found',   lastWork: 'PM Service',       lastChange: '2026-04-05', changedBy: 'M. Lee',      nextPm: '2026-06-01', pmStatus: 'ok',      waitingOn: 'Waiting on hydraulic hose' },
    { unit: 'T-109', vin: '1NKWLB0X8FJ890123', location: 'Houston',     driverNote: 'Check engine light',     mechNote: 'Diagnostic pending',          lastWork: 'Oil change',       lastChange: '2026-04-11', changedBy: 'K. Williams', nextPm: '2026-07-10', pmStatus: 'ok',      waitingOn: 'Waiting on diagnostic scan' },
  ],
  oos: [
    { unit: 'T-106', vin: '1NKWLB0X8FJ901234', location: 'Houston',     driverNote: 'Engine not starting',    mechNote: 'Alternator failed',           lastWork: 'Battery replaced', lastChange: '2026-04-12', changedBy: 'J. Martinez', nextPm: '2026-05-15', pmStatus: 'soon',    waitingOn: 'Waiting on vendor' },
    { unit: 'T-110', vin: '1NKWLB0X8FJ012345', location: 'Dallas',      driverNote: 'Major accident damage',  mechNote: 'Frame damage — body shop',    lastWork: 'Pre-trip inspect', lastChange: '2026-04-09', changedBy: 'R. Johnson',  nextPm: '2026-08-01', pmStatus: 'ok',      waitingOn: 'At body shop' },
  ],
}

const PM_LABELS   = { ok: 'PM OK', soon: 'PM Soon', overdue: 'PM Overdue' }
const STATUS_KEYS = ['ready', 'issues', 'oos']
const STATUS_LABELS = { ready: 'Ready for Use', issues: 'Known Issues', oos: 'Out of Service' }
const STATUS_ICONS  = { ready: '✓', issues: '⚠', oos: '✕' }

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
}

function pmBadgeHtml(status) {
  if (!status) return '—'
  return `<span class="mt-pm mt-pm-${status}">${PM_LABELS[status]}</span>`
}

function notePill(text) {
  if (!text) return `<span class="mt-muted">—</span>`
  return `<span class="mt-note-pill" title="${text.replace(/"/g, '&quot;')}">${text}</span>`
}

function buildTableHtml(trucks, showWaitingOn) {
  if (trucks.length === 0) {
    return `<div class="mt-empty">No trucks in this section</div>`
  }
  const rows = trucks.map(t => `
    <tr>
      <td><strong>${t.unit}</strong></td>
      <td><span class="mt-vin">${t.vin}</span></td>
      <td class="mt-muted">${t.location}</td>
      <td>${notePill(t.driverNote)}</td>
      <td>${notePill(t.mechNote)}</td>
      <td>
        ${t.lastWork ? `<span class="mt-note-pill">${t.lastWork}</span><div class="mt-date">${fmtDate(t.lastChange)}</div>` : '<span class="mt-muted">—</span>'}
      </td>
      <td class="mt-date">${fmtDate(t.lastChange)}</td>
      <td class="mt-date">${t.changedBy}</td>
      ${showWaitingOn ? `<td style="color:var(--status-issues,#f59e0b);font-size:0.8rem">${t.waitingOn || '—'}</td>` : ''}
      <td>${pmBadgeHtml(t.pmStatus)}</td>
    </tr>
  `).join('')

  return `
    <table class="mt-table">
      <thead>
        <tr>
          <th>Unit</th><th>VIN</th><th>Location</th>
          <th>Driver Notes</th><th>Mechanic Notes</th>
          <th>Last Work Done</th><th>Last Change</th><th>Changed By</th>
          ${showWaitingOn ? '<th>Waiting On</th>' : ''}
          <th>Next PM</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `
}

export function Tool() {
  const el = document.createElement('div')

  const style = document.createElement('style')
  style.textContent = `
    .mt-wrap   { font-family: 'Inter', system-ui, sans-serif; }
    .mt-banner {
      display:flex; align-items:center; gap:0.75rem;
      padding:0.875rem 1.125rem; margin-bottom:1.25rem;
      background:var(--primary-container,#2d1e08);
      border:1px solid var(--primary,#D4943A);
      border-left:4px solid var(--primary,#D4943A);
      border-radius:0.5rem; font-size:0.8125rem;
      color:var(--on-primary-container,#f0c87a);
    }
    .mt-banner a {
      color:var(--primary,#D4943A); font-weight:700;
      text-decoration:underline;
    }
    .mt-search-row { display:flex; gap:0.75rem; align-items:center; margin-bottom:1rem; flex-wrap:wrap; }
    .mt-search {
      flex:1; min-width:180px; padding:0.5rem 0.875rem;
      background:var(--surface-high,#1c1c1c); border:1px solid var(--outline,#2e2820);
      border-radius:0.5rem; color:var(--on-surface,#f0ece4);
      font-size:0.875rem; font-family:inherit; outline:none;
      transition:border-color 0.15s;
    }
    .mt-search:focus { border-color:var(--primary,#D4943A); }
    .mt-counts { display:flex; gap:0.5rem; flex-wrap:wrap; }
    .mt-chip {
      padding:0.25rem 0.625rem; border-radius:9999px; font-size:0.7rem;
      font-weight:700; text-transform:uppercase; letter-spacing:0.06em; border:1px solid;
    }
    .mt-chip-ready   { color:var(--status-ready,#22c55e);  background:var(--status-ready-bg,#052e16);  border-color:var(--status-ready-border,#14532d); }
    .mt-chip-issues  { color:var(--status-issues,#f59e0b); background:var(--status-issues-bg,#2d1f00); border-color:var(--status-issues-border,#78350f); }
    .mt-chip-oos     { color:var(--status-oos,#ef4444);    background:var(--status-oos-bg,#2d0808);    border-color:var(--status-oos-border,#7f1d1d); }

    .mt-section { margin-bottom:1rem; border:1px solid var(--outline-variant,#1e1b17); border-radius:0.75rem; overflow:hidden; }
    .mt-sec-hdr {
      display:flex; align-items:center; gap:0.75rem;
      padding:0.875rem 1.125rem; cursor:pointer; user-select:none;
      background:var(--surface-container,#111111);
      border:none; width:100%; text-align:left; font-family:inherit;
      transition:background-color 0.15s;
    }
    .mt-sec-hdr:hover { background:var(--surface-high,#1c1c1c); }
    .mt-sec-icon {
      display:inline-flex; align-items:center; justify-content:center;
      width:1.5rem; height:1.5rem; border-radius:50%;
      font-size:0.7rem; font-weight:800; border:1px solid; flex-shrink:0;
    }
    .mt-sec-icon-ready  { color:var(--status-ready,#22c55e);  background:var(--status-ready-bg,#052e16);  border-color:var(--status-ready-border,#14532d); }
    .mt-sec-icon-issues { color:var(--status-issues,#f59e0b); background:var(--status-issues-bg,#2d1f00); border-color:var(--status-issues-border,#78350f); }
    .mt-sec-icon-oos    { color:var(--status-oos,#ef4444);    background:var(--status-oos-bg,#2d0808);    border-color:var(--status-oos-border,#7f1d1d); }

    .mt-sec-title { font-weight:700; font-size:0.9375rem; color:var(--on-surface,#f0ece4); flex:1; }
    .mt-sec-count {
      display:inline-flex; align-items:center; justify-content:center;
      min-width:1.5rem; height:1.5rem; padding:0 0.375rem;
      border-radius:9999px; font-size:0.72rem; font-weight:700;
      background:var(--surface-high,#1c1c1c); color:var(--on-surface-muted,#8a7e6e);
      border:1px solid var(--outline-variant,#1e1b17);
    }
    .mt-chevron { color:var(--on-surface-muted,#8a7e6e); font-size:0.75rem; transition:transform 0.2s; }
    .mt-sec-body { overflow-x:auto; background:var(--surface-container,#111111); }
    .mt-table { width:100%; border-collapse:collapse; font-size:0.8rem; }
    .mt-table th {
      text-align:left; padding:0.5rem 0.875rem;
      background:var(--surface-high,#1c1c1c); color:var(--on-surface-muted,#8a7e6e);
      font-weight:700; font-size:0.66rem; text-transform:uppercase; letter-spacing:0.07em;
      border-bottom:1px solid var(--outline,#2e2820); white-space:nowrap;
    }
    .mt-table td {
      padding:0.55rem 0.875rem; border-bottom:1px solid var(--outline-variant,#1e1b17);
      vertical-align:middle; color:var(--on-surface,#f0ece4);
    }
    .mt-table tbody tr:hover { background:var(--surface-high,#1c1c1c); }
    .mt-table tbody tr:last-child td { border-bottom:none; }
    .mt-vin { font-family:monospace; font-size:0.72rem; color:var(--on-surface-muted,#8a7e6e); }
    .mt-muted { color:var(--on-surface-muted,#8a7e6e); font-size:0.8rem; }
    .mt-date { font-size:0.68rem; color:var(--on-surface-muted,#8a7e6e); white-space:nowrap; }
    .mt-note-pill {
      display:inline-block; max-width:200px; overflow:hidden;
      text-overflow:ellipsis; white-space:nowrap;
      font-size:0.75rem; color:var(--on-surface-muted,#8a7e6e); font-style:italic;
    }
    .mt-pm { display:inline-flex; align-items:center; padding:0.2rem 0.55rem; border-radius:9999px; font-size:0.68rem; font-weight:700; letter-spacing:0.04em; border:1px solid; }
    .mt-pm-ok      { background:var(--status-ready-bg,#052e16);  color:var(--status-ready,#22c55e);  border-color:var(--status-ready-border,#14532d); }
    .mt-pm-soon    { background:var(--status-issues-bg,#2d1f00); color:var(--status-issues,#f59e0b); border-color:var(--status-issues-border,#78350f); }
    .mt-pm-overdue { background:var(--status-oos-bg,#2d0808);    color:var(--status-oos,#ef4444);    border-color:var(--status-oos-border,#7f1d1d); }
    .mt-empty { padding:2rem; text-align:center; color:var(--on-surface-muted,#8a7e6e); font-size:0.875rem; }
  `
  el.appendChild(style)

  const wrapper = document.createElement('div')
  wrapper.className = 'mt-wrap'

  // Build section HTML
  function buildSection(key, filteredTrucks) {
    const showWaitingOn = key === 'issues' || key === 'oos'
    const total = MOCK_TRUCKS[key].length
    return `
      <div class="mt-section" id="mt-sec-${key}">
        <button class="mt-sec-hdr" data-key="${key}" aria-expanded="true">
          <span class="mt-sec-icon mt-sec-icon-${key}">${STATUS_ICONS[key]}</span>
          <span class="mt-sec-title">${STATUS_LABELS[key]}</span>
          <span class="mt-sec-count" id="mt-count-${key}">${filteredTrucks.length === total ? total : filteredTrucks.length + ' / ' + total}</span>
          <span class="mt-chevron" id="mt-chev-${key}" style="transform:rotate(180deg)">▾</span>
        </button>
        <div class="mt-sec-body" id="mt-body-${key}">
          ${buildTableHtml(filteredTrucks, showWaitingOn)}
        </div>
      </div>
    `
  }

  function filterTrucks(q) {
    const qLc = q.toLowerCase()
    const filtered = {}
    for (const key of STATUS_KEYS) {
      filtered[key] = q
        ? MOCK_TRUCKS[key].filter(t =>
            t.unit.toLowerCase().includes(qLc) ||
            t.vin.toLowerCase().includes(qLc) ||
            t.location.toLowerCase().includes(qLc) ||
            (t.driverNote || '').toLowerCase().includes(qLc) ||
            (t.mechNote || '').toLowerCase().includes(qLc)
          )
        : [...MOCK_TRUCKS[key]]
    }
    return filtered
  }

  function renderSections(q = '') {
    const filtered = filterTrucks(q)
    for (const key of STATUS_KEYS) {
      const body = wrapper.querySelector(`#mt-body-${key}`)
      const count = wrapper.querySelector(`#mt-count-${key}`)
      const total = MOCK_TRUCKS[key].length
      if (body) body.innerHTML = buildTableHtml(filtered[key], key === 'issues' || key === 'oos')
      if (count) count.textContent = filtered[key].length === total ? total : `${filtered[key].length} / ${total}`
    }
  }

  const totalReady  = MOCK_TRUCKS.ready.length
  const totalIssues = MOCK_TRUCKS.issues.length
  const totalOOS    = MOCK_TRUCKS.oos.length

  wrapper.innerHTML = `
    <div class="mt-banner">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
      </svg>
      <span>
        <strong>Read-only preview</strong> — dummy data only.
        Sign in at the live app to manage your fleet in real time.
      </span>
    </div>

    <div class="mt-search-row">
      <input type="search" class="mt-search" placeholder="Search unit, VIN, location, notes…" id="mt-search" />
      <div class="mt-counts">
        <span class="mt-chip mt-chip-ready">${totalReady} Ready</span>
        <span class="mt-chip mt-chip-issues">${totalIssues} Issues</span>
        <span class="mt-chip mt-chip-oos">${totalOOS} OOS</span>
      </div>
    </div>

    ${STATUS_KEYS.map(key => buildSection(key, MOCK_TRUCKS[key])).join('')}
  `

  el.appendChild(wrapper)

  // Bind search
  wrapper.querySelector('#mt-search').addEventListener('input', e => {
    renderSections(e.target.value)
  })

  // Bind collapsible section headers
  wrapper.querySelectorAll('.mt-sec-hdr').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key
      const body  = wrapper.querySelector(`#mt-body-${key}`)
      const chev  = wrapper.querySelector(`#mt-chev-${key}`)
      const open  = body.style.display !== 'none'
      body.style.display = open ? 'none' : ''
      chev.style.transform = open ? 'rotate(0deg)' : 'rotate(180deg)'
      btn.setAttribute('aria-expanded', !open)
    })
  })

  return el
}
