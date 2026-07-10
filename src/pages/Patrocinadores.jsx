import { useState, useEffect } from 'react'
import { useToast, Modal, Field, Spinner } from '../components/ui'
import { useAuth } from '../hooks/useAuth'

// ── dados ─────────────────────────────────────────────────────────────────────
const CATEGORIAS = [
  { id:'todos',        icon:'🌐', label:'Todos' },
  { id:'racao',        icon:'🌾', label:'Rações' },
  { id:'saude',        icon:'💊', label:'Saúde' },
  { id:'equipamento',  icon:'🔧', label:'Equipamento' },
  { id:'genetica',     icon:'🧬', label:'Genética' },
  { id:'servicos',     icon:'🛠️', label:'Serviços' },
]

const CAT_ICON = { racao:'🌾', saude:'💊', equipamento:'🔧', genetica:'🧬', servicos:'🛠️' }
const CAT_COR  = { racao:'#F59E0B', saude:'#10B981', equipamento:'#3B82F6', genetica:'#8B5CF6', servicos:'#EC4899' }

const PARCEIROS = [
  {
    id:1, nome:'Versele-Laga', tipo:'marca', cat:'racao', logo:'🌾',
    desc:'Líder mundial em alimentação para pombos-correio. Produtos desenvolvidos com os melhores criadores belgas.',
    desconto:'10% com código CHAMPS24', codigo:'CHAMPS24',
    site:'https://www.versele-laga.com', verified:true, rating:4.8, n_avaliacoes:124,
    produtos:[
      { nome:'Racing Winner', preco:'18.90/5kg', tag:'Mais vendido', desc:'Mistura premium para competição. Rica em milho branco e cartamo.' },
      { nome:'Superstar Plus', preco:'22.50/5kg', tag:'Elite', desc:'Alta energia para velocidade. Fórmula com aminoácidos essenciais.' },
      { nome:'All-In-One Breeding', preco:'16.90/5kg', tag:'', desc:'Reprodução e jovens. Enriquecida com vitaminas A, D3 e E.' },
    ],
    destaque:true, tag:'Parceiro Oficial',
  },
  {
    id:2, nome:'DAC (Dac-Vogel)', tipo:'marca', cat:'saude', logo:'💊',
    desc:'Especialistas em saúde e suplementação para pombos-correio há mais de 40 anos.',
    desconto:'5% com código CL2024', codigo:'CL2024',
    site:'', verified:true, rating:4.6, n_avaliacoes:87,
    produtos:[
      { nome:'Elektrolyt', preco:'8.90/400g', tag:'Recomendado IA', desc:'Reposição de eletrólitos após provas longas. Recuperação acelerada.' },
      { nome:'Multi-Vitamin', preco:'11.50/300ml', tag:'', desc:'Complexo vitamínico completo. Vitaminas A, B, C, D, E e K.' },
      { nome:'Roni', preco:'9.90/100ml', tag:'', desc:'Tratamento contra tricomonose. Ronidazol de alta pureza.' },
    ],
    destaque:true, tag:'Recomendado IA',
  },
  {
    id:3, nome:'Röhnfried', tipo:'marca', cat:'saude', logo:'🔬',
    desc:'Biotecnologia alemã ao serviço da columbofilia. Soluções naturais e eficazes.',
    desconto:'', codigo:'',
    site:'', verified:true, rating:4.5, n_avaliacoes:63,
    produtos:[
      { nome:'Bt-Amin Forte', preco:'14.50/250ml', tag:'Recomendado IA', desc:'Aminoácidos para recuperação muscular. Ideal 2 dias antes e após provas.' },
      { nome:'Iodine-Mineral', preco:'10.90/500g', tag:'', desc:'Suplemento mineral com iodo. Estimula o metabolismo e a muda de penas.' },
    ],
    destaque:false, tag:'',
  },
  {
    id:4, nome:'Electronic Timer Systems', tipo:'loja', cat:'equipamento', logo:'⏱️',
    desc:'Sistemas de cronometragem electrónica para columbofilia. Suporte técnico em Portugal.',
    desconto:'Instalação gratuita para sócios', codigo:'',
    site:'', verified:true, rating:4.7, n_avaliacoes:41,
    produtos:[
      { nome:'Antena BENZING', preco:'189.00', tag:'Premium', desc:'Antena de chegada compatível com chips BENZING. Leitura ultra-rápida.' },
      { nome:'Kit Iniciante', preco:'89.00', tag:'', desc:'Antena + 10 chips + software básico. Ideal para começar.' },
    ],
    destaque:false, tag:'',
  },
  {
    id:5, nome:'PomboShop PT', tipo:'loja', cat:'equipamento', logo:'🏪',
    desc:'Loja online especializada em columbofilia com entrega em todo Portugal em 48h.',
    desconto:'Frete grátis acima de 50€', codigo:'',
    site:'', verified:false, rating:4.2, n_avaliacoes:29,
    produtos:[
      { nome:'Comedouro Auto 12L', preco:'34.90', tag:'', desc:'Saída regulável, fácil de limpar, aço inox.' },
      { nome:'Bebedouro Nipple 5L', preco:'18.90', tag:'', desc:'Sistema nipple anti-desperdício. Água sempre limpa.' },
      { nome:'Cesto de Transporte', preco:'24.90', tag:'', desc:'Homologado pela FCP. Ventilação óptima, fácil higienização.' },
    ],
    destaque:false, tag:'',
  },
  {
    id:6, nome:'Base Genética Belga', tipo:'servico', cat:'genetica', logo:'🧬',
    desc:'Acesso à maior base de dados de pedigrees de criadores belgas e holandeses. Pesquisa por linhagem.',
    desconto:'1 mês grátis com código CL', codigo:'CL',
    site:'', verified:false, rating:4.0, n_avaliacoes:18,
    produtos:[
      { nome:'Acesso Anual', preco:'29.00/ano', tag:'', desc:'Pedigrees ilimitados, actualizações semanais.' },
      { nome:'Consulta Avulso', preco:'2.90/pesquisa', tag:'', desc:'Pesquisa individual sem subscrição.' },
    ],
    destaque:false, tag:'',
  },
]

