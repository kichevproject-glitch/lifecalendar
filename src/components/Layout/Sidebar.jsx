import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import DayflowLogo from './DayflowLogo'

// Icons organised by life category — 54 total
const PRESET_ICONS = [
  // Work & productivity
  '💼','📊','📋','🖥️','📞','✉️','🏢','🤝','📝','🔬','🎓','📐',
  // Health & fitness
  '🏃','🏋️','🚴','🧘','🏊','❤️','💊','🥗','🧠','🩺',
  // Travel & outdoors
  '✈️','🚂','🚗','🏨','🧳','🏕️','🗺️','🏔️','🌊','☀️',
  // Family & social
  '👨‍👩‍👧','🎂','🎁','🍽️','☕','🥂','🎉','🎊','🏆',
  // Hobbies & leisure
  '🎵','🎨','📚','🎮','🎭','📷','🎸','🌿','🐾','⚽','🎾','🎯',
  // Home & finance
  '🏠','🔧','💰','💳','📈','🛒',
]

const PRESET_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#EAB308', // Yellow
  '#84CC16', // Lime
  '#22C55E', // Green
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F43F5E', // Rose
  '#64748B', // Slate
  '#0D9488', // Teal
  '#D97706', // Dark amber
]

export default function Sidebar({
  categories,
  onCategoryCreate,
  onCategoryUpdate,
  onCategoryDelete,
  activeView,
  setActiveView,
  theme,
  toggleTheme,
  visible,
  onMouseLeave
}) {
  const { user, signOut } = useAuth()

  // New category form
  const [showCatForm, setShowCatForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#6C63FF')
  const [newIcon, setNewIcon] = useState('📌')
  const [creating, setCreating] = useState(false)

  // Edit category
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [editIcon, setEditIcon] = useState('')
  const [saving, setSaving] = useState(false)

  function startEdit(cat) {
    setEditingId(cat.id)
    setEditName(cat.name)
    setEditColor(cat.color)
    setEditIcon(cat.icon)
    setShowCatForm(false)
  }

  function cancelEdit() {
    setEditingId(null)
  }

  async function handleSaveEdit(id) {
    if (!editName.trim()) return
    setSaving(true)
    await onCategoryUpdate(id, { name: editName.trim(), color: editColor, icon: editIcon })
    setSaving(false)
    setEditingId(null)
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this category? Events using it will keep their data.')) return
    await onCategoryDelete(id)
    setEditingId(null)
  }

  async function handleCreateCat(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    await onCategoryCreate({ name: newName.trim(), color: newColor, icon: newIcon, type: 'event' })
    setNewName('')
    setNewIcon('📌')
    setNewColor('#6C63FF')
    setShowCatForm(false)
    setCreating(false)
  }

  const navItems = [
    { id: 'calendar', icon: '📅', label: 'Calendar' },
    { id: 'tasks', icon: '✅', label: 'Tasks' },
    { id: 'analytics', icon: '📊', label: 'Analytics' },
    { id: 'shared', icon: '👥', label: 'Shared' },
  ]

  return (
    <aside 
      className={`sidebar-redesign ${visible ? 'visible' : ''}`}
      onMouseLeave={onMouseLeave}
      style={sidebar}
    >
      {/* Logo + Theme toggle */}
      <div style={logoRow}>
        <div style={logo}>
          <DayflowLogo size={28} />
          <span style={logoText}>Dayflow</span>
        </div>
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          style={themeBtn}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Nav */}
      <nav style={nav}>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            style={{
              ...navItem,
              ...(activeView === item.id ? navItemActive : {})
            }}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div style={divider} />

      {/* Categories */}
      <div style={section}>
        <div style={sectionHeader}>
          <span style={sectionTitle}>Categories</span>
          <button
            onClick={() => { setShowCatForm(v => !v); setEditingId(null) }}
            style={addBtn}
            title="Add category"
          >
            {showCatForm ? '✕' : '+'}
          </button>
        </div>

        {/* New category form */}
        {showCatForm && (
          <form onSubmit={handleCreateCat} style={catForm}>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Category name"
              style={catInput}
              autoFocus
            />
            <div style={pickerLabel}>Icon</div>
            <div style={iconGrid}>
              {PRESET_ICONS.map(ic => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setNewIcon(ic)}
                  style={{
                    ...iconBtn,
                    background: newIcon === ic ? 'var(--accent-dim)' : 'transparent',
                    outline: newIcon === ic ? '1px solid var(--accent)' : 'none'
                  }}>
                  {ic}
                </button>
              ))}
            </div>
            <div style={pickerLabel}>Color</div>
            <div style={colorGrid}>
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewColor(c)}
                  style={{
                    ...colorDot,
                    background: c,
                    outline: newColor === c ? `2px solid ${c}` : 'none',
                    outlineOffset: 2
                  }}
                />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <button type="button" onClick={() => setShowCatForm(false)} style={cancelBtn}>Cancel</button>
              <button type="submit" disabled={creating} style={saveCatBtn}>{creating ? '...' : 'Add'}</button>
            </div>
          </form>
        )}

        {/* Category list */}
        <div style={catList}>
          {categories.map(cat => (
            <div key={cat.id}>
              {editingId === cat.id ? (
                /* Edit form inline */
                <div style={catEditForm}>
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    style={catInput}
                    autoFocus
                  />
                  <div style={pickerLabel}>Icon</div>
                  <div style={iconGrid}>
                    {PRESET_ICONS.map(ic => (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => setEditIcon(ic)}
                        style={{
                          ...iconBtn,
                          background: editIcon === ic ? 'var(--accent-dim)' : 'transparent',
                          outline: editIcon === ic ? '1px solid var(--accent)' : 'none'
                        }}>
                        {ic}
                      </button>
                    ))}
                  </div>
                  <div style={pickerLabel}>Color</div>
                  <div style={colorGrid}>
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setEditColor(c)}
                        style={{
                          ...colorDot,
                          background: c,
                          outline: editColor === c ? `2px solid ${c}` : 'none',
                          outlineOffset: 2
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <button type="button" onClick={() => handleDelete(cat.id)} style={deleteBtn} title="Delete">🗑</button>
                    <button type="button" onClick={cancelEdit} style={cancelBtn}>Cancel</button>
                    <button type="button" onClick={() => handleSaveEdit(cat.id)} disabled={saving} style={saveCatBtn}>
                      {saving ? '...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Normal row */
                <div style={catItem} onClick={() => startEdit(cat)} title="Click to edit">
                  <span style={{ fontSize: 15 }}>{cat.icon}</span>
                  <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)' }}>{cat.name}</span>
                  <span style={{ ...catDot, background: cat.color }} />
                  <span style={editHint}>✏️</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* User / Signout */}
      <div style={userRow}>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email}
          </div>
        </div>
        <button onClick={signOut} style={signOutBtn} title="Sign out">↩</button>
      </div>
    </aside>
  )
}

// Inline styles (keeping all existing styles from original Sidebar)
const sidebar = {
  width: 230,
  minWidth: 230,
  background: 'var(--bg-secondary)',
  borderRight: '1px solid var(--border)',
  display: 'flex',
  flexDirection: 'column',
  padding: '0 0 16px',
  overflow: 'hidden',
  transition: 'background 0.25s ease',
}

const logoRow = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 12px 14px',
  borderBottom: '1px solid var(--border)',
}

