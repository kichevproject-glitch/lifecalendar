import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'

export default function Sidebar({ categories, onCategoryCreate, activeView, setActiveView }) {
  const { user, signOut } = useAuth()
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState('#6C63FF')
  const [newCatIcon, setNewCatIcon] = useState('📌')
  const [showCatForm, setShowCatForm] = useState(false)
  const [creating, setCreating] = useState(false)

  const PRESET_ICONS = ['📌','💼','🏃','✈️','🌸','👨‍👩‍👧','❤️','🌿','🎵','📚','🍽️','🏖️','💡','🎯','🎉']
  const PRESET_COLORS = ['#6C63FF','#3B82F6','#10B981','#F59E0B','#EC4899','#EF4444','#8B5CF6','#84CC16','#06B6D4','#F97316']

  async function handleCreateCat(e) {
    e.preventDefault()
    if (!newCatName.trim()) return
    setCreating(true)
    await onCategoryCreate({ name: newCatName.trim(), color: newCatColor, icon: newCatIcon, type: 'event' })
    setNewCatName('')
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
    <aside style={sidebar}>
      {/* Logo */}
      <div style={logo}>
        <span style={{ fontSize: 22 }}>🗓</span>
        <span style={logoText}>LifeCalendar</span>
      </div>

      {/* Nav */}
      <nav style={nav}>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            style={{ ...navItem, ...(activeView === item.id ? navItemActive : {}) }}
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
          <button onClick={() => setShowCatForm(v => !v)} style={addBtn}>+</button>
        </div>

        {showCatForm && (
          <form onSubmit={handleCreateCat} style={catForm}>
            <input
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              placeholder="Category name"
              style={catInput}
              autoFocus
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
              {PRESET_ICONS.map(ic => (
                <button key={ic} type="button" onClick={() => setNewCatIcon(ic)}
                  style={{ ...iconBtn, background: newCatIcon === ic ? 'var(--accent-dim)' : 'transparent' }}>
                  {ic}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
              {PRESET_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setNewCatColor(c)}
                  style={{ ...colorDot, background: c, outline: newCatColor === c ? `2px solid ${c}` : 'none', outlineOffset: 2 }} />
              ))}
            </div>
            <button type="submit" disabled={creating} style={saveCatBtn}>
              {creating ? '...' : 'Add'}
            </button>
          </form>
        )}

        <div style={catList}>
          {categories.map(cat => (
            <div key={cat.id} style={catItem}>
              <span>{cat.icon}</span>
              <span style={{ flex: 1, fontSize: 13 }}>{cat.name}</span>
              <span style={{ ...catDot, background: cat.color }} />
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

const sidebar = {
  width: 220, minWidth: 220,
  background: 'var(--bg-secondary)',
  borderRight: '1px solid var(--border)',
  display: 'flex', flexDirection: 'column',
  padding: '0 0 16px',
  overflow: 'hidden',
}
const logo = {
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '20px 16px 16px',
  borderBottom: '1px solid var(--border)',
}
const logoText = {
  fontFamily: 'var(--font-display)',
  fontSize: 16, fontWeight: 700,
}
const nav = { display: 'flex', flexDirection: 'column', gap: 2, padding: '12px 8px' }
const navItem = {
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '9px 10px', borderRadius: 8,
  background: 'none', color: 'var(--text-secondary)',
  fontSize: 13, fontWeight: 500, textAlign: 'left',
  transition: 'all 0.15s',
}
const navItemActive = {
  background: 'var(--accent-dim)',
  color: 'var(--accent)',
  fontWeight: 600,
}
const divider = { height: 1, background: 'var(--border)', margin: '0 16px' }
const section = { flex: 1, overflow: 'hidden', padding: '12px 8px', display: 'flex', flexDirection: 'column' }
const sectionHeader = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 6px', marginBottom: 6 }
const sectionTitle = { fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }
const addBtn = { background: 'var(--bg-hover)', color: 'var(--text-secondary)', borderRadius: 6, width: 22, height: 22, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }
const catForm = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 10, marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 4 }
const catInput = { background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', color: 'var(--text-primary)', fontSize: 12, width: '100%' }
const iconBtn = { background: 'none', borderRadius: 4, padding: 2, fontSize: 14, cursor: 'pointer' }
const colorDot = { width: 14, height: 14, borderRadius: '50%', border: 'none', cursor: 'pointer' }
const saveCatBtn = { background: 'var(--accent)', color: '#fff', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 600, marginTop: 4, alignSelf: 'flex-end' }
const catList = { display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }
const catItem = { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6 }
const catDot = { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 }
const userRow = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '12px 12px 0', borderTop: '1px solid var(--border)', marginTop: 'auto',
}
const signOutBtn = { background: 'var(--bg-hover)', color: 'var(--text-muted)', borderRadius: 6, padding: '5px 8px', fontSize: 14 }
