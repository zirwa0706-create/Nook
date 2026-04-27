import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import axios from 'axios'
import './Stories.css'

export default function StoriesBar() {
  const { user } = useAuth()
  const [stories,   setStories]   = useState([])
  const [uploading, setUploading] = useState(false)
  const [viewing,   setViewing]   = useState(null)
  const fileRef = useRef()

  useEffect(() => { fetchStories() }, [])

  const fetchStories = async () => {
    try {
      const r = await axios.get('/api/users/stories/feed')
      setStories(r.data.stories || [])
    } catch { /* no stories yet is fine */ }
  }

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const form = new FormData()
    form.append('media', file)
    try {
      await axios.post('/api/users/stories', form)
      await fetchStories()
    } catch {
      alert('Could not upload story. Make sure the file is an image or video.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const initials = (name) => name?.slice(0, 2).toUpperCase()

  // Group stories by user
  const grouped = stories.reduce((acc, s) => {
    if (!acc[s.user_id]) {
      acc[s.user_id] = { username: s.username, avatar_url: s.avatar_url, stories: [] }
    }
    acc[s.user_id].stories.push(s)
    return acc
  }, {})

  return (
    <div className="stories-bar">
      {/* Your story button */}
      <div className="story-item" onClick={() => fileRef.current.click()}>
        <div className="story-ring story-ring--add">
          <div className="avatar avatar-md story-avatar">
            {uploading ? '⏳' : initials(user?.username)}
          </div>
        </div>
        <span className="story-label">Your story</span>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          style={{ display: 'none' }}
          onChange={handleUpload}
        />
      </div>

      {/* Friends stories */}
      {Object.values(grouped).map((g, i) => (
        <div key={i} className="story-item" onClick={() => setViewing(g.stories[0])}>
          <div className="story-ring">
            <div className="avatar avatar-md story-avatar">
              {g.avatar_url
                ? <img src={g.avatar_url} alt={g.username} />
                : initials(g.username)
              }
            </div>
          </div>
          <span className="story-label">{g.username}</span>
        </div>
      ))}

      {stories.length === 0 && (
        <p className="stories-empty">No stories yet — upload yours!</p>
      )}

      {/* Fullscreen story viewer */}
      {viewing && (
        <div className="story-overlay" onClick={() => setViewing(null)}>
          <div className="story-viewer" onClick={e => e.stopPropagation()}>
            <button className="story-close" onClick={() => setViewing(null)}>✕</button>
            <p className="story-viewer-name">{viewing.username}</p>
            {viewing.media_type === 'video'
              ? <video src={viewing.media_url} autoPlay controls className="story-media" />
              : <img src={viewing.media_url} alt="story" className="story-media" />
            }
          </div>
        </div>
      )}
    </div>
  )
}
