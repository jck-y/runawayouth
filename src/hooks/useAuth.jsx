import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfile(userId) {
    console.log('fetchProfile:', userId)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    console.log('result:', data, error)
    setProfile(data ?? null)
    setLoading(false)
  }

  useEffect(() => {
    let mounted = true

    async function init() {
      // Step 1: cek session
      const { data: { session } } = await supabase.auth.getSession()
      console.log('getSession:', session?.user?.email ?? 'tidak ada session')

      if (!mounted) return

      if (session?.user) {
        setUser(session.user)
        await fetchProfile(session.user.id)
      } else {
        // Tidak ada session = langsung ke login
        setLoading(false)
      }

      // Step 2: listen perubahan setelah init selesai
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth event:', event)
          if (!mounted) return

          if (event === 'SIGNED_IN' && session?.user) {
            setUser(session.user)
            setLoading(true)
            await fetchProfile(session.user.id)
          } else if (event === 'SIGNED_OUT') {
            setUser(null)
            setProfile(null)
            setLoading(false)
          }
        }
      )

      return () => subscription.unsubscribe()
    }

    init()
    return () => { mounted = false }
  }, [])

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)