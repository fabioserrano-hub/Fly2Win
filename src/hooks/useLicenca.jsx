import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

// ─── PLANOS ────────────────────────────────────────────
const PLANOS_BASE  = ['base','pro','elite','pro_grupo_3_5','pro_grupo_6_12','pro_grupo_13','elite_grupo_3_5','elite_grupo_6_12','elite_grupo_13','vitalicia']
const PLANOS_PRO   = ['pro','elite','pro_grupo_3_5','pro_grupo_6_12','pro_grupo_13','elite_grupo_3_5','elite_grupo_6_12','elite_grupo_13','vitalicia']
const PLANOS_ELITE = ['elite','elite_grupo_3_5','elite_grupo_6_12','elite_grupo_13','vitalicia']

// ─── HOOK ──────────────────────────────────────────────
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
  const fundador = licenca?.fundador === true

  const temTrial = trial && ativo
  const temBase  = ativo && (PLANOS_BASE.includes(plano) || trial)
  const temPro   = ativo && PLANOS_PRO.includes(plano)
  const temElite = ativo && PLANOS_ELITE.includes(plano)

  const diasTrial = (() => {
    if (!trial || !licenca?.trial_inicio) return 0
    const fim = new Date(new Date(licenca.trial_inicio).getTime() + 30*24*60*60*1000)
    return Math.max(0, Math.ceil((fim - new Date()) / 86400000))
  })()

  return { licenca, plano, ativo, trial, temTrial, temBase, temPro, temElite, fundador, diasTrial }
}

// ─── BLOQUEIO SUAVE (mostra preview com lock) ──────────
export function BloqueioPlano({ plano: nivel, nav, children, inline = false }) {
  const { temBase, temPro, temElite, trial, diasTrial } = useLicenca()
  const tem = nivel === 'base' ? temBase : nivel === 'pro' ? temPro : temElite

  if (tem) return children

  const msgs = {
    elite: { icon:'🧬', titulo:'Exclusivo Elite AI', desc:'IA, criação de ligas e clubes, relatórios PDF e analíticas avançadas.', badge:'Elite AI — 15,99€/mês' },
    pro:   { icon:'🌐', titulo:'Disponível no Pro',  desc:'Comunidade, marketplace, leilões, mensagens e analíticas.', badge:'Pro — 11,99€/mês' },
    base:  { icon:'🔓', titulo:'Disponível no Base', desc:'Gestão completa do pombal, provas, reprodução e saúde.', badge:'Base — 9,99€/mês' },
  }
  const m = msgs[nivel] || msgs.pro

  if (inline) return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 10px', background:'rgba(212,175,55,.08)', border:'1px solid rgba(212,175,55,.2)', borderRadius:8, cursor:'pointer' }} onClick={()=>nav?.('precos')}>
      <span style={{ fontSize:12 }}>🔒</span>
      <span style={{ fontSize:11, color:'#D4AF37', fontWeight:600 }}>{m.badge}</span>
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:280, textAlign:'center', padding:32 }}>
      <div style={{ fontSize:52, marginBottom:16 }}>{m.icon}</div>
      <div style={{ fontSize:17, fontWeight:700, color:'#fff', marginBottom:8, fontFamily:"'Fraunces',serif" }}>{m.titulo}</div>
      <div style={{ fontSize:13, color:'#7A8699', marginBottom:20, maxWidth:300, lineHeight:1.7 }}>{m.desc}</div>
      {trial && (
        <div style={{ fontSize:12, color:'#D4AF37', marginBottom:16, background:'rgba(212,175,55,.08)', border:'1px solid rgba(212,175,55,.2)', borderRadius:8, padding:'6px 14px' }}>
          ⏳ {diasTrial} dia(s) de trial restantes
        </div>
      )}
      <div style={{ display:'flex', gap:8 }}>
        <button className="btn btn-primary" onClick={()=>nav?.('precos')}>Ver Planos →</button>
      </div>
      <div style={{ marginTop:16, fontSize:11, color:'#475569' }}>{m.badge}</div>
    </div>
  )
}

// ─── BADGE INLINE ──────────────────────────────────────
export function BadgePlano({ plano }) {
  const cores = { elite:'#D4AF37', pro:'#2DD4A7', base:'#4C8DFF' }
  const labels = { elite:'👑 Elite AI', pro:'⭐ Pro', base:'Base' }
  const c = cores[plano] || '#475569'
  return (
    <span style={{ fontSize:10, fontWeight:700, color:c, background:`${c}15`, border:`1px solid ${c}30`, borderRadius:99, padding:'2px 8px' }}>
      {labels[plano] || plano}
    </span>
  )
}
