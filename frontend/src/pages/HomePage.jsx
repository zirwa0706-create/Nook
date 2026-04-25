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

  useEffect(() => {
    fetchFeed()
  }, [])

  const fetchFeed = async () => {
    try {
      const r = await axios.get('/api/posts/feed')
      setPosts(r.data.posts)
    } catch {
      setError('Could not load feed')
    } finally {
      setLoading(false)
    }
  }

  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev])
  }

  const handlePostDeleted = (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId))
  }

  return (
    <Layout>
      <div className="home-page">

        {/* Center feed */}
        <div className="feed-column">
          <StoriesBar />
          <CreatePost onPostCreated={handlePostCreated} />

          {loading && (
            <div className="feed-loading">
              <div className="loading-card card" />
              <div className="loading-card card" />
              <div className="loading-card card" />
            </div>
          )}

          {error && <p className="feed-error">{error}</p>}

          {!loading && posts.length === 0 && (
            <div className="feed-empty card">
              <p>🏡 Your feed is quiet right now.</p>
              <p className="text-muted" style={{marginTop:'6px',fontSize:'13px'}}>
                Add friends and make your first post to get started!
              </p>
            </div>
          )}

          <div className="posts-list">
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onDelete={handlePostDeleted}
              />
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="right-column">
          <RightPanel />
        </div>

      </div>
    </Layout>
  )
}
