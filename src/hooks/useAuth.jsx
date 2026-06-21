import { useState, useEffect, useRef, createContext, useContext } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const isMounted             = useRef(true)
  const profileFetched        = useRef(false)

  useEffect(() => {
    isMounted.current = true

    async function init() {
      const { data: { session } } = await supabase.auth.getSession()

      if (!isMounted.current) return

      if (session?.user) {
        setUser(session.user)
        await fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (!isMounted.current) return

          if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') return

          if (event === 'SIGNED_IN' && session?.user) {
            setUser(session.user)
            if (!profileFetched.current) {
              setLoading(true)
              await fetchProfile(session.user.id)
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null)
            setProfile(null)
            profileFetched.current = false
            setLoading(false)
          }
        }
      )

      return () => subscription.unsubscribe()
    }

    let cleanup
    init().then(fn => { cleanup = fn })

    return () => {
      isMounted.current = false
      cleanup?.()
    }
  }, [])

  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!isMounted.current) return

    if (error) console.error('fetchProfile error:', error.message)

    setProfile(data ?? null)
    profileFetched.current = true
    setLoading(false)
  }

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function signUp(email, password, fullName, role) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } }
    })
    return { error }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