const logo = {
  display: 'flex',
  alignItems: 'center',
  gap: 8
}

const logoText = {
  fontFamily: 'Montserrat, sans-serif',
  fontSize: 15,
  fontWeight: 800,
  letterSpacing: '-0.01em'
}

const themeBtn = {
  background: 'var(--bg-hover)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  width: 32,
  height: 32,
  fontSize: 16,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s',
  flexShrink: 0,
}

const nav = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  padding: '10px 8px'
}

const navItem = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '9px 10px',
  borderRadius: 8,
  background: 'none',
  color: 'var(--text-secondary)',
  fontSize: 13,
  fontWeight: 500,
  textAlign: 'left',
  transition: 'all 0.15s',
  cursor: 'pointer',
}

const navItemActive = {
  background: 'var(--accent-dim)',
  color: 'var(--accent)',
  fontWeight: 600
}

const divider = {
  height: 1,
  background: 'var(--border)',
  margin: '0 12px'
}

const section = {
  flex: 1,
  overflow: 'hidden',
  padding: '10px 8px',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0
}

const sectionHeader = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 6px',
  marginBottom: 6
}

const sectionTitle = {
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em'
}

const addBtn = {
  background: 'var(--bg-hover)',
  color: 'var(--text-secondary)',
  borderRadius: 6,
  width: 22,
  height: 22,
  fontSize: 15,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  border: '1px solid var(--border)'
}

const catForm = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: 10,
  marginBottom: 8,
  display: 'flex',
  flexDirection: 'column',
  gap: 4
}

const catEditForm = {
  background: 'var(--bg-card)',
  border: '1px solid var(--accent)',
  borderRadius: 8,
  padding: 10,
  marginBottom: 6,
  display: 'flex',
  flexDirection: 'column',
  gap: 4
}

const catInput = {
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  padding: '6px 10px',
  color: 'var(--text-primary)',
  fontSize: 12,
  width: '100%'
}

const pickerLabel = {
  fontSize: 10,
  fontWeight: 700,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginTop: 2
}

const iconGrid = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 2
}

const colorGrid = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 4
}

const iconBtn = {
  background: 'none',
  borderRadius: 4,
  padding: 2,
  fontSize: 13,
  cursor: 'pointer',
  transition: 'all 0.1s'
}

const colorDot = {
  width: 14,
  height: 14,
  borderRadius: '50%',
  border: 'none',
  cursor: 'pointer',
  flexShrink: 0
}

const saveCatBtn = {
  background: 'var(--accent)',
  color: '#fff',
  borderRadius: 6,
  padding: '5px 12px',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  marginLeft: 'auto'
}

const cancelBtn = {
  background: 'var(--bg-hover)',
  color: 'var(--text-secondary)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  padding: '5px 10px',
  fontSize: 12,
  cursor: 'pointer'
}

const deleteBtn = {
  background: 'rgba(248,113,113,0.1)',
  color: '#f87171',
  border: '1px solid rgba(248,113,113,0.3)',
  borderRadius: 6,
  padding: '5px 8px',
  fontSize: 12,
  cursor: 'pointer'
}

const catList = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  overflowY: 'auto',
  flex: 1
}

const catItem = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 8px',
  borderRadius: 6,
  cursor: 'pointer',
  transition: 'background 0.15s',
}

const catDot = {
  width: 8,
  height: 8,
  borderRadius: '50%',
  flexShrink: 0
}

const editHint = {
  fontSize: 10,
  opacity: 0,
  transition: 'opacity 0.15s'
}

const userRow = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 12px 0',
  borderTop: '1px solid var(--border)',
  marginTop: 'auto',
}

const signOutBtn = {
  background: 'var(--bg-hover)',
  color: 'var(--text-muted)',
  borderRadius: 6,
  padding: '5px 8px',
  fontSize: 14,
  cursor: 'pointer',
  border: '1px solid var(--border)'
}
