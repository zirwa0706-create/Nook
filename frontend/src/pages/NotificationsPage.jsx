import { useState, useEffect } from 'react'
import axios from 'axios'
import Layout from '../components/layout/Layout'
import './NotificationsPage.css'

const icons = {
  like:            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  comment:         <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  friend_request:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>,
  friend_accepted: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>,
}

const colors = {
  like: '#B03A2E', comment: '#6B8EAA',
  friend_request: '#8B6347', friend_accepted: '#4A8B47',
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading,       setLoading]       = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const r = await axios.get('/api/users/notifications')
      setNotifications(r.data.notifications)
      await axios.post('/api/users/notifications/read')
    } catch {}
    finally { setLoading(false) }
  }

  const timeAgo = (iso) => {
    const diff = Math.floor((Date.now() - new Date(iso)) / 1000)
    if (diff < 60)    return 'just now'
    if (diff < 3600)  return `${Math.floor(diff/60)} min ago`
    if (diff < 86400) return `${Math.floor(diff/3600)} hr ago`
    return `${Math.floor(diff/86400)} days ago`
  }

  return (
    <Layout>
      <div className="notif-page">
        <div className="notif-inner">
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">Stay up to date with your activity</p>

          {loading && (
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {[1,2,3].map(i => <div key={i} className="card loading-card" style={{ height:'70px' }} />)}
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div className="notif-empty">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color:'var(--bdr)', marginBottom:'12px' }}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <p style={{ fontWeight:'500', color:'var(--tx-second)' }}>No notifications yet</p>
              <p className="text-muted" style={{ marginTop:'4px', fontSize:'13px' }}>
                When people like or comment on your posts, you'll see it here
              </p>
            </div>
          )}

          <div className="notif-list">
            {notifications.map(n => (
              <div key={n.id} className={`notif-item card${!n.is_read ? ' notif-item--unread' : ''}`}>
                <div className="notif-icon-wrap" style={{ background: `${colors[n.type]}18`, color: colors[n.type] }}>
                  {icons[n.type] || icons.like}
                </div>
                <div className="notif-content">
                  <p className="notif-msg">{n.message}</p>
                  <p className="notif-time">{timeAgo(n.created_at)}</p>
                </div>
                {!n.is_read && <div className="notif-dot" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}
