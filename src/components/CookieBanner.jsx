import { useState, useEffect } from 'react'

const COOKIE_KEY = 'fly2win_cookies_aceites'

export default function CookieBanner() {
  const [visivel, setVisivel] = useState(false)
  const [detalhe, setDetalhe] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(COOKIE_KEY)) setVisivel(true)
  }, [])

  const aceitar = () => {
    localStorage.setItem(COOKIE_KEY, JSON.stringify({ essenciais:true, analytics:true, marketing:false, data: new Date().toISOString() }))
    setVisivel(false)
  }

  const apenasEssenciais = () => {
    localStorage.setItem(COOKIE_KEY, JSON.stringify({ essenciais:true, analytics:false, marketing:false, data: new Date().toISOString() }))
    setVisivel(false)
  }

  if (!visivel) return null

  return (
    <div style={{
      position:'fixed', bottom:0, left:0, right:0, zIndex:9999,
      background:'linear-gradient(135deg,#050D1A,#0B1830)',
      borderTop:'1px solid rgba(212,175,55,.25)',
      boxShadow:'0 -8px 32px rgba(0,0,0,.6)',
      fontFamily:"'Inter',system-ui,sans-serif",
    }}>
      {/* Barra dourada no topo */}
      <div style={{height:2, background:'linear-gradient(90deg,#B8960C,#D4AF37,#B8960C)'}}/>

      <div style={{padding:'16px', maxWidth:720, margin:'0 auto'}}>
        {!detalhe ? (
          <>
            <div style={{display:'flex', gap:12, alignItems:'flex-start', marginBottom:12}}>
              <span style={{fontSize:22, flexShrink:0}}>🍪</span>
              <div>
                <div style={{fontSize:13, fontWeight:700, color:'#fff', marginBottom:4}}>
                  A Fly2Win utiliza cookies
                </div>
                <div style={{fontSize:11, color:'#94a3b8', lineHeight:1.6}}>
                  Usamos cookies essenciais para o funcionamento da plataforma e cookies de análise para melhorar a experiência.
                  Podes aceitar todos ou apenas os essenciais.{' '}
                  <button onClick={()=>setDetalhe(true)}
                    style={{background:'none',border:'none',color:'#D4AF37',cursor:'pointer',fontSize:11,padding:0,textDecoration:'underline',fontFamily:'inherit'}}>
                    Ver detalhes
                  </button>
                </div>
              </div>
            </div>
            <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
              <button onClick={aceitar}
                style={{flex:1,minWidth:140,padding:'10px 16px',background:'linear-gradient(135deg,#D4AF37,#B8960C)',border:'none',borderRadius:8,color:'#050D1A',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                ✓ Aceitar todos
              </button>
              <button onClick={apenasEssenciais}
                style={{flex:1,minWidth:140,padding:'10px 16px',background:'rgba(255,255,255,.06)',border:'1px solid #1B2D52',borderRadius:8,color:'#94a3b8',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
                Apenas essenciais
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{fontSize:13, fontWeight:700, color:'#fff', marginBottom:12}}>
              🍪 Detalhes sobre cookies
            </div>
            {[
              { nome:'Essenciais', desc:'Necessários para autenticação, sessão e funcionamento básico da plataforma. Não podem ser desactivados.', obrig:true, cor:'#2DD4A7' },
              { nome:'Análise', desc:'Ajudam-nos a perceber como a plataforma é utilizada para melhorar a experiência. Não identificam pessoalmente.', obrig:false, cor:'#4C8DFF' },
              { nome:'Marketing', desc:'Utilizados para publicidade personalizada. Actualmente não utilizamos cookies de marketing.', obrig:false, cor:'#D4AF37', disabled:true },
            ].map(c=>(
              <div key={c.nome} style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,.06)'}}>
                <div style={{flex:1,marginRight:12}}>
                  <div style={{fontSize:12,fontWeight:700,color:c.cor,marginBottom:2}}>{c.nome}</div>
                  <div style={{fontSize:10,color:'#94a3b8',lineHeight:1.5}}>{c.desc}</div>
                </div>
                <div style={{fontSize:10,padding:'3px 8px',borderRadius:10,background:c.obrig?'rgba(45,212,167,.15)':'rgba(255,255,255,.06)',color:c.obrig?'#2DD4A7':'#475569',fontWeight:600,flexShrink:0,marginTop:2}}>
                  {c.obrig?'Sempre activo':c.disabled?'Não usado':'Opcional'}
                </div>
              </div>
            ))}
            <div style={{fontSize:10,color:'#475569',marginTop:10,marginBottom:12}}>
              Para mais informações consulta a nossa{' '}
              <a href="/privacidade" style={{color:'#D4AF37'}}>Política de Privacidade</a>.
              Os dados são tratados de acordo com o RGPD (Regulamento UE 2016/679).
            </div>
            <div style={{display:'flex', gap:8}}>
              <button onClick={aceitar}
                style={{flex:1,padding:'10px',background:'linear-gradient(135deg,#D4AF37,#B8960C)',border:'none',borderRadius:8,color:'#050D1A',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                ✓ Aceitar todos
              </button>
              <button onClick={apenasEssenciais}
                style={{flex:1,padding:'10px',background:'rgba(255,255,255,.06)',border:'1px solid #1B2D52',borderRadius:8,color:'#94a3b8',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
                Apenas essenciais
              </button>
              <button onClick={()=>setDetalhe(false)}
                style={{padding:'10px 14px',background:'none',border:'1px solid #1B2D52',borderRadius:8,color:'#475569',fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>
                ← Voltar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
