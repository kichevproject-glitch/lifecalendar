import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { useCategories } from './hooks/useCategories'
import AuthPage from './components/Auth/AuthPage'
import CalendarGrid from './components/Calendar/CalendarGrid'
import Sidebar from './components/Layout/Sidebar'
import TasksView from './components/Tasks/TasksView'
import AnalyticsView from './components/Analytics/AnalyticsView'
import SharedView from './components/Shared/SharedView'

function AppInner() {
  const { user, loading } = useAuth()
  const { categories, createCategory, updateCategory, deleteCategory } = useCategories()
  const [activeView, setActiveView] = useState('calendar')
  const [theme, setTheme] = useState(() => localStorage.getItem('lc-theme') || 'dark')

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

  if (!user) return <AuthPage />

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
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
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeView === 'calendar' && <CalendarGrid categories={categories} />}
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