const PROMOS = [
  { id:1, parceiro:'Versele-Laga', titulo:'Flash Sale — 20% em Racing', validade:'Até domingo', cor:'#F59E0B', icon:'⚡' },
  { id:2, parceiro:'DAC',          titulo:'Kit Pré-Época: Elektrolyt + Multi-Vitamin', validade:'Stock limitado', cor:'#10B981', icon:'🎁' },
]

// ── sub-componentes ───────────────────────────────────────────────────────────
function Estrelas({ rating, n }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:4}}>
      <div style={{display:'flex',gap:1}}>
        {[1,2,3,4,5].map(i=>(
          <span key={i} style={{fontSize:10,color:i<=Math.round(rating)?'#F59E0B':'#334155'}}>★</span>
        ))}
      </div>
      <span style={{fontSize:10,color:'#7A8699'}}>{rating} ({n})</span>
    </div>
  )
}

function CardParceiro({ p, onVer }) {
  const cor = CAT_COR[p.cat]||'#4C8DFF'
  return (
    <div className="card" style={{overflow:'hidden',marginBottom:0,cursor:'pointer'}} onClick={()=>onVer(p)}>
      <div style={{height:2,background:cor}}/>
      <div style={{padding:'12px 14px'}}>
        <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
          <div style={{width:52,height:52,borderRadius:12,background:`${cor}18`,border:`1px solid ${cor}33`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,flexShrink:0}}>
            {p.logo}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap',marginBottom:3}}>
              <span style={{fontSize:14,fontWeight:700,color:'#fff'}}>{p.nome}</span>
              {p.verified&&<span style={{fontSize:9,color:'#2DD4A7',background:'rgba(45,212,167,.1)',padding:'1px 5px',borderRadius:6,fontWeight:700}}>✓ Verificado</span>}
              {p.tag&&<span style={{fontSize:9,fontWeight:700,padding:'1px 7px',borderRadius:10,background:p.tag==='Parceiro Oficial'?'rgba(212,175,55,.15)':p.tag==='Recomendado IA'?'rgba(45,212,167,.15)':'rgba(76,141,255,.15)',color:p.tag==='Parceiro Oficial'?'#D4AF37':p.tag==='Recomendado IA'?'#2DD4A7':'#4C8DFF'}}>{p.tag}</span>}
            </div>
            <div style={{fontSize:11,color:'#7A8699',marginBottom:4}}>{p.desc.slice(0,80)}{p.desc.length>80?'…':''}</div>
            <Estrelas rating={p.rating} n={p.n_avaliacoes}/>
          </div>
        </div>
        {p.desconto&&(
          <div style={{marginTop:10,display:'flex',gap:8,alignItems:'center',padding:'7px 10px',background:'rgba(45,212,167,.07)',border:'1px solid rgba(45,212,167,.2)',borderRadius:8}}>
            <span style={{fontSize:14}}>🎁</span>
            <div style={{flex:1}}>
              <div style={{fontSize:11,color:'#2DD4A7',fontWeight:600}}>{p.desconto}</div>
              {p.codigo&&<div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:'#D4AF37'}}>Código: {p.codigo}</div>}
            </div>
          </div>
        )}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:10}}>
          <span style={{fontSize:10,color:cor,background:`${cor}12`,padding:'2px 8px',borderRadius:8}}>{CAT_ICON[p.cat]} {CATEGORIAS.find(c=>c.id===p.cat)?.label}</span>
          <span style={{fontSize:12,color:'#4C8DFF'}}>Ver produtos →</span>
        </div>
      </div>
    </div>
  )
}

