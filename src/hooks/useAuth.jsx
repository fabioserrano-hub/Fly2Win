import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Timeout de segurança — nunca ficar preso em loading
    const timeout = setTimeout(() => setLoading(false), 5000)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
      clearTimeout(timeout)
    }).catch(() => { setLoading(false); clearTimeout(timeout) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      // Se sessão expirou ou foi invalidada, garantir que loading é false
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' || !session) {
        setLoading(false)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (e, p) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: e, password: p })
    if (error) throw error
    return data
  }

  const signUp = async (e, p, m = {}) => {
    const { data, error } = await supabase.auth.signUp({ email: e, password: p, options: { data: m } })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthCtx.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
