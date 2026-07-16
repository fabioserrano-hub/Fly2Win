// src/modules/virtualLoft/screens/VLPatrocinios.jsx
import { useState } from 'react'

const EMPRESAS = {
  pt: [
    { id:'agriaves', nome:'AgriAves Portugal', sector:'Alimentação', logo:'🌾', desc:'Líder em alimentação para aves', nivelMinimo:'local', contratoSemanas:8, valorSemanal:150, bonus:'Desconto 20% em alimentação', corReputacao:5 },
    { id:'vetplus',  nome:'VetPlus Clínica',   sector:'Veterinária', logo:'🏥', desc:'Clínica veterinária especializada', nivelMinimo:'local', contratoSemanas:8, valorSemanal:200, bonus:'Consultas gratuitas', corReputacao:0 },
    { id:'colombo',  nome:'Colombo Sport',      sector:'Desporto',   logo:'🏅', desc:'Equipamento desportivo columbófilo', nivelMinimo:'distrital', contratoSemanas:12, valorSemanal:350, bonus:'Kit de treino gratuito', corReputacao:8 },
    { id:'pombaltech',nome:'PombalTech',         sector:'Tecnologia', logo:'💻', desc:'Software de gestão columbófila', nivelMinimo:'regional', contratoSemanas:16, valorSemanal:500, bonus:'Plataforma premium grátis', corReputacao:10 },
    { id:'iberica',  nome:'Ibérica de Pombos',  sector:'Genética',   logo:'🧬', desc:'Genética avançada de pombos', nivelMinimo:'nacional', contratoSemanas:20, valorSemanal:800, bonus:'Análise genética gratuita', corReputacao:15 },
    { id:'champion', nome:'Champion Feed',       sector:'Nutrição',   logo:'⭐', desc:'Nutrição de elite para campeões', nivelMinimo:'internacional', contratoSemanas:24, valorSemanal:1500, bonus:'Plano nutricional personalizado', corReputacao:20 },
  ],
  en: [
    { id:'agriaves', nome:'AgriAves Portugal', sector:'Nutrition', logo:'🌾', desc:'Leading bird food specialist', nivelMinimo:'local', contratoSemanas:8, valorSemanal:150, bonus:'20% food discount', corReputacao:5 },
    { id:'vetplus',  nome:'VetPlus Clinic',   sector:'Veterinary', logo:'🏥', desc:'Specialist veterinary clinic', nivelMinimo:'local', contratoSemanas:8, valorSemanal:200, bonus:'Free consultations', corReputacao:0 },
    { id:'colombo',  nome:'Colombo Sport',    sector:'Sport',      logo:'🏅', desc:'Pigeon racing equipment', nivelMinimo:'distrital', contratoSemanas:12, valorSemanal:350, bonus:'Free training kit', corReputacao:8 },
    { id:'pombaltech',nome:'LoftTech',        sector:'Technology', logo:'💻', desc:'Pigeon management software', nivelMinimo:'regional', contratoSemanas:16, valorSemanal:500, bonus:'Free premium platform', corReputacao:10 },
    { id:'iberica',  nome:'Iberian Pigeons',  sector:'Genetics',   logo:'🧬', desc:'Advanced pigeon genetics', nivelMinimo:'nacional', contratoSemanas:20, valorSemanal:800, bonus:'Free genetic analysis', corReputacao:15 },
    { id:'champion', nome:'Champion Feed',    sector:'Nutrition',  logo:'⭐', desc:'Elite nutrition for champions', nivelMinimo:'internacional', contratoSemanas:24, valorSemanal:1500, bonus:'Personalised nutrition plan', corReputacao:20 },
  ],
}

const NIVEL_ORDER = ['local','distrital','regional','nacional','internacional','olimpico']

function podeContratar(empresa, carreira) {
  const nivelIdx = NIVEL_ORDER.indexOf(carreira.nivel_reputacao||'local')
  const minIdx = NIVEL_ORDER.indexOf(empresa.nivelMinimo)
  return nivelIdx >= minIdx
}

