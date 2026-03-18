import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import AuthPage from './components/Auth/AuthPage';
import Calendar from './components/Calendar';
import Settings from './components/Settings';
import SharedView from './components/Shared/SharedView';
import './styles/globals.css';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('light');
  const [currentView, setCurrentView] = useState('month');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('dayflow-theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  useEffect(() => {
    // Load view preference from localStorage
    const savedView = localStorage.getItem('dayflow-view') || 'month';
    setCurrentView(savedView);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('dayflow-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const changeView = (view) => {
    setCurrentView(view);
    localStorage.setItem('dayflow-view', view);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="logo-gradient">Dayflow</div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <Calendar
              session={session}
              theme={theme}
              currentView={currentView}
              onViewChange={changeView}
            />
          }
        />
        <Route
          path="/settings"
          element={
            <Settings
              session={session}
              theme={theme}
              onThemeToggle={toggleTheme}
            />
          }
        />
        <Route
          path="/shared/:token"
          element={<SharedView theme={theme} />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
