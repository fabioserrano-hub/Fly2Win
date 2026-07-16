// src/modules/virtualLoft/index.jsx
import { useState, useEffect } from 'react'
import CarreiraCreate from './screens/CarreiraCreate'
import HubPombal from './screens/HubPombal'
import VLPombos from './screens/VLPombos'
import { useCarreira } from './hooks/useCarreira'

const ADMIN_UUID = '30709f29-152e-4813-ac7f-e3376c5e0646'

export default function VirtualLoftApp({ user, idiomaApp = 'pt' }) {
  if (user?.id !== ADMIN_UUID) return null

  const { carreira, criarCarreira, carregarCarreira } = useCarreira()
  const [screen, setScreen] = useState('loading')
  const [moduloAtivo, setModuloAtivo] = useState(null)

  useEffect(() => {
    const temCarreira = carregarCarreira()
    setScreen(temCarreira ? 'hub' : 'criar')
  }, [])

  const handleCriar = async (form) => {
    await criarCarreira(form)
    setScreen('hub')
  }

  const handleNavegar = (modulo) => {
    setModuloAtivo(modulo)
    setScreen('modulo')
  }

  const handleVoltar = () => {
    setModuloAtivo(null)
    setScreen('hub')
  }

  const handleApagar = () => {
    localStorage.removeItem('vl_carreira')
    setScreen('criar')
    setModuloAtivo(null)
  }

  const idioma = carreira?.idioma || idiomaApp

  if (screen === 'loading') return (
    <div style={{ minHeight:'100vh', background:'#030812', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🕊️</div>
        <div style={{ color:'#D4AF37', fontSize:14, fontWeight:700, letterSpacing:2 }}>
          {idiomaApp==='en'?'LOADING...':idiomaApp==='es'?'CARGANDO...':'A CARREGAR...'}
        </div>
      </div>
    </div>
  )

  if (screen === 'criar') return <CarreiraCreate onCriar={handleCriar} idiomaApp={idiomaApp} />

  if (screen === 'modulo' && carreira) {
    if (moduloAtivo === 'pombos') return <VLPombos carreira={carreira} onVoltar={handleVoltar} idioma={idioma} />
    return (
      <div style={{ minHeight:'100vh', background:'#030812', color:'#fff', fontFamily:'inherit', display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'14px 16px', borderBottom:'1px solid rgba(255,255,255,.05)', display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={handleVoltar} style={{ background:'rgba(255,255,255,.06)', border:'none', borderRadius:8, width:32, height:32, color:'#7A8699', cursor:'pointer', fontSize:16 }}>←</button>
          <div style={{ fontSize:16, fontWeight:800, textTransform:'capitalize' }}>{moduloAtivo}</div>
        </div>
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12 }}>
          <div style={{ fontSize:48 }}>🚧</div>
          <div style={{ fontSize:16, fontWeight:700, color:'#D4AF37' }}>Em construção</div>
          <div style={{ fontSize:12, color:'#475569' }}>Este módulo está a ser desenvolvido</div>
        </div>
      </div>
    )
  }

  if (screen === 'hub' && carreira) return (
    <HubPombal carreira={carreira} onNavegar={handleNavegar} onApagarCarreira={handleApagar} idioma={idioma} />
  )

  return null
}
