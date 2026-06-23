import { useState, useEffect } from 'react'
import { db, supabase } from '../lib/supabase'
import { Spinner, EmptyState } from '../components/ui'
import { BotaoQR } from '../components/QRCode'

const ESP_ICON = { velocidade:'⚡', 'meio-fundo':'🏃', fundo:'🏔️', 'grande-fundo':'🌍' }

export default function PerfilPublico({ nav, params }) {
  const slug = params?.slug || window.location.pathname.match(/\/p\/([^/]+)/)?.[1]
  const [perfil, setPerfil] = useState(null)
  const [pombos, setPombos] = useState([])
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    if (!slug) { setErro('Perfil não encontrado'); setLoading(false); return }
    const load = async () => {
      try {
        // Query directa sem auth — RLS permite leitura de perfis públicos
        const { data: p, error } = await supabase.from('perfis').select('*').eq('slug', slug).eq('perfil_publico', true).single()
        if (error || !p) { setErro('Perfil não encontrado'); return }
        setPerfil(p)
        const [{ data: pb }, { data: ps }] = await Promise.all([
          supabase.from('pigeons').select('*').eq('user_id', p.user_id).eq('estado', 'ativo').order('percentil', { ascending: false }).limit(10),
          supabase.from('posts').select('*').eq('user_id', p.user_id).order('created_at', { ascending: false }).limit(5),
        ])
        setPombos(pb || []); setPosts(ps || [])
      } catch(e) { setErro('Perfil não encontrado') }
      finally { setLoading(false) }
    }
    load()
  }, [slug])

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#050D1A', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <Spinner lg />
    </div>
  )

  const standalone = !params?.interno  // acedido via URL directa

  const conteudo = () => {
    if (erro) return (
      <div style={{ textAlign:'center', padding:60 }}>
        <div style={{ fontSize:48, marginBottom:12 }}>🕊️</div>
        <div style={{ fontSize:16, color:'#fff', fontWeight:600 }}>Perfil não encontrado</div>
        <div style={{ fontSize:12, color:'#7A8699', marginTop:8 }}>O columbófilo pode ter desactivado o perfil público.</div>
        <a href="/" style={{ display:'inline-block', marginTop:16 }} className="btn btn-secondary">← ChampionsLoft</a>
      </div>
    )

    const top5 = [...pombos].sort((a,b)=>(b.percentil||0)-(a.percentil||0)).slice(0,5)
    const percentilMedio = pombos.filter(p=>p.percentil>0).reduce((s,p)=>s+(p.percentil||0),0) / Math.max(1,pombos.filter(p=>p.percentil>0).length)

    return (
      <div style={{ maxWidth:520, margin:'0 auto', padding:'0 0 40px' }}>
        {/* Capa premium */}
        <div style={{ background:'linear-gradient(135deg,#050D1A,#0B1830)', border:'1px solid rgba(212,175,55,.2)', borderRadius:14, padding:0, marginBottom:14, overflow:'hidden' }}>
          <div style={{ height:4, background:'linear-gradient(90deg,#B8960C,#D4AF37,#B8960C)' }} />
          <div style={{ padding:'20px 18px' }}>
            <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
              <div style={{ width:64, height:64, borderRadius:'50%', background:'linear-gradient(135deg,#1E5FD9,#4C8DFF)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, fontWeight:900, color:'#fff', overflow:'hidden', border:'3px solid rgba(212,175,55,.4)', flexShrink:0 }}>
                {perfil.foto_perfil_url ? <img src={perfil.foto_perfil_url} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : perfil.nome?.[0]?.toUpperCase()||'?'}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:20, fontWeight:900, color:'#fff', fontFamily:"'Fraunces',serif" }}>
                  {perfil.nome}
                  {perfil.verificado && (
                    <span title={`Conta verificada — ${perfil.tipo_verificado||'oficial'}`}
                      style={{ marginLeft:6, fontSize:14, color:'#2DD4A7' }}>✅</span>
                  )}
                </div>
                {perfil.org && <div style={{ fontSize:12, color:'#D4AF37', marginTop:2 }}>{perfil.org}</div>}
                {perfil.pombal_nome && <div style={{ fontSize:11, color:'#94a3b8', marginTop:1 }}>🏠 {perfil.pombal_nome}{perfil.pombal_morada?` · ${perfil.pombal_morada}`:''}</div>}
                {perfil.fed && <div style={{ fontSize:11, color:'#475569' }}>{perfil.fed}</div>}
                {perfil.bio && <div style={{ fontSize:12, color:'#94a3b8', marginTop:8, fontStyle:'italic' }}>"{perfil.bio}"</div>}
              </div>
              <BotaoQR titulo={perfil.nome} conteudo={`${window.location.origin}/p/${slug}`} subtitulo={`championsloft.app/p/${slug}`} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginTop:14 }}>
              {[[pombos.length,'🐦','Pombos'],[pombos.reduce((s,p)=>s+(p.provas||0),0),'🏆','Provas'],[Math.round(percentilMedio)+'%','📊','Percentil médio']].map(([v,i,l])=>(
                <div key={l} style={{ textAlign:'center', padding:'8px 4px', background:'rgba(255,255,255,.04)', borderRadius:8 }}>
                  <div style={{ fontSize:16, fontWeight:700, color:'#fff' }}>{v}</div>
                  <div style={{ fontSize:9, color:'#7A8699' }}>{i} {l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top pombos */}
        {top5.length > 0 && (
          <div className="card card-p" style={{ marginBottom:12 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#fff', marginBottom:10 }}>🏆 Top Pombos</div>
            {top5.map((p,i) => (
              <div key={p.id} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                <div style={{ width:22, textAlign:'center', fontSize:i<3?16:11, color:i===0?'#D4AF37':i===1?'#cbd5e1':i===2?'#b45309':'#475569', fontWeight:700 }}>
                  {i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}
                </div>
                <div style={{ width:36, height:36, borderRadius:8, background:'#101F40', overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>
                  {p.foto_url ? <img src={p.foto_url} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : p.emoji||'🐦'}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'#fff' }}>{p.nome}</div>
                  <div style={{ fontSize:10, color:'#7A8699' }}>
                    {p.anilha && <span style={{ fontFamily:"'Space Mono',monospace", color:'#2DD4A7' }}>{p.anilha} · </span>}
                    {(p.esp||[]).map(e=>ESP_ICON[e]||'').join(' ')} · {p.provas||0} provas
                  </div>
                </div>
                <div style={{ fontSize:14, fontWeight:700, color:p.percentil>=75?'#2DD4A7':p.percentil>=50?'#D4AF37':'#94a3b8' }}>{p.percentil||0}%</div>
              </div>
            ))}
          </div>
        )}

        {/* Posts */}
        {posts.length > 0 && (
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'#fff', marginBottom:10 }}>📰 Publicações</div>
            {posts.map(post => (
              <div key={post.id} className="card card-p" style={{ marginBottom:8 }}>
                <div style={{ fontSize:10, color:'#475569', marginBottom:6 }}>
                  {new Date(post.created_at).toLocaleDateString('pt-PT')}
                  <span style={{ marginLeft:8, color:'#4C8DFF' }}>{post.tipo}</span>
                </div>
                <div style={{ fontSize:13, color:'#cbd5e1', lineHeight:1.6 }}>{post.conteudo}</div>
                <div style={{ fontSize:11, color:'#475569', marginTop:6 }}>❤️ {post.likes_count||0} · 💬 {post.comments_count||0}</div>
              </div>
            ))}
          </div>
        )}

        {pombos.length===0 && posts.length===0 && !erro && (
          <EmptyState icon="🕊️" title="Sem conteúdo público" desc="Este columbófilo ainda não partilhou conteúdo." />
        )}

        <div style={{ marginTop:24, textAlign:'center', padding:'16px', background:'rgba(212,175,55,.06)', border:'1px solid rgba(212,175,55,.15)', borderRadius:12 }}>
          <div style={{ fontSize:12, color:'#D4AF37', fontWeight:700, marginBottom:4 }}>🕊️ ChampionsLoft</div>
          <div style={{ fontSize:11, color:'#7A8699', marginBottom:10 }}>Plataforma premium de gestão columbófila</div>
          <a href="/" style={{ display:'inline-block' }} className="btn btn-primary">Criar conta grátis</a>
        </div>
      </div>
    )
  }

  if (standalone) return (
    <div style={{ minHeight:'100vh', background:'#050D1A', color:'#fff' }}>
      {/* Mini header */}
      <div style={{ background:'#0B1830', borderBottom:'1px solid rgba(212,175,55,.15)', padding:'10px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <a href="/" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:8 }}>
          <img src="/logo.png" style={{ height:28, objectFit:'contain' }} onError={e=>e.target.style.display='none'} />
          <span style={{ fontSize:13, fontWeight:900, color:'#D4AF37', fontFamily:"'Fraunces',serif" }}>ChampionsLoft</span>
        </a>
        <a href="/" className="btn btn-secondary btn-sm" style={{ textDecoration:'none', fontSize:11 }}>Entrar / Registar</a>
      </div>
      <div style={{ padding:'16px' }}>
        {conteudo()}
      </div>
    </div>
  )

  return conteudo()
}
