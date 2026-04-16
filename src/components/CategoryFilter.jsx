import { CATEGORY_LABELS } from '../lib/constants.js'

export default function CategoryFilter({ value, onChange }) {
  return (
    <div className="flex gap-2 mb-3" style={{ flexWrap: 'wrap' }}>
      <button
        className={`loc-tab${value === 'all' ? ' active' : ''}`}
        onClick={() => onChange('all')}
      >
        All Categories
      </button>
      {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
        <button
          key={key}
          className={`loc-tab${value === key ? ' active' : ''}`}
          onClick={() => onChange(key)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
