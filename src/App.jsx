import { useState } from 'react'
import { ToastProvider } from './components/ui'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { IdiomaContext, useIdiomaState, useIdioma } from './hooks/useIdioma'

function Conteudo() {
  const { user, loading } = useAuth()
  const { t } = useIdioma()
  
  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#050D1A', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}>
      A carregar...
    </div>
  )
  
  if (!user) return (
    <div style={{ minHeight:'100vh', background:'#050D1A', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
      <div style={{ color:'#fff', fontSize:24 }}>🕊️ ChampionsLoft</div>
      <div style={{ color:'#7A8699' }}>App mínima a funcionar</div>
    </div>
  )
  
  return (
    <div style={{ minHeight:'100vh', background:'#050D1A', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}>
      Bem-vindo, {user.email}
    </div>
  )
}

export default function App() {
  const { idioma, setIdioma } = useIdiomaState()
  return (
    <IdiomaContext.Provider value={idioma}>
      <ToastProvider>
        <AuthProvider>
          <Conteudo />
        </AuthProvider>
      </ToastProvider>
    </IdiomaContext.Provider>
  )
}

 
