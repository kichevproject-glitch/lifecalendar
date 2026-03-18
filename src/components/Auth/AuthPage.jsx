import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import DayflowLogo from '../Layout/DayflowLogo'

export default function AuthPage() {
  const { signIn, signUp, resetPassword, updatePassword, user } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'register' | 'forgot' | 'reset'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  // Detect password recovery redirect (Supabase sets hash params)
  useEffect(() => {
    const hash = window.location.hash
    if (hash && hash.includes('type=recovery')) {
      setMode('reset')
      // Clean up the URL hash
      window.history.replaceState({}, '', window.location.pathname + window.location.search)
    }
  }, [])

  // If user is logged in and in reset mode, show the reset form
  // (Supabase auto-authenticates from the recovery link)
  useEffect(() => {
    if (user && mode === 'reset') {
      // Stay in reset mode — user needs to set new password
    }
  }, [user, mode])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) setError(error.message)
    } else if (mode === 'register') {
      const { error } = await signUp(email, password)
      if (error) setError(error.message)
      else setMessage('Check your email to confirm your account!')
    } else if (mode === 'forgot') {
      const { error } = await resetPassword(email)
      if (error) setError(error.message)
      else setMessage('Password reset link sent! Check your email.')
    } else if (mode === 'reset') {
      if (password.length < 6) {
        setError('Password must be at least 6 characters')
        setLoading(false)
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        setLoading(false)
        return
      }
      const { error } = await updatePassword(password)
      if (error) setError(error.message)
      else {
        setMessage('Password updated! Redirecting...')
        setTimeout(() => window.location.reload(), 1500)
      }
    }
    setLoading(false)
  }

  function switchMode(newMode) {
    setMode(newMode)
    setError('')
    setMessage('')
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.card} className="slide-in">
        {/* Logo */}
        <div style={styles.logo}>
          <DayflowLogo size={40} />
          <span style={styles.logoText}>Dayflow</span>
        </div>
        <p style={styles.tagline}>Your life in flow.</p>

        {/* Reset password mode */}
        {mode === 'reset' && (
          <>
            <h3 style={styles.heading}>Set new password</h3>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>New password</label>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required minLength={6} style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Confirm password</label>
                <input
                  type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••" required minLength={6} style={styles.input}
                />
              </div>
              {error && <div style={styles.error}>{error}</div>}
              {message && <div style={styles.success}>{message}</div>}
              <button type="submit" disabled={loading} style={styles.btn}>
                {loading ? '...' : 'Update Password'}
              </button>
            </form>
          </>
        )}

        {/* Forgot password mode */}
        {mode === 'forgot' && (
          <>
            <h3 style={styles.heading}>Reset password</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
              Enter your email and we'll send you a link to reset your password.
            </p>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Email</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" required style={styles.input}
                />
              </div>
              {error && <div style={styles.error}>{error}</div>}
              {message && <div style={styles.success}>{message}</div>}
              <button type="submit" disabled={loading} style={styles.btn}>
                {loading ? '...' : 'Send Reset Link'}
              </button>
            </form>
            <button onClick={() => switchMode('login')} style={styles.link}>
              Back to Sign In
            </button>
          </>
        )}

        {/* Login / Register mode */}
        {(mode === 'login' || mode === 'register') && (
          <>
            {/* Tabs */}
            <div style={styles.tabs}>
              {['login', 'register'].map(tab => (
                <button
                  key={tab}
                  onClick={() => switchMode(tab)}
                  style={{ ...styles.tab, ...(mode === tab ? styles.tabActive : {}) }}
                >
                  {tab === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Email</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" required style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Password</label>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required minLength={6} style={styles.input}
                />
              </div>

              {error && <div style={styles.error}>{error}</div>}
              {message && <div style={styles.success}>{message}</div>}

              <button type="submit" disabled={loading} style={styles.btn}>
                {loading ? '...' : mode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            {mode === 'login' && (
              <button onClick={() => switchMode('forgot')} style={styles.link}>
                Forgot password?
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

const styles = {
  wrapper: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'radial-gradient(ellipse at 60% 20%, #1a1040 0%, #0d0d14 60%)', padding: 24,
  },
  card: {
    background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
    padding: '40px 36px', width: '100%', maxWidth: 400, boxShadow: 'var(--shadow-lg)',
  },
  logo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 },
  logoText: {
    fontFamily: 'Montserrat, sans-serif', fontSize: 26, fontWeight: 800,
    letterSpacing: '-0.02em', color: 'var(--text-primary)',
  },
  tagline: { color: 'var(--text-muted)', fontSize: 13, marginBottom: 28 },
  heading: {
    fontFamily: 'Montserrat, sans-serif', fontSize: 18, fontWeight: 700,
    color: 'var(--text-primary)', marginBottom: 8,
  },
  tabs: {
    display: 'flex', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)',
    padding: 4, marginBottom: 24,
  },
  tab: {
    flex: 1, padding: '8px 0', background: 'transparent', color: 'var(--text-muted)',
    fontSize: 13, fontWeight: 500, borderRadius: 6, transition: 'all 0.2s', cursor: 'pointer',
    border: 'none',
  },
  tabActive: { background: 'var(--accent)', color: '#fff' },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: {
    fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)',
    textTransform: 'uppercase', letterSpacing: '0.05em',
  },
  input: {
    background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
    padding: '10px 14px', color: 'var(--text-primary)', fontSize: 14, transition: 'border-color 0.2s',
  },
  error: {
    background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
    color: '#f87171', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: 13,
  },
  success: {
    background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)',
    color: '#34d399', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: 13,
  },
  btn: {
    background: 'var(--accent)', color: '#fff', padding: '12px', borderRadius: 'var(--radius-sm)',
    fontWeight: 600, fontSize: 14, marginTop: 4, transition: 'opacity 0.2s', cursor: 'pointer',
    border: 'none',
  },
  link: {
    background: 'none', border: 'none', color: 'var(--accent)', fontSize: 13,
    cursor: 'pointer', marginTop: 16, display: 'block', textAlign: 'center',
    fontWeight: 500,
  },
}
