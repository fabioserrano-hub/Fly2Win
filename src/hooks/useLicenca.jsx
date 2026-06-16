import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

const PLANOS_BASE = ['base','profissional','elite','pro_grupo_1_5','pro_grupo_6_12','pro_grupo_13','elite_grupo_1_5','elite_grupo_6_12','elite_grupo_13']
const PLANOS_PRO  = ['profissional','elite','pro_grupo_1_5','pro_grupo_6_12','pro_grupo_13','elite_grupo_1_5','elite_grupo_6_12','elite_grupo_13']
const PLANOS_ELITE = ['elite','elite_grupo_1_5','elite_grupo_6_12','elite_grupo_13']

export function useLicenca() {
  const { user } = useAuth()
  const [licenca, setLicenca] = useState(null)

  useEffect(() => {
    if (!user) return
    supabase.from('licencas').select('*').eq('email', user.email).single()
      .then(r => setLicenca(r.data || null))
  }, [user])

  const plano = licenca?.plano || 'gratuito'
  const ativo = licenca?.ativo !== false
  const temBase  = ativo && PLANOS_BASE.includes(plano)
  const temPro   = ativo && PLANOS_PRO.includes(plano)
  const temElite = ativo && PLANOS_ELITE.includes(plano)

  return { licenca, plano, temBase, temPro, temElite }
}

export function BloqueioPlano({ plano, nav, children }) {
  const { temBase, temPro, temElite } = useLicenca()
  const tem = plano === 'base' ? temBase : plano === 'pro' ? temPro : temElite

  if (tem) return children

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: 300, textAlign: 'center', padding: 24
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
      <div style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 8 }}>
        Funcionalidade Premium
      </div>
      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 24, maxWidth: 300 }}>
        {plano === 'elite' ? 'Disponível no plano Elite AI'
          : plano === 'pro' ? 'Disponível no plano Profissional ou superior'
          : 'Disponível no plano Base ou superior'}
      </div>
      <button className="btn btn-primary" onClick={() => nav('precos')}>Ver Planos</button>
    </div>
  )
}
