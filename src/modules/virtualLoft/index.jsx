// src/modules/virtualLoft/index.jsx
import { useState } from 'react'
import CarreiraCreate from './screens/CarreiraCreate'
import HubPombal from './screens/HubPombal'
import VLPombos from './screens/VLPombos'
import VLTreinos from './screens/VLTreinos'
import VLPombal from './screens/VLPombal'
import VLStaff from './screens/VLStaff'
import VLProvas from './screens/VLProvas'
import VLFinancas from './screens/VLFinancas'
import { useCarreira } from './hooks/useCarreira'


// Motor de progressão inline
function avancarSemana(carreira, idioma) {
  let nova = { ...carreira }
  // Pagar salários semanais (salário/4)
  const custoSemanal = Math.round((nova.staff||[]).reduce((s,m)=>s+(m.salario||0),0)/4)
  const custoAlim = nova.pombos.length * 5
  nova.orcamento = Math.max(0, nova.orcamento - custoSemanal - custoAlim)
  // Ganho de reputação
  nova.reputacao = Math.min(100, nova.reputacao + 0.5)
  if (nova.reputacao>=90) nova.nivel_reputacao='olimpico'
  else if (nova.reputacao>=70) nova.nivel_reputacao='internacional'
  else if (nova.reputacao>=50) nova.nivel_reputacao='nacional'
  else if (nova.reputacao>=35) nova.nivel_reputacao='regional'
  else if (nova.reputacao>=20) nova.nivel_reputacao='distrital'
  else nova.nivel_reputacao='local'
  // Avançar semana/época
  nova.semana = nova.semana + 1
  if (nova.semana > 40) { nova.semana = 1; nova.epoca = nova.epoca + 1 }
  nova.ultimo_custo_semanal = custoSemanal + custoAlim
  nova.eventos_semana = []
  return nova
}

const ADMIN_UUID = '30709f29-152e-4813-ac7f-e3376c5e0646'

export default function VirtualLoftApp({ user, idiomaApp = 'pt' }) {
  if (user?.id !== ADMIN_UUID) return null

  const { carreira, criarCarreira, guardarCarreira } = useCarreira()
  const [modulo, setModulo] = useState(null)
  const idioma = carreira?.idioma || idiomaApp

  const screen = modulo ? 'modulo' : carreira ? 'hub' : 'criar'

  const handleCriar = async (form) => { await criarCarreira(form); setModulo(null) }
  const handleVoltar = () => setModulo(null)
  const handleGuardar = (dados) => guardarCarreira(dados)
  const handleApagar = () => { localStorage.removeItem('vl_carreira'); window.location.reload() }
  const handleAvancarSemana = () => {
    if (!carreira) return
    const novaCarreira = avancarSemana(carreira, idioma)
    guardarCarreira(novaCarreira)
  }

  if (screen === 'criar') return <CarreiraCreate onCriar={handleCriar} idiomaApp={idiomaApp} />

  if (screen === 'modulo' && carreira) {
    const props = { carreira, onVoltar: handleVoltar, onGuardar: handleGuardar, idioma }
    if (modulo === 'pombos')   return <VLPombos   {...props} />
    if (modulo === 'treinos')  return <VLTreinos  {...props} />
    if (modulo === 'pombal')   return <VLPombal   {...props} />
    if (modulo === 'staff')    return <VLStaff    {...props} />
    if (modulo === 'provas')   return <VLProvas   {...props} />
    if (modulo === 'financas') return <VLFinancas {...props} />
    return null
  }

  if (screen === 'hub' && carreira) return (
    <HubPombal
      carreira={carreira}
      onNavegar={setModulo}
      onApagarCarreira={handleApagar}
      onAvançarSemana={handleAvancarSemana}
      idioma={idioma}
    />
  )

  return null
}
