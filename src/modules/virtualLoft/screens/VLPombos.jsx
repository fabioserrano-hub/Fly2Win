// src/modules/virtualLoft/screens/VLPombos.jsx — V4 Digital Twin
import { useState } from 'react'

const T={bg:'#050A14',surface:'#0D1829',s2:'#1A2A45',gold:'#C9A84C',blue:'#4FC3F7',text:'#E8EDF5',muted:'#6B7A99',success:'#2DD4A7',danger:'#F87171',purple:'#A855F7',orange:'#FB923C'}
function lerLS(){try{return JSON.parse(localStorage.getItem('vl_carreira'))}catch{return null}}
function gravarLS(d){try{localStorage.setItem('vl_carreira',JSON.stringify(d))}catch{}}
function GL(){return <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,#C9A84C,transparent)',opacity:.8}}/>}

// ── Sistema de ADN ────────────────────────────────────────────────────────────
const GENES_VISÍVEIS = ['velocidade','resistencia','orientacao','coragem','recuperacao','inteligencia']
const GENES_OCULTOS  = ['instinto','sangue','fertilidade','potencial_maximo','gene_raro','adaptacao']
const GENE_RARO_TIPOS = ['Linha Campeã','Mutação Velocista','Sangue Puro','Gene Olímpico','Resistência Infinita','Orientador Nato']

const PERSONALIDADES = {
  guerreiro:   {label:'Guerreiro',      icon:'⚔️', efeito:'Melhor sob pressão. +15% em provas competitivas.',       cor:'#F87171'},
  calmo:       {label:'Calmo',          icon:'🧘', efeito:'Consistente em qualquer condição. Menos variância.',      cor:'#4FC3F7'},
  nervoso:     {label:'Nervoso',        icon:'😰', efeito:'-10% em condições adversas. +5% em dias perfeitos.',     cor:'#FB923C'},
  competitivo: {label:'Competitivo',    icon:'🔥', efeito:'+12% quando atrás no grupo. Líder natural.',             cor:'#F87171'},
  inteligente: {label:'Inteligente',    icon:'🧠', efeito:'+8% em orientação. Aprende mais rápido.',                cor:'#A855F7'},
  resistente:  {label:'Resistente',     icon:'💪', efeito:'-30% penalidade de fadiga. Ideal para grande fundo.',    cor:'#2DD4A7'},
  sensivel:    {label:'Sensível',       icon:'🌸', efeito:'-15% em chuva/vento. +20% em condições ideais.',         cor:'#C084FC'},
  lider:       {label:'Líder',          icon:'👑', efeito:'Pombos próximos têm +5%. Aura de campeão.',              cor:'#C9A84C'},
  solitario:   {label:'Solitário',      icon:'🦅', efeito:'+10% quando voa sozinho. Prefere ritmo próprio.',        cor:'#94A3B8'},
  determinado: {label:'Determinado',    icon:'🎯', efeito:'+8% global. Nunca desiste. Consistência máxima.',        cor:'#C9A84C'},
}

const TEMPERAMENTOS = ['Dócil','Activo','Curioso','Reservado','Sociável','Independente']
const MOTIVACOES = ['Competição','Liberdade','Território','Social','Conquista','Exploração']

// ── Gerador de história automática ────────────────────────────────────────────
function gerarHistoriaBase(pombo) {
  const origem = pombo.pai_nome && pombo.mae_nome
    ? `Nascido da união de ${pombo.pai_nome} e ${pombo.mae_nome}`
    : 'De origem desconhecida'
  const potencial = (pombo.atributos?.potencial_maximo || 70)
  const nivel = potencial >= 90 ? 'excecional' : potencial >= 75 ? 'elevado' : potencial >= 60 ? 'sólido' : 'modesto'
  const especialidade = pombo.especialidade || 'velocidade'
  return `${origem}, ${pombo.nome} revelou desde cedo um potencial ${nivel}. ` +
    `A sua especialidade natural é ${especialidade === 'velocidade' ? 'a velocidade' : especialidade === 'fundo' ? 'as provas de fundo' : 'o meio-fundo'}, ` +
    `com uma personalidade ${(pombo.personalidade_tipo && PERSONALIDADES[pombo.personalidade_tipo]?.label) || 'única'} que define o seu estilo de competição.`
}

function gerarEventosVida(pombo, historico) {
  const eventos = []
  if (pombo.ano) eventos.push({tipo:'nascimento',icon:'🐣',desc:`Nasceu em ${pombo.ano}`,destaque:false})
  historico.forEach(r => {
    if (r.posicao === 1) eventos.push({tipo:'vitoria',icon:'🥇',desc:`Venceu ${r.provaNome} (P${r.percentil}%)`,destaque:true})
    else if (r.percentil >= 90) eventos.push({tipo:'destaque',icon:'⭐',desc:`Top 10% em ${r.provaNome}`,destaque:true})
  })
  if (pombo.lesao) eventos.push({tipo:'lesao',icon:'🤕',desc:`Lesão: ${pombo.lesao}`,destaque:false})
  if ((pombo.vitorias||0) >= 3) eventos.push({tipo:'lenda',icon:'🏆',desc:'Alcançou estatuto de campeão',destaque:true})
  return eventos
}

// ── Gráfico Radar SVG ─────────────────────────────────────────────────────────
function RadarSVG({ attrs, cor = '#C9A84C', cor2 = null, attrs2 = null }) {
  const keys = ['velocidade','resistencia','orientacao','instinto','coragem','recuperacao']
  const n = keys.length
  const cx = 50, cy = 50, r = 38
  const pts = (a) => keys.map((k,i) => {
    const angle = (i*2*Math.PI/n) - Math.PI/2
    const val = (a[k]||0)/100
    return { x: cx+r*val*Math.cos(angle), y: cy+r*val*Math.sin(angle) }
  })
  const poly = (ps) => ps.map(p=>`${p.x},${p.y}`).join(' ')
  const gridLevels = [.25,.5,.75,1]
  const pts1 = pts(attrs)
  const pts2 = attrs2 ? pts(attrs2) : null

  return (
    <svg viewBox="0 0 100 100" style={{width:'100%',maxWidth:200,margin:'0 auto',display:'block'}}>
      {gridLevels.map(lv=>{
        const gps=keys.map((_,i)=>{const a=(i*2*Math.PI/n)-Math.PI/2;return`${cx+r*lv*Math.cos(a)},${cy+r*lv*Math.sin(a)}`})
        return<polygon key={lv} points={gps.join(' ')} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth=".5"/>
      })}
      {keys.map((_,i)=>{const a=(i*2*Math.PI/n)-Math.PI/2;return<line key={i} x1={cx} y1={cy} x2={cx+r*Math.cos(a)} y2={cy+r*Math.sin(a)} stroke="rgba(255,255,255,.06)" strokeWidth=".5"/>})}
      {pts2&&<polygon points={poly(pts2)} fill={`${cor2||T.blue}15`} stroke={cor2||T.blue} strokeWidth="1" strokeLinejoin="round" strokeDasharray="2,1"/>}
      <polygon points={poly(pts1)} fill={`${cor}20`} stroke={cor} strokeWidth="1.5" strokeLinejoin="round"/>
      {pts1.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="2.5" fill={cor}/>)}
      {keys.map((k,i)=>{
        const a=(i*2*Math.PI/n)-Math.PI/2
        const lx=cx+(r+9)*Math.cos(a), ly=cy+(r+9)*Math.sin(a)
        const LABELS={velocidade:'VEL',resistencia:'RES',orientacao:'ORI',instinto:'INS',coragem:'COR',recuperacao:'REC'}
        return<text key={k} x={lx} y={ly+1.5} textAnchor="middle" fontSize="5.5" fill="rgba(255,255,255,.35)" fontWeight="600">{LABELS[k]}</text>
      })}
    </svg>
  )
}

