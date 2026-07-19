// src/modules/virtualLoft/screens/VLStaff.jsx — V2 Efeitos reais + evolução
import { useState } from 'react'

const T={bg:'#050A14',surface:'#0D1829',s2:'#1A2A45',gold:'#C9A84C',blue:'#4FC3F7',text:'#E8EDF5',muted:'#6B7A99',success:'#2DD4A7',danger:'#F87171',purple:'#A855F7',orange:'#FB923C'}
function lerLS(){try{return JSON.parse(localStorage.getItem('vl_carreira'))}catch{return null}}
function gravarLS(d){try{localStorage.setItem('vl_carreira',JSON.stringify(d))}catch{}}
function GL(){return <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,#C9A84C,transparent)',opacity:.8}}/>}

const STAFF_TIPOS = {
  veterinario: {
    icon:'🏥', label:'Veterinário', cor:'#2DD4A7',
    efeitos:['Lesões curam 2× mais rápido','Previne doenças (-60%)','Consultas gratuitas'],
    salarios:[800,1200,1800,2500],
    candidatos:[
      {id:'v1',nome:'Dr. Rui Figueiredo',   exp:8, idade:42, nota:'Especialista em columbofilia. Ex-clínica nacional.',    estrelas:4},
      {id:'v2',nome:'Dra. Ana Sousa',        exp:5, idade:35, nota:'Boa base clínica. Especialização em aves.',            estrelas:3},
      {id:'v3',nome:'Dr. Carlos Mendes',     exp:15,idade:54, nota:'Lendário no circuito. Tratou campeões nacionais.',     estrelas:5},
    ]
  },
  treinador: {
    icon:'🎯', label:'Treinador', cor:'#C9A84C',
    efeitos:['+20% ganho de atributos por treino','Planos individualizados','Detecta potencial oculto mais rápido'],
    salarios:[600,900,1400,2000],
    candidatos:[
      {id:'t1',nome:'João Correia',           exp:6, idade:38, nota:'Metodologia moderna. Especialista em velocidade.',     estrelas:3},
      {id:'t2',nome:'Manuel Rodrigues',       exp:12,idade:51, nota:'Formado em zoologia desportiva. Resultados provados.',estrelas:4},
      {id:'t3',nome:'António Silva',          exp:20,idade:62, nota:'Formou 3 campeões nacionais. Lenda viva.',            estrelas:5},
    ]
  },
  geneticista: {
    icon:'🧬', label:'Geneticista', cor:'#A855F7',
    efeitos:['Revela 1 atributo oculto/semana','Análise de compatibilidade de casais','Detecta genes raros'],
    salarios:[1000,1500,2200,3000],
    candidatos:[
      {id:'g1',nome:'Dra. Filipa Costa',     exp:4, idade:31, nota:'Doutorada em genética aviária. Muito promissora.',     estrelas:3},
      {id:'g2',nome:'Prof. Jorge Leal',       exp:9, idade:45, nota:'Investigador universitário. Publicou 12 estudos.',    estrelas:4},
      {id:'g3',nome:'Dra. Sofia Marques',    exp:14,idade:48, nota:'Descobriu o gene da orientação. Única no mundo.',     estrelas:5},
    ]
  },
  nutricionista: {
    icon:'🌾', label:'Nutricionista', cor:'#FB923C',
    efeitos:['Fadiga recupera +15%/dia','Forma máxima +10 pontos','Misturas personalizadas'],
    salarios:[500,750,1100,1600],
    candidatos:[
      {id:'n1',nome:'Luísa Ferreira',         exp:3, idade:28, nota:'Especialista em aves de competição. Energética.',     estrelas:3},
      {id:'n2',nome:'Paulo Neves',            exp:7, idade:40, nota:'Criou protocolo nutricional adoptado por 50 clubes.', estrelas:4},
      {id:'n3',nome:'Dr. Miguel Araújo',      exp:11,idade:47, nota:'Nutricionista da selecção nacional. Top absoluto.',   estrelas:5},
    ]
  },
  olheiro: {
    icon:'🔭', label:'Olheiro', cor:'#38BDF8',
    efeitos:['Sugere 3 pombos/semana no Mercado','Negociação -15% no preço','Detecta talentos escondidos'],
    salarios:[400,600,900,1300],
    candidatos:[
      {id:'o1',nome:'Tiago Mota',            exp:5, idade:33, nota:'Rede de contactos em Portugal e Espanha.',            estrelas:3},
      {id:'o2',nome:'Fernando Gomes',         exp:8, idade:44, nota:'Descobriu 3 campeões nacionais. Olho clínico.',       estrelas:4},
      {id:'o3',nome:'Ricardo Pereira',        exp:13,idade:50, nota:'Actua em toda a Europa. Agenda impressionante.',     estrelas:5},
    ]
  },
}

function EstrelaRating({n,max=5,cor}){
  return(
    <div style={{display:'flex',gap:2}}>
      {Array.from({length:max}).map((_,i)=>(
        <span key={i} style={{fontSize:11,color:i<n?cor||T.gold:'rgba(255,255,255,.1)'}}>{i<n?'★':'☆'}</span>
      ))}
    </div>
  )
}

function CardStaffContratado({m, onDespedir, tipo}){
  const cfg = STAFF_TIPOS[m.tipo] || STAFF_TIPOS[tipo]
  if (!cfg) return null
  const cor = cfg.cor
  return(
    <div style={{background:T.surface,border:`1px solid ${cor}25`,borderRadius:14,padding:'14px',position:'relative',overflow:'hidden'}}>
      <GL/>
      <div style={{display:'flex',gap:12,alignItems:'flex-start',marginBottom:10}}>
        <div style={{width:46,height:46,borderRadius:12,background:`${cor}15`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>{cfg.icon}</div>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:800,color:T.text}}>{m.nome}</div>
          <div style={{fontSize:10,color:cor,fontWeight:600}}>{cfg.label}</div>
          <div style={{display:'flex',gap:8,marginTop:3}}>
            <span style={{fontSize:9,color:T.muted}}>Exp: {m.exp} anos</span>
            <span style={{fontSize:9,color:T.muted}}>Idade: {m.idade}</span>
          </div>
        </div>
        <div style={{textAlign:'right',flexShrink:0}}>
          <EstrelaRating n={m.estrelas} cor={cor}/>
          <div style={{fontSize:11,color:T.gold,fontWeight:700,marginTop:4}}>{(m.salario||0).toLocaleString()}€/mês</div>
        </div>
      </div>
      {/* Efeitos activos */}
      <div style={{display:'flex',flexDirection:'column',gap:4,marginBottom:10}}>
        {cfg.efeitos.map((ef,i)=>(
          <div key={i} style={{display:'flex',alignItems:'center',gap:6,padding:'5px 8px',background:`${cor}08`,border:`1px solid ${cor}20`,borderRadius:6}}>
            <span style={{fontSize:10,color:T.success}}>✓</span>
            <span style={{fontSize:10,color:T.text}}>{ef}</span>
          </div>
        ))}
      </div>
      <div style={{fontSize:9,color:T.muted,fontStyle:'italic',marginBottom:8}}>"{m.nota}"</div>
      <button onClick={()=>onDespedir(m.id)}
        style={{width:'100%',padding:'8px',borderRadius:8,border:`1px solid ${T.danger}20`,background:`${T.danger}08`,color:T.danger,fontSize:10,cursor:'pointer',fontFamily:'inherit'}}>
        Despedir
      </button>
    </div>
  )
}

function ModalContratar({tipo, onContratar, onFechar, orcamento}){
  const cfg = STAFF_TIPOS[tipo]
  if (!cfg) return null
  const [sel, setSel] = useState(null)
  const candidatoSel = cfg.candidatos.find(c=>c.id===sel)
  const salario = candidatoSel ? cfg.salarios[candidatoSel.estrelas-3] || cfg.salarios[0] : 0
  const podeContratar = sel && orcamento >= salario*3

  return(
    <div style={{position:'fixed',inset:0,background:'rgba(3,6,16,.96)',zIndex:1000,display:'flex',flexDirection:'column',fontFamily:"system-ui,sans-serif"}}>
      <div style={{background:T.bg,flex:1,overflowY:'auto',maxWidth:480,margin:'0 auto',width:'100%'}}>
        <div style={{background:`linear-gradient(180deg,${T.surface},${T.bg})`,borderBottom:`1px solid ${T.s2}`,padding:'16px',position:'relative'}}>
          <GL/>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <button onClick={onFechar} style={{background:T.s2,border:'none',borderRadius:8,width:32,height:32,color:T.muted,cursor:'pointer',fontSize:14}}>←</button>
            <div>
              <div style={{fontSize:15,fontWeight:800,color:cfg.cor}}>{cfg.icon} Contratar {cfg.label}</div>
              <div style={{fontSize:9,color:T.muted}}>Selecciona um candidato</div>
            </div>
          </div>
        </div>
        <div style={{padding:'14px 16px',display:'flex',flexDirection:'column',gap:10}}>
          {/* Efeitos do tipo */}
          <div style={{padding:'12px',background:`${cfg.cor}08`,border:`1px solid ${cfg.cor}20`,borderRadius:10}}>
            <div style={{fontSize:9,color:cfg.cor,fontWeight:700,letterSpacing:1,marginBottom:6}}>EFEITOS NO POMBAL</div>
            {cfg.efeitos.map((ef,i)=><div key={i} style={{fontSize:10,color:T.text,padding:'3px 0'}}>✓ {ef}</div>)}
          </div>

          {/* Candidatos */}
          {cfg.candidatos.map(c=>{
            const sal = cfg.salarios[c.estrelas-3] || cfg.salarios[0]
            const isSel = sel===c.id
            const podeContr = orcamento >= sal*3
            return(
              <div key={c.id} onClick={()=>podeContr&&setSel(isSel?null:c.id)}
                style={{padding:'14px',background:isSel?`${cfg.cor}10`:T.surface,border:`${isSel?2:1}px solid ${isSel?cfg.cor:T.s2}`,borderRadius:12,cursor:podeContr?'pointer':'not-allowed',opacity:podeContr?1:.5,position:'relative',overflow:'hidden',transition:'all .15s'}}>
                {isSel&&<GL/>}
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:isSel?cfg.cor:T.text}}>{c.nome}</div>
                    <div style={{fontSize:9,color:T.muted,marginTop:1}}>Exp: {c.exp} anos · {c.idade} anos</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <EstrelaRating n={c.estrelas} cor={cfg.cor}/>
                    <div style={{fontSize:11,color:T.gold,fontWeight:700,marginTop:2}}>{sal.toLocaleString()}€/mês</div>
                  </div>
                </div>
                <div style={{fontSize:10,color:T.muted,fontStyle:'italic'}}>"{c.nota}"</div>
                {!podeContr&&<div style={{fontSize:9,color:T.danger,marginTop:6}}>Orçamento insuficiente (mín. {(sal*3).toLocaleString()}€)</div>}
              </div>
            )
          })}

          {sel&&(
            <button onClick={()=>{
              const c=cfg.candidatos.find(x=>x.id===sel)
              const sal=cfg.salarios[c.estrelas-3]||cfg.salarios[0]
              onContratar({...c, tipo, salario:sal, cfg_tipo:tipo})
            }} style={{width:'100%',padding:'14px',borderRadius:12,border:'none',background:`linear-gradient(135deg,${cfg.cor},${cfg.cor}cc)`,color:'#050A14',fontSize:13,fontWeight:800,cursor:'pointer',fontFamily:'inherit',boxShadow:`0 4px 16px ${cfg.cor}30`}}>
              ✅ Contratar — {(cfg.salarios[cfg.candidatos.find(x=>x.id===sel)?.estrelas-3]||0).toLocaleString()}€/mês
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VLStaff({carreira, onVoltar, onGuardar}){
  const [cl,setCL]=useState(()=>lerLS()||carreira)
  const c=cl
  const salvar=d=>{gravarLS(d);setCL({...d});onGuardar?.(d)}

  const [tab,setTab]=useState('equipa')
  const [modalTipo,setModalTipo]=useState(null)
  const [msg,setMsg]=useState(null)

  const staff=c.staff||[]
  const custoMensal=staff.reduce((s,m)=>s+(m.salario||0),0)
  const custoSemanal=Math.round(custoMensal/4)

  const despedir=id=>{
    salvar({...c,staff:staff.filter(m=>m.id!==id)})
    setMsg({tipo:'info',texto:'Membro despedido.'})
    setTimeout(()=>setMsg(null),3000)
  }

  const contratar=membro=>{
    const novoStaff=[...staff,{...membro,id:`s_${Date.now()}`}]
    salvar({...c,staff:novoStaff,orcamento:Math.max(0,(c.orcamento||0)-membro.salario*3),movimentos:[...(c.movimentos||[]),{tipo:'staff_caucao',descricao:`Contratação: ${membro.nome} (caução)`,valor:-membro.salario*3,semana:c.semana||1}]})
    setModalTipo(null)
    setMsg({tipo:'ok',texto:`${membro.nome} contratado!`})
    setTimeout(()=>setMsg(null),3000)
  }

  const tiposContratados=new Set(staff.map(m=>m.tipo))

  return(
    <div style={{minHeight:'100vh',background:T.bg,color:T.text,fontFamily:"system-ui,sans-serif"}}>
      {modalTipo&&<ModalContratar tipo={modalTipo} onContratar={contratar} onFechar={()=>setModalTipo(null)} orcamento={c.orcamento||0}/>}

      <div style={{background:`linear-gradient(180deg,${T.surface},${T.bg})`,borderBottom:`1px solid ${T.s2}`,padding:'14px 16px',position:'relative'}}>
        <GL/>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
          <button onClick={onVoltar} style={{background:T.surface,border:`1px solid ${T.s2}`,borderRadius:8,width:32,height:32,color:T.muted,cursor:'pointer',fontSize:16}}>←</button>
          <div style={{flex:1}}>
            <div style={{fontSize:16,fontWeight:800}}>👥 Staff</div>
            <div style={{fontSize:9,color:T.muted}}>{staff.length} contratados · {custoSemanal.toLocaleString()}€/sem · {(c.orcamento||0).toLocaleString()}€ disponível</div>
          </div>
        </div>
        <div style={{display:'flex',gap:6}}>
          {[['equipa','Equipa'],['contratar','Contratar'],['efeitos','Efeitos']].map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id)}
              style={{flex:'none',padding:'7px 12px',borderRadius:8,border:tab===id?'none':`1px solid ${T.s2}`,background:tab===id?`${T.blue}25`:'transparent',color:tab===id?T.blue:T.muted,fontSize:11,fontWeight:tab===id?700:400,cursor:'pointer',fontFamily:'inherit'}}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {msg&&<div style={{margin:'10px 16px 0',padding:'10px 14px',background:msg.tipo==='ok'?`${T.success}10`:`${T.blue}10`,border:`1px solid ${msg.tipo==='ok'?T.success:T.blue}30`,borderRadius:10,fontSize:12,color:msg.tipo==='ok'?T.success:T.blue,fontWeight:600}}>{msg.tipo==='ok'?'✅':'ℹ️'} {msg.texto}</div>}

      <div style={{padding:'12px 16px',display:'flex',flexDirection:'column',gap:10}}>

        {/* EQUIPA ACTUAL */}
        {tab==='equipa'&&(
          staff.length===0?(
            <div style={{textAlign:'center',padding:'40px 20px'}}>
              <div style={{fontSize:40,marginBottom:12}}>👥</div>
              <div style={{fontSize:13,color:T.muted,marginBottom:4}}>Nenhum staff contratado</div>
              <div style={{fontSize:11,color:T.s2}}>Vai a "Contratar" para contratar especialistas</div>
            </div>
          ):staff.map(m=><CardStaffContratado key={m.id} m={m} onDespedir={despedir} tipo={m.tipo}/>)
        )}

        {/* CONTRATAR */}
        {tab==='contratar'&&(
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            <div style={{padding:'10px 14px',background:`${T.gold}08`,border:`1px solid ${T.gold}20`,borderRadius:10,fontSize:10,color:T.muted}}>
              💡 O custo de contratação é 3× o salário mensal como caução.
            </div>
            {Object.entries(STAFF_TIPOS).map(([tipo,cfg])=>{
              const jatem=tiposContratados.has(tipo)
              const salMin=cfg.salarios[0]
              return(
                <div key={tipo} style={{background:T.surface,border:`1px solid ${jatem?cfg.cor+'40':T.s2}`,borderRadius:12,padding:'14px',position:'relative',overflow:'hidden'}}>
                  {jatem&&<GL/>}
                  <div style={{display:'flex',gap:12,alignItems:'center'}}>
                    <div style={{width:44,height:44,borderRadius:12,background:`${cfg.cor}15`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>{cfg.icon}</div>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <div style={{fontSize:13,fontWeight:700,color:jatem?cfg.cor:T.text}}>{cfg.label}</div>
                        {jatem?<span style={{fontSize:9,color:cfg.cor,background:`${cfg.cor}15`,padding:'2px 6px',borderRadius:4,fontWeight:700}}>CONTRATADO</span>:
                          <span style={{fontSize:10,color:T.gold}}>a partir de {salMin}€/mês</span>}
                      </div>
                      <div style={{fontSize:10,color:T.muted,marginTop:2}}>{cfg.efeitos[0]}</div>
                    </div>
                  </div>
                  {!jatem&&(
                    <button onClick={()=>setModalTipo(tipo)}
                      style={{marginTop:10,width:'100%',padding:'9px',borderRadius:8,border:`1px solid ${cfg.cor}30`,background:`${cfg.cor}10`,color:cfg.cor,fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                      Ver candidatos →
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* EFEITOS ACTIVOS */}
        {tab==='efeitos'&&(
          staff.length===0?(
            <div style={{textAlign:'center',padding:'40px 20px'}}>
              <div style={{fontSize:40,marginBottom:12}}>✨</div>
              <div style={{fontSize:13,color:T.muted}}>Sem efeitos activos</div>
            </div>
          ):(
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              <div style={{padding:'10px 14px',background:`${T.success}08`,border:`1px solid ${T.success}20`,borderRadius:10,fontSize:11,color:T.success,fontWeight:600}}>
                ✨ {staff.reduce((s,m)=>s+(STAFF_TIPOS[m.tipo]?.efeitos?.length||0),0)} efeitos activos no pombal
              </div>
              {staff.map(m=>{
                const cfg=STAFF_TIPOS[m.tipo]
                if(!cfg)return null
                return(
                  <div key={m.id} style={{background:T.surface,border:`1px solid ${cfg.cor}20`,borderRadius:12,padding:'12px 14px',position:'relative',overflow:'hidden'}}>
                    <GL/>
                    <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}>
                      <span style={{fontSize:18}}>{cfg.icon}</span>
                      <div>
                        <div style={{fontSize:12,fontWeight:700,color:cfg.cor}}>{m.nome}</div>
                        <div style={{fontSize:9,color:T.muted}}>{cfg.label} · ★{m.estrelas}</div>
                      </div>
                    </div>
                    {cfg.efeitos.map((ef,i)=>(
                      <div key={i} style={{display:'flex',gap:6,padding:'5px 8px',background:`${cfg.cor}08`,borderRadius:6,marginBottom:3}}>
                        <span style={{fontSize:10,color:T.success}}>✓</span>
                        <span style={{fontSize:10,color:T.text}}>{ef}</span>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>
    </div>
  )
}
