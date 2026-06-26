import { ToastProvider } from './components/ui'
import { IdiomaContext, useIdiomaState } from './hooks/useIdioma'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { useNotificacoes, PainelNotificacoes } from './components/Notificacoes'

function Conteudo() {
  const { user } = useAuth()
  const { naoLidas } = useNotificacoes()
  return <div style={{ color:'#fff', fontSize:20 }}>✅ Teste 3 OK — Notificacoes: {naoLidas} não lidas</div>
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
