// src/modules/virtualLoft/screens/VLHallOfFame.jsx — V2 Entrada automática
import { useState, useEffect } from 'react'

const T={bg:'#050A14',surface:'#0D1829',s2:'#1A2A45',gold:'#C9A84C',blue:'#4FC3F7',text:'#E8EDF5',muted:'#6B7A99',success:'#2DD4A7',danger:'#F87171',purple:'#A855F7'}
function lerLS(){try{return JSON.parse(localStorage.getItem('vl_carreira'))}catch{return null}}
function gravarLS(d){try{localStorage.setItem('vl_carreira',JSON.stringify(d))}catch{}}
function GL(){return <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,#C9A84C,transparent)',opacity:.8}}/>}

// Critérios de entrada automática
const CRITERIOS=[
  {id:'vitorias3', icon:'🥇', titulo:'Trio de Ouro',      desc:'3 vitórias em prova',          check:(p,h)=>h.filter(r=>r.pomboId===p.id&&r.posicao===1).length>=3, tipo:'campeao'},
  {id:'top5_5',   icon:'⭐', titulo:'Top Consistente',   desc:'5 resultados no top 10%',       check:(p,h)=>h.filter(r=>r.pomboId===p.id&&(r.percentil||0)>=90).length>=5, tipo:'destaque'},
  {id:'rating5',  icon:'💫', titulo:'5 Estrelas',         desc:'Rating máximo de 5 estrelas',   check:(p)=>(p.rating||0)>=5, tipo:'lenda'},
  {id:'geneRaro', icon:'💎', titulo:'Gene Lendário',      desc:'Portador de gene raro',         check:(p)=>!!p.atributos?.gene_raro_tipo, tipo:'genetica'},
  {id:'filhos5',  icon:'🌳', titulo:'Reprodutor de Elite',desc:'5 ou mais descendentes',        check:(p,h,todos)=>todos.filter(x=>x.pai_id===p.id||x.mae_id===p.id).length>=5, tipo:'reprodutor'},
]

const TIPO_CFG={
  campeao:   {cor:'#C9A84C',icon:'🏆',label:'Campeão'},
  destaque:  {cor:'#4FC3F7',icon:'⭐',label:'Destaque'},
  lenda:     {cor:'#A855F7',icon:'💫',label:'Lenda'},
  genetica:  {cor:'#2DD4A7',icon:'💎',label:'Gene Raro'},
  reprodutor:{cor:'#FB923C',icon:'🌳',label:'Reprodutor'},
}

export default function VLHallOfFame({carreira,onVoltar,onGuardar}){
  const [cl,setCL]=useState(()=>lerLS()||carreira)
  const c=cl
  const salvar=d=>{gravarLS(d);setCL({...d});onGuardar?.(d)}

  const [tab,setTab]=useState('lendas')
  const [novasEntradas,setNovasEntradas]=useState([])

  const hof=c.hall_of_fame||[]
  const hist=c.historico_provas||[]
  const todos=c.pombos||[]
  const hofIds=new Set(hof.map(e=>e.pomboId))

  // Verificar entradas automáticas
  useEffect(()=>{
    const elegíveis=[]
    todos.filter(p=>p.estado==='activo'&&!hofIds.has(p.id)).forEach(p=>{
      CRITERIOS.forEach(crit=>{
        if(crit.check(p,hist,todos)){
          elegíveis.push({pombo:p,criterio:crit})
        }
      })
    })
    if(elegíveis.length>0){
      setNovasEntradas(elegíveis)
      // Auto-adicionar
      const novoHof=[...hof]
      elegíveis.forEach(({pombo,criterio})=>{
        if(!novoHof.find(e=>e.pomboId===pombo.id&&e.tipo===criterio.tipo)){
          novoHof.push({
            id:`hof_${Date.now()}_${Math.random().toString(36).slice(2,5)}`,
            pomboId:pombo.id,
            nomePombo:pombo.nome,
            anilha:pombo.anilha,
            tipo:criterio.tipo,
            titulo:criterio.titulo,
            desc:criterio.desc,
            icon:criterio.icon,
            rating:pombo.rating,
            epoca:c.epoca||1,
            dia:c.dia||1,
            pai_nome:pombo.pai_nome,
            mae_nome:pombo.mae_nome,
            especialidade:pombo.especialidade,
            stats:{
              provas:pombo.provas||0,
              vitorias:pombo.vitorias||0,
              percentil:pombo.percentil_medio||0,
              geneRaro:pombo.atributos?.gene_raro_tipo||null,
            }
          })
        }
      })
      if(novoHof.length>hof.length) salvar({...c,hall_of_fame:novoHof})
    }
  },[])

  const adicionarManual=(pombo,tipo)=>{
    const cfg=TIPO_CFG[tipo]
    const nova={
      id:`hof_${Date.now()}`,pomboId:pombo.id,nomePombo:pombo.nome,
      anilha:pombo.anilha,tipo,titulo:cfg.label,icon:cfg.icon,
      desc:`Adicionado manualmente — ${cfg.label}`,
      rating:pombo.rating,epoca:c.epoca||1,dia:c.dia||1,
      pai_nome:pombo.pai_nome,mae_nome:pombo.mae_nome,
      especialidade:pombo.especialidade,
      stats:{provas:pombo.provas||0,vitorias:pombo.vitorias||0,percentil:pombo.percentil_medio||0,geneRaro:pombo.atributos?.gene_raro_tipo||null}
    }
    salvar({...c,hall_of_fame:[...hof,nova]})
  }

  const remover=(id)=>salvar({...c,hall_of_fame:hof.filter(e=>e.id!==id)})

  const pombosElegiveis=todos.filter(p=>p.estado==='activo'&&!hofIds.has(p.id))

  return(
    <div style={{minHeight:'100vh',background:T.bg,color:T.text,fontFamily:"system-ui,sans-serif"}}>
      <div style={{background:`linear-gradient(180deg,${T.surface},${T.bg})`,borderBottom:`1px solid ${T.s2}`,padding:'14px 16px',position:'relative'}}>
        <GL/>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
          <button onClick={onVoltar} style={{background:T.surface,border:`1px solid ${T.s2}`,borderRadius:8,width:32,height:32,color:T.muted,cursor:'pointer',fontSize:16}}>←</button>
          <div style={{flex:1}}>
            <div style={{fontSize:16,fontWeight:800}}>🏛️ Hall of Fame</div>
            <div style={{fontSize:9,color:T.muted}}>{hof.length} lendas · Época {c.epoca||1}</div>
          </div>
        </div>
        <div style={{display:'flex',gap:6}}>
          {[['lendas','Lendas'],['criterios','Critérios'],['adicionar','Adicionar']].map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id)}
              style={{flex:'none',padding:'7px 11px',borderRadius:8,border:tab===id?'none':`1px solid ${T.s2}`,background:tab===id?`${T.gold}20`:'transparent',color:tab===id?T.gold:T.muted,fontSize:10,fontWeight:tab===id?700:400,cursor:'pointer',fontFamily:'inherit'}}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:'12px 16px',display:'flex',flexDirection:'column',gap:10}}>

        {/* LENDAS */}
        {tab==='lendas'&&(
          hof.length===0?(
            <div style={{textAlign:'center',padding:'40px 20px'}}>
              <div style={{fontSize:40,marginBottom:12}}>🏛️</div>
              <div style={{fontSize:13,color:T.muted}}>O Hall of Fame está vazio</div>
              <div style={{fontSize:10,color:T.s2,marginTop:6}}>Compete e cria linhagens para ver lendas aqui</div>
            </div>
          ):hof.map(e=>{
            const cfg=TIPO_CFG[e.tipo]||TIPO_CFG.campeao
            return(
              <div key={e.id} style={{background:`${cfg.cor}08`,border:`1px solid ${cfg.cor}25`,borderRadius:14,padding:'14px',position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:cfg.cor}}/>
                <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
                  <div style={{width:50,height:50,borderRadius:12,background:`${cfg.cor}15`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,flexShrink:0}}>{cfg.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:3}}>
                      <div style={{fontSize:15,fontWeight:800,color:T.text}}>{e.nomePombo}</div>
                      <span style={{fontSize:9,color:cfg.cor,background:`${cfg.cor}15`,padding:'2px 6px',borderRadius:4,fontWeight:700,flexShrink:0}}>{cfg.label}</span>
                    </div>
                    <div style={{fontSize:10,color:T.muted,marginBottom:6}}>{e.anilha} · {e.especialidade} · Época {e.epoca}</div>
                    <div style={{display:'flex',gap:1,marginBottom:6}}>
                      {Array.from({length:5}).map((_,i)=><span key={i} style={{fontSize:10,color:i<(e.rating||3)?T.gold:'rgba(255,255,255,.1)'}}>{i<(e.rating||3)?'★':'☆'}</span>)}
                    </div>
                    {e.stats&&(
                      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:4}}>
                        {[
                          {l:'Provas',v:e.stats.provas},
                          {l:'Vitórias',v:e.stats.vitorias},
                          {l:'% Médio',v:`${e.stats.percentil}%`},
                        ].map((s,i)=>(
                          <div key={i} style={{padding:'5px',background:'rgba(255,255,255,.04)',borderRadius:5,textAlign:'center'}}>
                            <div style={{fontSize:12,fontWeight:700,color:cfg.cor}}>{s.v}</div>
                            <div style={{fontSize:7,color:T.muted}}>{s.l}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {(e.pai_nome||e.mae_nome)&&<div style={{fontSize:9,color:T.muted,marginTop:6}}>♂ {e.pai_nome||'?'} × ♀ {e.mae_nome||'?'}</div>}
                    {e.stats?.geneRaro&&<div style={{fontSize:9,color:T.gold,marginTop:3}}>💎 {e.stats.geneRaro}</div>}
                  </div>
                </div>
                <button onClick={()=>remover(e.id)} style={{position:'absolute',top:10,right:10,background:'transparent',border:'none',color:T.s2,cursor:'pointer',fontSize:11,padding:'2px 6px'}}>✕</button>
              </div>
            )
          })
        )}

        {/* CRITÉRIOS */}
        {tab==='criterios'&&(
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            <div style={{padding:'10px 14px',background:`${T.blue}08`,border:`1px solid ${T.blue}20`,borderRadius:10,fontSize:10,color:T.muted}}>
              💡 Os pombos que cumpram estes critérios entram automaticamente no Hall of Fame.
            </div>
            {CRITERIOS.map(crit=>{
              const cfg=TIPO_CFG[crit.tipo]||TIPO_CFG.campeao
              // Verificar quantos pombos já cumprem
              const cumprem=todos.filter(p=>p.estado==='activo'&&crit.check(p,hist,todos))
              return(
                <div key={crit.id} style={{background:T.surface,border:`1px solid ${cfg.cor}20`,borderRadius:12,padding:'14px',position:'relative',overflow:'hidden'}}>
                  <GL/>
                  <div style={{display:'flex',gap:10,alignItems:'center'}}>
                    <div style={{width:40,height:40,borderRadius:10,background:`${cfg.cor}15`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{crit.icon}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,fontWeight:700,color:T.text}}>{crit.titulo}</div>
                      <div style={{fontSize:10,color:T.muted}}>{crit.desc}</div>
                    </div>
                    <div style={{textAlign:'center',flexShrink:0}}>
                      <div style={{fontFamily:"Georgia,serif",fontSize:16,fontWeight:900,color:cumprem.length>0?cfg.cor:T.s2}}>{cumprem.length}</div>
                      <div style={{fontSize:7,color:T.muted}}>POMBOS</div>
                    </div>
                  </div>
                  {cumprem.length>0&&(
                    <div style={{marginTop:8,fontSize:9,color:cfg.cor}}>
                      ✓ {cumprem.map(p=>p.nome).join(', ')}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ADICIONAR MANUAL */}
        {tab==='adicionar'&&(
          pombosElegiveis.length===0?(
            <div style={{textAlign:'center',padding:'40px',color:T.muted,fontSize:12}}>Todos os pombos activos já estão no Hall of Fame</div>
          ):pombosElegiveis.map(p=>{
            const cor=p.sexo==='F'?'#C084FC':T.blue
            return(
              <div key={p.id} style={{background:T.surface,border:`1px solid ${T.s2}`,borderRadius:12,padding:'14px',position:'relative',overflow:'hidden'}}>
                <GL/>
                <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:10}}>
                  <div style={{width:36,height:36,borderRadius:8,background:`${cor}15`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"Georgia,serif",fontSize:11,fontWeight:900,color:cor,flexShrink:0}}>{p.anilha?.slice(-3)}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:700,color:T.text}}>{p.nome}</div>
                    <div style={{fontSize:9,color:T.muted}}>{p.especialidade} · {p.provas||0} provas · {p.vitorias||0} vitórias</div>
                  </div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:5}}>
                  {Object.entries(TIPO_CFG).map(([tipo,cfg])=>(
                    <button key={tipo} onClick={()=>adicionarManual(p,tipo)}
                      style={{padding:'6px 4px',borderRadius:7,border:`1px solid ${cfg.cor}30`,background:`${cfg.cor}10`,color:cfg.cor,fontSize:9,fontWeight:700,cursor:'pointer',fontFamily:'inherit',textAlign:'center'}}>
                      {cfg.icon} {cfg.label}
                    </button>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
