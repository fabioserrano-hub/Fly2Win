import { useState, useEffect, useCallback } from 'react'
import { db } from '../lib/supabase'
import { useToast, Spinner, EmptyState } from '../components/ui'
import { useLicenca, BloqueioPlano } from '../hooks/useLicenca'
import { GuiaAuto, BotaoGuia } from '../components/GuiaModulo'

const ESPECIALIDADES = ['velocidade','meio-fundo','fundo','grande-fundo']
const ESP_LABEL = { 'velocidade':'Velocidade','meio-fundo':'Meio-Fundo','fundo':'Fundo','grande-fundo':'Grande Fundo' }
const ESP_ICON = { 'velocidade':'⚡','meio-fundo':'🏃','fundo':'🏔️','grande-fundo':'🌍' }

function calcConsanguinidade(pomboA, pomboB, todos) {
  const getAntepassados = (pombo, geracoes = 3) => {
    if (!pombo || geracoes === 0) return new Set()
    const s = new Set()
    if (pombo.pai) { s.add(pombo.pai); const p = todos.find(x=>x.anilha===pombo.pai||x.nome===pombo.pai); if(p) getAntepassados(p,geracoes-1).forEach(a=>s.add(a)) }
    if (pombo.mae) { s.add(pombo.mae); const m = todos.find(x=>x.anilha===pombo.mae||x.nome===pombo.mae); if(m) getAntepassados(m,geracoes-1).forEach(a=>s.add(a)) }
    return s
  }
  const antA = getAntepassados(pomboA)
  const antB = getAntepassados(pomboB)
  const comuns = [...antA].filter(a=>antB.has(a)).length
  const total = Math.max(antA.size + antB.size, 1)
  return Math.round((comuns / total) * 100)
}

function calcScore(macho, femea, todos, espAlvo) {
  const percentilMedio = ((macho.percentil||0) + (femea.percentil||0)) / 2
  const espM = macho.esp || []
  const espF = femea.esp || []
  const espComum = espAlvo
    ? (espM.includes(espAlvo) ? 25 : 0) + (espF.includes(espAlvo) ? 25 : 0)
    : (espM.some(e=>espF.includes(e)) ? 20 : 0)
  const consang = calcConsanguinidade(macho, femea, todos)
  const penalConsang = consang > 25 ? -20 : consang > 15 ? -10 : consang > 5 ? -5 : 5
  const provasBónus = Math.min(20, ((macho.provas||0) + (femea.provas||0)) / 2)
  const linhagemM = macho.linhagem || ''
  const linhagemF = femea.linhagem || ''
  const bonusLinhagem = linhagemM && linhagemF && linhagemM !== linhagemF ? 10 : 0
  const total = Math.round(percentilMedio * 0.4 + espComum + penalConsang + provasBónus + bonusLinhagem)
  return { score: Math.min(100, Math.max(0, total)), consang, percentilMedio: Math.round(percentilMedio), espComum: espComum > 0 }
}

function ScoreBadge({ score }) {
  const cor = score >= 80 ? '#2DD4A7' : score >= 60 ? '#D4AF37' : score >= 40 ? '#4C8DFF' : '#f87171'
  const label = score >= 80 ? 'Excelente' : score >= 60 ? 'Bom' : score >= 40 ? 'Razoável' : 'Fraco'
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
      <div style={{ width:52, height:52, borderRadius:'50%', background:`conic-gradient(${cor} ${score*3.6}deg, #101F40 0deg)`, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ width:40, height:40, borderRadius:'50%', background:'#0B1830', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:900, color:cor }}>{score}</div>
      </div>
      <div style={{ fontSize:9, color:cor, fontWeight:600 }}>{label}</div>
    </div>
  )
}

