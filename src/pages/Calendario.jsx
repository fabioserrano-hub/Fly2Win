import { useState, useEffect, useCallback } from 'react'
import { db } from '../lib/supabase'
import { useToast, Spinner, Modal, EmptyState, Field, Badge } from '../components/ui'
import { useIdioma } from '../hooks/useIdioma'
import { GuiaAuto, BotaoGuia } from '../components/GuiaModulo'

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const DIAS_SEMANA_S = ['D','S','T','Q','Q','S','S']
const EMPTY = { titulo:'', data_ev:new Date().toISOString().slice(0,10), tipo:'Outro', obs:'' }
const tipoCor = { 'Prova':'#D4AF37','Treino':'#4C8DFF','Tarefa':'#2DD4A7','Reprodução':'#c084fc','Coletivo':'#fb923c','Outro':'#94a3b8' }
const tipoIcon = { 'Prova':'🏆','Treino':'🎯','Tarefa':'✅','Reprodução':'🥚','Coletivo':'📅','Outro':'📌' }

const PROVAS_FPC_2026 = [
  { id:'fpc-1', titulo:'FPC — Abertura Época', data:'2026-03-14', tipo:'Coletivo', dist:150 },
  { id:'fpc-2', titulo:'FPC — 1ª Velocidade', data:'2026-03-28', tipo:'Coletivo', dist:250 },
  { id:'fpc-3', titulo:'FPC — 2ª Velocidade', data:'2026-04-11', tipo:'Coletivo', dist:300 },
  { id:'fpc-4', titulo:'FPC — 1ª Meio-Fundo', data:'2026-04-25', tipo:'Coletivo', dist:450 },
  { id:'fpc-5', titulo:'FPC — 2ª Meio-Fundo', data:'2026-05-09', tipo:'Coletivo', dist:500 },
  { id:'fpc-6', titulo:'FPC — 1ª Fundo', data:'2026-05-23', tipo:'Coletivo', dist:650 },
  { id:'fpc-7', titulo:'FPC — Nacional Velocidade', data:'2026-06-06', tipo:'Coletivo', dist:350 },
  { id:'fpc-8', titulo:'FPC — 2ª Fundo', data:'2026-06-20', tipo:'Coletivo', dist:700 },
  { id:'fpc-9', titulo:'FPC — Grande Fundo', data:'2026-07-04', tipo:'Coletivo', dist:900 },
  { id:'fpc-10', titulo:'FPC — Nacional Fundo', data:'2026-07-18', tipo:'Coletivo', dist:800 },
  { id:'fpc-11', titulo:'FPC — Encerramento Época', data:'2026-08-01', tipo:'Coletivo', dist:500 },
]