function DetalhesParceiro({ p, onVoltar, toast }) {
  const cor = CAT_COR[p.cat]||'#4C8DFF'
  const copiarCodigo = () => {
    navigator.clipboard?.writeText(p.codigo)
    toast('Código copiado!','ok')
  }
  return (
    <div>
      <button className="btn btn-secondary btn-sm" onClick={onVoltar} style={{marginBottom:12}}>← Voltar</button>
      {/* Header parceiro */}
      <div style={{background:'#0B1830',border:`1px solid ${cor}30`,borderRadius:14,padding:'16px',marginBottom:14,position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:cor}}/>
        <div style={{display:'flex',gap:14,alignItems:'center',marginBottom:12}}>
          <div style={{width:64,height:64,borderRadius:14,background:`${cor}18`,border:`1px solid ${cor}33`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:32,flexShrink:0}}>{p.logo}</div>
          <div style={{flex:1}}>
            <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',marginBottom:4}}>
              <div style={{fontSize:18,fontWeight:900,color:'#fff',fontFamily:"'Fraunces',serif"}}>{p.nome}</div>
              {p.verified&&<span style={{fontSize:10,color:'#2DD4A7',background:'rgba(45,212,167,.1)',padding:'2px 8px',borderRadius:8,fontWeight:700}}>✓ Verificado</span>}
            </div>
            <Estrelas rating={p.rating} n={p.n_avaliacoes}/>
            <div style={{fontSize:11,color:'#7A8699',marginTop:4}}>{p.desc}</div>
          </div>
        </div>
        {/* Desconto destaque */}
        {p.desconto&&(
          <div style={{background:`${cor}10`,border:`1px solid ${cor}30`,borderRadius:10,padding:'12px 14px'}}>
            <div style={{fontSize:12,fontWeight:700,color:cor,marginBottom:4}}>🎁 Desconto exclusivo Fly2Win</div>
            <div style={{fontSize:13,color:'#fff',marginBottom:8}}>{p.desconto}</div>
            {p.codigo&&(
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <div style={{flex:1,fontFamily:"'Space Mono',monospace",fontSize:16,fontWeight:900,color:'#D4AF37',background:'rgba(212,175,55,.08)',border:'1px dashed rgba(212,175,55,.3)',borderRadius:8,padding:'8px 12px',textAlign:'center',letterSpacing:2}}>
                  {p.codigo}
                </div>
                <button onClick={copiarCodigo} className="btn btn-primary" style={{flexShrink:0}}>📋 Copiar</button>
              </div>
            )}
          </div>
        )}
        {p.site&&<a href={p.site} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{display:'block',textAlign:'center',marginTop:10,fontSize:12}}>🌐 Visitar site oficial</a>}
      </div>

      {/* Produtos */}
      <div style={{fontSize:13,fontWeight:700,color:'#fff',marginBottom:10}}>Produtos disponíveis</div>
      <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:14}}>
        {p.produtos.map((prod,i)=>(
          <div key={i} style={{background:'#0B1830',border:'1px solid #1B2D52',borderRadius:12,padding:'12px 14px'}}>
            <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
              <div style={{width:40,height:40,borderRadius:8,background:`${cor}15`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{p.logo}</div>
              <div style={{flex:1}}>
                <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap',marginBottom:3}}>
                  <span style={{fontSize:13,fontWeight:600,color:'#fff'}}>{prod.nome}</span>
                  {prod.tag&&<span style={{fontSize:9,fontWeight:700,padding:'1px 6px',borderRadius:8,background:prod.tag==='Recomendado IA'?'rgba(45,212,167,.15)':prod.tag==='Premium'||prod.tag==='Elite'?'rgba(212,175,55,.15)':'rgba(76,141,255,.15)',color:prod.tag==='Recomendado IA'?'#2DD4A7':prod.tag==='Premium'||prod.tag==='Elite'?'#D4AF37':'#4C8DFF'}}>{prod.tag}</span>}
                </div>
                <div style={{fontSize:11,color:'#7A8699',marginBottom:6}}>{prod.desc}</div>
                <div style={{fontFamily:"'Fraunces',serif",fontSize:16,fontWeight:900,color:'#2DD4A7'}}>{prod.preco}€</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Avaliar */}
      <div style={{background:'#0B1830',border:'1px solid #1B2D52',borderRadius:12,padding:'12px 14px'}}>
        <div style={{fontSize:12,fontWeight:600,color:'#fff',marginBottom:8}}>⭐ Avaliar este parceiro</div>
        <div style={{display:'flex',gap:8,marginBottom:8}}>
          {[1,2,3,4,5].map(i=>(
            <button key={i} style={{fontSize:24,background:'none',border:'none',cursor:'pointer',padding:2}}>☆</button>
          ))}
        </div>
        <textarea className="input" rows={2} style={{resize:'none',fontSize:12}} placeholder="Partilha a tua experiência com este parceiro..."/>
        <button className="btn btn-primary btn-sm" style={{marginTop:8}}>Enviar avaliação</button>
      </div>
    </div>
  )
}

// ── componente principal ──────────────────────────────────────────────────────
export default function Patrocinadores({ nav }) {
  const toast = useToast()
  const { user } = useAuth()
  const [cat, setCat]           = useState('todos')
  const [parceiroVer, setParceiroVer] = useState(null)
  const [modalSugerir, setModalSugerir] = useState(false)
  const [modalCotacao, setModalCotacao] = useState(null)
  const [form, setForm]         = useState({ nome:'', cat:'racao', desc:'', site:'', contacto:'' })
  const [formCot, setFormCot]   = useState({ quantidade:'', mensagem:'' })
  const [saving, setSaving]     = useState(false)
  const [tab, setTab]           = useState('parceiros')
  const sf  = (k,v) => setForm(f=>({...f,[k]:v}))
  const sfc = (k,v) => setFormCot(f=>({...f,[k]:v}))

  if (parceiroVer) return <DetalhesParceiro p={parceiroVer} onVoltar={()=>setParceiroVer(null)} toast={toast}/>

  const filtrados = cat==='todos' ? PARCEIROS : PARCEIROS.filter(p=>p.cat===cat)
  const destaques = filtrados.filter(p=>p.destaque||p.tag==='Recomendado IA')
  const resto     = filtrados.filter(p=>!p.destaque&&p.tag!=='Recomendado IA')

  return (
    <div>
      {/* Header */}
      <div style={{background:'linear-gradient(135deg,#050D1A,#0B1830)',border:'1px solid rgba(212,175,55,.2)',borderRadius:14,padding:'14px 16px',marginBottom:14,position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:'linear-gradient(90deg,#F59E0B,#10B981,#3B82F6)'}}/>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div>
            <div style={{fontSize:18,fontWeight:900,color:'#fff',fontFamily:"'Fraunces',serif"}}>🛍️ Parceiros</div>
            <div style={{fontSize:11,color:'#7A8699',marginTop:2}}>Produtos e serviços exclusivos para utilizadores Fly2Win</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={()=>setModalSugerir(true)}>+ Sugerir parceiro</button>
        </div>
        {/* stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginTop:12}}>
          {[
            [PARCEIROS.length,'🏪','Parceiros','#D4AF37'],
            [PARCEIROS.filter(p=>p.desconto).length,'🎁','Com desconto','#2DD4A7'],
            [PARCEIROS.filter(p=>p.verified).length,'✓','Verificados','#4C8DFF'],
          ].map(([v,i,l,c])=>(
            <div key={l} style={{textAlign:'center',padding:'6px 4px',background:'rgba(255,255,255,.04)',borderRadius:8}}>
              <div style={{fontFamily:"'Fraunces',serif",fontSize:18,fontWeight:900,color:c}}>{v}</div>
              <div style={{fontSize:9,color:'#475569'}}>{i} {l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Promoções flash */}
      {PROMOS.length>0&&tab==='parceiros'&&(
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:700,color:'#f87171',marginBottom:8,display:'flex',alignItems:'center',gap:6}}>
            <span style={{animation:'pulse 1s infinite'}}>🔴</span> PROMOÇÕES ACTIVAS
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {PROMOS.map(pr=>(
              <div key={pr.id} style={{display:'flex',gap:10,alignItems:'center',padding:'10px 12px',background:`${pr.cor}0d`,border:`1px solid ${pr.cor}30`,borderRadius:10}}>
                <span style={{fontSize:22,flexShrink:0}}>{pr.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,color:pr.cor,fontWeight:700,marginBottom:2}}>{pr.parceiro}</div>
                  <div style={{fontSize:12,color:'#fff',fontWeight:600}}>{pr.titulo}</div>
                  <div style={{fontSize:10,color:'#7A8699'}}>⏰ {pr.validade}</div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={()=>setParceiroVer(PARCEIROS.find(p=>p.nome===pr.parceiro))}>Ver →</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{display:'flex',gap:3,background:'#0A1628',borderRadius:10,padding:3,marginBottom:14}}>
        {[['parceiros','🛍️ Parceiros'],['descontos','🎁 Descontos'],['ia','🤖 IA Recomenda']].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{flex:1,padding:'8px',borderRadius:8,fontSize:11,fontWeight:600,cursor:'pointer',border:'none',fontFamily:'inherit',background:tab===k?'linear-gradient(135deg,#1E5FD9,#1456C0)':'none',color:tab===k?'#fff':'#475569'}}>{l}</button>
        ))}
      </div>

      {/* Tab: Parceiros */}
      {tab==='parceiros'&&(
        <>
          {/* filtros categoria */}
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:14}}>
            {CATEGORIAS.map(c=>(
              <button key={c.id} onClick={()=>setCat(c.id)} style={{padding:'6px 12px',borderRadius:20,fontSize:11,fontWeight:500,cursor:'pointer',border:`1px solid ${cat===c.id?CAT_COR[c.id]||'#4C8DFF':'#1B2D52'}`,fontFamily:'inherit',background:cat===c.id?`${CAT_COR[c.id]||'#4C8DFF'}15`:'none',color:cat===c.id?CAT_COR[c.id]||'#4C8DFF':'#7A8699'}}>
                {c.icon} {c.label}
              </button>
            ))}
          </div>
          {destaques.length>0&&(
            <div style={{marginBottom:14}}>
              <div style={{fontSize:11,fontWeight:700,color:'#D4AF37',marginBottom:8,letterSpacing:.5}}>⭐ DESTAQUES</div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {destaques.map(p=><CardParceiro key={p.id} p={p} onVer={setParceiroVer}/>)}
              </div>
            </div>
          )}
          {resto.length>0&&(
            <div>
              {destaques.length>0&&<div style={{fontSize:11,fontWeight:700,color:'#7A8699',marginBottom:8,letterSpacing:.5}}>OUTROS PARCEIROS</div>}
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {resto.map(p=><CardParceiro key={p.id} p={p} onVer={setParceiroVer}/>)}
              </div>
            </div>
          )}
        </>
      )}

      {/* Tab: Descontos */}
      {tab==='descontos'&&(
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          <div style={{fontSize:12,color:'#94a3b8',marginBottom:8}}>Códigos de desconto exclusivos para utilizadores Fly2Win</div>
          {PARCEIROS.filter(p=>p.desconto).map(p=>{
            const cor=CAT_COR[p.cat]||'#4C8DFF'
            return (
              <div key={p.id} style={{background:'#0B1830',border:`1px solid ${cor}25`,borderRadius:12,padding:'14px 16px'}}>
                <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:10}}>
                  <span style={{fontSize:24}}>{p.logo}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:'#fff'}}>{p.nome}</div>
                    <div style={{fontSize:11,color:'#7A8699'}}>{p.desconto}</div>
                  </div>
                </div>
                {p.codigo&&(
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    <div style={{flex:1,fontFamily:"'Space Mono',monospace",fontSize:18,fontWeight:900,color:'#D4AF37',background:'rgba(212,175,55,.08)',border:'1px dashed rgba(212,175,55,.3)',borderRadius:8,padding:'8px 12px',textAlign:'center',letterSpacing:3}}>
                      {p.codigo}
                    </div>
                    <button onClick={()=>{navigator.clipboard?.writeText(p.codigo);toast('Código copiado!','ok')}} className="btn btn-primary" style={{flexShrink:0}}>📋 Copiar</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Tab: IA Recomenda */}
      {tab==='ia'&&(
        <div>
          <div style={{background:'linear-gradient(135deg,rgba(76,141,255,.12),rgba(45,212,167,.08))',border:'1px solid rgba(76,141,255,.2)',borderRadius:12,padding:'14px 16px',marginBottom:14,display:'flex',gap:12,alignItems:'flex-start'}}>
            <div style={{fontSize:28}}>🤖</div>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:'#fff',marginBottom:4}}>Recomendação IA para esta semana</div>
              <div style={{fontSize:12,color:'#94a3b8',lineHeight:1.6}}>Com base no perfil do teu pombal e na época em curso, a IA recomenda reforçar os eletrólitos e vitaminas B antes das provas de fundo. Consulta os produtos marcados abaixo.</div>
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {PARCEIROS.flatMap(p=>p.produtos.filter(pr=>pr.tag==='Recomendado IA').map(pr=>({...pr,parceiro:p.nome,logo:p.logo,parceiroCat:p.cat,parceiroId:p.id}))).map((pr,i)=>{
              const cor=CAT_COR[pr.parceiroCat]||'#4C8DFF'
              return (
                <div key={i} style={{background:'#0B1830',border:'1px solid rgba(45,212,167,.2)',borderRadius:12,padding:'12px 14px'}}>
                  <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
                    <div style={{width:44,height:44,borderRadius:10,background:'rgba(45,212,167,.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>{pr.logo}</div>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:3}}>
                        <span style={{fontSize:13,fontWeight:600,color:'#fff'}}>{pr.nome}</span>
                        <span style={{fontSize:9,color:'#2DD4A7',background:'rgba(45,212,167,.15)',padding:'1px 6px',borderRadius:8,fontWeight:700}}>🤖 IA</span>
                      </div>
                      <div style={{fontSize:10,color:'#7A8699',marginBottom:4}}>por {pr.parceiro}</div>
                      <div style={{fontSize:11,color:'#94a3b8',marginBottom:6}}>{pr.desc}</div>
                      <div style={{fontFamily:"'Fraunces',serif",fontSize:15,fontWeight:900,color:'#2DD4A7'}}>{pr.preco}€</div>
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={()=>setParceiroVer(PARCEIROS.find(p=>p.id===pr.parceiroId))}>Ver →</button>
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{marginTop:14,padding:'10px 14px',background:'rgba(212,175,55,.06)',border:'1px solid rgba(212,175,55,.15)',borderRadius:8,fontSize:11,color:'#7A8699'}}>
            💡 As recomendações da IA são baseadas na época do ano, provas próximas e histórico do teu efectivo. Não substituem aconselhamento veterinário.
          </div>
        </div>
      )}

      {/* Modal sugerir parceiro */}
      <Modal open={modalSugerir} onClose={()=>setModalSugerir(false)} title="+ Sugerir Parceiro"
        footer={<><button className="btn btn-secondary" onClick={()=>setModalSugerir(false)}>Cancelar</button><button className="btn btn-primary" onClick={()=>{toast('Sugestão enviada! Analisaremos em breve.','ok');setModalSugerir(false)}}>Enviar Sugestão</button></>}>
        <div style={{fontSize:12,color:'#94a3b8',marginBottom:14,lineHeight:1.6}}>
          Conheces uma loja ou marca que deveria estar aqui? Sugere e a equipa Fly2Win irá analisar e contactar o parceiro.
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <Field label="Nome da loja/marca *"><input className="input" value={form.nome} onChange={e=>sf('nome',e.target.value)} placeholder="Ex: Colombo Shop"/></Field>
          <Field label="Categoria">
            <select className="input" value={form.cat} onChange={e=>sf('cat',e.target.value)}>
              {CATEGORIAS.slice(1).map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
            </select>
          </Field>
          <Field label="Descrição / porquê recomendar"><textarea className="input" rows={3} style={{resize:'none'}} value={form.desc} onChange={e=>sf('desc',e.target.value)} placeholder="Descreve o que vendem e porque seria útil para a comunidade..."/></Field>
          <div className="form-grid">
            <Field label="Site"><input className="input" placeholder="https://..." value={form.site} onChange={e=>sf('site',e.target.value)}/></Field>
            <Field label="Contacto (opcional)"><input className="input" placeholder="email ou telefone" value={form.contacto} onChange={e=>sf('contacto',e.target.value)}/></Field>
          </div>
        </div>
      </Modal>
    </div>
  )
}
