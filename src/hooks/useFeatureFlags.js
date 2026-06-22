import { useState, useEffect } from 'react'
import { db, supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

const ADMIN_EMAILS = ['fabioacs23@gmail.com']

export function useFeatureFlags() {
  const { user } = useAuth()
  const [flags, setFlags] = useState({})
  const [betaTester, setBetaTester] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      try {
        const admin = ADMIN_EMAILS.includes(user.email) || await db.isAdmin(user.email).catch(()=>false)
        setIsAdmin(admin)

        let beta = admin
        if (!beta) {
          const { data } = await supabase.from('beta_testers').select('email').eq('email', user.email).maybeSingle()
          beta = !!data
        }
        setBetaTester(beta)

        const { data } = await supabase.from('feature_flags').select('*')
        if (data) {
          const map = {}
          data.forEach(f => {
            map[f.id] = (admin || beta) ? true : (f.ativo && !f.apenas_admin)
          })
          setFlags(map)
        }
      } catch(e) { console.error('flags:', e) }
      finally { setLoading(false) }
    }
    load()
  }, [user?.email])

  return { flags, isAdmin, betaTester, loading }
}
