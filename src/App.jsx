import { ToastProvider } from './components/ui'
import { IdiomaContext, useIdiomaState } from './hooks/useIdioma'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { useNotificacoes } from './components/Notificacoes'
import ConquistasPage from './components/Conquistas'
import { useLicenca } from './hooks/useLicenca'

function Conteudo() {
  const { user } = useAuth()
  const { naoLidas } = useNotificacoes()
  const { plano, temElite } = useLicenca()
  return <div style={{ color:'#fff', fontSize:20 }}>✅ Teste 4 OK — Plano: {plano} | Elite: {temElite?'sim':'não'}</div>
}

export default function App() {
  const { idioma } = useIdiomaState()
  return (
    <IdiomaContext.Provider value={idioma}>
      <ToastProvider>
        <AuthProvider>
          <div style={{ minHeight:'100vh', background:'#050D1A', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Conteudo />
          </div>
        </AuthProvider>
      </ToastProvider>
    </IdiomaContext.Provider>
  )
}