// ── Barra de atributo ─────────────────────────────────────────────────────────
function BarraAttr({ label, valor, oculto=false, cor, comparar=null }) {
  const c = oculto ? T.s2 : cor || (valor>=85?T.success:valor>=70?T.blue:valor>=50?T.gold:valor>=30?T.orange:T.danger)
  const delta = comparar !== null ? valor - comparar : null
  return (
    <div style={{display:'flex',alignItems:'center',gap:8,padding:'3px 0'}}>
      <div style={{width:72,fontSize:9,color:T.muted,fontWeight:600,letterSpacing:.3}}>{label}</div>
      <div style={{flex:1,height:6,background:'rgba(255,255,255,.05)',borderRadius:3,overflow:'hidden',position:'relative'}}>
        {comparar!==null&&<div style={{position:'absolute',height:'100%',width:`${comparar}%`,background:`${T.blue}30`,borderRadius:3}}/>}
        <div style={{height:'100%',width:oculto?'30%':`${valor}%`,background:oculto?`repeating-linear-gradient(45deg,${T.s2},${T.s2} 3px,${T.bg} 3px,${T.bg} 6px)`:c,borderRadius:3,transition:'width .5s ease',boxShadow:oculto?'none':`0 0 4px ${c}50`}}/>
      </div>
      <div style={{width:28,fontSize:11,fontWeight:700,color:oculto?T.s2:c,textAlign:'right',fontVariantNumeric:'tabular-nums'}}>
        {oculto?'?':valor}
      </div>
      {delta!==null&&!oculto&&<div style={{width:20,fontSize:9,fontWeight:700,color:delta>0?T.success:delta<0?T.danger:T.muted}}>{delta>0?`+${delta}`:delta<0?delta:''}</div>}
    </div>
  )
}

