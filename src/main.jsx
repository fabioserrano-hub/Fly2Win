import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Error Boundary global
class ErrorBoundary extends StrictMode.__proto__.constructor {
  constructor(p) { super(p); this.state = { erro: null } }
  static getDerivedStateFromError(e) { return { erro: e } }
  componentDidCatch(e, info) {
    // Mostrar erro no ecrã
    const div = document.createElement('div')
    div.style.cssText = 'position:fixed;inset:0;background:#050D1A;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:20px;font-family:sans-serif'
    div.innerHTML = '<div style="font-size:36px">🕊️</div>'
      + '<div style="color:#fff;font-size:15px;font-weight:600">Erro ao carregar</div>'
      + '<div style="color:#f87171;font-size:11px;background:#101F40;padding:8px 12px;border-radius:8px;max-width:320px;word-break:break-all;text-align:left">' 
      + String(e?.message || e).slice(0, 300) + '</div>'
      + '<button onclick="localStorage.clear();location.reload()" style="background:#1E5FD9;color:#fff;border:none;padding:12px 28px;border-radius:8px;font-size:14px;cursor:pointer">🔄 Limpar e recarregar</button>'
    document.body.appendChild(div)
  }
  render() { return this.state.erro ? null : this.props.children }
}

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