export default function SeleccionadorCasais({ nav }) {
  const toast = useToast()
  const { temElite } = useLicenca()
  const [pombos, setPombos] = useState([])
  const [loading, setLoading] = useState(true)
  const [analisando, setAnalisando] = useState(false)
  const [sugestoes, setSugestoes] = useState([])
  const [analiseIA, setAnaliseIA] = useState(null)
  const [espAlvo, setEspAlvo] = useState('')
  const [topN, setTopN] = useState(10)
  const [pomboFixo, setPomboFixo] = useState('')
  const [detalhes, setDetalhes] = useState(null)
  const [maxConsang, setMaxConsang] = useState(100)

  useEffect(() => {
    db.getPombos().then(p => { setPombos(p); setLoading(false) }).catch(e => { toast('Erro: '+e.message,'err'); setLoading(false) })
  }, [])

  if (!temElite) return <BloqueioPlano plano="elite" nav={nav}/>

  const machos = pombos.filter(p=>p.sexo==='M'&&(!p.estado_ext||p.estado_ext==='proprio')&&p.estado==='ativo')
  const femeas = pombos.filter(p=>p.sexo==='F'&&(!p.estado_ext||p.estado_ext==='proprio')&&p.estado==='ativo')

  const calcularSugestoes = useCallback(() => {
    if (!machos.length || !femeas.length) { toast('Sem pombos activos suficientes','warn'); return }
    setAnalisando(true)
    setSugestoes([]); setAnaliseIA(null); setDetalhes(null)

    setTimeout(() => {
      const pares = []
      const machosAlvo = pomboFixo ? machos.filter(m=>m.id===pomboFixo) : machos
      machosAlvo.forEach(m => {
        femeas.forEach(f => {
          const { score, consang, percentilMedio, espComum } = calcScore(m, f, pombos, espAlvo)
          if (consang <= maxConsang) pares.push({ macho:m, femea:f, score, consang, percentilMedio, espComum })
        })
      })
      pares.sort((a,b)=>b.score-a.score)
      setSugestoes(pares.slice(0,topN))
      setAnalisando(false)
    }, 800)
  }, [machos, femeas, pombos, espAlvo, topN, pomboFixo, maxConsang])

  const analisarComIA = async (par) => {
    if (!temElite) return
    setDetalhes(par); setAnaliseIA(null)
    try {
      const prompt = `Analisa este cruzamento de pombos-correio para columbofilia portuguesa:

MACHO: ${par.macho.nome} (${par.macho.anilha})
- Especialidade: ${(par.macho.esp||[]).join(', ')||'N/D'}
- Linhagem: ${par.macho.linhagem||'N/D'}
- Cor: ${par.macho.cor||'N/D'}
- Provas: ${par.macho.provas||0} | Percentil: ${par.macho.percentil||0}%
- Pai: ${par.macho.pai||'N/D'} | Mãe: ${par.macho.mae||'N/D'}

FÊMEA: ${par.femea.nome} (${par.femea.anilha})
- Especialidade: ${(par.femea.esp||[]).join(', ')||'N/D'}
- Linhagem: ${par.femea.linhagem||'N/D'}
- Cor: ${par.femea.cor||'N/D'}
- Provas: ${par.femea.provas||0} | Percentil: ${par.femea.percentil||0}%
- Pai: ${par.femea.pai||'N/D'} | Mãe: ${par.femea.mae||'N/D'}

SCORE DO ALGORITMO: ${par.score}/100
CONSANGUINIDADE ESTIMADA: ${par.consang}%
PERCENTIL MÉDIO DO CASAL: ${par.percentilMedio}%
ESPECIALIDADE ALVO: ${espAlvo ? ESP_LABEL[espAlvo] : 'Nenhuma definida'}

Responde em português europeu, de forma concisa e prática (máx 200 palavras). Inclui:
1. Avaliação do cruzamento (potencial da descendência)
2. Riscos ou pontos de atenção
3. Recomendação final (recomendado / condicionado / não recomendado)
Não repitas os dados fornecidos.`

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1000, messages: [{ role:'user', content: prompt }] })
      })
      const data = await res.json()
      setAnaliseIA(data.content?.[0]?.text || 'Sem resposta da IA')
    } catch(e) { toast('Erro IA: '+e.message,'err') }
  }

  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:60}}><Spinner lg /></div>

  return (
    <div>
      <GuiaAuto modulo="casaisIA"/>

      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#050D1A,#0B1830)', border:'1px solid rgba(212,175,55,.2)', borderRadius:14, padding:'14px 16px', marginBottom:14, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#B8960C,#D4AF37,#B8960C)' }} />
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ fontSize:18, fontWeight:900, color:'#D4AF37', fontFamily:"'Fraunces',serif" }}>🧬 Seleccionador de Casais</div>
            <div style={{ fontSize:11, color:'#7A8699', marginTop:2 }}>Algoritmo + IA · Funcionalidade Elite</div>
          </div>
          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
            <BotaoGuia modulo="casaisIA"/>
            <div style={{ background:'rgba(212,175,55,.1)', border:'1px solid rgba(212,175,55,.3)', borderRadius:8, padding:'4px 10px', fontSize:10, color:'#D4AF37', fontWeight:700 }}>👑 ELITE</div>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginTop:12 }}>
          {[[machos.length,'♂ Machos','#4C8DFF'],[femeas.length,'♀ Fêmeas','#f87171'],[machos.length*femeas.length,'Pares possíveis','#2DD4A7']].map(([v,l,c])=>(
            <div key={l} style={{ textAlign:'center', padding:'6px', background:'rgba(255,255,255,.04)', borderRadius:8 }}>
              <div style={{ fontSize:18, fontWeight:700, color:c }}>{v}</div>
              <div style={{ fontSize:9, color:'#7A8699' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div className="card card-p" style={{ marginBottom:12 }}>
        <div style={{ fontWeight:600, color:'#fff', marginBottom:10, fontSize:13 }}>⚙️ Parâmetros de análise</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <div>
            <label style={{ fontSize:11, color:'#7A8699', display:'block', marginBottom:4 }}>Especialidade alvo</label>
            <select className="input" value={espAlvo} onChange={e=>setEspAlvo(e.target.value)}>
              <option value="">Todas</option>
              {ESPECIALIDADES.map(e=><option key={e} value={e}>{ESP_ICON[e]} {ESP_LABEL[e]}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:11, color:'#7A8699', display:'block', marginBottom:4 }}>Macho específico</label>
            <select className="input" value={pomboFixo} onChange={e=>setPomboFixo(e.target.value)}>
              <option value="">Todos os machos</option>
              {machos.map(m=><option key={m.id} value={m.id}>{m.nome} ({m.anilha})</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:11, color:'#7A8699', display:'block', marginBottom:4 }}>Consanguinidade máx.</label>
            <select className="input" value={maxConsang} onChange={e=>setMaxConsang(Number(e.target.value))}>
              <option value={100}>Sem limite</option>
              <option value={5}>≤ 5%</option>
              <option value={10}>≤ 10%</option>
              <option value={15}>≤ 15%</option>
              <option value={25}>≤ 25%</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize:11, color:'#7A8699', display:'block', marginBottom:4 }}>Top N sugestões</label>
            <select className="input" value={topN} onChange={e=>setTopN(Number(e.target.value))}>
              {[5,10,20,50].map(n=><option key={n} value={n}>Top {n}</option>)}
            </select>
          </div>
          <div className="col-2" style={{ gridColumn:'span 2' }}>
            <button className="btn btn-primary" style={{ width:'100%' }} onClick={calcularSugestoes} disabled={analisando}>
              {analisando ? <><Spinner /> A analisar...</> : '🧬 Calcular Sugestões'}
            </button>
          </div>
        </div>
      </div>

      {/* Resultados */}
      {analisando && (
        <div style={{ textAlign:'center', padding:40 }}>
          <div style={{ fontSize:32, marginBottom:12 }}>🧬</div>
          <div style={{ fontSize:14, color:'#D4AF37', fontWeight:600 }}>A analisar {machos.length * femeas.length} combinações...</div>
          <div style={{ fontSize:11, color:'#7A8699', marginTop:4 }}>Algoritmo a calcular percentis, consanguinidade e complementaridade</div>
        </div>
      )}

      {sugestoes.length > 0 && !analisando && (
        <div>
          <div style={{ fontSize:12, color:'#94a3b8', marginBottom:10 }}>
            {sugestoes.length} melhores pares · Toque em 🤖 para análise detalhada da IA
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {sugestoes.map((par, i) => (
              <div key={`${par.macho.id}-${par.femea.id}`} className="card card-p"
                style={{ borderLeft:`3px solid ${par.score>=80?'#2DD4A7':par.score>=60?'#D4AF37':par.score>=40?'#4C8DFF':'#f87171'}` }}>
                <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                  <div style={{ width:24, textAlign:'center', fontSize:i<3?20:13, flexShrink:0 }}>
                    {i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}.`}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap', marginBottom:4 }}>
                      <span style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{par.macho.nome}</span>
                      <span style={{ fontSize:11, color:'#475569' }}>×</span>
                      <span style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{par.femea.nome}</span>
                    </div>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      <span style={{ fontSize:10, color:'#4C8DFF' }}>♂ {par.macho.anilha}</span>
                      <span style={{ fontSize:10, color:'#f87171' }}>♀ {par.femea.anilha}</span>
                      <span style={{ fontSize:10, color:'#7A8699' }}>📊 Percentil médio: {par.percentilMedio}%</span>
                      <span style={{ fontSize:10, color:par.consang>15?'#f87171':par.consang>5?'#D4AF37':'#2DD4A7' }}>
                        🧬 Consang.: {par.consang}%
                      </span>
                      {par.espComum && <span style={{ fontSize:10, color:'#D4AF37' }}>⚡ Esp. compatível</span>}
                    </div>
                  </div>
                  <ScoreBadge score={par.score} />
                  <button onClick={() => analisarComIA(par)}
                    style={{ background:'rgba(212,175,55,.1)', border:'1px solid rgba(212,175,55,.3)', borderRadius:10, padding:'8px 10px', cursor:'pointer', fontSize:18 }}
                    title="Análise IA detalhada">🤖</button>
                </div>

                {detalhes === par && (
                  <div style={{ marginTop:12, borderTop:'1px solid #1B2D52', paddingTop:12 }}>
                    {!analiseIA ? (
                      <div style={{ display:'flex', alignItems:'center', gap:8, color:'#7A8699', fontSize:12 }}>
                        <Spinner /> A consultar IA...
                      </div>
                    ) : (
                      <div>
                        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                          <span style={{ fontSize:14 }}>🤖</span>
                          <span style={{ fontSize:11, fontWeight:600, color:'#D4AF37' }}>Análise IA — Claude Sonnet</span>
                        </div>
                        <div style={{ fontSize:12, color:'#cbd5e1', lineHeight:1.7, whiteSpace:'pre-wrap' }}>{analiseIA}</div>
                        <div style={{ marginTop:10, display:'flex', gap:6 }}>
                          <button className="btn btn-primary btn-sm" onClick={() => nav?.('reproducao')}>
                            🥚 Criar acasalamento
                          </button>
                          <button className="btn btn-secondary btn-sm" onClick={() => { setDetalhes(null); setAnaliseIA(null) }}>
                            Fechar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {sugestoes.length === 0 && !analisando && (
        <EmptyState icon="🧬" title="Configurar e calcular" desc={`${machos.length} machos e ${femeas.length} fêmeas disponíveis. Define os parâmetros e clica em Calcular.`} />
      )}
    </div>
  )
}