export default function VLPatrocinios({ carreira, onVoltar, onGuardar, idioma = 'pt' }) {
  const [msg, setMsg] = useState(null)
  const empresas = EMPRESAS[idioma] || EMPRESAS.pt
  const patrocinios = carreira.patrocinios || []
  const totalSemanal = patrocinios.reduce((s,p) => s + (p.valorSemanal||0), 0)

  const showMsg = (texto, tipo='ok') => { setMsg({texto,tipo}); setTimeout(()=>setMsg(null),3000) }

  const contratar = (empresa) => {
    if (!podeContratar(empresa, carreira)) return
    if (patrocinios.find(p=>p.id===empresa.id)) {
      showMsg(idioma==='en'?'Already contracted!':idioma==='es'?'¡Ya contratado!':'Já contratado!', 'erro')
      return
    }
    const novo = { ...empresa, semanaInicio: carreira.semana, epocaInicio: carreira.epoca, semanasRestantes: empresa.contratoSemanas, ativo: true }
    const novaCarreira = {
      ...carreira,
      patrocinios: [...patrocinios, novo],
      reputacao: Math.min(100, (carreira.reputacao||5) + (empresa.corReputacao||0)),
    }
    onGuardar?.(novaCarreira)
    showMsg(`${empresa.nome} ${idioma==='en'?'contracted!':idioma==='es'?'¡contratado!':'contratado!'}`)
  }

  const cancelar = (id) => {
    const novaCarreira = { ...carreira, patrocinios: patrocinios.filter(p=>p.id!==id) }
    onGuardar?.(novaCarreira)
    showMsg(idioma==='en'?'Contract cancelled':idioma==='es'?'Contrato cancelado':'Contrato cancelado', 'info')
  }

  return (
    <div style={{ minHeight:'100vh', background:'#030812', color:'#fff', fontFamily:'inherit' }}>
      <div style={{ background:'linear-gradient(180deg,#050D1A,#030812)', borderBottom:'1px solid rgba(255,255,255,.05)', padding:'14px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={onVoltar} style={{ background:'rgba(255,255,255,.06)', border:'none', borderRadius:8, width:32, height:32, color:'#7A8699', cursor:'pointer', fontSize:16 }}>←</button>
          <div>
            <div style={{ fontSize:16, fontWeight:800 }}>🤝 {idioma==='en'?'Sponsorships':idioma==='es'?'Patrocinios':'Patrocínios'}</div>
            <div style={{ fontSize:10, color:'#7A8699' }}>
              {patrocinios.length} {idioma==='en'?'active':idioma==='es'?'activos':'activos'} · +{totalSemanal.toLocaleString()}€/{idioma==='en'?'wk':idioma==='es'?'sem':'sem'}
              · {(carreira.nivel_reputacao||'local').toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {msg && (
        <div style={{ margin:'10px 16px 0', padding:'10px 14px', background:msg.tipo==='ok'?'rgba(45,212,167,.1)':msg.tipo==='erro'?'rgba(248,113,113,.1)':'rgba(76,141,255,.1)', border:`1px solid ${msg.tipo==='ok'?'rgba(45,212,167,.3)':msg.tipo==='erro'?'rgba(248,113,113,.3)':'rgba(76,141,255,.3)'}`, borderRadius:10, fontSize:12, color:msg.tipo==='ok'?'#2DD4A7':msg.tipo==='erro'?'#f87171':'#4C8DFF', fontWeight:600 }}>
          {msg.tipo==='ok'?'✅':msg.tipo==='erro'?'❌':'ℹ️'} {msg.texto}
        </div>
      )}

      <div style={{ padding:'12px 16px', display:'flex', flexDirection:'column', gap:10 }}>

        {/* Activos */}
        {patrocinios.length > 0 && (
          <div>
            <div style={{ fontSize:9, color:'#2DD4A7', fontWeight:700, letterSpacing:1.5, marginBottom:8 }}>
              {idioma==='en'?'ACTIVE CONTRACTS':idioma==='es'?'CONTRATOS ACTIVOS':'CONTRATOS ACTIVOS'}
            </div>
            {patrocinios.map(p => (
              <div key={p.id} style={{ display:'flex', gap:10, padding:'12px 14px', background:'rgba(45,212,167,.06)', border:'1px solid rgba(45,212,167,.2)', borderRadius:10, marginBottom:8, alignItems:'center' }}>
                <span style={{ fontSize:24 }}>{p.logo}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700 }}>{p.nome}</div>
                  <div style={{ fontSize:10, color:'#7A8699' }}>{p.bonus}</div>
                  <div style={{ fontSize:10, color:'#2DD4A7', marginTop:2 }}>+{p.valorSemanal}€/{idioma==='en'?'wk':'sem'} · {p.semanasRestantes||p.contratoSemanas} {idioma==='en'?'wks left':idioma==='es'?'sem. rest.':'sem. restantes'}</div>
                </div>
                <button onClick={()=>cancelar(p.id)} style={{ background:'rgba(248,113,113,.1)', border:'1px solid rgba(248,113,113,.2)', borderRadius:6, padding:'4px 8px', color:'#f87171', fontSize:10, cursor:'pointer', fontFamily:'inherit' }}>
                  {idioma==='en'?'Cancel':idioma==='es'?'Cancelar':'Cancelar'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Disponíveis */}
        <div>
          <div style={{ fontSize:9, color:'#4C8DFF', fontWeight:700, letterSpacing:1.5, marginBottom:8 }}>
            {idioma==='en'?'AVAILABLE SPONSORS':idioma==='es'?'PATROCINADORES DISPONIBLES':'PATROCINADORES DISPONÍVEIS'}
          </div>
          {empresas.map(e => {
            const pode = podeContratar(e, carreira)
            const jatem = !!patrocinios.find(p=>p.id===e.id)
            const cor = pode ? '#4C8DFF' : '#2a3a5a'
            return (
              <div key={e.id} style={{ display:'flex', gap:12, padding:'14px', background: jatem?'rgba(45,212,167,.04)':pode?'rgba(255,255,255,.03)':'rgba(255,255,255,.01)', border:`1px solid ${jatem?'rgba(45,212,167,.2)':pode?'rgba(255,255,255,.08)':'rgba(255,255,255,.03)'}`, borderRadius:12, marginBottom:8, opacity:pode?1:.5 }}>
                <div style={{ width:44, height:44, borderRadius:10, background:`${cor}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>{e.logo}</div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:2 }}>
                    <div style={{ fontSize:13, fontWeight:700, color: jatem?'#2DD4A7':'#fff' }}>{e.nome}</div>
                    <span style={{ fontSize:9, color:cor, background:`${cor}15`, padding:'2px 6px', borderRadius:4, fontWeight:700 }}>{e.sector.toUpperCase()}</span>
                  </div>
                  <div style={{ fontSize:11, color:'#7A8699', marginBottom:6 }}>{e.desc}</div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div style={{ fontSize:11, fontWeight:700, color:'#22c55e' }}>+{e.valorSemanal}€/{idioma==='en'?'wk':'sem'}</div>
                      <div style={{ fontSize:9, color:'#475569' }}>💡 {e.bonus}</div>
                      {!pode && <div style={{ fontSize:9, color:'#f87171', marginTop:2 }}>🔒 {idioma==='en'?'Requires':idioma==='es'?'Requiere':'Requer'} {e.nivelMinimo.toUpperCase()}</div>}
                    </div>
                    {!jatem && pode && (
                      <button onClick={()=>contratar(e)}
                        style={{ padding:'8px 14px', borderRadius:8, border:'none', background:'linear-gradient(135deg,#1E5FD9,#1456C0)', color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                        {idioma==='en'?'Sign':idioma==='es'?'Firmar':'Assinar'}
                      </button>
                    )}
                    {jatem && <span style={{ fontSize:11, color:'#2DD4A7', fontWeight:700 }}>✅ Activo</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
