import { ToastProvider } from './components/ui'
import { IdiomaContext, useIdiomaState } from './hooks/useIdioma'

export default function App() {
  const { idioma } = useIdiomaState()
  return (
    <IdiomaContext.Provider value={idioma}>
      <ToastProvider>
        <div style={{ minHeight:'100vh', background:'#050D1A', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ color:'#fff', fontSize:24 }}>✅ Teste 1 OK — ui + useIdioma</div>
        </div>
      </ToastProvider>
    </IdiomaContext.Provider>
  )
}
