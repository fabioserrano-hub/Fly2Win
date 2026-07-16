// src/modules/virtualLoft/screens/VLRankings.jsx
import { useState, useEffect } from 'react'


const NOMES_POMBAIS_IA = ['Pombal da Serra','Pombal Elite','Pombal Campeão','Pombal do Norte','Pombal Real','Pombal Dourado','Pombal Veloz','Pombal do Sul','Pombal Ibérico','Pombal Águia']
const GESTORES_IA = ['João Silva','Carlos Mendes','António Costa','Pedro Ferreira','Rui Santos','Miguel Sousa']
const EMOJIS_IA = ['🦅','🏆','⚡','🌟','🔥','💎','🎯','🌊','🏅','👑']

function gerarAtrsSimples(nivel) {
  const base = nivel==='elite'?72:nivel==='bom'?58:42
  const r = () => Math.min(99, Math.max(1, Math.round(base + (Math.random()-0.5)*20)))
  return { velocidade:r(), resistencia:r(), orientacao:r() }
}

function gerarPombalIA(nivel='normal') {
  return {
    id: `ia_${Math.random().toString(36).slice(2,8)}`,
    nome: NOMES_POMBAIS_IA[Math.floor(Math.random()*NOMES_POMBAIS_IA.length)],
    gestor: GESTORES_IA[Math.floor(Math.random()*GESTORES_IA.length)],
    emoji: EMOJIS_IA[Math.floor(Math.random()*EMOJIS_IA.length)],
    nivel, attrs: gerarAtrsSimples(nivel),
    reputacao: nivel==='elite'?60+Math.random()*30:nivel==='bom'?30+Math.random()*30:5+Math.random()*25,
  }
}

function simularPontosIA(ia, nProvas) {
  const base = ia.nivel==='elite'?80:ia.nivel==='bom'?60:40
  return Math.round((base + (Math.random()-0.5)*20) * nProvas * 0.5 + ia.reputacao * 2)
}

const PROVAS_CALENDARIO = [
  { id:'p1', nome:'Prova Local - Santarém', distancia:80,  tipo:'velocidade',   semana:3  },
  { id:'p2', nome:'Prova Local - Setúbal',  distancia:120, tipo:'velocidade',   semana:5  },
  { id:'p3', nome:'Distrital - Évora',       distancia:200, tipo:'velocidade',   semana:8  },
  { id:'p4', nome:'Distrital - Beja',        distancia:250, tipo:'meio_fundo',   semana:11 },
  { id:'p5', nome:'Regional - Badajoz',      distancia:350, tipo:'meio_fundo',   semana:15 },
  { id:'p6', nome:'Regional - Mérida',       distancia:420, tipo:'meio_fundo',   semana:18 },
  { id:'p7', nome:'Nacional - Salamanca',    distancia:510, tipo:'fundo',        semana:22 },
  { id:'p8', nome:'Nacional - Valladolid',   distancia:650, tipo:'fundo',        semana:26 },
  { id:'p9', nome:'Internacional - Barcelona',distancia:850,tipo:'grande_fundo', semana:30 },
]

function gerarRankingIA(carreira, idioma) {
  const niveis = ['elite','bom','bom','normal','normal','normal','normal','fraco','fraco']
  const ias = niveis.map(n => gerarPombalIA(n))
  const nProvas = PROVAS_CALENDARIO.filter(p => p.semana < carreira.semana).length

  const pombaisComPontos = ias.map(ia => {
    const pontos = simularPontosIA(ia, Math.max(1, nProvas))
    const vitorias = ia.nivel==='elite' ? Math.floor(Math.random()*5) : Math.floor(Math.random()*2)
    return { ...ia, pontos, vitorias }
  })

  // Adicionar o jogador
  const provasJogador = carreira.historico_provas || []
  const pontosJogador = provasJogador.reduce((s,r) => s + (r.percentil || 0), 0)
  const vitoriasJogador = provasJogador.filter(r => r.posicao === 1).length

  const jogador = {
    id: 'player',
    nome: carreira.nomePombal,
    gestor: carreira.nomeGestor,
    emoji: carreira.logotipo || '🕊️',
    pontos: Math.round(pontosJogador + carreira.reputacao * 2),
    vitorias: vitoriasJogador,
    isPlayer: true,
  }

  return [...pombaisComPontos, jogador].sort((a,b) => b.pontos - a.pontos)
}

