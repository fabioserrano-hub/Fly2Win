// src/modules/virtualLoft/screens/VLPombos.jsx — V3 Ficha completa estilo FM
import { useState } from 'react'

const T={bg:'#050A14',surface:'#0D1829',s2:'#1A2A45',gold:'#C9A84C',blue:'#4FC3F7',text:'#E8EDF5',muted:'#6B7A99',success:'#2DD4A7',danger:'#F87171',purple:'#A855F7'}
function lerLS(){try{return JSON.parse(localStorage.getItem('vl_carreira'))}catch{return null}}
function gravarLS(d){try{localStorage.setItem('vl_carreira',JSON.stringify(d))}catch{}}
function GL(){return <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,#C9A84C,transparent)',opacity:.8}}/>}

const ATTRS=[
  {key:'velocidade',label:'VEL',full:'Velocidade',grupo:'fisico'},
  {key:'resistencia',label:'RES',full:'Resistência',grupo:'fisico'},
  {key:'recuperacao',label:'REC',full:'Recuperação',grupo:'fisico'},
  {key:'forca',label:'FOR',full:'Força',grupo:'fisico'},
  {key:'orientacao',label:'ORI',full:'Orientação',grupo:'mental'},
  {key:'inteligencia',label:'INT',full:'Inteligência',grupo:'mental'},
  {key:'instinto',label:'INS',full:'Instinto',grupo:'mental'},
  {key:'coragem',label:'COR',full:'Coragem',grupo:'mental'},
  {key:'fertilidade',label:'FER',full:'Fertilidade',grupo:'genetico'},
  {key:'sangue',label:'SAN',full:'Sangue',grupo:'genetico'},
]

function corAttr(v){return v>=85?'#2DD4A7':v>=70?'#4FC3F7':v>=50?'#C9A84C':v>=30?'#FB923C':'#F87171'}
function corForma(v){return v>=80?'#2DD4A7':v>=60?'#4FC3F7':v>=40?'#C9A84C':'#F87171'}
function labelForma(v){return v>=80?'Excelente':v>=60?'Boa':v>=40?'Regular':'Baixa'}

// Gráfico radar SVG
function RadarChart({attrs,cor='#C9A84C'}){
  const keys=['velocidade','resistencia','orientacao','instinto','coragem','recuperacao']
  const n=keys.length
  const cx=50,cy=50,r=38
  const pts=keys.map((k,i)=>{
    const angle=(i*2*Math.PI/n)-Math.PI/2
    const val=(attrs[k]||0)/100
    return{x:cx+r*val*Math.cos(angle),y:cy+r*val*Math.sin(angle)}
  })
  const polyPts=pts.map(p=>`${p.x},${p.y}`).join(' ')
  // Grelha
  const gridLevels=[0.25,0.5,0.75,1]
  return(
    <svg viewBox="0 0 100 100" style={{width:'100%',maxWidth:180,margin:'0 auto',display:'block'}}>
      {/* Grelha */}
      {gridLevels.map(lv=>{
        const gpts=keys.map((_,i)=>{
          const angle=(i*2*Math.PI/n)-Math.PI/2
          return`${cx+r*lv*Math.cos(angle)},${cy+r*lv*Math.sin(angle)}`
        })
        return<polygon key={lv} points={gpts.join(' ')} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth=".5"/>
      })}
      {/* Eixos */}
      {keys.map((_,i)=>{
        const angle=(i*2*Math.PI/n)-Math.PI/2
        return<line key={i} x1={cx} y1={cy} x2={cx+r*Math.cos(angle)} y2={cy+r*Math.sin(angle)} stroke="rgba(255,255,255,.06)" strokeWidth=".5"/>
      })}
      {/* Área */}
      <polygon points={polyPts} fill={`${cor}25`} stroke={cor} strokeWidth="1.5" strokeLinejoin="round"/>
      {/* Pontos */}
      {pts.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="2.5" fill={cor}/>)}
      {/* Labels */}
      {keys.map((k,i)=>{
        const angle=(i*2*Math.PI/n)-Math.PI/2
        const lx=cx+(r+8)*Math.cos(angle)
        const ly=cy+(r+8)*Math.sin(angle)
        const attr=ATTRS.find(a=>a.key===k)
        return<text key={k} x={lx} y={ly+1.5} textAnchor="middle" fontSize="5" fill="rgba(255,255,255,.4)" fontWeight="600">{attr?.label}</text>
      })}
    </svg>
  )
}

