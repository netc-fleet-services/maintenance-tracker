import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, invokeFunction } from '../lib/supabase.js'
import { STATUS, STATUS_LABELS } from '../lib/constants.js'
import CategoryFilter from '../components/CategoryFilter.jsx'
import { useAuth } from '../App.jsx'
import Header from '../components/Header.jsx'
import SearchBar from '../components/SearchBar.jsx'
import LocationFilter from '../components/LocationFilter.jsx'
import StatusTable from '../components/StatusTable.jsx'
import NotesDrawer from '../components/NotesDrawer.jsx'

export default function Dashboard() {
  const { profile } = useAuth()

  const [trucks, setTrucks] = useState([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [search, setSearch] = useState('')
  const [locationFilter, setLocationFilter]   = useState('all')
  const [categoryFilter, setCategoryFilter]   = useState('all')
  const [maintenanceFilter, setMaintenanceFilter] = useState(false)

  const [notesDrawer, setNotesDrawer] = useState(null)   // truck
  const [lastSynced, setLastSynced] = useState(null)     // ISO string from settings table
  const [syncingNow, setSyncingNow] = useState(false)
  const [, setTick] = useState(0)
  const tickRef = useRef(null)

  const fetchLastSynced = useCallback(async () => {
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'last_synced_on_job')
      .single()
    if (data?.value) setLastSynced(data.value)
  }, [])

  const fetchTrucks = useCallback(async () => {
    const { data, error } = await supabase
      .from('trucks')
      .select(`
        *,
        locations ( id, name ),
        maintenance ( last_pm_date, last_pm_mileage, next_pm_date, next_pm_mileage ),
        truck_notes ( id, note_type, body, created_by, created_at ),
        status_history ( id, old_status, new_status, changed_by, created_at, comment )
      `)
      .eq('active', true)
      .order('unit_number')

    if (error) { setError(error.message); setLoading(false); return }
    setTrucks(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchTrucks()
    fetchLocations()
    fetchLastSynced()

    // Re-tick every 30s so "X min ago" label stays current
    tickRef.current = setInterval(() => setTick(n => n + 1), 30_000)

    // Realtime subscription — re-fetch on any truck change
    const channel = supabase
      .channel('trucks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trucks' }, fetchTrucks)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'truck_notes' }, fetchTrucks)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'status_history' }, fetchTrucks)
      .subscribe()

    return () => {
      clearInterval(tickRef.current)
      supabase.removeChannel(channel)
    }
  }, [fetchTrucks, fetchLastSynced])

  async function fetchLocations() {
    const { data } = await supabase.from('locations').select('*').order('name')
    setLocations(data || [])
  }

  // Filter trucks for display
  function filterTrucks(truckList) {
    return truckList.filter(t => {
      if (locationFilter !== 'all' && t.location_id !== locationFilter) return false
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false
      if (maintenanceFilter && !isPMDue(t)) return false
      if (search) {
        const q = search.toLowerCase()
        const loc = t.locations?.name || ''
        const latestDriverNote = latestNote(t, 'driver')?.body || ''
        const latestMechNote   = latestNote(t, 'mechanic')?.body || ''
        if (
          !t.unit_number?.toLowerCase().includes(q) &&
          !t.vin?.toLowerCase().includes(q) &&
          !loc.toLowerCase().includes(q) &&
          !latestDriverNote.toLowerCase().includes(q) &&
          !latestMechNote.toLowerCase().includes(q)
        ) return false
      }
      return true
    })
  }

  const readyTrucks  = filterTrucks(trucks.filter(t => t.current_status === STATUS.READY))
  const issuesTrucks = filterTrucks(trucks.filter(t => t.current_status === STATUS.ISSUES))
  const oosTrucks    = filterTrucks(trucks.filter(t => t.current_status === STATUS.OOS))

  async function handleStatusChange(truck, newStatus, comment, waitingOn) {
    const { error } = await supabase.rpc('change_truck_status', {
      p_truck_id:   truck.id,
      p_new_status: newStatus,
      p_comment:    comment || null,
      p_waiting_on: waitingOn !== undefined ? waitingOn : null,
      p_changed_by: profile?.email || profile?.id || 'Unknown',
    })
    if (error) alert(error.message)
    else fetchTrucks()
  }

  async function handleUpdateWaitingOn(truckId, waitingOn) {
    const { error } = await supabase
      .from('trucks')
      .update({ waiting_on: waitingOn || null })
      .eq('id', truckId)
    if (error) alert(error.message)
    else fetchTrucks()
  }

  async function handleAddNote(truck, noteType, body, noteId = null) {
    let error
    if (noteId) {
      ({ error } = await supabase.from('truck_notes').update({ body }).eq('id', noteId))
    } else {
      ({ error } = await supabase.from('truck_notes').insert({
        truck_id:   truck.id,
        note_type:  noteType,
        body,
        created_by: profile?.email || profile?.id || 'Unknown',
      }))
    }
    if (error) alert(error.message)
  }

  async function handleDeleteNote(noteId) {
    const { error } = await supabase.from('truck_notes').delete().eq('id', noteId)
    if (error) alert(error.message)
  }

  function timeAgo(iso) {
    if (!iso) return null
    const mins = Math.floor((Date.now() - new Date(iso)) / 60_000)
    if (mins < 1)  return 'Just now'
    if (mins < 60) return `${mins} min ago`
    const hrs = Math.floor(mins / 60)
    return `${hrs} hr${hrs !== 1 ? 's' : ''} ago`
  }

  async function handleSyncJobStatus() {
    setSyncingNow(true)
    try {
      await invokeFunction('trigger-job-sync')
      if (error) throw error
      // Give the workflow ~8s to start and write the first update before re-reading
      await new Promise(r => setTimeout(r, 8000))
      await fetchTrucks()
      await fetchLastSynced()
    } catch (err) {
      alert('Could not trigger sync: ' + (err?.message || err))
    } finally {
      setSyncingNow(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface)' }}>
        <div style={{
          width: 36, height: 36,
          border: '3px solid var(--outline)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Header />

      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '1.5rem 1.25rem 4rem' }}>
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6" style={{ flexWrap: 'wrap' }}>
          <div className="flex-1 min-w-0">
            <SearchBar value={search} onChange={setSearch} />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              className={maintenanceFilter ? 'btn-primary' : 'btn-secondary'}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.875rem' }}
              onClick={() => setMaintenanceFilter(v => !v)}
            >
              PM Due
            </button>
            <div className="flex items-center gap-2">
              <button
                className="btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.875rem', opacity: syncingNow ? 0.6 : 1 }}
                onClick={handleSyncJobStatus}
                disabled={syncingNow}
              >
                {syncingNow ? 'Refreshing…' : '↻ Job Status'}
              </button>
              {lastSynced && (
                <span style={{ fontSize: '0.7rem', color: 'var(--on-surface-muted)', whiteSpace: 'nowrap' }}>
                  {timeAgo(lastSynced)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Location filter */}
        <LocationFilter
          locations={locations}
          value={locationFilter}
          onChange={setLocationFilter}
        />

        {/* Category filter */}
        <CategoryFilter value={categoryFilter} onChange={setCategoryFilter} />

        {error && (
          <div style={{
            marginTop: '1rem',
            padding: '0.875rem 1rem',
            background: 'var(--error-container)',
            border: '1px solid var(--error)',
            borderRadius: '0.5rem',
            color: 'var(--error)',
            fontSize: '0.875rem',
          }}>
            {error}
          </div>
        )}

        {/* Status sections */}
        <div className="flex flex-col gap-4 mt-5">
          <StatusTable
            status={STATUS.OOS}
            trucks={oosTrucks}
            totalCount={trucks.filter(t => t.current_status === STATUS.OOS).length}
            profile={profile}
            onStatusChange={handleStatusChange}
            onViewHistory={truck => setNotesDrawer(truck)}
            onUpdateWaitingOn={handleUpdateWaitingOn}
          />
          <StatusTable
            status={STATUS.ISSUES}
            trucks={issuesTrucks}
            totalCount={trucks.filter(t => t.current_status === STATUS.ISSUES).length}
            profile={profile}
            onStatusChange={handleStatusChange}
            onViewHistory={truck => setNotesDrawer(truck)}
            onUpdateWaitingOn={handleUpdateWaitingOn}
          />
          <StatusTable
            status={STATUS.READY}
            trucks={readyTrucks}
            totalCount={trucks.filter(t => t.current_status === STATUS.READY).length}
            profile={profile}
            onStatusChange={handleStatusChange}
            onViewHistory={truck => setNotesDrawer(truck)}
            onUpdateWaitingOn={handleUpdateWaitingOn}
          />
        </div>
      </main>

      {/* Notes / History Drawer */}
      {notesDrawer && (
        <NotesDrawer
          truck={notesDrawer}
          profile={profile}
          onAddNote={handleAddNote}
          onClose={() => setNotesDrawer(null)}
        />
      )}
    </div>
  )
}

// Helper: get latest note of a type from a truck's truck_notes array
export function latestNote(truck, type) {
  if (!truck.truck_notes) return null
  return truck.truck_notes
    .filter(n => n.note_type === type)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] || null
}

// Helper: determine if PM is due
export function isPMDue(truck) {
  if (!truck.maintenance?.next_pm_date) return false
  const now = new Date()
  const due = new Date(truck.maintenance.next_pm_date)
  const daysUntil = (due - now) / (1000 * 60 * 60 * 24)
  return daysUntil <= 30
}
