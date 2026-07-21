// src/modules/virtualLoft/screens/VLNoticias.jsx — Notícias geradas automaticamente
import { useState, useMemo } from 'react'
import { gerarNoticiasEngine } from '../engine/gameEngine'

const T={bg:'#050A14',surface:'#0D1829',s2:'#1A2A45',gold:'#C9A84C',blue:'#4FC3F7',text:'#E8EDF5',muted:'#6B7A99',success:'#2DD4A7',danger:'#F87171',purple:'#A855F7',orange:'#FB923C'}
function lerLS(){try{return JSON.parse(localStorage.getItem('vl_carreira'))}catch{return null}}
function GL(){return <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,#C9A84C,transparent)',opacity:.8}}/>}

const POMBAIS_MUNDO=['Pombal da Serra','Pombal Elite','Pombal Norte','Pombal Real','Pombal Ibérico','Colombo Barcelona','Club Palomas Madrid','Palomar Lusitano','Pombal Dourado','Pombal Campeão']
const NOMES_POMBOS_MUNDO=['Trovão','Furacão','Relâmpago','Astro','Cometa','Titã','Orion','Sirius','Zeus','Apolo','Mercúrio','Saturno','Plutão','Aurora','Brisa','Eclipse','Radar']

function gerarNoticiaMundo(semana,epoca,seed){
  const rng=(n)=>Math.abs(Math.sin(seed*n+semana*7+epoca*31)*10000)%1
  const pombal=POMBAIS_MUNDO[Math.floor(rng(1)*POMBAIS_MUNDO.length)]
  const pombo=NOMES_POMBOS_MUNDO[Math.floor(rng(2)*NOMES_POMBOS_MUNDO.length)]
  const vel=Math.round(1200+rng(3)*400)
  const pos=Math.floor(rng(4)*3)+1
  const cidades=['Salamanca','Madrid','Barcelona','Lyon','Paris','Pau','Burgos','Valladolid','Badajoz','Mérida']
  const cidade=cidades[Math.floor(rng(5)*cidades.length)]

  const templates=[
    {tipo:'vitoria',icon:'🥇',categoria:'PROVAS',titulo:`${pombo} vence em ${cidade}!`,desc:`O ${pombal} sagra-se vencedor da prova de ${cidade} com ${pombo}, à velocidade de ${vel} m/min. Uma performance histórica.`},
    {tipo:'recorde',icon:'⚡',categoria:'RECORDES',titulo:`Novo recorde na prova de ${cidade}`,desc:`${pombo}, do ${pombal}, bate o recorde da prova com ${vel} m/min. A comunidade columbófila aplaude a performance.`},
    {tipo:'mercado',icon:'💰',categoria:'MERCADO',titulo:`Transacção milionária no mercado`,desc:`${pombal} vende reprodutor de elite por valor recorde. O mercado aquece com a chegada da nova época.`},
    {tipo:'genética',icon:'🧬',categoria:'GENÉTICA',titulo:`Gene raro descoberto em ${pombal}`,desc:`Investigadores identificam gene de orientação excecional num exemplar do ${pombal}. Especialistas preveem nova geração de campeões.`},
    {tipo:'rival',icon:'🏆',categoria:'RIVALIDADE',titulo:`${pombal} lidera o campeonato`,desc:`Com ${Math.floor(rng(6)*200)+50} pontos acumulados, o ${pombal} consolida a liderança. A disputa pelo título promete ser intensa.`},
    {tipo:'tempo',icon:'⛈️',categoria:'METEOROLOGIA',titulo:`Condições adversas afectam prova em ${cidade}`,desc:`Ventos fortes de ${Math.floor(rng(7)*60)+20} km/h perturbaram a prova de ${cidade}. Apenas os mais resistentes completaram o percurso.`},
    {tipo:'saude',icon:'🏥',categoria:'SAÚDE',titulo:`Alerta sanitário no circuito columbófilo`,desc:`Autoridades veterinárias recomendam vacinação preventiva. Os pombaleiros são aconselhados a reforçar os cuidados sanitários.`},
    {tipo:'jovem',icon:'🐦',categoria:'TALENTOS',titulo:`Jovem campeão surpreende em ${cidade}`,desc:`${pombo}, apenas no primeiro ano de competição, terminou no top 5% em ${cidade}. O ${pombal} pode ter encontrado uma estrela.`},
  ]
  return templates[Math.floor(rng(8)*templates.length)]
}

function gerarNoticias(carreira){
  const hist=carreira.historico_provas||[]
  const pombos=carreira.pombos||[]
  const semana=carreira.semana||1
  const epoca=carreira.epoca||1
  const dia=carreira.dia||1
  const noticias=[]

  // Notícias pessoais — baseadas na carreira real
  hist.slice(-5).reverse().forEach((r,i)=>{
    if(r.posicao===1){
      noticias.push({
        id:`v_${i}`,tipo:'pessoal',icon:'🥇',categoria:'VITÓRIA',prioridade:1,
        titulo:`${r.pomboNome} vence em ${r.provaNome}!`,
        desc:`O teu campeão ${r.pomboNome} sagrou-se vencedor com um percentil de ${r.percentil}%${r.velocidade?` à velocidade de ${r.velocidade} m/min`:''}.`,
        dia:r.semana,tag:'TU'
      })
    } else if((r.percentil||0)>=90){
      noticias.push({
        id:`d_${i}`,tipo:'pessoal',icon:'⭐',categoria:'DESTAQUE',prioridade:2,
        titulo:`${r.pomboNome} no top 10% em ${r.provaNome}`,
        desc:`Excelente performance de ${r.pomboNome} com percentil ${r.percentil}% em ${r.provaNome}. Uma das melhores performances do teu plantel.`,
        dia:r.semana,tag:'TU'
      })
    }
  })

  // Entrada no HoF
  ;(carreira.hall_of_fame||[]).slice(-3).forEach((e,i)=>{
    noticias.push({
      id:`hof_${i}`,tipo:'pessoal',icon:'🏛️',categoria:'HALL OF FAME',prioridade:1,
      titulo:`${e.nomePombo} entra no Hall of Fame!`,
      desc:`${e.nomePombo} imortalizou-se na história do ${carreira.nomePombal} com a distinção de "${e.titulo}". Uma lenda criada por ti.`,
      dia:e.dia||semana,tag:'TU'
    })
  })

  // Ninhadas
  ;(carreira.ninhadas_virtuais||[]).slice(-2).forEach((n,i)=>{
    noticias.push({
      id:`nin_${i}`,tipo:'pessoal',icon:'🥚',categoria:'NINHADA',prioridade:3,
      titulo:`Nova ninhada: ${n.pai_nome} × ${n.mae_nome}`,
      desc:`Dois ovos foram postos no ${carreira.nomePombal}. O cruzamento de ${n.pai_nome} com ${n.mae_nome} promete descendentes de qualidade.`,
      dia:n.dia_inicio||semana,tag:'TU'
    })
  })

  // Gene raro descoberto
  const comGene=pombos.find(p=>p.atributos?.gene_raro_tipo)
  if(comGene){
    noticias.push({
      id:'gene_1',tipo:'pessoal',icon:'💎',categoria:'GENÉTICA',prioridade:2,
      titulo:`Gene raro em ${comGene.nome}!`,
      desc:`O teu pombo ${comGene.nome} é portador do gene "${comGene.atributos.gene_raro_tipo}". Uma descoberta que pode revolucionar a tua linha genética.`,
      dia:semana,tag:'TU'
    })
  }

  // Patrocínio
  if((carreira.patrocinios||[]).length>0){
    const pat=carreira.patrocinios[carreira.patrocinios.length-1]
    noticias.push({
      id:'pat_1',tipo:'pessoal',icon:'🤝',categoria:'PATROCÍNIO',prioridade:3,
      titulo:`${pat.nome} apoia o ${carreira.nomePombal}`,
      desc:`Novo acordo de patrocínio assinado com ${pat.nome}. O pombal recebe +${pat.valorSemanal}€ por semana durante ${pat.semanas} semanas.`,
      dia:semana,tag:'TU'
    })
  }

  // Notícias do mundo (geradas proceduralm.)
  const semanasMundo=[semana-1,semana-2,semana-3,semana-4,semana-5].filter(s=>s>0)
  semanasMundo.forEach((s,i)=>{
    const noticia=gerarNoticiaMundo(s,epoca,s*13+i*7)
    noticias.push({
      id:`mundo_${s}`,tipo:'mundo',
      ...noticia,
      prioridade:4,dia:s,tag:'MUNDO'
    })
  })

  // Ordenar por prioridade e dia
  return noticias.sort((a,b)=>a.prioridade-b.prioridade||(b.dia||0)-(a.dia||0))
}

const COR_CAT={
  'VITÓRIA':T.gold,'DESTAQUE':T.blue,'HALL OF FAME':T.gold,'NINHADA':T.purple,
  'GENÉTICA':T.success,'PATROCÍNIO':T.success,'RECORDES':T.orange,'PROVAS':T.purple,
  'MERCADO':T.blue,'RIVALIDADE':T.danger,'METEOROLOGIA':T.muted,'SAÚDE':T.success,'TALENTOS':T.blue,
}

export default function VLNoticias({carreira,onVoltar}){
  const [cl]=useState(()=>lerLS()||carreira)
  const c=cl
  const [filtro,setFiltro]=useState('todas')

  const noticiasBase=useMemo(()=>gerarNoticias(c),[c.semana,c.dia])
  const noticiasEngine=useMemo(()=>gerarNoticiasEngine(c),[c.eventos_engine])
  const noticias=useMemo(()=>[...noticiasEngine,...noticiasBase].sort((a,b)=>(b.semana||0)-(a.semana||0)||(a.prioridade||5)-(b.prioridade||5)),[noticiasBase,noticiasEngine])
  const pessoais=noticias.filter(n=>n.tipo==='pessoal')
  const mundo=noticias.filter(n=>n.tipo==='mundo')
  const lista=filtro==='pessoais'?pessoais:filtro==='mundo'?mundo:noticias

  return(
    <div style={{minHeight:'100vh',background:T.bg,color:T.text,fontFamily:"system-ui,sans-serif"}}>
      <div style={{background:`linear-gradient(180deg,${T.surface},${T.bg})`,borderBottom:`1px solid ${T.s2}`,padding:'14px 16px',position:'relative'}}>
        <GL/>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
          <button onClick={onVoltar} style={{background:T.surface,border:`1px solid ${T.s2}`,borderRadius:8,width:32,height:32,color:T.muted,cursor:'pointer',fontSize:16}}>←</button>
          <div style={{flex:1}}>
            <div style={{fontSize:16,fontWeight:800}}>📰 Notícias</div>
            <div style={{fontSize:9,color:T.muted}}>{noticias.length} notícias · Época {c.epoca||1} · Sem.{c.semana||1}</div>
          </div>
        </div>
        <div style={{display:'flex',gap:6}}>
          {[['todas','Todas'],['pessoais','🎯 O Teu Pombal'],['mundo','🌍 Mundo']].map(([id,label])=>(
            <button key={id} onClick={()=>setFiltro(id)}
              style={{flex:'none',padding:'7px 11px',borderRadius:8,border:filtro===id?'none':`1px solid ${T.s2}`,background:filtro===id?`${T.orange}20`:'transparent',color:filtro===id?T.orange:T.muted,fontSize:10,fontWeight:filtro===id?700:400,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'}}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:'12px 16px',display:'flex',flexDirection:'column',gap:8}}>
        {lista.length===0?(
          <div style={{textAlign:'center',padding:'40px 20px'}}>
            <div style={{fontSize:40,marginBottom:12}}>📰</div>
            <div style={{fontSize:13,color:T.muted}}>Sem notícias ainda</div>
            <div style={{fontSize:10,color:T.s2,marginTop:6}}>Compete e desenvolve o teu pombal para gerar notícias!</div>
          </div>
        ):lista.map(n=>{
          const corCat=COR_CAT[n.categoria]||T.muted
          const isPessoal=n.tipo==='pessoal'
          return(
            <div key={n.id} style={{background:isPessoal?`${corCat}08`:T.surface,border:`1px solid ${isPessoal?corCat+'25':T.s2}`,borderRadius:12,padding:'14px',position:'relative',overflow:'hidden'}}>
              {isPessoal&&<GL/>}
              <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
                <div style={{width:40,height:40,borderRadius:10,background:`${corCat}15`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{n.icon}</div>
                <div style={{flex:1}}>
                  <div style={{display:'flex',gap:5,alignItems:'center',marginBottom:4,flexWrap:'wrap'}}>
                    <span style={{fontSize:8,color:corCat,background:`${corCat}15`,padding:'1px 6px',borderRadius:3,fontWeight:700,letterSpacing:.5}}>{n.categoria}</span>
                    {n.tag&&<span style={{fontSize:8,color:isPessoal?T.gold:T.muted,background:isPessoal?`${T.gold}15`:`${T.muted}15`,padding:'1px 6px',borderRadius:3,fontWeight:700}}>{n.tag}</span>}
                    <span style={{fontSize:8,color:T.muted}}>Sem.{n.dia||'?'}</span>
                  </div>
                  <div style={{fontSize:12,fontWeight:isPessoal?700:600,color:isPessoal?T.text:T.muted,marginBottom:4,lineHeight:1.4}}>{n.titulo}</div>
                  <div style={{fontSize:10,color:T.muted,lineHeight:1.5}}>{n.desc}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
