import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import Layout from '../components/layout/Layout'
import PostCard from '../components/feed/PostCard'
import './ProfilePage.css'

export default function ProfilePage() {
  const { id }           = useParams()
  const { user, updateUser } = useAuth()
  const [profile,  setProfile]  = useState(null)
  const [posts,    setPosts]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [editing,  setEditing]  = useState(false)
  const [bio,      setBio]      = useState('')
  const [isPrivate,setIsPrivate]= useState(false)
  const [saving,   setSaving]   = useState(false)
  const [friendStatus, setFriendStatus] = useState(null) // null | 'pending' | 'friends'
  const avatarRef = useRef()
  const isOwn = parseInt(id) === user?.id

  useEffect(() => { fetchProfile() }, [id])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const r = await axios.get(`/api/users/${id}`)
      setProfile(r.data.user)
      setPosts(r.data.user.posts || [])
      setBio(r.data.user.bio || '')
      setIsPrivate(r.data.user.is_private)
    } catch {}
    finally { setLoading(false) }
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      const r = await axios.patch('/api/users/me/update', { bio, is_private: isPrivate })
      updateUser(r.data.user)
      setProfile(prev => ({ ...prev, ...r.data.user }))
      setEditing(false)
    } catch {}
    finally { setSaving(false) }
  }

  const uploadAvatar = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const form = new FormData()
    form.append('avatar', file)
    try {
      const r = await axios.post('/api/users/me/avatar', form)
      updateUser({ avatar_url: r.data.avatar_url })
      setProfile(prev => ({ ...prev, avatar_url: r.data.avatar_url }))
    } catch {}
  }

  const sendRequest = async () => {
    try {
      await axios.post(`/api/friends/request/${id}`)
      setFriendStatus('pending')
    } catch {}
  }

  const initials = (name) => name?.slice(0, 2).toUpperCase()

  if (loading) return (
    <Layout>
      <div style={{ padding:'40px 28px' }}>
        <div className="card loading-card" style={{ height:'200px', maxWidth:'620px', margin:'0 auto' }} />
      </div>
    </Layout>
  )

  if (!profile) return (
    <Layout><div style={{ padding:'40px', textAlign:'center', color:'var(--tx-muted)' }}>User not found</div></Layout>
  )

  return (
    <Layout>
      <div className="profile-page">
        <div className="profile-inner">

          {/* Profile header */}
          <div className="profile-header card">
            <div className="profile-avatar-wrap">
              <div className="avatar avatar-xl profile-avatar">
                {profile.avatar_url
                  ? <img src={profile.avatar_url} alt={profile.username} style={{ width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover' }} />
                  : initials(profile.username)
                }
              </div>
              {isOwn && (
                <button className="avatar-edit-btn" onClick={() => avatarRef.current.click()}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
              )}
              <input ref={avatarRef} type="file" accept="image/*"
                style={{ display:'none' }} onChange={uploadAvatar} />
            </div>

            <div className="profile-info">
              <div className="profile-name-row">
                <h2 className="profile-name">{profile.username}</h2>
                {profile.is_private && (
                  <span className="privacy-badge">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    Private
                  </span>
                )}
              </div>

              {!editing ? (
                <>
                  <p className="profile-bio">{profile.bio || <span className="text-muted">No bio yet</span>}</p>
                  <p className="profile-joined text-muted">
                    Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month:'long', year:'numeric' })}
                  </p>
                  <div className="profile-actions">
                    {isOwn && (
                      <button className="btn-secondary" onClick={() => setEditing(true)}>Edit profile</button>
                    )}
                    {!isOwn && friendStatus === null && (
                      <button className="btn-primary" onClick={sendRequest}>+ Add friend</button>
                    )}
                    {!isOwn && friendStatus === 'pending' && (
                      <span style={{ fontSize:'13px', color:'var(--tx-muted)' }}>Request sent</span>
                    )}
                  </div>
                </>
              ) : (
                <div className="profile-edit-form">
                  <textarea
                    className="profile-bio-input"
                    placeholder="Write a short bio…"
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    maxLength={160}
                    rows={3}
                  />
                  <label className="privacy-toggle">
                    <input type="checkbox" checked={isPrivate} onChange={e => setIsPrivate(e.target.checked)} />
                    <span>Private account</span>
                  </label>
                  <div style={{ display:'flex', gap:'8px', marginTop:'8px' }}>
                    <button className="btn-primary" onClick={saveProfile} disabled={saving}>
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                    <button className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Posts section */}
          <div className="profile-posts">
            <h3 className="profile-posts-title">Posts</h3>
            {profile.private && !isOwn ? (
              <div className="private-notice card">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color:'var(--tx-muted)' }}>
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <p style={{ fontWeight:'500', color:'var(--tx-second)', marginTop:'8px' }}>This account is private</p>
                <p className="text-muted" style={{ fontSize:'13px', marginTop:'4px' }}>Send a friend request to see their posts</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="profile-no-posts card">
                <p style={{ color:'var(--tx-muted)', fontSize:'14px' }}>No posts yet</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                {posts.map(post => (
                  <PostCard key={post.id} post={post}
                    onDelete={(pid) => setPosts(prev => prev.filter(p => p.id !== pid))} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
