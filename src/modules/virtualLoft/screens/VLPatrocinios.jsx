// src/modules/virtualLoft/screens/VLPatrocinios.jsx — V2 Exigências + bónus
import { useState } from 'react'

const T={bg:'#050A14',surface:'#0D1829',s2:'#1A2A45',gold:'#C9A84C',blue:'#4FC3F7',text:'#E8EDF5',muted:'#6B7A99',success:'#2DD4A7',danger:'#F87171',purple:'#A855F7',orange:'#FB923C'}
function lerLS(){try{return JSON.parse(localStorage.getItem('vl_carreira'))}catch{return null}}
function gravarLS(d){try{localStorage.setItem('vl_carreira',JSON.stringify(d))}catch{}}
function GL(){return <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,#C9A84C,transparent)',opacity:.8}}/>}

const NIVEL_ORDER=['local','distrital','regional','nacional','internacional','olimpico']

const PATROCINADORES=[
  {
    id:'agriaves',nome:'AgriAves Portugal',sector:'Alimentação',logo:'🌾',cor:'#4ADE80',
    desc:'Líder em alimentação para aves de competição',
    nivelMinimo:'local',semanas:8,valorSemanal:150,
    bonus:'Desconto 20% alimentação',bonusValor:0,
    exigencias:[
      {id:'e1',desc:'Participar em 3 provas',tipo:'provas_total',meta:3},
    ],
    bonusVitoria:100,premium:false,
  },
  {
    id:'vetplus',nome:'VetPlus Clínica',sector:'Veterinária',logo:'🏥',cor:'#2DD4A7',
    desc:'Clínica veterinária especializada em aves',
    nivelMinimo:'local',semanas:8,valorSemanal:200,
    bonus:'Consulta veterinária gratuita/mês',bonusValor:0,
    exigencias:[{id:'e2',desc:'Manter 10+ pombos activos',tipo:'pombos_activos',meta:10}],
    bonusVitoria:150,premium:false,
  },
  {
    id:'colombosport',nome:'Colombo Sport',sector:'Equipamento',logo:'🏅',cor:'#4FC3F7',
    desc:'Equipamento desportivo columbófilo premium',
    nivelMinimo:'distrital',semanas:12,valorSemanal:350,
    bonus:'Kit de treino grátis',bonusValor:200,
    exigencias:[
      {id:'e3',desc:'Ganhar 1 prova',tipo:'vitorias',meta:1},
      {id:'e4',desc:'Atingir reputação Distrital',tipo:'nivel_rep',meta:'distrital'},
    ],
    bonusVitoria:300,premium:false,
  },
  {
    id:'pombaltech',nome:'PombalTech',sector:'Tecnologia',logo:'💻',cor:'#A855F7',
    desc:'Software de gestão columbófila líder de mercado',
    nivelMinimo:'regional',semanas:16,valorSemanal:500,
    bonus:'Análise de dados premium',bonusValor:0,
    exigencias:[
      {id:'e5',desc:'Top 20% em 3 provas',tipo:'top_percentil',meta:3},
      {id:'e6',desc:'Atingir reputação Regional',tipo:'nivel_rep',meta:'regional'},
    ],
    bonusVitoria:500,premium:false,
  },
  {
    id:'iberica',nome:'Ibérica de Pombos',sector:'Genética',logo:'🧬',cor:'#C9A84C',
    desc:'Centro de genética avançada — os melhores genes da Península',
    nivelMinimo:'nacional',semanas:20,valorSemanal:800,
    bonus:'Análise genética gratuita/época',bonusValor:500,
    exigencias:[
      {id:'e7',desc:'Ganhar 5 provas',tipo:'vitorias',meta:5},
      {id:'e8',desc:'Atingir reputação Nacional',tipo:'nivel_rep',meta:'nacional'},
    ],
    bonusVitoria:800,premium:true,
  },
  {
    id:'champion',nome:'Champion Feed',sector:'Nutrição Elite',logo:'⭐',cor:'#F87171',
    desc:'Nutrição de elite usada pelos campeões mundiais',
    nivelMinimo:'internacional',semanas:24,valorSemanal:1500,
    bonus:'Plano nutricional personalizado por pombo',bonusValor:1000,
    exigencias:[
      {id:'e9',desc:'Ganhar 10 provas',tipo:'vitorias',meta:10},
      {id:'e10',desc:'Atingir reputação Internacional',tipo:'nivel_rep',meta:'internacional'},
      {id:'e11',desc:'Top 5% em 5 provas',tipo:'top_percentil',meta:5},
    ],
    bonusVitoria:2000,premium:true,
  },
]

function calcProgresso(exigencia, carreira){
  const hist=carreira.historico_provas||[]
  const nivelIdx=NIVEL_ORDER.indexOf(carreira.nivel_reputacao||'local')
  switch(exigencia.tipo){
    case 'provas_total': return{atual:hist.length,meta:exigencia.meta}
    case 'vitorias':     return{atual:hist.filter(r=>r.posicao===1).length,meta:exigencia.meta}
    case 'pombos_activos':return{atual:(carreira.pombos||[]).filter(p=>p.estado==='activo').length,meta:exigencia.meta}
    case 'top_percentil':return{atual:hist.filter(r=>(r.percentil||0)>=80).length,meta:exigencia.meta}
    case 'nivel_rep':    return{atual:NIVEL_ORDER.indexOf(exigencia.meta)<=nivelIdx?1:0,meta:1,texto:exigencia.meta}
    default:             return{atual:0,meta:exigencia.meta}
  }
}

export default function VLPatrocinios({carreira,onVoltar,onGuardar}){
  const [cl,setCL]=useState(()=>lerLS()||carreira)
  const c=cl
  const salvar=d=>{gravarLS(d);setCL({...d});onGuardar?.(d)}
  const [tab,setTab]=useState('disponiveis')
  const [msg,setMsg]=useState(null)

  const patActivos=c.patrocinios||[]
  const totalSemanal=patActivos.reduce((s,p)=>s+(p.valorSemanal||0),0)
  const nivelIdx=NIVEL_ORDER.indexOf(c.nivel_reputacao||'local')
  const showMsg=(texto,tipo='ok')=>{setMsg({texto,tipo});setTimeout(()=>setMsg(null),4000)}

  const assinar=(pat)=>{
    if(patActivos.find(p=>p.id===pat.id)){showMsg('Já tens este contrato activo!','erro');return}
    const novosPat=[...patActivos,{...pat,semanasRestantes:pat.semanas,semanaInicio:c.semana||1,ativo:true}]
    salvar({...c,patrocinios:novosPat})
    showMsg(`${pat.nome} contratado! +${pat.valorSemanal}€/semana`)
  }

  const cancelar=(id)=>{
    salvar({...c,patrocinios:patActivos.filter(p=>p.id!==id)})
    showMsg('Contrato cancelado.','info')
  }

  const idsActivos=new Set(patActivos.map(p=>p.id))

  return(
    <div style={{minHeight:'100vh',background:T.bg,color:T.text,fontFamily:"system-ui,sans-serif"}}>
      <div style={{background:`linear-gradient(180deg,${T.surface},${T.bg})`,borderBottom:`1px solid ${T.s2}`,padding:'14px 16px',position:'relative'}}>
        <GL/>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
          <button onClick={onVoltar} style={{background:T.surface,border:`1px solid ${T.s2}`,borderRadius:8,width:32,height:32,color:T.muted,cursor:'pointer',fontSize:16}}>←</button>
          <div style={{flex:1}}>
            <div style={{fontSize:16,fontWeight:800}}>🤝 Patrocínios</div>
            <div style={{fontSize:9,color:T.muted}}>{patActivos.length} activos · +{totalSemanal.toLocaleString()}€/sem · {(c.nivel_reputacao||'local').toUpperCase()}</div>
          </div>
        </div>
        <div style={{display:'flex',gap:6}}>
          {[['disponiveis','Disponíveis'],['activos','Activos'],['exigencias','Exigências']].map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id)}
              style={{flex:'none',padding:'7px 11px',borderRadius:8,border:tab===id?'none':`1px solid ${T.s2}`,background:tab===id?`${T.success}20`:'transparent',color:tab===id?T.success:T.muted,fontSize:10,fontWeight:tab===id?700:400,cursor:'pointer',fontFamily:'inherit'}}>
              {label}{id==='activos'&&patActivos.length>0?` (${patActivos.length})`:''}
            </button>
          ))}
        </div>
      </div>

      {msg&&<div style={{margin:'10px 16px 0',padding:'10px 14px',background:msg.tipo==='ok'?`${T.success}10`:msg.tipo==='erro'?`${T.danger}10`:`${T.blue}10`,border:`1px solid ${msg.tipo==='ok'?T.success:msg.tipo==='erro'?T.danger:T.blue}30`,borderRadius:10,fontSize:12,color:msg.tipo==='ok'?T.success:msg.tipo==='erro'?T.danger:T.blue,fontWeight:600}}>
        {msg.tipo==='ok'?'✅':msg.tipo==='erro'?'❌':'ℹ️'} {msg.texto}
      </div>}

      <div style={{padding:'12px 16px',display:'flex',flexDirection:'column',gap:10}}>

        {/* DISPONÍVEIS */}
        {tab==='disponiveis'&&PATROCINADORES.map(pat=>{
          const jatem=idsActivos.has(pat.id)
          const pode=NIVEL_ORDER.indexOf(pat.nivelMinimo)<=nivelIdx
          const exigsOK=pat.exigencias.every(e=>{const p=calcProgresso(e,c);return p.atual>=p.meta})
          const cor=pat.cor
          return(
            <div key={pat.id} style={{background:jatem?`${cor}08`:T.surface,border:`1px solid ${jatem?cor+'40':pode?T.s2:T.s2}`,borderRadius:14,padding:'14px',opacity:pode?1:.5,position:'relative',overflow:'hidden'}}>
              {jatem&&<GL/>}
              {pat.premium&&<div style={{position:'absolute',top:10,right:10,fontSize:9,color:T.gold,background:`${T.gold}15`,padding:'2px 6px',borderRadius:4,fontWeight:700}}>⭐ PREMIUM</div>}
              <div style={{display:'flex',gap:12,alignItems:'flex-start',marginBottom:10}}>
                <div style={{width:48,height:48,borderRadius:12,background:`${cor}15`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,flexShrink:0}}>{pat.logo}</div>
                <div style={{flex:1,paddingRight:40}}>
                  <div style={{fontSize:14,fontWeight:800,color:jatem?cor:T.text,marginBottom:2}}>{pat.nome}</div>
                  <div style={{fontSize:9,color:T.muted,marginBottom:4}}>{pat.desc}</div>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    <span style={{fontSize:9,color:cor,background:`${cor}15`,padding:'2px 6px',borderRadius:4,fontWeight:600}}>{pat.sector}</span>
                    <span style={{fontSize:9,color:T.gold,fontWeight:700}}>+{pat.valorSemanal}€/sem</span>
                    <span style={{fontSize:9,color:T.muted}}>{pat.semanas} semanas</span>
                  </div>
                </div>
              </div>
              {/* Bónus */}
              <div style={{padding:'8px 10px',background:'rgba(255,255,255,.03)',borderRadius:8,marginBottom:8}}>
                <div style={{fontSize:9,color:T.muted,marginBottom:2}}>🎁 BÓNUS INCLUÍDO</div>
                <div style={{fontSize:10,color:T.text}}>{pat.bonus}</div>
                {pat.bonusVitoria>0&&<div style={{fontSize:9,color:T.gold,marginTop:2}}>🏆 +{pat.bonusVitoria}€ por cada vitória em prova</div>}
              </div>
              {/* Exigências */}
              {pat.exigencias.length>0&&(
                <div style={{marginBottom:8}}>
                  <div style={{fontSize:8,color:T.muted,fontWeight:700,letterSpacing:1,marginBottom:4}}>EXIGÊNCIAS DO PATROCINADOR</div>
                  {pat.exigencias.map(e=>{
                    const prog=calcProgresso(e,c)
                    const ok=prog.atual>=prog.meta
                    return(
                      <div key={e.id} style={{display:'flex',alignItems:'center',gap:8,padding:'4px 0'}}>
                        <span style={{fontSize:10,color:ok?T.success:T.muted}}>{ok?'✓':'○'}</span>
                        <div style={{flex:1}}>
                          <div style={{fontSize:9,color:ok?T.text:T.muted}}>{e.desc}</div>
                          {!ok&&e.tipo!=='nivel_rep'&&(
                            <div style={{height:2,background:T.s2,borderRadius:1,marginTop:2}}>
                              <div style={{height:'100%',width:`${Math.min(100,(prog.atual/prog.meta)*100)}%`,background:cor,borderRadius:1}}/>
                            </div>
                          )}
                        </div>
                        <span style={{fontSize:9,color:ok?T.success:T.muted,flexShrink:0}}>{prog.atual}/{prog.meta}</span>
                      </div>
                    )
                  })}
                </div>
              )}
              {!pode&&<div style={{fontSize:9,color:T.danger,marginBottom:8}}>🔒 Requer nível {pat.nivelMinimo.toUpperCase()}</div>}
              {!jatem?(
                <button onClick={()=>pode&&exigsOK&&assinar(pat)} disabled={!pode||!exigsOK}
                  style={{width:'100%',padding:'10px',borderRadius:8,border:'none',background:pode&&exigsOK?`linear-gradient(135deg,${cor},${cor}cc)`:T.s2,color:pode&&exigsOK?'#050A14':T.muted,fontSize:11,fontWeight:700,cursor:pode&&exigsOK?'pointer':'default',fontFamily:'inherit',boxShadow:pode&&exigsOK?`0 4px 12px ${cor}30`:'none'}}>
                  {!pode?'🔒 Nível insuficiente':!exigsOK?'⏳ Exigências por cumprir':'✅ Assinar Contrato'}
                </button>
              ):<div style={{textAlign:'center',fontSize:11,color:cor,fontWeight:700,padding:'8px 0'}}>✅ Contrato activo · {patActivos.find(p=>p.id===pat.id)?.semanasRestantes||0} sem. restantes</div>}
            </div>
          )
        })}

        {/* ACTIVOS */}
        {tab==='activos'&&(
          patActivos.length===0?(
            <div style={{textAlign:'center',padding:'40px 20px'}}>
              <div style={{fontSize:40,marginBottom:12}}>🤝</div>
              <div style={{fontSize:13,color:T.muted}}>Sem contratos activos</div>
            </div>
          ):patActivos.map(p=>{
            const cfg=PATROCINADORES.find(x=>x.id===p.id)||p
            const urgente=(p.semanasRestantes||0)<=3
            return(
              <div key={p.id} style={{background:`${cfg.cor||T.success}08`,border:`1px solid ${urgente?T.danger:cfg.cor||T.success}30`,borderRadius:14,padding:'14px',position:'relative',overflow:'hidden'}}>
                <GL/>
                {urgente&&<div style={{padding:'6px 12px',background:`${T.danger}10`,border:`1px solid ${T.danger}25`,borderRadius:6,fontSize:10,color:T.danger,fontWeight:700,marginBottom:10}}>⚠️ Contrato expira em {p.semanasRestantes} semana{p.semanasRestantes>1?'s':''}!</div>}
                <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:10}}>
                  <span style={{fontSize:22}}>{cfg.logo||'🤝'}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:T.text}}>{p.nome}</div>
                    <div style={{display:'flex',gap:8}}>
                      <span style={{fontSize:10,color:T.success,fontWeight:700}}>+{p.valorSemanal}€/sem</span>
                      <span style={{fontSize:10,color:T.muted}}>{p.semanasRestantes} sem. restantes</span>
                    </div>
                  </div>
                </div>
                {/* Barra de tempo restante */}
                <div style={{height:4,background:T.s2,borderRadius:2,marginBottom:8}}>
                  <div style={{height:'100%',width:`${Math.min(100,((p.semanasRestantes||0)/(cfg.semanas||8))*100)}%`,background:urgente?T.danger:cfg.cor||T.success,borderRadius:2,transition:'width .5s'}}/>
                </div>
                {cfg.bonusVitoria>0&&<div style={{fontSize:9,color:T.gold,marginBottom:8}}>🏆 +{cfg.bonusVitoria}€ por vitória activo</div>}
                <button onClick={()=>cancelar(p.id)}
                  style={{width:'100%',padding:'8px',borderRadius:8,border:`1px solid ${T.danger}20`,background:`${T.danger}08`,color:T.danger,fontSize:10,cursor:'pointer',fontFamily:'inherit'}}>
                  Cancelar contrato
                </button>
              </div>
            )
          })
        )}

        {/* EXIGÊNCIAS */}
        {tab==='exigencias'&&(
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            <div style={{padding:'10px 14px',background:`${T.blue}08`,border:`1px solid ${T.blue}20`,borderRadius:10,fontSize:10,color:T.muted}}>
              💡 Cumpre as exigências para desbloquear patrocinadores de nível superior.
            </div>
            {PATROCINADORES.filter(pat=>!idsActivos.has(pat.id)).map(pat=>{
              const pode=NIVEL_ORDER.indexOf(pat.nivelMinimo)<=nivelIdx
              const cor=pat.cor
              return(
                <div key={pat.id} style={{background:T.surface,border:`1px solid ${T.s2}`,borderRadius:10,padding:'12px 14px',opacity:pode?1:.6}}>
                  <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}>
                    <span style={{fontSize:18}}>{pat.logo}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,fontWeight:700,color:T.text}}>{pat.nome}</div>
                      <div style={{fontSize:9,color:cor}}>+{pat.valorSemanal}€/sem</div>
                    </div>
                    {!pode&&<span style={{fontSize:9,color:T.danger,background:`${T.danger}10`,padding:'2px 6px',borderRadius:4}}>🔒 {pat.nivelMinimo}</span>}
                  </div>
                  {pat.exigencias.map(e=>{
                    const prog=calcProgresso(e,c)
                    const ok=prog.atual>=prog.meta
                    const pct=Math.min(100,Math.round((prog.atual/prog.meta)*100))
                    return(
                      <div key={e.id} style={{padding:'6px 0',borderBottom:`1px solid ${T.s2}`}}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                          <span style={{fontSize:10,color:ok?T.success:T.text}}>{ok?'✅ ':''}{e.desc}</span>
                          <span style={{fontSize:9,color:ok?T.success:T.muted,fontWeight:700}}>{prog.atual}/{prog.meta}</span>
                        </div>
                        {!ok&&e.tipo!=='nivel_rep'&&(
                          <div style={{height:3,background:T.s2,borderRadius:2}}>
                            <div style={{height:'100%',width:`${pct}%`,background:cor,borderRadius:2}}/>
                          </div>
                        )}
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
