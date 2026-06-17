import { useEffect, useRef, useState } from 'react'

const LANDING_CSS = `
  :root {
    --night: #060B14;
    --panel: #0B1830;
    --panel2: #101F40;
    --line: #1B2D52;
    --blue: #1E5FD9;
    --blue-bright: #4C8DFF;
    --gold: #D4AF37;
    --gold-soft: #E8CC6E;
    --ivory: #F5F1E8;
    --grey: #7A8699;
  }
  .cl-landing, .cl-landing *, .cl-landing *::before, .cl-landing *::after { box-sizing: border-box; }
  .cl-landing {
    font-family: 'Inter', sans-serif;
    background: var(--night);
    color: var(--ivory);
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
    min-height: 100vh;
    position: relative;
  }
  .cl-landing ::selection { background: var(--gold); color: var(--night); }

  .cl-landing .grain {
    position: fixed; inset: 0; z-index: 1; pointer-events: none; opacity: .035; mix-blend-mode: overlay;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }

  .cl-landing nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 22px 56px;
    background: linear-gradient(to bottom, rgba(6,11,20,.92), transparent);
    transition: background .3s;
  }
  .cl-landing .nav-mark { display: flex; align-items: center; gap: 12px; }
  .cl-landing .nav-ring {
    width: 30px; height: 30px; border-radius: 50%; border: 2px solid var(--gold);
    display: flex; align-items: center; justify-content: center; font-size: 13px;
    font-family: 'Space Mono', monospace; color: var(--gold);
  }
  .cl-landing .nav-word { font-family: 'Fraunces', serif; font-weight: 700; font-size: 17px; letter-spacing: -.01em; }
  .cl-landing .nav-links { display: flex; align-items: center; gap: 40px; }
  .cl-landing .nav-links a { font-size: 13px; color: var(--grey); text-decoration: none; transition: color .2s; cursor: pointer; }
  .cl-landing .nav-links a:hover { color: var(--ivory); }
  .cl-landing .nav-cta {
    padding: 10px 22px; border-radius: 4px; border: 1px solid var(--gold);
    background: transparent; color: var(--gold); font-size: 13px; font-weight: 600;
    cursor: pointer; font-family: 'Inter', sans-serif; transition: all .25s;
  }
  .cl-landing .nav-cta:hover { background: var(--gold); color: var(--night); }

  .cl-landing .hero {
    position: relative; min-height: 100vh;
    display: flex; align-items: center; justify-content: center;
    padding: 140px 24px 80px; overflow: hidden;
  }
  .cl-landing .hero-bg {
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 60% 50% at 50% 35%, rgba(30,95,217,.18), transparent 70%);
  }
  .cl-landing .hero-grid {
    position: absolute; inset: 0; opacity: .25;
    background-image: linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px);
    background-size: 64px 64px;
    mask-image: radial-gradient(ellipse 55% 55% at 50% 40%, black 0%, transparent 75%);
  }
  .cl-landing .hero-content { position: relative; z-index: 2; text-align: center; max-width: 880px; }

  .cl-landing .hero-eyebrow {
    font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: .25em; text-transform: uppercase;
    color: var(--gold); margin-bottom: 32px; opacity: 0; animation: cl-rise .9s ease .2s forwards;
  }

  .cl-landing .ring-stage {
    position: relative; width: 220px; height: 220px; margin: 0 auto 40px;
    perspective: 900px; cursor: pointer;
  }
  .cl-landing .ring-3d {
    position: absolute; inset: 0; border-radius: 50%;
    transform-style: preserve-3d; transition: transform 1.4s cubic-bezier(.16,1,.3,1);
  }
  .cl-landing .ring-stage:hover .ring-3d, .cl-landing .ring-stage.flipped .ring-3d { transform: rotateY(180deg); }
  .cl-landing .ring-face {
    position: absolute; inset: 0; border-radius: 50%; backface-visibility: hidden;
    display: flex; align-items: center; justify-content: center; flex-direction: column;
  }
  .cl-landing .ring-front {
    background: conic-gradient(from 200deg, #b08a2e, var(--gold-soft), #b08a2e, #8a6c1f, var(--gold-soft), #b08a2e);
    box-shadow: 0 30px 60px rgba(212,175,55,.25), inset 0 0 30px rgba(0,0,0,.35);
  }
  .cl-landing .ring-front::before {
    content: ''; position: absolute; inset: 14px; border-radius: 50%;
    background: var(--night); box-shadow: inset 0 4px 12px rgba(0,0,0,.6);
  }
  .cl-landing .ring-front-text {
    position: relative; z-index: 2; font-family: 'Space Mono', monospace; color: var(--gold-soft);
    font-size: 13px; letter-spacing: .15em; text-align: center; line-height: 1.8;
  }
  .cl-landing .ring-back {
    background: var(--panel2); border: 1px solid var(--line);
    transform: rotateY(180deg);
    padding: 18px;
  }
  .cl-landing .ring-back-row { display: flex; justify-content: space-between; width: 100%; font-family: 'Space Mono', monospace; font-size: 10px; padding: 3px 0; }
  .cl-landing .ring-back-label { color: var(--grey); }
  .cl-landing .ring-back-val { color: var(--blue-bright); font-weight: 700; }
  .cl-landing .ring-hint {
    margin-top: 18px; font-size: 11px; color: var(--grey); font-family: 'Space Mono', monospace;
    letter-spacing: .1em; text-transform: uppercase;
  }

  .cl-landing .hero-title {
    font-family: 'Fraunces', serif; font-weight: 900; font-style: normal;
    font-size: clamp(40px, 6.4vw, 80px); line-height: .98; letter-spacing: -.015em;
    margin-bottom: 22px; opacity: 0; animation: cl-rise .9s ease .4s forwards;
  }
  .cl-landing .hero-title .em { font-style: italic; font-weight: 500; color: var(--blue-bright); }
  .cl-landing .hero-sub {
    font-size: clamp(16px, 2vw, 19px); color: var(--grey); line-height: 1.65;
    max-width: 560px; margin: 0 auto 44px; font-weight: 300;
    opacity: 0; animation: cl-rise .9s ease .6s forwards;
  }
  .cl-landing .hero-actions {
    display: flex; gap: 14px; justify-content: center; flex-wrap: wrap;
    opacity: 0; animation: cl-rise .9s ease .8s forwards;
  }
  .cl-landing .btn-gold {
    padding: 16px 36px; border-radius: 4px; border: none; cursor: pointer;
    background: var(--gold); color: var(--night); font-weight: 700; font-size: 14px;
    font-family: 'Inter', sans-serif; transition: all .25s; text-decoration: none; display: inline-block;
  }
  .cl-landing .btn-gold:hover { background: var(--gold-soft); transform: translateY(-2px); box-shadow: 0 12px 32px rgba(212,175,55,.3); }
  .cl-landing .btn-outline {
    padding: 15px 32px; border-radius: 4px; border: 1px solid var(--line); cursor: pointer;
    background: transparent; color: var(--ivory); font-size: 14px; font-family: 'Inter', sans-serif;
    transition: all .25s; text-decoration: none; display: inline-block;
  }
  .cl-landing .btn-outline:hover { border-color: var(--ivory); }

  @keyframes cl-rise { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }

  .cl-landing .story-section { position: relative; padding: 130px 56px; border-top: 1px solid var(--line); }
  .cl-landing .story-inner { max-width: 1080px; margin: 0 auto; }
  .cl-landing .story-grid { display: grid; grid-template-columns: .9fr 1.1fr; gap: 80px; align-items: center; }
  .cl-landing .story-grid.reverse { grid-template-columns: 1.1fr .9fr; }
  .cl-landing .story-grid.reverse .story-visual { order: 2; }
  .cl-landing .story-eyebrow {
    font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: .2em; text-transform: uppercase;
    color: var(--blue-bright); margin-bottom: 18px; display: block;
  }
  .cl-landing .story-title {
    font-family: 'Fraunces', serif; font-weight: 700; font-size: clamp(28px, 3.6vw, 42px);
    line-height: 1.08; margin-bottom: 20px;
  }
  .cl-landing .story-text { color: var(--grey); font-size: 16px; line-height: 1.75; margin-bottom: 28px; font-weight: 300; }
  .cl-landing .story-list { display: flex; flex-direction: column; gap: 14px; }
  .cl-landing .story-item { display: flex; gap: 14px; align-items: flex-start; font-size: 14px; color: var(--ivory); }
  .cl-landing .story-item-mark { font-family: 'Space Mono', monospace; color: var(--gold); font-size: 13px; flex-shrink: 0; margin-top: 1px; }

  .cl-landing .visual-panel { background: var(--panel); border: 1px solid var(--line); border-radius: 12px; overflow: hidden; box-shadow: 0 40px 90px rgba(0,0,0,.5); }
  .cl-landing .visual-bar { display: flex; gap: 6px; padding: 12px 16px; border-bottom: 1px solid var(--line); }
  .cl-landing .visual-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--line); }
  .cl-landing .visual-body { padding: 24px; }

  .cl-landing .pedigree-tree { display: flex; flex-direction: column; align-items: center; gap: 16px; }
  .cl-landing .pedigree-node {
    background: var(--panel2); border: 1px solid var(--line); border-radius: 6px;
    padding: 8px 14px; font-family: 'Space Mono', monospace; font-size: 10px; color: var(--blue-bright);
    text-align: center; min-width: 100px;
  }
  .cl-landing .pedigree-row { display: flex; gap: 14px; }
  .cl-landing .pedigree-line { width: 1px; height: 16px; background: var(--line); }

  .cl-landing .weather-row { display: flex; justify-content: space-between; gap: 8px; }
  .cl-landing .weather-cell { text-align: center; flex: 1; }
  .cl-landing .weather-val { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 700; color: var(--ivory); }
  .cl-landing .weather-lbl { font-size: 10px; color: var(--grey); margin-top: 4px; }
  .cl-landing .weather-wind { font-size: 11px; color: var(--blue-bright); margin-top: 6px; font-family: 'Space Mono', monospace; }

  .cl-landing .ai-line { font-size: 13px; color: var(--grey); line-height: 1.8; font-style: italic; }
  .cl-landing .ai-line strong { color: var(--ivory); font-style: normal; }
  .cl-landing .ai-quote {
    border-left: 2px solid var(--gold); padding: 10px 16px; margin: 14px 0;
    background: rgba(212,175,55,.05); border-radius: 0 6px 6px 0; font-style: normal; color: var(--ivory); font-size: 13px;
  }

  .cl-landing .speed-display { text-align: center; }
  .cl-landing .speed-num { font-family: 'Fraunces', serif; font-size: 56px; font-weight: 900; color: var(--blue-bright); line-height: 1; }
  .cl-landing .speed-unit { font-size: 13px; color: var(--grey); margin-top: 6px; }
  .cl-landing .speed-bar { height: 3px; background: var(--line); border-radius: 3px; margin-top: 20px; overflow: hidden; }
  .cl-landing .speed-fill { height: 100%; background: linear-gradient(90deg, var(--blue), var(--blue-bright)); width: 78%; }

  .cl-landing .modules-section { padding: 130px 56px; border-top: 1px solid var(--line); }
  .cl-landing .modules-head { max-width: 600px; margin-bottom: 64px; }
  .cl-landing .phase-row { display: flex; gap: 1px; background: var(--line); border: 1px solid var(--line); border-radius: 12px; overflow: hidden; margin-bottom: 1px; }
  .cl-landing .phase-label {
    font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: .15em; text-transform: uppercase;
    color: var(--gold); padding: 14px 24px; background: var(--panel2); white-space: nowrap;
  }
  .cl-landing .modules-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--line); border: 1px solid var(--line); border-radius: 0 0 12px 12px; overflow: hidden; }
  .cl-landing .module-card { background: var(--panel); padding: 28px 24px; transition: background .2s; }
  .cl-landing .module-card:hover { background: var(--panel2); }
  .cl-landing .module-icon { font-size: 22px; margin-bottom: 14px; }
  .cl-landing .module-name { font-family: 'Fraunces', serif; font-weight: 600; font-size: 15px; margin-bottom: 8px; }
  .cl-landing .module-desc { font-size: 12.5px; color: var(--grey); line-height: 1.6; }

  .cl-landing .testi-section { padding: 110px 56px; border-top: 1px solid var(--line); text-align: center; }
  .cl-landing .testi-mark { font-family: 'Fraunces', serif; font-size: 60px; color: var(--gold); opacity: .4; line-height: 1; }
  .cl-landing .testi-text {
    font-family: 'Fraunces', serif; font-style: italic; font-weight: 500;
    font-size: clamp(22px, 3vw, 32px); line-height: 1.4; max-width: 760px; margin: 0 auto 28px; color: var(--ivory);
  }
  .cl-landing .testi-author { font-size: 13px; color: var(--grey); }
  .cl-landing .testi-author strong { color: var(--ivory); font-weight: 600; }

  .cl-landing .pricing-section { padding: 130px 56px; border-top: 1px solid var(--line); }
  .cl-landing .pricing-head { text-align: center; max-width: 600px; margin: 0 auto 56px; }
  .cl-landing .pricing-toggle { display: inline-flex; gap: 4px; background: var(--panel); border: 1px solid var(--line); border-radius: 99px; padding: 4px; margin-top: 24px; }
  .cl-landing .toggle-btn { padding: 9px 20px; border-radius: 99px; border: none; background: transparent; color: var(--grey); font-size: 13px; cursor: pointer; font-family: 'Inter', sans-serif; transition: all .2s; }
  .cl-landing .toggle-btn.active { background: var(--blue); color: var(--ivory); font-weight: 600; }
  .cl-landing .pricing-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; max-width: 1080px; margin: 0 auto; }
  .cl-landing .plan-card { background: var(--panel); border: 1px solid var(--line); border-radius: 10px; padding: 30px 26px; display: flex; flex-direction: column; }
  .cl-landing .plan-card.feat { border-color: var(--blue); position: relative; }
  .cl-landing .plan-card.feat::before {
    content: 'ESCOLHA DOS CAMPEÕES'; position: absolute; top: -11px; left: 50%; transform: translateX(-50%);
    background: var(--blue); color: var(--ivory); font-size: 9px; font-weight: 700; letter-spacing: .1em;
    padding: 4px 14px; border-radius: 99px; white-space: nowrap; font-family: 'Space Mono', monospace;
  }
  .cl-landing .plan-card.gold { border-color: rgba(212,175,55,.4); background: linear-gradient(160deg, var(--panel), rgba(212,175,55,.04)); }
  .cl-landing .plan-name { font-family: 'Fraunces', serif; font-weight: 700; font-size: 18px; margin-bottom: 4px; }
  .cl-landing .plan-desc { font-size: 12px; color: var(--grey); margin-bottom: 20px; }
  .cl-landing .plan-price { font-family: 'Fraunces', serif; font-size: 38px; font-weight: 900; margin-bottom: 2px; }
  .cl-landing .plan-price span { font-size: 14px; color: var(--grey); font-weight: 400; font-family: 'Inter', sans-serif; }
  .cl-landing .plan-period { font-size: 11px; color: var(--grey); margin-bottom: 22px; }
  .cl-landing .plan-feats { flex: 1; display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; }
  .cl-landing .plan-feat { font-size: 12.5px; color: var(--grey); display: flex; gap: 8px; }
  .cl-landing .plan-feat.on { color: var(--ivory); }
  .cl-landing .plan-feat-mark { color: var(--blue-bright); flex-shrink: 0; }
  .cl-landing .plan-feat.gold-mark .plan-feat-mark { color: var(--gold); }
  .cl-landing .btn-plan { width: 100%; padding: 11px; border-radius: 4px; border: 1px solid var(--line); background: transparent; color: var(--ivory); font-size: 13px; font-weight: 600; cursor: pointer; transition: all .2s; }
  .cl-landing .btn-plan.primary { background: var(--blue); border-color: var(--blue); }
  .cl-landing .btn-plan.primary:hover { background: var(--blue-bright); }
  .cl-landing .btn-plan.gold { background: var(--gold); border-color: var(--gold); color: var(--night); }
  .cl-landing .btn-plan.gold:hover { background: var(--gold-soft); }
  .cl-landing .btn-plan:not(.primary):not(.gold):hover { border-color: var(--ivory); }

  .cl-landing footer { padding: 60px 56px 40px; border-top: 1px solid var(--line); max-width: 1080px; margin: 0 auto; }
  .cl-landing .footer-top { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 40px; margin-bottom: 40px; }
  .cl-landing .footer-brand-word { font-family: 'Fraunces', serif; font-weight: 700; font-size: 18px; margin-bottom: 8px; }
  .cl-landing .footer-tag { font-size: 13px; color: var(--grey); max-width: 280px; line-height: 1.6; }
  .cl-landing .footer-cols { display: flex; gap: 56px; }
  .cl-landing .footer-col-title { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: .15em; color: var(--gold); margin-bottom: 14px; }
  .cl-landing .footer-link { display: block; font-size: 13px; color: var(--grey); text-decoration: none; margin-bottom: 9px; transition: color .2s; cursor: pointer; }
  .cl-landing .footer-link:hover { color: var(--ivory); }
  .cl-landing .footer-bottom { display: flex; justify-content: space-between; align-items: center; padding-top: 24px; border-top: 1px solid var(--line); font-size: 12px; color: var(--grey); flex-wrap: wrap; gap: 12px; }
  .cl-landing .footer-ring { font-family: 'Space Mono', monospace; color: var(--gold); opacity: .6; letter-spacing: .08em; }

  .cl-landing .reveal { opacity: 0; transform: translateY(30px); transition: opacity .8s ease, transform .8s ease; }
  .cl-landing .reveal.visible { opacity: 1; transform: none; }

  @media (max-width: 900px) {
    .cl-landing nav { padding: 16px 24px; }
    .cl-landing .nav-links { display: none; }
    .cl-landing .story-section, .cl-landing .modules-section, .cl-landing .pricing-section { padding: 80px 24px; }
    .cl-landing .story-grid, .cl-landing .story-grid.reverse { grid-template-columns: 1fr; gap: 40px; }
    .cl-landing .story-grid.reverse .story-visual { order: 0; }
    .cl-landing .modules-grid { grid-template-columns: 1fr 1fr; }
    .cl-landing .pricing-grid { grid-template-columns: 1fr 1fr; }
    .cl-landing .phase-row { flex-wrap: wrap; }
    .cl-landing .footer-top { flex-direction: column; }
    .cl-landing .footer-cols { gap: 32px; }
  }
  @media (max-width: 560px) {
    .cl-landing .modules-grid, .cl-landing .pricing-grid { grid-template-columns: 1fr; }
  }
  @media (prefers-reduced-motion: reduce) {
    .cl-landing .ring-3d { transition: none; }
    .cl-landing .reveal { opacity: 1; transform: none; }
  }
`

