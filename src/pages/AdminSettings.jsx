import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { STATUS, STATUS_LABELS, CATEGORY_LABELS } from '../lib/constants.js'
import Header from '../components/Header.jsx'

const EMPTY_TRUCK = { unit_number: '', vin: '', category: '', location_id: '', current_status: STATUS.READY, active: true }

export default function AdminSettings() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('trucks')

  const [trucks, setTrucks]           = useState([])
  const [locations, setLocations]     = useState([])
  const [notifSettings, setNotifSettings] = useState([])
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [msg, setMsg]                 = useState('')

  // Truck edit state
  const [editTruck, setEditTruck] = useState(null)  // null = adding new
  const [truckForm, setTruckForm] = useState(EMPTY_TRUCK)
  const [showTruckForm, setShowTruckForm] = useState(false)

  useEffect(() => {
    Promise.all([fetchAll()]).then(() => setLoading(false))
  }, [])

  async function fetchAll() {
    const [{ data: t }, { data: l }, { data: n }] = await Promise.all([
      supabase.from('trucks').select('*, locations(name)').order('unit_number'),
      supabase.from('locations').select('*').order('name'),
      supabase.from('notification_settings').select('*'),
    ])
    setTrucks(t || [])
    setLocations(l || [])
    setNotifSettings(n || [])
  }

  function openNewTruck() {
    setEditTruck(null)
    setTruckForm(EMPTY_TRUCK)
    setShowTruckForm(true)
  }

  function openEditTruck(truck) {
    setEditTruck(truck)
    setTruckForm({
      unit_number:    truck.unit_number,
      vin:            truck.vin || '',
      category:       truck.category || '',
      location_id:    truck.location_id,
      current_status: truck.current_status,
      active:         truck.active,
    })
    setShowTruckForm(true)
  }

  async function saveTruck(e) {
    e.preventDefault()
    setSaving(true)
    setMsg('')

    const payload = {
      unit_number:    truckForm.unit_number.trim(),
      vin:            truckForm.vin.trim() || null,
      category:       truckForm.category || null,
      location_id:    truckForm.location_id || null,
      current_status: truckForm.current_status,
      active:         truckForm.active,
    }

    let error
    if (editTruck) {
      ({ error } = await supabase.from('trucks').update(payload).eq('id', editTruck.id))
    } else {
      ({ error } = await supabase.from('trucks').insert(payload))
    }

    if (error) {
      setMsg('Error: ' + error.message)
    } else {
      setMsg(editTruck ? 'Truck updated.' : 'Truck added.')
      setShowTruckForm(false)
      fetchAll()
    }
    setSaving(false)
  }

  async function deactivateTruck(truck) {
    if (!confirm(`Deactivate ${truck.unit_number}? It will be hidden from the dashboard.`)) return
    await supabase.from('trucks').update({ active: false }).eq('id', truck.id)
    fetchAll()
  }

  async function saveNotifSettings(e) {
    e.preventDefault()
    setSaving(true)
    // Upsert all three notification rows
    const rows = notifSettings.map(s => ({ ...s }))
    const { error } = await supabase.from('notification_settings').upsert(rows, { onConflict: 'status_type' })
    setMsg(error ? 'Error: ' + error.message : 'Notification settings saved.')
    setSaving(false)
  }

  function updateNotifEmails(statusType, value) {
    setNotifSettings(prev =>
      prev.map(s => s.status_type === statusType ? { ...s, emails: value.split(',').map(e => e.trim()).filter(Boolean) } : s)
    )
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
        <Header />
        <div className="flex items-center justify-center" style={{ paddingTop: '4rem' }}>
          <div style={{
            width: 36, height: 36,
            border: '3px solid var(--outline)',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Header />

      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '1.5rem 1.25rem 4rem' }}>
        <div className="flex items-center gap-4 mb-6">
          <button className="btn-ghost" onClick={() => navigate('/')}>← Dashboard</button>
          <h1 style={{ margin: 0, fontWeight: 800, fontSize: '1.375rem', color: 'var(--on-surface)' }}>
            Admin Settings
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6" style={{ borderBottom: '1px solid var(--outline)', paddingBottom: '0.75rem' }}>
          {[['trucks', 'Manage Trucks'], ['notifications', 'Notifications']].map(([id, label]) => (
            <button
              key={id}
              className={tab === id ? 'btn-primary' : 'btn-secondary'}
              style={{ fontSize: '0.8125rem' }}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {msg && (
          <div style={{
            marginBottom: '1rem',
            padding: '0.75rem 1rem',
            background: 'var(--primary-container)',
            border: '1px solid var(--primary)',
            borderRadius: '0.5rem',
            color: 'var(--on-primary-container)',
            fontSize: '0.875rem',
          }}>
            {msg}
          </div>
        )}

        {/* TRUCKS TAB */}
        {tab === 'trucks' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p style={{ color: 'var(--on-surface-muted)', fontSize: '0.875rem', margin: 0 }}>
                {trucks.filter(t => t.active).length} active trucks
              </p>
              <button className="btn-primary" style={{ fontSize: '0.8125rem' }} onClick={openNewTruck}>
                + Add Truck
              </button>
            </div>

            {/* Truck form */}
            {showTruckForm && (
              <div style={{
                marginBottom: '1.5rem',
                padding: '1.5rem',
                background: 'var(--surface-container)',
                border: '1px solid var(--outline)',
                borderRadius: '0.75rem',
              }}>
                <h3 style={{ margin: '0 0 1.25rem', fontWeight: 700, fontSize: '1rem', color: 'var(--on-surface)' }}>
                  {editTruck ? `Edit ${editTruck.unit_number}` : 'Add New Truck'}
                </h3>
                <form onSubmit={saveTruck}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Unit Number *</label>
                      <input
                        className="form-input"
                        value={truckForm.unit_number}
                        onChange={e => setTruckForm(f => ({ ...f, unit_number: e.target.value }))}
                        required
                        placeholder="e.g. T-101"
                      />
                    </div>
                    <div>
                      <label className="form-label">VIN <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--on-surface-muted)' }}>(optional)</span></label>
                      <input
                        className="form-input"
                        value={truckForm.vin}
                        onChange={e => setTruckForm(f => ({ ...f, vin: e.target.value }))}
                        placeholder="17-character VIN"
                        maxLength={17}
                      />
                    </div>
                    <div>
                      <label className="form-label">Category</label>
                      <select
                        className="form-select"
                        value={truckForm.category}
                        onChange={e => setTruckForm(f => ({ ...f, category: e.target.value }))}
                      >
                        <option value="">-- No Category --</option>
                        {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Location</label>
                      <select
                        className="form-select"
                        value={truckForm.location_id}
                        onChange={e => setTruckForm(f => ({ ...f, location_id: e.target.value }))}
                      >
                        <option value="">-- No Location --</option>
                        {locations.map(l => (
                          <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Initial Status</label>
                      <select
                        className="form-select"
                        value={truckForm.current_status}
                        onChange={e => setTruckForm(f => ({ ...f, current_status: e.target.value }))}
                      >
                        {Object.entries(STATUS_LABELS).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-5">
                    <button type="submit" className="btn-primary" disabled={saving}>
                      {saving ? 'Saving…' : editTruck ? 'Save Changes' : 'Add Truck'}
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => setShowTruckForm(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Truck list */}
            <div style={{
              background: 'var(--surface-container)',
              border: '1px solid var(--outline-variant)',
              borderRadius: '0.75rem',
              overflow: 'hidden',
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table className="fleet-table">
                  <thead>
                    <tr>
                      <th>Unit</th>
                      <th>VIN</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Active</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {trucks.map(truck => (
                      <tr key={truck.id}>
                        <td style={{ fontWeight: 600 }}>{truck.unit_number}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--on-surface-muted)' }}>{truck.vin}</td>
                        <td>{truck.locations?.name || '—'}</td>
                        <td>
                          <span className={`status-badge status-badge-${truck.current_status}`}>
                            {STATUS_LABELS[truck.current_status]}
                          </span>
                        </td>
                        <td>
                          <span style={{ color: truck.active ? 'var(--status-ready)' : 'var(--on-surface-muted)', fontSize: '0.75rem' }}>
                            {truck.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button className="btn-ghost" onClick={() => openEditTruck(truck)}>Edit</button>
                            {truck.active && (
                              <button className="btn-ghost" style={{ color: 'var(--error)' }} onClick={() => deactivateTruck(truck)}>
                                Deactivate
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {tab === 'notifications' && (
          <div>
            <p style={{ color: 'var(--on-surface-muted)', fontSize: '0.875rem', marginBottom: '1.5rem', marginTop: 0 }}>
              Daily summary emails are sent once per day with all status changes from the previous 24 hours.
              Enter comma-separated email addresses for each recipient group.
            </p>
            <form onSubmit={saveNotifSettings} style={{
              background: 'var(--surface-container)',
              border: '1px solid var(--outline)',
              borderRadius: '0.75rem',
              padding: '1.5rem',
            }}>
              {[STATUS.READY, STATUS.ISSUES, STATUS.OOS].map(statusType => {
                const setting = notifSettings.find(s => s.status_type === statusType)
                return (
                  <div key={statusType} style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label">
                      Recipients for "{STATUS_LABELS[statusType]}" changes
                    </label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="user@example.com, manager@example.com"
                      value={(setting?.emails || []).join(', ')}
                      onChange={e => updateNotifEmails(statusType, e.target.value)}
                    />
                  </div>
                )
              })}
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save Notification Settings'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}
