import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { useCategories } from './hooks/useCategories'
import { useSharing } from './hooks/useSharing'
import AuthPage from './components/Auth/AuthPage'
import CalendarGrid from './components/Calendar/CalendarGrid'
import Sidebar from './components/Layout/Sidebar'
import DesktopHeader from './components/Layout/DesktopHeader'
import TasksView from './components/Tasks/TasksView'
import AnalyticsView from './components/Analytics/AnalyticsView'
import SharedView from './components/Shared/SharedView'

function AppInner() {
  const { user, loading, recoveryMode } = useAuth()
  const { categories, createCategory, updateCategory, deleteCategory } = useCategories()
  const { sharedEvents, acceptInvite } = useSharing()
  
  const [activeView, setActiveView] = useState('calendar')
  const [theme, setTheme] = useState(() => localStorage.getItem('lc-theme') || 'dark')
  const [sidebarVisible, setSidebarVisible] = useState(false)

  // Handle accept invite link
  useEffect(() => {
    if (!user) return
    const params = new URLSearchParams(window.location.search)
    const token = params.get('accept')
    if (!token) return
    
    acceptInvite(token).then(() => {
      window.history.replaceState({}, '', window.location.pathname)
      setActiveView('shared')
    })
  }, [user]) // eslint-disable-line

  // Theme management
  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
    localStorage.setItem('lc-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ 
        width: 32, 
        height: 32, 
        border: '3px solid var(--border)', 
        borderTopColor: 'var(--accent)', 
        borderRadius: '50%', 
        animation: 'spin 0.8s linear infinite' 
      }} />
    </div>
  )

  if (!user || recoveryMode) return <AuthPage />

  return (
    <div className="app-redesign">
      {/* Hover trigger for sidebar */}
      <div 
        className="sidebar-hover-trigger"
        onMouseEnter={() => setSidebarVisible(true)}
      />
      
      {/* Desktop Header */}
      <DesktopHeader 
        activeView={activeView}
        setActiveView={setActiveView}
      />
      
      {/* Auto-hide Sidebar */}
      <Sidebar 
        categories={categories}
        onCategoryCreate={createCategory}
        onCategoryUpdate={updateCategory}
        onCategoryDelete={deleteCategory}
        activeView={activeView}
        setActiveView={setActiveView}
        theme={theme}
        toggleTheme={toggleTheme}
        visible={sidebarVisible}
        onMouseLeave={() => setSidebarVisible(false)}
      />
      
      {/* Main Content */}
      <main className="main-content-redesign">
        {activeView === 'calendar' && <CalendarGrid categories={categories} sharedEvents={sharedEvents} />}
        {activeView === 'tasks' && <TasksView />}
        {activeView === 'analytics' && <AnalyticsView />}
        {activeView === 'shared' && <SharedView />}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
