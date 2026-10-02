import { createContext, useContext, useEffect, useState } from 'react'
import { api, loadToken, setToken, onUnauthorized } from '../lib/api'
import { resetRealtime } from '../lib/realtime'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function clearSession() {
    await setToken(null)
    setSession(null)
    setProfile(null)
    resetRealtime()
  }

  useEffect(() => {
    onUnauthorized(clearSession)
    let cancelled = false
    ;(async () => {
      const token = await loadToken()
      if (token) {
        try {
          const me = await api.get('/auth/me')
          if (cancelled) return
          if (me.role !== 'staff') await clearSession()
          else {
            setSession({ access_token: token })
            setProfile(me)
          }
        } catch (error) {
          // Only drop the session when the server says it is invalid, not on a temporary network error.
          if (error.status === 401 || error.status === 403) await clearSession()
        }
      }
      if (!cancelled) setLoading(false)
    })()
    return () => { cancelled = true }
  }, [])

  async function signInWithPassword(email, password) {
    try {
      const data = await api.post('/auth/login', { email: email.trim().toLowerCase(), password, portal: 'staff' })
      await setToken(data.access_token)
      resetRealtime()
      setSession({ access_token: data.access_token })
      setProfile(data.user)
      return { data }
    } catch (error) {
      return { error }
    }
  }

  async function signOut() {
    await clearSession()
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading, signInWithPassword, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
