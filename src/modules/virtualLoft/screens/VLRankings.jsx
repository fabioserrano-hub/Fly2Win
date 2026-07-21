// src/modules/virtualLoft/screens/VLRankings.jsx — V2 Rankings completos
import { useState } from 'react'

const T={bg:'#050A14',surface:'#0D1829',s2:'#1A2A45',gold:'#C9A84C',blue:'#4FC3F7',text:'#E8EDF5',muted:'#6B7A99',success:'#2DD4A7',danger:'#F87171',purple:'#A855F7',orange:'#FB923C'}
function lerLS(){try{return JSON.parse(localStorage.getItem('vl_carreira'))}catch{return null}}
function GL(){return <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,#C9A84C,transparent)',opacity:.8}}/>}

// Pombais IA para contexto
const POMBAIS_IA=[
  {nome:'Pombal da Serra',     pais:'PT', pontos:0, vitorias:0, provas:0},
  {nome:'Pombal Elite',        pais:'PT', pontos:0, vitorias:0, provas:0},
  {nome:'Pombal Campeão',      pais:'PT', pontos:0, vitorias:0, provas:0},
  {nome:'Pombal Norte',        pais:'PT', pontos:0, vitorias:0, provas:0},
  {nome:'Pombal Real',         pais:'PT', pontos:0, vitorias:0, provas:0},
  {nome:'Pombal Dourado',      pais:'PT', pontos:0, vitorias:0, provas:0},
  {nome:'Pombal Ibérico',      pais:'ES', pontos:0, vitorias:0, provas:0},
  {nome:'Club Palomas Madrid', pais:'ES', pontos:0, vitorias:0, provas:0},
  {nome:'Colombo Barcelona',   pais:'ES', pontos:0, vitorias:0, provas:0},
  {nome:'Palomar Lusitano',    pais:'PT', pontos:0, vitorias:0, provas:0},
]

const TIPOS_ESP=['velocidade','meio_fundo','fundo','grande_fundo']
const TIPO_ICON={velocidade:'⚡',meio_fundo:'🌊',fundo:'💪',grande_fundo:'🏔️'}
const TIPO_LABEL={velocidade:'Velocidade',meio_fundo:'Meio-Fundo',fundo:'Fundo',grande_fundo:'Grande Fundo'}

// Pombais IA reais persistentes da carreira
function gerarPombaisIA(carreira){
  const ia=carreira.clubes_ia||[]
  const camp=carreira.campeonato_ia||{}
  if(!ia.length) return POMBAIS_IA.map(p=>({...p,pontos:0,vitorias:0,provas:0,melhorPct:0}))
  return ia.map(cl=>({
    nome:cl.nome, pais:cl.pais||'PT',
    pontos:(camp.pontos?.[cl.nome]?.geral)||0,
    vitorias:cl.vitorias||0,
    provas:cl.pombos?.reduce((s,p)=>(s+(p.provas||0)),0)||0,
    melhorPct:Math.round(cl.reputacao||5),
    nivel:cl.nivel,
  }))
}

// Calcular pontos do jogador
function calcPontosJogador(carreira){
  const hist=carreira.historico_provas||[]
  const pombos=carreira.pombos||[]

  // Pontos por pombo (top 2 de cada prova)
  const pontosPorProva={}
  hist.forEach(r=>{
    if(!pontosPorProva[r.provaId])pontosPorProva[r.provaId]=[]
    pontosPorProva[r.provaId].push(r)
  })

  let totalPontos=0
  Object.values(pontosPorProva).forEach(resultados=>{
    const top2=[...resultados].sort((a,b)=>(b.percentil||0)-(a.percentil||0)).slice(0,2)
    top2.forEach(r=>{
      if(r.posicao===1)totalPontos+=(r.pontosProva||10)
      else if(r.posicao<=3)totalPontos+=Math.round((r.pontosProva||10)*.7)
      else if((r.percentil||0)>=80)totalPontos+=Math.round((r.pontosProva||10)*.4)
      else if((r.percentil||0)>=50)totalPontos+=Math.round((r.pontosProva||10)*.2)
    })
  })

  // Ranking por pombo
  const rankingPombos=pombos.filter(p=>p.estado==='activo'&&(p.provas||0)>0).map(p=>{
    const hP=hist.filter(r=>r.pomboId===p.id)
    const pts=hP.reduce((s,r)=>{
      if(r.posicao===1)return s+(r.pontosProva||10)
      if(r.posicao<=3)return s+Math.round((r.pontosProva||10)*.7)
      if((r.percentil||0)>=80)return s+Math.round((r.pontosProva||10)*.4)
      return s
    },0)
    return{...p,pontosRanking:pts,melhorPct:hP.length?Math.max(...hP.map(r=>r.percentil||0)):0}
  }).sort((a,b)=>b.pontosRanking-a.pontosRanking)

  // Por especialidade
  const porEsp={}
  TIPOS_ESP.forEach(tipo=>{
    const hTipo=hist.filter(r=>r.tipo===tipo)
    porEsp[tipo]={
      provas:hTipo.length,
      vitorias:hTipo.filter(r=>r.posicao===1).length,
      melhorPct:hTipo.length?Math.max(...hTipo.map(r=>r.percentil||0)):0,
      pontos:hTipo.reduce((s,r)=>r.posicao===1?s+(r.pontosProva||10):r.posicao<=3?s+Math.round((r.pontosProva||10)*.7):(r.percentil||0)>=80?s+Math.round((r.pontosProva||10)*.4):s,0),
      melhorVelocidade:hTipo.length?Math.max(...hTipo.map(r=>r.velocidade||0)):0,
    }
  })

  return{totalPontos,rankingPombos,porEsp,totalProvas:hist.length,totalVitorias:hist.filter(r=>r.posicao===1).length,melhorPct:hist.length?Math.max(...hist.map(r=>r.percentil||0)):0}
}

function MedalIcon({pos}){
  if(pos===1)return<span style={{fontSize:20}}>🥇</span>
  if(pos===2)return<span style={{fontSize:20}}>🥈</span>
  if(pos===3)return<span style={{fontSize:20}}>🥉</span>
  return<div style={{width:28,height:28,borderRadius:6,background:T.s2,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:T.muted}}>{pos}</div>
}

export default function VLRankings({carreira,onVoltar}){
  const [cl]=useState(()=>lerLS()||carreira)
  const c=cl
  const [tab,setTab]=useState('geral')
  const [tabEsp,setTabEsp]=useState('velocidade')

  const pombaisIA=gerarPombaisIA(c)
  const {totalPontos,rankingPombos,porEsp,totalProvas,totalVitorias,melhorPct}=calcPontosJogador(c)

  // Ranking geral de pombais (jogador vs IA)
  const rankingGeral=[...pombaisIA,{
    nome:`${c.nomePombal}`,
    pais:c.pais||'PT',
    pontos:totalPontos,
    vitorias:totalVitorias,
    provas:totalProvas,
    melhorPct,
    isMeu:true,
  }].sort((a,b)=>b.pontos-a.pontos)

  const posJogador=rankingGeral.findIndex(r=>r.isMeu)+1
  const acimaDe=posJogador>1?rankingGeral[posJogador-2]:null
  const abaixoDe=posJogador<rankingGeral.length?rankingGeral[posJogador]:null
  const pontosParaSubir=acimaDe?acimaDe.pontos-totalPontos:0

  // Recordes do pombal
  const hist=c.historico_provas||[]
  const recordeVelocidade=hist.length?Math.max(...hist.map(r=>r.velocidade||0)):0
  const recordePercentil=hist.length?Math.max(...hist.map(r=>r.percentil||0)):0
  const melhorProva=hist.filter(r=>r.posicao===1)[0]

  return(
    <div style={{minHeight:'100vh',background:T.bg,color:T.text,fontFamily:"system-ui,sans-serif"}}>
      <div style={{background:`linear-gradient(180deg,${T.surface},${T.bg})`,borderBottom:`1px solid ${T.s2}`,padding:'14px 16px',position:'relative'}}>
        <GL/>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
          <button onClick={onVoltar} style={{background:T.surface,border:`1px solid ${T.s2}`,borderRadius:8,width:32,height:32,color:T.muted,cursor:'pointer',fontSize:16}}>←</button>
          <div style={{flex:1}}>
            <div style={{fontSize:16,fontWeight:800}}>📊 Rankings</div>
            <div style={{fontSize:9,color:T.muted}}>Época {c.epoca||1} · {totalProvas} provas · {totalVitorias} vitórias</div>
          </div>
        </div>
        <div style={{display:'flex',gap:5,overflowX:'auto',scrollbarWidth:'none'}}>
          {[['geral','🏆 Geral'],['pombos','🐦 Pombos'],['especialidade','⚡ Esp.'],['recordes','📋 Recordes']].map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id)}
              style={{flex:'none',padding:'7px 11px',borderRadius:8,border:tab===id?'none':`1px solid ${T.s2}`,background:tab===id?`${T.danger}20`:'transparent',color:tab===id?T.danger:T.muted,fontSize:10,fontWeight:tab===id?700:400,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'}}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:'12px 16px',display:'flex',flexDirection:'column',gap:12}}>

        {/* RANKING GERAL */}
        {tab==='geral'&&(
          <>
            {/* Posição actual */}
            <div style={{background:'linear-gradient(135deg,rgba(201,168,76,.12),rgba(201,168,76,.04))',border:`1px solid ${T.gold}30`,borderRadius:16,padding:'18px',position:'relative',overflow:'hidden',textAlign:'center'}}>
              <GL/>
              <div style={{fontSize:9,color:T.gold,fontWeight:700,letterSpacing:1.5,marginBottom:6}}>A TUA POSIÇÃO</div>
              <div style={{fontFamily:"Georgia,serif",fontSize:48,fontWeight:900,color:T.gold,lineHeight:1,marginBottom:4}}>{posJogador}º</div>
              <div style={{fontSize:11,color:T.muted}}>de {rankingGeral.length} pombais · {totalPontos} pontos</div>
              {pontosParaSubir>0&&(
                <div style={{marginTop:10,padding:'8px',background:'rgba(255,255,255,.04)',borderRadius:8,fontSize:10,color:T.muted}}>
                  Faltam <span style={{color:T.gold,fontWeight:700}}>{pontosParaSubir} pontos</span> para subir para {posJogador-1}º
                  {acimaDe&&<span> ({acimaDe.nome})</span>}
                </div>
              )}
            </div>

            {/* Contexto — pombais acima e abaixo */}
            {(acimaDe||abaixoDe)&&(
              <div style={{background:T.surface,border:`1px solid ${T.s2}`,borderRadius:12,overflow:'hidden',position:'relative'}}>
                <GL/>
                <div style={{padding:'8px 14px',borderBottom:`1px solid ${T.s2}`}}>
                  <span style={{fontSize:9,color:T.muted,fontWeight:700,letterSpacing:1}}>CONTEXTO NO RANKING</span>
                </div>
                {acimaDe&&(
                  <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderBottom:`1px solid ${T.s2}`,opacity:.7}}>
                    <MedalIcon pos={posJogador-1}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,color:T.text}}>{acimaDe.nome}</div>
                      <div style={{fontSize:9,color:T.muted}}>{acimaDe.provas} provas · {acimaDe.vitorias} vitórias</div>
                    </div>
                    <div style={{fontFamily:"Georgia,serif",fontSize:14,fontWeight:700,color:T.muted}}>{acimaDe.pontos} pts</div>
                  </div>
                )}
                <div style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',background:`${T.gold}06`,borderBottom:`1px solid ${T.s2}`}}>
                  <MedalIcon pos={posJogador}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:T.gold}}>{c.nomePombal} ← TU</div>
                    <div style={{fontSize:9,color:T.muted}}>{totalProvas} provas · {totalVitorias} vitórias</div>
                  </div>
                  <div style={{fontFamily:"Georgia,serif",fontSize:14,fontWeight:700,color:T.gold}}>{totalPontos} pts</div>
                </div>
                {abaixoDe&&(
                  <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',opacity:.7}}>
                    <MedalIcon pos={posJogador+1}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,color:T.text}}>{abaixoDe.nome}</div>
                      <div style={{fontSize:9,color:T.muted}}>{abaixoDe.provas} provas · {abaixoDe.vitorias} vitórias</div>
                    </div>
                    <div style={{fontFamily:"Georgia,serif",fontSize:14,fontWeight:700,color:T.muted}}>{abaixoDe.pontos} pts</div>
                  </div>
                )}
              </div>
            )}

            {/* Ranking completo */}
            <div style={{background:T.surface,border:`1px solid ${T.s2}`,borderRadius:12,overflow:'hidden',position:'relative'}}>
              <GL/>
              <div style={{padding:'8px 14px',borderBottom:`1px solid ${T.s2}`}}>
                <span style={{fontSize:9,color:T.muted,fontWeight:700,letterSpacing:1}}>CLASSIFICAÇÃO GERAL</span>
              </div>
              {rankingGeral.map((r,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:r.isMeu?`${T.gold}06`:'transparent',borderBottom:`1px solid ${T.s2}`}}>
                  <MedalIcon pos={i+1}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:r.isMeu?700:500,color:r.isMeu?T.gold:T.text}}>{r.nome}{r.isMeu?' ← TU':''}</div>
                    <div style={{fontSize:9,color:T.muted}}>{r.pais} · {r.provas} provas · {r.vitorias} vitórias</div>
                  </div>
                  <div style={{fontFamily:"Georgia,serif",fontSize:14,fontWeight:700,color:r.isMeu?T.gold:T.muted}}>{r.pontos} pts</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* RANKING POMBOS */}
        {tab==='pombos'&&(
          <>
            {/* Stats globais */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
              {[
                {l:'Provas',v:totalProvas,c:T.blue},
                {l:'Vitórias',v:totalVitorias,c:T.gold},
                {l:'Melhor',v:`P${melhorPct}%`,c:T.success},
              ].map((s,i)=>(
                <div key={i} style={{background:T.surface,border:`1px solid ${s.c}20`,borderRadius:10,padding:'10px',textAlign:'center',position:'relative',overflow:'hidden'}}>
                  <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${s.c}50,transparent)`}}/>
                  <div style={{fontFamily:"Georgia,serif",fontSize:18,fontWeight:900,color:s.c}}>{s.v}</div>
                  <div style={{fontSize:8,color:T.muted,fontWeight:700,marginTop:2}}>{s.l}</div>
                </div>
              ))}
            </div>

            {rankingPombos.length===0?(
              <div style={{textAlign:'center',padding:'40px',color:T.muted,fontSize:12}}>
                <div style={{fontSize:40,marginBottom:12}}>🐦</div>
                Nenhum pombo com provas ainda
              </div>
            ):(
              <div style={{background:T.surface,border:`1px solid ${T.s2}`,borderRadius:12,overflow:'hidden',position:'relative'}}>
                <GL/>
                <div style={{padding:'8px 14px',borderBottom:`1px solid ${T.s2}`}}>
                  <span style={{fontSize:9,color:T.muted,fontWeight:700,letterSpacing:1}}>RANKING DO PLANTEL</span>
                </div>
                {rankingPombos.map((p,i)=>{
                  const cor=p.sexo==='F'?'#C084FC':T.blue
                  return(
                    <div key={p.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderBottom:`1px solid ${T.s2}`,background:i===0?`${T.gold}06`:'transparent'}}>
                      <MedalIcon pos={i+1}/>
                      <div style={{width:32,height:32,borderRadius:7,background:`${cor}15`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"Georgia,serif",fontSize:10,fontWeight:900,color:cor,flexShrink:0}}>
                        {p.anilha?.slice(-3)}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:i===0?700:500,color:i===0?T.gold:T.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.nome}</div>
                        <div style={{fontSize:9,color:T.muted}}>{p.especialidade} · {p.provas||0} provas · P{p.melhorPct}% melhor</div>
                      </div>
                      <div style={{textAlign:'right',flexShrink:0}}>
                        <div style={{fontFamily:"Georgia,serif",fontSize:14,fontWeight:700,color:i===0?T.gold:T.muted}}>{p.pontosRanking} pts</div>
                        <div style={{fontSize:8,color:T.muted}}>{p.vitorias||0} vitórias</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* RANKING POR ESPECIALIDADE */}
        {tab==='especialidade'&&(
          <>
            <div style={{display:'flex',gap:5,overflowX:'auto',scrollbarWidth:'none',paddingBottom:2}}>
              {TIPOS_ESP.map(t=>(
                <button key={t} onClick={()=>setTabEsp(t)}
                  style={{flex:'none',padding:'7px 12px',borderRadius:8,border:tabEsp===t?'none':`1px solid ${T.s2}`,background:tabEsp===t?`${T.blue}25`:'transparent',color:tabEsp===t?T.blue:T.muted,fontSize:10,fontWeight:tabEsp===t?700:400,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'}}>
                  {TIPO_ICON[t]} {TIPO_LABEL[t]}
                </button>
              ))}
            </div>

            {(()=>{
              const esp=porEsp[tabEsp]||{provas:0,vitorias:0,melhorPct:0,pontos:0,melhorVelocidade:0}
              const histEsp=hist.filter(r=>r.tipo===tabEsp)
              // Ranking pombos nesta especialidade
              const rankEsp=(c.pombos||[]).filter(p=>p.estado==='activo').map(p=>{
                const hP=histEsp.filter(r=>r.pomboId===p.id)
                return{...p,provEsp:hP.length,mPct:hP.length?Math.max(...hP.map(r=>r.percentil||0)):0,vitsEsp:hP.filter(r=>r.posicao===1).length}
              }).filter(p=>p.provEsp>0).sort((a,b)=>b.mPct-a.mPct)
              return(
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  {/* Stats da especialidade */}
                  <div style={{background:`${T.blue}08`,border:`1px solid ${T.blue}20`,borderRadius:12,padding:'14px',position:'relative',overflow:'hidden'}}>
                    <GL/>
                    <div style={{fontSize:12,fontWeight:700,color:T.blue,marginBottom:10}}>{TIPO_ICON[tabEsp]} {TIPO_LABEL[tabEsp]} — Os teus resultados</div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8}}>
                      {[
                        {l:'Provas',v:esp.provas,c:T.blue},
                        {l:'Vitórias',v:esp.vitorias,c:T.gold},
                        {l:'Melhor',v:`P${esp.melhorPct}%`,c:T.success},
                        {l:'Vel. Máx.',v:esp.melhorVelocidade?`${esp.melhorVelocidade}m/min`:'—',c:T.orange},
                      ].map((s,i)=>(
                        <div key={i} style={{background:T.s2,borderRadius:8,padding:'8px',textAlign:'center'}}>
                          <div style={{fontFamily:"Georgia,serif",fontSize:16,fontWeight:900,color:s.c}}>{s.v}</div>
                          <div style={{fontSize:8,color:T.muted,fontWeight:700}}>{s.l}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Melhores pombos desta especialidade */}
                  {rankEsp.length>0&&(
                    <div style={{background:T.surface,border:`1px solid ${T.s2}`,borderRadius:12,overflow:'hidden',position:'relative'}}>
                      <GL/>
                      <div style={{padding:'8px 14px',borderBottom:`1px solid ${T.s2}`}}>
                        <span style={{fontSize:9,color:T.muted,fontWeight:700,letterSpacing:1}}>MELHORES POMBOS EM {TIPO_LABEL[tabEsp].toUpperCase()}</span>
                      </div>
                      {rankEsp.slice(0,5).map((p,i)=>{
                        const cor=p.sexo==='F'?'#C084FC':T.blue
                        return(
                          <div key={p.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderBottom:`1px solid ${T.s2}`,background:i===0?`${T.gold}06`:'transparent'}}>
                            <MedalIcon pos={i+1}/>
                            <div style={{flex:1}}>
                              <div style={{fontSize:12,fontWeight:i===0?700:500,color:i===0?T.gold:T.text}}>{p.nome}</div>
                              <div style={{fontSize:9,color:T.muted}}>{p.provEsp} provas · {p.vitsEsp} vitórias</div>
                            </div>
                            <div style={{textAlign:'right'}}>
                              <div style={{fontSize:13,fontWeight:700,color:i===0?T.gold:T.success}}>P{p.mPct}%</div>
                              <div style={{fontSize:8,color:T.muted}}>melhor perc.</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Historial desta especialidade */}
                  {histEsp.length>0&&(
                    <div>
                      <div style={{fontSize:9,color:T.muted,fontWeight:700,letterSpacing:1,marginBottom:8}}>HISTORIAL {TIPO_LABEL[tabEsp].toUpperCase()}</div>
                      {[...histEsp].reverse().slice(0,6).map((r,i)=>(
                        <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 12px',background:T.surface,border:`1px solid ${r.posicao===1?T.gold:T.s2}`,borderRadius:8,marginBottom:4,position:'relative',overflow:'hidden'}}>
                          {r.posicao===1&&<GL/>}
                          <div>
                            <div style={{fontSize:11,fontWeight:600,color:T.text}}>{r.provaNome}</div>
                            <div style={{fontSize:9,color:T.muted}}>🐦 {r.pomboNome}</div>
                          </div>
                          <div style={{textAlign:'right'}}>
                            <div style={{fontSize:13,fontWeight:700,color:r.posicao===1?T.gold:r.posicao<=3?T.success:T.muted}}>{r.posicao}º/{r.total}</div>
                            <div style={{fontSize:9,color:T.success}}>P{r.percentil}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {histEsp.length===0&&<div style={{textAlign:'center',padding:'30px',color:T.muted,fontSize:12}}>Sem provas de {TIPO_LABEL[tabEsp]} ainda</div>}
                </div>
              )
            })()}
          </>
        )}

        {/* RECORDES */}
        {tab==='recordes'&&(
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            <div style={{background:'linear-gradient(135deg,rgba(201,168,76,.1),rgba(201,168,76,.04))',border:`1px solid ${T.gold}30`,borderRadius:14,padding:'16px',position:'relative',overflow:'hidden'}}>
              <GL/>
              <div style={{fontSize:9,color:T.gold,fontWeight:700,letterSpacing:1.5,marginBottom:10}}>🏆 RECORDES DO POMBAL</div>
              {[
                {l:'Velocidade Máxima',v:recordeVelocidade?`${recordeVelocidade} m/min`:'—',c:T.orange},
                {l:'Melhor Percentil',v:recordePercentil?`P${recordePercentil}%`:'—',c:T.success},
                {l:'Total Vitórias',v:totalVitorias,c:T.gold},
                {l:'Total Provas',v:totalProvas,c:T.blue},
              ].map((s,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:i<3?`1px solid ${T.s2}`:'none'}}>
                  <span style={{fontSize:11,color:T.muted}}>{s.l}</span>
                  <span style={{fontFamily:"Georgia,serif",fontSize:14,fontWeight:700,color:s.c}}>{s.v}</span>
                </div>
              ))}
            </div>

            {/* Melhor prova de sempre */}
            {melhorProva&&(
              <div style={{background:`${T.gold}08`,border:`1px solid ${T.gold}25`,borderRadius:12,padding:'14px',position:'relative',overflow:'hidden'}}>
                <GL/>
                <div style={{fontSize:9,color:T.gold,fontWeight:700,letterSpacing:1,marginBottom:8}}>🥇 MELHOR PROVA DE SEMPRE</div>
                <div style={{fontSize:15,fontWeight:800,color:T.text,marginBottom:3}}>{melhorProva.provaNome}</div>
                <div style={{fontSize:11,color:T.muted,marginBottom:6}}>🐦 {melhorProva.pomboNome}</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6}}>
                  {[
                    {l:'Posição',v:`${melhorProva.posicao}º`,c:T.gold},
                    {l:'Percentil',v:`P${melhorProva.percentil}%`,c:T.success},
                    {l:'Semana',v:`Sem.${melhorProva.semana}`,c:T.muted},
                  ].map((s,i)=>(
                    <div key={i} style={{background:T.s2,borderRadius:6,padding:'6px',textAlign:'center'}}>
                      <div style={{fontSize:13,fontWeight:700,color:s.c}}>{s.v}</div>
                      <div style={{fontSize:7,color:T.muted,fontWeight:600}}>{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pombo com mais vitórias */}
            {(c.pombos||[]).filter(p=>(p.vitorias||0)>0).length>0&&(()=>{
              const campeao=[...(c.pombos||[])].sort((a,b)=>(b.vitorias||0)-(a.vitorias||0))[0]
              const cor=campeao.sexo==='F'?'#C084FC':T.blue
              return(
                <div style={{background:`${cor}08`,border:`1px solid ${cor}25`,borderRadius:12,padding:'14px',position:'relative',overflow:'hidden'}}>
                  <GL/>
                  <div style={{fontSize:9,color:cor,fontWeight:700,letterSpacing:1,marginBottom:8}}>⭐ POMBO MAIS VITORIOSO</div>
                  <div style={{display:'flex',gap:12,alignItems:'center'}}>
                    <div style={{width:48,height:48,borderRadius:12,background:`${cor}15`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"Georgia,serif",fontSize:16,fontWeight:900,color:cor}}>
                      {campeao.anilha?.slice(-3)}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:15,fontWeight:800,color:T.text}}>{campeao.nome}</div>
                      <div style={{fontSize:10,color:T.muted}}>{campeao.especialidade}</div>
                      <div style={{display:'flex',gap:8,marginTop:4}}>
                        <span style={{fontSize:10,color:T.gold,fontWeight:700}}>🥇 {campeao.vitorias} vitórias</span>
                        <span style={{fontSize:10,color:T.muted}}>{campeao.provas||0} provas</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}

            {totalProvas===0&&(
              <div style={{textAlign:'center',padding:'40px',color:T.muted,fontSize:12}}>
                <div style={{fontSize:40,marginBottom:12}}>📋</div>
                Sem recordes ainda — compete para criares história!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
