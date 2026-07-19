// src/modules/virtualLoft/screens/VLTreinos.jsx — V3 Plano dia a dia
import { useState } from 'react'

const T={bg:'#050A14',surface:'#0D1829',s2:'#1A2A45',gold:'#C9A84C',blue:'#4FC3F7',text:'#E8EDF5',muted:'#6B7A99',success:'#2DD4A7',danger:'#F87171',purple:'#A855F7',orange:'#FB923C'}
function lerLS(){try{return JSON.parse(localStorage.getItem('vl_carreira'))}catch{return null}}
function gravarLS(d){try{localStorage.setItem('vl_carreira',JSON.stringify(d))}catch{}}
function GL(){return <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,#C9A84C,transparent)',opacity:.8}}/>}

const DIAS=['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']

const TREINOS={
  descanso:    {id:'descanso',    icon:'😴', label:'Descanso',       cor:'#94A3B8', fadiga:-8,  ganho:0,   attr:null,        desc:'Recuperação total'},
  velocidade:  {id:'velocidade',  icon:'⚡', label:'Velocidade',     cor:'#FB923C', fadiga:+6,  ganho:2.5, attr:'velocidade', desc:'Sprints curtos'},
  resistencia: {id:'resistencia', icon:'💪', label:'Resistência',    cor:'#2DD4A7', fadiga:+7,  ganho:2.5, attr:'resistencia',desc:'Voos longos'},
  orientacao:  {id:'orientacao',  icon:'🧭', label:'Orientação',     cor:'#4FC3F7', fadiga:+4,  ganho:2.0, attr:'orientacao', desc:'Navegação'},
  inteligencia:{id:'inteligencia',icon:'🧠', label:'Inteligência',   cor:'#A855F7', fadiga:+2,  ganho:2.0, attr:'inteligencia',desc:'Estimulação'},
  coragem:     {id:'coragem',     icon:'🔥', label:'Coragem',        cor:'#F87171', fadiga:+5,  ganho:2.0, attr:'coragem',    desc:'Condições adversas'},
  forca:       {id:'forca',       icon:'🏋️', label:'Força',          cor:'#C9A84C', fadiga:+8,  ganho:2.0, attr:'forca',      desc:'Treino físico'},
  vento:       {id:'vento',       icon:'💨', label:'Adapt. Vento',   cor:'#38BDF8', fadiga:+5,  ganho:1.5, attr:'instinto',   desc:'Vento forte'},
  chuva:       {id:'chuva',       icon:'🌧️', label:'Adapt. Chuva',   cor:'#818CF8', fadiga:+5,  ganho:1.5, attr:'coragem',    desc:'Chuva'},
  leve:        {id:'leve',        icon:'🌿', label:'Treino Leve',    cor:'#86EFAC', fadiga:+1,  ganho:0.5, attr:'recuperacao',desc:'Manutenção'},
}

// Templates de plano semanal por especialidade
const TEMPLATES={
  velocidade:{
    label:'Velocidade 🏁', desc:'Foco em velocidade e sprints',
    dias:['velocidade','descanso','velocidade','orientacao','velocidade','descanso','descanso']
  },
  resistencia:{
    label:'Resistência 💪', desc:'Foco em provas de fundo',
    dias:['resistencia','leve','resistencia','orientacao','resistencia','descanso','descanso']
  },
  equilibrado:{
    label:'Equilibrado ⚖️', desc:'Desenvolvimento geral',
    dias:['velocidade','resistencia','orientacao','coragem','forca','leve','descanso']
  },
  preProva:{
    label:'Pré-Prova 🏆', desc:'Preparação para competição',
    dias:['leve','orientacao','leve','descanso','leve','descanso','descanso']
  },
  recuperacao:{
    label:'Recuperação 😴', desc:'Após provas difíceis',
    dias:['descanso','leve','descanso','leve','descanso','descanso','descanso']
  },
  grande_fundo:{
    label:'Grande Fundo 🏔️', desc:'Resistência extrema',
    dias:['resistencia','resistencia','orientacao','resistencia','inteligencia','leve','descanso']
  },
}

function CalendarioSemanal({plano,onChangeDia,readOnly=false}){
  const [diaAberto,setDiaAberto]=useState(null)

  return(
    <div>
      {/* Vista semanal */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4,marginBottom:diaAberto!==null?0:0}}>
        {DIAS.map((d,i)=>{
          const tid=plano[i]||'descanso'
          const tr=TREINOS[tid]||TREINOS.descanso
          const isAberto=diaAberto===i
          return(
            <div key={i} onClick={()=>!readOnly&&setDiaAberto(isAberto?null:i)}
              style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'8px 4px',borderRadius:10,background:isAberto?`${tr.cor}20`:tid==='descanso'?T.s2:`${tr.cor}10`,border:`${isAberto?2:1}px solid ${isAberto?tr.cor:tid==='descanso'?T.s2:tr.cor+'30'}`,cursor:readOnly?'default':'pointer',transition:'all .15s',minHeight:72}}>
              <div style={{fontSize:8,color:isAberto?tr.cor:T.muted,fontWeight:700,marginBottom:4,letterSpacing:.3}}>{d}</div>
              <div style={{fontSize:20,marginBottom:3}}>{tr.icon}</div>
              <div style={{fontSize:7,color:isAberto?tr.cor:T.muted,fontWeight:isAberto?700:400,textAlign:'center',lineHeight:1.2}}>{tr.label}</div>
            </div>
          )
        })}
      </div>

      {/* Selector do dia aberto */}
      {diaAberto!==null&&!readOnly&&(
        <div style={{background:T.surface,border:`1px solid ${T.s2}`,borderRadius:12,padding:'12px',marginTop:8,position:'relative',overflow:'hidden'}}>
          <GL/>
          <div style={{fontSize:9,color:T.muted,fontWeight:700,letterSpacing:1,marginBottom:8}}>
            {DIAS[diaAberto].toUpperCase()} — SELECCIONAR TREINO
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:5}}>
            {Object.values(TREINOS).map(tr=>{
              const isSel=(plano[diaAberto]||'descanso')===tr.id
              return(
                <div key={tr.id} onClick={()=>{onChangeDia(diaAberto,tr.id);setDiaAberto(null)}}
                  style={{display:'flex',gap:8,alignItems:'center',padding:'8px 10px',borderRadius:8,border:`${isSel?2:1}px solid ${isSel?tr.cor:T.s2}`,background:isSel?`${tr.cor}15`:'transparent',cursor:'pointer',transition:'all .15s'}}>
                  <span style={{fontSize:16}}>{tr.icon}</span>
                  <div>
                    <div style={{fontSize:10,fontWeight:isSel?700:500,color:isSel?tr.cor:T.text}}>{tr.label}</div>
                    <div style={{fontSize:8,color:T.muted}}>{tr.fadiga>0?`+${tr.fadiga}`:tr.fadiga} fadiga{tr.ganho>0?` · +${tr.ganho} ${tr.attr?.slice(0,4)}`:', descanso'}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function ResumoPlano({plano,temTreinador}){
  const mult=temTreinador?1.2:1.0
  const dias=Object.values(plano)
  const totalFadiga=dias.reduce((s,tid)=>{const t=TREINOS[tid];return s+(t?.fadiga||0)},0)
  const ganhoPorAttr={}
  dias.forEach(tid=>{
    const t=TREINOS[tid]
    if(t?.attr&&t.ganho>0) ganhoPorAttr[t.attr]=(ganhoPorAttr[t.attr]||0)+t.ganho*mult
  })

  return(
    <div style={{background:`${T.gold}08`,border:`1px solid ${T.gold}20`,borderRadius:10,padding:'12px 14px',position:'relative',overflow:'hidden'}}>
      <GL/>
      <div style={{fontSize:9,color:T.gold,fontWeight:700,letterSpacing:1,marginBottom:8}}>📊 PREVISÃO SEMANAL</div>
      <div style={{display:'flex',gap:12,marginBottom:8}}>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:16,fontWeight:700,color:totalFadiga>0?T.danger:T.success}}>{totalFadiga>0?'+':''}{totalFadiga}</div>
          <div style={{fontSize:8,color:T.muted}}>FADIGA</div>
        </div>
        {temTreinador&&<div style={{textAlign:'center'}}>
          <div style={{fontSize:16,fontWeight:700,color:T.success}}>×1.2</div>
          <div style={{fontSize:8,color:T.muted}}>TREINADOR</div>
        </div>}
      </div>
      {Object.entries(ganhoPorAttr).length>0&&(
        <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
          {Object.entries(ganhoPorAttr).map(([attr,val])=>(
            <div key={attr} style={{padding:'3px 8px',background:`${T.success}15`,border:`1px solid ${T.success}25`,borderRadius:5,fontSize:9,color:T.success,fontWeight:700}}>
              +{val.toFixed(1)} {attr.slice(0,5).toUpperCase()}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function VLTreinos({carreira,onVoltar,onGuardar}){
  const [cl,setCL]=useState(()=>lerLS()||carreira)
  const c=cl
  const salvar=d=>{gravarLS(d);setCL({...d});onGuardar?.(d)}

  const [tab,setTab]=useState('plano')
  const [msg,setMsg]=useState(null)
  const [pombosSelec,setPombosSelec]=useState([])
  const [templateSel,setTemplateSel]=useState(null)

  // Plano: {0:'velocidade', 1:'descanso', ...} por dia da semana
  const planoAtual=c.plano_treino?.diasDetalhados||Object.fromEntries(DIAS.map((_,i)=>[i,c.plano_treino?.tipo||'descanso']))
  const [planoDraft,setPlanoDraft]=useState({...planoAtual})

  const temTreinador=(c.staff||[]).some(s=>s.tipo==='treinador')
  const pombosActivos=(c.pombos||[]).filter(p=>p.estado==='activo')
  const showMsg=(t,tipo='ok')=>{setMsg({t,tipo});setTimeout(()=>setMsg(null),3000)}

  const aplicarTemplate=(tid)=>{
    const tpl=TEMPLATES[tid]
    if(!tpl)return
    const novo=Object.fromEntries(tpl.dias.map((d,i)=>[i,d]))
    setPlanoDraft(novo)
    setTemplateSel(tid)
  }

  const guardarPlano=()=>{
    const novo={...c,plano_treino:{tipo:'personalizado',diasDetalhados:planoDraft,pombos:pombosSelec.length>0?pombosSelec:'todos'}}
    salvar(novo)
    showMsg('Plano guardado!')
    setTab('plano')
  }

  const togglePombo=p=>setPombosSelec(prev=>prev.includes(p.id)?prev.filter(x=>x!==p.id):[...prev,p.id])

  return(
    <div style={{minHeight:'100vh',background:T.bg,color:T.text,fontFamily:"system-ui,sans-serif"}}>
      <div style={{background:`linear-gradient(180deg,${T.surface},${T.bg})`,borderBottom:`1px solid ${T.s2}`,padding:'14px 16px',position:'relative'}}>
        <GL/>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
          <button onClick={onVoltar} style={{background:T.surface,border:`1px solid ${T.s2}`,borderRadius:8,width:32,height:32,color:T.muted,cursor:'pointer',fontSize:16}}>←</button>
          <div style={{flex:1}}>
            <div style={{fontSize:16,fontWeight:800}}>🎯 Treinos</div>
            <div style={{fontSize:9,color:T.muted}}>
              {temTreinador?<span style={{color:T.success}}>✓ Treinador activo (+20%)</span>:'Sem treinador'}
              {c.plano_treino&&<span style={{color:T.blue}}> · Plano activo</span>}
            </div>
          </div>
        </div>
        <div style={{display:'flex',gap:6}}>
          {[['plano','Plano Actual'],['criar','Criar Plano'],['progresso','Progresso']].map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id)}
              style={{flex:'none',padding:'7px 11px',borderRadius:8,border:tab===id?'none':`1px solid ${T.s2}`,background:tab===id?`${T.gold}20`:'transparent',color:tab===id?T.gold:T.muted,fontSize:10,fontWeight:tab===id?700:400,cursor:'pointer',fontFamily:'inherit'}}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {msg&&<div style={{margin:'10px 16px 0',padding:'10px 14px',background:`${T.success}10`,border:`1px solid ${T.success}30`,borderRadius:10,fontSize:12,color:T.success,fontWeight:600}}>✅ {msg.t}</div>}

      <div style={{padding:'12px 16px',display:'flex',flexDirection:'column',gap:12}}>

        {/* PLANO ACTUAL */}
        {tab==='plano'&&(
          c.plano_treino?(
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <CalendarioSemanal plano={planoAtual} onChangeDia={()=>{}} readOnly={true}/>
              <ResumoPlano plano={planoAtual} temTreinador={temTreinador}/>
              {/* Pombos em treino */}
              <div>
                <div style={{fontSize:9,color:T.muted,fontWeight:700,letterSpacing:1,marginBottom:8}}>POMBOS EM TREINO</div>
                {pombosActivos.map(p=>{
                  const emTreino=c.plano_treino.pombos==='todos'||c.plano_treino.pombos?.includes(p.id)
                  const cor=p.sexo==='F'?'#C084FC':T.blue
                  return(
                    <div key={p.id} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',background:emTreino?`${cor}06`:T.surface,border:`1px solid ${emTreino?cor+'25':T.s2}`,borderRadius:10,marginBottom:5}}>
                      <div style={{width:30,height:30,borderRadius:7,background:`${cor}15`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"Georgia,serif",fontSize:9,fontWeight:900,color:cor,flexShrink:0}}>{p.anilha?.slice(-3)}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:11,fontWeight:600,color:emTreino?T.text:T.muted}}>{p.nome}</div>
                        <div style={{fontSize:8,color:T.muted}}>F:{p.forma_atual||70}% · Fadiga:{p.fadiga||0}%</div>
                      </div>
                      <span style={{fontSize:9,color:emTreino?cor:T.muted}}>{emTreino?'Em treino':'Fora do plano'}</span>
                    </div>
                  )
                })}
              </div>
              <button onClick={()=>setTab('criar')}
                style={{width:'100%',padding:'11px',borderRadius:10,border:`1px solid ${T.s2}`,background:'transparent',color:T.muted,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>
                ✏️ Alterar plano
              </button>
            </div>
          ):(
            <div style={{textAlign:'center',padding:'40px 20px'}}>
              <div style={{fontSize:40,marginBottom:12}}>🎯</div>
              <div style={{fontSize:13,color:T.muted,marginBottom:12}}>Sem plano activo</div>
              <button onClick={()=>setTab('criar')} style={{padding:'12px 24px',borderRadius:10,border:'none',background:`linear-gradient(135deg,${T.gold},#A07830)`,color:'#050A14',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                Criar Plano
              </button>
            </div>
          )
        )}

        {/* CRIAR PLANO */}
        {tab==='criar'&&(
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {/* Templates */}
            <div>
              <div style={{fontSize:9,color:T.muted,fontWeight:700,letterSpacing:1,marginBottom:8}}>TEMPLATES POR ESPECIALIDADE</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:6}}>
                {Object.entries(TEMPLATES).map(([tid,tpl])=>(
                  <div key={tid} onClick={()=>aplicarTemplate(tid)}
                    style={{padding:'10px',borderRadius:10,border:`2px solid ${templateSel===tid?T.blue:T.s2}`,background:templateSel===tid?`${T.blue}10`:'transparent',cursor:'pointer',transition:'all .15s'}}>
                    <div style={{fontSize:11,fontWeight:700,color:templateSel===tid?T.blue:T.text,marginBottom:2}}>{tpl.label}</div>
                    <div style={{fontSize:8,color:T.muted}}>{tpl.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Calendário editável */}
            <div>
              <div style={{fontSize:9,color:T.muted,fontWeight:700,letterSpacing:1,marginBottom:8}}>
                PERSONALIZAR — CLICA NUM DIA PARA ALTERAR
              </div>
              <CalendarioSemanal plano={planoDraft} onChangeDia={(dia,tid)=>setPlanoDraft(prev=>({...prev,[dia]:tid}))}/>
            </div>

            {/* Previsão */}
            <ResumoPlano plano={planoDraft} temTreinador={temTreinador}/>

            {/* Selecção de pombos */}
            <div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                <div style={{fontSize:9,color:T.muted,fontWeight:700,letterSpacing:1}}>POMBOS ({pombosSelec.length===0?'todos':pombosSelec.length})</div>
                <button onClick={()=>setPombosSelec([])} style={{fontSize:9,color:T.muted,background:'none',border:'none',cursor:'pointer',padding:0}}>Todos</button>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:5}}>
                {pombosActivos.map(p=>{
                  const isSel=pombosSelec.includes(p.id)
                  const cor=p.sexo==='F'?'#C084FC':T.blue
                  return(
                    <div key={p.id} onClick={()=>togglePombo(p)}
                      style={{display:'flex',alignItems:'center',gap:7,padding:'8px 10px',background:isSel?`${cor}10`:T.surface,border:`${isSel?2:1}px solid ${isSel?cor:T.s2}`,borderRadius:8,cursor:'pointer',transition:'all .15s',position:'relative',overflow:'hidden'}}>
                      {isSel&&<GL/>}
                      <div style={{width:24,height:24,borderRadius:5,background:`${cor}15`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"Georgia,serif",fontSize:8,fontWeight:900,color:cor,flexShrink:0}}>{p.anilha?.slice(-3)}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:10,fontWeight:600,color:isSel?cor:T.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.nome}</div>
                        <div style={{fontSize:8,color:T.muted}}>F:{p.forma_atual||70}%</div>
                      </div>
                      {isSel&&<div style={{width:14,height:14,borderRadius:'50%',background:cor,display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,color:'#fff',flexShrink:0}}>✓</div>}
                    </div>
                  )
                })}
              </div>
            </div>

            <button onClick={guardarPlano}
              style={{width:'100%',padding:'14px',borderRadius:12,border:'none',background:`linear-gradient(135deg,${T.gold},#A07830)`,color:'#050A14',fontSize:13,fontWeight:800,cursor:'pointer',fontFamily:'inherit',boxShadow:`0 4px 16px ${T.gold}30`}}>
              ✅ Guardar Plano Semanal
            </button>
          </div>
        )}

        {/* PROGRESSO */}
        {tab==='progresso'&&(
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {pombosActivos.length===0?(
              <div style={{textAlign:'center',padding:'40px',color:T.muted}}>Sem pombos activos</div>
            ):pombosActivos.map(p=>{
              const cor=p.sexo==='F'?'#C084FC':T.blue
              const attrs=p.atributos||{}
              return(
                <div key={p.id} style={{background:T.surface,border:`1px solid ${T.s2}`,borderRadius:12,padding:'14px',position:'relative',overflow:'hidden'}}>
                  <GL/>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                    <div style={{display:'flex',gap:8,alignItems:'center'}}>
                      <div style={{width:32,height:32,borderRadius:7,background:`${cor}15`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"Georgia,serif",fontSize:10,fontWeight:900,color:cor}}>{p.anilha?.slice(-3)}</div>
                      <div>
                        <div style={{fontSize:12,fontWeight:700,color:T.text}}>{p.nome}</div>
                        <div style={{display:'flex',gap:6}}>
                          <span style={{fontSize:8,color:p.forma_atual>=70?T.success:T.gold}}>F:{p.forma_atual||70}%</span>
                          <span style={{fontSize:8,color:(p.fadiga||0)>60?T.danger:T.muted}}>⚡{p.fadiga||0}%</span>
                        </div>
                      </div>
                    </div>
                    <div style={{fontSize:10,color:T.gold}}>Pot.{attrs.potencial_revelado||0}%</div>
                  </div>
                  {['velocidade','resistencia','orientacao','coragem','forca'].map(k=>{
                    const NOMES={velocidade:'VEL',resistencia:'RES',orientacao:'ORI',coragem:'COR',forca:'FOR'}
                    const val=attrs[k]||0
                    const c2=val>=80?T.success:val>=65?T.blue:val>=50?T.gold:T.danger
                    return(
                      <div key={k} style={{display:'flex',alignItems:'center',gap:8,padding:'2px 0'}}>
                        <div style={{width:28,fontSize:8,color:T.muted,fontWeight:600}}>{NOMES[k]}</div>
                        <div style={{flex:1,height:5,background:'rgba(255,255,255,.05)',borderRadius:3,overflow:'hidden'}}>
                          <div style={{height:'100%',width:`${val}%`,background:c2,borderRadius:3,boxShadow:`0 0 4px ${c2}50`}}/>
                        </div>
                        <div style={{width:22,fontSize:10,fontWeight:700,color:c2,textAlign:'right'}}>{val}</div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
