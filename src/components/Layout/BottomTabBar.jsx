export default function BottomTabBar({ activeView, setActiveView }) {
  const tabs = [
    { id: 'calendar', icon: '📅', label: 'Calendar' },
    { id: 'tasks', icon: '✅', label: 'Tasks' },
    { id: 'shared', icon: '👥', label: 'Shared' },
    { id: 'analytics', icon: '📊', label: 'Analytics' },
    { id: 'settings', icon: '⚙️', label: 'Settings' },
  ]

  return (
    <nav style={bar}>
      {tabs.map(tab => {
        const active = activeView === tab.id
        return (
          <button key={tab.id} onClick={() => setActiveView(tab.id)} style={tabBtn}>
            <span style={{ fontSize: 18, opacity: active ? 1 : 0.45 }}>{tab.icon}</span>
            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.02em', color: active ? 'var(--accent)' : 'var(--text-muted)' }}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

const bar = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  height: 64,
  background: 'var(--bg-secondary)',
  borderTop: '1px solid var(--border)',
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'center',
  zIndex: 100,
  paddingBottom: 'env(safe-area-inset-bottom, 0)',
}

const tabBtn = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 2,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '6px 12px',
}
