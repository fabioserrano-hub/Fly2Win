// src/modules/virtualLoft/screens/VLFinancas.jsx — V2 Economia real
import { useState } from 'react'

const T={bg:'#050A14',surface:'#0D1829',s2:'#1A2A45',gold:'#C9A84C',blue:'#4FC3F7',text:'#E8EDF5',muted:'#6B7A99',success:'#2DD4A7',danger:'#F87171',purple:'#A855F7',orange:'#FB923C'}
function lerLS(){try{return JSON.parse(localStorage.getItem('vl_carreira'))}catch{return null}}
function gravarLS(d){try{localStorage.setItem('vl_carreira',JSON.stringify(d))}catch{}}
function GL(){return <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,#C9A84C,transparent)',opacity:.8}}/>}

function MiniChart({valores,cor,h=40}){
  if(!valores||valores.length<2)return null
  const max=Math.max(...valores,1)
  const min=Math.min(...valores,0)
  const range=max-min||1
  const w=100,pts=valores.map((v,i)=>{
    const x=(i/(valores.length-1))*w
    const y=h-((v-min)/range)*(h-4)-2
    return`${x},${y}`
  }).join(' ')
  const area=`0,${h} ${pts} ${w},${h}`
  return(
    <svg viewBox={`0 0 ${w} ${h}`} style={{width:'100%',height:h}}>
      <polygon points={area} fill={`${cor}15`}/>
      <polyline points={pts} fill="none" stroke={cor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export default function VLFinancas({carreira,onVoltar,onGuardar}){
  const [cl,setCL]=useState(()=>lerLS()||carreira)
  const c=cl
  const salvar=d=>{gravarLS(d);setCL({...d});onGuardar?.(d)}

  const [tab,setTab]=useState('resumo')

  const orcamento=c.orcamento||0
  const staff=c.staff||[]
  const pombos=c.pombos||[]
  const patrocinios=c.patrocinios||[]
  const movimentos=c.movimentos||[]

  // Calcular receitas e despesas semanais
  const recPatrocinios=patrocinios.reduce((s,p)=>s+(p.valorSemanal||0),0)
  const recProvas=movimentos.filter(m=>m.tipo==='premio').reduce((s,m)=>s+(m.valor||0),0)
  const recVendas=movimentos.filter(m=>m.tipo==='venda').reduce((s,m)=>s+(m.valor||0),0)
  const recEventos=movimentos.filter(m=>m.tipo==='evento'&&(m.valor||0)>0).reduce((s,m)=>s+(m.valor||0),0)
  const recObjectivos=movimentos.filter(m=>m.tipo==='objectivo').reduce((s,m)=>s+(m.valor||0),0)
  const totalReceitas=recPatrocinios+recProvas+recVendas+recObjectivos+recEventos

  const despStaff=Math.round(staff.reduce((s,m)=>s+(m.salario||0),0)/4)
  const despAlim=pombos.filter(p=>p.estado==='activo').length*5
  const despCompras=movimentos.filter(m=>m.tipo==='compra').reduce((s,m)=>s+Math.abs(m.valor||0),0)
  const despSaude=movimentos.filter(m=>m.tipo==='saude').reduce((s,m)=>s+Math.abs(m.valor||0),0)
  const despObras=movimentos.filter(m=>m.tipo==='obras').reduce((s,m)=>s+Math.abs(m.valor||0),0)
  const despCaucoes=movimentos.filter(m=>m.tipo==='staff_caucao').reduce((s,m)=>s+Math.abs(m.valor||0),0)
  const despEventos=movimentos.filter(m=>m.tipo==='evento'&&(m.valor||0)<0).reduce((s,m)=>s+Math.abs(m.valor||0),0)
  const totalDespesas=despStaff+despAlim+despCompras+despSaude+despObras+despCaucoes+despEventos

  const saldoSemanal=recPatrocinios-despStaff-despAlim
  const semanasSobrevivencia=saldoSemanal<0?Math.floor(orcamento/Math.abs(saldoSemanal)):99

  // Histórico do orçamento (últimas 10 semanas simulado)
  // Saldo real das últimas 10 semanas, reconstruído a partir dos movimentos
  const historicoOrc=(()=>{
    if(!movimentos.length) return Array.from({length:10},()=>orcamento)
    const semAtual=c.semana||1
    const porSem={}
    movimentos.forEach(m=>{const sw=m.semana||1;porSem[sw]=(porSem[sw]||0)+(m.valor||0)})
    const pontos=[];let saldo=orcamento
    for(let sw=semAtual;sw>Math.max(0,semAtual-10);sw--){pontos.unshift(Math.max(0,Math.round(saldo)));saldo-=(porSem[sw]||0)}
    return pontos
  })()

  const CATEGORIAS_REC=[
    {label:'Patrocínios',valor:recPatrocinios,icon:'🤝',cor:T.success,periodo:'por semana'},
    {label:'Prémios Provas',valor:recProvas,icon:'🏆',cor:T.gold,periodo:'acumulado'},
    {label:'Vendas',valor:recVendas,icon:'💰',cor:T.blue,periodo:'acumulado'},
    {label:'Objectivos',valor:recObjectivos,icon:'🎯',cor:T.purple,periodo:'acumulado'},
    {label:'Eventos',valor:recEventos,icon:'✨',cor:T.orange,periodo:'acumulado'},
  ].filter((ct,i)=>i<3||ct.valor>0)
  const CATEGORIAS_DESP=[
    {label:'Staff',valor:despStaff,icon:'👥',cor:T.danger,periodo:'por semana'},
    {label:'Alimentação',valor:despAlim,icon:'🌾',cor:T.orange,periodo:'por semana'},
    {label:'Compras',valor:despCompras,icon:'🛒',cor:T.purple,periodo:'acumulado'},
    {label:'Saúde',valor:despSaude,icon:'🏥',cor:T.blue,periodo:'acumulado'},
    {label:'Obras',valor:despObras,icon:'🔨',cor:T.gold,periodo:'acumulado'},
    {label:'Cauções Staff',valor:despCaucoes,icon:'📝',cor:T.danger,periodo:'acumulado'},
    {label:'Eventos',valor:despEventos,icon:'⚠️',cor:T.orange,periodo:'acumulado'},
  ].filter((ct,i)=>i<3||ct.valor>0)

  return(
    <div style={{minHeight:'100vh',background:T.bg,color:T.text,fontFamily:"system-ui,sans-serif"}}>
      <div style={{background:`linear-gradient(180deg,${T.surface},${T.bg})`,borderBottom:`1px solid ${T.s2}`,padding:'14px 16px',position:'relative'}}>
        <GL/>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
          <button onClick={onVoltar} style={{background:T.surface,border:`1px solid ${T.s2}`,borderRadius:8,width:32,height:32,color:T.muted,cursor:'pointer',fontSize:16}}>←</button>
          <div style={{flex:1}}>
            <div style={{fontSize:16,fontWeight:800}}>💰 Finanças</div>
            <div style={{fontSize:9,color:saldoSemanal>=0?T.success:T.danger}}>
              {saldoSemanal>=0?`+${saldoSemanal}€/semana`:`${saldoSemanal}€/semana`}
              {saldoSemanal<0&&<span style={{color:T.muted}}> · {semanasSobrevivencia} semanas de reserva</span>}
            </div>
          </div>
        </div>
        <div style={{display:'flex',gap:6}}>
          {[['resumo','Resumo'],['receitas','Receitas'],['despesas','Despesas'],['historico','Historial']].map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id)}
              style={{flex:'none',padding:'7px 10px',borderRadius:8,border:tab===id?'none':`1px solid ${T.s2}`,background:tab===id?`${T.success}20`:'transparent',color:tab===id?T.success:T.muted,fontSize:10,fontWeight:tab===id?700:400,cursor:'pointer',fontFamily:'inherit'}}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:'12px 16px',display:'flex',flexDirection:'column',gap:12}}>

        {/* RESUMO */}
        {tab==='resumo'&&(
          <>
            {/* Saldo principal */}
            <div style={{background:'linear-gradient(135deg,rgba(201,168,76,.12),rgba(201,168,76,.04))',border:`1px solid ${T.gold}30`,borderRadius:16,padding:'20px',position:'relative',overflow:'hidden',textAlign:'center'}}>
              <GL/>
              <div style={{fontSize:9,color:T.gold,fontWeight:700,letterSpacing:1.5,marginBottom:6}}>SALDO ACTUAL</div>
              <div style={{fontFamily:"Georgia,serif",fontSize:38,fontWeight:900,color:T.gold,letterSpacing:-1,lineHeight:1}}>{orcamento.toLocaleString()}€</div>
              <div style={{fontSize:10,color:T.muted,marginTop:6}}>
                {saldoSemanal>=0?`+${saldoSemanal}€/sem · Projecto estável`:`${saldoSemanal}€/sem · ${semanasSobrevivencia} sem. de reserva`}
              </div>
              {/* Mini gráfico */}
              <div style={{marginTop:12}}>
                <MiniChart valores={historicoOrc} cor={T.gold}/>
              </div>
            </div>

            {/* Alerta défice */}
            {saldoSemanal<0&&semanasSobrevivencia<8&&(
              <div style={{padding:'10px 14px',background:`${T.danger}08`,border:`1px solid ${T.danger}25`,borderRadius:10,fontSize:11,color:T.danger,fontWeight:600}}>
                ⚠️ Atenção: ao ritmo actual o saldo esgota em {semanasSobrevivencia} semanas. Reduz custos ou aumenta receitas!
              </div>
            )}

            {/* Grid receitas vs despesas */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div style={{background:`${T.success}08`,border:`1px solid ${T.success}20`,borderRadius:12,padding:'14px',position:'relative',overflow:'hidden'}}>
                <GL/>
                <div style={{fontSize:9,color:T.success,fontWeight:700,letterSpacing:1,marginBottom:6}}>RECEITAS/SEM.</div>
                <div style={{fontFamily:"Georgia,serif",fontSize:22,fontWeight:900,color:T.success}}>+{recPatrocinios}€</div>
                <div style={{fontSize:9,color:T.muted,marginTop:2}}>Patrocínios activos</div>
              </div>
              <div style={{background:`${T.danger}08`,border:`1px solid ${T.danger}20`,borderRadius:12,padding:'14px',position:'relative',overflow:'hidden'}}>
                <GL/>
                <div style={{fontSize:9,color:T.danger,fontWeight:700,letterSpacing:1,marginBottom:6}}>DESPESAS/SEM.</div>
                <div style={{fontFamily:"Georgia,serif",fontSize:22,fontWeight:900,color:T.danger}}>-{(despStaff+despAlim).toLocaleString()}€</div>
                <div style={{fontSize:9,color:T.muted,marginTop:2}}>Staff + alimentação</div>
              </div>
            </div>

            {/* Breakdown */}
            <div style={{background:T.surface,border:`1px solid ${T.s2}`,borderRadius:12,padding:'14px',position:'relative',overflow:'hidden'}}>
              <GL/>
              <div style={{fontSize:9,color:T.muted,fontWeight:700,letterSpacing:1,marginBottom:10}}>DETALHE SEMANAL</div>
              {[
                {l:'Patrocínios',v:`+${recPatrocinios}€`,c:T.success},
                {l:'Staff',v:`-${despStaff}€`,c:T.danger},
                {l:'Alimentação',v:`-${despAlim}€`,c:T.orange},
                {l:'Saldo líquido',v:`${saldoSemanal>=0?'+':''}${saldoSemanal}€`,c:saldoSemanal>=0?T.success:T.danger,bold:true},
              ].map((s,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:i<3?`1px solid ${T.s2}`:'none'}}>
                  <span style={{fontSize:11,color:s.bold?T.text:T.muted,fontWeight:s.bold?700:400}}>{s.l}</span>
                  <span style={{fontSize:11,fontWeight:s.bold?800:600,color:s.c}}>{s.v}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* RECEITAS */}
        {tab==='receitas'&&(
          <>
            {CATEGORIAS_REC.map((cat,i)=>(
              <div key={i} style={{background:T.surface,border:`1px solid ${cat.cor}20`,borderRadius:12,padding:'14px',position:'relative',overflow:'hidden'}}>
                <GL/>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div style={{display:'flex',gap:10,alignItems:'center'}}>
                    <div style={{width:40,height:40,borderRadius:10,background:`${cat.cor}15`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>{cat.icon}</div>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:T.text}}>{cat.label}</div>
                      <div style={{fontSize:9,color:T.muted}}>{cat.periodo}</div>
                    </div>
                  </div>
                  <div style={{fontFamily:"Georgia,serif",fontSize:18,fontWeight:900,color:cat.cor}}>+{cat.valor.toLocaleString()}€</div>
                </div>
              </div>
            ))}
            {patrocinios.length>0&&(
              <div>
                <div style={{fontSize:9,color:T.muted,fontWeight:700,letterSpacing:1,marginBottom:8}}>CONTRATOS ACTIVOS</div>
                {patrocinios.map((p,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'10px 12px',background:T.surface,border:`1px solid ${T.s2}`,borderRadius:8,marginBottom:4}}>
                    <div>
                      <div style={{fontSize:11,color:T.text}}>{p.nome}</div>
                      <div style={{fontSize:9,color:T.muted}}>{p.semanasRestantes} sem. restantes</div>
                    </div>
                    <div style={{fontSize:12,fontWeight:700,color:T.success}}>+{p.valorSemanal}€/sem</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* DESPESAS */}
        {tab==='despesas'&&(
          <>
            {CATEGORIAS_DESP.map((cat,i)=>(
              <div key={i} style={{background:T.surface,border:`1px solid ${cat.cor}20`,borderRadius:12,padding:'14px',position:'relative',overflow:'hidden'}}>
                <GL/>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div style={{display:'flex',gap:10,alignItems:'center'}}>
                    <div style={{width:40,height:40,borderRadius:10,background:`${cat.cor}15`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>{cat.icon}</div>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:T.text}}>{cat.label}</div>
                      <div style={{fontSize:9,color:T.muted}}>{cat.periodo}</div>
                    </div>
                  </div>
                  <div style={{fontFamily:"Georgia,serif",fontSize:18,fontWeight:900,color:cat.cor}}>-{cat.valor.toLocaleString()}€</div>
                </div>
              </div>
            ))}
            {staff.length>0&&(
              <div>
                <div style={{fontSize:9,color:T.muted,fontWeight:700,letterSpacing:1,marginBottom:8}}>SALÁRIOS SEMANAIS</div>
                {staff.map((m,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'10px 12px',background:T.surface,border:`1px solid ${T.s2}`,borderRadius:8,marginBottom:4}}>
                    <div style={{fontSize:11,color:T.text}}>{m.nome}</div>
                    <div style={{fontSize:11,fontWeight:700,color:T.danger}}>-{Math.round((m.salario||0)/4)}€/sem</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* HISTORIAL */}
        {tab==='historico'&&(
          movimentos.length===0?(
            <div style={{textAlign:'center',padding:'40px 20px'}}>
              <div style={{fontSize:40,marginBottom:12}}>📋</div>
              <div style={{fontSize:13,color:T.muted}}>Sem movimentos registados</div>
            </div>
          ):[...movimentos].reverse().slice(0,30).map((m,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',background:T.surface,border:`1px solid ${T.s2}`,borderRadius:10}}>
              <div>
                <div style={{fontSize:11,fontWeight:600,color:T.text}}>{m.descricao||m.tipo}</div>
                <div style={{fontSize:9,color:T.muted}}>Sem.{m.semana||'-'}</div>
              </div>
              <div style={{fontSize:13,fontWeight:700,color:(m.valor||0)>=0?T.success:T.danger}}>
                {(m.valor||0)>=0?'+':''}{(m.valor||0).toLocaleString()}€
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
