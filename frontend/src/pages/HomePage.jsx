import { useState, useEffect } from 'react'
import axios from 'axios'
import Layout from '../components/layout/Layout'
import StoriesBar from '../components/stories/StoriesBar'
import CreatePost from '../components/feed/CreatePost'
import PostCard from '../components/feed/PostCard'
import RightPanel from '../components/feed/RightPanel'
import './HomePage.css'

export default function HomePage() {
  const [posts,   setPosts]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => { fetchFeed() }, [])

  const fetchFeed = async () => {
    try {
      const r = await axios.get('/api/posts/feed')
      setPosts(r.data.posts)
    } catch {
      setError('Could not load feed. Make sure Flask is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="home-page">
        <div className="feed-column">
          <StoriesBar />
          <CreatePost onPostCreated={(p) => setPosts(prev => [p, ...prev])} />

          {loading && (
            <div className="feed-loading">
              <div className="loading-card card" />
              <div className="loading-card card" />
              <div className="loading-card card" />
            </div>
          )}

          {error && <p className="feed-error">{error}</p>}

          {!loading && !error && posts.length === 0 && (
            <div className="feed-empty card">
              <p style={{ fontSize:'18px', marginBottom:'8px' }}>🏡</p>
              <p style={{ fontWeight:'500', color:'var(--tx-primary)' }}>Your feed is quiet right now</p>
              <p className="text-muted" style={{ marginTop:'6px', fontSize:'13px' }}>
                Make your first post or add friends to get started!
              </p>
            </div>
          )}

          <div className="posts-list">
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onDelete={(id) => setPosts(prev => prev.filter(p => p.id !== id))}
              />
            ))}
          </div>
        </div>

        <div className="right-column">
          <RightPanel />
        </div>
      </div>
    </Layout>
  )
}
