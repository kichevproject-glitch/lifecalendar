import { useState, useRef } from 'react'
import { format } from 'date-fns'
import { usePhotos } from '../../hooks/usePhotos'

// Reminder options — value is minutes before the event
const REMINDER_OPTIONS = [
  { value: '',     label: 'No reminder' },
  { value: '1440', label: '1 day before' },
  { value: '180',  label: '3 hours before' },
  { value: '60',   label: '1 hour before' },
]

function getReminderLabel(val) {
  return REMINDER_OPTIONS.find(r => r.value === (val ? String(val) : ''))?.label || 'No reminder'
}

// ─────────────────────────────────────────────
// EventModal
//
// Modes:
//   • "view"   — read-only detail screen (existing event)
//   • "edit"   — edit form (toggled from view)
//   • "create" — new event form (only `date` passed, no event)
// ─────────────────────────────────────────────
export default function EventModal({ date, event, categories, onSave, onDelete, onClose }) {
  const isNew = !event
  const [mode, setMode] = useState(isNew ? 'create' : 'view')

  // Form state
  const [title,           setTitle]           = useState(event?.title || '')
  const [description,     setDescription]     = useState(event?.description || '')
  const [categoryId,      setCategoryId]      = useState(event?.category_id || '')
  const [startAt,         setStartAt]         = useState(
    event?.start_at
      ? format(new Date(event.start_at), "yyyy-MM-dd'T'HH:mm")
      : date ? `${format(date, 'yyyy-MM-dd')}T09:00` : ''
  )
  const [endAt, setEndAt] = useState(
    event?.end_at
      ? format(new Date(event.end_at), "yyyy-MM-dd'T'HH:mm")
      : date ? `${format(date, 'yyyy-MM-dd')}T10:00` : ''
  )
  const [allDay,          setAllDay]          = useState(event?.all_day || false)
  const [location,        setLocation]        = useState(event?.location || '')
  const [reminderMinutes, setReminderMinutes] = useState(
    event?.reminder_minutes ? String(event.reminder_minutes) : ''
  )
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  // Photos (only for existing events)
  const { photos, uploadPhoto, deletePhoto } = usePhotos(event?.id || null)
  const [uploading,     setUploading]     = useState(false)
  const [uploadError,   setUploadError]   = useState('')
  const [lightboxPhoto, setLightboxPhoto] = useState(null)
  const fileInputRef = useRef()

  // ── helpers ──────────────────────────────────────────────────────
  function getCat(id) { return categories.find(c => c.id === id) }

  function formatRange() {
    if (!event) return ''
    const start = new Date(event.start_at)
    if (event.all_day) return format(start, 'EEEE, d MMMM yyyy')
    const end = event.end_at ? new Date(event.end_at) : null
    return `${format(start, 'EEEE, d MMMM yyyy')} · ${format(start, 'HH:mm')}${end ? ' – ' + format(end, 'HH:mm') : ''}`
  }

  function mapsLink(loc) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}`
  }

  // ── save ─────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required'); return }
    setLoading(true)
    setError('')
    const payload = {
      title:            title.trim(),
      description,
      category_id:      categoryId || null,
      start_at:         new Date(startAt).toISOString(),
      end_at:           endAt ? new Date(endAt).toISOString() : null,
      all_day:          allDay,
      location:         location.trim(),
      reminder_minutes: reminderMinutes ? parseInt(reminderMinutes) : null,
      reminder_sent:    false, // reset if reminder changes
    }
    const { error: saveError } = await onSave(payload)
    if (saveError) { setError(saveError.message); setLoading(false) }
    else { isNew ? onClose() : setMode('view'); setLoading(false) }
  }

  // ── delete ───────────────────────────────────────────────────────
  async function handleDelete() {
    if (!window.confirm('Delete this event?')) return
    setLoading(true)
    await onDelete(event.id)
    onClose()
  }

  // ── photo upload ─────────────────────────────────────────────────
  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setUploadError('Only image files are supported.'); return }
    if (file.size > 8 * 1024 * 1024)    { setUploadError('Max file size is 8 MB.'); return }
    setUploading(true)
    setUploadError('')
    const { error: upErr } = await uploadPhoto(file)
    if (upErr) setUploadError(upErr.message)
    setUploading(false)
    e.target.value = ''
  }

  const cat = getCat(categoryId || event?.category_id)

  // ─────────────────────────────────────────────────────────────────
  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modal} className="slide-in">

        {/* ════════════════════════════════════════
            VIEW MODE
        ════════════════════════════════════════ */}
        {mode === 'view' && event && (
          <>
            {/* Category colour bar */}
            <div style={{ height: 6, borderRadius: '18px 18px 0 0', background: cat?.color || 'var(--accent)' }} />

            <div style={viewBody}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  {cat && (
                    <div style={{ ...catPill, background: cat.color + '20', color: cat.color, borderColor: cat.color + '40' }}>
                      {cat.icon} {cat.name}
                    </div>
                  )}
                  <h2 style={viewTitle}>{event.title}</h2>
                </div>
                <button onClick={onClose} style={closeBtn}>✕</button>
              </div>

              {/* Date / time */}
              <MetaRow icon="🗓">
                <span style={metaText}>{formatRange()}</span>
              </MetaRow>

              {/* Location — opens Google Maps */}
              {event.location && (
                <MetaRow icon="📍">
                  <a href={mapsLink(event.location)} target="_blank" rel="noopener noreferrer"
                    style={{ ...metaText, color: 'var(--accent)', textDecoration: 'underline', textUnderlineOffset: 3 }}>
                    {event.location}
                  </a>
                </MetaRow>
              )}

              {/* Reminder */}
              <MetaRow icon="🔔">
                {event.reminder_minutes ? (
                  <span style={metaText}>
                    Email reminder: <strong style={{ color: 'var(--text-primary)' }}>
                      {getReminderLabel(String(event.reminder_minutes))}
                    </strong>
                  </span>
                ) : (
                  <span style={{ ...metaText, color: 'var(--text-muted)' }}>No reminder set</span>
                )}
              </MetaRow>

              {/* Description */}
              {event.description && (
                <MetaRow icon="📝">
                  <span style={{ ...metaText, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{event.description}</span>
                </MetaRow>
              )}

              {/* Photos */}
              <div style={photoSection}>
                <div style={photoSectionHeader}>
                  <span style={sectionLabel}>Photos</span>
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploading} style={addPhotoBtn}>
                    {uploading ? '⏳' : '＋ Add'}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                </div>
                {uploadError && <div style={photoError}>{uploadError}</div>}
                {photos.length === 0 && !uploading ? (
                  <div style={emptyPhotos} onClick={() => fileInputRef.current?.click()}>
                    <span style={{ fontSize: 24, opacity: 0.4 }}>🖼️</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>No photos yet — click to add</span>
                  </div>
                ) : (
                  <div style={photoGrid}>
                    {photos.map(photo => (
                      <div key={photo.id} style={photoThumbWrap}>
                        <img src={photo.url} alt={photo.caption || ''} style={photoThumb}
                          onClick={() => setLightboxPhoto(photo)}
                          onError={e => { e.target.style.display = 'none' }} />
                        <button onClick={() => deletePhoto(photo)} style={photoDeleteBtn} title="Remove">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button onClick={handleDelete} style={deleteBtnStyle}>Delete</button>
                <button onClick={() => setMode('edit')} style={{ ...saveBtn, marginLeft: 'auto' }}>✏️ Edit</button>
              </div>
            </div>
          </>
        )}

        {/* ════════════════════════════════════════
            EDIT / CREATE MODE
        ════════════════════════════════════════ */}
        {(mode === 'edit' || mode === 'create') && (
          <>
            <div style={header}>
              <h2 style={titleStyle}>{isNew ? 'New Event' : 'Edit Event'}</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                {!isNew && (
                  <button onClick={() => setMode('view')} style={backBtn}>← Back</button>
                )}
                <button onClick={onClose} style={closeBtn}>✕</button>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={form}>

              {/* Title */}
              <input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Event title..." style={inputLarge} autoFocus />

              {/* Category */}
              <div style={fieldCol}>
                <label style={label}>Category</label>
                <div style={catGrid}>
                  <button type="button" onClick={() => setCategoryId('')}
                    style={{ ...catBtn, ...(categoryId === '' ? catBtnActive('#6b7280') : {}) }}>
                    None
                  </button>
                  {categories.map(c => (
                    <button key={c.id} type="button" onClick={() => setCategoryId(c.id)}
                      style={{ ...catBtn, ...(categoryId === c.id ? catBtnActive(c.color) : {}), borderColor: c.color + '50' }}>
                      <span>{c.icon}</span> {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* All day */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <label style={label}>All day</label>
                <input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)}
                  style={{ accentColor: 'var(--accent)', width: 16, height: 16 }} />
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
                <div style={locationWrap}>
                  <span style={locationPin}>📍</span>
                  <input value={location} onChange={e => setLocation(e.target.value)}
                    placeholder="Add location..." style={locationInput} />
                </div>
              </div>

              {/* Email Reminder */}
              <div>
                <label style={label}>Email Reminder</label>
                <div style={locationWrap}>
                  <span style={locationPin}>🔔</span>
                  <select value={reminderMinutes} onChange={e => setReminderMinutes(e.target.value)} style={reminderSelect}>
                    {REMINDER_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--text-muted)', pointerEvents: 'none' }}>▾</span>
                </div>
                {reminderMinutes && (
                  <div style={reminderHint}>
                    <span>✉️</span>
                    <span>An email will be sent to your account address — {getReminderLabel(reminderMinutes).toLowerCase()}</span>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label style={label}>Notes</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Add notes..." rows={3} style={{ ...input, resize: 'vertical' }} />
              </div>

              {/* Photos (edit mode only — event must already exist) */}
              {!isNew && (
                <div>
                  <label style={label}>Photos</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      disabled={uploading} style={uploadBtn}>
                      {uploading ? '⏳ Uploading...' : '🖼️ Attach Photo'}
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*"
                      style={{ display: 'none' }} onChange={handleFileChange} />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Max 8 MB · JPG, PNG, WEBP</span>
                  </div>
                  {uploadError && <div style={{ ...photoError, marginTop: 6 }}>{uploadError}</div>}
                  {photos.length > 0 && (
                    <div style={{ ...photoGrid, marginTop: 10 }}>
                      {photos.map(photo => (
                        <div key={photo.id} style={photoThumbWrap}>
                          <img src={photo.url} alt="" style={photoThumb}
                            onClick={() => setLightboxPhoto(photo)} />
                          <button onClick={() => deletePhoto(photo)} style={photoDeleteBtn} title="Remove">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {error && <div style={errorBox}>{error}</div>}

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                {!isNew && (
                  <button type="button" onClick={handleDelete} disabled={loading} style={deleteBtnStyle}>
                    Delete
                  </button>
                )}
                <button type="submit" disabled={loading} style={{ ...saveBtn, marginLeft: 'auto' }}>
                  {loading ? 'Saving...' : isNew ? 'Create Event' : 'Save Changes'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      {/* ── Lightbox ── */}
      {lightboxPhoto && (
        <div onClick={() => setLightboxPhoto(null)} style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <img src={lightboxPhoto.url} alt={lightboxPhoto.caption || ''}
            style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 12, boxShadow: '0 16px 64px rgba(0,0,0,0.6)' }}
            onClick={e => e.stopPropagation()} />
          <button onClick={() => setLightboxPhoto(null)} style={{
            position: 'absolute', top: 20, right: 24,
            background: 'rgba(255,255,255,0.15)', color: '#fff',
            border: 'none', borderRadius: 8, width: 36, height: 36, fontSize: 18, cursor: 'pointer',
          }}>✕</button>
          {lightboxPhoto.caption && (
            <div style={{
              position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '6px 16px', borderRadius: 20, fontSize: 13,
            }}>{lightboxPhoto.caption}</div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Small helper component ──────────────────────────────────────────
function MetaRow({ icon, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>{icon}</span>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const overlay = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.65)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000, padding: 16, backdropFilter: 'blur(4px)',
}
const modal = {
  background: 'var(--bg-card)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 520,
  maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-lg)',
}

// View mode
const viewBody  = { padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 14 }
const viewTitle = { fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginTop: 8, lineHeight: 1.25 }
const catPill   = { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, border: '1px solid', marginBottom: 4 }
const metaText  = { fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }

// Photo section
const photoSection       = { display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }
const photoSectionHeader = { display: 'flex', alignItems: 'center', gap: 10 }
const sectionLabel       = { fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', flex: 1 }
const addPhotoBtn        = { background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }
const emptyPhotos        = { border: '1.5px dashed var(--border)', borderRadius: 10, padding: '18px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }
const photoGrid          = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }
const photoThumbWrap     = { position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', background: 'var(--bg-secondary)' }
const photoThumb         = { width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer', display: 'block' }
const photoDeleteBtn     = { position: 'absolute', top: 3, right: 3, background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none', borderRadius: 4, width: 18, height: 18, fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }
const photoError         = { background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', padding: '8px 12px', borderRadius: 8, fontSize: 12 }
const uploadBtn          = { background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }

// Edit / Create mode
const header      = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 0' }
const titleStyle  = { fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }
const closeBtn    = { background: 'none', color: 'var(--text-muted)', fontSize: 18, padding: 4 }
const backBtn     = { background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }
const form        = { display: 'flex', flexDirection: 'column', gap: 16, padding: '16px 24px 24px' }
const fieldCol    = { display: 'flex', flexDirection: 'column', gap: 8 }
const label       = { fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }
const inputLarge  = { background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', color: 'var(--text-primary)', fontSize: 16, fontWeight: 500, width: '100%' }
const input       = { background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '9px 12px', color: 'var(--text-primary)', fontSize: 13, width: '100%', marginTop: 4 }
const catGrid     = { display: 'flex', flexWrap: 'wrap', gap: 6 }
const catBtn      = { background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: 20, padding: '5px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s' }
const catBtnActive = (color) => ({ background: color + '25', borderColor: color, color: color, fontWeight: 700 })

// Location & reminder shared wrapper
const locationWrap  = { position: 'relative', marginTop: 4 }
const locationPin   = { position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, pointerEvents: 'none' }
const locationInput = { background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '9px 12px 9px 32px', color: 'var(--text-primary)', fontSize: 13, width: '100%' }
const reminderSelect = { background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '9px 32px 9px 32px', color: 'var(--text-primary)', fontSize: 13, width: '100%', appearance: 'none', cursor: 'pointer' }
const reminderHint   = { marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, background: 'var(--accent-dim)', border: '1px solid rgba(124,111,255,0.2)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--text-secondary)' }

const saveBtn        = { background: 'var(--accent)', color: '#fff', padding: '10px 20px', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: 13 }
const deleteBtnStyle = { background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)', padding: '10px 16px', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: 13 }
const errorBox       = { background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: 13 }
