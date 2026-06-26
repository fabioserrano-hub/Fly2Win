import { useState, useEffect } from 'react'
import { ToastProvider, Spinner } from './components/ui'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { supabase, db } from './lib/supabase'
import { useFeatureFlags } from './hooks/useFeatureFlags'
import { useNotificacoes, PainelNotificacoes } from './components/Notificacoes'
import ConquistasPage from './components/Conquistas'
import Onboarding, { useOnboarding } from './components/Onboarding'
import { IdiomaContext, useIdiomaState, useIdioma, IDIOMAS } from './hooks/useIdioma'
import { usePushNotificacoes } from './hooks/useNotificacoes'
import { useLicenca } from './hooks/useLicenca'
import Landing      from './pages/Landing'
import Login        from './pages/Login'
import Dashboard    from './pages/Dashboard'
import Pombos       from './pages/Pombos'
import Pombais      from './pages/Pombais'
import Provas       from './pages/Provas'
import Treinos      from './pages/Treinos'
import Saude        from './pages/Saude'
import Financas     from './pages/Financas'
import Reproducao   from './pages/Reproducao'
import Pedigree     from './pages/Pedigree'
import Alimentacao  from './pages/Alimentacao'
import Tratamentos  from './pages/Tratamentos'
import Calendario   from './pages/Calendario'
import Checklist    from './pages/Checklist'
import Relatorios   from './pages/Relatorios'
import Epoca        from './pages/Epoca'
import Meteorologia from './pages/Meteorologia'
import Comunidade   from './pages/Comunidade'
import Ligas        from './pages/Ligas'
import Precos       from './pages/Precos'
import Partilha     from './pages/Partilha'
import Admin        from './pages/Admin'
import SeleccionadorCasais from './pages/SeleccionadorCasais'
import ImportacaoCSV from './pages/ImportacaoCSV'
import Mensagens    from './pages/Mensagens'
import Marketplace  from './pages/Marketplace'
import Analiticas   from './pages/Analiticas'
import RastreioForma from './pages/RastreioForma'
import Clubes       from './pages/Clubes'
import Leiloes      from './pages/Leiloes'
import Afiliados    from './pages/Afiliados'
import ClubesPersonalizados from './pages/ClubesPersonalizados'
import LigaClubes   from './pages/LigaClubes'
import Fundadores   from './pages/Fundadores'
import Carteira     from './pages/Carteira'
import Exportacao   from './pages/Exportacao'
import PerfilPublico from './pages/PerfilPublico'
import Perfil       from './pages/Perfil'

function Conteudo() {
  const { user, loading } = useAuth()
  const { flags } = useFeatureFlags()
  const { naoLidas } = useNotificacoes()
  const { t } = useIdioma()
  const { plano } = useLicenca()

  if (loading) return <div style={{ color:'#fff', fontSize:20, textAlign:'center' }}>A carregar...</div>

  return (
    <div style={{ color:'#fff', fontSize:16, textAlign:'center', display:'flex', flexDirection:'column', gap:8 }}>
      <div>✅ Teste 5 OK — Todos os imports carregados</div>
      <div style={{ color:'#2DD4A7' }}>User: {user?.email}</div>
      <div style={{ color:'#D4AF37' }}>Plano: {plano} | Notif: {naoLidas}</div>
      <div style={{ color:'#94a3b8', fontSize:12 }}>Módulos: Dashboard, Pombos, Provas, Ligas, Clubes... ✓</div>
    </div>
  )
}

export default function App() {
  const { idioma } = useIdiomaState()
  return (
    <IdiomaContext.Provider value={idioma}>
      <ToastProvider>
        <AuthProvider>
          <div style={{ minHeight:'100vh', background:'#050D1A', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
            <Conteudo />
          </div>
        </AuthProvider>
      </ToastProvider>
    </IdiomaContext.Provider>
  )
}
