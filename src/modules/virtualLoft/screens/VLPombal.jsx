// src/modules/virtualLoft/screens/VLPombal.jsx
import { useState } from 'react'

const ESTRUTURAS = {
  pt: [
    { id:'viveiros',    icon:'🏠', label:'Viveiros',         desc:'Capacidade de alojamento dos pombos', maxNivel:5, custoBase:2000, beneficio:'Capacidade +10 pombos por nível' },
    { id:'reproducao',  icon:'🥚', label:'Centro Reprodução', desc:'Gestão de casais e ninhadas',         maxNivel:4, custoBase:5000, beneficio:'Permite gestão de casais avançada' },
    { id:'quarentena',  icon:'🏥', label:'Quarentena',        desc:'Isolamento de pombos doentes',         maxNivel:3, custoBase:3000, beneficio:'Reduz propagação de doenças' },
    { id:'clinica',     icon:'💊', label:'Clínica',           desc:'Tratamento e recuperação',             maxNivel:4, custoBase:8000, beneficio:'Recuperação mais rápida de lesões' },
    { id:'treinos',     icon:'🎯', label:'Centro de Treinos', desc:'Melhora eficácia dos treinos',         maxNivel:4, custoBase:6000, beneficio:'+15% ganho de atributos por treino' },
    { id:'armazem',     icon:'📦', label:'Armazém',           desc:'Armazenamento de alimentos e material', maxNivel:3, custoBase:1500, beneficio:'Reduz custos de alimentação' },
    { id:'laboratorio', icon:'🔬', label:'Laboratório',       desc:'Análise genética avançada',            maxNivel:3, custoBase:12000, beneficio:'Revela potencial oculto mais rápido' },
    { id:'museu',       icon:'🏛️', label:'Museu do Pombal',   desc:'Historial e conquistas',               maxNivel:2, custoBase:4000, beneficio:'Aumenta reputação e valor dos pombos' },
  ],
  en: [
    { id:'viveiros',    icon:'🏠', label:'Lofts',              desc:'Pigeon housing capacity',              maxNivel:5, custoBase:2000, beneficio:'Capacity +10 pigeons per level' },
    { id:'reproducao',  icon:'🥚', label:'Breeding Centre',    desc:'Pair and clutch management',          maxNivel:4, custoBase:5000, beneficio:'Enables advanced pair management' },
    { id:'quarentena',  icon:'🏥', label:'Quarantine',         desc:'Isolation of sick pigeons',            maxNivel:3, custoBase:3000, beneficio:'Reduces disease spread' },
    { id:'clinica',     icon:'💊', label:'Clinic',             desc:'Treatment and recovery',               maxNivel:4, custoBase:8000, beneficio:'Faster injury recovery' },
    { id:'treinos',     icon:'🎯', label:'Training Centre',    desc:'Improves training effectiveness',      maxNivel:4, custoBase:6000, beneficio:'+15% attribute gain per training' },
    { id:'armazem',     icon:'📦', label:'Storage',            desc:'Food and equipment storage',           maxNivel:3, custoBase:1500, beneficio:'Reduces feeding costs' },
    { id:'laboratorio', icon:'🔬', label:'Laboratory',         desc:'Advanced genetic analysis',            maxNivel:3, custoBase:12000, beneficio:'Reveals hidden potential faster' },
    { id:'museu',       icon:'🏛️', label:'Hall of Fame',       desc:'History and achievements',             maxNivel:2, custoBase:4000, beneficio:'Increases reputation and pigeon value' },
  ],
  es: [
    { id:'viveiros',    icon:'🏠', label:'Palomares',          desc:'Capacidad de alojamiento',             maxNivel:5, custoBase:2000, beneficio:'Capacidad +10 palomas por nivel' },
    { id:'reproducao',  icon:'🥚', label:'Centro Cría',        desc:'Gestión de parejas y nidadas',        maxNivel:4, custoBase:5000, beneficio:'Permite gestión avanzada de parejas' },
    { id:'quarentena',  icon:'🏥', label:'Cuarentena',         desc:'Aislamiento de palomas enfermas',      maxNivel:3, custoBase:3000, beneficio:'Reduce propagación de enfermedades' },
    { id:'clinica',     icon:'💊', label:'Clínica',            desc:'Tratamiento y recuperación',           maxNivel:4, custoBase:8000, beneficio:'Recuperación más rápida de lesiones' },
    { id:'treinos',     icon:'🎯', label:'Centro Entrenamiento',desc:'Mejora eficacia de entrenamientos',   maxNivel:4, custoBase:6000, beneficio:'+15% ganancia de atributos por entrenamiento' },
    { id:'armazem',     icon:'📦', label:'Almacén',            desc:'Almacenamiento de alimentos y material',maxNivel:3, custoBase:1500, beneficio:'Reduce costes de alimentación' },
    { id:'laboratorio', icon:'🔬', label:'Laboratorio',        desc:'Análisis genético avanzado',           maxNivel:3, custoBase:12000, beneficio:'Revela potencial oculto más rápido' },
    { id:'museu',       icon:'🏛️', label:'Museo del Palomar',  desc:'Historial y logros',                   maxNivel:2, custoBase:4000, beneficio:'Aumenta reputación y valor de palomas' },
  ],
}

