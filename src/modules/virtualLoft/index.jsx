// src/modules/virtualLoft/index.jsx
import { useState, useEffect } from 'react'
import CarreiraCreate from './screens/CarreiraCreate'
import HubPombal from './screens/HubPombal'
import VLPombos from './screens/VLPombos'
import VLTreinos from './screens/VLTreinos'
import VLPombal from './screens/VLPombal'
import VLStaff from './screens/VLStaff'
import VLProvas from './screens/VLProvas'
import VLFinancas from './screens/VLFinancas'
import { useCarreira } from './hooks/useCarreira'

const ADMIN_UUID = '30709f29-152e-4813-ac7f-e3376c5e0646'

// Motor de progressão inline
function avancarSemana(carreira, idioma) {
  const nova = { ...carreira }
  const custoSemanal = Math.round((nova.staff||[]).reduce((s,m)=>s+(m.salario||0),0)/4)
  const custoAlim = nova.pombos.length * 5
  nova.orcamento = Math.max(0, nova.orcamento - custoSemanal - custoAlim)
  nova.reputacao = Math.min(100, (nova.reputacao||5) + 0.5)
  if (nova.reputacao>=90) nova.nivel_reputacao='olimpico'
  else if (nova.reputacao>=70) nova.nivel_reputacao='internacional'
  else if (nova.reputacao>=50) nova.nivel_reputacao='nacional'
  else if (nova.reputacao>=35) nova.nivel_reputacao='regional'
  else if (nova.reputacao>=20) nova.nivel_reputacao='distrital'
  else nova.nivel_reputacao='local'
  nova.semana = (nova.semana||1) + 1
  if (nova.semana > 40) { nova.semana = 1; nova.epoca = (nova.epoca||1) + 1 }
  nova.ultimo_custo_semanal = custoSemanal + custoAlim
  nova.eventos_semana = []
  return nova
}

export default function VirtualLoftApp({ user, idiomaApp = 'pt' }) {
  if (user?.id !== ADMIN_UUID) return null

  const { carreira, criarCarreira, guardarCarreira } = useCarreira()
  const [modulo, setModulo] = useState(null)

  const idioma = carreira?.idioma || idiomaApp

  const handleCriar = async (form) => {
    await criarCarreira(form)
    setModulo(null)
  }

  const handleNavegar = (mod) => {
    setModulo(mod)
  }

  const handleVoltar = () => {
    setModulo(null)
  }

  const handleGuardar = (dados) => {
    guardarCarreira(dados)
  }

  const handleApagar = () => {
    localStorage.removeItem('vl_carreira')
    window.location.reload()
  }

  const handleAvancarSemana = () => {
    if (!carreira) return
    const nova = avancarSemana(carreira, idioma)
    guardarCarreira(nova)
  }

  // Sem carreira — criar
  if (!carreira) {
    return <CarreiraCreate onCriar={handleCriar} idiomaApp={idiomaApp} />
  }

  // Com módulo activo
  if (modulo) {
    const props = { carreira, onVoltar: handleVoltar, onGuardar: handleGuardar, idioma }
    if (modulo === 'pombos')   return <VLPombos   {...props} />
    if (modulo === 'treinos')  return <VLTreinos  {...props} />
    if (modulo === 'pombal')   return <VLPombal   {...props} />
    if (modulo === 'staff')    return <VLStaff    {...props} />
    if (modulo === 'provas')   return <VLProvas   {...props} />
    if (modulo === 'financas') return <VLFinancas {...props} />
    return (
      <div style={{ minHeight:'100vh', background:'#030812', color:'#fff', display:'flex', flexDirection:'column', fontFamily:'inherit' }}>
        <div style={{ padding:'14px 16px', borderBottom:'1px solid rgba(255,255,255,.05)', display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={handleVoltar} style={{ background:'rgba(255,255,255,.06)', border:'none', borderRadius:8, width:32, height:32, color:'#7A8699', cursor:'pointer', fontSize:16 }}>←</button>
          <div style={{ fontSize:16, fontWeight:800, textTransform:'capitalize' }}>{modulo}</div>
        </div>
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12 }}>
          <div style={{ fontSize:48 }}>🚧</div>
          <div style={{ fontSize:16, fontWeight:700, color:'#D4AF37' }}>Em breve</div>
        </div>
      </div>
    )
  }

  // Hub principal
  return (
    <HubPombal
      carreira={carreira}
      onNavegar={handleNavegar}
      onApagarCarreira={handleApagar}
      onAvancarSemana={handleAvancarSemana}
      idioma={idioma}
    />
  )
}
