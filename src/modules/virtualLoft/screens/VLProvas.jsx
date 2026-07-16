// src/modules/virtualLoft/screens/VLProvas.jsx
import { useState, useEffect, useRef } from 'react'

// ── Motor de simulação ────────────────────────────────────────────────────────
function simularProva(pombos, prova, carreira) {
  const resultados = []
  const totalConcorrentes = 20 + Math.floor(Math.random() * 80)

  // Calcular score de cada pombo
  pombos.forEach(p => {
    const attrs = p.atributos
    // Score base pelos atributos relevantes para o tipo de prova
    const scoreVelocidade = (attrs.velocidade * 0.4 + attrs.instinto * 0.3 + attrs.coragem * 0.3)
    const scoreResistencia = (attrs.resistencia * 0.4 + attrs.forca * 0.3 + attrs.recuperacao * 0.3)
    const scoreOrientacao = (attrs.orientacao * 0.5 + attrs.inteligencia * 0.5)

    let scoreBase
    if (prova.tipo === 'velocidade')   scoreBase = scoreVelocidade * 0.5 + scoreOrientacao * 0.3 + scoreResistencia * 0.2
    else if (prova.tipo === 'meio_fundo') scoreBase = scoreResistencia * 0.4 + scoreOrientacao * 0.35 + scoreVelocidade * 0.25
    else if (prova.tipo === 'fundo')   scoreBase = scoreResistencia * 0.5 + scoreOrientacao * 0.35 + scoreVelocidade * 0.15
    else                               scoreBase = scoreResistencia * 0.55 + scoreOrientacao * 0.4 + scoreVelocidade * 0.05

    // Factores aleatórios (forma do dia, meteo, sorte)
    const forma = 0.85 + Math.random() * 0.3
    const sorte = 0.9 + Math.random() * 0.2
    const scoreFinal = scoreBase * forma * sorte

    // Velocidade em m/min
    const velBase = prova.tipo === 'velocidade' ? 1400 : prova.tipo === 'meio_fundo' ? 1300 : 1200
    const velocidade = Math.round(velBase * (scoreFinal / 100) * (0.9 + Math.random() * 0.2))
    const tempoMinutos = Math.round((prova.distancia * 1000) / velocidade)

    resultados.push({ pombo: p, score: scoreFinal, velocidade, tempo: tempoMinutos })
  })

  // Gerar adversários IA
  for (let i = 0; i < totalConcorrentes - pombos.length; i++) {
    const nivelAdv = 40 + Math.random() * 40
    const velBase = prova.tipo === 'velocidade' ? 1400 : 1300
    const velocidade = Math.round(velBase * (nivelAdv / 100) * (0.9 + Math.random() * 0.2))
    resultados.push({ pombo: null, score: nivelAdv, velocidade, tempo: Math.round((prova.distancia * 1000) / velocidade), nome: `Adversário ${i+1}` })
  }

  // Ordenar por velocidade
  resultados.sort((a, b) => b.velocidade - a.velocidade)

  // Calcular posições e percentis
  return resultados.map((r, i) => ({
    ...r,
    posicao: i + 1,
    total: resultados.length,
    percentil: Math.round(((resultados.length - i) / resultados.length) * 100),
  }))
}

