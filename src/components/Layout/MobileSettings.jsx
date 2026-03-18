import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'

const PRESET_ICONS = [
  '💼','📊','📋','🖥️','📞','✉️','🏢','🤝','📝','🔬','🎓','📐',
  '🏃','🏋️','🚴','🧘','🏊','❤️','💊','🥗','🧠','🩺',
  '✈️','🚂','🚗','🏨','🧳','🏕️','🗺️','🏔️','🌊','☀️',
  '👨‍👩‍👧','🎂','🎁','🍽️','☕','🥂','🎉','🎊','🏆',
  '🎵','🎨','📚','🎮','🎭','📷','🎸','🌿','🐾','⚽','🎾','🎯',
  '🏠','🔧','💰','💳','📈','🛒',
]

const PRESET_COLORS = [
  '#EF4444','#F97316','#F59E0B','#EAB308','#84CC16','#22C55E','#10B981','#06B6D4',
  '#3B82F6','#6366F1','#8B5CF6','#EC4899','#F43F5E','#64748B','#0D9488','#D97706',
]

export default function MobileSettings({ categories, onCategoryCreate, onCategoryUpdate, onCategoryDelete, theme, toggleTheme }) {
  const { user, signOut } = useAuth()
  const [showCatForm, setShowCatForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#6C63FF')
  const [newIcon, setNewIcon] = useState('📌')
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [editIcon, setEditIcon] = useState('')

  async function handleCreateCat(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    await onCategoryCreate({ name: newName.trim(), color: newColor, icon: newIcon, type: 'event' })
    setNewName(''); setNewIcon('📌'); setNewColor('#6C63FF'); setShowCatForm(false); setCreating(false)
  }

  function startEdit(cat) { setEditingId(cat.id); setEditName(cat.name); setEditColor(cat.color); setEditIcon(cat.icon); setShowCatForm(false) }

  async function handleSaveEdit(id) {
    if (!editName.trim()) return
    await onCategoryUpdate(id, { name: editName.trim(), color: editColor, icon: editIcon })
    setEditingId(null)
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this category?')) return
    await onCategoryDelete(id); setEditingId(null)
  }

  return (
    <div style={wrapper}>
      <div style={header}>
        <h2 style={title}>Settings</h2>
      </div>
      <div style={content}>
        {/* Account */}
        <div style={section}>
          <p style={sectionLabel}>Account</p>
          <div style={card}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{user?.email}</div>
            <button onClick={signOut} style={signOutBtn}>Sign Out</button>
          </div>
        </div>

        {/* Theme */}
        <div style={section}>
          <p style={sectionLabel}>Appearance</p>
          <div style={card} onClick={toggleTheme}>
            <span style={{ fontSize: 15 }}>{theme === 'dark' ? '🌙' : '☀️'}</span>
            <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)' }}>
              {theme === 'dark' ? 'Dark mode' : 'Light mode'}
            </span>
            <span style={{ fontSize: 11, color: 'var(--accent)' }}>Toggle</span>
          </div>
        </div>

        {/* Categories */}
        <div style={section}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={sectionLabel}>Categories</p>
            <button onClick={() => { setShowCatForm(v => !v); setEditingId(null) }} style={addBtn}>
              {showCatForm ? '✕' : '+ Add'}
            </button>
          </div>

          {showCatForm && (
            <form onSubmit={handleCreateCat} style={formCard}>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Category name" style={input} autoFocus />
              <div style={pickerLabel}>Icon</div>
              <div style={iconGrid}>
                {PRESET_ICONS.map(ic => (
                  <button key={ic} type="button" onClick={() => setNewIcon(ic)} style={{ ...iconBtn, background: newIcon === ic ? 'var(--accent-dim)' : 'transparent' }}>{ic}</button>
                ))}
              </div>
              <div style={pickerLabel}>Color</div>
              <div style={colorGrid}>
                {PRESET_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setNewColor(c)} style={{ ...colorDot, background: c, outline: newColor === c ? `2px solid ${c}` : 'none', outlineOffset: 2 }} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button type="button" onClick={() => setShowCatForm(false)} style={cancelBtn}>Cancel</button>
                <button type="submit" disabled={creating} style={saveBtn}>{creating ? '...' : 'Add'}</button>
              </div>
            </form>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {categories.map(cat => (
              <div key={cat.id}>
                {editingId === cat.id ? (
                  <div style={formCard}>
                    <input value={editName} onChange={e => setEditName(e.target.value)} style={input} autoFocus />
                    <div style={pickerLabel}>Icon</div>
                    <div style={iconGrid}>
                      {PRESET_ICONS.map(ic => (
                        <button key={ic} type="button" onClick={() => setEditIcon(ic)} style={{ ...iconBtn, background: editIcon === ic ? 'var(--accent-dim)' : 'transparent' }}>{ic}</button>
                      ))}
                    </div>
                    <div style={pickerLabel}>Color</div>
                    <div style={colorGrid}>
                      {PRESET_COLORS.map(c => (
                        <button key={c} type="button" onClick={() => setEditColor(c)} style={{ ...colorDot, background: c, outline: editColor === c ? `2px solid ${c}` : 'none', outlineOffset: 2 }} />
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button type="button" onClick={() => handleDelete(cat.id)} style={deleteBtn}>🗑</button>
                      <button type="button" onClick={() => setEditingId(null)} style={cancelBtn}>Cancel</button>
                      <button type="button" onClick={() => handleSaveEdit(cat.id)} style={saveBtn}>Save</button>
                    </div>
                  </div>
                ) : (
                  <div style={catRow} onClick={() => startEdit(cat)}>
                    <span style={{ fontSize: 16 }}>{cat.icon}</span>
                    <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)' }}>{cat.name}</span>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const wrapper = { display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }
const header = { padding: '16px 20px 12px', borderBottom: '1px solid var(--border)' }
const title = { fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, margin: 0 }
const content = { flex: 1, overflowY: 'auto', padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 24 }
const section = { display: 'flex', flexDirection: 'column', gap: 8 }
const sectionLabel = { fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }
const card = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }
const catRow = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }
const formCard = { background: 'var(--bg-card)', border: '1px solid var(--accent)', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }
const input = { background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 13, width: '100%' }
const pickerLabel = { fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 2 }
const iconGrid = { display: 'flex', flexWrap: 'wrap', gap: 3 }
const colorGrid = { display: 'flex', flexWrap: 'wrap', gap: 6 }
const iconBtn = { borderRadius: 4, padding: 3, fontSize: 14, cursor: 'pointer', border: 'none' }
const colorDot = { width: 18, height: 18, borderRadius: '50%', border: 'none', cursor: 'pointer' }
const addBtn = { background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }
const saveBtn = { background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginLeft: 'auto' }
const cancelBtn = { background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }
const deleteBtn = { background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 6, padding: '6px 8px', fontSize: 12, cursor: 'pointer' }
const signOutBtn = { background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginLeft: 'auto' }
