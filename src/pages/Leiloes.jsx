import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useLicenca, BloqueioPlano } from '../hooks/useLicenca'
import { useToast, Spinner, Modal, Field, EmptyState } from '../components/ui'
import { useIdioma } from '../hooks/useIdioma'

// ── constantes ────────────────────────────────────────────────────────────────
const ESP_ICON = { velocidade:'⚡', 'meio-fundo':'🎯', fundo:'🏔️', 'grande-fundo':'🌍', meio_fundo:'🎯', grande_fundo:'🌍' }
const ESP_COR  = { velocidade:'#F59E0B', 'meio-fundo':'#3B82F6', fundo:'#10B981', 'grande-fundo':'#8B5CF6' }
const DURACOES = [['1','1 dia'],['3','3 dias'],['5','5 dias'],['7','7 dias'],['14','14 dias']]
const INCREMENTOS = [1,5,10,25,50,100]

const EMPTY = { nome:'', anilha:'', sexo:'M', cor:'', esp:[], provas:0, percentil:0, leilao_min:'', descricao:'', foto_url:'', duracao:'3', leilao_reserva:'' }

// ── helpers ───────────────────────────────────────────────────────────────────
function TempoRestante({ fim }) {
  const [resto, setResto] = useState('')
  useEffect(() => {
    const calc = () => {
      const diff = new Date(fim) - new Date()
      if (diff <= 0) { setResto('terminado'); return }
      const d=Math.floor(diff/86400000), h=Math.floor((diff%86400000)/3600000), m=Math.floor((diff%3600000)/60000)
      setResto(d>0?`${d}d ${h}h`:h>0?`${h}h ${m}m`:`${m}m`)
    }
    calc()
    const id = setInterval(calc, 30000)
    return () => clearInterval(id)
  }, [fim])
  const diff = new Date(fim) - new Date()
  if (diff <= 0) return <span style={{ color:'#475569', fontSize:11 }}>⏰ Encerrado</span>
  const urgente = diff < 3600000
  const muitoUrgente = diff < 600000
  return (
    <div style={{ textAlign:'center' }}>
      <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:900, color:muitoUrgente?'#f87171':urgente?'#D4AF37':'#2DD4A7' }}>{resto}</div>
      <div style={{ fontSize:9, color:'#475569', textTransform:'uppercase', letterSpacing:.5 }}>restante</div>
      {urgente && <div style={{ fontSize:9, color:muitoUrgente?'#f87171':'#D4AF37', marginTop:2 }}>{muitoUrgente?'🔥 A terminar!':'⚡ Última hora!'}</div>}
    </div>
  )
}