function parseCSV(text) {
  const linhas = text.split(/\r?\n/).filter(l=>l.trim())
  if (linhas.length===0) return { headers:[], rows:[] }
  const sep = linhas[0].includes(';')?';':','
  const split = (l) => l.split(sep).map(c=>c.trim().replace(/^"(.*)"$/,'$1'))
  return { headers:split(linhas[0]), rows:linhas.slice(1).map(split) }
}
function normalizarData(str) {
  if (!str) return null
  str=str.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
  const m=str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`
  return null
}
function extrairDistancia(str) {
  if (!str) return null
  const m=str.match(/[\d.,]+/)
  if (!m) return null
  return parseFloat(m[0].replace(',','.'))
}
function mapearEspecialidade(str) {
  if (!str) return 'Velocidade'
  const s=str.toLowerCase().trim()
  if (s.includes('grande fundo')) return 'Grande Fundo'
  if (s.includes('meio fundo')||s.includes('meio-fundo')) return 'Meio-Fundo'
  if (s.includes('fundo')) return 'Fundo'
  return 'Velocidade'
}

function getDiasDoMes(ano, mes) {
  const primeiro = new Date(ano,mes,1).getDay()
  const total = new Date(ano,mes+1,0).getDate()
  const dias = []
  for (let i=0;i<primeiro;i++) dias.push(null)
  for (let d=1;d<=total;d++) dias.push(d)
  return dias
}

function getDiasSemana(dataBase) {
  const d = new Date(dataBase)
  const diaSemana = d.getDay()
  const inicio = new Date(d)
  inicio.setDate(d.getDate()-diaSemana)
  const dias = []
  for (let i=0;i<7;i++) {
    const dd = new Date(inicio)
    dd.setDate(inicio.getDate()+i)
    dias.push(dd.toISOString().slice(0,10))
  }
  return dias
}

export default function Calendario({ nav }) {
  const toast = useToast()
  const { t } = useIdioma()
  const [mesAtual, setMesAtual] = useState(new Date())
  const [vista, setVista] = useState('mes') // mes | semana | lista
  const [provas, setProvas] = useState([])
  const [treinos, setTreinos] = useState([])
  const [tarefas, setTarefas] = useState([])
  const [eventos, setEventos] = useState([])
  const [acasalamentos, setAcasalamentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [diaSelecionado, setDiaSelecionado] = useState(null)
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [modalImport, setModalImport] = useState(false)
  const [csvData, setCsvData] = useState(null)
  const [mapeamento, setMapeamento] = useState({nome:'',data:'',dist:'',local:'',especialidade:''})
  const [importando, setImportando] = useState(false)
  const [mostrarColetivas, setMostrarColetivas] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const sf = (k,v) => setForm(f=>({...f,[k]:v}))

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [p,tr,tf,ev,ac] = await Promise.all([db.getProvas(),db.getTreinos(),db.getTarefas(),db.getEventosCal(),db.getAcasalamentos()])
      setProvas(p); setTreinos(tr); setTarefas(tf); setEventos(ev); setAcasalamentos(ac)
    } catch(e) { toast('Erro: '+e.message,'err') }
    finally { setLoading(false) }
  },[])
  useEffect(()=>{ load() },[load])

  const todosEventos = [
    ...provas.map(p=>({ id:'prova-'+p.id, titulo:p.nome, data:p.data_reg?.slice(0,10), tipo:'Prova', origem:p })),
    ...treinos.map(t=>({ id:'treino-'+t.id, titulo:t.local, data:t.data?.slice(0,10)||t.data_reg?.slice(0,10), tipo:'Treino', origem:t })),
    ...tarefas.filter(t=>t.data_prevista).map(t=>({ id:'tarefa-'+t.id, titulo:t.titulo, data:t.data_prevista, tipo:'Tarefa', origem:t, concluida:t.estado==='concluida' })),
    ...eventos.map(e=>({ id:'evento-'+e.id, titulo:e.titulo, data:e.data_ev?.slice(0,10), tipo:e.tipo||'Outro', origem:e, manual:true })),
    ...acasalamentos.filter(a=>a.data_eclosao_prev&&a.estado==='em_progresso').map(a=>({ id:'eclosao-'+a.id, titulo:`🐣 ${a.pai_nome?.split(' ')[0]} × ${a.mae_nome?.split(' ')[0]}`, data:a.data_eclosao_prev?.slice(0,10), tipo:'Reprodução', origem:a })),
    ...acasalamentos.filter(a=>a.data_postura&&a.estado==='em_progresso').map(a=>({ id:'postura-'+a.id, titulo:`🥚 Postura: ${a.pai_nome?.split(' ')[0]} × ${a.mae_nome?.split(' ')[0]}`, data:a.data_postura?.slice(0,10), tipo:'Reprodução', origem:a })),
    ...(mostrarColetivas?PROVAS_FPC_2026.map(p=>({...p,tipo:'Coletivo'})):[]),
  ].filter(e=>e.data && (filtroTipo==='todos'||e.tipo===filtroTipo))

  const ano = mesAtual.getFullYear(), mes = mesAtual.getMonth()
  const hojeStr = new Date().toISOString().slice(0,10)
  const diasMes = getDiasSemana ? getDiasSemana : null
  const diasArray = getDiasDoMes(ano, mes)
  const diasSemana = getDiasSemana(diaSelecionado||hojeStr)

  const eventosNoDia = (dataStr) => todosEventos.filter(e=>e.data===dataStr)
  const mudarMes = (d) => setMesAtual(new Date(ano,mes+d,1))

  const diasProximos = 30
  const proximasProvas = provas.filter(p=>p.data_reg>=hojeStr).sort((a,b)=>a.data_reg.localeCompare(b.data_reg))
  const diasParaProximaProva = proximasProvas[0] ? Math.ceil((new Date(proximasProvas[0].data_reg)-new Date(hojeStr))/86400000) : null

  const save = async () => {
    if (!form.titulo.trim()) { toast('Título obrigatório','warn'); return }
    setSaving(true)
    try {
      await db.createEventoCal({ titulo:form.titulo.trim(), data_ev:form.data_ev, tipo:form.tipo, obs:form.obs })
      toast('Evento criado!','ok'); setModal(false); load()
    } catch(e) { toast('Erro: '+e.message,'err') }
    finally { setSaving(false) }
  }

  const toggleTarefaConcluida = async (ev) => {
    try {
      await db.updateTarefa(ev.origem.id,{estado:ev.concluida?'por_iniciar':'concluida'})
      toast(ev.concluida?'Reaberta':'Concluída ✓','ok'); load()
    } catch(e) { toast('Erro: '+e.message,'err') }
  }

  const exportarIcal = () => {
    const linhas = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Fly2Win//PT']
    todosEventos.forEach(e=>{
      linhas.push('BEGIN:VEVENT')
      linhas.push('DTSTART;VALUE=DATE:'+e.data.replace(/-/g,''))
      linhas.push('SUMMARY:'+e.titulo)
      linhas.push('DESCRIPTION:'+e.tipo)
      linhas.push('END:VEVENT')
    })
    linhas.push('END:VCALENDAR')
    const blob = new Blob([linhas.join('\r\n')],{type:'text/calendar'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href=url; a.download='fly2win-calendario.ics'; a.click()
    toast('Calendário exportado!','ok')
  }

  const lerFicheiroCSV = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const parsed = parseCSV(e.target.result)
      if (parsed.headers.length===0) { toast('Ficheiro vazio','err'); return }
      setCsvData(parsed)
      const find = (...ts) => parsed.headers.find(h=>ts.some(t=>h.toLowerCase().includes(t)))
      setMapeamento({nome:find('prova','concurso','nome')||parsed.headers[0]||'',data:find('data')||'',dist:find('dist','km')||'',local:find('local','solta','largada')||'',especialidade:find('especialidade','tipo','categoria')||''})
    }
    reader.readAsText(file)
  }

  const linhasValidas = csvData&&mapeamento.data
    ? csvData.rows.map(r=>{ const obj={}; csvData.headers.forEach((h,i)=>obj[h]=r[i]); return obj }).filter(r=>normalizarData(r[mapeamento.data]))
    : []

  const confirmarImportacao = async () => {
    if (linhasValidas.length===0) { toast('Nenhuma linha válida','warn'); return }
    setImportando(true)
    try {
      let criadas=0
      for (const linha of linhasValidas) {
        await db.createProva({ nome:linha[mapeamento.nome]||'Prova FCP', data_reg:normalizarData(linha[mapeamento.data]), dist:mapeamento.dist?extrairDistancia(linha[mapeamento.dist]):null, local_solta:mapeamento.local?linha[mapeamento.local]:null, tipo:mapeamento.especialidade?mapearEspecialidade(linha[mapeamento.especialidade]):'Velocidade', origem:'fcp_csv' })
        criadas++
      }
      toast(`${criadas} prova(s) importada(s)!`,'ok'); setModalImport(false); setCsvData(null); load()
    } catch(e) { toast('Erro: '+e.message,'err') }
    finally { setImportando(false) }
  }

  const proximosEventos = todosEventos.filter(e=>e.data>=hojeStr&&!e.concluida).sort((a,b)=>a.data.localeCompare(b.data)).slice(0,8)

  const EventoItem = ({ e, compact }) => (
    <div style={{ display:'flex', alignItems:'center', gap:8, padding:compact?'5px 8px':'8px 10px', background:'#101F40', borderRadius:8, borderLeft:`3px solid ${tipoCor[e.tipo]||'#94a3b8'}` }}>
      {e.tipo==='Tarefa'?(
        <button onClick={()=>toggleTarefaConcluida(e)} style={{ width:18,height:18,borderRadius:5,border:e.concluida?'none':'2px solid #1B2D52',background:e.concluida?'#2DD4A7':'transparent',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0,padding:0,fontSize:11 }}>
          {e.concluida&&'✓'}
        </button>
      ):<span style={{ fontSize:14, flexShrink:0 }}>{tipoIcon[e.tipo]}</span>}
      <span style={{ flex:1, fontSize:compact?11:13, color:e.concluida?'#7A8699':'#fff', textDecoration:e.concluida?'line-through':'none' }}>{e.titulo}</span>
      {!compact&&<Badge v="gray">{e.tipo}</Badge>}
    </div>
  )

  return (
    <div>
      <GuiaAuto modulo="calendario"/>

      {/* Header premium */}
      <div style={{ background:'linear-gradient(135deg,#050D1A,#0B1830)', border:'1px solid rgba(212,175,55,.2)', borderRadius:14, padding:'14px 18px', marginBottom:14, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#B8960C,#D4AF37,#B8960C)' }}/>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
          <div>
            <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:900, color:'#fff', display:'flex', alignItems:'center', gap:8 }}>
              📅 Calendário
            </div>
            <div style={{ fontSize:11, color:'#7A8699', marginTop:2 }}>
              {MESES[mes]} {ano}
              {diasParaProximaProva!==null&&<span style={{ marginLeft:8, color:'#D4AF37', fontWeight:600 }}>· Próxima prova em {diasParaProximaProva}d</span>}
            </div>
          </div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
            <BotaoGuia modulo="calendario"/>
            {/* Vista */}
            <div style={{ display:'flex', background:'#101F40', borderRadius:8, padding:2, gap:2 }}>
              {[['mes','📆'],['semana','📋'],['lista','☰']].map(([v,l])=>(
                <button key={v} onClick={()=>setVista(v)} style={{ padding:'4px 8px', borderRadius:6, fontSize:11, cursor:'pointer', border:'none', fontFamily:'inherit', background:vista===v?'#1B2D52':'transparent', color:vista===v?'#fff':'#475569' }}>{l}</button>
              ))}
            </div>
            <button onClick={()=>setMostrarColetivas(v=>!v)}
              style={{ padding:'5px 8px', borderRadius:8, fontSize:11, fontWeight:600, cursor:'pointer', border:`1px solid ${mostrarColetivas?'#fb923c':'#1B2D52'}`, background:mostrarColetivas?'rgba(251,146,60,.1)':'none', color:mostrarColetivas?'#fb923c':'#475569', fontFamily:'inherit' }}>
              📅 FPC{mostrarColetivas?' ✓':''}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={exportarIcal}>📤 iCal</button>
            <button className="btn btn-secondary btn-sm" onClick={()=>setModalImport(true)}>📥 CSV</button>
            <button className="btn btn-icon" onClick={()=>mudarMes(-1)}>‹</button>
            <button className="btn btn-secondary btn-sm" onClick={()=>setMesAtual(new Date())}>Hoje</button>
            <button className="btn btn-icon" onClick={()=>mudarMes(1)}>›</button>
          </div>
        </div>
      </div>

      {/* Filtro por tipo */}
      <div style={{ display:'flex', gap:6, marginBottom:12, flexWrap:'wrap' }}>
        {['todos',...Object.keys(tipoCor)].map(tipo=>(
          <button key={tipo} onClick={()=>setFiltroTipo(tipo)}
            style={{ padding:'4px 10px', borderRadius:20, fontSize:11, cursor:'pointer', border:`1px solid ${filtroTipo===tipo?(tipoCor[tipo]||'#4C8DFF'):'#1B2D52'}`, background:filtroTipo===tipo?`${tipoCor[tipo]||'#4C8DFF'}18`:'none', color:filtroTipo===tipo?(tipoCor[tipo]||'#4C8DFF'):'#475569', fontFamily:'inherit', fontWeight:filtroTipo===tipo?700:400 }}>
            {tipo==='todos'?'Todos':tipoIcon[tipo]+' '+tipo}
          </button>
        ))}
      </div>

      {loading?<div style={{ display:'flex', justifyContent:'center', padding:60 }}><Spinner lg/></div>:(
        <>
          {/* VISTA MÊS */}
          {vista==='mes'&&(
            <div className="card card-p" style={{ marginBottom:12 }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, marginBottom:6 }}>
                {DIAS_SEMANA_S.map((d,i)=><div key={i} style={{ textAlign:'center', fontSize:10, color:'#7A8699', fontWeight:600 }}>{d}</div>)}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3 }}>
                {diasArray.map((dia,i)=>{
                  if (!dia) return <div key={i}/>
                  const dataStr = `${ano}-${String(mes+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
                  const evs = eventosNoDia(dataStr)
                  const isHoje = dataStr===hojeStr
                  const isSel = diaSelecionado===dataStr
                  return (
                    <div key={i} onClick={()=>setDiaSelecionado(dataStr)}
                      style={{ aspectRatio:'1', borderRadius:8, padding:3, cursor:'pointer', background:isHoje?'rgba(45,212,167,.1)':isSel?'#1B2D52':'#101F40', border:isHoje?'1px solid #2DD4A7':isSel?'1px solid #4C8DFF':'1px solid transparent', display:'flex', flexDirection:'column', gap:2, overflow:'hidden', transition:'all .15s' }}
                      onMouseEnter={e=>{ if(!isHoje&&!isSel) e.currentTarget.style.background='#162040' }}
                      onMouseLeave={e=>{ if(!isHoje&&!isSel) e.currentTarget.style.background='#101F40' }}>
                      <div style={{ fontSize:11, fontWeight:isHoje?700:500, color:isHoje?'#2DD4A7':'#cbd5e1' }}>{dia}</div>
                      <div style={{ display:'flex', gap:1, flexWrap:'wrap' }}>
                        {evs.slice(0,4).map((e,j)=><div key={j} style={{ width:5, height:5, borderRadius:'50%', background:tipoCor[e.tipo]||'#94a3b8' }}/>)}
                        {evs.length>4&&<div style={{ fontSize:7, color:'#475569' }}>+{evs.length-4}</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* VISTA SEMANA */}
          {vista==='semana'&&(
            <div className="card card-p" style={{ marginBottom:12 }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:6 }}>
                {diasSemana.map((dataStr,i)=>{
                  const evs = eventosNoDia(dataStr)
                  const isHoje = dataStr===hojeStr
                  const dia = parseInt(dataStr.split('-')[2])
                  return (
                    <div key={i} onClick={()=>setDiaSelecionado(dataStr)}
                      style={{ borderRadius:10, padding:'8px 4px', background:isHoje?'rgba(45,212,167,.08)':diaSelecionado===dataStr?'#1B2D52':'#101F40', border:isHoje?'1px solid rgba(45,212,167,.3)':diaSelecionado===dataStr?'1px solid #4C8DFF':'1px solid #1B2D52', cursor:'pointer', minHeight:80 }}>
                      <div style={{ textAlign:'center', marginBottom:4 }}>
                        <div style={{ fontSize:9, color:'#7A8699' }}>{DIAS_SEMANA[i]}</div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:16, fontWeight:isHoje?900:600, color:isHoje?'#2DD4A7':'#fff' }}>{dia}</div>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                        {evs.slice(0,3).map((e,j)=>(
                          <div key={j} style={{ fontSize:9, color:'#fff', background:tipoCor[e.tipo]+'25', border:`1px solid ${tipoCor[e.tipo]}40`, borderRadius:4, padding:'2px 4px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {tipoIcon[e.tipo]} {e.titulo}
                          </div>
                        ))}
                        {evs.length>3&&<div style={{ fontSize:8, color:'#475569', textAlign:'center' }}>+{evs.length-3}</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Dia seleccionado */}
          {diaSelecionado&&(
            <div className="card card-p" style={{ marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, color:'#fff', fontSize:14 }}>
                  {new Date(diaSelecionado).toLocaleDateString('pt-PT',{weekday:'long',day:'numeric',month:'long'})}
                </div>
                <button className="btn btn-secondary btn-sm" onClick={()=>{ setForm({...EMPTY,data_ev:diaSelecionado}); setModal(true) }}>＋ Evento</button>
              </div>
              {eventosNoDia(diaSelecionado).length===0
                ?<div style={{ fontSize:12, color:'#475569', textAlign:'center', padding:'8px 0' }}>Sem eventos neste dia</div>
                :<div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                    {eventosNoDia(diaSelecionado).map(e=><EventoItem key={e.id} e={e}/>)}
                  </div>
              }
            </div>
          )}

          {/* VISTA LISTA */}
          {vista==='lista'&&(
            <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:12 }}>
              {todosEventos.filter(e=>e.data>=hojeStr).sort((a,b)=>a.data.localeCompare(b.data)).map(e=>(
                <div key={e.id} style={{ display:'flex', gap:10, alignItems:'center', padding:'10px 14px', background:'#0B1830', border:'1px solid #1B2D52', borderRadius:10, borderLeft:`3px solid ${tipoCor[e.tipo]||'#94a3b8'}` }}>
                  <span style={{ fontSize:16 }}>{tipoIcon[e.tipo]}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, color:'#fff', fontWeight:600 }}>{e.titulo}</div>
                    <div style={{ fontSize:10, color:'#7A8699' }}>{new Date(e.data).toLocaleDateString('pt-PT',{weekday:'long',day:'numeric',month:'long'})}</div>
                  </div>
                  <Badge v="gray">{e.tipo}</Badge>
                </div>
              ))}
            </div>
          )}

          {/* Próximos eventos */}
          {vista!=='lista'&&(
            <div className="card card-p">
              <div style={{ fontWeight:600, color:'#fff', marginBottom:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span>📅 Próximos eventos</span>
                <span style={{ fontSize:11, color:'#7A8699' }}>{proximosEventos.length} eventos</span>
              </div>
              {proximosEventos.length===0
                ?<div style={{ fontSize:12, color:'#475569', textAlign:'center', padding:'8px 0' }}>Sem eventos agendados</div>
                :<div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                    {proximosEventos.map(e=>(
                      <div key={e.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'5px 0' }}>
                        <span style={{ fontSize:14 }}>{tipoIcon[e.tipo]}</span>
                        <span style={{ flex:1, fontSize:12, color:'#fff' }}>{e.titulo}</span>
                        <span style={{ fontSize:11, color:tipoCor[e.tipo]||'#7A8699', fontWeight:600 }}>{new Date(e.data).toLocaleDateString('pt-PT',{day:'2-digit',month:'2-digit'})}</span>
                      </div>
                    ))}
                  </div>
              }
            </div>
          )}
        </>
      )}

      {/* Modal novo evento */}
      <Modal open={modal} onClose={()=>setModal(false)} title="📅 Novo Evento"
        footer={<><button className="btn btn-secondary" onClick={()=>setModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={save} disabled={saving}>{saving?<Spinner/>:null}Criar</button></>}>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <Field label="Título *"><input className="input" value={form.titulo} onChange={e=>sf('titulo',e.target.value)}/></Field>
          <div className="form-grid" style={{ gridTemplateColumns:'1fr 1fr' }}>
            <Field label="Data"><input className="input" type="date" value={form.data_ev} onChange={e=>sf('data_ev',e.target.value)}/></Field>
            <Field label="Tipo"><select className="input" value={form.tipo} onChange={e=>sf('tipo',e.target.value)}>{['Outro','Reprodução','Treino'].map(op=><option key={op}>{op}</option>)}</select></Field>
          </div>
          <Field label="Observações"><input className="input" value={form.obs} onChange={e=>sf('obs',e.target.value)}/></Field>
        </div>
      </Modal>

      {/* Modal importar CSV */}
      <Modal open={modalImport} onClose={()=>{ setModalImport(false); setCsvData(null) }} title="📥 Importar Calendário (CSV)" wide
        footer={csvData?<>
          <button className="btn btn-secondary" onClick={()=>setCsvData(null)}>← Voltar</button>
          <button className="btn btn-primary" onClick={confirmarImportacao} disabled={importando||linhasValidas.length===0}>{importando?<Spinner/>:null}Importar {linhasValidas.length} prova(s)</button>
        </>:<button className="btn btn-secondary" onClick={()=>setModalImport(false)}>Cancelar</button>}>
        {!csvData?(
          <div>
            <div style={{ fontSize:13, color:'#94a3b8', marginBottom:14 }}>Importa o calendário de provas — compatível com LoftGest e Columbofilia.Net (CSV com colunas Prova, Data, Distância, Especialidade).</div>
            <label className="btn btn-primary" style={{ cursor:'pointer', display:'inline-flex' }}>
              📄 Escolher Ficheiro CSV
              <input type="file" accept=".csv,text/csv" style={{ display:'none' }} onChange={e=>lerFicheiroCSV(e.target.files[0])}/>
            </label>
          </div>
        ):(
          <div>
            <div style={{ fontSize:12, color:'#94a3b8', marginBottom:12 }}>{csvData.rows.length} linha(s). Associe as colunas:</div>
            <div className="form-grid" style={{ gridTemplateColumns:'1fr 1fr', marginBottom:14 }}>
              {[['nome','Nome da Prova'],['data','Data *'],['dist','Distância (km)'],['local','Local de Solta'],['especialidade','Especialidade']].map(([k,l])=>(
                <Field key={k} label={l}>
                  <select className="input" value={mapeamento[k]} onChange={e=>setMapeamento(m=>({...m,[k]:e.target.value}))}>
                    <option value="">— {k==='data'?'Escolher':'Nenhuma'} —</option>
                    {csvData.headers.map(h=><option key={h} value={h}>{h}</option>)}
                  </select>
                </Field>
              ))}
            </div>
            <div style={{ maxHeight:200, overflowY:'auto', display:'flex', flexDirection:'column', gap:5 }}>
              {linhasValidas.slice(0,8).map((l,i)=>(
                <div key={i} style={{ display:'flex', gap:10, padding:'6px 10px', background:'#101F40', borderRadius:8, fontSize:12 }}>
                  <span style={{ color:'#D4AF37', fontWeight:600 }}>{normalizarData(l[mapeamento.data])}</span>
                  <span style={{ flex:1, color:'#fff' }}>{mapeamento.nome?l[mapeamento.nome]:'Prova FCP'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
