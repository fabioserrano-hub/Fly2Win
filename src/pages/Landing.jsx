import { useState, useEffect, useRef } from 'react'

// ─── TOKENS ───────────────────────────────────────────────────
const T = {
  void:   '#020509',
  depth:  '#060F1A',
  ocean:  '#0A1A2E',
  steel:  '#112036',
  gold:   '#C8A84B',
  goldL:  '#E5C96A',
  goldXL: '#F5DFA0',
  goldD:  '#7A6020',
  white:  '#F0EDE8',
  fog:    '#8899AA',
  ghost:  '#445566',
  teal:   '#1A9E82',
  tealL:  '#2DD4A7',
  serif:  "'Fraunces', 'Georgia', serif",
  mono:   "'Space Mono', 'Courier New', monospace",
  sans:   "'Inter', system-ui, sans-serif",
}

// ─── DADOS ────────────────────────────────────────────────────
const HISTORIAS = [
  { num:'01', titulo:'O regresso', icon:'🕊️',
    corpo:'São 6 da manhã. O céu ainda está escuro. Olhas para o horizonte e o coração acelera — há um ponto pequenino que se aproxima. 800 quilómetros. 14 horas de voo. E agora está ali, a entrar pela portinhola.',
    impacto:'Com o ChampionsLoft, registas o tempo de chegada, calculas o percentil em segundos e o resultado fica no historial permanente do pombo para sempre.' },
  { num:'02', titulo:'A ninhada certa', icon:'🧬',
    corpo:'Décadas de conhecimento passam de pai para filho — qual o macho a usar, que fêmea combina, que linhagens se complementam. Essa sabedoria estava só na cabeça. Ou no caderno amarelado da gaveta.',
    impacto:'A IA analisa 3 gerações de consanguinidade, compara percentis de prova e sugere os cruzamentos com maior probabilidade de produzir um campeão.' },
  { num:'03', titulo:'O pedigree que conta a história', icon:'🌳',
    corpo:'Quando vendes um pombo de topo, não vendes apenas o animal. Vendes a sua história — quem foram os pais, os avós, os bisavós. Esse documento é o passaporte do teu trabalho como criador.',
    impacto:'Um PDF premium com 4 gerações, foto, conquistas, linhagem e o teu nome como criador. Pronto a enviar em segundos.' },
  { num:'04', titulo:'A época que não se esquece', icon:'📊',
    corpo:'No final de cada época, tens na cabeça os momentos altos. Mas os números — percentis, distâncias, pombos que surpreenderam — esses perdem-se. O ano que vem começas do zero.',
    impacto:'Relatório completo da época em PDF: ranking do efectivo, análise por especialidade, comparativo com anos anteriores e recomendações da IA para a época seguinte.' },
]

const NUMEROS = [
  { val:'800', sufixo:'km',   label:'A distância que um pombo percorre num dia' },
  { val:'40',  sufixo:'+',    label:'Anos de tradição que a app preserva digitalmente' },
  { val:'3',   sufixo:'ger.', label:'Gerações analisadas pelo Seleccionador IA' },
  { val:'30',  sufixo:'dias', label:'Para experimentares tudo, sem compromisso' },
]

const MODULOS = [
  { icon:'🐦', nome:'Efectivo',      cor:T.tealL,  desc:'Cada pombo, um processo completo. Anilha, origem, saúde, especialidade e foto.' },
  { icon:'🏆', nome:'Provas',        cor:T.goldL,  desc:'Resultados e percentis calculados automaticamente. Historial por época.' },
  { icon:'🥚', nome:'Reprodução',    cor:'#C084FC', desc:'Cacifos, posturas, alertas de eclosão. Zero esquecimentos.' },
  { icon:'🌳', nome:'Pedigree PDF',  cor:T.gold,   desc:'Árvore com 4 gerações em PDF premium. O teu cartão de visita como criador.' },
  { icon:'🧬', nome:'Casais IA',     cor:T.tealL,  desc:'Inteligência artificial sugere cruzamentos. Só no plano Elite.' },
  { icon:'📊', nome:'Analíticas',    cor:'#4C8DFF', desc:'Heatmap de distâncias, tendências e comparação com médias nacionais.' },
  { icon:'🔨', nome:'Leilões',       cor:T.goldL,  desc:'Leiloa pombos e descendentes. Marketplace integrado com certificado QR.' },
  { icon:'🌐', nome:'LoftSocial',    cor:T.tealL,  desc:'Rede social columbófila. Feed, grupos, ranking e desafios semanais.' },
]

