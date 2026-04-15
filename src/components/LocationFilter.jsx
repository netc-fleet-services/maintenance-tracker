export default function LocationFilter({ locations, value, onChange }) {
  return (
    <div
      className="flex gap-2 mb-5"
      style={{ flexWrap: 'wrap' }}
    >
      <button
        className={`loc-tab${value === 'all' ? ' active' : ''}`}
        onClick={() => onChange('all')}
      >
        All Locations
      </button>
      {locations.map(loc => (
        <button
          key={loc.id}
          className={`loc-tab${value === loc.id ? ' active' : ''}`}
          onClick={() => onChange(loc.id)}
        >
          {loc.name}
        </button>
      ))}
    </div>
  )
}
