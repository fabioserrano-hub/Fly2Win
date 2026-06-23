import { useState, useEffect } from 'react'
import { db } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const PASSOS = [
  { id:'boas-vindas', icon:'🕊️', titulo:'Bem-vindo ao ChampionsLoft!', desc:'A plataforma premium de gestão columbófila. Vamos configurar o teu pombal em menos de 2 minutos.', acao:null },
  { id:'perfil', icon:'👤', titulo:'O teu perfil', desc:'Preenche o teu nome, federação e localização do pombal. Estes dados aparecem no Pedigree e na Comunidade.', acao:'perfil', acaoLabel:'Preencher Perfil' },
  { id:'primeiro-pombo', icon:'🐦', titulo:'Adiciona o teu primeiro pombo', desc:'Regista um pombo do teu efectivo. Podes importar vários de uma vez em CSV no módulo de Importação.', acao:'pombos', acaoLabel:'Ir a Pombos' },
  { id:'primeira-prova', icon:'🏆', titulo:'Regista uma prova', desc:'Adiciona resultados de provas para calcular percentis e acompanhar a evolução do efectivo.', acao:'provas', acaoLabel:'Ir a Provas' },
  { id:'comunidade', icon:'🌐', titulo:'Junta-te à Comunidade', desc:'Activa o perfil público para aparecer no mapa, seguires outros criadores e partilhares resultados.', acao:'comunidade', acaoLabel:'Ver Comunidade' },
  { id:'concluido', icon:'🎉', titulo:'Pronto!', desc:'O teu pombal está configurado. Explora Reprodução, Saúde, Pedigree, Casais IA e muito mais.', acao:null },
]

export default function Onboarding({ nav, onConcluir }) {
  const [passo, setPasso] = useState(0)
  const [fade, setFade] = useState(true)

  const ir = (delta) => {
    setFade(false)
    setTimeout(() => { setPasso(p => Math.max(0, Math.min(PASSOS.length-1, p+delta))); setFade(true) }, 180)
  }

  const concluir = () => {
    localStorage.setItem('cl_onboarding_done','1')
    db.savePerfil({ onboarding_done:true }).catch(()=>{})
    onConcluir?.()
  }

  const step = PASSOS[passo]
  const pct = Math.round(passo/(PASSOS.length-1)*100)
  const ultimo = passo === PASSOS.length-1

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(5,13,26,.96)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'linear-gradient(135deg,#050D1A,#0B1830)', border:'1px solid rgba(212,175,55,.25)', borderRadius:20, padding:'32px 28px', maxWidth:400, width:'100%', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#B8960C,#D4AF37,#B8960C)' }} />
        <button onClick={concluir} style={{ position:'absolute', top:14, right:14, background:'none', border:'none', color:'#475569', cursor:'pointer', fontSize:12 }}>Saltar</button>
        <div style={{ height:4, background:'#101F40', borderRadius:2, marginBottom:28, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${pct}%`, background:'linear-gradient(90deg,#1E5FD9,#D4AF37)', borderRadius:2, transition:'width .4s' }} />
        </div>
        <div style={{ textAlign:'center', opacity:fade?1:0, transition:'opacity .18s' }}>
          <div style={{ fontSize:54, marginBottom:14 }}>{step.icon}</div>
          <div style={{ fontSize:19, fontWeight:900, color:'#fff', fontFamily:"'Fraunces',serif", marginBottom:10, lineHeight:1.3 }}>{step.titulo}</div>
          <div style={{ fontSize:13, color:'#94a3b8', lineHeight:1.7, marginBottom:24 }}>{step.desc}</div>
          <div style={{ display:'flex', justifyContent:'center', gap:6, marginBottom:22 }}>
            {PASSOS.map((_,i)=>(
              <div key={i} style={{ width:i===passo?18:6, height:6, borderRadius:3, background:i===passo?'#D4AF37':i<passo?'#2DD4A7':'#1B2D52', transition:'all .3s', cursor:'pointer' }} onClick={()=>{setFade(false);setTimeout(()=>{setPasso(i);setFade(true)},180)}} />
            ))}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {step.acao && (
              <button className="btn btn-secondary" onClick={()=>{ nav?.(step.acao); ir(1) }}>{step.acaoLabel} →</button>
            )}
            <button className="btn btn-primary" onClick={()=>ultimo?concluir():ir(1)} style={{ fontSize:14, padding:'12px' }}>
              {ultimo ? '🚀 Começar a usar!' : step.acao ? 'Depois →' : 'Continuar →'}
            </button>
          </div>
          {passo>0 && <button onClick={()=>ir(-1)} style={{ marginTop:10, background:'none', border:'none', color:'#475569', cursor:'pointer', fontSize:12 }}>← Voltar</button>}
        </div>
      </div>
    </div>
  )
}

export function useOnboarding() {
  const { user } = useAuth()
  const [mostrar, setMostrar] = useState(false)
  useEffect(() => {
    if (!user || localStorage.getItem('cl_onboarding_done')) return
    setTimeout(() => setMostrar(true), 1000)
  }, [user])
  return { mostrar, concluir: () => setMostrar(false) }
}
