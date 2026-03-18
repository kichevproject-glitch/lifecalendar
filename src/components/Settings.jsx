import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import '../styles/settings.css';

function Settings({ session, theme, onThemeToggle }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    name: '',
    email: session.user.email,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', session.user.id)
      .single();

    if (!error && data) {
      setProfile((prev) => ({ ...prev, name: data.name || '' }));
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase
      .from('profiles')
      .update({ name: profile.name })
      .eq('id', session.user.id);

    if (error) {
      setMessage('Error updating profile');
    } else {
      setMessage('Profile updated successfully');
    }

    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="settings-container">
      <header className="settings-header">
        <div className="logo-gradient">Dayflow</div>
        <button className="close-btn" onClick={() => navigate('/')}>
          â
        </button>
      </header>

      <div className="settings-content">
        <h1>Settings</h1>

        {/* Profile Section */}
        <section className="settings-section">
          <h2>Profile</h2>
          <form onSubmit={handleUpdateProfile} className="settings-form">
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="Your name"
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="disabled-input"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Saving...' : 'Save Profile'}
            </button>

            {message && <p className="message">{message}</p>}
          </form>
        </section>

        {/* Appearance Section */}
        <section className="settings-section">
          <h2>Appearance</h2>
          <div className="theme-toggle-container">
            <div className="theme-info">
              <h3>Theme</h3>
              <p>Choose between light and dark appearance</p>
            </div>
            <button
              className="theme-toggle"
              onClick={onThemeToggle}
              aria-label="Toggle theme"
            >
              <span className="theme-toggle-track">
                <span className={`theme-toggle-thumb ${theme === 'dark' ? 'dark' : ''}`}>
                  {theme === 'light' ? 'âï¸' : 'ð'}
                </span>
              </span>
            </button>
          </div>
        </section>

        {/* Account Section */}
        <section className="settings-section">
          <h2>Account</h2>
          <button className="btn-danger" onClick={handleSignOut}>
            Sign Out
          </button>
        </section>
      </div>
    </div>
  );
}

export default Settings;
