// src/modules/virtualLoft/index.jsx — V2 Ecrã de entrada + gestão de carreiras
import { useState, useEffect } from 'react'
import CarreiraCreate from './screens/CarreiraCreate'
import HubPombal from './screens/HubPombal'
import { gerarPlantelInicial } from './engine/genetics'

const ADMIN_UUID = '30709f29-152e-4813-ac7f-e3376c5e0646'
const STORAGE_KEY = 'vl_carreira'
const SUPA_URL = 'https://tgqnbheetpgnpjsjphoj.supabase.co'
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRncW5iaGVldHBnbnBqc2pwaG9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NTk0NDIsImV4cCI6MjA5MjAzNTQ0Mn0.32ZjOUB-bOAIgtwwpKDVRSJy1w4xlOR7IMb4bRTK3Uo'
// Token JWT do utilizador autenticado — necessário para o RLS permitir ler/escrever
function getAuthToken() {
  try {
    const keys = Object.keys(localStorage).filter(k => k.includes('supabase.auth.token') || k.includes('sb-'))
    for (const k of keys) {
      const val = JSON.parse(localStorage.getItem(k) || '{}')
      const token = val?.access_token || val?.currentSession?.access_token
      if (token) return token
    }
  } catch {}
  return null
}
function HDRS() {
  const t = getAuthToken()
  return { 'apikey': SUPA_KEY, 'Authorization': `Bearer ${t || SUPA_KEY}`, 'Content-Type': 'application/json' }
}

function lerLS() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) } catch { return null } }
function gravarLS(d) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)) } catch {} }

async function guardarNuvem(userId, carreira) {
  try {
    const payload = { user_id: userId, dados: carreira, nome_pombal: carreira.nomePombal, epoca: carreira.epoca||1, dia: carreira.dia||1, updated_at: new Date().toISOString() }
    await fetch(`${SUPA_URL}/rest/v1/vl_carreiras`, { method:'POST', headers:{...HDRS(),'Prefer':'resolution=merge-duplicates'}, body: JSON.stringify(payload) })
    return true
  } catch { return false }
}

