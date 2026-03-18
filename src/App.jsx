import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { useCategories } from './hooks/useCategories'
import { useSharing } from './hooks/useSharing'
import AuthPage from './components/Auth/AuthPage'
import CalendarGrid from './components/Calendar/CalendarGrid'
import Sidebar from './components/Layout/Sidebar'
import BottomTabBar from './components/Layout/BottomTabBar'
import MobileSettings from './components/Layout/MobileSettings'
import TasksView from './components/Tasks/TasksView'
import AnalyticsView from './components/Analytics/AnalyticsView'
import SharedView from './components/Shared/SharedView'

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [breakpoint])
  return isMobile
}

function AppInner() {
  const { user, loading, recoveryMode } = useAuth()
  const { categories, createCategory, updateCategory, deleteCategory } = useCategories()
  const { sharedEvents, acceptInvite } = useSharing()
  const [activeView, setActiveView] = useState('calendar')
  const [theme, setTheme] = useState(() => localStorage.getItem('lc-theme') || 'dark')
  const isMobile = useIsMobile()

  // Handle accept invite link (?accept=TOKEN in URL)
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

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
    localStorage.setItem('lc-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  if (!user || recoveryMode) return <AuthPage />

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {!isMobile && (
        <Sidebar
          categories={categories}
          onCategoryCreate={createCategory}
          onCategoryUpdate={updateCategory}
          onCategoryDelete={deleteCategory}
          activeView={activeView}
          setActiveView={setActiveView}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      )}
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', paddingBottom: isMobile ? 64 : 0 }}>
        {activeView === 'calendar' && <CalendarGrid categories={categories} sharedEvents={sharedEvents} isMobile={isMobile} />}
        {activeView === 'tasks' && <TasksView />}
        {activeView === 'analytics' && <AnalyticsView />}
        {activeView === 'shared' && <SharedView />}
        {activeView === 'settings' && isMobile && (
          <MobileSettings
            categories={categories}
            onCategoryCreate={createCategory}
            onCategoryUpdate={updateCategory}
            onCategoryDelete={deleteCategory}
            theme={theme}
            toggleTheme={toggleTheme}
          />
        )}
      </main>
      {isMobile && <BottomTabBar activeView={activeView} setActiveView={setActiveView} />}
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
