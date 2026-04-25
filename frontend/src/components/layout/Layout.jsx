import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useState } from 'react'
import './Layout.css'

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/auth')
  }

  const initials = user?.username?.slice(0, 2).toUpperCase()

  return (
    <div className="layout">

      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">N</div>
          <span>Nook</span>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">🏠</span> Home
          </NavLink>
          <NavLink to="/explore" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">🔍</span> Explore
          </NavLink>
          <NavLink to="/notifications" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">🔔</span> Notifications
          </NavLink>
          <NavLink to={`/profile/${user?.id}`} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">👤</span> Profile
          </NavLink>
        </nav>

        <button className="theme-toggle" onClick={toggle}>
          {theme === 'light' ? '🌙 Dark mode' : '☀️ Light mode'}
        </button>

        <div className="sidebar-user" onClick={() => setShowMenu(m => !m)}>
          <div className="avatar avatar-sm">{initials}</div>
          <div className="sidebar-user-info">
            <span className="font-500">{user?.username}</span>
            <span className="text-muted" style={{ fontSize: '11px' }}>@{user?.username}</span>
          </div>
          <span style={{ marginLeft: 'auto', color: 'var(--tx-muted)' }}>⋯</span>
        </div>

        {showMenu && (
          <div className="user-menu">
            <button onClick={handleLogout}>Sign out</button>
          </div>
        )}
      </aside>

      {/* ── Main content ── */}
      <main className="main-content">
        {children}
      </main>

    </div>
  )
}