const PLANOS = [
  { id:'base',  nome:'Base',     preco:9.99,  anual:99.90,  dia:'0,33', cor:T.tealL,
    desc:'Para o criador que quer organizar o pombal',
    feats:['Pombos ilimitados','Provas & percentis','Reprodução & saúde','Pedigree PDF básico','Calendário FPC','Dashboard Pombal Hoje'] },
  { id:'pro',   nome:'Pro',      preco:11.99, anual:119.90, dia:'0,40', cor:T.tealL, destaque:true,
    desc:'Para o criador que quer ir mais longe',
    feats:['Tudo do Base','LoftSocial & Comunidade','Marketplace & Leilões','Mensagens directas','Rastreio de forma','Analíticas avançadas'] },
  { id:'elite', nome:'Elite AI', preco:15.99, anual:159.90, dia:'0,53', cor:T.gold, gold:true,
    desc:'Para o criador que quer o melhor',
    feats:['Tudo do Pro','Seleccionador de Casais IA','Relatório de Época PDF','Gestão de Clubes','Analíticas nacionais','Suporte prioritário'] },
]

const TESTEMUNHOS = [
  { nome:'Manuel Rodrigues', local:'Braga', texto:'Finalmente consigo perceber quais os pombos que realmente valem a pena. O percentil automático mudou a forma como treino o efectivo.', estrelas:5 },
  { nome:'António Silva',    local:'Porto', texto:'O Seleccionador IA já me sugeriu 3 cruzamentos que nunca teria feito sozinho. Na segunda época, dois deles ficaram top 10 na regional.', estrelas:5 },
  { nome:'João Ferreira',    local:'Lisboa', texto:'Os leilões de descendentes são uma revolução. Vendi uma ninhada antes de nascer por 400€. Isto não existia em nenhuma plataforma.', estrelas:5 },
]

const FAQ = [
  { q:'Preciso de instalar alguma coisa?', r:'Não. O ChampionsLoft funciona directamente no browser — computador, tablet ou telemóvel. Há também uma versão PWA que podes instalar como app no telemóvel.' },
  { q:'Os meus dados estão seguros?', r:'Sim. Os dados são armazenados em servidores europeus (Supabase), com encriptação em trânsito e em repouso. Nunca partilhamos dados com terceiros. Podes exportar ou apagar tudo a qualquer momento.' },
  { q:'Posso experimentar sem cartão de crédito?', r:'Sim. Os primeiros 30 dias são completamente gratuitos, sem cartão de crédito. Só pagas se quiseres continuar após o período de teste.' },
  { q:'A app funciona para coletividades?', r:'Sim. Temos planos de grupo com descontos até 30% para 3 ou mais membros. O presidente pode gerir todos os sócios numa só conta.' },
  { q:'O que é o plano Fundadores?', r:'Os primeiros 100 utilizadores têm acesso vitalício ao EliteAI por 13,99€/mês — permanentemente, mesmo quando os preços subirem. Há apenas 100 lugares.' },
  { q:'Posso cancelar quando quiser?', r:'Sim, sem penalizações. Cancelas nas definições e a subscrição termina no fim do período pago.' },
]

// ─── UTILS ────────────────────────────────────────────────────
function useInView() {
  const [inView, setInView] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting){setInView(true);obs.disconnect()} },{threshold:0.15})
    if(ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  },[])
  return [ref, inView]
}

function Reveal({ children, delay=0, style={} }) {
  const [ref, inView] = useInView()
  return (
    <div ref={ref} style={{ opacity:inView?1:0, transform:inView?'none':'translateY(20px)', transition:`opacity .7s ease ${delay}ms, transform .7s ease ${delay}ms`, ...style }}>
      {children}
    </div>
  )
}

function Anilha({ codigo, delay=0, rotate=0 }) {
  const [v, setV] = useState(false)
  useEffect(()=>{ const t=setTimeout(()=>setV(true),delay); return()=>clearTimeout(t) },[delay])
  return (
    <div style={{ fontFamily:T.mono, fontSize:10, fontWeight:700, color:T.gold, background:T.steel, border:`1px solid ${T.goldD}80`, borderRadius:3, padding:'3px 9px', letterSpacing:'.12em', transform:`rotate(${rotate}deg) ${v?'':'translateY(8px)'}`, opacity:v?1:0, transition:`all .7s ease ${delay}ms`, display:'inline-block', boxShadow:`0 2px 8px ${T.goldD}30` }}>{codigo}</div>
  )
}

