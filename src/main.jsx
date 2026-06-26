import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const root = document.getElementById('root')

try {
  createRoot(root).render(<App />)
} catch(e) {
  root.innerHTML = '<div style="position:fixed;inset:0;background:#050D1A;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:20px;font-family:sans-serif"><div style="font-size:32px">⚠️</div><div style="color:#f87171;font-size:12px;background:#101F40;padding:8px;border-radius:6px;max-width:300px;word-break:break-all">' + String(e?.message||e).slice(0,200) + '</div><button onclick="localStorage.clear();location.reload()" style="background:#1E5FD9;color:#fff;border:none;padding:10px 20px;border-radius:6px;cursor:pointer">Limpar e recarregar</button></div>'
}
