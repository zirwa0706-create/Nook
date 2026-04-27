import { useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import axios from 'axios'
import './Feed.css'

const IconPhoto = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
)

export default function CreatePost({ onPostCreated }) {
  const { user } = useAuth()
  const [body,    setBody]    = useState('')
  const [file,    setFile]    = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const fileRef = useRef()

  const initials = user?.username?.slice(0, 2).toUpperCase()

  const handleFile = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const removeFile = () => {
    setFile(null); setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const submit = async () => {
    if (!body.trim() && !file) return
    setLoading(true); setError('')
    try {
      const form = new FormData()
      form.append('body', body)
      if (file) form.append('media', file)
      const r = await axios.post('/api/posts/', form)
      onPostCreated(r.data.post)
      setBody(''); setFile(null); setPreview(null)
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create post. Is Flask running?')
    } finally { setLoading(false) }
  }

  return (
    <div className="create-post card">
      <div className="create-post-top">
        <div className="avatar avatar-md">{initials}</div>
        <textarea
          className="create-post-input"
          placeholder="What's on your mind?"
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={body.length > 80 ? 3 : 1}
        />
      </div>

      {preview && (
        <div className="create-post-preview">
          {file?.type.startsWith('video')
            ? <video src={preview} controls className="media-preview" />
            : <img src={preview} alt="preview" className="media-preview" />
          }
          <button className="remove-media" onClick={removeFile}>✕</button>
        </div>
      )}

      {error && <p className="post-error">{error}</p>}

      <div className="create-post-actions">
        <button className="media-btn" onClick={() => fileRef.current.click()}>
          <IconPhoto /> Photo / Video
        </button>
        <input ref={fileRef} type="file" accept="image/*,video/*"
          style={{ display:'none' }} onChange={handleFile} />
        <button className="btn-primary post-submit" onClick={submit}
          disabled={loading || (!body.trim() && !file)}>
          {loading ? 'Posting…' : 'Post'}
        </button>
      </div>
    </div>
  )
}
