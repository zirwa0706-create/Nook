import { useState, useEffect } from 'react'
import axios from 'axios'
import Layout from '../components/layout/Layout'
import RightPanel from '../components/feed/RightPanel'
import './NotificationsPage.css'

const typeConfig = {
  like:            { label: '♥', color: '#B03A2E', bg: '#FAE8E6' },
  comment:         { label: '✦', color: '#5B7FA6', bg: '#E8EFF6' },
  friend_request:  { label: '+', color: '#8B6347', bg: '#F5EBE0' },
  friend_accepted: { label: '✓', color: '#4A7A47', bg: '#E6F0E6' },
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading,       setLoading]       = useState(true)

  useEffect(() => { fetchNotifications() }, [])

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
    if (diff < 3600)  return `${Math.floor(diff/60)}m ago`
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`
    return `${Math.floor(diff/86400)}d ago`
  }

  return (
    <Layout>
      <div className="content-grid">
        <div className="content-center">
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">Your recent activity</p>

          {loading && (
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {[1,2,3].map(i => <div key={i} className="card loading-card" style={{ height:'68px' }}/>)}
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div className="notif-empty card">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"
                style={{ color:'var(--bdr)', marginBottom:'10px' }}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <p style={{ fontWeight:'500', color:'var(--tx-second)' }}>No notifications yet</p>
              <p className="text-muted" style={{ marginTop:'4px', fontSize:'13px' }}>
                When people interact with your posts, you'll see it here
              </p>
            </div>
          )}

          <div className="notif-list">
            {notifications.map(n => {
              const cfg = typeConfig[n.type] || typeConfig.like
              return (
                <div key={n.id} className={`notif-item card${!n.is_read ? ' notif-item--unread' : ''}`}>
                  <div className="notif-icon-wrap" style={{ background: cfg.bg, color: cfg.color }}>
                    <span style={{ fontSize:'16px', fontWeight:'600', lineHeight:1 }}>{cfg.label}</span>
                  </div>
                  <div className="notif-content">
                    <p className="notif-msg">{n.message}</p>
                    <p className="notif-time">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.is_read && <div className="notif-dot" />}
                </div>
              )
            })}
          </div>
        </div>
        <div className="content-right"><RightPanel /></div>
      </div>
    </Layout>
  )
}
