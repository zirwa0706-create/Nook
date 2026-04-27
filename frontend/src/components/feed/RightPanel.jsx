import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import './RightPanel.css'

export default function RightPanel() {
  const [suggestions,     setSuggestions]     = useState([])
  const [notifications,   setNotifications]   = useState([])
  const [pendingRequests, setPendingRequests]  = useState([])
  const navigate = useNavigate()

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      const [notifR, pendingR, usersR] = await Promise.all([
        axios.get('/api/users/notifications'),
        axios.get('/api/friends/requests/pending'),
        axios.get('/api/users/search?q='),
      ])
      setNotifications(notifR.data.notifications?.slice(0, 5)  || [])
      setPendingRequests(pendingR.data.requests                 || [])
      setSuggestions(usersR.data.users?.slice(0, 4)            || [])
    } catch {}
  }

  const sendRequest = async (userId) => {
    try {
      await axios.post(`/api/friends/request/${userId}`)
      setSuggestions(prev => prev.filter(u => u.id !== userId))
    } catch {}
  }

  const respond = async (requestId, action) => {
    try {
      await axios.post(`/api/friends/respond/${requestId}/${action}`)
      setPendingRequests(prev => prev.filter(r => r.id !== requestId))
    } catch {}
  }

  const timeAgo = (iso) => {
    const diff = Math.floor((Date.now() - new Date(iso)) / 1000)
    if (diff < 60)    return 'just now'
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  const initials = (name) => name?.slice(0, 2).toUpperCase()

  return (
    <aside className="right-panel">

      {pendingRequests.length > 0 && (
        <div className="rp-section">
          <h3 className="rp-title">Friend Requests</h3>
          {pendingRequests.map(req => (
            <div key={req.id} className="rp-user">
              <div className="avatar avatar-sm">{initials(req.sender_username)}</div>
              <span className="rp-name">{req.sender_username}</span>
              <div style={{ display:'flex', gap:'4px', marginLeft:'auto' }}>
                <button className="btn-primary"
                  style={{ padding:'4px 10px', fontSize:'12px' }}
                  onClick={() => respond(req.id, 'accept')}>✓</button>
                <button className="btn-secondary"
                  style={{ padding:'4px 10px', fontSize:'12px' }}
                  onClick={() => respond(req.id, 'decline')}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="rp-section">
          <h3 className="rp-title">People you may know</h3>
          {suggestions.map(u => (
            <div key={u.id} className="rp-user">
              <div className="avatar avatar-sm" style={{ cursor:'pointer' }}
                onClick={() => navigate(`/profile/${u.id}`)}>
                {u.avatar_url
                  ? <img src={u.avatar_url} alt={u.username}
                      style={{ width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover' }} />
                  : initials(u.username)
                }
              </div>
              <span className="rp-name" onClick={() => navigate(`/profile/${u.id}`)}>
                {u.username}
              </span>
              <button className="rp-follow-btn" onClick={() => sendRequest(u.id)}>+ Add</button>
            </div>
          ))}
        </div>
      )}

      {notifications.length > 0 && (
        <div className="rp-section">
          <h3 className="rp-title">Recent activity</h3>
          {notifications.map(n => (
            <div key={n.id} className={`rp-notif${!n.is_read ? ' rp-notif--unread' : ''}`}>
              <div className="rp-notif-dot" />
              <div>
                <p className="rp-notif-msg">{n.message}</p>
                <p className="rp-notif-time">{timeAgo(n.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {suggestions.length === 0 && notifications.length === 0 && pendingRequests.length === 0 && (
        <div className="rp-section">
          <p style={{ fontSize:'13px', color:'var(--tx-muted)' }}>
            Add friends to see activity here!
          </p>
        </div>
      )}
    </aside>
  )
}
