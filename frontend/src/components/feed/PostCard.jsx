import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function PostCard({ post, onDelete }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [liked,        setLiked]        = useState(post.liked)
  const [likeCount,    setLikeCount]    = useState(post.like_count)
  const [showComments, setShowComments] = useState(false)
  const [comments,     setComments]     = useState([])
  const [commentBody,  setCommentBody]  = useState('')
  const [loadingCmt,   setLoadingCmt]   = useState(false)

  const initials = (name) => name?.slice(0, 2).toUpperCase()

  const timeAgo = (iso) => {
    const diff = Math.floor((Date.now() - new Date(iso)) / 1000)
    if (diff < 60)   return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`
    if (diff < 86400)return `${Math.floor(diff/3600)}h ago`
    return `${Math.floor(diff/86400)}d ago`
  }

  const toggleLike = async () => {
    try {
      const r = await axios.post(`/api/posts/${post.id}/like`)
      setLiked(r.data.liked)
      setLikeCount(r.data.like_count)
    } catch {}
  }

  const loadComments = async () => {
    if (showComments) { setShowComments(false); return }
    try {
      const r = await axios.get(`/api/posts/${post.id}/comments`)
      setComments(r.data.comments)
      setShowComments(true)
    } catch {}
  }

  const submitComment = async (e) => {
    e.preventDefault()
    if (!commentBody.trim()) return
    setLoadingCmt(true)
    try {
      const r = await axios.post(`/api/posts/${post.id}/comments`, { body: commentBody })
      setComments(prev => [...prev, r.data.comment])
      setCommentBody('')
    } catch {}
    finally { setLoadingCmt(false) }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return
    try {
      await axios.delete(`/api/posts/${post.id}`)
      onDelete(post.id)
    } catch {}
  }

  return (
    <div className="post-card card">
      {/* Header */}
      <div className="post-header">
        <div
          className="avatar avatar-md"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate(`/profile/${post.user_id}`)}
        >
          {post.avatar_url
            ? <img src={post.avatar_url} alt={post.username} style={{ width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover' }} />
            : initials(post.username)
          }
        </div>
        <div className="post-meta">
          <span
            className="post-username font-500"
            onClick={() => navigate(`/profile/${post.user_id}`)}
          >
            {post.username}
          </span>
          <span className="text-muted" style={{ fontSize: '12px' }}>{timeAgo(post.created_at)}</span>
        </div>
        {post.user_id === user?.id && (
          <button className="post-delete" onClick={handleDelete} title="Delete post">🗑</button>
        )}
      </div>

      {/* Body */}
      {post.body && <p className="post-body">{post.body}</p>}

      {/* Media */}
      {post.media_url && (
        <div className="post-media">
          {post.media_type === 'video'
            ? <video src={post.media_url} controls className="post-media-file" />
            : <img src={post.media_url} alt="post media" className="post-media-file" />
          }
        </div>
      )}

      {/* Actions */}
      <div className="post-actions">
        <button
          className={`action-btn ${liked ? 'action-btn--liked' : ''}`}
          onClick={toggleLike}
        >
          {liked ? '❤️' : '🤍'} {likeCount}
        </button>
        <button className="action-btn" onClick={loadComments}>
          💬 {post.comment_count}
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="comments-section">
          <hr className="divider" />
          {comments.map(c => (
            <div key={c.id} className="comment">
              <div className="avatar avatar-sm">{initials(c.username)}</div>
              <div className="comment-content">
                <span className="font-500" style={{ fontSize: '13px' }}>{c.username}</span>
                <p style={{ fontSize: '13px', color: 'var(--tx-second)' }}>{c.body}</p>
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-muted" style={{ padding: '8px 0' }}>No comments yet</p>
          )}
          <form className="comment-form" onSubmit={submitComment}>
            <div className="avatar avatar-sm">{initials(user?.username)}</div>
            <input
              className="comment-input"
              placeholder="Write a comment…"
              value={commentBody}
              onChange={e => setCommentBody(e.target.value)}
            />
            <button
              type="submit"
              className="btn-primary"
              style={{ padding: '7px 14px', fontSize: '13px' }}
              disabled={loadingCmt}
            >
              {loadingCmt ? '…' : 'Post'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
