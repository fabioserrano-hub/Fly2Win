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
import Patrocinadores from './pages/Patrocinadores'
import Forum        from './pages/Forum'
import Dicas        from './pages/Dicas'
import Documentos   from './pages/Documentos'
import PaginaSucesso from './pages/PaginaSucesso'

function Conteudo() {
  const { user, loading } = useAuth()
  const [erro, setErro] = useState(null)

  if (loading) return <div style={{ color:'#fff' }}>A carregar...</div>
  if (erro) return <div style={{ color:'#f87171', padding:20 }}>ERRO: {erro}</div>

  try {
    if (!user) return (
      <div style={{ color:'#fff', fontSize:18 }}>
        ✅ Sem sessão — Landing/Login OK
      </div>
    )
    return (
      <div style={{ color:'#fff', fontSize:18 }}>
        ✅ Com sessão — {user.email}<br/>
        <Dashboard nav={() => {}} />
      </div>
    )
  } catch(e) {
    return <div style={{ color:'#f87171', padding:20 }}>ERRO no render: {e.message}</div>
  }
}

export default function App() {
  const { idioma } = useIdiomaState()
  return (
    <IdiomaContext.Provider value={idioma}>
      <ToastProvider>
        <AuthProvider>
          <div style={{ minHeight:'100vh', background:'#050D1A', padding:20 }}>
            <Conteudo />
          </div>
        </AuthProvider>
      </ToastProvider>
    </IdiomaContext.Provider>
  )
}
