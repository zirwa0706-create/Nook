import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const IconHeart = ({ filled }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
)
const IconComment = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
)
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
)

export default function PostCard({ post, onDelete }) {
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const [liked,        setLiked]        = useState(post.liked)
  const [likeCount,    setLikeCount]    = useState(post.like_count)
  const [showComments, setShowComments] = useState(false)
  const [comments,     setComments]     = useState([])
  const [commentBody,  setCommentBody]  = useState('')
  const [loadingCmt,   setLoadingCmt]   = useState(false)

  const initials = (name) => name?.slice(0, 2).toUpperCase()

  const timeAgo = (iso) => {
    const diff = Math.floor((Date.now() - new Date(iso)) / 1000)
    if (diff < 60)    return `${diff}s ago`
    if (diff < 3600)  return `${Math.floor(diff/60)}m ago`
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`
    return `${Math.floor(diff/86400)}d ago`
  }

  const toggleLike = async () => {
    try {
      const r = await axios.post(`/api/posts/${post.id}/like`)
      setLiked(r.data.liked); setLikeCount(r.data.like_count)
    } catch {}
  }

  const loadComments = async () => {
    if (showComments) { setShowComments(false); return }
    try {
      const r = await axios.get(`/api/posts/${post.id}/comments`)
      setComments(r.data.comments); setShowComments(true)
    } catch {}
  }

  const submitComment = async (e) => {
    e.preventDefault()
    if (!commentBody.trim()) return
    setLoadingCmt(true)
    try {
      const r = await axios.post(`/api/posts/${post.id}/comments`, { body: commentBody })
      setComments(prev => [...prev, r.data.comment]); setCommentBody('')
    } catch {}
    finally { setLoadingCmt(false) }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return
    try { await axios.delete(`/api/posts/${post.id}`); onDelete(post.id) } catch {}
  }

  return (
    <div className="post-card card">
      <div className="post-header">
        <div className="avatar avatar-md" style={{ cursor:'pointer' }}
          onClick={() => navigate(`/profile/${post.user_id}`)}>
          {post.avatar_url
            ? <img src={post.avatar_url} alt={post.username} style={{ width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover' }} />
            : initials(post.username)
          }
        </div>
        <div className="post-meta">
          <span className="post-username" onClick={() => navigate(`/profile/${post.user_id}`)}>
            {post.username}
          </span>
          <span className="text-muted" style={{ fontSize:'12px' }}>{timeAgo(post.created_at)}</span>
        </div>
        {post.user_id === user?.id && (
          <button className="post-delete" onClick={handleDelete}><IconTrash /></button>
        )}
      </div>

      {post.body && <p className="post-body">{post.body}</p>}

      {post.media_url && (
        <div className="post-media">
          {post.media_type === 'video'
            ? <video src={post.media_url} controls className="post-media-file" />
            : <img src={post.media_url} alt="post" className="post-media-file" />
          }
        </div>
      )}

      <div className="post-actions">
        <button className={`action-btn${liked ? ' action-btn--liked' : ''}`} onClick={toggleLike}>
          <IconHeart filled={liked} /> {likeCount > 0 ? likeCount : ''} {liked ? 'Liked' : 'Like'}
        </button>
        <button className="action-btn" onClick={loadComments}>
          <IconComment /> {post.comment_count > 0 ? post.comment_count : ''} Comment
        </button>
      </div>

      {showComments && (
        <div className="comments-section">
          <hr className="divider" style={{ margin:'10px 0' }} />
          {comments.length === 0 && (
            <p style={{ fontSize:'13px', color:'var(--tx-muted)', padding:'4px 0' }}>No comments yet</p>
          )}
          {comments.map(c => (
            <div key={c.id} className="comment">
              <div className="avatar avatar-sm">{initials(c.username)}</div>
              <div className="comment-content">
                <span className="font-500" style={{ fontSize:'13px' }}>{c.username}</span>
                <p style={{ fontSize:'13px', color:'var(--tx-second)' }}>{c.body}</p>
              </div>
            </div>
          ))}
          <form className="comment-form" onSubmit={submitComment}>
            <div className="avatar avatar-sm">{initials(user?.username)}</div>
            <input className="comment-input" placeholder="Write a comment…"
              value={commentBody} onChange={e => setCommentBody(e.target.value)} />
            <button type="submit" className="btn-primary"
              style={{ padding:'8px 16px', fontSize:'13px' }} disabled={loadingCmt}>
              {loadingCmt ? '…' : 'Send'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