export default function Landing({ onEntrar }) {
  const rootRef = useRef(null)
  const [ringFlipped, setRingFlipped] = useState(false)
  const [periodo, setPeriodo] = useState('m')

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target) } })
    }, { threshold: .12, rootMargin: '0px 0px -40px 0px' })
    root.querySelectorAll('.reveal').forEach(el => observer.observe(el))

    const nav = root.querySelector('nav')
    const onScroll = () => {
      if (nav) nav.style.background = window.scrollY > 60 ? 'rgba(6,11,20,.96)' : 'linear-gradient(to bottom, rgba(6,11,20,.92), transparent)'
    }
    window.addEventListener('scroll', onScroll)
    return () => { observer.disconnect(); window.removeEventListener('scroll', onScroll) }
  }, [])

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const PRICES = {
    m: { base: '7', baseC: '.99€', pro: '11', proC: '.99€', elite: '16', eliteC: '.99€', periodo: 'por mês' },
    a: { base: '79', baseC: '.90€', pro: '119', proC: '.90€', elite: '169', eliteC: '.90€', periodo: 'por ano' },
  }
  const pr = PRICES[periodo]

  return (
    <div className="cl-landing" ref={rootRef}>
      <style>{LANDING_CSS}</style>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;0,9..144,900;1,9..144,500&family=Inter:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      <div className="grain"></div>

      <nav>
        <div className="nav-mark">
          <div className="nav-ring">CL</div>
          <span className="nav-word">ChampionsLoft</span>
        </div>
        <div className="nav-links">
          <a onClick={() => scrollTo('metodo')}>O Método</a>
          <a onClick={() => scrollTo('modulos')}>Módulos</a>
          <a onClick={() => scrollTo('precos')}>Preços</a>
        </div>
        <button className="nav-cta" onClick={onEntrar}>Entrar</button>
      </nav>

      <section className="hero">
        <div className="hero-bg"></div>
        <div className="hero-grid"></div>
        <div className="hero-content">
          <p className="hero-eyebrow">Toque na anilha</p>

          <div className={`ring-stage${ringFlipped ? ' flipped' : ''}`} onClick={() => setRingFlipped(f => !f)}>
            <div className="ring-3d">
              <div className="ring-face ring-front">
                <div className="ring-front-text">PT · 2026<br />00184</div>
              </div>
              <div className="ring-face ring-back">
                <div className="ring-back-row"><span className="ring-back-label">NOME</span><span className="ring-back-val">TROVÃO</span></div>
                <div className="ring-back-row"><span className="ring-back-label">PERCENTIL</span><span className="ring-back-val">94%</span></div>
                <div className="ring-back-row"><span className="ring-back-label">PROVAS</span><span className="ring-back-val">12</span></div>
                <div className="ring-back-row"><span className="ring-back-label">VITÓRIAS</span><span className="ring-back-val">3</span></div>
                <div className="ring-back-row"><span className="ring-back-label">PAI</span><span className="ring-back-val">PT-23-0091</span></div>
              </div>
            </div>
          </div>
          <div className="ring-hint">Cada anilha esconde uma história de dados</div>

          <h1 className="hero-title">Por trás de cada anel,<br /><span className="em">um campeão</span> em números.</h1>
          <p className="hero-sub">O ChampionsLoft transforma a anilha que já conheces — esse pequeno círculo de metal que carrega gerações — na ferramenta de gestão mais completa da columbofilia portuguesa.</p>
          <div className="hero-actions">
            <button className="btn-gold" onClick={onEntrar}>Começar Grátis</button>
            <a className="btn-outline" onClick={() => scrollTo('metodo')}>Ver Como Funciona ↓</a>
          </div>
        </div>
      </section>

      <section className="story-section" id="metodo">
        <div className="story-inner">
          <div className="story-grid">
            <div>
              <span className="story-eyebrow reveal">Genealogia</span>
              <h2 className="story-title reveal">A árvore que está nas tuas anilhas, finalmente visível.</h2>
              <p className="story-text reveal">Sempre soubeste de quem descende cada pombo — está escrito em papéis, anilhas e na tua memória. O ChampionsLoft transforma isso numa árvore genealógica viva, navegável, que se constrói automaticamente à medida que registas cada acasalamento.</p>
              <div className="story-list reveal">
                <div className="story-item"><span className="story-item-mark">→</span>Pedigree de duas gerações construído a partir das anilhas</div>
                <div className="story-item"><span className="story-item-mark">→</span>Registo automático de borrachinhos ligado aos pais</div>
                <div className="story-item"><span className="story-item-mark">→</span>Alertas de consanguinidade antes de cada cruzamento</div>
              </div>
            </div>
            <div className="story-visual reveal">
              <div className="visual-panel">
                <div className="visual-bar"><div className="visual-dot"></div><div className="visual-dot"></div><div className="visual-dot"></div></div>
                <div className="visual-body">
                  <div className="pedigree-tree">
                    <div className="pedigree-node">TROVÃO<br />PT-24-0184</div>
                    <div className="pedigree-line"></div>
                    <div className="pedigree-row">
                      <div className="pedigree-node">PT-23-0091<br />(pai)</div>
                      <div className="pedigree-node">PT-22-0467<br />(mãe)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="story-section">
        <div className="story-inner">
          <div className="story-grid reverse">
            <div>
              <span className="story-eyebrow reveal">Decisão de soltar</span>
              <h2 className="story-title reveal">O céu que vais enfrentar, antes de abrires o cesto.</h2>
              <p className="story-text reveal">Vento, chuva, visibilidade — fatores que decidem se o teu pombo volta ao pôr-do-sol ou no dia seguinte. O MeteoProva cruza a localização exacta da solta com previsão horária, e diz-te com clareza se as condições favorecem o voo.</p>
              <div className="story-list reveal">
                <div className="story-item"><span className="story-item-mark">→</span>Previsão por hora no ponto exacto de solta</div>
                <div className="story-item"><span className="story-item-mark">→</span>Avaliação automática: favorável, aceitável ou desfavorável</div>
                <div className="story-item"><span className="story-item-mark">→</span>Atalho directo à localização do teu pombal</div>
              </div>
            </div>
            <div className="story-visual reveal">
              <div className="visual-panel">
                <div className="visual-bar"><div className="visual-dot"></div><div className="visual-dot"></div><div className="visual-dot"></div></div>
                <div className="visual-body">
                  <div className="weather-row">
                    <div className="weather-cell"><div className="weather-val">18°</div><div className="weather-lbl">08h</div><div className="weather-wind">12km/h</div></div>
                    <div className="weather-cell"><div className="weather-val">22°</div><div className="weather-lbl">11h</div><div className="weather-wind">18km/h</div></div>
                    <div className="weather-cell"><div className="weather-val">25°</div><div className="weather-lbl">14h</div><div className="weather-wind">24km/h</div></div>
                    <div className="weather-cell"><div className="weather-val">21°</div><div className="weather-lbl">17h</div><div className="weather-wind">15km/h</div></div>
                  </div>
                  <div style={{ marginTop: 20, textAlign: 'center', color: 'var(--blue-bright)', fontFamily: "'Space Mono', monospace", fontSize: 12, letterSpacing: '.05em' }}>🕊️ FAVORÁVEL PARA SOLTA</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="story-section">
        <div className="story-inner">
          <div className="story-grid">
            <div>
              <span className="story-eyebrow reveal">No regresso</span>
              <h2 className="story-title reveal">Hora de chegada. Velocidade calculada. Sem papel, sem erros.</h2>
              <p className="story-text reveal">Anotas a hora de chegada, o ChampionsLoft faz o resto: cruza com a distância e a hora de solta, calcula a velocidade em km/h e m/min automaticamente, e regista no histórico do pombo para sempre.</p>
              <div className="story-list reveal">
                <div className="story-item"><span className="story-item-mark">→</span>Cálculo automático a partir de distância e horários</div>
                <div className="story-item"><span className="story-item-mark">→</span>Histórico de provas visível directamente no pombo</div>
                <div className="story-item"><span className="story-item-mark">→</span>Gráfico de evolução de peso ao longo da época</div>
              </div>
            </div>
            <div className="story-visual reveal">
              <div className="visual-panel">
                <div className="visual-bar"><div className="visual-dot"></div><div className="visual-dot"></div><div className="visual-dot"></div></div>
                <div className="visual-body">
                  <div className="speed-display">
                    <div className="speed-num">1487</div>
                    <div className="speed-unit">METROS / MINUTO</div>
                    <div className="speed-bar"><div className="speed-fill"></div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="story-section">
        <div className="story-inner">
          <div className="story-grid reverse">
            <div>
              <span className="story-eyebrow reveal">Fim de época · Elite AI</span>
              <h2 className="story-title reveal">Um treinador que nunca esquece um número.</h2>
              <p className="story-text reveal">No fecho da época, a inteligência artificial lê os teus dados reais — não genéricos — e devolve um relatório com os pombos a manter, os candidatos a dispensa, e os cruzamentos que fazem sentido para o ano seguinte.</p>
              <div className="story-list reveal">
                <div className="story-item"><span className="story-item-mark">→</span>Resumo executivo da época com base nos teus resultados</div>
                <div className="story-item"><span className="story-item-mark">→</span>Identificação de pombos com desempenho abaixo do esperado</div>
                <div className="story-item"><span className="story-item-mark">→</span>Sugestões de casais por compatibilidade genética</div>
              </div>
            </div>
            <div className="story-visual reveal">
              <div className="visual-panel">
                <div className="visual-bar"><div className="visual-dot"></div><div className="visual-dot"></div><div className="visual-dot"></div></div>
                <div className="visual-body">
                  <div className="ai-line">A época 2026 registou um desempenho excecional, com <strong>3 vitórias outright</strong> em 12 provas disputadas.</div>
                  <div className="ai-quote">Recomendo cruzar Trovão × Brisa do Sol — scores combinados de 94% + 78%, sem consanguinidade directa.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="modules-section" id="modulos">
        <div className="modules-head">
          <span className="story-eyebrow reveal">A época inteira, num só lugar</span>
          <h2 className="story-title reveal">Do ovo ao pódio.</h2>
        </div>

        <div className="phase-row reveal"><span className="phase-label">Antes da Época</span></div>
        <div className="modules-grid reveal" style={{ marginBottom: 1 }}>
          <div className="module-card"><div className="module-icon">🥚</div><div className="module-name">Reprodução</div><div className="module-desc">Acasalamentos, ciclos, pedigree e borrachinho automático.</div></div>
          <div className="module-card"><div className="module-icon">🌾</div><div className="module-name">Alimentação</div><div className="module-desc">Stock de cereais, rações e calculadora de consumo.</div></div>
          <div className="module-card"><div className="module-icon">🏠</div><div className="module-name">Pombais</div><div className="module-desc">Capacidade, ocupação e alertas de sobrelotação.</div></div>
          <div className="module-card"><div className="module-icon">✅</div><div className="module-name">Checklist</div><div className="module-desc">Tarefas sazonais com sugestões e alertas de atraso.</div></div>
        </div>

        <div className="phase-row reveal"><span className="phase-label">Durante a Época</span></div>
        <div className="modules-grid reveal" style={{ marginBottom: 1 }}>
          <div className="module-card"><div className="module-icon">🏆</div><div className="module-name">Provas</div><div className="module-desc">Encestamento, resultados e velocidade automática.</div></div>
          <div className="module-card"><div className="module-icon">🎯</div><div className="module-name">Treinos</div><div className="module-desc">Registo de voos livres com pombos participantes.</div></div>
          <div className="module-card"><div className="module-icon">🌦️</div><div className="module-name">MeteoProva</div><div className="module-desc">Condições no exacto ponto e hora de solta.</div></div>
          <div className="module-card"><div className="module-icon">🏥</div><div className="module-name">Saúde</div><div className="module-desc">Acompanhamento clínico, vacinas e peso.</div></div>
        </div>

        <div className="phase-row reveal"><span className="phase-label">Fim da Época</span></div>
        <div className="modules-grid reveal">
          <div className="module-card"><div className="module-icon">📊</div><div className="module-name">Relatórios</div><div className="module-desc">Desempenho, finanças e saúde do efectivo.</div></div>
          <div className="module-card"><div className="module-icon">🧠</div><div className="module-name">Relatório IA</div><div className="module-desc">Análise e recomendações para a próxima época.</div></div>
          <div className="module-card"><div className="module-icon">💰</div><div className="module-name">Finanças</div><div className="module-desc">Receitas, despesas e custo por pombo.</div></div>
          <div className="module-card"><div className="module-icon">🌐</div><div className="module-name">Comunidade</div><div className="module-desc">Feed, ranking e desafios entre columbófilos.</div></div>
        </div>
      </section>

      <section className="testi-section">
        <div className="testi-mark">"</div>
        <p className="testi-text reveal">Trinta anos a apontar tudo num caderno. Achei que ia estranhar o ecrã — em duas semanas já não me lembro de como vivia sem saber a velocidade de cada pombo ao segundo.</p>
        <div className="testi-author reveal"><strong>Joaquim Patrício</strong> — Columbófilo, Torres Vedras, 31 anos de federado</div>
      </section>

      <section className="pricing-section" id="precos">
        <div className="pricing-head">
          <span className="story-eyebrow reveal">Planos</span>
          <h2 className="story-title reveal">Comece de graça. Cresça quando o efectivo crescer.</h2>
          <div className="pricing-toggle reveal">
            <button className={`toggle-btn${periodo === 'm' ? ' active' : ''}`} onClick={() => setPeriodo('m')}>Mensal</button>
            <button className={`toggle-btn${periodo === 'a' ? ' active' : ''}`} onClick={() => setPeriodo('a')}>Anual — 2 meses grátis</button>
          </div>
        </div>

        <div className="pricing-grid reveal">
          <div className="plan-card">
            <div className="plan-name">Gratuito</div>
            <div className="plan-desc">Para conhecer a casa</div>
            <div className="plan-price">0€</div>
            <div className="plan-period">para sempre</div>
            <div className="plan-feats">
              <div className="plan-feat on"><span className="plan-feat-mark">●</span>Até 15 pombos</div>
              <div className="plan-feat on"><span className="plan-feat-mark">●</span>Provas e treinos</div>
              <div className="plan-feat"><span className="plan-feat-mark">○</span>Comunidade</div>
              <div className="plan-feat"><span className="plan-feat-mark">○</span>Relatório IA</div>
            </div>
            <button className="btn-plan" onClick={onEntrar}>Começar Grátis</button>
          </div>

          <div className="plan-card">
            <div className="plan-name">Base</div>
            <div className="plan-desc">O essencial sem limites</div>
            <div className="plan-price">{pr.base}<span>{pr.baseC}</span></div>
            <div className="plan-period">{pr.periodo}</div>
            <div className="plan-feats">
              <div className="plan-feat on"><span className="plan-feat-mark">●</span>Pombos ilimitados</div>
              <div className="plan-feat on"><span className="plan-feat-mark">●</span>Reprodução completa</div>
              <div className="plan-feat on"><span className="plan-feat-mark">●</span>Alimentação e checklist</div>
              <div className="plan-feat"><span className="plan-feat-mark">○</span>Relatório IA</div>
            </div>
            <button className="btn-plan" onClick={onEntrar}>Subscrever</button>
          </div>

          <div className="plan-card feat">
            <div className="plan-name">Profissional</div>
            <div className="plan-desc">Para quem disputa a sério</div>
            <div className="plan-price">{pr.pro}<span>{pr.proC}</span></div>
            <div className="plan-period">{pr.periodo}</div>
            <div className="plan-feats">
              <div className="plan-feat on"><span className="plan-feat-mark">●</span>Tudo do Base</div>
              <div className="plan-feat on"><span className="plan-feat-mark">●</span>Comunidade e ranking</div>
              <div className="plan-feat on"><span className="plan-feat-mark">●</span>MeteoProva</div>
              <div className="plan-feat"><span className="plan-feat-mark">○</span>Relatório IA</div>
            </div>
            <button className="btn-plan primary" onClick={onEntrar}>Subscrever</button>
          </div>

          <div className="plan-card gold">
            <div className="plan-name" style={{ color: 'var(--gold)' }}>Elite AI</div>
            <div className="plan-desc">O treinador que não dorme</div>
            <div className="plan-price" style={{ color: 'var(--gold)' }}>{pr.elite}<span>{pr.eliteC}</span></div>
            <div className="plan-period">{pr.periodo}</div>
            <div className="plan-feats">
              <div className="plan-feat on gold-mark"><span className="plan-feat-mark">●</span>Tudo do Profissional</div>
              <div className="plan-feat on gold-mark"><span className="plan-feat-mark">●</span>Relatório IA de época</div>
              <div className="plan-feat on gold-mark"><span className="plan-feat-mark">●</span>Sugestão de casais por IA</div>
            </div>
            <button className="btn-plan gold" onClick={onEntrar}>Subscrever Elite AI</button>
          </div>
        </div>
      </section>

      <footer>
        <div className="footer-top">
          <div>
            <div className="footer-brand-word">ChampionsLoft</div>
            <p className="footer-tag">A ferramenta de gestão columbófila que transforma a anilha do teu pombo numa história de dados completa.</p>
          </div>
          <div className="footer-cols">
            <div>
              <div className="footer-col-title">PRODUTO</div>
              <a className="footer-link" onClick={() => scrollTo('metodo')}>O Método</a>
              <a className="footer-link" onClick={() => scrollTo('modulos')}>Módulos</a>
              <a className="footer-link" onClick={() => scrollTo('precos')}>Preços</a>
            </div>
            <div>
              <div className="footer-col-title">LEGAL</div>
              <a className="footer-link">Termos de Uso</a>
              <a className="footer-link">Privacidade</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 ChampionsLoft. Todos os direitos reservados.</span>
          <span className="footer-ring">PT · 2026 · CHAMPIONSLOFT</span>
        </div>
      </footer>
    </div>
  )
}
