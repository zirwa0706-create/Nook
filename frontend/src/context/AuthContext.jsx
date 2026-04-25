import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

axios.defaults.withCredentials = true

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/auth/me')
      .then(r => setUser(r.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const r = await axios.post('/api/auth/login', { email, password })
    setUser(r.data.user)
    return r.data.user
  }

  const register = async (username, email, password) => {
    const r = await axios.post('/api/auth/register', { username, email, password })
    setUser(r.data.user)
    return r.data.user
  }

  const logout = async () => {
    await axios.post('/api/auth/logout')
    setUser(null)
  }

  const updateUser = (data) => setUser(prev => ({ ...prev, ...data }))

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
