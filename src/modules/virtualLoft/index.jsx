// src/modules/virtualLoft/index.jsx
// Entry point do VirtualLoft — router interno do jogo
import { useState, useEffect } from 'react'
import CarreiraCreate from './screens/CarreiraCreate'
import { useCarreira } from './hooks/useCarreira'

// UUID do superadmin — só ele vê este módulo
const ADMIN_UUID = '30709f29-152e-4813-ac7f-e3376c5e0646'

export default function VirtualLoftApp({ user, idiomaApp = 'pt' }) {
  // Segurança: só o admin vê
  if (user?.id !== ADMIN_UUID) return null

  const { carreira, loading, criarCarreira, carregarCarreira } = useCarreira()
  const [screen, setScreen] = useState('loading')

  useEffect(() => {
    // Verificar se há carreira guardada
    const temCarreira = carregarCarreira()
    setScreen(temCarreira ? 'hub' : 'criar')
  }, [])

  const handleCriar = async (form) => {
    await criarCarreira(form)
    setScreen('hub')
  }

  if (screen === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: '#030812', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🕊️</div>
          <div style={{ color: '#D4AF37', fontSize: 14, fontWeight: 700, letterSpacing: 2 }}>A CARREGAR...</div>
        </div>
      </div>
    )
  }

  if (screen === 'criar') {
    return <CarreiraCreate onCriar={handleCriar} idiomaApp={idiomaApp} />
  }

  // Hub principal — placeholder por agora
  if (screen === 'hub' && carreira) {
    return (
      <div style={{ minHeight: '100vh', background: '#030812', color: '#fff', padding: 20, fontFamily: 'inherit' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, padding: '12px 16px', background: 'rgba(255,255,255,.03)', borderRadius: 14, border: '1px solid rgba(255,255,255,.06)' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{carreira.logotipo} {carreira.nomePombal}</div>
            <div style={{ fontSize: 12, color: '#7A8699' }}>{carreira.nomeGestor} · Época {carreira.epoca} · Semana {carreira.semana}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#D4AF37' }}>{carreira.orcamento.toLocaleString()}€</div>
            <div style={{ fontSize: 11, color: '#7A8699' }}>{carreira.pombos.length} pombos</div>
          </div>
        </div>

        {/* Placeholder hub */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
          {[
            { icon: '🐦', label: 'Pombos', n: carreira.pombos.length, cor: '#4C8DFF' },
            { icon: '🏠', label: 'Pombal', n: 'Nível 1', cor: '#2DD4A7' },
            { icon: '👥', label: 'Staff', n: '0 contratados', cor: '#D4AF37' },
            { icon: '🏆', label: 'Provas', n: 'Época 1', cor: '#A855F7' },
            { icon: '💰', label: 'Finanças', n: carreira.orcamento.toLocaleString()+'€', cor: '#2DD4A7' },
            { icon: '📊', label: 'Rankings', n: 'Em breve', cor: '#f87171' },
          ].map((item, i) => (
            <div key={i} style={{ padding: '16px', background: 'rgba(255,255,255,.03)', border: `1px solid ${item.cor}20`, borderRadius: 12, cursor: 'pointer' }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{item.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: item.cor }}>{item.label}</div>
              <div style={{ fontSize: 11, color: '#7A8699', marginTop: 2 }}>{item.n}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(212,175,55,.06)', border: '1px solid rgba(212,175,55,.15)', borderRadius: 10, fontSize: 12, color: '#D4AF37', textAlign: 'center' }}>
          🚧 Hub em construção — módulos a ser desenvolvidos
        </div>

        <button onClick={() => { localStorage.removeItem('vl_carreira'); setScreen('criar') }}
          style={{ marginTop: 12, width: '100%', padding: '10px', background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.2)', borderRadius: 10, color: '#f87171', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
          🗑️ Apagar carreira e recomeçar
        </button>
      </div>
    )
  }

  return null
}