function BarraLances({ lances, total }) {
  if (!total || total === 0) return null
  const max = Math.max(...lances.map(l=>l.valor), 1)
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
      {lances.slice(0,3).map((l,i)=>(
        <div key={l.id||i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:11 }}>
          <span style={{ color:i===0?'#D4AF37':'#475569', width:16, textAlign:'center' }}>{i===0?'🥇':i===1?'2º':'3º'}</span>
          <span style={{ flex:1, color:i===0?'#fff':'#94a3b8', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.nome_licitante||'—'}</span>
          <div style={{ width:60, height:4, background:'#0B1830', borderRadius:2, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${(l.valor/max)*100}%`, background:i===0?'#D4AF37':'#334155', borderRadius:2 }}/>
          </div>
          <span style={{ color:i===0?'#D4AF37':'#7A8699', fontWeight:i===0?700:400, width:50, textAlign:'right' }}>{l.valor}€</span>
        </div>
      ))}
    </div>
  )
}

// ── componente principal ──────────────────────────────────────────────────────
export default function Leiloes({ nav }) {
  const { user }  = useAuth()
  const toast     = useToast()
  const { t }     = useIdioma()
  const { temPro } = useLicenca()

  const [leiloes, setLeiloes]         = useState([])
  const [meusLeiloes, setMeusLeiloes] = useState([])
  const [encerrados, setEncerrados]   = useState([])
  const [loading, setLoading]         = useState(true)
  const [tab, setTab]                 = useState('ativos')
  const [modal, setModal]             = useState(false)
  const [form, setForm]               = useState(EMPTY)
  const [saving, setSaving]           = useState(false)
  const [expandido, setExpandido]     = useState(null)
  const [licitacoes, setLicitacoes]   = useState({})
  const [valorLic, setValorLic]       = useState('')
  const [licitando, setLicitando]     = useState(false)
  const [filtroEsp, setFiltroEsp]     = useState('todos')
  const [ordenar, setOrdenar]         = useState('fim')
  const sf = (k,v) => setForm(f=>({...f,[k]:v}))

  // ── load ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const agora = new Date().toISOString()
      const [{ data:ativos },{ data:meus },{ data:enc }] = await Promise.all([
        supabase.from('marketplace').select('*').eq('tipo','leilao').gt('leilao_fim',agora).order('leilao_fim'),
        supabase.from('marketplace').select('*').eq('tipo','leilao').eq('user_id',user?.id).order('created_at',{ascending:false}),
        supabase.from('marketplace').select('*').eq('tipo','leilao').lte('leilao_fim',agora).order('leilao_fim',{ascending:false}).limit(20),
      ])
      setLeiloes(ativos||[]); setMeusLeiloes(meus||[]); setEncerrados(enc||[])
    } catch(e) { toast('Erro: '+e.message,'err') }
    finally { setLoading(false) }
  },[user?.id])
  useEffect(()=>{ load() },[load])

  // ── licitações ────────────────────────────────────────────────────────────
  const carregarLics = async (id) => {
    const { data } = await supabase.from('leilao_licitacoes').select('*').eq('anuncio_id',id).order('valor',{ascending:false}).limit(10)
    setLicitacoes(l=>({...l,[id]:data||[]}))
  }

  const toggleExpandido = (id) => {
    if (expandido === id) { setExpandido(null); return }
    setExpandido(id); carregarLics(id); setValorLic('')
  }

  const licitar = async (leilao) => {
    const val = parseFloat(valorLic)
    const minLance = Math.max(leilao.leilao_atual||0, leilao.leilao_min||0)+1
    if (!val||val<minLance) { toast(`Lance mínimo: ${minLance}€`,'warn'); return }
    setLicitando(true)
    try {
      await supabase.from('leilao_licitacoes').insert({ anuncio_id:leilao.id, user_id:user?.id, nome_licitante:user?.user_metadata?.nome||user?.email, valor:val })
      await supabase.from('marketplace').update({ leilao_atual:val, leilao_licitacoes:(leilao.leilao_licitacoes||0)+1 }).eq('id',leilao.id)
      toast(`🔨 Lance de ${val}€ registado!`,'ok')
      setValorLic(''); load(); carregarLics(leilao.id)
    } catch(e) { toast('Erro: '+e.message,'err') }
    finally { setLicitando(false) }
  }

  const criarLeilao = async () => {
    if (!form.nome.trim()||!form.leilao_min) { toast('Nome e lance mínimo obrigatórios','warn'); return }
    setSaving(true)
    try {
      const fim = new Date(Date.now()+parseInt(form.duracao)*24*3600000).toISOString()
      await supabase.from('marketplace').insert({
        ...form, user_id:user?.id, tipo:'leilao',
        leilao_fim:fim, leilao_fin:fim,
        leilao_min:parseFloat(form.leilao_min)||0,
        leilao_atual:parseFloat(form.leilao_min)||0,
        leilao_reserva:form.leilao_reserva?parseFloat(form.leilao_reserva):null,
        preco:parseFloat(form.leilao_min)||0,
        estado:'disponivel',
        autor_nome:user?.user_metadata?.nome||user?.email,
        provas:parseInt(form.provas)||0,
        percentil:parseFloat(form.percentil)||0,
      })
      toast('🔨 Leilão publicado!','ok'); setModal(false); setForm(EMPTY); load()
    } catch(e) { toast('Erro: '+e.message,'err') }
    finally { setSaving(false) }
  }

  // ── filtros/ordenação ─────────────────────────────────────────────────────
  const leiloesFiltrados = leiloes
    .filter(l=>filtroEsp==='todos'||(l.esp||[]).includes(filtroEsp))
    .sort((a,b)=>{
      if(ordenar==='fim') return new Date(a.leilao_fim)-new Date(b.leilao_fim)
      if(ordenar==='valor') return (b.leilao_atual||b.leilao_min||0)-(a.leilao_atual||a.leilao_min||0)
      if(ordenar==='lances') return (b.leilao_licitacoes||0)-(a.leilao_licitacoes||0)
      return 0
    })

  // verificar plano
  if (!temPro) return <BloqueioPlano plano="pro" nav={nav} />

  // ── render card de leilão ─────────────────────────────────────────────────
  const renderCard = (l, encerrado=false) => {
    const aberto = expandido === l.id
    const lanceAtual = l.leilao_atual||l.leilao_min||0
    const minLance = lanceAtual+1
    const lics = licitacoes[l.id]||[]
    const meuLance = lics.find(lc=>lc.user_id===user?.id)
    const estouAGanhar = lics[0]?.user_id === user?.id
    const isMinhaPublicacao = l.user_id === user?.id
    const diff = new Date(l.leilao_fim)-new Date()
    const urgente = diff>0&&diff<3600000

    return (
      <div key={l.id} style={{ background:'#0B1830', border:`1px solid ${urgente?'rgba(248,113,113,.35)':encerrado?'#162040':'rgba(212,175,55,.2)'}`, borderRadius:14, overflow:'hidden', transition:'border-color .2s' }}>
        {/* barra top */}
        <div style={{ height:2, background:encerrado?'#162040':urgente?'#f87171':'linear-gradient(90deg,#B8960C,#D4AF37)' }} />

        <div style={{ padding:'12px 14px' }}>
          {/* header */}
          <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
            {/* foto */}
            <div style={{ width:60, height:60, borderRadius:10, background:'#101F40', overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, border:'1px solid #1B2D52' }}>
              {l.foto_url?<img src={l.foto_url} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="" />:'🐦'}
            </div>
            {/* info */}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:3 }}>
                <span style={{ fontSize:14, fontWeight:700, color:'#fff' }}>{l.nome}</span>
                {l.sexo&&<span style={{ fontSize:11, color:'#7A8699' }}>{l.sexo==='M'?'♂':'♀'}</span>}
              </div>
              {l.anilha&&<div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:'#2DD4A7', marginBottom:3 }}>{l.anilha}</div>}
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:3 }}>
                {(l.esp||[]).map(e=><span key={e} style={{ fontSize:10, color:ESP_COR[e]||'#7A8699', background:`${ESP_COR[e]||'#7A8699'}15`, padding:'1px 6px', borderRadius:6 }}>{ESP_ICON[e]||'🐦'} {e}</span>)}
              </div>
              {(l.provas>0||l.percentil>0)&&(
                <div style={{ fontSize:10, color:'#7A8699' }}>
                  {l.provas>0&&`${l.provas} provas`}{l.provas>0&&l.percentil>0&&' · '}{l.percentil>0&&`${l.percentil}% percentil`}
                </div>
              )}
              <div style={{ fontSize:11, color:'#475569', marginTop:2 }}>por {l.autor_nome}</div>
            </div>
            {/* lance atual + tempo */}
            <div style={{ textAlign:'center', flexShrink:0, minWidth:70 }}>
              <div style={{ fontSize:9, color:'#7A8699', marginBottom:2 }}>Lance actual</div>
              <div style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:900, color:'#D4AF37', lineHeight:1 }}>{lanceAtual.toFixed(0)}€</div>
              <div style={{ fontSize:9, color:'#7A8699', marginBottom:6 }}>{l.leilao_licitacoes||0} lance(s)</div>
              {!encerrado&&<TempoRestante fim={l.leilao_fim} />}
              {encerrado&&<div style={{ fontSize:10, color:'#475569', fontStyle:'italic' }}>Encerrado</div>}
            </div>
          </div>

          {/* descrição */}
          {l.descricao&&(
            <div style={{ fontSize:11, color:'#7A8699', marginTop:8, lineHeight:1.5, borderTop:'1px solid #162040', paddingTop:8 }}>
              {l.descricao.slice(0,120)}{l.descricao.length>120?'…':''}
            </div>
          )}

          {/* badges */}
          <div style={{ display:'flex', gap:6, marginTop:8, flexWrap:'wrap' }}>
            {estouAGanhar&&!encerrado&&<span style={{ fontSize:10, fontWeight:700, color:'#2DD4A7', background:'rgba(45,212,167,.1)', padding:'2px 8px', borderRadius:8 }}>🏆 A ganhar</span>}
            {meuLance&&!estouAGanhar&&!encerrado&&<span style={{ fontSize:10, color:'#f87171', background:'rgba(248,113,113,.1)', padding:'2px 8px', borderRadius:8 }}>Superado — {meuLance.valor}€</span>}
            {isMinhaPublicacao&&<span style={{ fontSize:10, color:'#4C8DFF', background:'rgba(76,141,255,.1)', padding:'2px 8px', borderRadius:8 }}>📋 Meu leilão</span>}
            {urgente&&!encerrado&&<span style={{ fontSize:10, color:'#f87171', background:'rgba(248,113,113,.1)', padding:'2px 8px', borderRadius:8 }}>🔥 Última hora</span>}
          </div>

          {/* acções */}
          <div style={{ display:'flex', gap:6, marginTop:10, justifyContent:'flex-end', flexWrap:'wrap' }}>
            <button className="btn btn-secondary btn-sm" onClick={()=>toggleExpandido(l.id)}>
              {aberto?'▲ Fechar':'📋 Ver lances'}
            </button>
            {!encerrado&&!isMinhaPublicacao&&(
              <button className="btn btn-primary btn-sm" style={{ background:'linear-gradient(135deg,#B8960C,#D4AF37)', color:'#050D1A', border:'none', fontWeight:700 }}
                onClick={()=>{ toggleExpandido(l.id); setTimeout(()=>document.getElementById(`lic-${l.id}`)?.focus(),100) }}>
                🔨 Licitar
              </button>
            )}
          </div>
        </div>

        {/* painel expandido */}
        {aberto&&(
          <div style={{ borderTop:'1px solid #162040', background:'#070F1D', padding:'12px 14px' }}>
            {/* histórico de lances */}
            {lics.length>0?(
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#D4AF37', marginBottom:8 }}>Histórico de Lances</div>
                <BarraLances lances={lics} total={lics.length} />
              </div>
            ):(
              <div style={{ fontSize:11, color:'#475569', marginBottom:12, fontStyle:'italic' }}>Sem lances ainda — sê o primeiro!</div>
            )}

            {/* formulário de licitação */}
            {!encerrado&&!isMinhaPublicacao&&(
              <div>
                <div style={{ fontSize:11, fontWeight:600, color:'#fff', marginBottom:8 }}>Fazer Lance</div>
                <div style={{ display:'flex', gap:6, marginBottom:8 }}>
                  {INCREMENTOS.map(inc=>(
                    <button key={inc} onClick={()=>setValorLic(String(Math.max(minLance, parseFloat(valorLic||lanceAtual)+inc)))}
                      className="btn btn-secondary btn-sm" style={{ flex:1, fontSize:10 }}>+{inc}</button>
                  ))}
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <input id={`lic-${l.id}`} className="input" type="number" value={valorLic} onChange={e=>setValorLic(e.target.value)}
                    placeholder={`Mín. ${minLance}€`} style={{ flex:1 }} />
                  <button className="btn btn-primary" onClick={()=>licitar(l)} disabled={licitando}
                    style={{ background:'linear-gradient(135deg,#B8960C,#D4AF37)', color:'#050D1A', border:'none', fontWeight:700, flexShrink:0 }}>
                    {licitando?<Spinner/>:'🔨 Licitar'}
                  </button>
                </div>
                <div style={{ fontSize:10, color:'#475569', marginTop:4 }}>
                  Lance mínimo: <span style={{ color:'#D4AF37', fontWeight:600 }}>{minLance}€</span>
                  {l.leilao_reserva&&<span> · Preço de reserva: oculto</span>}
                </div>
              </div>
            )}
            {encerrado&&lics.length>0&&(
              <div style={{ padding:'8px 12px', background:'rgba(45,212,167,.07)', border:'1px solid rgba(45,212,167,.2)', borderRadius:8 }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#2DD4A7' }}>🏆 Vencedor: {lics[0].nome_licitante}</div>
                <div style={{ fontSize:11, color:'#7A8699', marginTop:2 }}>Lance final: <strong style={{ color:'#D4AF37' }}>{lics[0].valor}€</strong></div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#050D1A 0%,#0D1505 50%,#150D00 100%)', border:'1px solid rgba(212,175,55,.25)', borderRadius:14, padding:'16px', marginBottom:14, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#6B4F00,#D4AF37,#B8960C,#D4AF37,#6B4F00)' }} />
        <div style={{ position:'absolute', top:-30, right:-30, width:100, height:100, borderRadius:'50%', background:'radial-gradient(circle,rgba(212,175,55,.08),transparent)', pointerEvents:'none' }} />
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:900, color:'#D4AF37', marginBottom:3 }}>🔨 Leilões</div>
            <div style={{ fontSize:11, color:'#7A8699' }}>{leiloes.length} activo(s) · {encerrados.length} encerrado(s)</div>
          </div>
          <button onClick={()=>setModal(true)} style={{ background:'linear-gradient(135deg,#B8960C,#D4AF37)', color:'#050D1A', border:'none', borderRadius:10, padding:'10px 16px', cursor:'pointer', fontFamily:'inherit', fontWeight:700, fontSize:13 }}>
            🔨 Leiloar Pombo
          </button>
        </div>
        {/* stats rápidos */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginTop:12 }}>
          {[
            { v:leiloes.length, l:'Activos', cor:'#2DD4A7' },
            { v:leiloes.reduce((s,l)=>s+(l.leilao_licitacoes||0),0), l:'Lances hoje', cor:'#D4AF37' },
            { v:encerrados.length>0?(encerrados[0].leilao_atual||encerrados[0].leilao_min||0).toFixed(0)+'€':'—', l:'Último encerrado', cor:'#A855F7' },
          ].map(({v,l,cor})=>(
            <div key={l} style={{ textAlign:'center', background:'rgba(255,255,255,.04)', borderRadius:8, padding:'6px' }}>
              <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:900, color:cor }}>{v}</div>
              <div style={{ fontSize:9, color:'#475569' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:3, background:'#0A1628', borderRadius:10, padding:3, marginBottom:14 }}>
        {[['ativos',`🔨 Activos (${leiloes.length})`],['meus',`📋 Os meus (${meusLeiloes.length})`],['encerrados',`⏰ Encerrados`]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{ flex:1, padding:'8px 4px', borderRadius:8, fontSize:11, fontWeight:600, cursor:'pointer', border:'none', fontFamily:'inherit', whiteSpace:'nowrap', background:tab===k?'linear-gradient(135deg,#B8960C,#D4AF37)':'none', color:tab===k?'#050D1A':'#475569' }}>{l}</button>
        ))}
      </div>

      {/* filtros (só na tab ativos) */}
      {tab==='ativos'&&(
        <div style={{ display:'flex', gap:6, marginBottom:12, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ display:'flex', gap:4 }}>
            {[['todos','Todos'],['velocidade','⚡ Vel.'],['meio_fundo','🎯 MF'],['fundo','🏔️ Fundo'],['grande_fundo','🌍 GF']].map(([v,l])=>(
              <button key={v} onClick={()=>setFiltroEsp(v)} className={`chip${filtroEsp===v?' active':''}`} style={{ fontSize:10 }}>{l}</button>
            ))}
          </div>
          <select value={ordenar} onChange={e=>setOrdenar(e.target.value)} className="input" style={{ fontSize:11, padding:'4px 8px', borderRadius:8, marginLeft:'auto', width:'auto' }}>
            <option value="fim">A terminar</option>
            <option value="valor">Maior lance</option>
            <option value="lances">Mais lances</option>
          </select>
        </div>
      )}

      {loading?<div style={{ display:'flex', justifyContent:'center', padding:40 }}><Spinner lg /></div>:(
        <>
          {tab==='ativos'&&(
            leiloesFiltrados.length===0
              ?<EmptyState icon="🔨" title="Sem leilões activos" desc="Sê o primeiro a leiloar um pombo!" action={<button className="btn btn-primary" onClick={()=>setModal(true)}>+ Criar leilão</button>} />
              :<div style={{ display:'flex', flexDirection:'column', gap:10 }}>{leiloesFiltrados.map(l=>renderCard(l))}</div>
          )}
          {tab==='meus'&&(
            meusLeiloes.length===0
              ?<EmptyState icon="🔨" title="Sem leilões criados" desc="Leiloa um pombo para começar" action={<button className="btn btn-primary" onClick={()=>setModal(true)}>+ Leiloar</button>} />
              :<div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {meusLeiloes.map(l=>{
                    const activo=new Date(l.leilao_fim)>new Date()
                    return renderCard(l, !activo)
                  })}
                </div>
          )}
          {tab==='encerrados'&&(
            encerrados.length===0
              ?<EmptyState icon="⏰" title="Sem leilões encerrados" desc="Os leilões terminados aparecerão aqui" />
              :<div style={{ display:'flex', flexDirection:'column', gap:10 }}>{encerrados.map(l=>renderCard(l,true))}</div>
          )}
        </>
      )}

      {/* ══ MODAL CRIAR LEILÃO ══════════════════════════════════════════════ */}
      <Modal open={modal} onClose={()=>{setModal(false);setForm(EMPTY)}} title="🔨 Criar Leilão" wide
        footer={
          <><button className="btn btn-secondary" onClick={()=>setModal(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={criarLeilao} disabled={saving}
            style={{ background:'linear-gradient(135deg,#B8960C,#D4AF37)', color:'#050D1A', border:'none', fontWeight:700 }}>
            {saving?<Spinner/>:null}🔨 Publicar Leilão
          </button></>
        }>
        <div style={{ marginBottom:14, padding:'10px 12px', background:'rgba(212,175,55,.06)', border:'1px solid rgba(212,175,55,.15)', borderRadius:8, fontSize:12, color:'#94a3b8', lineHeight:1.6 }}>
          🔨 O leilão termina automaticamente após a duração definida. O lance mais alto vence. Se definires preço de reserva, o pombo só é vendido se o lance ultrapassar esse valor (o comprador não vê o valor de reserva).
        </div>
        <div className="form-grid">
          <div className="col-2"><Field label="Nome do pombo *"><input className="input" value={form.nome} onChange={e=>sf('nome',e.target.value)} placeholder="Ex: Relâmpago" /></Field></div>
          <Field label="Anilha"><input className="input" value={form.anilha} onChange={e=>sf('anilha',e.target.value)} placeholder="PT-2024-00001" /></Field>
          <Field label="Sexo"><select className="input" value={form.sexo} onChange={e=>sf('sexo',e.target.value)}><option value="M">♂ Macho</option><option value="F">♀ Fêmea</option></select></Field>
          <Field label="Lance mínimo (€) *"><input className="input" type="number" value={form.leilao_min} onChange={e=>sf('leilao_min',e.target.value)} placeholder="Ex: 50" /></Field>
          <Field label="Preço de reserva (€)">
            <input className="input" type="number" value={form.leilao_reserva} onChange={e=>sf('leilao_reserva',e.target.value)} placeholder="Oculto para compradores" />
            <div style={{ fontSize:10, color:'#475569', marginTop:2 }}>Só vendes se este valor for atingido</div>
          </Field>
          <Field label="Duração"><select className="input" value={form.duracao} onChange={e=>sf('duracao',e.target.value)}>{DURACOES.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></Field>
          <Field label="Provas"><input className="input" type="number" value={form.provas} onChange={e=>sf('provas',e.target.value)} placeholder="0" /></Field>
          <Field label="Percentil (%)"><input className="input" type="number" value={form.percentil} onChange={e=>sf('percentil',e.target.value)} placeholder="0" /></Field>
          <Field label="Cor"><input className="input" value={form.cor} onChange={e=>sf('cor',e.target.value)} placeholder="Ex: Azul barrado" /></Field>
          <Field label="URL Foto"><input className="input" value={form.foto_url} onChange={e=>sf('foto_url',e.target.value)} placeholder="https://..." /></Field>
          <div className="col-2">
            <Field label="Especialidades">
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:4 }}>
                {[['velocidade','⚡ Velocidade'],['meio_fundo','🎯 Meio-Fundo'],['fundo','🏔️ Fundo'],['grande_fundo','🌍 Grande Fundo']].map(([v,l])=>(
                  <button key={v} type="button" className={`chip${(form.esp||[]).includes(v)?' active':''}`} onClick={()=>sf('esp',(form.esp||[]).includes(v)?(form.esp||[]).filter(x=>x!==v):[...(form.esp||[]),v])}>{l}</button>
                ))}
              </div>
            </Field>
          </div>
          <div className="col-2"><Field label="Descrição"><textarea className="input" rows={3} style={{resize:'none'}} value={form.descricao} onChange={e=>sf('descricao',e.target.value)} placeholder="Descreve o pombo, linhagem, historial de provas, pontos fortes..." /></Field></div>
        </div>
      </Modal>
    </div>
  )
}
