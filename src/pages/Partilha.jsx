import { useState, useEffect, useCallback, useRef } from 'react'
import { db } from '../lib/supabase'
import { useToast, Spinner } from '../components/ui'

export default function Partilha({ nav }) {
  const toast = useToast()
  const cardRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [tema, setTema] = useState('dark')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [provas, pombos, pf] = await Promise.all([db.getProvas(), db.getPombos(), db.getPerfil()])
      const ano = new Date().getFullYear()
      const provasAno = provas.filter(p => p.data_reg?.startsWith(String(ano)))
      const pombosAtivos = pombos.filter(p => (!p.estado_ext || p.estado_ext === 'proprio') && p.estado === 'ativo')
      const top = [...pombosAtivos].sort((a, b) => (b.percentil || 0) - (a.percentil || 0))[0]
      const vitorias = provasAno.length
      const melhorPercentil = top?.percentil || 0
      setStats({ ano, nPombos: pombosAtivos.length, nProvas: vitorias, top, melhorPercentil, nEfectivo: pombos.filter(p => !p.estado_ext || p.estado_ext === 'proprio').length })
      setPerfil(pf)
    } catch(e) { toast('Erro: '+e.message, 'err') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const copiarTexto = () => {
    if (!stats) return
    const txt = `🏆 Época ${stats.ano} — ChampionsLoft\n\n🐦 ${stats.nPombos} pombos activos\n📊 ${stats.nProvas} provas realizadas\n${stats.top ? `⭐ Destaque: ${stats.top.nome} · ${stats.top.percentil}% percentil\n` : ''}🚀 Gestão columbófila profissional\n\n#ChampionsLoft #Columbofilia #PombosCorreio`
    navigator.clipboard?.writeText(txt).then(() => toast('Texto copiado!', 'ok')).catch(() => toast('Copie o texto manualmente', 'warn'))
  }

  const partilharNativo = () => {
    if (!stats) return
    const txt = `🏆 Época ${stats.ano} — ChampionsLoft\n🐦 ${stats.nPombos} pombos · ${stats.nProvas} provas${stats.top ? ` · ⭐ ${stats.top.nome} ${stats.top.percentil}%` : ''}`
    if (navigator.share) {
      navigator.share({ title: 'ChampionsLoft', text: txt, url: 'https://championsloft.app' }).catch(() => {})
    } else {
      copiarTexto()
    }
  }

  const cores = {
    dark: { bg: '#050D1A', card: '#0B1830', accent: '#D4AF37', text: '#fff', sub: '#94a3b8', border: '#1B2D52' },
    gold: { bg: '#1A1000', card: '#2A1E00', accent: '#D4AF37', text: '#fff', sub: '#B8960C', border: '#5A4000' },
    blue: { bg: '#020B18', card: '#051428', accent: '#4C8DFF', text: '#fff', sub: '#7A9FC0', border: '#0D2040' },
  }
  const c = cores[tema]

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:60 }}><Spinner lg /></div>
  if (!stats) return null

  return (
    <div>
      <div className="section-header">
        <div><div className="section-title">Partilha Visual</div><div className="section-sub">Card para redes sociais</div></div>
      </div>

      {/* Selector de tema */}
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {[['dark','🌑 Escuro'],['gold','🥇 Dourado'],['blue','🔷 Azul']].map(([t,l]) => (
          <button key={t} onClick={() => setTema(t)} style={{ padding:'8px 16px', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer', border:`1px solid ${tema===t?c.accent:'#1B2D52'}`, background:tema===t?'rgba(212,175,55,.1)':'#101F40', color:tema===t?c.accent:'#94a3b8', fontFamily:'inherit' }}>{l}</button>
        ))}
      </div>

      {/* Card visual */}
      <div ref={cardRef} style={{ background:`linear-gradient(135deg, ${c.bg} 0%, ${c.card} 100%)`, border:`1px solid ${c.border}`, borderRadius:16, padding:28, marginBottom:20, maxWidth:480, position:'relative', overflow:'hidden' }}>
        {/* Decoração de fundo */}
        <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, borderRadius:'50%', background:`${c.accent}08`, border:`1px solid ${c.accent}15` }} />
        <div style={{ position:'absolute', bottom:-20, left:-20, width:80, height:80, borderRadius:'50%', background:`${c.accent}05` }} />

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
          <div>
            <div style={{ fontSize:11, color:c.accent, fontWeight:700, letterSpacing:2, marginBottom:4 }}>ÉPOCA {stats.ano}</div>
            <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:900, color:c.text }}>{perfil?.nome || 'Columbófilo'}</div>
            {perfil?.org && <div style={{ fontSize:11, color:c.sub, marginTop:2 }}>{perfil.org}</div>}
          </div>
          <div style={{ background:`${c.accent}15`, border:`1px solid ${c.accent}30`, borderRadius:10, padding:'6px 10px', textAlign:'center' }}>
            <div style={{ fontSize:10, color:c.accent, fontWeight:700 }}>CHAMPIONS</div>
            <div style={{ fontSize:10, color:c.accent }}>LOFT</div>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:20 }}>
          {[
            { v: stats.nEfectivo, l: 'Efectivo' },
            { v: stats.nPombos, l: 'Activos' },
            { v: stats.nProvas, l: 'Provas' },
          ].map(({ v, l }) => (
            <div key={l} style={{ background:`${c.border}`, borderRadius:10, padding:'12px 8px', textAlign:'center' }}>
              <div style={{ fontFamily:"'Fraunces',serif", fontSize:26, fontWeight:900, color:c.accent }}>{v}</div>
              <div style={{ fontSize:10, color:c.sub, fontWeight:600, letterSpacing:.5 }}>{l.toUpperCase()}</div>
            </div>
          ))}
        </div>

        {/* Pombo destaque */}
        {stats.top && (
          <div style={{ background:`${c.accent}08`, border:`1px solid ${c.accent}20`, borderRadius:12, padding:'14px 16px', marginBottom:16 }}>
            <div style={{ fontSize:10, color:c.accent, fontWeight:700, letterSpacing:1.5, marginBottom:8 }}>⭐ DESTAQUE DA ÉPOCA</div>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:44, height:44, borderRadius:10, background:c.card, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, overflow:'hidden', flexShrink:0 }}>
                {stats.top.foto_url ? <img src={stats.top.foto_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : stats.top.emoji || '🐦'}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'Fraunces',serif", fontSize:16, fontWeight:800, color:c.text }}>{stats.top.nome}</div>
                <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:c.accent, marginTop:1 }}>{stats.top.anilha}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontFamily:"'Fraunces',serif", fontSize:28, fontWeight:900, color:c.accent }}>{stats.top.percentil}%</div>
                <div style={{ fontSize:9, color:c.sub, fontWeight:600 }}>PERCENTIL</div>
              </div>
            </div>
          </div>
        )}

        {/* Rodapé */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontSize:10, color:c.sub }}>championsloft.app</div>
          <div style={{ fontSize:10, color:c.sub }}>#ChampionsLoft #Columbofilia</div>
        </div>
      </div>

      {/* Acções */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        <button className="btn btn-primary" onClick={partilharNativo}>📤 Partilhar</button>
        <button className="btn btn-secondary" onClick={copiarTexto}>📋 Copiar Texto</button>
        <button className="btn btn-secondary" onClick={() => window.print()}>🖨️ Imprimir / PDF</button>
      </div>

      <div style={{ marginTop:16, fontSize:12, color:'#7A8699', lineHeight:1.6 }}>
        💡 Para guardar como imagem: tire uma screenshot do card acima, ou use "Imprimir / Guardar como PDF" no browser.
      </div>
    </div>
  )
}
