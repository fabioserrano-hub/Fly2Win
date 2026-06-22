import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

const PLANOS_BASE  = ['base','profissional','elite','pro_grupo_3_5','pro_grupo_6_12','pro_grupo_13','elite_grupo_3_5','elite_grupo_6_12','elite_grupo_13']
const PLANOS_PRO   = ['profissional','elite','pro_grupo_3_5','pro_grupo_6_12','pro_grupo_13','elite_grupo_3_5','elite_grupo_6_12','elite_grupo_13']
const PLANOS_ELITE = ['elite','elite_grupo_3_5','elite_grupo_6_12','elite_grupo_13']

export function useLicenca() {
  const { user } = useAuth()
  const [licenca, setLicenca] = useState(null)

  useEffect(() => {
    if (!user) return
    supabase.from('licencas').select('*').eq('user_id', user.id).maybeSingle()
      .then(r => setLicenca(r.data || null))
  }, [user?.id])

  const plano    = licenca?.plano || 'trial'
  const ativo    = licenca?.ativo !== false
  const trial    = licenca?.trial_ativo === true
  const quantidade = licenca?.quantidade || 1

  // Trial: acesso limitado (15 pombos, módulos visíveis mas restritos)
  const temTrial = trial && ativo
  const temBase  = ativo && (PLANOS_BASE.includes(plano) || trial)
  const temPro   = ativo && PLANOS_PRO.includes(plano)
  const temElite = ativo && PLANOS_ELITE.includes(plano)

  // Dias restantes no trial
  const diasTrial = (() => {
    if (!trial || !licenca?.trial_inicio) return 0
    const inicio = new Date(licenca.trial_inicio)
    const fim = new Date(inicio.getTime() + 30*24*60*60*1000)
    return Math.max(0, Math.ceil((fim - new Date()) / 86400000))
  })()

  return { licenca, plano, ativo, trial, temTrial, temBase, temPro, temElite, quantidade, diasTrial }
}

export function BloqueioPlano({ plano: nivelRequerido, nav, children }) {
  const { temBase, temPro, temElite, trial, diasTrial } = useLicenca()
  const tem = nivelRequerido === 'base' ? temBase
            : nivelRequerido === 'pro'  ? temPro
            : temElite

  if (tem) return children

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:300, textAlign:'center', padding:24 }}>
      <div style={{ fontSize:48, marginBottom:16 }}>🔒</div>
      <div style={{ fontSize:18, fontWeight:600, color:'#fff', marginBottom:8 }}>Funcionalidade Premium</div>
      <div style={{ fontSize:13, color:'#64748b', marginBottom:24, maxWidth:300 }}>
        {nivelRequerido === 'elite' ? 'Disponível no plano Elite AI'
          : nivelRequerido === 'pro' ? 'Disponível no plano Pro ou superior'
          : 'Disponível no plano Base ou superior'}
      </div>
      {trial && <div style={{ fontSize:12, color:'#D4AF37', marginBottom:16 }}>⏳ {diasTrial} dias de trial restantes</div>}
      <button className="btn btn-primary" onClick={() => nav?.('precos')}>Ver Planos</button>
    </div>
  )
}
