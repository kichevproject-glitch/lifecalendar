import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { useCategories } from './hooks/useCategories';
import { useSharing } from './hooks/useSharing';
import AuthPage from './components/Auth/AuthPage';
import CalendarGrid from './components/Calendar/CalendarGrid';
import Sidebar from './components/Layout/Sidebar';
import TasksView from './components/Tasks/TasksView';
import AnalyticsView from './components/Analytics/AnalyticsView';
import SharedView from './components/Shared/SharedView';
import './styles/globals.css';

function AppInner() {
  const { user, loading, recoveryMode } = useAuth();
  const { categories, createCategory, updateCategory, deleteCategory } = useCategories();
  const { sharedEvents, acceptInvite } = useSharing();
  const [activeView, setActiveView] = useState('calendar');
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('lc-theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  // Handle accept invite link (?accept=TOKEN in URL)
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const token = params.get('accept');
    if (!token) return;
    acceptInvite(token).then(() => {
      // Clean the URL after accepting
      window.history.replaceState({}, '', window.location.pathname);
    });
  }, [user, acceptInvite]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="logo-gradient">Dayflow</div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user || recoveryMode) {
    return <AuthPage />;
  }

  return (
    <div className="app-container">
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        theme={theme}
        setTheme={setTheme}
      />
      <main className="app-main">
        {activeView === 'calendar' && (
          <CalendarGrid
            categories={categories}
            sharedEvents={sharedEvents}
          />
        )}
        {activeView === 'tasks' && (
          <TasksView categories={categories} />
        )}
        {activeView === 'analytics' && (
          <AnalyticsView />
        )}
        {activeView === 'shared' && (
          <SharedView />
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

export default App;