async function carregarNuvem(userId) {
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/vl_carreiras?user_id=eq.${userId}&select=dados,updated_at,nome_pombal,epoca,dia`, { headers: HDRS() })
    const d = await r.json()
    return d?.[0] || null
  } catch { return null }
}

const T = { bg:'#050A14', surface:'#0D1829', s2:'#1A2A45', gold:'#C9A84C', blue:'#4FC3F7', text:'#E8EDF5', muted:'#6B7A99', success:'#2DD4A7', danger:'#F87171', purple:'#A855F7' }

// ── Ecrã de Entrada ───────────────────────────────────────────────────────────
function EcrãEntrada({ onNovaCarreira, onCarregarLocal, onCarregarNuvem, carreiraLocal, dadosNuvem, carregandoNuvem }) {
  const [tab, setTab] = useState(carreiraLocal ? 'carreiras' : 'novo')

  return (
    <div style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:"system-ui,sans-serif", display:'flex', flexDirection:'column' }}>
      {/* Hero */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 24px 20px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'20%', left:'50%', transform:'translateX(-50%)', width:300, height:200, background:'radial-gradient(ellipse,rgba(201,168,76,.1),transparent)', pointerEvents:'none' }}/>
        <div style={{ fontSize:64, marginBottom:16, filter:'drop-shadow(0 0 20px rgba(201,168,76,.4))' }}>🕊️</div>
        <div style={{ fontFamily:"Georgia,serif", fontSize:28, fontWeight:900, color:T.text, letterSpacing:-.5, marginBottom:4 }}>
          Fly2Win <span style={{ color:T.gold }}>Manager</span>
        </div>
        <div style={{ fontSize:11, color:T.muted, letterSpacing:3, marginBottom:32, textTransform:'uppercase' }}>Conquer the Skies</div>

        {/* Tabs */}
        <div style={{ width:'100%', maxWidth:400 }}>
          <div style={{ display:'flex', gap:6, marginBottom:16 }}>
            {(carreiraLocal||dadosNuvem) && [['carreiras','🎮 Carreiras'],['novo','➕ Nova']].map(([id,label])=>(
              <button key={id} onClick={()=>setTab(id)}
                style={{ flex:1, padding:'10px', borderRadius:10, border:tab===id?'none':`1px solid ${T.s2}`, background:tab===id?`linear-gradient(135deg,${T.gold},#A07830)`:'transparent', color:tab===id?'#050A14':T.muted, fontSize:12, fontWeight:tab===id?700:400, cursor:'pointer', fontFamily:'inherit' }}>
                {label}
              </button>
            ))}
            {!carreiraLocal&&!dadosNuvem&&<div style={{ fontSize:12, color:T.muted, textAlign:'center', width:'100%', padding:'8px 0' }}>Começa a tua primeira carreira abaixo</div>}
          </div>

          {/* CARREIRAS GUARDADAS */}
          {tab==='carreiras'&&(
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {/* Local */}
              {carreiraLocal&&(
                <div style={{ background:T.surface, border:`1px solid ${T.gold}25`, borderRadius:16, padding:'16px', position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${T.gold},transparent)` }}/>
                  <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:12 }}>
                    <div style={{ fontSize:32 }}>{carreiraLocal.logotipo||'🕊️'}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:"Georgia,serif", fontSize:16, fontWeight:900, color:T.text }}>{carreiraLocal.nomePombal}</div>
                      <div style={{ fontSize:10, color:T.muted }}>{carreiraLocal.nomeGestor}</div>
                    </div>
                    <div style={{ fontSize:9, color:T.gold, background:`${T.gold}15`, padding:'3px 8px', borderRadius:5, fontWeight:700 }}>💾 LOCAL</div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, marginBottom:12 }}>
                    {[
                      { l:'Época', v:carreiraLocal.epoca||1, c:T.purple },
                      { l:'Dia', v:carreiraLocal.dia||1, c:T.blue },
                      { l:'Orçamento', v:`${Math.round((carreiraLocal.orcamento||0)/1000)}k€`, c:T.gold },
                    ].map((s,i)=>(
                      <div key={i} style={{ background:T.s2, borderRadius:8, padding:'8px', textAlign:'center' }}>
                        <div style={{ fontFamily:"Georgia,serif", fontSize:15, fontWeight:900, color:s.c }}>{s.v}</div>
                        <div style={{ fontSize:7, color:T.muted, fontWeight:700 }}>{s.l}</div>
                      </div>
                    ))}
                  </div>
                  <button onClick={onCarregarLocal}
                    style={{ width:'100%', padding:'13px', borderRadius:10, border:'none', background:`linear-gradient(135deg,${T.gold},#A07830)`, color:'#050A14', fontSize:13, fontWeight:800, cursor:'pointer', fontFamily:'inherit', boxShadow:`0 4px 16px ${T.gold}30` }}>
                    🎮 Continuar Carreira
                  </button>
                </div>
              )}

              {/* Nuvem */}
              <div style={{ background:T.surface, border:`1px solid ${T.blue}20`, borderRadius:14, padding:'14px', position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${T.blue}60,transparent)` }}/>
                <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:10 }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:`${T.blue}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>☁️</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:T.text }}>Carreira na Nuvem</div>
                    <div style={{ fontSize:9, color:T.muted }}>{carregandoNuvem?'A verificar...' : dadosNuvem ? `${dadosNuvem.nome_pombal} · Época ${dadosNuvem.epoca} · Dia ${dadosNuvem.dia}` : 'Sem carreira guardada'}</div>
                  </div>
                  <div style={{ fontSize:9, color:T.blue, background:`${T.blue}15`, padding:'3px 8px', borderRadius:5, fontWeight:700 }}>☁️ NUVEM</div>
                </div>
                {dadosNuvem&&(
                  <button onClick={onCarregarNuvem}
                    style={{ width:'100%', padding:'11px', borderRadius:9, border:'none', background:`linear-gradient(135deg,${T.blue},#0284C7)`, color:'#050A14', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                    📥 Carregar da Nuvem
                  </button>
                )}
                {!dadosNuvem&&!carregandoNuvem&&(
                  <div style={{ fontSize:10, color:T.muted, textAlign:'center', padding:'6px 0' }}>Guarda a tua carreira para aceder em qualquer dispositivo</div>
                )}
              </div>

              <button onClick={()=>setTab('novo')}
                style={{ width:'100%', padding:'11px', borderRadius:10, border:`1px solid ${T.s2}`, background:'transparent', color:T.muted, fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
                ➕ Criar nova carreira
              </button>
            </div>
          )}

          {/* NOVA CARREIRA */}
          {(tab==='novo'||(!carreiraLocal&&!dadosNuvem))&&(
            <button onClick={onNovaCarreira}
              style={{ width:'100%', padding:'16px', borderRadius:12, border:'none', background:`linear-gradient(135deg,${T.purple},#7C3AED)`, color:'#fff', fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'inherit', boxShadow:`0 4px 20px ${T.purple}30` }}>
              🚀 Começar Nova Carreira
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding:'16px', textAlign:'center' }}>
        <div style={{ fontSize:9, color:T.s2, letterSpacing:1 }}>FLY2WIN MANAGER · BETA</div>
      </div>
    </div>
  )
}

// ── App principal ─────────────────────────────────────────────────────────────
export default function VirtualLoftApp({ user, idiomaApp = 'pt' }) {
  if (user?.id !== ADMIN_UUID) return null

  const [fase, setFase] = useState('entrada') // 'entrada' | 'criar' | 'jogo'
  const [carreira, setCarreira] = useState(null)
  const [dadosNuvem, setDadosNuvem] = useState(null)
  const [carregandoNuvem, setCarregandoNuvem] = useState(true)

  const carreiraLocal = lerLS()
  const idioma = carreira?.idioma || idiomaApp

  // Carregar info da nuvem ao iniciar
  useEffect(() => {
    if (!user?.id) return
    carregarNuvem(user.id).then(d => {
      setDadosNuvem(d)
      setCarregandoNuvem(false)
    })
  }, [user?.id])

  const salvar = (dados) => {
    gravarLS(dados)
    setCarreira({ ...dados })
    // Auto-save nuvem (debounced no HubPombal)
  }

  const handleCriar = (form) => {
    const ORCAMENTOS = { jovem:2500, amador:8000, profissional:25000, lenda:100000 }
    const MULT = { facil:1.5, normal:1.0, dificil:0.7, lenda:0.5 }
    const nova = {
      id: `c_${Date.now()}`,
      nomePombal: form.nomePombal,
      nomeGestor: form.nomeGestor,
      pais: form.pais,
      idioma: form.idioma || idiomaApp,
      dificuldade: form.dificuldade,
      tipoInicio: form.tipoInicio,
      logotipo: form.logotipo || '🕊️',
      orcamento: Math.round((ORCAMENTOS[form.tipoInicio]||8000) * (MULT[form.dificuldade]||1)),
      reputacao: form.tipoInicio==='lenda'?80:form.tipoInicio==='profissional'?40:form.tipoInicio==='amador'?20:5,
      nivel_reputacao: form.tipoInicio==='lenda'?'nacional':form.tipoInicio==='profissional'?'regional':'local',
      epoca: 1, semana: 1, dia: 1,
      pombos: gerarPlantelInicial(form.tipoInicio, form.idioma||idiomaApp),
      staff: [], estruturas: {}, movimentos: [],
      patrocinios: [], hall_of_fame: [], objectivos_concluidos: [],
      historico_provas: [], ninhadas_virtuais: [], conquistas: [],
    }
    salvar(nova)
    guardarNuvem(user.id, nova)
    setFase('jogo')
  }

  const handleCarregarLocal = () => {
    const c = lerLS()
    if (c) { setCarreira(c); setFase('jogo') }
  }

  const handleCarregarNuvem = async () => {
    const d = await carregarNuvem(user.id)
    if (d?.dados) {
      gravarLS(d.dados)
      setCarreira(d.dados)
      setFase('jogo')
    }
  }

  const handleApagar = () => {
    localStorage.removeItem(STORAGE_KEY)
    setCarreira(null)
    setFase('entrada')
  }

  // Render
  if (fase==='entrada') {
    return (
      <EcrãEntrada
        onNovaCarreira={() => setFase('criar')}
        onCarregarLocal={handleCarregarLocal}
        onCarregarNuvem={handleCarregarNuvem}
        carreiraLocal={carreiraLocal}
        dadosNuvem={dadosNuvem}
        carregandoNuvem={carregandoNuvem}
      />
    )
  }

  if (fase==='criar') {
    return <CarreiraCreate onCriar={handleCriar} onVoltar={()=>setFase('entrada')} idiomaApp={idiomaApp} userId={user?.id} />
  }

  return (
    <HubPombal
      carreira={carreira}
      onApagarCarreira={handleApagar}
      onGuardar={salvar}
      idioma={idioma}
      userId={user?.id}
    />
  )
}
