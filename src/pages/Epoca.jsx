import { useState, useEffect, useCallback } from 'react'
import { db } from '../lib/supabase'
import { useIdioma } from '../hooks/useIdioma'
import { useToast, Spinner, Modal, EmptyState, Badge } from '../components/ui'
import { BloqueioPlano } from '../hooks/useLicenca'
import { GuiaAuto, BotaoGuia } from '../components/GuiaModulo'

export default function Epoca({ nav }) {
  const toast = useToast()
  const { t } = useIdioma()
  const [loading, setLoading] = useState(true)
  const [pombos, setPombos] = useState([])
  const [provas, setProvas] = useState([])
  const [financas, setFinancas] = useState([])
  const [acasalamentos, setAcasalamentos] = useState([])
  const [epocas, setEpocas] = useState([])
  const [tab, setTab] = useState('resumo')
  const [confirmNova, setConfirmNova] = useState(false)
  const [confirmDispensa, setConfirmDispensa] = useState(null)
  const [saving, setSaving] = useState(false)
  const [relatorioIA, setRelatorioIA] = useState(null)
  const [loadingIA, setLoadingIA] = useState(false)
  const [perfil, setPerfil] = useState(null)

  const anoAtual = new Date().getFullYear()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [p,pv,f,a,ep,pf] = await Promise.all([db.getPombos(),db.getProvas(),db.getFinancas(),db.getAcasalamentos(),db.getEpocas(),db.getPerfil()])
      setPombos(p); setProvas(pv); setFinancas(f); setAcasalamentos(a); setEpocas(ep); setPerfil(pf)
    } catch(e) { toast('Erro: '+e.message,'err') }
    finally { setLoading(false) }
  },[])
  useEffect(()=>{ load() },[load])

  const efectivo = pombos.filter(p=>!p.estado_ext||p.estado_ext==='proprio')
  const provasAno = provas.filter(p=>new Date(p.data_reg).getFullYear()===anoAtual)
  const finAno = financas.filter(f=>new Date(f.data_reg).getFullYear()===anoAtual)
  const rec = finAno.filter(f=>f.tipo==='receita').reduce((s,f)=>s+f.val,0)
  const dep = finAno.filter(f=>f.tipo==='despesa').reduce((s,f)=>s+f.val,0)
  const vitorias = provasAno.filter(p=>p.lugar===1).length
  const acasAno = acasalamentos.filter(a=>new Date(a.data_acasalamento).getFullYear()===anoAtual)
  const borrachinhos = acasAno.reduce((s,a)=>s+(a.ninhadas||0),0)
  const epocaJaFechada = epocas.some(e=>e.ano===anoAtual)
  const ranking = [...efectivo].sort((a,b)=>(b.percentil||0)-(a.percentil||0))
  const aDispensar = ranking.filter(p=>(p.percentil||0)<35&&(p.provas||0)>=3)
  const melhorPercentil = ranking[0]?.percentil||0
  const saldo = rec-dep

  const arquivarEpoca = async () => {
    setSaving(true)
    try {
      await db.createEpoca({ ano:anoAtual,efectivo:efectivo.length,provas:provasAno.length,vitorias,receitas:rec,despesas:dep,saldo,acasalamentos:acasAno.length,borrachinhos })
      toast(`Época ${anoAtual} fechada!`,'ok'); setConfirmNova(false); load()
    } catch(e) { toast('Erro: '+e.message,'err') }
    finally { setSaving(false) }
  }

  const dispensar = async (pombo) => {
    try {
      await db.updatePombo(pombo.id,{ estado_ext:'cedido',estado:'inativo',destino_obs:`Dispensado na época ${anoAtual} (${pombo.percentil||0}%)` })
      toast(`${pombo.nome} movido para "Cedidos"`,'ok'); setConfirmDispensa(null); load()
    } catch(e) { toast('Erro: '+e.message,'err') }
  }

  const sugerirCasais = () => {
    const machos=[...ranking].filter(p=>p.sexo==='M').slice(0,6)
    const femeas=[...ranking].filter(p=>p.sexo==='F').slice(0,6)
    const pares=[]; const femeasUsadas=new Set()
    machos.forEach(m=>{ const candidata=femeas.find(f=>!femeasUsadas.has(f.id)&&!(f.pai===m.pai&&f.mae===m.mae&&f.pai)); if(candidata){ pares.push({macho:m,femea:candidata,scoreCombinado:Math.round(((m.percentil||0)+(candidata.percentil||0))/2)}); femeasUsadas.add(candidata.id) } })
    return pares.sort((a,b)=>b.scoreCombinado-a.scoreCombinado)
  }
  const casaisSugeridos = sugerirCasais()

  const gerarRelatorioIA = async () => {
    setLoadingIA(true)
    try {
      const resumo = { ano:anoAtual,efectivo:efectivo.length,provas:provasAno.length,vitorias,topPombos:ranking.slice(0,5).map(p=>({nome:p.nome,percentil:p.percentil,provas:p.provas})),aDispensar:aDispensar.map(p=>({nome:p.nome,percentil:p.percentil})) }
      const res = await fetch('/api/relatorio-ia',{ method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(resumo) })
      if (!res.ok) throw new Error('Endpoint indisponível')
      const data = await res.json()
      setRelatorioIA(data.relatorio||data.text||'Relatório gerado.')
    } catch(e) { toast('Relatório IA indisponível: '+e.message,'err') }
    finally { setLoadingIA(false) }
  }

  const gerarPDFEpoca = async () => {
    toast('A gerar PDF...','ok')
    try {
      await new Promise((res,rej)=>{ if(window.jspdf)return res(); const s=document.createElement('script'); s.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'; s.onload=res; s.onerror=rej; document.head.appendChild(s) })
      const {jsPDF}=window.jspdf
      const doc=new jsPDF({orientation:'p',unit:'mm',format:'a4'})
      const W=210,H=297,GOLD=[180,134,11],NAVY=[15,30,65],WHITE=[255,255,255]
      doc.setFillColor(...NAVY); doc.rect(0,0,W,H,'F')
      doc.setFillColor(...GOLD); doc.rect(0,0,W,8,'F'); doc.rect(0,H-8,W,8,'F')
      doc.setFontSize(32); doc.setFont('helvetica','bold'); doc.setTextColor(...GOLD)
      doc.text('RELATÓRIO DE ÉPOCA',W/2,80,{align:'center'})
      doc.setFontSize(48); doc.setFont('helvetica','bold'); doc.setTextColor(...WHITE)
      doc.text(String(anoAtual),W/2,108,{align:'center'})
      doc.setFontSize(14); doc.setFont('helvetica','normal'); doc.setTextColor(148,163,184)
      doc.text(perfil?.nome||'Fly2Win',W/2,125,{align:'center'})
      if(perfil?.pombal_nome) doc.text(perfil.pombal_nome,W/2,133,{align:'center'})
      const kpis=[[`${efectivo.length}`,'Efectivo'],[`${provasAno.length}`,'Provas'],[`${vitorias}`,'Vitórias'],[`${melhorPercentil}%`,'Melhor Percentil'],[`${borrachinhos}`,'Nascidos'],[`${saldo.toFixed(0)}€`,'Saldo']]
      kpis.forEach(([v,l],i)=>{ const col=i%3,row=Math.floor(i/3),x=25+col*60,y=175+row*28; doc.setFillColor(20,40,80); doc.roundedRect(x,y,50,22,2,2,'F'); doc.setFontSize(16); doc.setFont('helvetica','bold'); doc.setTextColor(...GOLD); doc.text(v,x+25,y+11,{align:'center'}); doc.setFontSize(7); doc.setFont('helvetica','normal'); doc.setTextColor(148,163,184); doc.text(l,x+25,y+17,{align:'center'}) })
      doc.addPage()
      doc.setFillColor(247,248,252); doc.rect(0,0,W,H,'F'); doc.setFillColor(...GOLD); doc.rect(0,0,W,1.5,'F')
      doc.setFontSize(18); doc.setFont('helvetica','bold'); doc.setTextColor(...NAVY); doc.text('Top Pombos da Época',15,22)
      doc.setDrawColor(220,226,235); doc.setLineWidth(0.3); doc.line(15,26,W-15,26)
      ranking.slice(0,20).forEach((p,i)=>{ const y=35+i*11,cor=i===0?GOLD:i<3?NAVY:[80,90,120]; doc.setFillColor(230,235,245); doc.rect(60,y-3,90,6,'F'); doc.setFillColor(...cor); doc.rect(60,y-3,90*(p.percentil||0)/100,6,'F'); doc.setFontSize(i===0?9:8); doc.setFont('helvetica',i<3?'bold':'normal'); doc.setTextColor(...cor); doc.text(`${i+1}. ${p.nome}`,15,y+1); doc.setFontSize(7); doc.setFont('helvetica','normal'); doc.setTextColor(80,90,120); doc.text(`${p.percentil||0}%`,153,y+1); doc.text(`${p.provas||0} provas`,170,y+1) })
      if(relatorioIA){ doc.addPage(); doc.setFillColor(247,248,252); doc.rect(0,0,W,H,'F'); doc.setFillColor(...GOLD); doc.rect(0,0,W,1.5,'F'); doc.setFontSize(18); doc.setFont('helvetica','bold'); doc.setTextColor(...NAVY); doc.text('Analise IA — Epoca '+anoAtual,15,22); doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.setTextColor(50,60,90); doc.text(doc.splitTextToSize(relatorioIA.replace(/[^\x00-\x7F]/g,' '),W-30),15,35) }
      doc.addPage(); doc.setFillColor(247,248,252); doc.rect(0,0,W,H,'F'); doc.setFillColor(...GOLD); doc.rect(0,0,W,1.5,'F'); doc.setFontSize(18); doc.setFont('helvetica','bold'); doc.setTextColor(...NAVY); doc.text('Resumo Financeiro '+anoAtual,15,22); doc.setDrawColor(220,226,235); doc.setLineWidth(0.3); doc.line(15,26,W-15,26);[['Receitas',rec,'#2DD4A7'],['Despesas',dep,'#f87171'],['Saldo',saldo,saldo>=0?'#2DD4A7':'#f87171']].forEach(([l,v,c],i)=>{ const y=40+i*18; doc.setFontSize(11); doc.setFont('helvetica','normal'); doc.setTextColor(80,90,120); doc.text(l,20,y); const rgb=c==='#2DD4A7'?[45,212,167]:[248,113,113]; doc.setFontSize(14); doc.setFont('helvetica','bold'); doc.setTextColor(...rgb); doc.text(`${v>=0?'+':''}${v.toFixed(2)} EUR`,W-20,y,{align:'right'}); doc.setDrawColor(220,226,235); doc.setLineWidth(0.2); doc.line(20,y+3,W-20,y+3) })
      doc.save(`relatorio-epoca-${anoAtual}.pdf`); toast('PDF gerado!','ok')
    } catch(e) { toast('Erro PDF: '+e.message,'err') }
  }

  const TABS = [['resumo','📋 Resumo'],['ranking',`🏆 Ranking`],['dispensar',`✂️ Dispensar${aDispensar.length?` (${aDispensar.length})`:''}`],['casais','🥚 Casais'],['ia','🧠 IA'],['historico','📚 Histórico']]

  return (
    <div>
      <GuiaAuto modulo="epoca"/>

      {/* Header premium */}
      <div style={{ background:'linear-gradient(135deg,#050D1A,#0B1830)', border:'1px solid rgba(212,175,55,.2)', borderRadius:14, padding:'14px 18px', marginBottom:14, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#B8960C,#D4AF37,#B8960C)' }}/>
        <div style={{ position:'absolute', top:'-30%', right:'-5%', width:200, height:200, background:'radial-gradient(circle,rgba(212,175,55,.08) 0%,transparent 70%)', borderRadius:'50%', pointerEvents:'none' }}/>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8, position:'relative' }}>
          <div>
            <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:900, color:'#fff', display:'flex', alignItems:'center', gap:8 }}>
              <span>🏁</span> Época {anoAtual}
              <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, fontWeight:600, color:epocaJaFechada?'#7A8699':'#2DD4A7', background:epocaJaFechada?'rgba(122,134,153,.1)':'rgba(45,212,167,.1)', border:`1px solid ${epocaJaFechada?'#7A8699':'#2DD4A7'}40`, borderRadius:99, padding:'2px 8px', marginLeft:4 }}>
                <span style={{ width:5, height:5, borderRadius:'50%', background:epocaJaFechada?'#7A8699':'#2DD4A7' }}/>
                {epocaJaFechada?'Fechada':'Em curso'}
              </span>
            </div>
            <div style={{ fontSize:11, color:'#7A8699', marginTop:2 }}>{provasAno.length} provas · {efectivo.length} pombos activos</div>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            <BotaoGuia modulo="epoca"/>
            <button className="btn btn-secondary" onClick={gerarPDFEpoca}>📄 PDF</button>
            {!epocaJaFechada&&<button className="btn btn-primary" onClick={()=>setConfirmNova(true)}>🔒 Fechar Época</button>}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:14 }}>
        {[
          [efectivo.length,'👥','Efectivo','#4C8DFF'],
          [provasAno.length,'🏆','Provas','#D4AF37'],
          [vitorias,'🥇','Vitórias','#2DD4A7'],
          [`${saldo>=0?'+':''}${saldo.toFixed(0)}€`,'💰','Saldo',saldo>=0?'#2DD4A7':'#f87171'],
        ].map(([v,icon,l,c])=>(
          <div key={l} style={{ background:'#0B1830', border:`1px solid ${c}25`, borderRadius:12, padding:'12px 10px', textAlign:'center', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:c, opacity:.6 }}/>
            <div style={{ fontSize:10, marginBottom:4 }}>{icon}</div>
            <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:900, color:c, lineHeight:1 }}>{v}</div>
            <div style={{ fontSize:10, color:'#7A8699', marginTop:3 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:3, background:'#0A1628', borderRadius:10, padding:3, marginBottom:14, overflowX:'auto' }}>
        {TABS.map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{ flex:'none', padding:'8px 12px', borderRadius:8, fontSize:11, fontWeight:600, cursor:'pointer', border:'none', fontFamily:'inherit', whiteSpace:'nowrap', background:tab===k?'linear-gradient(135deg,#1E5FD9,#1456C0)':'none', color:tab===k?'#fff':'#475569' }}>{l}</button>
        ))}
      </div>

      {loading?<div style={{ display:'flex', justifyContent:'center', padding:60 }}><Spinner lg/></div>:(
        <>
          {/* RESUMO */}
          {tab==='resumo'&&(
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {/* Reprodução */}
                <div style={{ background:'#0B1830', border:'1px solid rgba(192,132,252,.2)', borderRadius:12, padding:'14px 16px', position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'#C084FC', opacity:.5 }}/>
                  <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, color:'#fff', marginBottom:12 }}>🥚 Reprodução {anoAtual}</div>
                  <div style={{ display:'flex', gap:20, marginBottom:12 }}>
                    <div><div style={{ fontFamily:"'Fraunces',serif", fontSize:28, fontWeight:900, color:'#C084FC' }}>{acasAno.length}</div><div style={{ fontSize:11, color:'#7A8699' }}>Acasalamentos</div></div>
                    <div><div style={{ fontFamily:"'Fraunces',serif", fontSize:28, fontWeight:900, color:'#D4AF37' }}>{borrachinhos}</div><div style={{ fontSize:11, color:'#7A8699' }}>Borrachinhos</div></div>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={()=>nav?.('reproducao')}>Ver Reprodução →</button>
                </div>
                {/* Melhor pombo */}
                <div style={{ background:'#0B1830', border:'1px solid rgba(212,175,55,.2)', borderRadius:12, padding:'14px 16px', position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'#D4AF37', opacity:.5 }}/>
                  <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, color:'#fff', marginBottom:12 }}>🥇 Melhor pombo</div>
                  {ranking[0]?(
                    <>
                      <div style={{ fontSize:16, fontWeight:700, color:'#D4AF37' }}>{ranking[0].emoji} {ranking[0].nome}</div>
                      <div style={{ fontSize:12, color:'#7A8699', marginBottom:8 }}>{ranking[0].anilha}</div>
                      <div style={{ height:4, background:'#101F40', borderRadius:2, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${melhorPercentil}%`, background:'linear-gradient(90deg,#D4AF37,#E8C758)', borderRadius:2 }}/>
                      </div>
                      <div style={{ fontSize:12, color:'#D4AF37', fontWeight:700, marginTop:4 }}>{melhorPercentil}% percentil</div>
                    </>
                  ):<div style={{ fontSize:12, color:'#475569' }}>Sem pombos com provas</div>}
                </div>
              </div>
              {/* Fechar época */}
              {!epocaJaFechada&&(
                <div style={{ background:'rgba(212,175,55,.06)', border:'1px solid rgba(212,175,55,.2)', borderRadius:12, padding:'14px 16px', display:'flex', alignItems:'center', gap:12 }}>
                  <span style={{ fontSize:24 }}>🔒</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'#fff', marginBottom:3 }}>Fechar época {anoAtual}</div>
                    <div style={{ fontSize:11, color:'#7A8699' }}>Arquiva um resumo permanente — pombos, provas, finanças e reprodução. Os dados não são apagados.</div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={()=>setConfirmNova(true)}>Fechar</button>
                </div>
              )}
            </div>
          )}

          {/* RANKING */}
          {tab==='ranking'&&(
            ranking.length===0?<EmptyState icon="🏆" title="Sem pombos" desc="Sem efectivo para classificar"/>
            :<div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {ranking.map((p,i)=>{
                const medalha=i===0?'🥇':i===1?'🥈':i===2?'🥉':null
                const cor=i===0?'#D4AF37':i===1?'#cbd5e1':i===2?'#b45309':'#475569'
                const pct=p.percentil||0
                return (
                  <div key={p.id} style={{ background:'#0B1830', border:`1px solid ${i<3?cor+'40':'#1B2D52'}`, borderRadius:10, padding:'12px 14px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:900, width:28, color:cor, textAlign:'center' }}>{medalha||i+1}</div>
                      <div style={{ width:36, height:36, borderRadius:8, background:'#101F40', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, overflow:'hidden', flexShrink:0 }}>
                        {p.foto_url?<img src={p.foto_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>:p.emoji}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:'#fff' }}>{p.nome}</div>
                        <div style={{ fontSize:10, color:'#7A8699' }}>{p.provas||0} provas · {p.anilha}</div>
                        <div style={{ height:3, background:'#101F40', borderRadius:2, marginTop:5, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${pct}%`, background:pct>=60?'#2DD4A7':pct>=35?'#D4AF37':'#f87171', borderRadius:2 }}/>
                        </div>
                      </div>
                      <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:900, color:pct>=60?'#2DD4A7':pct>=35?'#D4AF37':'#f87171', minWidth:40, textAlign:'right' }}>{pct}%</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* DISPENSAR */}
          {tab==='dispensar'&&(
            aDispensar.length===0?<EmptyState icon="✂️" title="Nenhum pombo a dispensar" desc="Todos os pombos com 3+ provas têm desempenho acima de 35%"/>
            :<div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{ fontSize:12, color:'#94a3b8', marginBottom:4, padding:'8px 12px', background:'rgba(248,113,113,.06)', border:'1px solid rgba(248,113,113,.15)', borderRadius:8 }}>
                ⚠️ Pombos com percentil abaixo de 35% após 3 ou mais provas
              </div>
              {aDispensar.map(p=>(
                <div key={p.id} style={{ background:'#0B1830', border:'1px solid rgba(248,113,113,.2)', borderRadius:10, padding:'12px 14px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ fontSize:22 }}>{p.emoji}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:'#fff' }}>{p.nome}</div>
                      <div style={{ fontSize:11, color:'#f87171' }}>{p.percentil||0}% em {p.provas} provas</div>
                    </div>
                    <button className="btn btn-danger btn-sm" onClick={()=>setConfirmDispensa(p)}>Dispensar</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CASAIS */}
          {tab==='casais'&&(
            casaisSugeridos.length===0?<EmptyState icon="🥚" title="Sem sugestões" desc="Necessário ter machos e fêmeas no efectivo"/>
            :<div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{ fontSize:12, color:'#94a3b8', marginBottom:4 }}>Cruzamentos sugeridos pelos melhores scores:</div>
              {casaisSugeridos.map((par,i)=>(
                <div key={i} style={{ background:'#0B1830', border:'1px solid rgba(192,132,252,.2)', borderRadius:10, padding:'12px 14px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:'#fff' }}>{par.macho.nome} ♂ × {par.femea.nome} ♀</div>
                      <div style={{ fontSize:11, color:'#7A8699' }}>{par.macho.anilha} × {par.femea.anilha}</div>
                    </div>
                    <Badge v="green">{par.scoreCombinado}%</Badge>
                    <button className="btn btn-secondary btn-sm" onClick={()=>{ toast(`Vá a Reprodução e crie o acasalamento`,'ok'); nav?.('reproducao') }}>🥚 Acasalar</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* IA */}
          {tab==='ia'&&(
            <div>
              {!relatorioIA?(
                <div style={{ textAlign:'center', padding:'40px 20px', background:'linear-gradient(135deg,#050D1A,#0B1830)', border:'1px solid rgba(212,175,55,.15)', borderRadius:14 }}>
                  <div style={{ fontSize:48, marginBottom:16 }}>🧠</div>
                  <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:700, color:'#fff', marginBottom:8 }}>Relatório IA da Época</div>
                  <div style={{ fontSize:13, color:'#7A8699', marginBottom:24, maxWidth:360, margin:'0 auto 24px', lineHeight:1.7 }}>
                    Análise completa com resumo executivo, pombos a dispensar e sugestões de casais — baseada nos seus dados reais.
                  </div>
                  <button className="btn btn-primary" onClick={gerarRelatorioIA} disabled={loadingIA}>
                    {loadingIA?<Spinner/>:'✨'} Gerar Relatório IA
                  </button>
                  <div style={{ fontSize:10, color:'#475569', marginTop:10 }}>Disponível no plano Elite AI</div>
                </div>
              ):(
                <div style={{ background:'#0B1830', border:'1px solid rgba(212,175,55,.2)', borderRadius:12, padding:'16px 18px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12, alignItems:'center' }}>
                    <div style={{ fontFamily:"'Fraunces',serif", fontWeight:700, color:'#fff' }}>🧠 Análise IA — Época {anoAtual}</div>
                    <Badge v="yellow">ELITE AI</Badge>
                  </div>
                  <div style={{ fontSize:13, color:'#cbd5e1', lineHeight:1.7, whiteSpace:'pre-wrap' }}>{relatorioIA}</div>
                  <button className="btn btn-secondary btn-sm" style={{ marginTop:16 }} onClick={gerarRelatorioIA} disabled={loadingIA}>{loadingIA?<Spinner/>:'🔄'} Gerar Novamente</button>
                </div>
              )}
            </div>
          )}

          {/* HISTÓRICO */}
          {tab==='historico'&&(
            epocas.length===0?<EmptyState icon="📚" title="Sem épocas fechadas" desc="Ao fechar a época actual fica aqui guardado um resumo permanente"/>
            :<div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {epocas.map(e=>(
                <div key={e.id} style={{ background:'#0B1830', border:'1px solid #1B2D52', borderRadius:10, padding:'14px 16px', display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ fontFamily:"'Fraunces',serif", fontSize:26, fontWeight:900, color:'#D4AF37', width:60 }}>{e.ano}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, color:'#fff', fontWeight:600, marginBottom:3 }}>{e.efectivo} pombos · {e.provas} provas · {e.vitorias} vitórias</div>
                    <div style={{ fontSize:11, color:'#7A8699' }}>{e.acasalamentos||0} acasalamentos · {e.borrachinhos||0} nascidos</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontFamily:"'Fraunces',serif", fontSize:16, fontWeight:900, color:e.saldo>=0?'#2DD4A7':'#f87171' }}>{e.saldo>=0?'+':''}{e.saldo.toFixed(0)}€</div>
                    <div style={{ fontSize:10, color:'#475569' }}>saldo</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <Modal open={confirmNova} onClose={()=>setConfirmNova(false)} title="🔒 Fechar Época"
        footer={<><button className="btn btn-secondary" onClick={()=>setConfirmNova(false)}>Cancelar</button><button className="btn btn-primary" onClick={arquivarEpoca} disabled={saving}>{saving?<Spinner/>:null}Confirmar</button></>}>
        <p style={{ fontSize:14, color:'#cbd5e1', marginBottom:12 }}>
          Cria um registo permanente da época {anoAtual}: efectivo, provas, vitórias, saldo e reprodução.
        </p>
        <p style={{ fontSize:13, color:'#94a3b8' }}>Os dados actuais não são apagados — isto guarda apenas uma fotografia da época.</p>
      </Modal>

      <Modal open={!!confirmDispensa} onClose={()=>setConfirmDispensa(null)} title="Dispensar pombo"
        footer={<><button className="btn btn-secondary" onClick={()=>setConfirmDispensa(null)}>Cancelar</button><button className="btn btn-danger" onClick={()=>dispensar(confirmDispensa)}>Confirmar Dispensa</button></>}>
        <p style={{ fontSize:14, color:'#cbd5e1' }}>Dispensar "{confirmDispensa?.nome}"? Ficará marcado como "Cedido" e inactivo. Pode reverter em Pombos.</p>
      </Modal>
    </div>
  )
}
