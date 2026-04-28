import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Layout from '../components/layout/Layout'
import RightPanel from '../components/feed/RightPanel'
import './ExplorePage.css'

export default function ExplorePage() {
  const [query,     setQuery]     = useState('')
  const [results,   setResults]   = useState([])
  const [searched,  setSearched]  = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [requested, setRequested] = useState(new Set())
  const navigate = useNavigate()

  const search = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    try {
      const r = await axios.get(`/api/users/search?q=${encodeURIComponent(query)}`)
      setResults(r.data.users)
      setSearched(true)
    } catch {}
    finally { setLoading(false) }
  }

  const sendRequest = async (userId) => {
    try {
      await axios.post(`/api/friends/request/${userId}`)
      setRequested(prev => new Set([...prev, userId]))
    } catch {}
  }

  const initials = (name) => name?.slice(0, 2).toUpperCase()

  return (
    <Layout>
      <div className="content-grid">
        <div className="content-center">
          <h1 className="page-title">Explore</h1>
          <p className="page-subtitle">Search for people to connect with</p>

          <form className="search-form" onSubmit={search}>
            <div className="search-box">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="search-icon">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input className="search-input" placeholder="Search by username…"
                value={query} onChange={e => setQuery(e.target.value)} autoFocus />
            </div>
            <button type="submit" className="btn-primary search-btn" disabled={loading}>
              {loading ? 'Searching…' : 'Search'}
            </button>
          </form>

          {searched && results.length === 0 && (
            <p className="text-muted" style={{ padding:'20px 0' }}>No users found for "<strong>{query}</strong>"</p>
          )}

          <div className="search-results">
            {results.map(u => (
              <div key={u.id} className="user-card card">
                <div className="avatar avatar-lg" style={{ cursor:'pointer', flexShrink:0 }}
                  onClick={() => navigate(`/profile/${u.id}`)}>
                  {u.avatar_url
                    ? <img src={u.avatar_url} alt={u.username} style={{ width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover' }}/>
                    : initials(u.username)
                  }
                </div>
                <div className="user-card-info">
                  <span className="user-card-name" onClick={() => navigate(`/profile/${u.id}`)}>{u.username}</span>
                  <p className="text-muted" style={{ fontSize:'13px' }}>{u.bio || 'No bio yet'}</p>
                </div>
                <div style={{ display:'flex', gap:'7px', alignItems:'center', flexShrink:0 }}>
                  <button className="btn-secondary" style={{ fontSize:'13px', padding:'7px 13px' }}
                    onClick={() => navigate(`/profile/${u.id}`)}>View</button>
                  {!requested.has(u.id)
                    ? <button className="btn-primary" style={{ fontSize:'13px', padding:'7px 13px' }}
                        onClick={() => sendRequest(u.id)}>+ Add</button>
                    : <span style={{ fontSize:'13px', color:'var(--tx-muted)' }}>Sent</span>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="content-right"><RightPanel /></div>
      </div>
    </Layout>
  )
}