function custoPorNivel(base, nivel) {
  return Math.round(base * Math.pow(1.8, nivel))
}

function NivelBadge({ nivel, max, cor }) {
  return (
    <div style={{ display:'flex', gap:3, alignItems:'center' }}>
      {Array.from({length:max}).map((_,i) => (
        <div key={i} style={{ width:8, height:8, borderRadius:2, background: i < nivel ? cor : 'rgba(255,255,255,.08)' }}/>
      ))}
    </div>
  )
}

export default function VLPombal({ carreira, onVoltar, onGuardar, idioma = 'pt' }) {
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

  const estruturas = ESTRUTURAS[idioma] || ESTRUTURAS.pt
  const [selecionada, setSelecionada] = useState(null)
  const [confirmando, setConfirmando] = useState(false)
  const [msg, setMsg] = useState(null)

  const getEstruturaCarreira = (id) => c.estruturas?.[id] || { nivel: 0 }

  const construir = (est) => {
    const atual = getEstruturaCarreira(est.id)
    const proximoNivel = atual.nivel + 1
    const custo = custoPorNivel(est.custoBase, atual.nivel)

    if (c.orcamento < custo) {
      setMsg({ tipo:'erro', texto: idioma==='en'?'Not enough budget!':idioma==='es'?'¡Presupuesto insuficiente!':'Orçamento insuficiente!' })
      setTimeout(() => setMsg(null), 2500)
      return
    }

    const novasEstruturas = { ...c.estruturas, [est.id]: { nivel: proximoNivel } }
    const novaCarreira = { ...c, estruturas: novasEstruturas, orcamento: c.orcamento - custo }
    salvarLocal(novaCarreira)
    setMsg({ tipo:'ok', texto: idioma==='en'?`${est.label} upgraded to level ${proximoNivel}!`:idioma==='es'?`¡${est.label} mejorado a nivel ${proximoNivel}!`:`${est.label} melhorado para nível ${proximoNivel}!` })
    setTimeout(() => setMsg(null), 2500)
    setSelecionada(null)
    setConfirmando(false)
  }

  // Nível médio do pombal
  const nivelMedio = estruturas.length > 0
    ? Math.round(estruturas.reduce((s,e) => s + getEstruturaCarreira(e.id).nivel, 0) / estruturas.length * 10) / 10
    : 0

  return (
    <div style={{ minHeight:'100vh', background:'#030812', color:'#fff', fontFamily:'inherit' }}>

      {/* Header */}
      <div style={{ background:'linear-gradient(180deg,#050D1A,#030812)', borderBottom:'1px solid rgba(255,255,255,.05)', padding:'14px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
          <button onClick={onVoltar} style={{ background:'rgba(255,255,255,.06)', border:'none', borderRadius:8, width:32, height:32, color:'#7A8699', cursor:'pointer', fontSize:16 }}>←</button>
          <div>
            <div style={{ fontSize:16, fontWeight:800 }}>🏠 {idioma==='en'?'Loft':idioma==='es'?'Palomar':'Pombal'}</div>
            <div style={{ fontSize:10, color:'#7A8699' }}>
              {idioma==='en'?'Average level':idioma==='es'?'Nivel medio':'Nível médio'}: {nivelMedio} · {c.orcamento.toLocaleString()}€
            </div>
          </div>
        </div>
      </div>

      {/* Mensagem feedback */}
      {msg && (
        <div style={{ margin:'12px 16px 0', padding:'10px 14px', background: msg.tipo==='ok' ? 'rgba(45,212,167,.1)' : 'rgba(248,113,113,.1)', border:`1px solid ${msg.tipo==='ok' ? 'rgba(45,212,167,.3)' : 'rgba(248,113,113,.3)'}`, borderRadius:10, fontSize:12, color: msg.tipo==='ok' ? '#2DD4A7' : '#f87171', fontWeight:600 }}>
          {msg.tipo==='ok' ? '✅' : '❌'} {msg.texto}
        </div>
      )}

      <div style={{ padding:'12px 16px', display:'flex', flexDirection:'column', gap:10 }}>

        <div style={{ fontSize:9, color:'#2DD4A7', fontWeight:700, letterSpacing:1.5, marginBottom:4 }}>
          {idioma==='en'?'STRUCTURES':idioma==='es'?'ESTRUCTURAS':'ESTRUTURAS'}
        </div>

        {estruturas.map(est => {
          const atual = getEstruturaCarreira(est.id)
          const nivel = atual.nivel
          const maxed = nivel >= est.maxNivel
          const proxCusto = custoPorNivel(est.custoBase, nivel)
          const podeComprar = !maxed && c.orcamento >= proxCusto
          const isSelected = selecionada?.id === est.id

          return (
            <div key={est.id}>
              <div onClick={() => setSelecionada(isSelected ? null : est)}
                style={{ display:'flex', gap:12, padding:'12px 14px', background: isSelected ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.02)', border:`1px solid ${isSelected ? 'rgba(255,255,255,.15)' : 'rgba(255,255,255,.05)'}`, borderRadius:12, cursor:'pointer', transition:'all .15s' }}>
                <div style={{ width:44, height:44, borderRadius:10, background: nivel > 0 ? 'rgba(45,212,167,.1)' : 'rgba(255,255,255,.04)', border:`1.5px solid ${nivel > 0 ? 'rgba(45,212,167,.3)' : 'rgba(255,255,255,.08)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
                  {est.icon}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                    <div style={{ fontSize:13, fontWeight:700, color: nivel > 0 ? '#fff' : '#7A8699' }}>{est.label}</div>
                    {maxed
                      ? <span style={{ fontSize:9, color:'#D4AF37', fontWeight:700, background:'rgba(212,175,55,.1)', padding:'2px 6px', borderRadius:4 }}>MAX</span>
                      : <span style={{ fontSize:10, color: podeComprar ? '#2DD4A7' : '#f87171', fontWeight:700 }}>{proxCusto.toLocaleString()}€</span>
                    }
                  </div>
                  <div style={{ fontSize:10, color:'#475569', marginBottom:6 }}>{est.desc}</div>
                  <NivelBadge nivel={nivel} max={est.maxNivel} cor='#2DD4A7' />
                </div>
              </div>

              {/* Detalhe expandido */}
              {isSelected && (
                <div style={{ padding:'12px 14px', background:'rgba(255,255,255,.02)', border:'1px solid rgba(255,255,255,.06)', borderTopLeftRadius:0, borderTopRightRadius:0, borderBottomLeftRadius:12, borderBottomRightRadius:12, borderTop:'none', marginTop:-6 }}>
                  <div style={{ fontSize:11, color:'#7A8699', marginBottom:8 }}>
                    💡 {est.beneficio}
                  </div>
                  {!maxed ? (
                    <div style={{ display:'flex', gap:8 }}>
                      <div style={{ flex:1, padding:'8px 12px', background:'rgba(255,255,255,.03)', borderRadius:8, fontSize:11 }}>
                        <div style={{ color:'#7A8699' }}>{idioma==='en'?'Current level':idioma==='es'?'Nivel actual':'Nível actual'}: <span style={{ color:'#fff', fontWeight:700 }}>{nivel}</span></div>
                        <div style={{ color:'#7A8699' }}>{idioma==='en'?'Next level':idioma==='es'?'Siguiente nivel':'Próximo nível'}: <span style={{ color:'#2DD4A7', fontWeight:700 }}>{nivel+1}</span></div>
                      </div>
                      <button onClick={() => construir(est)} disabled={!podeComprar}
                        style={{ padding:'8px 16px', borderRadius:8, border:'none', background: podeComprar ? 'linear-gradient(135deg,#2DD4A7,#059669)' : 'rgba(255,255,255,.06)', color: podeComprar ? '#050D1A' : '#475569', fontSize:12, fontWeight:700, cursor: podeComprar ? 'pointer' : 'default', fontFamily:'inherit' }}>
                        {podeComprar
                          ? (idioma==='en'?'Upgrade':idioma==='es'?'Mejorar':'Melhorar') + ` (${proxCusto.toLocaleString()}€)`
                          : idioma==='en'?'Not enough €':idioma==='es'?'Sin fondos':'Sem fundos'}
                      </button>
                    </div>
                  ) : (
                    <div style={{ fontSize:12, color:'#D4AF37', fontWeight:700, textAlign:'center', padding:'8px 0' }}>
                      🏆 {idioma==='en'?'Maximum level reached!':idioma==='es'?'¡Nivel máximo alcanzado!':'Nível máximo atingido!'}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