// ── Ficha Digital Twin ────────────────────────────────────────────────────────
function FichaDigitalTwin({ pombo, onFechar, historico, carreira, comparandoCom }) {
  const [tab, setTab] = useState('twin')
  const cor = pombo.sexo==='F' ? '#C084FC' : T.blue
  const attrs = pombo.atributos || {}
  const potRev = attrs.potencial_revelado || 0
  const potMax = attrs.potencial_maximo || 75
  const forma = pombo.forma_atual || 70
  const fadiga = pombo.fadiga || 0
  const pers = pombo.personalidade_tipo ? PERSONALIDADES[pombo.personalidade_tipo] : null
  const historia = gerarHistoriaBase(pombo)
  const eventosVida = gerarEventosVida(pombo, historico)
  const geneRaro = attrs.gene_raro_tipo
  const filhos = (carreira.pombos||[]).filter(p=>p.pai_id===pombo.id||p.mae_id===pombo.id)
  const attrComparar = comparandoCom?.atributos || null

  const TABS=[
    {id:'twin',   label:'🧬 Twin'},
    {id:'attrs',  label:'📊 Atributos'},
    {id:'historia',label:'📖 História'},
    {id:'genea',  label:'🌳 Genealogia'},
    {id:'hist',   label:'🏆 Historial'},
  ]

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(3,6,16,.97)',zIndex:1000,overflowY:'auto',fontFamily:"system-ui,sans-serif"}}>
      <div style={{background:T.bg,minHeight:'100vh',maxWidth:480,margin:'0 auto'}}>

        {/* Hero */}
        <div style={{background:`linear-gradient(160deg,${cor}18,${T.surface} 60%)`,padding:'20px 16px 16px',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${cor},transparent)`}}/>
          <div style={{position:'absolute',top:-60,right:-60,width:200,height:200,background:`radial-gradient(circle,${cor}08,transparent)`,pointerEvents:'none'}}/>

          <button onClick={onFechar} style={{position:'absolute',top:14,right:14,background:T.s2,border:'none',borderRadius:8,width:32,height:32,color:T.muted,cursor:'pointer',fontSize:14}}>✕</button>

          <div style={{display:'flex',gap:14,alignItems:'flex-start',marginBottom:14}}>
            {/* Avatar único baseado na anilha */}
            <div style={{width:76,height:76,borderRadius:18,background:`linear-gradient(135deg,${cor}30,${cor}10)`,border:`2px solid ${cor}50`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',flexShrink:0,position:'relative'}}>
              <span style={{fontFamily:"Georgia,serif",fontSize:22,fontWeight:900,color:cor,lineHeight:1}}>{pombo.anilha?.slice(-3)}</span>
              <span style={{fontSize:9,color:`${cor}80`,fontWeight:600,letterSpacing:.5}}>{pombo.sexo==='M'?'♂':'♀'}</span>
              {geneRaro&&<div style={{position:'absolute',bottom:-6,right:-6,width:20,height:20,borderRadius:'50%',background:T.gold,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,border:`2px solid ${T.bg}`}}>💎</div>}
            </div>

            <div style={{flex:1}}>
              <div style={{fontSize:21,fontWeight:900,color:T.text,letterSpacing:-.5,lineHeight:1,marginBottom:3}}>{pombo.nome}</div>
              <div style={{fontSize:10,color:T.muted,marginBottom:8}}>{pombo.anilha} · {pombo.ano} · {pombo.especialidade}</div>
              <div style={{display:'flex',gap:1,marginBottom:8}}>
                {Array.from({length:5}).map((_,i)=><span key={i} style={{fontSize:13,color:i<pombo.rating?T.gold:'rgba(255,255,255,.1)'}}>{i<pombo.rating?'★':'☆'}</span>)}
                <span style={{fontSize:9,color:T.muted,marginLeft:4,marginTop:2}}>({pombo.rating}/5)</span>
              </div>
              {/* Badges */}
              <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                {pers&&<span style={{padding:'3px 8px',background:`${pers.cor}15`,border:`1px solid ${pers.cor}30`,borderRadius:5,fontSize:9,color:pers.cor,fontWeight:700}}>{pers.icon} {pers.label}</span>}
                {pombo.temperamento&&<span style={{padding:'3px 8px',background:T.s2,borderRadius:5,fontSize:9,color:T.muted}}>{pombo.temperamento}</span>}
                {geneRaro&&<span style={{padding:'3px 8px',background:`${T.gold}15`,border:`1px solid ${T.gold}30`,borderRadius:5,fontSize:9,color:T.gold,fontWeight:700}}>💎 {geneRaro}</span>}
              </div>
            </div>

            {/* Rating numérico */}
            <div style={{background:T.s2,borderRadius:10,padding:'8px 10px',textAlign:'center',border:`1px solid ${T.s2}`,flexShrink:0}}>
              <div style={{fontFamily:"Georgia,serif",fontSize:24,fontWeight:900,color:forma>=70?T.success:forma>=50?T.gold:T.danger,lineHeight:1}}>{forma}</div>
              <div style={{fontSize:7,color:T.muted,fontWeight:700,letterSpacing:.5,marginTop:2}}>FORMA</div>
            </div>
          </div>

          {/* Forma e fadiga em destaque */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            <div style={{padding:'8px 10px',background:'rgba(255,255,255,.04)',borderRadius:8}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                <span style={{fontSize:9,color:T.muted}}>Forma</span>
                <span style={{fontSize:9,color:forma>=70?T.success:forma>=50?T.gold:T.danger,fontWeight:700}}>{forma>=80?'Excelente':forma>=65?'Boa':forma>=45?'Regular':'Baixa'}</span>
              </div>
              <div style={{height:4,background:T.s2,borderRadius:2}}>
                <div style={{height:'100%',width:`${forma}%`,background:forma>=70?T.success:forma>=50?T.gold:T.danger,borderRadius:2,boxShadow:`0 0 6px ${forma>=70?T.success:T.gold}60`}}/>
              </div>
            </div>
            <div style={{padding:'8px 10px',background:'rgba(255,255,255,.04)',borderRadius:8}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                <span style={{fontSize:9,color:T.muted}}>Fadiga</span>
                <span style={{fontSize:9,color:fadiga<30?T.success:fadiga<60?T.gold:T.danger,fontWeight:700}}>{fadiga<30?'Descansado':fadiga<60?'Normal':'Cansado'}</span>
              </div>
              <div style={{height:4,background:T.s2,borderRadius:2}}>
                <div style={{height:'100%',width:`${fadiga}%`,background:fadiga<30?T.success:fadiga<60?T.gold:T.danger,borderRadius:2}}/>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:'flex',borderBottom:`1px solid ${T.s2}`,overflowX:'auto',scrollbarWidth:'none'}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{flex:'none',padding:'11px 12px',background:'none',border:'none',borderBottom:tab===t.id?`2px solid ${cor}`:'2px solid transparent',color:tab===t.id?cor:T.muted,fontSize:10,fontWeight:tab===t.id?700:400,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap',transition:'all .15s'}}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{padding:'16px'}}>

          {/* TAB TWIN — visão geral do Digital Twin */}
          {tab==='twin'&&(
            <div style={{display:'flex',flexDirection:'column',gap:14}}>

              {/* Personalidade com efeito real */}
              {pers&&(
                <div style={{padding:'14px',background:`${pers.cor}08`,border:`1px solid ${pers.cor}20`,borderRadius:12,position:'relative',overflow:'hidden'}}>
                  <GL/>
                  <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:8}}>
                    <div style={{width:40,height:40,borderRadius:10,background:`${pers.cor}15`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>{pers.icon}</div>
                    <div>
                      <div style={{fontSize:13,fontWeight:800,color:pers.cor}}>{pers.label}</div>
                      <div style={{fontSize:9,color:T.muted}}>Personalidade</div>
                    </div>
                  </div>
                  <div style={{fontSize:11,color:T.text,lineHeight:1.5}}>{pers.efeito}</div>
                </div>
              )}

              {/* Radar */}
              <div style={{background:T.surface,border:`1px solid ${T.s2}`,borderRadius:12,padding:'14px',position:'relative',overflow:'hidden'}}>
                <GL/>
                <div style={{fontSize:9,color:T.muted,fontWeight:700,letterSpacing:1,marginBottom:4}}>PERFIL GENÉTICO</div>
                {comparandoCom&&<div style={{fontSize:8,color:T.blue,marginBottom:8}}>── {comparandoCom.nome} (comparação)</div>}
                <RadarSVG attrs={attrs} cor={cor} attrs2={attrComparar} cor2={T.blue}/>
              </div>

              {/* Potencial oculto */}
              <div style={{padding:'12px 14px',background:`${T.gold}08`,border:`1px solid ${T.gold}20`,borderRadius:10,position:'relative',overflow:'hidden'}}>
                <GL/>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                  <div style={{fontSize:10,fontWeight:700,color:T.gold}}>🔮 Potencial Máximo Estimado</div>
                  <div style={{fontSize:10,color:T.gold,fontWeight:700}}>{potMax}</div>
                </div>
                <div style={{height:5,background:T.s2,borderRadius:3,marginBottom:6}}>
                  <div style={{height:'100%',width:`${potMax}%`,background:`linear-gradient(90deg,${T.gold}80,${T.gold})`,borderRadius:3}}/>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                  <span style={{fontSize:9,color:T.muted}}>Revelado pelo geneticista</span>
                  <span style={{fontSize:9,color:T.gold,fontWeight:700}}>{potRev}%</span>
                </div>
                <div style={{height:3,background:T.s2,borderRadius:2}}>
                  <div style={{height:'100%',width:`${potRev}%`,background:`linear-gradient(90deg,#FB923C,${T.gold})`,borderRadius:2}}/>
                </div>
                {potRev<30&&<div style={{fontSize:9,color:T.muted,marginTop:6}}>🔬 Geneticista necessário para revelar mais</div>}
              </div>

              {/* Gene raro */}
              {geneRaro&&(
                <div style={{padding:'12px 14px',background:'linear-gradient(135deg,rgba(201,168,76,.12),rgba(201,168,76,.04))',border:`1px solid ${T.gold}40`,borderRadius:10,position:'relative',overflow:'hidden'}}>
                  <GL/>
                  <div style={{fontSize:10,fontWeight:700,color:T.gold,marginBottom:4}}>💎 Gene Raro Detectado</div>
                  <div style={{fontSize:14,fontWeight:800,color:T.text}}>{geneRaro}</div>
                  <div style={{fontSize:10,color:T.muted,marginTop:4}}>Este gene confere características excepcionais únicas. Extremamente valioso para reprodução.</div>
                </div>
              )}

              {/* Stats vida */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
                {[
                  {l:'Provas',v:pombo.provas||0,c:T.blue},
                  {l:'Vitórias',v:pombo.vitorias||0,c:T.gold},
                  {l:'Filhos',v:filhos.length,c:T.purple},
                ].map((s,i)=>(
                  <div key={i} style={{background:T.s2,borderRadius:8,padding:'10px',textAlign:'center'}}>
                    <div style={{fontFamily:"Georgia,serif",fontSize:18,fontWeight:900,color:s.c}}>{s.v}</div>
                    <div style={{fontSize:8,color:T.muted,fontWeight:700,marginTop:2}}>{s.l.toUpperCase()}</div>
                  </div>
                ))}
              </div>

              {/* Motivação e temperamento */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                {[
                  {l:'Temperamento',v:pombo.temperamento||'Activo'},
                  {l:'Motivação',v:pombo.motivacao||'Competição'},
                ].map((s,i)=>(
                  <div key={i} style={{padding:'10px',background:T.surface,border:`1px solid ${T.s2}`,borderRadius:8,textAlign:'center'}}>
                    <div style={{fontSize:11,fontWeight:700,color:T.text}}>{s.v}</div>
                    <div style={{fontSize:8,color:T.muted,marginTop:2}}>{s.l.toUpperCase()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB ATRIBUTOS */}
          {tab==='attrs'&&(
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              {[
                {key:'fisico',label:'FÍSICO',cor:T.blue,keys:['velocidade','resistencia','recuperacao','forca']},
                {key:'mental',label:'MENTAL',cor:T.purple,keys:['orientacao','inteligencia','instinto','coragem']},
                {key:'oculto',label:'OCULTO (Geneticista)',cor:T.gold,keys:['fertilidade','sangue','potencial_maximo']},
              ].map(g=>(
                <div key={g.key}>
                  <div style={{fontSize:8,color:g.cor,fontWeight:700,letterSpacing:1.5,marginBottom:8}}>{g.label}</div>
                  {g.keys.map(k=>{
                    const NOMES={velocidade:'Velocidade',resistencia:'Resistência',recuperacao:'Recuperação',forca:'Força',orientacao:'Orientação',inteligencia:'Inteligência',instinto:'Instinto',coragem:'Coragem',fertilidade:'Fertilidade',sangue:'Sangue',potencial_maximo:'Pot. Máximo'}
                    const oculto=g.key==='oculto'&&potRev<50
                    const valComparar=attrComparar?.[k]||null
                    return <BarraAttr key={k} label={NOMES[k]||k} valor={attrs[k]||0} oculto={oculto} cor={g.cor} comparar={valComparar}/>
                  })}
                </div>
              ))}
              {comparandoCom&&(
                <div style={{padding:'8px 12px',background:`${T.blue}08`,border:`1px solid ${T.blue}20`,borderRadius:8,fontSize:10,color:T.blue}}>
                  ── Barras azuis = {comparandoCom.nome}
                </div>
              )}
            </div>
          )}

          {/* TAB HISTÓRIA */}
          {tab==='historia'&&(
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {/* Narrativa */}
              <div style={{padding:'14px',background:T.surface,border:`1px solid ${T.s2}`,borderRadius:12,position:'relative',overflow:'hidden'}}>
                <GL/>
                <div style={{fontSize:9,color:T.gold,fontWeight:700,letterSpacing:1,marginBottom:8}}>📖 HISTÓRIA DE VIDA</div>
                <div style={{fontSize:12,color:T.text,lineHeight:1.7,fontStyle:'italic'}}>"{historia}"</div>
              </div>

              {/* Linha do tempo */}
              <div style={{fontSize:9,color:T.muted,fontWeight:700,letterSpacing:1,marginBottom:4}}>MOMENTOS MARCANTES</div>
              {eventosVida.length===0?(
                <div style={{textAlign:'center',padding:'30px',color:T.muted,fontSize:12}}>A história ainda está a ser escrita...</div>
              ):eventosVida.map((ev,i)=>(
                <div key={i} style={{display:'flex',gap:12,alignItems:'flex-start'}}>
                  <div style={{width:32,height:32,borderRadius:'50%',background:ev.destaque?`${T.gold}20`:T.s2,border:`1px solid ${ev.destaque?T.gold:T.s2}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0}}>{ev.icon}</div>
                  <div style={{flex:1,paddingTop:6}}>
                    <div style={{fontSize:12,color:ev.destaque?T.text:T.muted,fontWeight:ev.destaque?600:400}}>{ev.desc}</div>
                    {i<eventosVida.length-1&&<div style={{width:1,height:16,background:T.s2,marginLeft:-20,marginTop:4}}/>}
                  </div>
                </div>
              ))}

              {/* Valor ao longo da carreira */}
              <div style={{padding:'12px 14px',background:T.surface,border:`1px solid ${T.s2}`,borderRadius:10,position:'relative',overflow:'hidden'}}>
                <GL/>
                <div style={{fontSize:9,color:T.muted,fontWeight:700,letterSpacing:1,marginBottom:6}}>VALOR DE MERCADO</div>
                <div style={{fontFamily:"Georgia,serif",fontSize:20,fontWeight:900,color:T.gold}}>{(pombo.valor||0).toLocaleString()}€</div>
                <div style={{fontSize:9,color:T.muted,marginTop:2}}>
                  {(pombo.vitorias||0)>0?`+${(pombo.vitorias||0)*500}€ em vitórias`:''}{geneRaro?` · +5000€ gene raro`:''}
                </div>
              </div>
            </div>
          )}

          {/* TAB GENEALOGIA */}
          {tab==='genea'&&(
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div style={{fontSize:9,color:T.muted,fontWeight:700,letterSpacing:1}}>ÁRVORE GENEALÓGICA</div>

              {/* Este pombo */}
              <div style={{textAlign:'center'}}>
                <div style={{display:'inline-flex',flexDirection:'column',alignItems:'center',gap:4,padding:'12px 20px',background:`${cor}10`,border:`2px solid ${cor}40`,borderRadius:12}}>
                  <div style={{fontSize:15,fontWeight:800,color:cor}}>{pombo.nome}</div>
                  <div style={{fontSize:9,color:T.muted}}>{pombo.anilha}</div>
                  <div style={{display:'flex',gap:1}}>
                    {Array.from({length:5}).map((_,i)=><span key={i} style={{fontSize:8,color:i<pombo.rating?T.gold:'rgba(255,255,255,.08)'}}>{i<pombo.rating?'★':'☆'}</span>)}
                  </div>
                </div>
              </div>

              <div style={{display:'flex',justifyContent:'center'}}><div style={{width:1,height:16,background:T.s2}}/></div>

              {/* Pais */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                {[
                  {role:'PAI ♂',nome:pombo.pai_nome,id:pombo.pai_id,cor:T.blue},
                  {role:'MÃE ♀',nome:pombo.mae_nome,id:pombo.mae_id,cor:'#C084FC'},
                ].map((p,i)=>{
                  const ref = p.id ? (carreira.pombos||[]).find(x=>x.id===p.id) : null
                  return(
                    <div key={i} style={{padding:'12px',background:ref?`${p.cor}10`:T.surface,border:`1px solid ${ref?p.cor+'30':T.s2}`,borderRadius:10,textAlign:'center'}}>
                      <div style={{fontSize:9,color:T.muted,marginBottom:4,fontWeight:600,letterSpacing:.5}}>{p.role}</div>
                      {p.nome ? (
                        <>
                          <div style={{fontSize:12,fontWeight:700,color:p.cor}}>{p.nome}</div>
                          {ref&&<div style={{fontSize:8,color:T.muted,marginTop:2}}>{ref.especialidade}</div>}
                          {ref&&<div style={{display:'flex',gap:1,justifyContent:'center',marginTop:4}}>
                            {Array.from({length:5}).map((_,j)=><span key={j} style={{fontSize:7,color:j<ref.rating?T.gold:'rgba(255,255,255,.08)'}}>{j<ref.rating?'★':'☆'}</span>)}
                          </div>}
                        </>
                      ):(
                        <div style={{fontSize:11,color:T.s2}}>Desconhecido</div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Filhos */}
              {filhos.length>0&&(
                <>
                  <div style={{fontSize:9,color:T.muted,fontWeight:700,letterSpacing:1,marginTop:4}}>
                    DESCENDENTES ({filhos.length})
                  </div>
                  {filhos.map((f,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:T.surface,border:`1px solid ${T.s2}`,borderRadius:8}}>
                      <div style={{width:28,height:28,borderRadius:6,background:`${f.sexo==='F'?'#C084FC':T.blue}15`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"Georgia,serif",fontSize:9,fontWeight:900,color:f.sexo==='F'?'#C084FC':T.blue}}>
                        {f.anilha?.slice(-3)}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:12,fontWeight:600,color:T.text}}>{f.nome}</div>
                        <div style={{fontSize:9,color:T.muted}}>{f.especialidade} · {f.estado==='activo'?'Activo':'Em desenvolvimento'}</div>
                      </div>
                      <div style={{display:'flex',gap:1}}>
                        {Array.from({length:5}).map((_,j)=><span key={j} style={{fontSize:8,color:j<f.rating?T.gold:'rgba(255,255,255,.08)'}}>{j<f.rating?'★':'☆'}</span>)}
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Herança genética estimada */}
              {(pombo.pai_nome||pombo.mae_nome)&&(
                <div style={{padding:'12px 14px',background:`${T.purple}08`,border:`1px solid ${T.purple}20`,borderRadius:10}}>
                  <div style={{fontSize:9,color:T.purple,fontWeight:700,marginBottom:6}}>🧬 HERANÇA GENÉTICA ESTIMADA</div>
                  {['velocidade','resistencia','orientacao'].map(k=>{
                    const pai=(carreira.pombos||[]).find(x=>x.id===pombo.pai_id)?.atributos?.[k]||50
                    const mae=(carreira.pombos||[]).find(x=>x.id===pombo.mae_id)?.atributos?.[k]||50
                    const propria=attrs[k]||0
                    const esperado=Math.round((pai+mae)/2)
                    const NOMES={velocidade:'Velocidade',resistencia:'Resistência',orientacao:'Orientação'}
                    return(
                      <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:`1px solid ${T.s2}`}}>
                        <span style={{fontSize:10,color:T.muted}}>{NOMES[k]}</span>
                        <span style={{fontSize:10,color:propria>esperado?T.success:propria<esperado?T.danger:T.muted,fontWeight:600}}>
                          {propria} {propria>esperado?'↑':propria<esperado?'↓':'='} (esp. {esperado})
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB HISTORIAL */}
          {tab==='hist'&&(
            historico?.length>0 ? (
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:4}}>
                  {[
                    {l:'Provas',v:historico.length,c:T.blue},
                    {l:'Vitórias',v:historico.filter(r=>r.posicao===1).length,c:T.gold},
                    {l:'Melhor',v:`P${historico.length?Math.max(...historico.map(r=>r.percentil||0)):0}%`,c:T.success},
                  ].map((s,i)=>(
                    <div key={i} style={{background:T.s2,borderRadius:8,padding:'8px',textAlign:'center'}}>
                      <div style={{fontFamily:"Georgia,serif",fontSize:16,fontWeight:900,color:s.c}}>{s.v}</div>
                      <div style={{fontSize:8,color:T.muted,fontWeight:700}}>{s.l}</div>
                    </div>
                  ))}
                </div>
                {[...historico].reverse().map((r,i)=>(
                  <div key={i} style={{padding:'10px 14px',background:T.surface,border:`1px solid ${r.posicao===1?T.gold:r.posicao<=3?T.success:T.s2}`,borderRadius:10,position:'relative',overflow:'hidden'}}>
                    {r.posicao===1&&<GL/>}
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
                      <div style={{fontSize:12,fontWeight:700,color:T.text}}>{r.provaNome}</div>
                      <div style={{fontFamily:"Georgia,serif",fontSize:14,fontWeight:900,color:r.posicao===1?T.gold:r.posicao<=3?T.success:T.muted}}>{r.posicao}º/{r.total}</div>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between'}}>
                      <div style={{fontSize:9,color:T.muted}}>Sem.{r.semana}</div>
                      <div style={{fontSize:10,color:T.success,fontWeight:700}}>P{r.percentil}%</div>
                    </div>
                  </div>
                ))}
              </div>
            ):(
              <div style={{textAlign:'center',padding:'40px 20px'}}>
                <div style={{fontSize:40,marginBottom:12}}>📋</div>
                <div style={{fontSize:13,color:T.muted}}>Sem provas ainda</div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function VLPombos({ carreira, onVoltar, onGuardar }) {
  const [cl, setCL] = useState(()=>lerLS()||carreira)
  const c = cl
  const salvar = d => { gravarLS(d); setCL({...d}); onGuardar?.(d) }

  const [filtro, setFiltro] = useState('activos')
  const [ordenar, setOrdenar] = useState('rating')
  const [sel, setSel] = useState(null)
  const [pesquisa, setPesquisa] = useState('')
  const [comparar, setComparar] = useState([])
  const [modoComparar, setModoComparar] = useState(false)

  const todos = c.pombos || []
  const pombos = todos
    .filter(p=>{
      if(pesquisa&&!p.nome?.toLowerCase().includes(pesquisa.toLowerCase())&&!p.anilha?.includes(pesquisa))return false
      if(filtro==='activos') return p.estado==='activo'
      if(filtro==='M') return p.sexo==='M'&&p.estado==='activo'
      if(filtro==='F') return p.sexo==='F'&&p.estado==='activo'
      if(filtro==='jovens') return p.estado!=='activo'
      if(filtro==='elite') return (p.rating||0)>=4&&p.estado==='activo'
      if(filtro==='raros') return p.atributos?.gene_raro_tipo&&p.estado==='activo'
      return true
    })
    .sort((a,b)=>
      ordenar==='rating'?(b.rating||0)-(a.rating||0):
      ordenar==='forma'?(b.forma_atual||70)-(a.forma_atual||70):
      ordenar==='valor'?(b.valor||0)-(a.valor||0):
      a.nome?.localeCompare(b.nome||'')||0
    )

  const pomboSel = sel ? todos.find(p=>p.id===sel) : null
  const historioP = pomboSel ? (c.historico_provas||[]).filter(r=>r.pomboId===pomboSel.id) : []
  const comparandoCom = comparar.length===2 && sel ? todos.find(p=>p.id===comparar.find(id=>id!==sel)) : null

  const activos = todos.filter(p=>p.estado==='activo').length
  const jovens = todos.filter(p=>p.estado!=='activo').length
  const raros = todos.filter(p=>p.atributos?.gene_raro_tipo).length

  return (
    <div style={{minHeight:'100vh',background:T.bg,color:T.text,fontFamily:"system-ui,sans-serif"}}>
      {/* Header */}
      <div style={{background:`linear-gradient(180deg,${T.surface},${T.bg})`,borderBottom:`1px solid ${T.s2}`,padding:'14px 16px',position:'relative'}}>
        <GL/>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
          <button onClick={onVoltar} style={{background:T.surface,border:`1px solid ${T.s2}`,borderRadius:8,width:32,height:32,color:T.muted,cursor:'pointer',fontSize:16}}>←</button>
          <div style={{flex:1}}>
            <div style={{fontSize:16,fontWeight:800}}>🐦 Pombos</div>
            <div style={{display:'flex',gap:8,marginTop:1}}>
              <span style={{fontSize:9,color:T.muted}}>{activos} activos</span>
              {jovens>0&&<span style={{fontSize:9,color:T.blue}}>· {jovens} jovens</span>}
              {raros>0&&<span style={{fontSize:9,color:T.gold}}>· {raros} 💎 raros</span>}
            </div>
          </div>
          <button onClick={()=>setModoComparar(!modoComparar)}
            style={{padding:'6px 10px',background:modoComparar?`${T.purple}20`:'transparent',border:`1px solid ${modoComparar?T.purple:T.s2}`,borderRadius:8,color:modoComparar?T.purple:T.muted,fontSize:10,cursor:'pointer',fontFamily:'inherit',fontWeight:modoComparar?700:400}}>
            ⚖️
          </button>
        </div>

        <input value={pesquisa} onChange={e=>setPesquisa(e.target.value)}
          placeholder="🔍 Nome, anilha..."
          style={{width:'100%',padding:'9px 12px',background:T.surface,border:`1px solid ${T.s2}`,borderRadius:8,color:T.text,fontSize:12,fontFamily:'inherit',outline:'none',boxSizing:'border-box',marginBottom:10}}/>

        <div style={{display:'flex',gap:5,overflowX:'auto',scrollbarWidth:'none'}}>
          {[['activos','Activos'],['M','♂'],['F','♀'],['elite','★4+'],['raros','💎'],['jovens','Jovens'],['todos','Todos']].map(([id,label])=>(
            <button key={id} onClick={()=>setFiltro(id)}
              style={{flex:'none',padding:'6px 10px',borderRadius:7,border:filtro===id?'none':`1px solid ${T.s2}`,background:filtro===id?`${T.blue}25`:'transparent',color:filtro===id?T.blue:T.muted,fontSize:10,fontWeight:filtro===id?700:400,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'}}>
              {label}
            </button>
          ))}
          <select value={ordenar} onChange={e=>setOrdenar(e.target.value)}
            style={{flex:'none',padding:'6px 8px',borderRadius:7,border:`1px solid ${T.s2}`,background:T.surface,color:T.muted,fontSize:10,fontFamily:'inherit',cursor:'pointer',outline:'none'}}>
            <option value="rating">Rating</option>
            <option value="forma">Forma</option>
            <option value="valor">Valor</option>
            <option value="nome">Nome</option>
          </select>
        </div>
      </div>

      <div style={{padding:'12px 16px',display:'flex',flexDirection:'column',gap:10}}>
        {/* Painel comparação */}
        {modoComparar&&comparar.length>0&&(
          <div style={{padding:'10px 14px',background:`${T.purple}08`,border:`1px solid ${T.purple}25`,borderRadius:10}}>
            <div style={{fontSize:9,color:T.purple,fontWeight:700,marginBottom:4}}>⚖️ A COMPARAR: {comparar.map(id=>todos.find(p=>p.id===id)?.nome||'?').join(' vs ')}</div>
            {comparar.length===2&&<button onClick={()=>{setSel(comparar[0])}} style={{fontSize:9,color:T.blue,background:'none',border:'none',cursor:'pointer',padding:0}}>Ver comparação →</button>}
            <button onClick={()=>setComparar([])} style={{float:'right',fontSize:9,color:T.muted,background:'none',border:'none',cursor:'pointer',padding:0}}>Limpar</button>
          </div>
        )}

        {/* Grid */}
        {pombos.length===0?(
          <div style={{textAlign:'center',padding:'40px 20px'}}>
            <div style={{fontSize:40,marginBottom:12}}>🐦</div>
            <div style={{fontSize:13,color:T.muted}}>Nenhum pombo encontrado</div>
          </div>
        ):(
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10}}>
            {pombos.map(p=>{
              const cor = p.sexo==='F'?'#C084FC':T.blue
              const forma = p.forma_atual||70
              const fadiga = p.fadiga||0
              const isSel = sel===p.id
              const isComp = comparar.includes(p.id)
              const pers = p.personalidade_tipo ? PERSONALIDADES[p.personalidade_tipo] : null
              const temGeneRaro = !!p.atributos?.gene_raro_tipo
              const faseLabel = {ovo:'🥚',borrachinho:'🐣',ninhego:'🐤',jovem:'🐦',activo:'🕊️'}[p.fase||p.estado]||'🕊️'
              return(
                <div key={p.id}
                  onClick={()=>{
                    if(modoComparar){setComparar(prev=>prev.includes(p.id)?prev.filter(x=>x!==p.id):prev.length<2?[...prev,p.id]:prev);return}
                    setSel(isSel?null:p.id)
                  }}
                  style={{background:isSel||isComp?`${cor}10`:T.surface,border:`${isSel||isComp?2:1}px solid ${isSel||isComp?cor:T.s2}`,borderRadius:12,padding:'12px',cursor:'pointer',transition:'all .2s',position:'relative',overflow:'hidden'}}>
                  {(isSel||isComp)&&<GL/>}
                  {/* Badges topo */}
                  <div style={{position:'absolute',top:8,right:8,display:'flex',gap:3}}>
                    {temGeneRaro&&<span style={{fontSize:10}}>💎</span>}
                    {p.lesao&&<span style={{fontSize:10}}>🤕</span>}
                    <span style={{fontSize:11,color:cor,fontWeight:700}}>{p.sexo==='M'?'♂':'♀'}</span>
                  </div>
                  {/* Avatar */}
                  <div style={{width:44,height:44,borderRadius:10,background:`${cor}15`,border:`1.5px solid ${cor}30`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:8,position:'relative'}}>
                    <span style={{fontFamily:"Georgia,serif",fontSize:14,fontWeight:900,color:cor}}>{p.anilha?.slice(-3)}</span>
                  </div>
                  <div style={{fontSize:13,fontWeight:800,color:T.text,marginBottom:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.nome}</div>
                  <div style={{fontSize:9,color:T.muted,marginBottom:5}}>{p.anilha}</div>
                  <div style={{display:'flex',gap:1,marginBottom:5}}>
                    {Array.from({length:5}).map((_,i)=><span key={i} style={{fontSize:9,color:i<p.rating?T.gold:'rgba(255,255,255,.08)'}}>{i<p.rating?'★':'☆'}</span>)}
                  </div>
                  {pers&&<div style={{fontSize:8,color:pers.cor,fontWeight:600,marginBottom:5}}>{pers.icon} {pers.label}</div>}
                  {p.estado==='activo'?(
                    <div style={{display:'flex',gap:4}}>
                      <div style={{flex:1,height:3,background:T.s2,borderRadius:2,overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${forma}%`,background:forma>=70?T.success:forma>=50?T.gold:T.danger}}/>
                      </div>
                      <div style={{flex:1,height:3,background:T.s2,borderRadius:2,overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${fadiga}%`,background:fadiga>60?T.danger:T.gold}}/>
                      </div>
                    </div>
                  ):<div style={{fontSize:8,color:T.muted}}>{faseLabel} Desenvolvimento</div>}
                  {isComp&&<div style={{position:'absolute',bottom:6,right:6,width:16,height:16,borderRadius:'50%',background:T.purple,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,color:'#fff',fontWeight:700}}>{comparar.indexOf(p.id)+1}</div>}
                </div>
              )
            })}
          </div>
        )}

        {/* Resumo */}
        <div style={{background:T.surface,border:`1px solid ${T.s2}`,borderRadius:10,padding:'12px 14px',position:'relative',overflow:'hidden'}}>
          <GL/>
          <div style={{fontSize:8,color:T.blue,fontWeight:700,letterSpacing:1.5,marginBottom:8}}>RESUMO DO PLANTEL</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6,textAlign:'center'}}>
            {[
              {l:'♂',n:todos.filter(p=>p.sexo==='M'&&p.estado==='activo').length,c:T.blue},
              {l:'♀',n:todos.filter(p=>p.sexo==='F'&&p.estado==='activo').length,c:'#C084FC'},
              {l:'★4+',n:todos.filter(p=>(p.rating||0)>=4).length,c:T.gold},
              {l:'💎',n:raros,c:T.gold},
            ].map((s,i)=>(
              <div key={i}>
                <div style={{fontFamily:"Georgia,serif",fontSize:17,fontWeight:900,color:s.c}}>{s.n}</div>
                <div style={{fontSize:8,color:T.muted,fontWeight:600}}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {pomboSel&&(
        <FichaDigitalTwin
          pombo={pomboSel}
          onFechar={()=>setSel(null)}
          historico={historioP}
          carreira={c}
          comparandoCom={comparandoCom}
        />
      )}
    </div>
  )
}