// Gráfico de evolução simples
function EvolucaoChart({historico,cor}){
  if(!historico||historico.length<2)return null
  const vals=historico.slice(-10)
  const max=100,min=0,w=100,h=30
  const pts=vals.map((v,i)=>`${(i/(vals.length-1))*w},${h-((v-min)/(max-min))*h}`).join(' ')
  return(
    <svg viewBox={`0 0 ${w} ${h}`} style={{width:'100%',height:30}}>
      <polyline points={pts} fill="none" stroke={cor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {vals.map((v,i)=>{
        const x=(i/(vals.length-1))*w
        const y=h-((v-min)/(max-min))*h
        return<circle key={i} cx={x} cy={y} r="2" fill={cor}/>
      })}
    </svg>
  )
}

// Ficha detalhada FM-style
function FichaPombo({pombo,onFechar,historico,carreira}){
  const [tab,setTab]=useState('visao')
  const isFemea=pombo.sexo==='F'
  const cor=isFemea?'#C084FC':T.blue
  const attrs=pombo.atributos||{}
  const potRev=attrs.potencial_revelado||0
  const forma=pombo.forma_atual||70
  const fadiga=pombo.fadiga||0
  const lesao=pombo.lesao||null

  // Calcular rating de performance
  const attrMedia=(ATTRS.slice(0,8).reduce((s,a)=>s+(attrs[a.key]||50),0)/8).toFixed(0)

  const TABS=[
    {id:'visao',label:'Visão Geral'},
    {id:'atributos',label:'Atributos'},
    {id:'historial',label:'Historial'},
    {id:'genealogia',label:'Genealogia'},
  ]

  return(
    <div style={{position:'fixed',inset:0,background:'rgba(3,6,16,.97)',zIndex:1000,overflowY:'auto',fontFamily:"system-ui,sans-serif"}}>
      <div style={{background:T.bg,minHeight:'100vh',maxWidth:480,margin:'0 auto'}}>
        {/* Hero do pombo */}
        <div style={{background:`linear-gradient(135deg,${cor}18,${T.bg})`,padding:'20px 16px 16px',borderBottom:`1px solid ${T.s2}`,position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${cor},transparent)`}}/>
          <div style={{position:'absolute',top:-40,right:-40,width:150,height:150,background:`radial-gradient(circle,${cor}10,transparent)`,pointerEvents:'none'}}/>

          <button onClick={onFechar} style={{position:'absolute',top:14,right:14,background:T.s2,border:'none',borderRadius:8,width:32,height:32,color:T.muted,cursor:'pointer',fontSize:14,zIndex:1}}>✕</button>

          <div style={{display:'flex',gap:14,alignItems:'flex-start',marginBottom:12}}>
            {/* Avatar */}
            <div style={{width:72,height:72,borderRadius:16,background:`${cor}15`,border:`2px solid ${cor}40`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,position:'relative'}}>
              <span style={{fontFamily:"Georgia,serif",fontSize:24,fontWeight:900,color:cor}}>{pombo.anilha?.slice(-3)}</span>
              {lesao&&<div style={{position:'absolute',bottom:-4,right:-4,width:18,height:18,borderRadius:'50%',background:T.danger,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9}}>🤕</div>}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:20,fontWeight:900,color:T.text,letterSpacing:-.4,lineHeight:1}}>{pombo.nome}</div>
              <div style={{fontSize:10,color:T.muted,marginTop:3}}>{pombo.sexo==='M'?'♂ Macho':'♀ Fêmea'} · {pombo.anilha} · {pombo.ano}</div>
              <div style={{display:'flex',gap:2,marginTop:6}}>
                {Array.from({length:5}).map((_,i)=><div key={i} style={{fontSize:13,color:i<pombo.rating?T.gold:'rgba(255,255,255,.08)'}}>{i<pombo.rating?'★':'☆'}</div>)}
              </div>
            </div>
            {/* Rating numérico */}
            <div style={{background:T.s2,borderRadius:10,padding:'8px 10px',textAlign:'center',border:`1px solid ${T.s2}`}}>
              <div style={{fontFamily:"Georgia,serif",fontSize:22,fontWeight:900,color:corAttr(parseInt(attrMedia)),lineHeight:1}}>{attrMedia}</div>
              <div style={{fontSize:7,color:T.muted,fontWeight:700,letterSpacing:.5}}>RATING</div>
            </div>
          </div>

          {/* Badges */}
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            <span style={{padding:'3px 9px',background:`${cor}15`,border:`1px solid ${cor}30`,borderRadius:5,fontSize:9,color:cor,fontWeight:700}}>{pombo.especialidade}</span>
            {(pombo.personalidade||[]).map((p,i)=><span key={i} style={{padding:'3px 9px',background:T.s2,borderRadius:5,fontSize:9,color:T.muted}}>{p}</span>)}
            {lesao&&<span style={{padding:'3px 9px',background:`${T.danger}15`,border:`1px solid ${T.danger}30`,borderRadius:5,fontSize:9,color:T.danger,fontWeight:700}}>🤕 {lesao}</span>}
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:'flex',borderBottom:`1px solid ${T.s2}`,overflowX:'auto',scrollbarWidth:'none'}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{flex:'none',padding:'11px 14px',background:'none',border:'none',borderBottom:tab===t.id?`2px solid ${cor}`:'2px solid transparent',color:tab===t.id?cor:T.muted,fontSize:11,fontWeight:tab===t.id?700:400,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap',transition:'all .15s'}}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{padding:'14px 16px'}}>

          {/* VISÃO GERAL */}
          {tab==='visao'&&(
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              {/* Forma e fadiga */}
              <div style={{background:T.surface,border:`1px solid ${T.s2}`,borderRadius:12,padding:'14px',position:'relative',overflow:'hidden'}}>
                <GL/>
                <div style={{fontSize:9,color:T.muted,fontWeight:700,letterSpacing:1,marginBottom:10}}>CONDIÇÃO ACTUAL</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  <div>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                      <span style={{fontSize:10,color:T.muted}}>Forma</span>
                      <span style={{fontSize:10,color:corForma(forma),fontWeight:700}}>{labelForma(forma)}</span>
                    </div>
                    <div style={{height:6,background:T.s2,borderRadius:3,overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${forma}%`,background:corForma(forma),borderRadius:3,boxShadow:`0 0 6px ${corForma(forma)}60`}}/>
                    </div>
                    <div style={{fontSize:11,fontWeight:700,color:corForma(forma),marginTop:4,fontVariantNumeric:'tabular-nums'}}>{forma}%</div>
                  </div>
                  <div>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                      <span style={{fontSize:10,color:T.muted}}>Fadiga</span>
                      <span style={{fontSize:10,color:fadiga>60?T.danger:fadiga>30?T.gold:T.success,fontWeight:700}}>{fadiga<30?'Descansado':fadiga<60?'Normal':'Cansado'}</span>
                    </div>
                    <div style={{height:6,background:T.s2,borderRadius:3,overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${fadiga}%`,background:fadiga>60?T.danger:fadiga>30?T.gold:T.success,borderRadius:3}}/>
                    </div>
                    <div style={{fontSize:11,fontWeight:700,color:fadiga>60?T.danger:fadiga>30?T.gold:T.success,marginTop:4,fontVariantNumeric:'tabular-nums'}}>{fadiga}%</div>
                  </div>
                </div>
                {fadiga>70&&<div style={{marginTop:8,padding:'6px 10px',background:`${T.danger}0A`,border:`1px solid ${T.danger}25`,borderRadius:6,fontSize:10,color:T.danger}}>⚠️ Fadiga elevada — descanso recomendado antes da próxima prova</div>}
              </div>

              {/* Radar */}
              <div style={{background:T.surface,border:`1px solid ${T.s2}`,borderRadius:12,padding:'14px',position:'relative',overflow:'hidden'}}>
                <GL/>
                <div style={{fontSize:9,color:T.muted,fontWeight:700,letterSpacing:1,marginBottom:8}}>PERFIL DE ATRIBUTOS</div>
                <RadarChart attrs={attrs} cor={cor}/>
              </div>

              {/* Potencial oculto */}
              <div style={{padding:'12px 14px',background:`${T.gold}08`,border:`1px solid ${T.gold}20`,borderRadius:10,position:'relative',overflow:'hidden'}}>
                <GL/>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                  <div style={{fontSize:10,fontWeight:700,color:T.gold}}>🔮 Potencial Oculto</div>
                  <div style={{fontSize:10,color:T.gold,fontWeight:700}}>{potRev}% revelado</div>
                </div>
                <div style={{height:5,background:T.s2,borderRadius:3}}>
                  <div style={{height:'100%',width:`${potRev}%`,background:`linear-gradient(90deg,${T.gold},#FB923C)`,borderRadius:3,boxShadow:`0 0 8px ${T.gold}40`}}/>
                </div>
                <div style={{fontSize:9,color:T.muted,marginTop:6}}>
                  {potRev<30?'Potencial ainda muito desconhecido':potRev<60?'Algum potencial revelado — continua a treinar':potRev<90?'Perfil genético quase completo':'Perfil genético totalmente conhecido'}
                </div>
              </div>

              {/* Stats rápidos */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
                {[
                  {l:'Provas',v:pombo.provas||0,c:T.blue},
                  {l:'Vitórias',v:pombo.vitorias||0,c:T.gold},
                  {l:'P. Médio',v:`${pombo.percentil_medio||0}%`,c:T.success},
                ].map((s,i)=>(
                  <div key={i} style={{background:T.s2,borderRadius:8,padding:'10px',textAlign:'center'}}>
                    <div style={{fontFamily:"Georgia,serif",fontSize:17,fontWeight:900,color:s.c}}>{s.v}</div>
                    <div style={{fontSize:8,color:T.muted,fontWeight:700,marginTop:2}}>{s.l.toUpperCase()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ATRIBUTOS */}
          {tab==='atributos'&&(
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              {[
                {key:'fisico',label:'Físico',cor:T.blue,keys:['velocidade','resistencia','recuperacao','forca']},
                {key:'mental',label:'Mental',cor:T.purple,keys:['orientacao','inteligencia','instinto','coragem']},
                {key:'genetico',label:'Genético',cor:T.gold,keys:['fertilidade','sangue']},
              ].map(g=>(
                <div key={g.key}>
                  <div style={{fontSize:8,color:g.cor,fontWeight:700,letterSpacing:1.5,marginBottom:8}}>{g.label.toUpperCase()}</div>
                  {g.keys.map(k=>{
                    const attr=ATTRS.find(a=>a.key===k)
                    const val=attrs[k]||0
                    const oculto=potRev<30&&['instinto','sangue'].includes(k)
                    const c=oculto?T.s2:corAttr(val)
                    return(
                      <div key={k} style={{display:'flex',alignItems:'center',gap:8,padding:'4px 0'}}>
                        <div style={{width:80,fontSize:9,color:T.muted,fontWeight:600,letterSpacing:.3}}>{attr?.full?.toUpperCase()}</div>
                        <div style={{flex:1,height:6,background:'rgba(255,255,255,.05)',borderRadius:3,overflow:'hidden'}}>
                          <div style={{height:'100%',width:oculto?'35%':`${val}%`,background:oculto?`repeating-linear-gradient(45deg,${T.s2},${T.s2} 3px,${T.bg} 3px,${T.bg} 6px)`:c,borderRadius:3,transition:'width .5s ease',boxShadow:oculto?'none':`0 0 4px ${c}50`}}/>
                        </div>
                        <div style={{width:26,fontSize:11,fontWeight:700,color:oculto?T.s2:c,textAlign:'right',fontVariantNumeric:'tabular-nums'}}>{oculto?'?':val}</div>
                      </div>
                    )
                  })}
                </div>
              ))}
              {/* Evolução */}
              {pombo.historico_forma&&pombo.historico_forma.length>1&&(
                <div style={{background:T.surface,border:`1px solid ${T.s2}`,borderRadius:10,padding:'12px',position:'relative',overflow:'hidden'}}>
                  <GL/>
                  <div style={{fontSize:9,color:T.muted,fontWeight:700,letterSpacing:1,marginBottom:8}}>EVOLUÇÃO DA FORMA</div>
                  <EvolucaoChart historico={pombo.historico_forma} cor={corForma(pombo.forma_atual||70)}/>
                </div>
              )}
            </div>
          )}

          {/* HISTORIAL */}
          {tab==='historial'&&(
            historico?.length>0?(
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

          {/* GENEALOGIA */}
          {tab==='genealogia'&&(
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div style={{fontSize:9,color:T.muted,fontWeight:700,letterSpacing:1}}>ÁRVORE GENEALÓGICA</div>
              {/* Geração actual */}
              <div style={{textAlign:'center'}}>
                <div style={{display:'inline-flex',flexDirection:'column',alignItems:'center',gap:4,padding:'12px 20px',background:`${cor}10`,border:`2px solid ${cor}40`,borderRadius:12}}>
                  <div style={{fontSize:15,fontWeight:800,color:cor}}>{pombo.nome}</div>
                  <div style={{fontSize:9,color:T.muted}}>{pombo.anilha} · {pombo.ano}</div>
                  <div style={{display:'flex',gap:1}}>
                    {Array.from({length:5}).map((_,i)=><div key={i} style={{fontSize:8,color:i<pombo.rating?T.gold:'rgba(255,255,255,.08)'}}>{i<pombo.rating?'★':'☆'}</div>)}
                  </div>
                </div>
              </div>
              {/* Linha */}
              <div style={{display:'flex',justifyContent:'center'}}>
                <div style={{width:1,height:20,background:T.s2}}/>
              </div>
              {/* Pais */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                {[
                  {role:'PAI ♂',nome:pombo.pai_nome,id:pombo.pai_id,cor:T.blue},
                  {role:'MÃE ♀',nome:pombo.mae_nome,id:pombo.mae_id,cor:'#C084FC'},
                ].map((p,i)=>{
                  const pomboRef=p.id?(carreira.pombos||[]).find(x=>x.id===p.id):null
                  return(
                    <div key={i} style={{padding:'12px',background:pomboRef?`${p.cor}10`:T.surface,border:`1px solid ${pomboRef?p.cor+'30':T.s2}`,borderRadius:10,textAlign:'center'}}>
                      <div style={{fontSize:9,color:T.muted,marginBottom:4,fontWeight:600,letterSpacing:.5}}>{p.role}</div>
                      {p.nome?(
                        <>
                          <div style={{fontSize:12,fontWeight:700,color:p.cor}}>{p.nome}</div>
                          {pomboRef&&(
                            <div style={{display:'flex',gap:1,justifyContent:'center',marginTop:4}}>
                              {Array.from({length:5}).map((_,j)=><div key={j} style={{fontSize:8,color:j<pomboRef.rating?T.gold:'rgba(255,255,255,.08)'}}>{j<pomboRef.rating?'★':'☆'}</div>)}
                            </div>
                          )}
                        </>
                      ):(
                        <div style={{fontSize:11,color:T.s2}}>Desconhecido</div>
                      )}
                    </div>
                  )
                })}
              </div>
              {/* Filhos */}
              {(()=>{
                const filhos=(carreira.pombos||[]).filter(p=>p.pai_id===pombo.id||p.mae_id===pombo.id)
                if(!filhos.length)return null
                return(
                  <>
                    <div style={{fontSize:9,color:T.muted,fontWeight:700,letterSpacing:1,marginTop:4}}>DESCENDENTES ({filhos.length})</div>
                    {filhos.map((f,i)=>(
                      <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:T.surface,border:`1px solid ${T.s2}`,borderRadius:8}}>
                        <span style={{fontSize:14}}>{f.sexo==='M'?'♂':'♀'}</span>
                        <div style={{flex:1}}>
                          <div style={{fontSize:12,fontWeight:600,color:T.text}}>{f.nome}</div>
                          <div style={{fontSize:9,color:T.muted}}>{f.anilha} · {f.estado==='activo'?'Activo':'Em desenvolvimento'}</div>
                        </div>
                        <div style={{display:'flex',gap:1}}>
                          {Array.from({length:5}).map((_,j)=><div key={j} style={{fontSize:7,color:j<f.rating?T.gold:'rgba(255,255,255,.08)'}}>{j<f.rating?'★':'☆'}</div>)}
                        </div>
                      </div>
                    ))}
                  </>
                )
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function VLPombos({carreira,onVoltar,onGuardar}){
  const [cl,setCL]=useState(()=>lerLS()||carreira)
  const c=cl
  const salvar=(d)=>{gravarLS(d);setCL({...d});onGuardar?.(d)}

  const [filtro,setFiltro]=useState('activos')
  const [ordenar,setOrdenar]=useState('rating')
  const [sel,setSel]=useState(null)
  const [pesquisa,setPesquisa]=useState('')
  const [comparar,setComparar]=useState([])
  const [modoComparar,setModoComparar]=useState(false)

  const todos=c.pombos||[]
  const pombos=todos
    .filter(p=>{
      if(pesquisa&&!p.nome?.toLowerCase().includes(pesquisa.toLowerCase())&&!p.anilha?.includes(pesquisa))return false
      if(filtro==='activos')return p.estado==='activo'
      if(filtro==='M')return p.sexo==='M'&&p.estado==='activo'
      if(filtro==='F')return p.sexo==='F'&&p.estado==='activo'
      if(filtro==='jovens')return p.estado!=='activo'
      if(filtro==='lesao')return p.lesao
      return true
    })
    .sort((a,b)=>ordenar==='rating'?(b.rating||0)-(a.rating||0):ordenar==='forma'?(b.forma_atual||70)-(a.forma_atual||70):ordenar==='nome'?a.nome?.localeCompare(b.nome||'')||0:(b.valor||0)-(a.valor||0))

  const pomboSel=sel?todos.find(p=>p.id===sel):null
  const historicoP=pomboSel?(c.historico_provas||[]).filter(r=>r.pomboId===pomboSel.id):[]

  const activos=todos.filter(p=>p.estado==='activo').length
  const jovens=todos.filter(p=>p.estado!=='activo').length
  const comLesao=todos.filter(p=>p.lesao).length

  return(
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
              {comLesao>0&&<span style={{fontSize:9,color:T.danger}}>· {comLesao} lesionados</span>}
            </div>
          </div>
          <button onClick={()=>setModoComparar(!modoComparar)}
            style={{padding:'6px 10px',background:modoComparar?`${T.purple}20`:'transparent',border:`1px solid ${modoComparar?T.purple:T.s2}`,borderRadius:8,color:modoComparar?T.purple:T.muted,fontSize:10,cursor:'pointer',fontFamily:'inherit',fontWeight:modoComparar?700:400}}>
            ⚖️ {modoComparar?'Comparar':'Comparar'}
          </button>
        </div>
        <input value={pesquisa} onChange={e=>setPesquisa(e.target.value)}
          placeholder="🔍 Nome ou anilha..."
          style={{width:'100%',padding:'9px 12px',background:T.surface,border:`1px solid ${T.s2}`,borderRadius:8,color:T.text,fontSize:12,fontFamily:'inherit',outline:'none',boxSizing:'border-box',marginBottom:10}}/>
        <div style={{display:'flex',gap:5,overflowX:'auto',scrollbarWidth:'none'}}>
          {[['activos','Activos'],['M','♂'],['F','♀'],['jovens','Jovens'],['lesao','🤕'],['todos','Todos']].map(([id,label])=>(
            <button key={id} onClick={()=>setFiltro(id)}
              style={{flex:'none',padding:'6px 10px',borderRadius:7,border:filtro===id?'none':`1px solid ${T.s2}`,background:filtro===id?`${T.blue}25`:'transparent',color:filtro===id?T.blue:T.muted,fontSize:10,fontWeight:filtro===id?700:400,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'}}>
              {label}
            </button>
          ))}
          <select value={ordenar} onChange={e=>setOrdenar(e.target.value)}
            style={{flex:'none',padding:'6px 8px',borderRadius:7,border:`1px solid ${T.s2}`,background:T.surface,color:T.muted,fontSize:10,fontFamily:'inherit',cursor:'pointer',outline:'none'}}>
            <option value="rating">Rating</option>
            <option value="forma">Forma</option>
            <option value="nome">Nome</option>
            <option value="valor">Valor</option>
          </select>
        </div>
      </div>

      <div style={{padding:'12px 16px',display:'flex',flexDirection:'column',gap:10}}>

        {/* Modo comparar */}
        {modoComparar&&comparar.length===2&&(
          <div style={{background:`${T.purple}08`,border:`1px solid ${T.purple}30`,borderRadius:12,padding:'12px',position:'relative',overflow:'hidden'}}>
            <GL/>
            <div style={{fontSize:9,color:T.purple,fontWeight:700,letterSpacing:1,marginBottom:10}}>⚖️ COMPARAÇÃO</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              {comparar.map((pid,ci)=>{
                const p=todos.find(x=>x.id===pid)
                if(!p)return null
                const cor=p.sexo==='F'?'#C084FC':T.blue
                return(
                  <div key={pid} style={{padding:'10px',background:T.surface,borderRadius:8,border:`1px solid ${cor}30`}}>
                    <div style={{fontSize:12,fontWeight:700,color:cor,marginBottom:4}}>{p.nome}</div>
                    {ATTRS.slice(0,6).map(a=>{
                      const val=p.atributos?.[a.key]||0
                      const outro=todos.find(x=>x.id===comparar[1-ci])?.atributos?.[a.key]||0
                      const melhor=val>outro
                      return(
                        <div key={a.key} style={{display:'flex',justifyContent:'space-between',padding:'2px 0'}}>
                          <span style={{fontSize:9,color:T.muted}}>{a.label}</span>
                          <span style={{fontSize:9,fontWeight:700,color:melhor?T.success:T.muted}}>{val}{melhor?' ↑':''}</span>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
            <button onClick={()=>{setComparar([]);setModoComparar(false)}} style={{marginTop:8,width:'100%',padding:'6px',borderRadius:6,border:`1px solid ${T.s2}`,background:'transparent',color:T.muted,fontSize:10,cursor:'pointer',fontFamily:'inherit'}}>
              Fechar comparação
            </button>
          </div>
        )}

        {/* Grid de pombos */}
        {pombos.length===0?(
          <div style={{textAlign:'center',padding:'40px 20px'}}>
            <div style={{fontSize:40,marginBottom:12}}>🐦</div>
            <div style={{fontSize:13,color:T.muted}}>Nenhum pombo encontrado</div>
          </div>
        ):(
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10}}>
            {pombos.map(p=>{
              const isFemea=p.sexo==='F'
              const cor=isFemea?'#C084FC':T.blue
              const activo=p.estado==='activo'
              const forma=p.forma_atual||70
              const fadiga=p.fadiga||0
              const isSel=sel===p.id
              const isComparing=comparar.includes(p.id)
              const faseLabel={ovo:'🥚 Ovo',borrachinho:'🐣',ninhego:'🐤',jovem:'🐦',activo:'🕊️'}[p.fase||p.estado]||'🕊️'
              return(
                <div key={p.id}
                  onClick={()=>{
                    if(modoComparar){setComparar(prev=>prev.includes(p.id)?prev.filter(x=>x!==p.id):prev.length<2?[...prev,p.id]:prev);return}
                    setSel(isSel?null:p.id)
                  }}
                  style={{background:isSel||isComparing?`${cor}10`:T.surface,border:`${isSel||isComparing?2:1}px solid ${isSel||isComparing?cor:T.s2}`,borderRadius:12,padding:'12px',cursor:'pointer',transition:'all .2s',position:'relative',overflow:'hidden'}}>
                  {(isSel||isComparing)&&<GL/>}
                  {/* Badges estado */}
                  <div style={{position:'absolute',top:8,right:8,display:'flex',gap:4}}>
                    {p.lesao&&<span style={{fontSize:10}}>🤕</span>}
                    <span style={{fontSize:10,color:cor,fontWeight:700}}>{p.sexo==='M'?'♂':'♀'}</span>
                  </div>
                  {/* Avatar */}
                  <div style={{width:44,height:44,borderRadius:10,background:`${cor}15`,border:`1.5px solid ${cor}30`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:8}}>
                    <span style={{fontFamily:"Georgia,serif",fontSize:14,fontWeight:900,color:cor}}>{p.anilha?.slice(-3)}</span>
                  </div>
                  <div style={{fontSize:13,fontWeight:800,color:T.text,marginBottom:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.nome}</div>
                  <div style={{fontSize:9,color:T.muted,marginBottom:5}}>{p.anilha}</div>
                  {/* Estrelas */}
                  <div style={{display:'flex',gap:1,marginBottom:5}}>
                    {Array.from({length:5}).map((_,i)=><div key={i} style={{fontSize:9,color:i<p.rating?T.gold:'rgba(255,255,255,.08)'}}>{i<p.rating?'★':'☆'}</div>)}
                  </div>
                  <div style={{fontSize:9,color:cor,fontWeight:600,marginBottom:6}}>{p.especialidade}</div>
                  {/* Mini barras forma/fadiga */}
                  {activo&&(
                    <div style={{display:'flex',gap:4}}>
                      <div style={{flex:1,height:3,background:T.s2,borderRadius:2,overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${forma}%`,background:corForma(forma)}}/>
                      </div>
                      <div style={{flex:1,height:3,background:T.s2,borderRadius:2,overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${fadiga}%`,background:fadiga>60?T.danger:T.gold}}/>
                      </div>
                    </div>
                  )}
                  {!activo&&<span style={{fontSize:8,color:T.muted}}>{faseLabel} Em desenvolvimento</span>}
                  {isComparing&&<div style={{position:'absolute',bottom:6,right:6,width:16,height:16,borderRadius:'50%',background:T.purple,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,color:'#fff',fontWeight:700}}>{comparar.indexOf(p.id)+1}</div>}
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
              {l:'★4+',n:todos.filter(p=>p.rating>=4).length,c:T.gold},
              {l:'🐣',n:jovens,c:T.muted},
            ].map((s,i)=>(
              <div key={i}>
                <div style={{fontFamily:"Georgia,serif",fontSize:17,fontWeight:900,color:s.c}}>{s.n}</div>
                <div style={{fontSize:8,color:T.muted,fontWeight:600}}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ficha detalhada */}
      {pomboSel&&<FichaPombo pombo={pomboSel} onFechar={()=>setSel(null)} historico={historicoP} carreira={c}/>}
    </div>
  )
}
