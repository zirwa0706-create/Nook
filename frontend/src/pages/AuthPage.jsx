import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

export default function AuthPage() {
  const [mode,     setMode]     = useState('login')
  const [email,    setEmail]    = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const { login, register } = useAuth()
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(username, email, password)
      }
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-logo">
          <div className="auth-logo-mark">N</div>
          <span>Nook</span>
        </div>

        <p className="auth-tagline">
          {mode === 'login' ? 'Welcome back — your cozy corner awaits.' : 'Find your cozy corner on the internet.'}
        </p>

        <div className="auth-tabs">
          <button className={mode === 'login'    ? 'active' : ''} onClick={() => { setMode('login');    setError('') }}>Sign in</button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError('') }}>Create account</button>
        </div>

        <form onSubmit={submit} className="auth-form">
          {mode === 'register' && (
            <div className="field">
              <label>Username</label>
              <input
                type="text"
                placeholder="e.g. cozyreader"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required minLength={3} maxLength={30}
              />
            </div>
          )}

          <div className="field">
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              type="password"
              placeholder={mode === 'register' ? 'At least 6 characters' : '••••••••'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required minLength={6}
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="btn-primary auth-submit" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>

      <p className="auth-footer">
        Nook — a warm place for real connections.
      </p>
    </div>
  )
}
