// src/modules/virtualLoft/screens/VLProvas.jsx — V3 Motor completo
import { useState, useEffect, useRef } from 'react'

const T={bg:'#050A14',surface:'#0D1829',s2:'#1A2A45',gold:'#C9A84C',blue:'#4FC3F7',text:'#E8EDF5',muted:'#6B7A99',success:'#2DD4A7',danger:'#F87171',purple:'#A855F7'}
function lerLS(){try{return JSON.parse(localStorage.getItem('vl_carreira'))}catch{return null}}
function gravarLS(d){try{localStorage.setItem('vl_carreira',JSON.stringify(d))}catch{}}
function GL(){return <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,#C9A84C,transparent)',opacity:.8}}/>}

const PROVAS=[
  {id:'p1',nome:'Local - Santarém',   dist:80,  tipo:'velocidade',   semana:3,  nivel:'local',         premio:100,  lat:39.2,lon:-8.7},
  {id:'p2',nome:'Local - Setúbal',    dist:120, tipo:'velocidade',   semana:5,  nivel:'local',         premio:150,  lat:38.5,lon:-8.9},
  {id:'p3',nome:'Distrital - Évora',  dist:200, tipo:'velocidade',   semana:8,  nivel:'distrital',     premio:300,  lat:38.6,lon:-7.9},
  {id:'p4',nome:'Distrital - Beja',   dist:250, tipo:'meio_fundo',   semana:11, nivel:'distrital',     premio:400,  lat:38.0,lon:-7.9},
  {id:'p5',nome:'Regional - Badajoz', dist:350, tipo:'meio_fundo',   semana:15, nivel:'regional',      premio:600,  lat:38.9,lon:-6.9},
  {id:'p6',nome:'Regional - Mérida',  dist:420, tipo:'meio_fundo',   semana:18, nivel:'regional',      premio:800,  lat:38.9,lon:-6.3},
  {id:'p7',nome:'Nacional - Salamanca',dist:510,tipo:'fundo',        semana:22, nivel:'nacional',      premio:1500, lat:40.9,lon:-5.7},
  {id:'p8',nome:'Nacional - Valladolid',dist:650,tipo:'fundo',       semana:26, nivel:'nacional',      premio:2000, lat:41.6,lon:-4.7},
  {id:'p9',nome:'Internacional - Barcelona',dist:850,tipo:'grande_fundo',semana:30,nivel:'internacional',premio:5000,lat:41.4,lon:2.2},
  {id:'p10',nome:'Grande Prova - Pau',dist:1100,tipo:'grande_fundo', semana:35, nivel:'internacional', premio:10000,lat:43.3,lon:-0.4},
]

const TIPO_LABEL={velocidade:'Velocidade',meio_fundo:'Meio-Fundo',fundo:'Fundo',grande_fundo:'Grande Fundo'}
const COR_NIVEL={local:T.muted,distrital:T.blue,regional:T.success,nacional:T.gold,internacional:T.purple}
const NOMES_ADV=['Relâmpago','Trovão','Furacão','Astro','Cometa','Atlas','Zeus','Orion','Vega','Sirius','Falcão','Titan','Brisa','Tempestade','Radar']
const POMBAIS_ADV=['Pombal da Serra','Pombal Elite','Pombal Campeão','Pombal Norte','Pombal Real','Pombal Dourado','Pombal Ibérico']

// ── Motor de simulação determinístico ────────────────────────────────────────
function gerarMeteo(){
  const conds=['☀️ Sol','⛅ Nublado','🌧️ Chuva','💨 Vento Forte','⛈️ Trovoada','🌫️ Neblina']
  const pesos=[0.35,0.25,0.20,0.12,0.05,0.03]
  const r=Math.random()
  let acc=0
  for(let i=0;i<conds.length;i++){acc+=pesos[i];if(r<acc)return{label:conds[i],penalidade:i===0?0:i===1?.05:i===2?.12:i===3?.18:i===4?.35:.25}}
  return{label:'☀️ Sol',penalidade:0}
}

function calcScore(pombo,prova,meteo,estrategia){
  const a=pombo.atributos||{}
  const forma=pombo.forma_atual||70
  const fadiga=pombo.fadiga||0
  const exp=pombo.provas||0

  // Score base por tipo de prova
  let base
  if(prova.tipo==='velocidade')      base=(a.velocidade||50)*.40+(a.instinto||50)*.25+(a.coragem||50)*.20+(a.orientacao||50)*.15
  else if(prova.tipo==='meio_fundo') base=(a.resistencia||50)*.35+(a.orientacao||50)*.30+(a.velocidade||50)*.20+(a.recuperacao||50)*.15
  else if(prova.tipo==='fundo')      base=(a.resistencia||50)*.45+(a.orientacao||50)*.30+(a.recuperacao||50)*.15+(a.inteligencia||50)*.10
  else                               base=(a.resistencia||50)*.50+(a.orientacao||50)*.30+(a.recuperacao||50)*.15+(a.instinto||50)*.05

  // Multiplicadores
  const multForma=0.7+(forma/100)*.6          // 0.70 a 1.30
  const multFadiga=1-(fadiga/100)*.30         // fadiga alta penaliza até 30%
  const multExp=1+Math.min(exp,20)*.005       // experiência dá até +10%
  const multMeteo=1-meteo.penalidade

  // Personalidade
  let multPers=1
  const pers=pombo.personalidade||[]
  if(pers.includes('Nervoso')&&meteo.penalidade>.1) multPers*=0.90
  if(pers.includes('Competitivo')) multPers*=1.08
  if(pers.includes('Preguiçoso')&&fadiga>30) multPers*=0.92
  if(pers.includes('Inteligente')) multPers*=1.05

  // Estratégia
  const multEst=estrategia==='agressivo'?1.12:estrategia==='conservador'?0.93:1.0
  const risco=estrategia==='agressivo'?0.25:estrategia==='conservador'?0.08:0.15

  // Aleatoriedade residual (5-25% dependendo da estratégia)
  const sorte=1+(Math.random()-.5)*risco*2

  return Math.max(10,Math.min(99,base*multForma*multFadiga*multExp*multMeteo*multPers*multEst*sorte))
}

function simularProva(pombos,prova,meteo,estrategia){
  const total=30+Math.floor(Math.random()*70)
  const res=[]

  pombos.forEach(p=>{
    const score=calcScore(p,prova,meteo,estrategia)
    const velBase=prova.tipo==='velocidade'?1450:prova.tipo==='meio_fundo'?1350:1250
    const velocidade=Math.round(velBase*(score/100)*(0.92+Math.random()*.16))
    res.push({pombo:p,score,velocidade,tempo:Math.round((prova.dist*1000)/velocidade),isMeu:true})
  })

  for(let i=0;i<total-pombos.length;i++){
    const n=30+Math.random()*50
    const velBase=prova.tipo==='velocidade'?1450:1350
    const velocidade=Math.round(velBase*(n/100)*(0.88+Math.random()*.24))
    res.push({pombo:null,score:n,velocidade,tempo:Math.round((prova.dist*1000)/velocidade),
      nome:NOMES_ADV[Math.floor(Math.random()*NOMES_ADV.length)],
      pombalNome:POMBAIS_ADV[Math.floor(Math.random()*POMBAIS_ADV.length)],isMeu:false})
  }

  res.sort((a,b)=>b.velocidade-a.velocidade)
  return res.map((r,i)=>({...r,posicao:i+1,total:res.length,percentil:Math.round(((res.length-i)/res.length)*100)}))
}

// ── Comentário ao vivo ────────────────────────────────────────────────────────
function gerarComentarios(pombos,prova,meteo){
  const nomes=pombos.map(p=>p.nome)
  const n=nomes[0]||'O pombo'
  const comments=[
    [15,`🚀 Solta realizada! ${nomes.length} pombo${nomes.length>1?'s':''} no ar.`],
    [25,`🐦 ${n} já integrou um grupo de 8 pombos.`],
    [40,meteo.penalidade>.1?`${meteo.label} a dificultar o voo no sector 2.`:`☀️ Excelentes condições no sector 2!`],
    [55,`📡 ${n} mantém orientação perfeita.`],
    [70,nomes.length>1?`💨 ${nomes[1]||n} separa-se do grupo!`:`💨 ${n} acelera na reta final.`],
    [85,`🏁 Aproximação à linha de chegada!`],
    [95,`🎉 ${n} avista o pombal!`],
  ]
  return comments
}

// ── Mapa SVG do percurso ──────────────────────────────────────────────────────
function MapaVoo({prog,prova,pombos}){
  // Percurso simplificado: linha do ponto de solta até Lisboa
  const points=[{x:10,y:20},{x:25,y:35},{x:40,y:42},{x:55,y:38},{x:70,y:32},{x:85,y:25},{x:90,y:80}]
  const totalPts=points.length-1
  const progIdx=Math.floor((prog/100)*totalPts)
  const cp=points[Math.min(progIdx,totalPts)]

  return(
    <div style={{background:'linear-gradient(135deg,#060e1a,#0a1525)',border:`1px solid ${T.s2}`,borderRadius:12,padding:'12px',position:'relative',overflow:'hidden'}}>
      <div style={{fontSize:9,color:T.muted,marginBottom:8,fontWeight:600,letterSpacing:1}}>PERCURSO — {prova.dist}KM</div>
      <svg viewBox="0 0 100 100" style={{width:'100%',height:80}}>
        {/* Rota base */}
        <polyline points={points.map(p=>`${p.x},${p.y}`).join(' ')} fill="none" stroke={`${T.muted}40`} strokeWidth="1" strokeDasharray="3,2"/>
        {/* Rota percorrida */}
        <polyline points={points.slice(0,progIdx+2).map(p=>`${p.x},${p.y}`).join(' ')} fill="none" stroke={T.purple} strokeWidth="1.5"/>
        {/* Ponto de solta */}
        <circle cx={points[0].x} cy={points[0].y} r="3" fill={T.blue}/>
        <text x={points[0].x+3} y={points[0].y-3} fontSize="5" fill={T.muted}>Solta</text>
        {/* Chegada */}
        <circle cx={points[points.length-1].x} cy={points[points.length-1].y} r="3" fill={T.gold}/>
        <text x={points[points.length-1].x-12} y={points[points.length-1].y+8} fontSize="5" fill={T.gold}>Casa</text>
        {/* Pombos actuais */}
        {prog>5&&<circle cx={cp.x} cy={cp.y} r="4" fill={T.purple} opacity=".9">
          <animate attributeName="r" values="3;5;3" dur="1s" repeatCount="indefinite"/>
        </circle>}
        {prog>5&&<text x={cp.x+4} y={cp.y-3} fontSize="8" fill="white">🐦</text>}
      </svg>
      {/* Condições */}
      <div style={{display:'flex',justifyContent:'space-between',marginTop:4}}>
        <span style={{fontSize:9,color:T.muted}}>{prova.nome}</span>
        <span style={{fontSize:9,color:T.blue}}>{Math.round(prog*prova.dist/100)}km percorridos</span>
      </div>
    </div>
  )
}

// ── Simulação visual ──────────────────────────────────────────────────────────
function SimulacaoVisual({prova,resultados,pombosParticipantes,meteo,estrategia,onFechar}){
  const [fase,setFase]=useState('inicio')
  const [prog,setProg]=useState(0)
  const [comentario,setComentario]=useState(null)
  const [chegadas,setChegadas]=useState([])
  const ref=useRef(null)
  const meusPombos=resultados.filter(r=>r.isMeu)
  const comentarios=gerarComentarios(pombosParticipantes,prova,meteo)

  useEffect(()=>{
    setTimeout(()=>setFase('voo'),1500)
    let p=0
    ref.current=setInterval(()=>{
      p=Math.min(100,p+1.5)
      setProg(p)
      const cm=comentarios.find(c=>Math.abs(c[0]-p)<2)
      if(cm)setComentario(cm[1])
      if(p>=100){
        clearInterval(ref.current)
        setFase('chegada')
        const sorted=[...resultados].sort((a,b)=>a.posicao-b.posicao)
        sorted.slice(0,12).forEach((r,i)=>setTimeout(()=>setChegadas(prev=>[...prev,r]),i*200))
        setTimeout(()=>setFase('resultado'),sorted.length*200+1500)
      }
    },60)
    return()=>clearInterval(ref.current)
  },[])

  return(
    <div style={{position:'fixed',inset:0,background:'#030810',zIndex:2000,display:'flex',flexDirection:'column',fontFamily:"system-ui,sans-serif",overflowY:'auto'}}>
      {/* Header */}
      <div style={{background:'linear-gradient(180deg,#0D1829,#030810)',borderBottom:`1px solid ${T.s2}`,padding:'14px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0,position:'relative'}}>
        <GL/>
        <div>
          <div style={{fontSize:14,fontWeight:800,color:T.text}}>{prova.nome}</div>
          <div style={{display:'flex',gap:8,marginTop:2}}>
            <span style={{fontSize:9,color:T.muted}}>{TIPO_LABEL[prova.tipo]} · {prova.dist}km</span>
            <span style={{fontSize:9,color:T.blue}}>{meteo.label}</span>
            <span style={{fontSize:9,color:estrategia==='agressivo'?T.danger:estrategia==='conservador'?T.success:T.muted}}>
              {estrategia==='agressivo'?'⚡ Agressivo':estrategia==='conservador'?'🛡️ Conservador':'⚖️ Normal'}
            </span>
          </div>
        </div>
        {fase==='resultado'&&<button onClick={onFechar} style={{background:T.surface,border:`1px solid ${T.s2}`,borderRadius:8,padding:'7px 12px',color:T.text,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>Fechar ✕</button>}
      </div>

      <div style={{flex:1,padding:'14px 16px',display:'flex',flexDirection:'column',gap:12}}>

        {/* INÍCIO */}
        {fase==='inicio'&&(
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',flex:1,gap:16,minHeight:300}}>
            <div style={{fontSize:64,animation:'pulse 1s infinite'}}>🚀</div>
            <div style={{fontFamily:"Georgia,serif",fontSize:22,fontWeight:900,color:T.gold,textAlign:'center'}}>Prova a Começar!</div>
            <div style={{fontSize:12,color:T.muted}}>{pombosParticipantes.length} pombos inscritos · {resultados.length} participantes</div>
            <div style={{padding:'8px 16px',background:`${T.blue}15`,border:`1px solid ${T.blue}30`,borderRadius:8,fontSize:11,color:T.blue}}>
              {meteo.label} · {meteo.penalidade>0?`Penalidade ${Math.round(meteo.penalidade*100)}%`:'Sem penalidade'}
            </div>
          </div>
        )}

        {/* VOO */}
        {(fase==='voo'||fase==='chegada')&&(
          <>
            {/* Mapa */}
            <MapaVoo prog={prog} prova={prova} pombos={pombosParticipantes}/>

            {/* Barra de progresso */}
            <div style={{background:T.surface,border:`1px solid ${T.s2}`,borderRadius:12,padding:'14px',position:'relative',overflow:'hidden'}}>
              <GL/>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                <span style={{fontSize:9,color:T.muted,fontWeight:600,letterSpacing:1}}>📍 SOLTA</span>
                <span style={{fontSize:9,color:T.gold,fontWeight:600,letterSpacing:1}}>🏁 CHEGADA</span>
              </div>
              <div style={{height:10,background:'rgba(255,255,255,.05)',borderRadius:5,overflow:'hidden',position:'relative'}}>
                <div style={{height:'100%',width:`${prog}%`,background:`linear-gradient(90deg,${T.purple},${T.gold})`,borderRadius:5,transition:'width .1s',position:'relative'}}>
                  <div style={{position:'absolute',right:-2,top:-3,fontSize:16}}>🐦</div>
                </div>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginTop:6}}>
                <div style={{display:'flex',gap:4}}>
                  {pombosParticipantes.map(p=><span key={p.id} title={p.nome} style={{fontSize:10}}>🕊️</span>)}
                </div>
                <span style={{fontFamily:"Georgia,serif",fontSize:15,fontWeight:900,color:T.gold}}>{Math.round(prog)}%</span>
              </div>
            </div>

            {/* Comentário ao vivo */}
            {comentario&&(
              <div style={{padding:'10px 14px',background:`${T.purple}10`,border:`1px solid ${T.purple}30`,borderRadius:10,fontSize:12,color:T.text,fontStyle:'italic'}}>
                🎙️ {comentario}
              </div>
            )}

            {/* Chegadas */}
            {chegadas.length>0&&(
              <div style={{background:T.surface,border:`1px solid ${T.s2}`,borderRadius:12,overflow:'hidden',position:'relative'}}>
                <GL/>
                <div style={{padding:'10px 14px',borderBottom:`1px solid ${T.s2}`}}>
                  <span style={{fontSize:9,color:T.success,fontWeight:700,letterSpacing:1.5}}>🏁 CHEGADAS EM TEMPO REAL</span>
                </div>
                {chegadas.map((r,i)=>{
                  const cor=r.isMeu?T.gold:T.muted
                  return(
                    <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 14px',background:r.isMeu?`${T.gold}06`:'transparent',borderBottom:`1px solid ${T.s2}`}}>
                      <div style={{width:30,height:30,borderRadius:8,background:r.posicao<=3?[`${T.gold}20`,'rgba(148,163,184,.1)','rgba(180,83,9,.1)'][r.posicao-1]:`${T.s2}`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"Georgia,serif",fontSize:12,fontWeight:900,color:r.posicao<=3?[T.gold,'#94a3b8','#b45309'][r.posicao-1]:T.muted}}>
                        {r.posicao}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:11,fontWeight:r.isMeu?700:400,color:r.isMeu?T.gold:T.text}}>
                          {r.isMeu?`🐦 ${r.pombo.nome}`:`${r.nome||'Adversário'}`}
                        </div>
                        {!r.isMeu&&r.pombalNome&&<div style={{fontSize:9,color:T.muted}}>{r.pombalNome}</div>}
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:10,color:T.muted,fontVariantNumeric:'tabular-nums'}}>{r.velocidade} m/min</div>
                        {r.isMeu&&<div style={{fontSize:9,color:T.success,fontWeight:700}}>Top {100-r.percentil+1}%</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* RESULTADO FINAL */}
        {fase==='resultado'&&(
          <>
            <div style={{textAlign:'center',padding:'16px 0'}}>
              <div style={{fontSize:52,marginBottom:8}}>🏆</div>
              <div style={{fontFamily:"Georgia,serif",fontSize:22,fontWeight:900,color:T.gold}}>Prova Concluída!</div>
            </div>
            {meusPombos.map(r=>{
              const medal=r.posicao===1?'🥇':r.posicao===2?'🥈':r.posicao===3?'🥉':null
              const corBorda=r.posicao<=3?T.gold:T.s2
              return(
                <div key={r.pombo.id} style={{background:T.surface,border:`2px solid ${corBorda}`,borderRadius:14,padding:'16px',position:'relative',overflow:'hidden'}}>
                  {r.posicao<=3&&<GL/>}
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                    <div>
                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                        {medal&&<span style={{fontSize:24}}>{medal}</span>}
                        <div style={{fontSize:17,fontWeight:800,color:T.text}}>{r.pombo.nome}</div>
                      </div>
                      <div style={{fontSize:10,color:T.muted,marginTop:2}}>{r.pombo.especialidade}</div>
                    </div>
                    <div style={{textAlign:'center',background:r.posicao<=3?`${T.gold}15`:T.s2,borderRadius:10,padding:'10px 14px',border:`1px solid ${r.posicao<=3?T.gold:T.s2}`}}>
                      <div style={{fontFamily:"Georgia,serif",fontSize:28,fontWeight:900,color:r.posicao<=3?T.gold:T.text,lineHeight:1}}>{r.posicao}º</div>
                      <div style={{fontSize:8,color:T.muted}}>/{r.total}</div>
                    </div>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,textAlign:'center',marginBottom:r.posicao===1?10:0}}>
                    {[
                      {l:'Velocidade',v:`${r.velocidade}m/min`,c:T.blue},
                      {l:'Percentil',v:`${r.percentil}%`,c:T.success},
                      {l:'Tempo',v:`${Math.floor(r.tempo/60)}h${r.tempo%60}m`,c:T.gold},
                    ].map((s,i)=>(
                      <div key={i} style={{padding:'8px',background:T.s2,borderRadius:8}}>
                        <div style={{fontSize:13,fontWeight:700,color:s.c,fontVariantNumeric:'tabular-nums'}}>{s.v}</div>
                        <div style={{fontSize:8,color:T.muted,marginTop:2}}>{s.l.toUpperCase()}</div>
                      </div>
                    ))}
                  </div>
                  {r.posicao===1&&(
                    <div style={{padding:'10px',background:`${T.gold}10`,border:`1px solid ${T.gold}30`,borderRadius:8,textAlign:'center',fontSize:13,color:T.gold,fontWeight:700}}>
                      🥇 VITÓRIA! +{prova.premio.toLocaleString()}€ adicionados ao orçamento
                    </div>
                  )}
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function VLProvas({carreira,onVoltar,onGuardar}){
  const [cl,setCL]=useState(()=>lerLS()||carreira)
  const c=cl
  const salvar=(d)=>{gravarLS(d);setCL({...d});onGuardar?.(d)}

  const [tab,setTab]=useState('calendario')
  const [provaAtiva,setProvaAtiva]=useState(null)
  const [pombosSelec,setPombosSelec]=useState([])
  const [estrategia,setEstrategia]=useState('normal')
  const [meteo,setMeteo]=useState(null)
  const [simulando,setSimulando]=useState(false)
  const [resultados,setResultados]=useState(null)

  const historico=c.historico_provas||[]
  const semanaAtual=c.semana||1

  const togglePombo=(p)=>setPombosSelec(prev=>prev.find(x=>x.id===p.id)?prev.filter(x=>x.id!==p.id):prev.length<10?[...prev,p]:prev)

  const prepararProva=(p)=>{
    setProvaAtiva(p)
    setMeteo(gerarMeteo())
    setPombosSelec([])
    setTab('inscrever')
  }

  const iniciarProva=()=>{
    if(!pombosSelec.length||!provaAtiva||!meteo)return
    const res=simularProva(pombosSelec,provaAtiva,meteo,estrategia)
    setResultados(res);setSimulando(true)
  }

  const fecharSimulacao=()=>{
    // Guardar resultados
    const novosRes=pombosSelec.map(p=>{
      const r=resultados.find(r=>r.pombo?.id===p.id)
      return{provaId:provaAtiva.id,provaNome:provaAtiva.nome,pomboId:p.id,pomboNome:p.nome,posicao:r?.posicao,total:r?.total,percentil:r?.percentil,velocidade:r?.velocidade,semana:semanaAtual,tipo:provaAtiva.tipo,dist:provaAtiva.dist}
    })
    // Actualizar pombos
    const novosPombos=(c.pombos||[]).map(p=>{
      const r=resultados.find(r=>r.pombo?.id===p.id)
      if(!r)return p
      const novaFadiga=Math.min(100,(p.fadiga||0)+20)
      const novoPotRev=Math.min(100,(p.atributos?.potencial_revelado||0)+5)
      return{...p,provas:(p.provas||0)+1,vitorias:(p.vitorias||0)+(r.posicao===1?1:0),percentil_medio:Math.round(((p.percentil_medio||0)*(p.provas||0)+r.percentil)/((p.provas||0)+1)),fadiga:novaFadiga,atributos:{...p.atributos,potencial_revelado:novoPotRev}}
    })
    // Premio só ao jogador se top 3
    const premio=pombosSelec.some(p=>{const r=resultados.find(r=>r.pombo?.id===p.id);return r&&r.posicao<=3})?provaAtiva.premio:pombosSelec.some(p=>{const r=resultados.find(r=>r.pombo?.id===p.id);return r&&r.percentil>=80})?Math.round(provaAtiva.premio*.2):0
    salvar({...c,pombos:novosPombos,historico_provas:[...historico,...novosRes],orcamento:(c.orcamento||0)+premio})
    setSimulando(false);setResultados(null);setProvaAtiva(null);setPombosSelec([]);setMeteo(null);setTab('historico')
  }

  // Estatísticas
  const totalProvas=historico.length
  const vitorias=historico.filter(r=>r.posicao===1).length
  const melhorPercentil=historico.length?Math.max(...historico.map(r=>r.percentil||0)):0
  const mediaPct=historico.length?Math.round(historico.reduce((s,r)=>s+(r.percentil||0),0)/historico.length):0

  return(
    <div style={{minHeight:'100vh',background:T.bg,color:T.text,fontFamily:"system-ui,sans-serif"}}>
      {simulando&&resultados&&<SimulacaoVisual prova={provaAtiva} resultados={resultados} pombosParticipantes={pombosSelec} meteo={meteo} estrategia={estrategia} onFechar={fecharSimulacao}/>}

      <div style={{background:`linear-gradient(180deg,${T.surface},${T.bg})`,borderBottom:`1px solid ${T.s2}`,padding:'14px 16px',position:'relative'}}>
        <GL/>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
          <button onClick={onVoltar} style={{background:T.surface,border:`1px solid ${T.s2}`,borderRadius:8,width:32,height:32,color:T.muted,cursor:'pointer',fontSize:16}}>←</button>
          <div>
            <div style={{fontSize:16,fontWeight:800}}>🏆 Provas</div>
            <div style={{fontSize:9,color:T.muted}}>Ép.{c.epoca||1} · Sem.{semanaAtual} · {vitorias} vitórias · Melhor P{melhorPercentil}%</div>
          </div>
        </div>
        {/* Stats rápidos */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6,marginBottom:12}}>
          {[
            {l:'PROVAS',v:totalProvas,c:T.blue},
            {l:'VITÓRIAS',v:vitorias,c:T.gold},
            {l:'MELHOR',v:`P${melhorPercentil}%`,c:T.success},
            {l:'MÉDIA',v:`P${mediaPct}%`,c:T.purple},
          ].map((s,i)=>(
            <div key={i} style={{background:T.s2,borderRadius:8,padding:'6px 8px',textAlign:'center'}}>
              <div style={{fontFamily:"Georgia,serif",fontSize:14,fontWeight:900,color:s.c}}>{s.v}</div>
              <div style={{fontSize:7,color:T.muted,fontWeight:700,letterSpacing:.5}}>{s.l}</div>
            </div>
          ))}
        </div>
        <div style={{display:'flex',gap:6}}>
          {[['calendario','📅 Calendário'],['inscrever','🏁 Inscrever'],['historico','📋 Historial']].map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id)}
              style={{flex:'none',padding:'8px 12px',borderRadius:8,border:tab===id?'none':`1px solid ${T.s2}`,background:tab===id?`linear-gradient(135deg,${T.purple}44,${T.purple}22)`:'transparent',color:tab===id?T.purple:T.muted,fontSize:11,fontWeight:tab===id?700:400,cursor:'pointer',fontFamily:'inherit',minHeight:34}}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:'12px 16px',display:'flex',flexDirection:'column',gap:8}}>

        {/* CALENDÁRIO */}
        {tab==='calendario'&&PROVAS.map(p=>{
          const passada=p.semana<semanaAtual
          const proxima=p.semana===semanaAtual
          const futura=p.semana>semanaAtual
          const semanasAte=p.semana-semanaAtual
          const cor=COR_NIVEL[p.nivel]||T.muted
          const resultadoProva=historico.filter(r=>r.provaId===p.id)
          const melhorRes=resultadoProva.length?resultadoProva.reduce((b,r)=>r.percentil>b.percentil?r:b,resultadoProva[0]):null
          return(
            <div key={p.id} style={{background:proxima?`linear-gradient(135deg,${T.purple}0A,${T.bg})`:T.surface,border:`1px solid ${proxima?T.purple:passada?T.s2:T.s2}`,borderRadius:12,padding:'12px 14px',opacity:passada?.6:1,position:'relative',overflow:'hidden',transition:'all .2s'}}>
              {proxima&&<GL/>}
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4,flexWrap:'wrap'}}>
                    <span style={{fontSize:9,fontWeight:700,color:cor,background:`${cor}15`,padding:'2px 7px',borderRadius:4,letterSpacing:.5}}>{p.nivel.toUpperCase()}</span>
                    {proxima&&<span style={{fontSize:9,fontWeight:700,color:T.gold,background:`${T.gold}15`,padding:'2px 7px',borderRadius:4}}>⭐ ESTA SEMANA</span>}
                    {passada&&melhorRes&&<span style={{fontSize:9,color:T.success,background:`${T.success}10`,padding:'2px 7px',borderRadius:4,fontWeight:600}}>✓ Melhor: P{melhorRes.percentil}%</span>}
                  </div>
                  <div style={{fontSize:14,fontWeight:700,color:passada?T.muted:T.text,marginBottom:3}}>{p.nome}</div>
                  <div style={{display:'flex',gap:10}}>
                    <span style={{fontSize:10,color:T.muted}}>{TIPO_LABEL[p.tipo]}</span>
                    <span style={{fontSize:10,color:T.muted}}>📍 {p.dist}km</span>
                    <span style={{fontSize:10,color:T.gold,fontWeight:600}}>🏅 {p.premio.toLocaleString()}€</span>
                  </div>
                </div>
                <div style={{textAlign:'center',minWidth:52,background:proxima?`${T.purple}15`:T.s2,borderRadius:8,padding:'8px 10px',border:`1px solid ${proxima?T.purple:T.s2}`}}>
                  <div style={{fontFamily:"Georgia,serif",fontSize:20,fontWeight:900,color:proxima?T.purple:passada?T.s2:T.muted,lineHeight:1}}>{passada?'✓':p.semana}</div>
                  {!passada&&<div style={{fontSize:7,color:proxima?T.purple:T.muted,fontWeight:700,marginTop:2}}>{proxima?'AGORA':'SEM.'}</div>}
                </div>
              </div>
              {proxima&&(
                <button onClick={()=>prepararProva(p)}
                  style={{marginTop:10,width:'100%',padding:'10px',borderRadius:8,border:'none',background:`linear-gradient(135deg,${T.purple},#7C3AED)`,color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit',boxShadow:`0 4px 16px ${T.purple}30`}}>
                  🏁 Preparar e Inscrever
                </button>
              )}
              {futura&&semanasAte<=4&&(
                <div style={{marginTop:8,fontSize:10,color:T.muted,textAlign:'right'}}>
                  Em {semanasAte} semana{semanasAte>1?'s':''}
                </div>
              )}
            </div>
          )
        })}

        {/* INSCREVER */}
        {tab==='inscrever'&&(
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {!provaAtiva?(
              <div>
                <div style={{fontSize:10,color:T.muted,marginBottom:10}}>Selecciona uma prova para inscrever:</div>
                {PROVAS.filter(p=>p.semana>=semanaAtual).slice(0,3).map(p=>(
                  <div key={p.id} onClick={()=>prepararProva(p)}
                    style={{padding:'12px 14px',background:T.surface,border:`1px solid ${T.s2}`,borderRadius:10,marginBottom:6,cursor:'pointer',position:'relative',overflow:'hidden'}}>
                    <GL/>
                    <div style={{fontSize:13,fontWeight:700,color:T.text}}>{p.nome}</div>
                    <div style={{fontSize:10,color:T.muted}}>{TIPO_LABEL[p.tipo]} · {p.dist}km · Sem.{p.semana} · 🏅{p.premio.toLocaleString()}€</div>
                  </div>
                ))}
              </div>
            ):(
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {/* Info prova */}
                <div style={{padding:'14px',background:`${T.purple}0A`,border:`1px solid ${T.purple}30`,borderRadius:12,position:'relative',overflow:'hidden'}}>
                  <GL/>
                  <div style={{fontSize:15,fontWeight:800,color:T.purple,marginBottom:2}}>{provaAtiva.nome}</div>
                  <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                    <span style={{fontSize:10,color:T.muted}}>{TIPO_LABEL[provaAtiva.tipo]} · {provaAtiva.dist}km</span>
                    <span style={{fontSize:10,color:T.gold,fontWeight:600}}>🏅 {provaAtiva.premio.toLocaleString()}€</span>
                    {meteo&&<span style={{fontSize:10,color:meteo.penalidade>0.1?T.danger:T.success}}>{meteo.label}</span>}
                  </div>
                </div>

                {/* Meteorologia */}
                {meteo&&(
                  <div style={{padding:'10px 14px',background:meteo.penalidade>.2?`${T.danger}0A`:meteo.penalidade>.05?`${T.gold}0A`:`${T.success}0A`,border:`1px solid ${meteo.penalidade>.2?T.danger:meteo.penalidade>.05?T.gold:T.success}30`,borderRadius:10}}>
                    <div style={{fontSize:10,fontWeight:700,color:meteo.penalidade>.2?T.danger:meteo.penalidade>.05?T.gold:T.success,marginBottom:2}}>🌤️ Previsão Meteorológica</div>
                    <div style={{fontSize:12,color:T.text,fontWeight:600}}>{meteo.label}</div>
                    <div style={{fontSize:10,color:T.muted,marginTop:2}}>{meteo.penalidade===0?'Excelente para voar':meteo.penalidade<.1?'Condições ligeiramente adversas':meteo.penalidade<.2?'Condições difíceis':meteo.penalidade<.3?'Muito difícil — considerar não inscrever':'Extremamente perigoso!'}</div>
                  </div>
                )}

                {/* Estratégia */}
                <div>
                  <div style={{fontSize:9,color:T.muted,fontWeight:700,letterSpacing:1,marginBottom:8}}>ESTRATÉGIA DE PROVA</div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6}}>
                    {[
                      {id:'conservador',icon:'🛡️',label:'Conservador',desc:'Mais seguro, menos risco',cor:T.success},
                      {id:'normal',icon:'⚖️',label:'Normal',desc:'Equilibrado',cor:T.blue},
                      {id:'agressivo',icon:'⚡',label:'Agressivo',desc:'Alto risco, alta recompensa',cor:T.danger},
                    ].map(s=>(
                      <div key={s.id} onClick={()=>setEstrategia(s.id)}
                        style={{padding:'10px 8px',borderRadius:8,border:`2px solid ${estrategia===s.id?s.cor:T.s2}`,background:estrategia===s.id?`${s.cor}10`:'transparent',cursor:'pointer',textAlign:'center',transition:'all .15s'}}>
                        <div style={{fontSize:18,marginBottom:4}}>{s.icon}</div>
                        <div style={{fontSize:10,fontWeight:700,color:estrategia===s.id?s.cor:T.muted}}>{s.label}</div>
                        <div style={{fontSize:8,color:T.muted,marginTop:2}}>{s.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selecção de pombos com análise */}
                <div>
                  <div style={{fontSize:9,color:T.muted,fontWeight:700,letterSpacing:1,marginBottom:8}}>SELECCIONAR POMBOS ({pombosSelec.length}/10)</div>
                  <div style={{display:'flex',flexDirection:'column',gap:6}}>
                    {(c.pombos||[]).filter(p=>p.estado==='activo').map(p=>{
                      const sel=pombosSelec.find(x=>x.id===p.id)
                      const forma=p.forma_atual||70
                      const fadiga=p.fadiga||0
                      const recomendado=forma>=65&&fadiga<50
                      const cor=p.sexo==='F'?'#C084FC':T.blue
                      return(
                        <div key={p.id} onClick={()=>togglePombo(p)}
                          style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:sel?`${cor}10`:T.surface,border:`1.5px solid ${sel?cor:T.s2}`,borderRadius:10,cursor:'pointer',transition:'all .15s',position:'relative',overflow:'hidden'}}>
                          {sel&&<GL/>}
                          <div style={{width:36,height:36,borderRadius:8,background:`${cor}15`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"Georgia,serif",fontSize:11,fontWeight:900,color:cor,flexShrink:0}}>
                            {p.anilha?.slice(-3)}
                          </div>
                          <div style={{flex:1}}>
                            <div style={{display:'flex',justifyContent:'space-between'}}>
                              <div style={{fontSize:12,fontWeight:700,color:sel?cor:T.text}}>{p.nome}</div>
                              {recomendado&&<span style={{fontSize:8,color:T.success,background:`${T.success}15`,padding:'1px 5px',borderRadius:3,fontWeight:700}}>✅ REC.</span>}
                            </div>
                            <div style={{fontSize:9,color:T.muted,marginTop:2}}>{p.especialidade}</div>
                            <div style={{display:'flex',gap:8,marginTop:4}}>
                              <div style={{display:'flex',alignItems:'center',gap:3}}>
                                <span style={{fontSize:8,color:T.muted}}>Forma</span>
                                <div style={{width:30,height:3,background:T.s2,borderRadius:2,overflow:'hidden'}}><div style={{height:'100%',width:`${forma}%`,background:forma>=65?T.success:forma>=40?T.gold:T.danger}}/></div>
                                <span style={{fontSize:8,color:forma>=65?T.success:forma>=40?T.gold:T.danger,fontWeight:700}}>{forma}%</span>
                              </div>
                              <div style={{display:'flex',alignItems:'center',gap:3}}>
                                <span style={{fontSize:8,color:T.muted}}>Fadiga</span>
                                <div style={{width:30,height:3,background:T.s2,borderRadius:2,overflow:'hidden'}}><div style={{height:'100%',width:`${fadiga}%`,background:fadiga<30?T.success:fadiga<60?T.gold:T.danger}}/></div>
                                <span style={{fontSize:8,color:fadiga<30?T.success:fadiga<60?T.gold:T.danger,fontWeight:700}}>{fadiga}%</span>
                              </div>
                            </div>
                          </div>
                          {sel&&<div style={{width:20,height:20,borderRadius:'50%',background:cor,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:'#fff',fontWeight:700,flexShrink:0}}>✓</div>}
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div style={{display:'flex',gap:8}}>
                  <button onClick={()=>{setProvaAtiva(null);setPombosSelec([])}}
                    style={{flex:1,padding:'12px',borderRadius:10,border:`1px solid ${T.s2}`,background:'transparent',color:T.muted,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>
                    Cancelar
                  </button>
                  <button onClick={iniciarProva} disabled={!pombosSelec.length}
                    style={{flex:2,padding:'12px',borderRadius:10,border:'none',background:pombosSelec.length?`linear-gradient(135deg,${T.purple},#7C3AED)`:`${T.s2}`,color:pombosSelec.length?'#fff':T.muted,fontSize:12,fontWeight:700,cursor:pombosSelec.length?'pointer':'default',fontFamily:'inherit',boxShadow:pombosSelec.length?`0 4px 16px ${T.purple}30`:'none'}}>
                    🚀 Iniciar Prova!
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* HISTORIAL */}
        {tab==='historico'&&(
          historico.length===0?(
            <div style={{textAlign:'center',padding:'40px 20px'}}>
              <div style={{fontSize:40,marginBottom:12}}>📋</div>
              <div style={{fontSize:13,color:T.muted}}>Sem provas ainda</div>
              <div style={{fontSize:11,color:T.s2,marginTop:6}}>Inscreve os teus pombos e compete!</div>
            </div>
          ):(
            [...historico].reverse().map((r,i)=>(
              <div key={i} style={{padding:'12px 14px',background:T.surface,border:`1px solid ${r.posicao===1?T.gold:r.posicao<=3?T.success:T.s2}`,borderRadius:10,position:'relative',overflow:'hidden'}}>
                {r.posicao<=3&&<GL/>}
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:T.text}}>{r.provaNome}</div>
                    <div style={{fontSize:9,color:T.muted,marginTop:1}}>🐦 {r.pomboNome} · Sem.{r.semana}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontFamily:"Georgia,serif",fontSize:16,fontWeight:900,color:r.posicao===1?T.gold:r.posicao<=3?T.success:T.muted}}>{r.posicao}º/{r.total}</div>
                    <div style={{fontSize:10,color:T.success,fontWeight:700}}>P{r.percentil}%</div>
                  </div>
                </div>
                {r.velocidade&&<div style={{fontSize:9,color:T.muted}}>⚡ {r.velocidade} m/min · {r.tipo?TIPO_LABEL[r.tipo]:''}</div>}
              </div>
            ))
          )
        )}
      </div>
    </div>
  )
}