function gerarEventos(idioma) {
  const eventos = {
    pt: [
      '🦅 Ataque de falcão!',
      '⛈️ Tempestade inesperada',
      '🌫️ Neblina densa na zona de chegada',
      '💨 Vento forte contra',
      '☀️ Condições perfeitas de voo',
      '🧭 Desorientação temporária',
      '💪 Esforço final surpreendente',
      '🐦 Pombo lidera o grupo',
    ],
    en: [
      '🦅 Falcon attack!',
      '⛈️ Unexpected storm',
      '🌫️ Dense fog near the finish',
      '💨 Strong headwind',
      '☀️ Perfect flying conditions',
      '🧭 Temporary disorientation',
      '💪 Surprising final push',
      '🐦 Pigeon leads the group',
    ],
    es: [
      '🦅 ¡Ataque de halcón!',
      '⛈️ Tormenta inesperada',
      '🌫️ Niebla densa en la llegada',
      '💨 Viento fuerte en contra',
      '☀️ Condiciones perfectas de vuelo',
      '🧭 Desorientación temporal',
      '💪 Esfuerzo final sorprendente',
      '🐦 La paloma lidera el grupo',
    ],
  }
  const lista = eventos[idioma] || eventos.pt
  const n = 2 + Math.floor(Math.random() * 3)
  const shuffled = [...lista].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

// ── Componente de simulação visual ────────────────────────────────────────────
function SimulacaoVisual({ prova, resultados, pombosParticipantes, onFechar, idioma }) {
  const [fase, setFase] = useState('inicio') // inicio → voo → chegada → resultado
  const [progresso, setProgresso] = useState(0)
  const [eventos, setEventos] = useState([])
  const [eventoAtual, setEventoAtual] = useState(null)
  const [chegadas, setChegadas] = useState([])
  const intervalo = useRef(null)

  const eventosProva = gerarEventos(idioma)

  useEffect(() => {
    // Fase 1: Início
    setTimeout(() => setFase('voo'), 1500)

    // Fase 2: Voo — progresso e eventos
    let prog = 0
    let eventoIdx = 0
    intervalo.current = setInterval(() => {
      prog += 2
      setProgresso(prog)

      // Mostrar eventos aleatórios
      if (prog === 20 || prog === 50 || prog === 75) {
        const ev = eventosProva[eventoIdx]
        if (ev) { setEventoAtual(ev); setTimeout(() => setEventoAtual(null), 2500); eventoIdx++ }
      }

      if (prog >= 100) {
        clearInterval(intervalo.current)
        setFase('chegada')
        // Simular chegadas progressivas
        const resOrdenados = [...resultados].sort((a,b) => a.posicao - b.posicao)
        resOrdenados.forEach((r, i) => {
          setTimeout(() => {
            setChegadas(prev => [...prev, r])
            if (i === resOrdenados.length - 1) setTimeout(() => setFase('resultado'), 1500)
          }, i * 300)
        })
      }
    }, 80)

    return () => clearInterval(intervalo.current)
  }, [])

  const meusPombos = resultados.filter(r => r.pombo)

  return (
    <div style={{ position:'fixed', inset:0, background:'#030812', zIndex:2000, display:'flex', flexDirection:'column', fontFamily:'inherit' }}>

      {/* Header */}
      <div style={{ padding:'14px 16px', borderBottom:'1px solid rgba(255,255,255,.06)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ fontSize:14, fontWeight:800, color:'#fff' }}>{prova.nome}</div>
          <div style={{ fontSize:10, color:'#7A8699' }}>{prova.tipo} · {prova.distancia}km · {resultados.length} {idioma==='en'?'pigeons':idioma==='es'?'palomas':'pombos'}</div>
        </div>
        {fase === 'resultado' && (
          <button onClick={onFechar} style={{ background:'rgba(255,255,255,.08)', border:'none', borderRadius:8, padding:'6px 12px', color:'#fff', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
            {idioma==='en'?'Close':idioma==='es'?'Cerrar':'Fechar'} ✕
          </button>
        )}
      </div>

      <div style={{ flex:1, overflow:'auto', padding:'16px' }}>

        {/* FASE: INÍCIO */}
        {fase === 'inicio' && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:300, gap:16 }}>
            <div style={{ fontSize:48 }}>🚀</div>
            <div style={{ fontSize:20, fontWeight:800, color:'#D4AF37', textAlign:'center' }}>
              {idioma==='en'?'Race Starting!':idioma==='es'?'¡Carrera comenzando!':'Prova a Começar!'}
            </div>
            <div style={{ fontSize:13, color:'#7A8699' }}>
              {pombosParticipantes.length} {idioma==='en'?'pigeons ready':idioma==='es'?'palomas listas':'pombos prontos'}
            </div>
          </div>
        )}

        {/* FASE: VOO */}
        {(fase === 'voo' || fase === 'chegada') && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* Barra de progresso */}
            <div style={{ background:'linear-gradient(135deg,#050D1A,#0B1830)', border:'1px solid rgba(255,255,255,.06)', borderRadius:14, padding:'16px', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:0, left:0, bottom:0, width:`${progresso}%`, background:'linear-gradient(90deg,rgba(76,141,255,.1),rgba(212,175,55,.1))', transition:'width .1s' }}/>
              <div style={{ position:'relative' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                  <div style={{ fontSize:11, color:'#7A8699' }}>📍 {idioma==='en'?'Release point':idioma==='es'?'Punto de suelta':'Ponto de solta'}</div>
                  <div style={{ fontSize:11, color:'#D4AF37', fontWeight:700 }}>{idioma==='en'?'Finish':idioma==='es'?'Meta':'Chegada'} 🏁</div>
                </div>
                <div style={{ height:8, background:'rgba(255,255,255,.06)', borderRadius:4, overflow:'hidden', marginBottom:8 }}>
                  <div style={{ height:'100%', width:`${progresso}%`, background:'linear-gradient(90deg,#4C8DFF,#D4AF37)', borderRadius:4, transition:'width .1s' }}/>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <div style={{ fontSize:10, color:'#475569' }}>{prova.distancia}km</div>
                  <div style={{ fontSize:12, fontWeight:700, color:'#D4AF37' }}>{progresso}%</div>
                </div>

                {/* Pombos em voo */}
                <div style={{ marginTop:12, display:'flex', gap:4, flexWrap:'wrap' }}>
                  {pombosParticipantes.map((p,i) => (
                    <div key={p.id} style={{ fontSize:16, filter: progresso < 100 ? 'none' : 'grayscale(0)', transition:'all .5s' }}
                      title={p.nome}>🐦</div>
                  ))}
                </div>
              </div>
            </div>

            {/* Evento actual */}
            {eventoAtual && (
              <div style={{ padding:'12px 16px', background:'rgba(212,175,55,.1)', border:'1px solid rgba(212,175,55,.3)', borderRadius:12, fontSize:14, fontWeight:700, color:'#D4AF37', textAlign:'center', animation:'pulse 1s infinite' }}>
                {eventoAtual}
              </div>
            )}

            {/* Chegadas progressivas */}
            {chegadas.length > 0 && (
              <div>
                <div style={{ fontSize:9, color:'#2DD4A7', fontWeight:700, letterSpacing:1.5, marginBottom:8 }}>
                  🏁 {idioma==='en'?'ARRIVALS':idioma==='es'?'LLEGADAS':'CHEGADAS'}
                </div>
                {chegadas.slice(0, 10).map((r, i) => {
                  const isMeu = !!r.pombo
                  return (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background: isMeu ? 'rgba(212,175,55,.08)' : 'rgba(255,255,255,.02)', border:`1px solid ${isMeu ? 'rgba(212,175,55,.2)' : 'rgba(255,255,255,.04)'}`, borderRadius:8, marginBottom:4 }}>
                      <div style={{ width:28, height:28, borderRadius:6, background: r.posicao <= 3 ? ['#D4AF37','#94a3b8','#b45309'][r.posicao-1]+'30' : 'rgba(255,255,255,.05)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, color: r.posicao <= 3 ? ['#D4AF37','#94a3b8','#b45309'][r.posicao-1] : '#475569' }}>
                        {r.posicao}º
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12, fontWeight: isMeu ? 700 : 400, color: isMeu ? '#D4AF37' : '#cbd5e1' }}>
                          {isMeu ? `🐦 ${r.pombo.nome}` : (r.nome || `Adversário`)}
                        </div>
                        <div style={{ fontSize:10, color:'#475569' }}>{r.velocidade} m/min</div>
                      </div>
                      {isMeu && <div style={{ fontSize:11, fontWeight:700, color:'#2DD4A7' }}>Top {100-r.percentil}%</div>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* FASE: RESULTADO FINAL */}
        {fase === 'resultado' && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ textAlign:'center', padding:'20px 0' }}>
              <div style={{ fontSize:40, marginBottom:8 }}>🏆</div>
              <div style={{ fontSize:20, fontWeight:800, color:'#D4AF37' }}>
                {idioma==='en'?'Race Complete!':idioma==='es'?'¡Carrera completada!':'Prova Concluída!'}
              </div>
            </div>

            {meusPombos.map(r => (
              <div key={r.pombo.id} style={{ padding:'16px', background: r.posicao <= 3 ? 'rgba(212,175,55,.08)' : 'rgba(255,255,255,.03)', border:`2px solid ${r.posicao <= 3 ? '#D4AF37' : 'rgba(255,255,255,.08)'}`, borderRadius:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                  <div>
                    <div style={{ fontSize:16, fontWeight:800, color:'#fff' }}>{r.pombo.nome}</div>
                    <div style={{ fontSize:11, color:'#7A8699' }}>{r.pombo.especialidade}</div>
                  </div>
                  <div style={{ textAlign:'center', background: r.posicao <= 3 ? 'rgba(212,175,55,.15)' : 'rgba(255,255,255,.06)', borderRadius:10, padding:'8px 14px' }}>
                    <div style={{ fontFamily:"'Fraunces',serif", fontSize:24, fontWeight:900, color: r.posicao <= 3 ? '#D4AF37' : '#fff' }}>{r.posicao}º</div>
                    <div style={{ fontSize:9, color:'#7A8699' }}>/{r.total}</div>
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, textAlign:'center' }}>
                  {[
                    { label: idioma==='en'?'Speed':idioma==='es'?'Velocidad':'Velocidade', valor:`${r.velocidade} m/min`, cor:'#4C8DFF' },
                    { label: idioma==='en'?'Percentile':idioma==='es'?'Percentil':'Percentil', valor:`${r.percentil}%`, cor:'#2DD4A7' },
                    { label: idioma==='en'?'Time':idioma==='es'?'Tiempo':'Tempo', valor:`${Math.floor(r.tempo/60)}h${r.tempo%60}m`, cor:'#D4AF37' },
                  ].map((s,i) => (
                    <div key={i} style={{ padding:'8px', background:'rgba(255,255,255,.03)', borderRadius:8 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:s.cor }}>{s.valor}</div>
                      <div style={{ fontSize:9, color:'#475569' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
const PROVAS_CALENDARIO = [
  { id:'p1', nome:'Prova Local - Santarém',      distancia:80,  tipo:'velocidade',   semana:3,  nivel:'local',         premio:100 },
  { id:'p2', nome:'Prova Local - Setúbal',       distancia:120, tipo:'velocidade',   semana:5,  nivel:'local',         premio:150 },
  { id:'p3', nome:'Distrital - Évora',            distancia:200, tipo:'velocidade',   semana:8,  nivel:'distrital',     premio:300 },
  { id:'p4', nome:'Distrital - Beja',             distancia:250, tipo:'meio_fundo',   semana:11, nivel:'distrital',     premio:400 },
  { id:'p5', nome:'Regional - Badajoz',           distancia:350, tipo:'meio_fundo',   semana:15, nivel:'regional',      premio:600 },
  { id:'p6', nome:'Regional - Mérida',            distancia:420, tipo:'meio_fundo',   semana:18, nivel:'regional',      premio:800 },
  { id:'p7', nome:'Nacional - Salamanca',         distancia:510, tipo:'fundo',        semana:22, nivel:'nacional',      premio:1500 },
  { id:'p8', nome:'Nacional - Valladolid',        distancia:650, tipo:'fundo',        semana:26, nivel:'nacional',      premio:2000 },
  { id:'p9', nome:'Internacional - Barcelona',    distancia:850, tipo:'grande_fundo',  semana:30, nivel:'internacional', premio:5000 },
  { id:'p10',nome:'Grande Prova - Pau',           distancia:1100,tipo:'grande_fundo',  semana:35, nivel:'internacional', premio:10000 },
]

const COR_NIVEL = { local:'#7A8699', distrital:'#4C8DFF', regional:'#2DD4A7', nacional:'#D4AF37', internacional:'#A855F7' }

export default function VLProvas({ carreira, onVoltar, onGuardar, idioma = 'pt' }) {
  const [tab, setTab] = useState('calendario')
  const [provaAtiva, setProvaAtiva] = useState(null)
  const [pombosSelec, setPombosSelec] = useState([])
  const [simulando, setSimulando] = useState(false)
  const [resultados, setResultados] = useState(null)
  const [historico, setHistorico] = useState(carreira.historico_provas || [])

  const provasDisponiveis = PROVAS_CALENDARIO.filter(p => p.semana >= carreira.semana)
  const provasPassadas = PROVAS_CALENDARIO.filter(p => p.semana < carreira.semana)

  const togglePombo = (pombo) => {
    setPombosSelec(prev =>
      prev.find(p => p.id === pombo.id)
        ? prev.filter(p => p.id !== pombo.id)
        : prev.length < 10 ? [...prev, pombo] : prev
    )
  }

  const iniciarProva = () => {
    if (pombosSelec.length === 0) return
    const res = simularProva(pombosSelec, provaAtiva, carreira)
    setResultados(res)
    setSimulando(true)
  }

  const fecharSimulacao = () => {
    // Guardar resultados no histórico
    const novosResultados = pombosSelec.map(p => {
      const r = resultados.find(r => r.pombo?.id === p.id)
      return { provaId: provaAtiva.id, provaNome: provaAtiva.nome, pomboId: p.id, pomboNome: p.nome, posicao: r?.posicao, total: r?.total, percentil: r?.percentil, velocidade: r?.velocidade, semana: carreira.semana }
    })
    const novoHistorico = [...historico, ...novosResultados]
    setHistorico(novoHistorico)

    // Actualizar pombos com resultados
    const novosPombos = carreira.pombos.map(p => {
      const r = resultados.find(r => r.pombo?.id === p.id)
      if (!r) return p
      return { ...p, provas: (p.provas || 0) + 1, vitorias: (p.vitorias || 0) + (r.posicao === 1 ? 1 : 0), percentil_medio: Math.round(((p.percentil_medio || 0) * (p.provas || 0) + r.percentil) / ((p.provas || 0) + 1)) }
    })

    // Avançar semana
    const premio = pombosSelec.some(p => resultados.find(r => r.pombo?.id === p.id && r.posicao <= 3)) ? provaAtiva.premio : 0
    onGuardar?.({ ...carreira, pombos: novosPombos, historico_provas: novoHistorico, semana: carreira.semana + 1, orcamento: carreira.orcamento + premio })

    setSimulando(false)
    setResultados(null)
    setProvaAtiva(null)
    setPombosSelec([])
    setTab('historico')
  }

  const tipoLabel = { velocidade: idioma==='en'?'Sprint':idioma==='es'?'Velocidad':'Velocidade', meio_fundo: idioma==='en'?'Mid-Distance':idioma==='es'?'Medio Fondo':'Meio-Fundo', fundo: idioma==='en'?'Long Distance':idioma==='es'?'Fondo':'Fundo', grande_fundo: idioma==='en'?'Ultra Long':idioma==='es'?'Gran Fondo':'Grande Fundo' }

  return (
    <div style={{ minHeight:'100vh', background:'#030812', color:'#fff', fontFamily:'inherit' }}>

      {simulando && resultados && (
        <SimulacaoVisual prova={provaAtiva} resultados={resultados} pombosParticipantes={pombosSelec} onFechar={fecharSimulacao} idioma={idioma} />
      )}

      <div style={{ background:'linear-gradient(180deg,#050D1A,#030812)', borderBottom:'1px solid rgba(255,255,255,.05)', padding:'14px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
          <button onClick={onVoltar} style={{ background:'rgba(255,255,255,.06)', border:'none', borderRadius:8, width:32, height:32, color:'#7A8699', cursor:'pointer', fontSize:16 }}>←</button>
          <div>
            <div style={{ fontSize:16, fontWeight:800 }}>🏆 {idioma==='en'?'Races':idioma==='es'?'Carreras':'Provas'}</div>
            <div style={{ fontSize:10, color:'#7A8699' }}>{idioma==='en'?'Season':idioma==='es'?'Temporada':'Época'} {carreira.epoca} · {idioma==='en'?'Week':idioma==='es'?'Semana':'Semana'} {carreira.semana}</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {[['calendario', idioma==='en'?'Calendar':idioma==='es'?'Calendario':'Calendário'], ['inscrever', idioma==='en'?'Enter Race':idioma==='es'?'Inscribir':'Inscrever'], ['historico', idioma==='en'?'History':idioma==='es'?'Historial':'Historial']].map(([id,label]) => (
            <button key={id} onClick={() => setTab(id)}
              style={{ flex:'none', padding:'8px 14px', borderRadius:8, border: tab===id?'none':'1px solid rgba(255,255,255,.08)', background: tab===id?'linear-gradient(135deg,#1E5FD9,#1456C0)':'rgba(255,255,255,.04)', color: tab===id?'#fff':'#cbd5e1', fontSize:12, fontWeight: tab===id?700:500, cursor:'pointer', fontFamily:'inherit', minHeight:36 }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding:'12px 16px' }}>

        {/* CALENDÁRIO */}
        {tab === 'calendario' && (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {PROVAS_CALENDARIO.map(p => {
              const passada = p.semana < carreira.semana
              const proxima = p.semana === carreira.semana
              const cor = COR_NIVEL[p.nivel] || '#7A8699'
              return (
                <div key={p.id} style={{ padding:'12px 14px', background: proxima ? `${cor}10` : passada ? 'rgba(255,255,255,.01)' : 'rgba(255,255,255,.03)', border:`1px solid ${proxima ? cor+'40' : passada ? 'rgba(255,255,255,.04)' : 'rgba(255,255,255,.06)'}`, borderRadius:10, opacity: passada ? .5 : 1, position:'relative', overflow:'hidden' }}>
                  {proxima && <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:cor }}/>}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                        <span style={{ fontSize:9, fontWeight:700, color:cor, background:`${cor}15`, padding:'2px 6px', borderRadius:4, letterSpacing:.5 }}>{p.nivel.toUpperCase()}</span>
                        {proxima && <span style={{ fontSize:9, fontWeight:700, color:'#D4AF37', background:'rgba(212,175,55,.15)', padding:'2px 6px', borderRadius:4 }}>ESTA SEMANA</span>}
                        {passada && <span style={{ fontSize:9, color:'#475569' }}>✓</span>}
                      </div>
                      <div style={{ fontSize:13, fontWeight:700, color: passada ? '#475569' : '#fff', marginBottom:2 }}>{p.nome}</div>
                      <div style={{ fontSize:10, color:'#475569' }}>{tipoLabel[p.tipo]} · {p.distancia}km · 🏅 {p.premio.toLocaleString()}€</div>
                    </div>
                    <div style={{ textAlign:'center', minWidth:44 }}>
                      <div style={{ fontSize:16, fontWeight:900, color: proxima ? cor : passada ? '#2a3a5a' : '#475569', fontFamily:"'Fraunces',serif" }}>{p.semana}</div>
                      <div style={{ fontSize:8, color:'#475569' }}>SEM.</div>
                    </div>
                  </div>
                  {proxima && (
                    <button onClick={() => { setProvaAtiva(p); setTab('inscrever') }}
                      style={{ marginTop:8, width:'100%', padding:'8px', borderRadius:8, border:'none', background:'linear-gradient(135deg,#A855F7,#7C3AED)', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                      🏆 {idioma==='en'?'Enter this race':idioma==='es'?'Inscribirse':'Inscrever agora'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* INSCREVER */}
        {tab === 'inscrever' && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {!provaAtiva ? (
              <div>
                <div style={{ fontSize:11, color:'#7A8699', marginBottom:10 }}>
                  {idioma==='en'?'Select a race:':idioma==='es'?'Selecciona una carrera:':'Selecciona uma prova:'}
                </div>
                {provasDisponiveis.slice(0,3).map(p => (
                  <div key={p.id} onClick={() => setProvaAtiva(p)}
                    style={{ padding:'12px 14px', background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.06)', borderRadius:10, marginBottom:6, cursor:'pointer' }}>
                    <div style={{ fontSize:13, fontWeight:700 }}>{p.nome}</div>
                    <div style={{ fontSize:10, color:'#7A8699' }}>{tipoLabel[p.tipo]} · {p.distancia}km · Semana {p.semana}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <div style={{ padding:'12px 14px', background:'rgba(168,85,247,.08)', border:'1px solid rgba(168,85,247,.2)', borderRadius:10, marginBottom:12 }}>
                  <div style={{ fontSize:14, fontWeight:800, color:'#A855F7' }}>{provaAtiva.nome}</div>
                  <div style={{ fontSize:11, color:'#7A8699', marginTop:2 }}>{tipoLabel[provaAtiva.tipo]} · {provaAtiva.distancia}km · 🏅 {provaAtiva.premio.toLocaleString()}€</div>
                </div>

                <div style={{ fontSize:11, color:'#7A8699', marginBottom:8 }}>
                  {idioma==='en'?`Select pigeons (${pombosSelec.length}/10 selected):`:idioma==='es'?`Selecciona palomas (${pombosSelec.length}/10 seleccionadas):`:idioma==='pt'?`Selecciona pombos (${pombosSelec.length}/10 seleccionados):`:''}
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8, marginBottom:12 }}>
                  {carreira.pombos.filter(p => p.estado === 'activo').map(p => {
                    const sel = pombosSelec.find(s => s.id === p.id)
                    const cor = p.sexo === 'F' ? '#c084fc' : '#4C8DFF'
                    return (
                      <div key={p.id} onClick={() => togglePombo(p)}
                        style={{ padding:'10px 12px', background: sel ? `${cor}15` : 'rgba(255,255,255,.02)', border:`1.5px solid ${sel ? cor : 'rgba(255,255,255,.06)'}`, borderRadius:10, cursor:'pointer', transition:'all .15s' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <div style={{ fontSize:12, fontWeight:700, color: sel ? cor : '#fff' }}>{p.nome}</div>
                          {sel && <div style={{ width:16, height:16, borderRadius:'50%', background:cor, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, color:'#fff', fontWeight:700 }}>✓</div>}
                        </div>
                        <div style={{ fontSize:10, color:'#475569', marginTop:2 }}>{p.especialidade}</div>
                        <div style={{ display:'flex', gap:2, marginTop:4 }}>
                          {Array.from({length:5}).map((_,i)=><div key={i} style={{ width:6,height:6,borderRadius:1,background:i<p.rating?'#D4AF37':'rgba(255,255,255,.08)' }}/>)}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => { setProvaAtiva(null); setPombosSelec([]) }}
                    style={{ flex:1, padding:'12px', borderRadius:10, border:'1px solid rgba(255,255,255,.08)', background:'transparent', color:'#7A8699', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                    {idioma==='en'?'Cancel':idioma==='es'?'Cancelar':'Cancelar'}
                  </button>
                  <button onClick={iniciarProva} disabled={pombosSelec.length === 0}
                    style={{ flex:2, padding:'12px', borderRadius:10, border:'none', background: pombosSelec.length > 0 ? 'linear-gradient(135deg,#A855F7,#7C3AED)' : 'rgba(255,255,255,.06)', color: pombosSelec.length > 0 ? '#fff' : '#475569', fontSize:13, fontWeight:700, cursor: pombosSelec.length > 0 ? 'pointer' : 'default', fontFamily:'inherit' }}>
                    🚀 {idioma==='en'?'Start Race!':idioma==='es'?'¡Iniciar Carrera!':'Iniciar Prova!'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* HISTÓRICO */}
        {tab === 'historico' && (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {historico.length === 0 ? (
              <div style={{ textAlign:'center', padding:'40px 20px' }}>
                <div style={{ fontSize:40, marginBottom:12 }}>📋</div>
                <div style={{ fontSize:14, color:'#475569', fontWeight:600 }}>
                  {idioma==='en'?'No races yet':idioma==='es'?'Sin carreras aún':'Sem provas ainda'}
                </div>
              </div>
            ) : (
              [...historico].reverse().map((r, i) => (
                <div key={i} style={{ padding:'12px 14px', background:'rgba(255,255,255,.02)', border:'1px solid rgba(255,255,255,.05)', borderRadius:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:'#fff' }}>{r.provaNome}</div>
                    <div style={{ fontSize:11, fontWeight:700, color: r.posicao <= 3 ? '#D4AF37' : '#7A8699' }}>{r.posicao}º/{r.total}</div>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <div style={{ fontSize:10, color:'#7A8699' }}>🐦 {r.pomboNome}</div>
                    <div style={{ fontSize:10, color:'#2DD4A7' }}>P{r.percentil}%</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
