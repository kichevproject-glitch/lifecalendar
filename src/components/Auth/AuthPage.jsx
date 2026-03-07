import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) setError(error.message)
    } else {
      const { error } = await signUp(email, password)
      if (error) setError(error.message)
      else setMessage('Check your email to confirm your account!')
    }
    setLoading(false)
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.card} className="slide-in">
        {/* Logo */}
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🗓</span>
          <span style={styles.logoText}>LifeCalendar</span>
        </div>
        <p style={styles.tagline}>Your life, beautifully organized.</p>

        {/* Tabs */}
        <div style={styles.tabs}>
          {['login', 'register'].map(tab => (
            <button
              key={tab}
              onClick={() => { setMode(tab); setError(''); setMessage('') }}
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
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={styles.input}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              style={styles.input}
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}
          {message && <div style={styles.success}>{message}</div>}

          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? '...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  )
}

const styles = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(ellipse at 60% 20%, #1a1040 0%, #0d0d14 60%)',
    padding: 24,
  },
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '40px 36px',
    width: '100%',
    maxWidth: 400,
    boxShadow: 'var(--shadow-lg)',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  logoIcon: { fontSize: 32 },
  logoText: {
    fontFamily: 'var(--font-display)',
    fontSize: 24,
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  tagline: {
    color: 'var(--text-muted)',
    fontSize: 13,
    marginBottom: 28,
  },
  tabs: {
    display: 'flex',
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-sm)',
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    padding: '8px 0',
    background: 'transparent',
    color: 'var(--text-muted)',
    fontSize: 13,
    fontWeight: 500,
    borderRadius: 6,
    transition: 'all 0.2s',
  },
  tabActive: {
    background: 'var(--accent)',
    color: '#fff',
  },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '10px 14px',
    color: 'var(--text-primary)',
    fontSize: 14,
    transition: 'border-color 0.2s',
  },
  error: {
    background: 'rgba(248,113,113,0.1)',
    border: '1px solid rgba(248,113,113,0.3)',
    color: '#f87171',
    padding: '10px 14px',
    borderRadius: 'var(--radius-sm)',
    fontSize: 13,
  },
  success: {
    background: 'rgba(52,211,153,0.1)',
    border: '1px solid rgba(52,211,153,0.3)',
    color: '#34d399',
    padding: '10px 14px',
    borderRadius: 'var(--radius-sm)',
    fontSize: 13,
  },
  btn: {
    background: 'var(--accent)',
    color: '#fff',
    padding: '12px',
    borderRadius: 'var(--radius-sm)',
    fontWeight: 600,
    fontSize: 14,
    marginTop: 4,
    transition: 'opacity 0.2s',
  },
}
