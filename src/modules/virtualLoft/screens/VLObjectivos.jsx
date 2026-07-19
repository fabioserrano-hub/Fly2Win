// src/modules/virtualLoft/screens/VLObjectivos.jsx — V2 Multi-nível + secretos
import { useState } from 'react'

const T={bg:'#050A14',surface:'#0D1829',s2:'#1A2A45',gold:'#C9A84C',blue:'#4FC3F7',text:'#E8EDF5',muted:'#6B7A99',success:'#2DD4A7',danger:'#F87171',purple:'#A855F7',orange:'#FB923C'}
function lerLS(){try{return JSON.parse(localStorage.getItem('vl_carreira'))}catch{return null}}
function gravarLS(d){try{localStorage.setItem('vl_carreira',JSON.stringify(d))}catch{}}
function GL(){return <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,#C9A84C,transparent)',opacity:.8}}/>}

const NIVEL_ORDER=['local','distrital','regional','nacional','internacional','olimpico']

// Objectivos encadeados — completar um desbloqueia o seguinte
const CADEIA_PROVAS=[
  {id:'op1',titulo:'Primeira Prova',desc:'Participa na tua primeira prova',icon:'🏁',meta:1,tipo:'provas_total',premio:{orc:200},dif:'facil'},
  {id:'op2',titulo:'Top 50%',desc:'Termina uma prova no top 50%',icon:'📈',meta:1,tipo:'top50',premio:{orc:300},dif:'facil',requerId:'op1'},
  {id:'op3',titulo:'Pódio',desc:'Termina uma prova no top 3',icon:'🥈',meta:1,tipo:'podio',premio:{orc:500,rep:3},dif:'medio',requerId:'op2'},
  {id:'op4',titulo:'Primeira Vitória',desc:'Ganha uma prova',icon:'🥇',meta:1,tipo:'vitorias',premio:{orc:1000,rep:5},dif:'medio',requerId:'op3'},
  {id:'op5',titulo:'Trio de Ouro',desc:'Ganha 3 provas',icon:'🏆',meta:3,tipo:'vitorias',premio:{orc:2000,rep:10},dif:'dificil',requerId:'op4'},
  {id:'op6',titulo:'Campeão',desc:'Ganha 10 provas',icon:'👑',meta:10,tipo:'vitorias',premio:{orc:5000,rep:20},dif:'lenda',requerId:'op5'},
]
const CADEIA_PLANTEL=[
  {id:'pl1',titulo:'Primeiro Plantel',desc:'Tem 5 pombos activos',icon:'🐦',meta:5,tipo:'pombos',premio:{orc:150},dif:'facil'},
  {id:'pl2',titulo:'Plantel Sólido',desc:'Tem 10 pombos activos',icon:'🦅',meta:10,tipo:'pombos',premio:{orc:300},dif:'facil',requerId:'pl1'},
  {id:'pl3',titulo:'Elite',desc:'Tem um pombo de 4 estrelas',icon:'⭐',meta:1,tipo:'rating4',premio:{orc:500,rep:5},dif:'medio',requerId:'pl2'},
  {id:'pl4',titulo:'Lenda do Plantel',desc:'Tem um pombo de 5 estrelas',icon:'💫',meta:1,tipo:'rating5',premio:{orc:2000,rep:15},dif:'dificil',requerId:'pl3'},
]
const CADEIA_FINANCAS=[
  {id:'fin1',titulo:'Primeiros Fundos',desc:'Acumula 5.000€',icon:'💰',meta:5000,tipo:'orc',premio:{rep:3},dif:'facil'},
  {id:'fin2',titulo:'Investidor',desc:'Acumula 20.000€',icon:'💎',meta:20000,tipo:'orc',premio:{rep:8},dif:'medio',requerId:'fin1'},
  {id:'fin3',titulo:'Magnata',desc:'Acumula 100.000€',icon:'🏦',meta:100000,tipo:'orc',premio:{rep:20},dif:'lenda',requerId:'fin2'},
]
const CADEIA_REP=[
  {id:'rep1',titulo:'Local',desc:'Atingir reputação Distrital',icon:'📍',meta:'distrital',tipo:'nivel',premio:{orc:500},dif:'facil'},
  {id:'rep2',titulo:'Regional',desc:'Atingir reputação Regional',icon:'🗺️',meta:'regional',tipo:'nivel',premio:{orc:1000},dif:'medio',requerId:'rep1'},
  {id:'rep3',titulo:'Nacional',desc:'Atingir reputação Nacional',icon:'🇵🇹',meta:'nacional',tipo:'nivel',premio:{orc:3000,rep:10},dif:'dificil',requerId:'rep2'},
  {id:'rep4',titulo:'Internacional',desc:'Atingir reputação Internacional',icon:'🌍',meta:'internacional',tipo:'nivel',premio:{orc:8000,rep:20},dif:'lenda',requerId:'rep3'},
]
// Objectivos por época (renovam a cada época)
const OBJECTIVOS_EPOCA=[
  {id:'ep_provas',titulo:'Competidor',desc:'Participa em 5 provas esta época',icon:'🏁',meta:5,tipo:'provas_epoca',premio:{orc:500},dif:'facil'},
  {id:'ep_vitoria',titulo:'Vencedor',desc:'Ganha 1 prova esta época',icon:'🥇',meta:1,tipo:'vitorias_epoca',premio:{orc:1000,rep:5},dif:'medio'},
  {id:'ep_ninhada',titulo:'Criador',desc:'Cria 2 ninhadas esta época',icon:'🥚',meta:2,tipo:'ninhadas_epoca',premio:{orc:300},dif:'facil'},
  {id:'ep_staff',titulo:'Equipa',desc:'Contrata 2 membros de staff',icon:'👥',meta:2,tipo:'staff',premio:{orc:200},dif:'facil'},
  {id:'ep_pat',titulo:'Patrocinado',desc:'Assina 1 contrato de patrocínio',icon:'🤝',meta:1,tipo:'patrocinios',premio:{orc:400},dif:'facil'},
]
// Objectivos secretos — revelados ao cumprir condição
const SECRETOS=[
  {id:'sec1',titulo:'???',desc:'Desconhecido',icon:'🔮',revelado:false,condicao:'Ganha 5 provas para revelar',check:(c,h)=>h.filter(r=>r.posicao===1).length>=5,tituloReal:'Lenda Viva',descReal:'Venceste 5 provas — és uma lenda!',premio:{orc:5000,rep:25},tipo:'vitorias'},
  {id:'sec2',titulo:'???',desc:'Desconhecido',icon:'🔮',revelado:false,condicao:'Descobre um gene raro para revelar',check:(c)=>(c.pombos||[]).some(p=>p.atributos?.gene_raro_tipo),tituloReal:'Código Genético',descReal:'Descobriste um gene raro no teu plantel!',premio:{orc:3000,rep:15},tipo:'gene'},
  {id:'sec3',titulo:'???',desc:'Desconhecido',icon:'🔮',revelado:false,condicao:'Atinge reputação Nacional para revelar',check:(c)=>NIVEL_ORDER.indexOf(c.nivel_reputacao||'local')>=NIVEL_ORDER.indexOf('nacional'),tituloReal:'Referência Nacional',descReal:'O teu pombal é conhecido em todo o país!',premio:{orc:10000,rep:30},tipo:'reputacao'},
]

function calcProgresso(obj,c,hist){
  const nivelIdx=NIVEL_ORDER.indexOf(c.nivel_reputacao||'local')
  const epoca=c.epoca||1
  switch(obj.tipo){
    case 'provas_total': return{atual:hist.length,meta:obj.meta}
    case 'vitorias':     return{atual:hist.filter(r=>r.posicao===1).length,meta:obj.meta}
    case 'top50':        return{atual:hist.filter(r=>(r.percentil||0)>=50).length,meta:obj.meta}
    case 'podio':        return{atual:hist.filter(r=>r.posicao<=3).length,meta:obj.meta}
    case 'pombos':       return{atual:(c.pombos||[]).filter(p=>p.estado==='activo').length,meta:obj.meta}
    case 'rating4':      return{atual:(c.pombos||[]).filter(p=>(p.rating||0)>=4).length,meta:obj.meta}
    case 'rating5':      return{atual:(c.pombos||[]).filter(p=>(p.rating||0)>=5).length,meta:obj.meta}
    case 'orc':          return{atual:c.orcamento||0,meta:obj.meta}
    case 'nivel':        return{atual:NIVEL_ORDER.indexOf(c.nivel_reputacao||'local')>=NIVEL_ORDER.indexOf(obj.meta)?1:0,meta:1}
    case 'provas_epoca': return{atual:hist.filter(r=>r.epoca===epoca||(c.semana||1)<=40).length,meta:obj.meta}
    case 'vitorias_epoca':return{atual:hist.filter(r=>r.posicao===1&&(r.semana||0)>=(c.semana||1)-40).length,meta:obj.meta}
    case 'ninhadas_epoca':return{atual:(c.ninhadas_virtuais||[]).length,meta:obj.meta}
    case 'staff':        return{atual:(c.staff||[]).length,meta:obj.meta}
    case 'patrocinios':  return{atual:(c.patrocinios||[]).length,meta:obj.meta}
    default:             return{atual:0,meta:obj.meta||1}
  }
}

const COR_DIF={facil:T.success,medio:T.blue,dificil:T.orange,lenda:T.purple}
const LABEL_DIF={facil:'FÁCIL',medio:'MÉDIO',dificil:'DIFÍCIL',lenda:'LENDA'}

export default function VLObjectivos({carreira,onVoltar,onGuardar}){
  const [cl,setCL]=useState(()=>lerLS()||carreira)
  const c=cl
  const salvar=d=>{gravarLS(d);setCL({...d});onGuardar?.(d)}

  const [tab,setTab]=useState('cadeia')
  const [subTab,setSubTab]=useState('provas')
  const [msg,setMsg]=useState(null)

  const hist=c.historico_provas||[]
  const concluidos=new Set(c.objectivos_concluidos||[])
  const showMsg=(t,tipo='ok')=>{setMsg({t,tipo});setTimeout(()=>setMsg(null),4000)}

  const reclamar=(obj,bonus)=>{
    const novos=new Set([...concluidos,obj.id])
    let nova={...c,objectivos_concluidos:[...novos]}
    if(bonus.orc) nova.orcamento=(nova.orcamento||0)+bonus.orc
    if(bonus.rep) nova.reputacao=Math.min(100,(nova.reputacao||5)+bonus.rep)
    salvar(nova)
    showMsg(`🎉 "${obj.titulo}" concluído!${bonus.orc?` +${bonus.orc.toLocaleString()}€`:''}${bonus.rep?` +${bonus.rep} rep`:''}`)
  }

  const renderObj=(obj,bloqueado=false)=>{
    const prog=calcProgresso(obj,c,hist)
    const pct=Math.min(100,Math.round((prog.atual/prog.meta)*100))
    const pronto=pct>=100&&!concluidos.has(obj.id)
    const feito=concluidos.has(obj.id)
    const corD=COR_DIF[obj.dif]||T.muted
    return(
      <div key={obj.id} style={{background:pronto?`${T.gold}08`:feito?'rgba(255,255,255,.02)':T.surface,border:`1px solid ${pronto?T.gold:feito?T.s2:bloqueado?'rgba(255,255,255,.04)':T.s2}`,borderRadius:12,padding:'12px 14px',opacity:bloqueado?.4:feito?.5:1,position:'relative',overflow:'hidden',transition:'all .2s'}}>
        {pronto&&<GL/>}
        <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
          <div style={{width:38,height:38,borderRadius:10,background:feito?T.s2:pronto?`${T.gold}15`:`${corD}12`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>
            {feito?'✅':bloqueado?'🔒':obj.icon}
          </div>
          <div style={{flex:1}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
              <div style={{fontSize:12,fontWeight:700,color:feito?T.muted:pronto?T.gold:T.text}}>{obj.titulo}</div>
              <span style={{fontSize:8,color:corD,background:`${corD}15`,padding:'1px 5px',borderRadius:3,fontWeight:700,flexShrink:0}}>{LABEL_DIF[obj.dif]}</span>
            </div>
            <div style={{fontSize:10,color:T.muted,marginBottom:feito?0:6}}>{obj.desc}</div>
            {!feito&&!bloqueado&&(
              <>
                <div style={{height:4,background:'rgba(255,255,255,.06)',borderRadius:2,marginBottom:4}}>
                  <div style={{height:'100%',width:`${pct}%`,background:pronto?`linear-gradient(90deg,${T.gold},#FB923C)`:corD,borderRadius:2,transition:'width .5s'}}/>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div style={{fontSize:9,color:T.muted}}>
                    {typeof prog.atual==='number'&&prog.atual.toLocaleString()} / {typeof prog.meta==='number'&&prog.meta.toLocaleString()}
                    {obj.tipo==='orc'?' €':''}
                  </div>
                  <div style={{display:'flex',gap:6,alignItems:'center'}}>
                    <span style={{fontSize:9,color:T.gold}}>
                      🎁 {obj.premio.orc?`+${obj.premio.orc.toLocaleString()}€`:''}
                      {obj.premio.orc&&obj.premio.rep?' · ':''}
                      {obj.premio.rep?`+${obj.premio.rep}rep`:''}
                    </span>
                    {pronto&&<button onClick={()=>reclamar(obj,obj.premio)} style={{padding:'4px 10px',borderRadius:6,border:'none',background:`linear-gradient(135deg,${T.gold},#A07830)`,color:'#050A14',fontSize:9,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>Reclamar</button>}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Calcular totais
  const todasCadeias=[...CADEIA_PROVAS,...CADEIA_PLANTEL,...CADEIA_FINANCAS,...CADEIA_REP]
  const totalObjs=todasCadeias.length+OBJECTIVOS_EPOCA.length+SECRETOS.length
  const totalFeitos=concluidos.size

  const CADEIAS={provas:CADEIA_PROVAS,plantel:CADEIA_PLANTEL,financas:CADEIA_FINANCAS,reputacao:CADEIA_REP}

  return(
    <div style={{minHeight:'100vh',background:T.bg,color:T.text,fontFamily:"system-ui,sans-serif"}}>
      <div style={{background:`linear-gradient(180deg,${T.surface},${T.bg})`,borderBottom:`1px solid ${T.s2}`,padding:'14px 16px',position:'relative'}}>
        <GL/>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
          <button onClick={onVoltar} style={{background:T.surface,border:`1px solid ${T.s2}`,borderRadius:8,width:32,height:32,color:T.muted,cursor:'pointer',fontSize:16}}>←</button>
          <div style={{flex:1}}>
            <div style={{fontSize:16,fontWeight:800}}>🎯 Objectivos</div>
            <div style={{fontSize:9,color:T.muted}}>{totalFeitos}/{totalObjs} concluídos</div>
          </div>
        </div>
        {/* Barra progresso geral */}
        <div style={{marginBottom:12}}>
          <div style={{height:4,background:'rgba(255,255,255,.06)',borderRadius:2,overflow:'hidden'}}>
            <div style={{height:'100%',width:`${Math.round((totalFeitos/totalObjs)*100)}%`,background:`linear-gradient(90deg,${T.purple},${T.gold})`,borderRadius:2,transition:'width .5s'}}/>
          </div>
          <div style={{fontSize:8,color:T.muted,marginTop:3}}>{Math.round((totalFeitos/totalObjs)*100)}% da carreira completa</div>
        </div>
        <div style={{display:'flex',gap:5,overflowX:'auto',scrollbarWidth:'none'}}>
          {[['cadeia','🔗 Cadeia'],['epoca','📅 Época'],['secretos','🔮 Secretos']].map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id)}
              style={{flex:'none',padding:'7px 11px',borderRadius:8,border:tab===id?'none':`1px solid ${T.s2}`,background:tab===id?`${T.purple}20`:'transparent',color:tab===id?T.purple:T.muted,fontSize:10,fontWeight:tab===id?700:400,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'}}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {msg&&<div style={{margin:'10px 16px 0',padding:'10px 14px',background:`${T.success}10`,border:`1px solid ${T.success}30`,borderRadius:10,fontSize:12,color:T.success,fontWeight:600}}>✅ {msg.t}</div>}

      <div style={{padding:'12px 16px',display:'flex',flexDirection:'column',gap:8}}>

        {/* CADEIA */}
        {tab==='cadeia'&&(
          <>
            <div style={{display:'flex',gap:5,overflowX:'auto',scrollbarWidth:'none',paddingBottom:2}}>
              {[['provas','🏆 Provas'],['plantel','🐦 Plantel'],['financas','💰 Finanças'],['reputacao','⭐ Reputação']].map(([id,label])=>(
                <button key={id} onClick={()=>setSubTab(id)}
                  style={{flex:'none',padding:'6px 10px',borderRadius:7,border:subTab===id?'none':`1px solid ${T.s2}`,background:subTab===id?`${T.blue}20`:'transparent',color:subTab===id?T.blue:T.muted,fontSize:9,fontWeight:subTab===id?700:400,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'}}>
                  {label}
                </button>
              ))}
            </div>
            {(CADEIAS[subTab]||[]).map((obj,i)=>{
              const prev=i>0?CADEIAS[subTab][i-1]:null
              const bloqueado=!!obj.requerId&&!concluidos.has(obj.requerId)
              return(
                <div key={obj.id}>
                  {i>0&&<div style={{display:'flex',justifyContent:'center',margin:'2px 0'}}>
                    <div style={{width:1,height:12,background:concluidos.has(prev?.id||'')?T.success:T.s2}}/>
                  </div>}
                  {renderObj(obj,bloqueado)}
                </div>
              )
            })}
          </>
        )}

        {/* ÉPOCA */}
        {tab==='epoca'&&(
          <>
            <div style={{padding:'10px 14px',background:`${T.blue}08`,border:`1px solid ${T.blue}20`,borderRadius:10,fontSize:10,color:T.muted}}>
              📅 Objectivos da Época {c.epoca||1} — renovam automaticamente a cada nova época.
            </div>
            {OBJECTIVOS_EPOCA.map(obj=>renderObj(obj,false))}
          </>
        )}

        {/* SECRETOS */}
        {tab==='secretos'&&(
          <>
            <div style={{padding:'10px 14px',background:`${T.purple}08`,border:`1px solid ${T.purple}20`,borderRadius:10,fontSize:10,color:T.muted}}>
              🔮 Objectivos secretos — revelados ao cumprir certas condições especiais.
            </div>
            {SECRETOS.map(obj=>{
              const revelado=obj.check(c,hist)
              const feito=concluidos.has(obj.id)
              const pronto=revelado&&!feito
              return(
                <div key={obj.id} style={{background:revelado?`${T.purple}08`:T.surface,border:`1px solid ${revelado?T.purple+'30':T.s2}`,borderRadius:12,padding:'14px',position:'relative',overflow:'hidden'}}>
                  {pronto&&<GL/>}
                  <div style={{display:'flex',gap:10,alignItems:'center'}}>
                    <div style={{width:44,height:44,borderRadius:12,background:revelado?`${T.purple}15`:T.s2,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>
                      {feito?'✅':revelado?obj.icon:obj.icon}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:700,color:revelado?T.purple:T.muted}}>
                        {revelado||feito?obj.tituloReal:obj.titulo}
                      </div>
                      <div style={{fontSize:10,color:T.muted,marginTop:2}}>
                        {revelado||feito?obj.descReal:obj.condicao}
                      </div>
                      {revelado&&!feito&&(
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:8}}>
                          <span style={{fontSize:9,color:T.gold}}>🎁 +{obj.premio.orc?.toLocaleString()}€{obj.premio.rep?` · +${obj.premio.rep}rep`:''}</span>
                          <button onClick={()=>reclamar({...obj,titulo:obj.tituloReal},obj.premio)}
                            style={{padding:'5px 12px',borderRadius:7,border:'none',background:`linear-gradient(135deg,${T.purple},#7C3AED)`,color:'#fff',fontSize:9,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                            🔮 Reclamar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
