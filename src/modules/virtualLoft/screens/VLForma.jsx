// src/modules/virtualLoft/screens/VLForma.jsx
// Sistema de forma — monitorizar condição física e mental dos pombos

import { useState } from 'react'

const T={bg:'#050A14',surface:'#0D1829',surface2:'#1A2A45',gold:'#C9A84C',blue:'#4FC3F7',text:'#E8EDF5',muted:'#6B7A99',success:'#2DD4A7',danger:'#F87171',purple:'#A855F7'}
function lerLS(){try{return JSON.parse(localStorage.getItem('vl_carreira'))}catch{return null}}
function gravarLS(d){try{localStorage.setItem('vl_carreira',JSON.stringify(d))}catch{}}
function GoldLine(){return <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,#C9A84C,transparent)',opacity:.7}}/>}

function corForma(v) {
  return v>=80?'#2DD4A7':v>=60?'#4C8DFF':v>=40?'#D4AF37':v>=20?'#f97316':'#f87171'
}

function labelForma(v, idioma) {
  if (v>=80) return idioma==='en'?'Excellent':idioma==='es'?'Excelente':'Excelente'
  if (v>=60) return idioma==='en'?'Good':idioma==='es'?'Buena':'Boa'
  if (v>=40) return idioma==='en'?'Average':idioma==='es'?'Regular':'Regular'
  if (v>=20) return idioma==='en'?'Poor':idioma==='es'?'Baja':'Baixa'
  return idioma==='en'?'Critical':idioma==='es'?'Crítica':'Crítica'
}

function calcForma(pombo, planoTreino) {
  const attrs = pombo.atributos || {}
  const media = ['velocidade','resistencia','recuperacao','orientacao','instinto'].reduce((s,k)=>s+(attrs[k]||50),0) / 5
  const diasDescanso = (planoTreino||[]).filter(t=>t==='descanso').length
  const bonus = diasDescanso >= 2 ? 5 : diasDescanso === 1 ? 0 : -10
  const provasRecentes = pombo.provas || 0
  const fadiga = Math.min(20, provasRecentes * 2)
  return Math.min(100, Math.max(0, Math.round(media + bonus - fadiga + (Math.random()-0.5)*10)))
}

function GraficoForma({ historico, cor }) {
  if (!historico || historico.length < 2) return null
  const max = 100, min = 0
  const w = 200, h = 40
  const pts = historico.slice(-8).map((v, i, arr) => {
    const x = (i / (arr.length-1)) * w
    const y = h - ((v - min) / (max - min)) * h
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow:'visible' }}>
      <polyline points={pts} fill="none" stroke={cor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {historico.slice(-8).map((v, i, arr) => {
        const x = (i / (arr.length-1)) * w
        const y = h - ((v - min) / (max - min)) * h
        return <circle key={i} cx={x} cy={y} r="3" fill={cor}/>
      })}
    </svg>
  )
}

export default function VLForma({ carreira, onVoltar, onGuardar, idioma = 'pt' }) {
  // Ler sempre do localStorage para ter dados mais recentes
  const [carreiraLocal, setCarreiraLocal] = useState(() => {
    try { return JSON.parse(localStorage.getItem('vl_carreira')) || carreira } catch { return carreira }
  })
  const c = carreiraLocal

  const salvarLocal = (dados) => {
    try { localStorage.setItem('vl_carreira', JSON.stringify(dados)) } catch {}
    setCarreiraLocal({ ...dados })
    onGuardar?.(dados)
  }

  const [selecionado, setSelecionado] = useState(null)

  const pombos = (c.pombos||[]).filter(p => p.estado==='activo')
  const plano = c.plano_treino || []

  // Calcular forma de cada pombo
  const pombosComForma = pombos.map(p => {
    const forma = calcForma(p, plano)
    const historico = p.historico_forma || [forma]
    return { ...p, forma, historico }
  }).sort((a,b) => b.forma - a.forma)

  // Registar forma desta semana
  const registarForma = () => {
    const novosPombos = (c.pombos||[]).map(p => {
      if (p.estado !== 'activo') return p
      const forma = calcForma(p, plano)
      const historico = [...(p.historico_forma||[]), forma].slice(-12)
      return { ...p, historico_forma: historico, forma_atual: forma }
    })
    onGuardar?.({ ...c, pombos: novosPombos })
  }

  const pomboSel = selecionado ? pombosComForma.find(p=>p.id===selecionado) : null

  const DICAS = {
    pt: [
      'Pombos com forma abaixo de 40% têm desempenho reduzido nas provas.',
      'Dias de descanso no plano de treino melhoram a forma geral.',
      'Após uma prova, os pombos precisam de 1-2 semanas de recuperação.',
      'O veterinário acelera a recuperação de lesões.',
      'Pombos mais velhos perdem forma mais rapidamente.',
    ],
    en: [
      'Pigeons with form below 40% have reduced race performance.',
      'Rest days in the training plan improve overall form.',
      'After a race, pigeons need 1-2 weeks to recover.',
      'The veterinarian speeds up injury recovery.',
      'Older pigeons lose form faster.',
    ],
    es: [
      'Las palomas con forma por debajo del 40% tienen peor rendimiento.',
      'Los días de descanso en el plan mejoran la forma general.',
      'Tras una carrera, las palomas necesitan 1-2 semanas de recuperación.',
      'El veterinario acelera la recuperación de lesiones.',
      'Las palomas más viejas pierden forma más rápidamente.',
    ],
  }

  return (
    <div style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:"'Inter',system-ui,sans-serif" }}>
      <div style={{ background:'linear-gradient(180deg,#050D1A,#030812)', borderBottom:'1px solid rgba(255,255,255,.05)', padding:'14px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={onVoltar} style={{ background:T.surface, border:'none', borderRadius:8, width:32, height:32, color:T.muted, cursor:'pointer', fontSize:16 }}>←</button>
          <div>
            <div style={{ fontSize:16, fontWeight:800 }}>📈 {idioma==='en'?'Form Tracker':idioma==='es'?'Rastreo de Forma':'Rastreio de Forma'}</div>
            <div style={{ fontSize:10, color:T.muted }}>{pombos.length} {idioma==='en'?'active pigeons':idioma==='es'?'palomas activas':'pombos activos'}</div>
          </div>
          <button onClick={registarForma} style={{ marginLeft:'auto', padding:'6px 12px', background:'rgba(45,212,167,.1)', border:'1px solid rgba(45,212,167,.3)', borderRadius:8, color:T.success, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:"'Inter',system-ui,sans-serif" }}>
            📊 {idioma==='en'?'Record':idioma==='es'?'Registrar':'Registar'}
          </button>
        </div>
      </div>

      <div style={{ padding:'12px 16px', display:'flex', flexDirection:'column', gap:10 }}>

        {/* Overview */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
          {[
            { label: idioma==='en'?'Excellent':idioma==='es'?'Excelente':'Excelente', n: pombosComForma.filter(p=>p.forma>=80).length, cor:'#2DD4A7' },
            { label: idioma==='en'?'Average':idioma==='es'?'Regular':'Regular', n: pombosComForma.filter(p=>p.forma>=40&&p.forma<80).length, cor:'#D4AF37' },
            { label: idioma==='en'?'Poor':idioma==='es'?'Baja':'Baixa', n: pombosComForma.filter(p=>p.forma<40).length, cor:'#f87171' },
          ].map((s,i) => (
            <div key={i} style={{ padding:'10px', background:T.surface, border:`1px solid ${s.cor}20`, borderRadius:10, textAlign:'center' }}>
              <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:900, color:s.cor }}>{s.n}</div>
              <div style={{ fontSize:9, color:T.muted, fontWeight:600 }}>{s.label.toUpperCase()}</div>
            </div>
          ))}
        </div>

        {/* Lista de pombos */}
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {pombosComForma.map(p => {
            const cor = corForma(p.forma)
            const isOpen = selecionado === p.id
            return (
              <div key={p.id}>
                <div onClick={() => setSelecionado(isOpen ? null : p.id)}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', background: isOpen?`${cor}08`:T.surface, border:`1px solid ${isOpen?cor+'30':'rgba(255,255,255,.05)'}`, borderRadius:10, cursor:'pointer', transition:'all .15s' }}>
                  <div style={{ width:36, height:36, borderRadius:8, background:`${cor}15`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Fraunces',serif", fontSize:12, fontWeight:900, color:cor }}>
                    {p.anilha?.slice(-3)}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:T.text }}>{p.nome}</div>
                    <div style={{ fontSize:10, color:T.muted }}>{p.especialidade}</div>
                    <div style={{ height:4, background:T.surface, borderRadius:2, marginTop:4, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${p.forma}%`, background:cor, borderRadius:2, transition:'width .5s' }}/>
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:16, fontWeight:900, color:cor, fontFamily:"'Fraunces',serif" }}>{p.forma}%</div>
                    <div style={{ fontSize:9, color:cor, fontWeight:600 }}>{labelForma(p.forma, idioma).toUpperCase()}</div>
                  </div>
                </div>

                {/* Detalhe expandido */}
                {isOpen && (
                  <div style={{ padding:'12px 14px', background:T.surface, border:`1px solid ${cor}20`, borderTopLeftRadius:0, borderTopRightRadius:0, borderBottomLeftRadius:10, borderBottomRightRadius:10, borderTop:'none', marginTop:-2 }}>
                    {/* Gráfico histórico */}
                    {p.historico && p.historico.length > 1 && (
                      <div style={{ marginBottom:10 }}>
                        <div style={{ fontSize:9, color:T.muted, marginBottom:6 }}>{idioma==='en'?'Form history':idioma==='es'?'Historial de forma':'Histórico de forma'}</div>
                        <GraficoForma historico={p.historico} cor={cor} />
                      </div>
                    )}
                    {/* Atributos detalhados */}
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:6 }}>
                      {[
                        ['velocidade', idioma==='en'?'Speed':idioma==='es'?'Velocidad':'Velocidade'],
                        ['resistencia', idioma==='en'?'Stamina':idioma==='es'?'Resistencia':'Resistência'],
                        ['recuperacao', idioma==='en'?'Recovery':idioma==='es'?'Recuperación':'Recuperação'],
                        ['orientacao', idioma==='en'?'Navigation':idioma==='es'?'Orientación':'Orientação'],
                      ].map(([k,label]) => (
                        <div key={k} style={{ padding:'6px 8px', background:T.surface, borderRadius:6 }}>
                          <div style={{ fontSize:9, color:T.muted, marginBottom:2 }}>{label}</div>
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <div style={{ flex:1, height:3, background:T.surface, borderRadius:2 }}>
                              <div style={{ height:'100%', width:`${p.atributos[k]||0}%`, background:corForma(p.atributos[k]||0), borderRadius:2 }}/>
                            </div>
                            <div style={{ fontSize:10, fontWeight:700, color:corForma(p.atributos[k]||0), width:20 }}>{p.atributos[k]||0}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Alertas */}
                    {p.forma < 40 && (
                      <div style={{ marginTop:8, padding:'8px 10px', background:'rgba(248,113,113,.08)', border:'1px solid rgba(248,113,113,.2)', borderRadius:8, fontSize:10, color:T.danger }}>
                        ⚠️ {idioma==='en'?'Low form — consider resting this pigeon before next race':idioma==='es'?'Forma baja — considera descansar esta paloma antes de la próxima carrera':'Forma baixa — considera descansar este pombo antes da próxima prova'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Dica aleatória */}
        <div style={{ padding:'12px 14px', background:'rgba(76,141,255,.06)', border:'1px solid rgba(76,141,255,.15)', borderRadius:10 }}>
          <div style={{ fontSize:9, color:T.blue, fontWeight:700, marginBottom:4 }}>💡 TIP</div>
          <div style={{ fontSize:11, color:T.muted }}>
            {(DICAS[idioma]||DICAS.pt)[Math.floor(Math.random()*(DICAS[idioma]||DICAS.pt).length)]}
          </div>
        </div>
      </div>
    </div>
  )
}