// ─── LANDING ──────────────────────────────────────────────────
export default function Landing({ onEntrar }) {
  const [scrollY, setScrollY]         = useState(0)
  const [heroIn, setHeroIn]           = useState(false)
  const [periodo, setPeriodo]         = useState('mensal')
  const [historiaAtiva, setHistoriaAtiva] = useState(0)
  const [faqAberta, setFaqAberta]     = useState(null)
  const [fundadoresRestam]            = useState(73)

  useEffect(()=>{
    const t=setTimeout(()=>setHeroIn(true),80)
    const h=()=>setScrollY(window.scrollY)
    window.addEventListener('scroll',h,{passive:true})
    return()=>{ clearTimeout(t); window.removeEventListener('scroll',h) }
  },[])

  const navSolid = scrollY > 50

  return (
    <div style={{ fontFamily:T.sans, background:T.void, color:T.white, overflowX:'hidden' }}>

      {/* ── NAVBAR ─────────────────────────────────────────── */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:300, height:58, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 clamp(16px,5vw,56px)', background:navSolid?'rgba(2,5,9,.96)':'transparent', backdropFilter:navSolid?'blur(20px)':'none', borderBottom:navSolid?`1px solid ${T.ghost}30`:'none', transition:'all .4s' }}>
        <div style={{ display:'flex', alignItems:'center', gap:9 }}>
          <div style={{ width:32, height:32, borderRadius:7, background:`linear-gradient(140deg,${T.ocean},${T.steel})`, border:`1px solid ${T.goldD}50`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>🕊️</div>
          <span style={{ fontFamily:T.serif, fontSize:15, fontWeight:900, background:`linear-gradient(120deg,${T.white} 40%,${T.gold})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>ChampionsLoft</span>
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          <button onClick={onEntrar} style={{ background:'none', border:'none', color:T.fog, fontSize:13, cursor:'pointer', fontFamily:'inherit', padding:'7px 12px' }}>Entrar</button>
          <button onClick={onEntrar} style={{ background:`linear-gradient(135deg,${T.gold},${T.goldD})`, border:'none', color:T.void, fontSize:13, fontWeight:800, cursor:'pointer', fontFamily:'inherit', padding:'9px 18px', borderRadius:6 }}>Começar grátis</button>
        </div>
      </nav>

      {/* ── BANNER FUNDADORES ──────────────────────────────── */}
      <div style={{ background:`linear-gradient(90deg,${T.goldD}40,${T.ocean},${T.goldD}40)`, borderBottom:`1px solid ${T.goldD}40`, padding:'9px clamp(16px,5vw,56px)', display:'flex', alignItems:'center', justifyContent:'center', gap:12, marginTop:58, flexWrap:'wrap' }}>
        <span style={{ fontSize:14 }}>👑</span>
        <span style={{ fontSize:12, color:T.white, fontWeight:600 }}>Campanha Fundadores — apenas <strong style={{ color:T.gold }}>{fundadoresRestam} lugares</strong> restantes</span>
        <span style={{ fontSize:12, color:T.fog }}>Elite AI a 13,99€/mês para sempre</span>
        <button onClick={onEntrar} style={{ background:T.gold, color:T.void, border:'none', borderRadius:99, padding:'4px 14px', fontSize:11, fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>Garantir lugar →</button>
      </div>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px clamp(16px,5vw,56px) 60px', position:'relative', overflow:'hidden', textAlign:'center', background:`radial-gradient(ellipse 80% 60% at 50% 40%,${T.ocean}80,${T.void})` }}>
        <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}>
          <defs>
            <pattern id="g" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M 48 0 L 0 0 0 48" fill="none" stroke={T.ghost} strokeWidth=".3" opacity=".4"/></pattern>
            <radialGradient id="gm" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={T.void} stopOpacity="0"/><stop offset="100%" stopColor={T.void} stopOpacity="1"/></radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#g)"/>
          <rect width="100%" height="100%" fill="url(#gm)"/>
        </svg>

        <div style={{ position:'absolute', top:'20%', left:'4%' }}><Anilha codigo="PT·2026·00447" delay={900} rotate={-7}/></div>
        <div style={{ position:'absolute', top:'32%', right:'3%' }}><Anilha codigo="BE·2025·6071582" delay={1200} rotate={5}/></div>
        <div style={{ position:'absolute', bottom:'30%', left:'5%' }}><Anilha codigo="NL·2024·1840033" delay={1500} rotate={4}/></div>
        <div style={{ position:'absolute', bottom:'24%', right:'5%' }}><Anilha codigo="ES·2026·00912" delay={1800} rotate={-4}/></div>

        <div style={{ display:'inline-flex', alignItems:'center', gap:7, background:`${T.goldD}25`, border:`1px solid ${T.goldD}60`, borderRadius:99, padding:'5px 14px', marginBottom:36, opacity:heroIn?1:0, transform:heroIn?'none':'translateY(-10px)', transition:'all .8s ease' }}>
          <span style={{ width:5, height:5, borderRadius:'50%', background:T.gold, flexShrink:0 }}/>
          <span style={{ fontFamily:T.mono, fontSize:10, color:T.gold, letterSpacing:'.14em' }}>GESTÃO COLUMBÓFILA PREMIUM</span>
        </div>

        <h1 style={{ fontFamily:T.serif, fontSize:'clamp(38px,7vw,82px)', fontWeight:900, lineHeight:1.04, letterSpacing:'-.025em', margin:'0 0 28px', maxWidth:760, opacity:heroIn?1:0, transform:heroIn?'none':'translateY(20px)', transition:'all .9s ease .1s' }}>
          Décadas de paixão.<br/>
          <span style={{ background:`linear-gradient(125deg,${T.goldXL},${T.gold},${T.goldD})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Finalmente uma ferramenta</span><br/>à altura.
        </h1>

        <p style={{ fontSize:'clamp(15px,2vw,19px)', color:T.fog, maxWidth:520, margin:'0 auto 44px', lineHeight:1.8, opacity:heroIn?1:0, transition:'all .9s ease .2s' }}>
          Do pedigree ao Seleccionador de Casais por IA — o ChampionsLoft trata de tudo para que te possas concentrar no que importa: criar pombos de topo.
        </p>

        <div style={{ display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center', marginBottom:64, opacity:heroIn?1:0, transition:'all .9s ease .3s' }}>
          <button onClick={onEntrar} style={{ background:`linear-gradient(135deg,${T.gold},${T.goldD})`, border:'none', color:T.void, fontSize:15, fontWeight:800, cursor:'pointer', fontFamily:'inherit', padding:'16px 40px', borderRadius:8, boxShadow:`0 0 40px ${T.goldD}50`, letterSpacing:'.01em' }}>🕊️ Experimentar 30 dias grátis</button>
          <button onClick={onEntrar} style={{ background:'none', border:`1px solid ${T.ghost}`, color:T.fog, fontSize:14, cursor:'pointer', fontFamily:'inherit', padding:'16px 28px', borderRadius:8 }}>Ver a app →</button>
        </div>

        <div style={{ display:'flex', gap:'clamp(24px,4vw,56px)', flexWrap:'wrap', justifyContent:'center', opacity:heroIn?1:0, transition:'all .9s ease .45s' }}>
          {NUMEROS.map(({val,sufixo,label})=>(
            <div key={label} style={{ textAlign:'center' }}>
              <div style={{ fontFamily:T.serif, fontSize:'clamp(28px,4vw,40px)', fontWeight:900, color:T.gold, lineHeight:1 }}>{val}<span style={{ fontSize:'.5em', color:T.goldD }}>{sufixo}</span></div>
              <div style={{ fontSize:10, color:T.ghost, marginTop:6, maxWidth:120, lineHeight:1.4 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HISTÓRIAS ──────────────────────────────────────── */}
      <section style={{ padding:'clamp(72px,9vw,112px) clamp(16px,5vw,56px)', background:T.depth }}>
        <div style={{ maxWidth:1000, margin:'0 auto' }}>
          <Reveal>
            <div style={{ fontFamily:T.mono, fontSize:10, color:T.ghost, letterSpacing:'.16em', textTransform:'uppercase', marginBottom:14 }}>Por que isto importa</div>
            <h2 style={{ fontFamily:T.serif, fontSize:'clamp(28px,4vw,46px)', fontWeight:900, lineHeight:1.1, marginBottom:56, maxWidth:540 }}>Cada pombo tem uma história. Está na altura de a registar.</h2>
          </Reveal>
          <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
            {HISTORIAS.map((h,i)=>(
              <Reveal key={h.num} delay={i*80}>
                <div onClick={()=>setHistoriaAtiva(historiaAtiva===i?-1:i)} style={{ padding:'clamp(24px,3vw,36px)', borderTop:`1px solid ${T.ghost}25`, cursor:'pointer', background:historiaAtiva===i?`${T.ocean}60`:'transparent', transition:'background .3s' }}>
                  <div style={{ display:'flex', gap:20, alignItems:'flex-start' }}>
                    <div style={{ fontFamily:T.mono, fontSize:11, color:T.ghost, letterSpacing:'.08em', flexShrink:0, marginTop:3, minWidth:24 }}>{h.num}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:historiaAtiva===i?16:0 }}>
                        <h3 style={{ fontFamily:T.serif, fontSize:'clamp(20px,2.5vw,28px)', fontWeight:900, color:historiaAtiva===i?T.white:T.fog, transition:'color .3s' }}>{h.icon} {h.titulo}</h3>
                        <span style={{ color:T.ghost, fontSize:20, transform:historiaAtiva===i?'rotate(45deg)':'none', transition:'transform .3s' }}>+</span>
                      </div>
                      {historiaAtiva===i&&(
                        <div>
                          <p style={{ color:T.fog, lineHeight:1.85, fontSize:15, marginBottom:20, fontStyle:'italic', maxWidth:620 }}>"{h.corpo}"</p>
                          <div style={{ display:'flex', gap:12, alignItems:'flex-start', padding:'14px 18px', background:`${T.goldD}18`, border:`1px solid ${T.goldD}40`, borderRadius:8, maxWidth:620 }}>
                            <span style={{ color:T.gold, fontSize:18, flexShrink:0 }}>✦</span>
                            <p style={{ fontSize:13, color:T.goldXL, lineHeight:1.7, margin:0 }}>{h.impacto}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
            <div style={{ borderTop:`1px solid ${T.ghost}25` }}/>
          </div>
        </div>
      </section>

      {/* ── MÓDULOS ────────────────────────────────────────── */}
      <section style={{ padding:'clamp(72px,9vw,112px) clamp(16px,5vw,56px)', background:T.void }}>
        <div style={{ maxWidth:1000, margin:'0 auto' }}>
          <Reveal>
            <div style={{ fontFamily:T.mono, fontSize:10, color:T.ghost, letterSpacing:'.16em', textTransform:'uppercase', marginBottom:14 }}>Plataforma</div>
            <h2 style={{ fontFamily:T.serif, fontSize:'clamp(28px,4vw,46px)', fontWeight:900, lineHeight:1.1, marginBottom:48, maxWidth:420 }}>Tudo o que o teu pombal precisa, num só lugar.</h2>
          </Reveal>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:2 }}>
            {MODULOS.map((m,i)=>(
              <Reveal key={m.nome} delay={i*50}>
                <div style={{ padding:'22px 20px', background:T.depth, border:`1px solid ${T.ghost}20`, position:'relative', overflow:'hidden', transition:'background .25s', cursor:'default' }}
                  onMouseEnter={e=>e.currentTarget.style.background=T.ocean}
                  onMouseLeave={e=>e.currentTarget.style.background=T.depth}>
                  <div style={{ fontSize:26, marginBottom:10 }}>{m.icon}</div>
                  <div style={{ fontFamily:T.serif, fontSize:14, fontWeight:700, color:T.white, marginBottom:6 }}>{m.nome}</div>
                  <div style={{ fontSize:12, color:T.fog, lineHeight:1.65 }}>{m.desc}</div>
                  <div style={{ position:'absolute', bottom:0, left:0, right:0, height:2, background:m.cor, opacity:.5 }}/>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── SELECCIONADOR IA ───────────────────────────────── */}
      <section style={{ padding:'clamp(72px,9vw,112px) clamp(16px,5vw,56px)', background:T.depth, borderTop:`1px solid ${T.ghost}15` }}>
        <div style={{ maxWidth:1000, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:'clamp(36px,5vw,72px)', alignItems:'center' }}>
          <Reveal>
            <div style={{ fontFamily:T.mono, fontSize:10, color:T.gold, letterSpacing:'.16em', textTransform:'uppercase', marginBottom:14 }}>Elite AI</div>
            <h2 style={{ fontFamily:T.serif, fontSize:'clamp(26px,3.5vw,42px)', fontWeight:900, lineHeight:1.1, marginBottom:20 }}>O teu pai sabia qual o melhor casal. Agora a IA também sabe.</h2>
            <p style={{ color:T.fog, lineHeight:1.85, marginBottom:28, fontSize:15 }}>Décadas de conhecimento intuitivo sobre pedigrees, linhagens e consanguinidade — o Seleccionador de Casais faz esses cálculos em segundos, com objectividade total e dados reais do teu efectivo.</p>
            <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:32 }}>
              {[['Analisa todas as combinações do teu efectivo',T.tealL],['Calcula consanguinidade até à 3ª geração',T.tealL],['Score 0–100 por par com justificação da IA',T.gold],['Powered by Claude Sonnet (Anthropic)',T.gold]].map(([f,cor])=>(
                <div key={f} style={{ display:'flex', gap:10, fontSize:13, color:T.white }}>
                  <span style={{ color:cor, flexShrink:0, fontWeight:700, marginTop:1 }}>✦</span>{f}
                </div>
              ))}
            </div>
            <button onClick={onEntrar} style={{ background:`linear-gradient(135deg,${T.gold},${T.goldD})`, border:'none', color:T.void, fontSize:13, fontWeight:800, cursor:'pointer', fontFamily:'inherit', padding:'12px 28px', borderRadius:7 }}>Experimentar Elite AI →</button>
          </Reveal>
          <Reveal delay={150}>
            <div style={{ background:`linear-gradient(160deg,${T.ocean},${T.depth})`, border:`1px solid ${T.goldD}50`, borderRadius:12, overflow:'hidden', boxShadow:`0 20px 60px ${T.void}` }}>
              <div style={{ padding:'14px 18px', borderBottom:`1px solid ${T.ghost}20`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ fontFamily:T.serif, fontSize:13, fontWeight:700, color:T.gold }}>🧬 Seleccionador de Casais</div>
                <div style={{ fontFamily:T.mono, fontSize:9, color:T.ghost }}>Época 2026</div>
              </div>
              <div style={{ padding:'16px 18px' }}>
                {[{medal:'🥇',par:'Zeus × Atena',score:95,label:'Excelente',cor:T.tealL,consang:'3%'},{medal:'🥈',par:'Ares × Hera',score:82,label:'Bom',cor:T.gold,consang:'8%'},{medal:'🥉',par:'Apolo × Artemis',score:71,label:'Bom',cor:'#A78BFA',consang:'5%'}].map(({medal,par,score,label,cor,consang})=>(
                  <div key={par} style={{ marginBottom:10, padding:'12px 14px', background:`${T.void}60`, borderRadius:8, border:`1px solid ${cor}20` }}>
                    <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:8 }}>
                      <span style={{ fontSize:16 }}>{medal}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:T.white }}>{par}</div>
                        <div style={{ fontFamily:T.mono, fontSize:9, color:T.ghost, marginTop:2 }}>Consang. {consang}</div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontFamily:T.serif, fontSize:22, fontWeight:900, color:cor, lineHeight:1 }}>{score}</div>
                        <div style={{ fontSize:9, color:T.ghost }}>{label}</div>
                      </div>
                    </div>
                    <div style={{ height:3, background:T.ghost+'30', borderRadius:2, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${score}%`, background:cor, borderRadius:2 }}/>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop:12, padding:'12px 14px', background:`${T.goldD}15`, border:`1px solid ${T.goldD}35`, borderRadius:8 }}>
                  <div style={{ fontSize:10, color:T.gold, fontWeight:700, marginBottom:6 }}>🤖 Análise IA — Claude Sonnet</div>
                  <p style={{ fontSize:11, color:T.fog, lineHeight:1.7, margin:0, fontStyle:'italic' }}>"Zeus × Atena apresenta consanguinidade de apenas 3% e linhagens complementares. Especialidade em velocidade compatível em ambos. Cruzamento altamente recomendado para a época 2026."</p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── TESTEMUNHOS ────────────────────────────────────── */}
      <section style={{ padding:'clamp(72px,9vw,112px) clamp(16px,5vw,56px)', background:T.void }}>
        <div style={{ maxWidth:1000, margin:'0 auto' }}>
          <Reveal style={{ textAlign:'center', marginBottom:48 }}>
            <div style={{ fontFamily:T.mono, fontSize:10, color:T.ghost, letterSpacing:'.16em', textTransform:'uppercase', marginBottom:14 }}>Columbófilos reais</div>
            <h2 style={{ fontFamily:T.serif, fontSize:'clamp(26px,4vw,40px)', fontWeight:900 }}>O que dizem os criadores</h2>
          </Reveal>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16 }}>
            {TESTEMUNHOS.map((t,i)=>(
              <Reveal key={t.nome} delay={i*80}>
                <div style={{ padding:24, background:T.depth, border:`1px solid ${T.ghost}25`, borderRadius:10, position:'relative' }}>
                  <div style={{ display:'flex', gap:2, marginBottom:12 }}>
                    {[1,2,3,4,5].map(s=><span key={s} style={{ fontSize:13, color:T.gold }}>★</span>)}
                  </div>
                  <p style={{ fontSize:14, color:T.fog, lineHeight:1.8, marginBottom:16, fontStyle:'italic' }}>"{t.texto}"</p>
                  <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                    <div style={{ width:36, height:36, borderRadius:'50%', background:`linear-gradient(135deg,${T.ocean},${T.steel})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:T.gold, border:`1px solid ${T.goldD}40` }}>{t.nome[0]}</div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:T.white }}>{t.nome}</div>
                      <div style={{ fontSize:11, color:T.ghost }}>{t.local}</div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PREÇOS ─────────────────────────────────────────── */}
      <section style={{ padding:'clamp(72px,9vw,112px) clamp(16px,5vw,56px)', background:T.depth }}>
        <div style={{ maxWidth:960, margin:'0 auto' }}>
          <Reveal style={{ textAlign:'center', marginBottom:48 }}>
            <div style={{ fontFamily:T.mono, fontSize:10, color:T.ghost, letterSpacing:'.16em', textTransform:'uppercase', marginBottom:14 }}>Preços</div>
            <h2 style={{ fontFamily:T.serif, fontSize:'clamp(28px,4vw,44px)', fontWeight:900, marginBottom:12 }}>Menos de um café. Toda a época.</h2>
            <p style={{ color:T.fog, marginBottom:24 }}>30 dias grátis — sem cartão de crédito, sem compromisso.</p>
            <div style={{ display:'inline-flex', background:T.ocean, border:`1px solid ${T.ghost}30`, borderRadius:99, padding:3 }}>
              {[['mensal','Mensal'],['anual','Anual (−17%)']].map(([p,l])=>(
                <button key={p} onClick={()=>setPeriodo(p)} style={{ padding:'7px 18px', borderRadius:99, fontSize:12, fontWeight:600, cursor:'pointer', border:'none', fontFamily:'inherit', background:periodo===p?`linear-gradient(135deg,${T.gold},${T.goldD})`:'none', color:periodo===p?T.void:T.fog, transition:'all .2s' }}>{l}</button>
              ))}
            </div>
          </Reveal>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:16, alignItems:'start' }}>
            {PLANOS.map((p,i)=>{
              const precoMes = periodo==='anual'?(p.anual/12).toFixed(2):p.preco.toFixed(2)
              return (
                <Reveal key={p.id} delay={i*80}>
                  <div style={{ padding:28, borderRadius:10, position:'relative', background:p.gold?`linear-gradient(160deg,${T.ocean},${T.depth})`:T.void, border:`1px solid ${p.gold?T.goldD+'60':p.destaque?T.teal+'40':T.ghost+'25'}`, boxShadow:p.gold?`0 0 48px ${T.goldD}20`:'none', transform:p.destaque?'scale(1.03)':'none' }}>
                    {p.destaque&&<div style={{ position:'absolute', top:-11, left:'50%', transform:'translateX(-50%)', background:T.teal, color:T.void, fontSize:10, fontWeight:800, padding:'3px 14px', borderRadius:99, whiteSpace:'nowrap' }}>MAIS ESCOLHIDO</div>}
                    {p.gold&&<div style={{ position:'absolute', top:-11, left:'50%', transform:'translateX(-50%)', background:`linear-gradient(135deg,${T.gold},${T.goldD})`, color:T.void, fontSize:10, fontWeight:800, padding:'3px 14px', borderRadius:99, whiteSpace:'nowrap' }}>👑 COM INTELIGÊNCIA ARTIFICIAL</div>}
                    <div style={{ fontFamily:T.mono, fontSize:10, fontWeight:700, color:p.cor, letterSpacing:'.12em', textTransform:'uppercase', marginBottom:6 }}>{p.nome}</div>
                    <div style={{ fontSize:12, color:T.ghost, marginBottom:20 }}>{p.desc}</div>
                    <div style={{ marginBottom:6 }}>
                      <span style={{ fontFamily:T.serif, fontSize:40, fontWeight:900, color:T.white, lineHeight:1 }}>{precoMes}€</span>
                      <span style={{ fontSize:12, color:T.ghost }}>/mês</span>
                    </div>
                    <div style={{ fontFamily:T.mono, fontSize:10, color:p.cor, marginBottom:24 }}>☕ {p.dia}€ por dia</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:24 }}>
                      {p.feats.map(f=>(
                        <div key={f} style={{ display:'flex', gap:8, fontSize:12, color:'#d1d9e0', alignItems:'flex-start' }}>
                          <span style={{ color:p.cor, flexShrink:0 }}>✦</span>{f}
                        </div>
                      ))}
                    </div>
                    <button onClick={onEntrar} style={{ width:'100%', padding:'12px', borderRadius:7, fontSize:13, fontWeight:700, cursor:'pointer', border:'none', fontFamily:'inherit', background:p.gold?`linear-gradient(135deg,${T.gold},${T.goldD})`:p.destaque?T.teal:T.steel, color:p.gold||p.destaque?T.void:T.white }}>Começar grátis →</button>
                  </div>
                </Reveal>
              )
            })}
          </div>

          {/* Fundadores */}
          <Reveal delay={200}>
            <div style={{ marginTop:24, padding:'20px 24px', background:`linear-gradient(135deg,${T.goldD}20,${T.ocean})`, border:`1px solid ${T.goldD}40`, borderRadius:12, display:'flex', gap:16, alignItems:'center', flexWrap:'wrap' }}>
              <span style={{ fontSize:28 }}>👑</span>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:T.serif, fontSize:16, fontWeight:900, color:T.gold, marginBottom:3 }}>Plano Fundadores — 13,99€/mês para sempre</div>
                <div style={{ fontSize:13, color:T.fog }}>Os primeiros 100 utilizadores ficam com Elite AI ao preço actual, mesmo quando os preços subirem. Apenas <strong style={{ color:T.white }}>{fundadoresRestam} lugares</strong> restantes.</div>
              </div>
              <button onClick={onEntrar} style={{ background:`linear-gradient(135deg,${T.gold},${T.goldD})`, border:'none', color:T.void, borderRadius:8, padding:'10px 20px', fontSize:13, fontWeight:800, cursor:'pointer', fontFamily:'inherit', flexShrink:0 }}>Garantir lugar</button>
            </div>
          </Reveal>

          <Reveal style={{ textAlign:'center', marginTop:20 }}>
            <p style={{ fontSize:12, color:T.ghost }}>Para coletividades (3+ membros) — descontos até 30% · <span style={{ color:T.gold, cursor:'pointer' }} onClick={onEntrar}>Ver preços de grupo →</span></p>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────── */}
      <section style={{ padding:'clamp(72px,9vw,112px) clamp(16px,5vw,56px)', background:T.void }}>
        <div style={{ maxWidth:700, margin:'0 auto' }}>
          <Reveal style={{ textAlign:'center', marginBottom:48 }}>
            <div style={{ fontFamily:T.mono, fontSize:10, color:T.ghost, letterSpacing:'.16em', textTransform:'uppercase', marginBottom:14 }}>FAQ</div>
            <h2 style={{ fontFamily:T.serif, fontSize:'clamp(26px,4vw,40px)', fontWeight:900 }}>Perguntas frequentes</h2>
          </Reveal>
          <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
            {FAQ.map((f,i)=>(
              <Reveal key={i} delay={i*40}>
                <div onClick={()=>setFaqAberta(faqAberta===i?null:i)} style={{ padding:'20px 0', borderTop:`1px solid ${T.ghost}20`, cursor:'pointer' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:16 }}>
                    <div style={{ fontSize:14, fontWeight:600, color:faqAberta===i?T.white:T.fog, transition:'color .2s' }}>{f.q}</div>
                    <span style={{ color:T.ghost, fontSize:18, flexShrink:0, transform:faqAberta===i?'rotate(45deg)':'none', transition:'transform .25s' }}>+</span>
                  </div>
                  {faqAberta===i&&<div style={{ fontSize:13, color:T.fog, lineHeight:1.8, marginTop:12 }}>{f.r}</div>}
                </div>
              </Reveal>
            ))}
            <div style={{ borderTop:`1px solid ${T.ghost}20` }}/>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ──────────────────────────────────────── */}
      <section style={{ padding:'clamp(88px,11vw,130px) clamp(16px,5vw,56px)', background:T.depth, textAlign:'center', borderTop:`1px solid ${T.ghost}15`, position:'relative', overflow:'hidden' }}>
        <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}>
          <defs><radialGradient id="cta" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={T.goldD} stopOpacity=".12"/><stop offset="100%" stopColor={T.depth} stopOpacity="0"/></radialGradient></defs>
          <rect width="100%" height="100%" fill="url(#cta)"/>
        </svg>
        <Reveal style={{ position:'relative', maxWidth:580, margin:'0 auto' }}>
          <div style={{ fontSize:56, marginBottom:20 }}>🕊️</div>
          <h2 style={{ fontFamily:T.serif, fontSize:'clamp(32px,5vw,56px)', fontWeight:900, lineHeight:1.05, marginBottom:20, letterSpacing:'-.02em' }}>
            O próximo campeão<br/>
            <span style={{ background:`linear-gradient(125deg,${T.goldXL},${T.gold})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>já está no teu pombal.</span>
          </h2>
          <p style={{ color:T.fog, fontSize:16, lineHeight:1.8, marginBottom:44, maxWidth:420, margin:'0 auto 44px' }}>Falta apenas a ferramenta certa para o identificar, criar e registar para a posteridade.</p>
          <button onClick={onEntrar} style={{ background:`linear-gradient(135deg,${T.gold},${T.goldD})`, border:'none', color:T.void, fontSize:16, fontWeight:900, cursor:'pointer', fontFamily:'inherit', padding:'18px 52px', borderRadius:9, boxShadow:`0 16px 48px ${T.goldD}40`, letterSpacing:'.01em', display:'block', margin:'0 auto 20px' }}>Começar grátis agora</button>
          <div style={{ fontSize:12, color:T.ghost }}>Já tens conta? <span style={{ color:T.gold, cursor:'pointer' }} onClick={onEntrar}>Entrar →</span></div>
          <div style={{ marginTop:32, display:'flex', gap:28, justifyContent:'center', flexWrap:'wrap' }}>
            {['30 dias grátis','Sem cartão de crédito','Cancela quando quiseres'].map(l=>(
              <div key={l} style={{ fontSize:12, color:T.ghost, display:'flex', alignItems:'center', gap:6 }}><span style={{ color:T.tealL }}>✓</span>{l}</div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── RODAPÉ ─────────────────────────────────────────── */}
      <footer style={{ borderTop:`1px solid ${T.ghost}20`, padding:'24px clamp(16px,5vw,56px)', background:T.void }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12, marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:15 }}>🕊️</span>
            <span style={{ fontFamily:T.serif, fontSize:14, fontWeight:700, color:T.gold }}>ChampionsLoft</span>
            <span style={{ fontFamily:T.mono, fontSize:10, color:T.ghost }}>© 2026</span>
          </div>
          <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
            {[['Termos','termos'],['Privacidade','privacidade'],['RGPD','privacidade'],['Suporte','suporte']].map(([l,id])=>(
              <span key={l} style={{ fontSize:12, color:T.ghost, cursor:'pointer' }} onClick={()=>onEntrar()}>{l}</span>
            ))}
          </div>
          <div style={{ fontFamily:T.mono, fontSize:10, color:T.ghost }}>For pigeon fanciers worldwide 🌍</div>
        </div>
        <div style={{ borderTop:`1px solid ${T.ghost}15`, paddingTop:16, display:'flex', gap:20, flexWrap:'wrap', justifyContent:'center' }}>
          {['🇵🇹 Portugal','🇧🇷 Brasil','🇪🇸 España','🇳🇱 Nederland','🇧🇪 Belgique'].map(l=>(
            <span key={l} style={{ fontSize:11, color:T.ghost }}>{l}</span>
          ))}
        </div>
      </footer>

      <style>{`
        @media(prefers-reduced-motion:reduce){*,*::before,*::after{transition:none!important;animation:none!important}}
        @media(max-width:600px){h1,h2{letter-spacing:-.01em!important}}
      `}</style>
    </div>
  )
}
