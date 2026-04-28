import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import './RightPanel.css'

export default function RightPanel() {
  const [suggestions,     setSuggestions]    = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [requested,       setRequested]      = useState(new Set())
  const navigate = useNavigate()

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      const [pendingR, usersR] = await Promise.all([
        axios.get('/api/friends/requests/pending'),
        axios.get('/api/users/search?q='),
      ])
      setPendingRequests(pendingR.data.requests || [])
      setSuggestions(usersR.data.users?.slice(0, 5) || [])
    } catch {}
  }

  const sendRequest = async (userId) => {
    try {
      await axios.post(`/api/friends/request/${userId}`)
      setRequested(prev => new Set([...prev, userId]))
    } catch {}
  }

  const respond = async (requestId, action) => {
    try {
      await axios.post(`/api/friends/respond/${requestId}/${action}`)
      setPendingRequests(prev => prev.filter(r => r.id !== requestId))
    } catch {}
  }

  const initials = (name) => name?.slice(0, 2).toUpperCase()

  return (
    <aside className="right-panel">

      {/* Pending friend requests */}
      {pendingRequests.length > 0 && (
        <div className="rp-section">
          <h3 className="rp-title">Friend Requests</h3>
          {pendingRequests.map(req => (
            <div key={req.id} className="rp-user">
              <div className="avatar avatar-sm" style={{ cursor:'pointer' }}
                onClick={() => navigate(`/profile/${req.sender_id}`)}>
                {initials(req.sender_username)}
              </div>
              <span className="rp-name"
                onClick={() => navigate(`/profile/${req.sender_id}`)}>
                {req.sender_username}
              </span>
              <div style={{ display:'flex', gap:'5px', marginLeft:'auto' }}>
                <button className="rp-accept-btn" onClick={() => respond(req.id, 'accept')}>Accept</button>
                <button className="rp-decline-btn" onClick={() => respond(req.id, 'decline')}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* People you may know */}
      <div className="rp-section">
        <h3 className="rp-title">People you may know</h3>
        {suggestions.length === 0 && (
          <p style={{ fontSize:'13px', color:'var(--tx-muted)' }}>No suggestions right now</p>
        )}
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
            {requested.has(u.id)
              ? <span className="rp-sent">Sent</span>
              : <button className="rp-follow-btn" onClick={() => sendRequest(u.id)}>+ Add</button>
            }
          </div>
        ))}
      </div>

    </aside>
  )
}
