import { useState, useEffect } from 'react'
import { format } from 'date-fns'

export default function EventModal({ date, event, categories, onSave, onDelete, onClose }) {
  const isEdit = !!event
  const [title, setTitle] = useState(event?.title || '')
  const [description, setDescription] = useState(event?.description || '')
  const [categoryId, setCategoryId] = useState(event?.category_id || '')
  const [startAt, setStartAt] = useState(
    event?.start_at
      ? format(new Date(event.start_at), "yyyy-MM-dd'T'HH:mm")
      : date
        ? `${format(date, 'yyyy-MM-dd')}T09:00`
        : ''
  )
  const [endAt, setEndAt] = useState(
    event?.end_at
      ? format(new Date(event.end_at), "yyyy-MM-dd'T'HH:mm")
      : date
        ? `${format(date, 'yyyy-MM-dd')}T10:00`
        : ''
  )
  const [allDay, setAllDay] = useState(event?.all_day || false)
  const [location, setLocation] = useState(event?.location || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required'); return }
    setLoading(true)
    setError('')

    const payload = {
      title: title.trim(),
      description,
      category_id: categoryId || null,
      start_at: new Date(startAt).toISOString(),
      end_at: endAt ? new Date(endAt).toISOString() : null,
      all_day: allDay,
      location,
    }

    const { error: saveError } = await onSave(payload)
    if (saveError) setError(saveError.message)
    else onClose()
    setLoading(false)
  }

  async function handleDelete() {
    if (!window.confirm('Delete this event?')) return
    setLoading(true)
    await onDelete(event.id)
    onClose()
  }

  return (
    <div style={overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modal} className="slide-in">
        <div style={header}>
          <h2 style={title_s}>{isEdit ? 'Edit Event' : 'New Event'}</h2>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={form}>
          {/* Title */}
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Event title..."
            style={inputLarge}
            autoFocus
          />

          {/* Category */}
          <div style={row}>
            <label style={label}>Category</label>
            <div style={catGrid}>
              <button
                type="button"
                onClick={() => setCategoryId('')}
                style={{ ...catBtn, ...(categoryId === '' ? catBtnActive('#6b7280') : {}) }}
              >
                None
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  style={{ ...catBtn, ...(categoryId === cat.id ? catBtnActive(cat.color) : {}), borderColor: cat.color + '60' }}
                >
                  <span>{cat.icon}</span> {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* All day toggle */}
          <div style={{ ...row, alignItems: 'center' }}>
            <label style={label}>All day</label>
            <input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} style={{ accentColor: 'var(--accent)', width: 16, height: 16 }} />
          </div>

          {/* Times */}
          {!allDay && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={label}>Start</label>
                <input type="datetime-local" value={startAt} onChange={e => setStartAt(e.target.value)} style={input} />
              </div>
              <div>
                <label style={label}>End</label>
                <input type="datetime-local" value={endAt} onChange={e => setEndAt(e.target.value)} style={input} />
              </div>
            </div>
          )}

          {/* Location */}
          <div>
            <label style={label}>Location</label>
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Add location..." style={input} />
          </div>

          {/* Description */}
          <div>
            <label style={label}>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add notes..."
              rows={3}
              style={{ ...input, resize: 'vertical' }}
            />
          </div>

          {error && <div style={errorBox}>{error}</div>}

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            {isEdit && (
              <button type="button" onClick={handleDelete} disabled={loading} style={deleteBtnStyle}>
                Delete
              </button>
            )}
            <button type="submit" disabled={loading} style={{ ...saveBtn, marginLeft: 'auto' }}>
              {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const overlay = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.7)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000, padding: 16,
  backdropFilter: 'blur(4px)',
}
const modal = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  width: '100%', maxWidth: 520,
  maxHeight: '90vh', overflowY: 'auto',
  boxShadow: 'var(--shadow-lg)',
}
const header = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '20px 24px 0',
}
const title_s = { fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }
const closeBtn = { background: 'none', color: 'var(--text-muted)', fontSize: 18, padding: 4 }
const form = { display: 'flex', flexDirection: 'column', gap: 16, padding: '16px 24px 24px' }
const inputLarge = {
  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', padding: '12px 14px',
  color: 'var(--text-primary)', fontSize: 16, fontWeight: 500, width: '100%',
}
const input = {
  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', padding: '9px 12px',
  color: 'var(--text-primary)', fontSize: 13, width: '100%', marginTop: 4,
}
const label = { fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }
const row = { display: 'flex', flexDirection: 'column', gap: 8 }
const catGrid = { display: 'flex', flexWrap: 'wrap', gap: 6 }
const catBtn = {
  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
  color: 'var(--text-secondary)', borderRadius: 20, padding: '5px 12px',
  fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s',
}
const catBtnActive = (color) => ({
  background: color + '25', borderColor: color, color: '#fff', fontWeight: 600,
})
const saveBtn = {
  background: 'var(--accent)', color: '#fff',
  padding: '10px 20px', borderRadius: 'var(--radius-sm)',
  fontWeight: 600, fontSize: 13,
}
const deleteBtnStyle = {
  background: 'rgba(248,113,113,0.1)', color: '#f87171',
  border: '1px solid rgba(248,113,113,0.3)',
  padding: '10px 16px', borderRadius: 'var(--radius-sm)',
  fontWeight: 600, fontSize: 13,
}
const errorBox = {
  background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
  color: '#f87171', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: 13,
}