export default function VLRankings({ carreira, onVoltar, idioma = 'pt' }) {
  const [tab, setTab] = useState('geral')
  const [ranking, setRanking] = useState(null)

  useEffect(() => {
    // Gerar ranking com IA
    const r = gerarRankingIA(carreira, idioma)
    setRanking(r)
  }, [carreira.semana])

  const posicaoJogador = ranking?.findIndex(r => r.isPlayer) + 1

  const COR_POS = (pos) => pos === 1 ? '#D4AF37' : pos === 2 ? '#94a3b8' : pos === 3 ? '#b45309' : '#475569'
  const BG_POS = (pos) => pos === 1 ? 'rgba(212,175,55,.15)' : pos === 2 ? 'rgba(148,163,184,.1)' : pos === 3 ? 'rgba(180,83,9,.1)' : 'rgba(255,255,255,.02)'

  const pombosRanking = [...(carreira.pombos||[])]
    .sort((a,b) => (b.percentil_medio||0) - (a.percentil_medio||0))

  return (
    <div style={{ minHeight:'100vh', background:'#030812', color:'#fff', fontFamily:'inherit' }}>
      <div style={{ background:'linear-gradient(180deg,#050D1A,#030812)', borderBottom:'1px solid rgba(255,255,255,.05)', padding:'14px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
          <button onClick={onVoltar} style={{ background:'rgba(255,255,255,.06)', border:'none', borderRadius:8, width:32, height:32, color:'#7A8699', cursor:'pointer', fontSize:16 }}>←</button>
          <div>
            <div style={{ fontSize:16, fontWeight:800 }}>📊 Rankings</div>
            <div style={{ fontSize:10, color:'#7A8699' }}>
              {idioma==='en'?'Season':idioma==='es'?'Temporada':'Época'} {carreira.epoca} · {idioma==='en'?'Week':idioma==='es'?'Semana':'Semana'} {carreira.semana}
              {posicaoJogador ? ` · ${idioma==='en'?'Your position':idioma==='es'?'Tu posición':'A tua posição'}: ${posicaoJogador}º` : ''}
            </div>
          </div>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {[['geral', idioma==='en'?'Lofts':idioma==='es'?'Palomares':'Pombais'],
            ['pombos', idioma==='en'?'Pigeons':idioma==='es'?'Palomas':'Pombos']].map(([id,label]) => (
            <button key={id} onClick={() => setTab(id)}
              style={{ flex:'none', padding:'8px 16px', borderRadius:8, border:tab===id?'none':'1px solid rgba(255,255,255,.08)', background:tab===id?'linear-gradient(135deg,#f87171,#dc2626)':'rgba(255,255,255,.04)', color:tab===id?'#fff':'#cbd5e1', fontSize:12, fontWeight:tab===id?700:500, cursor:'pointer', fontFamily:'inherit', minHeight:36 }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding:'12px 16px', display:'flex', flexDirection:'column', gap:8 }}>

        {/* RANKING GERAL — Pombais */}
        {tab === 'geral' && ranking && (
          <>
            {/* Pódio top 3 */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1.2fr 1fr', gap:8, marginBottom:8 }}>
              {[ranking[1], ranking[0], ranking[2]].map((r, idx) => {
                const pos = idx === 0 ? 2 : idx === 1 ? 1 : 3
                const h = idx === 1 ? 120 : 90
                return r ? (
                  <div key={r.id} style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end' }}>
                    <div style={{ fontSize:r.isPlayer?18:14, marginBottom:4 }}>{r.emoji}</div>
                    <div style={{ fontSize:10, fontWeight:700, color: r.isPlayer?'#D4AF37':'#cbd5e1', textAlign:'center', marginBottom:4, lineHeight:1.2 }}>{r.nome}</div>
                    <div style={{ width:'100%', height:h, background:`linear-gradient(180deg,${COR_POS(pos)}30,${COR_POS(pos)}10)`, border:`1px solid ${COR_POS(pos)}40`, borderRadius:'8px 8px 0 0', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2 }}>
                      <div style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:900, color:COR_POS(pos) }}>{pos}º</div>
                      <div style={{ fontSize:10, color:'#7A8699' }}>{r.pontos}pts</div>
                    </div>
                  </div>
                ) : <div key={idx}/>
              })}
            </div>

            {/* Lista completa */}
            {ranking.map((r, i) => (
              <div key={r.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background: r.isPlayer ? 'rgba(212,175,55,.08)' : BG_POS(i+1), border:`1px solid ${r.isPlayer?'rgba(212,175,55,.3)':i<3?COR_POS(i+1)+'30':'rgba(255,255,255,.05)'}`, borderRadius:10 }}>
                <div style={{ width:32, height:32, borderRadius:8, background:BG_POS(i+1), display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Fraunces',serif", fontSize:14, fontWeight:900, color:COR_POS(i+1), flexShrink:0 }}>
                  {i+1}
                </div>
                <div style={{ fontSize:18, flexShrink:0 }}>{r.emoji}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight: r.isPlayer?800:600, color: r.isPlayer?'#D4AF37':'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {r.nome} {r.isPlayer && '👈'}
                  </div>
                  <div style={{ fontSize:10, color:'#475569' }}>{r.gestor} · {r.vitorias} {idioma==='en'?'wins':idioma==='es'?'victorias':'vitórias'}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:14, fontWeight:800, color: i===0?'#D4AF37':i===1?'#94a3b8':i===2?'#b45309':'#7A8699' }}>{r.pontos}</div>
                  <div style={{ fontSize:9, color:'#475569' }}>pts</div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* RANKING POMBOS */}
        {tab === 'pombos' && (
          <>
            {pombosRanking.length === 0 ? (
              <div style={{ textAlign:'center', padding:'40px 20px', color:'#475569' }}>
                <div style={{ fontSize:40, marginBottom:12 }}>🐦</div>
                <div style={{ fontSize:14, fontWeight:600 }}>
                  {idioma==='en'?'Race your pigeons to see rankings':idioma==='es'?'Compite para ver el ranking':'Participa em provas para ver o ranking'}
                </div>
              </div>
            ) : pombosRanking.map((p, i) => (
              <div key={p.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background: i===0?'rgba(212,175,55,.08)':'rgba(255,255,255,.02)', border:`1px solid ${i===0?'rgba(212,175,55,.25)':'rgba(255,255,255,.05)'}`, borderRadius:10 }}>
                <div style={{ width:28, height:28, borderRadius:6, background:BG_POS(i+1), display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Fraunces',serif", fontSize:12, fontWeight:900, color:COR_POS(i+1), flexShrink:0 }}>{i+1}</div>
                <div style={{ width:32, height:32, borderRadius:8, background: p.sexo==='F'?'rgba(192,132,252,.15)':'rgba(76,141,255,.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, color: p.sexo==='F'?'#c084fc':'#4C8DFF', fontFamily:"'Fraunces',serif", flexShrink:0 }}>{p.anilha?.slice(-3)}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{p.nome}</div>
                  <div style={{ fontSize:10, color:'#475569' }}>{p.especialidade} · {p.provas||0} {idioma==='en'?'races':idioma==='es'?'carreras':'provas'}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:14, fontWeight:800, color:'#2DD4A7' }}>{p.percentil_medio||0}%</div>
                  <div style={{ fontSize:9, color:'#475569' }}>percentil</div>
                </div>
                <div style={{ display:'flex', gap:2 }}>
                  {Array.from({length:5}).map((_,j)=><div key={j} style={{ fontSize:8, color:j<p.rating?'#D4AF37':'rgba(255,255,255,.1)' }}>★</div>)}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
