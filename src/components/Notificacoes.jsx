import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const TIPO_ICON = {
  eclosao:    '🐣',
  tratamento: '🧪',
  prova:      '🏆',
  liga:       '⚔️',
  conquista:  '🏅',
  sistema:    '📢',
  clube:      '🎽',
}
const TIPO_COR = {
  eclosao:    '#2DD4A7',
  tratamento: '#f97316',
  prova:      '#D4AF37',
  liga:       '#4C8DFF',
  conquista:  '#A855F7',
  sistema:    '#94a3b8',
  clube:      '#D4AF37',
}

// ─── HOOK ─────────────────────────────────────────────
export function useNotificacoes() {
  const { user } = useAuth()
  const [notifs, setNotifs] = useState([])
  const [naoLidas, setNaoLidas] = useState(0)

  const load = useCallback(async () => {
    if (!user?.id) return
    const { data } = await supabase.from('notificacoes')
      .select('*').eq('user_id', user.id)
      .order('created_at', { ascending:false }).limit(50)
    const lista = data || []
    setNotifs(lista)
    setNaoLidas(lista.filter(n=>!n.lida).length)
  }, [user?.id])

  useEffect(() => {
    load()
    if (!user?.id) return
    // Subscrever em tempo real
    const sub = supabase.channel('notificacoes_'+user.id)
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'notificacoes', filter:`user_id=eq.${user.id}` },
        (payload) => {
          setNotifs(prev => [payload.new, ...prev])
          setNaoLidas(n => n+1)
          // Push notification nativo
          if (Notification.permission === 'granted') {
            new Notification(payload.new.titulo, { body: payload.new.corpo||'', icon:'/icons/icon-192.png', tag:payload.new.id })
          }
        })
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [user?.id, load])

  const marcarLida = async (id) => {
    await supabase.from('notificacoes').update({ lida:true }).eq('id', id)
    setNotifs(prev => prev.map(n => n.id===id?{...n,lida:true}:n))
    setNaoLidas(n => Math.max(0, n-1))
  }

  const marcarTodasLidas = async () => {
    await supabase.from('notificacoes').update({ lida:true }).eq('user_id', user.id).eq('lida', false)
    setNotifs(prev => prev.map(n=>({...n,lida:true})))
    setNaoLidas(0)
  }

  return { notifs, naoLidas, marcarLida, marcarTodasLidas, reload:load }
}

// ─── PAINEL DE NOTIFICAÇÕES ───────────────────────────
export function PainelNotificacoes({ onFechar, notifs, naoLidas, marcarLida, marcarTodasLidas }) {
  const grupos = {
    hoje: notifs.filter(n => new Date(n.created_at).toDateString() === new Date().toDateString()),
    anteriores: notifs.filter(n => new Date(n.created_at).toDateString() !== new Date().toDateString()),
  }

  return (
    <div style={{ position:'fixed', top:58, right:8, width:340, maxHeight:'80vh', zIndex:400, background:'#0B1830', border:'1px solid #1B2D52', borderRadius:14, boxShadow:'0 8px 40px rgba(0,0,0,.6)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 16px', borderBottom:'1px solid #1B2D52', flexShrink:0 }}>
        <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>
          🔔 Notificações
          {naoLidas > 0 && <span style={{ marginLeft:8, fontSize:11, background:'#1E5FD9', color:'#fff', borderRadius:99, padding:'1px 8px' }}>{naoLidas}</span>}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {naoLidas > 0 && <button onClick={marcarTodasLidas} style={{ fontSize:10, color:'#4C8DFF', background:'none', border:'none', cursor:'pointer' }}>Marcar todas lidas</button>}
          <button onClick={onFechar} style={{ background:'none', border:'none', color:'#475569', cursor:'pointer', fontSize:18, lineHeight:1 }}>✕</button>
        </div>
      </div>

      {/* Lista */}
      <div style={{ flex:1, overflowY:'auto' }}>
        {notifs.length === 0 ? (
          <div style={{ textAlign:'center', padding:40, color:'#475569' }}>
            <div style={{ fontSize:32, marginBottom:8 }}>🔔</div>
            <div style={{ fontSize:13 }}>Sem notificações</div>
          </div>
        ) : (
          <>
            {grupos.hoje.length > 0 && (
              <>
                <div style={{ fontSize:10, color:'#475569', fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', padding:'10px 16px 4px' }}>HOJE</div>
                {grupos.hoje.map(n => <NotifItem key={n.id} n={n} onLida={marcarLida}/>)}
              </>
            )}
            {grupos.anteriores.length > 0 && (
              <>
                <div style={{ fontSize:10, color:'#475569', fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', padding:'10px 16px 4px' }}>ANTERIORES</div>
                {grupos.anteriores.map(n => <NotifItem key={n.id} n={n} onLida={marcarLida}/>)}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function NotifItem({ n, onLida }) {
  const cor = TIPO_COR[n.tipo] || '#94a3b8'
  return (
    <div onClick={() => onLida(n.id)} style={{
      display:'flex', gap:10, padding:'10px 16px',
      background: n.lida ? 'transparent' : `${cor}08`,
      borderLeft: n.lida ? '3px solid transparent' : `3px solid ${cor}`,
      cursor:'pointer', borderBottom:'1px solid rgba(255,255,255,.04)',
      transition:'background .15s',
    }}>
      <div style={{ fontSize:20, flexShrink:0, marginTop:1 }}>{TIPO_ICON[n.tipo]||'📢'}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:12, fontWeight: n.lida ? 400 : 700, color: n.lida ? '#94a3b8' : '#fff', marginBottom:2 }}>{n.titulo}</div>
        {n.corpo && <div style={{ fontSize:11, color:'#7A8699', lineHeight:1.5, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{n.corpo}</div>}
        <div style={{ fontSize:10, color:'#475569', marginTop:3 }}>
          {new Date(n.created_at).toLocaleTimeString('pt-PT', { hour:'2-digit', minute:'2-digit' })}
          {!n.lida && <span style={{ color:cor, marginLeft:6 }}>● novo</span>}
        </div>
      </div>
    </div>
  )
}

// ─── VERIFICADOR AUTOMÁTICO ───────────────────────────
// Chamado no carregamento da app para criar notificações de alertas pendentes
export async function verificarAlertasAutomaticos(userId, dados = {}) {
  if (!userId) return
  const hoje = new Date().toISOString().slice(0,10)
  const em3dias = new Date(Date.now()+3*86400000).toISOString().slice(0,10)
  const notifsPendentes = []

  // Eclosões próximas
  if (dados.acasalamentos) {
    for (const a of dados.acasalamentos.filter(x=>x.data_eclosao_prev&&x.estado==='em_progresso')) {
      const d = a.data_eclosao_prev.slice(0,10)
      if (d === hoje) {
        notifsPendentes.push({ user_id:userId, tipo:'eclosao', titulo:'🐣 Eclosão hoje!', corpo:`${a.pai_nome?.split(' ')[0]||'Pai'} × ${a.mae_nome?.split(' ')[0]||'Mãe'} — Cacifo ${a.cacifo||'?'}`, url:'reproducao' })
      } else if (d <= em3dias) {
        notifsPendentes.push({ user_id:userId, tipo:'eclosao', titulo:'🥚 Eclosão em breve', corpo:`${a.pai_nome?.split(' ')[0]||'Pai'} × ${a.mae_nome?.split(' ')[0]||'Mãe'} — ${d}`, url:'reproducao' })
      }
    }
  }

  // Tarefas em atraso
  if (dados.tarefas) {
    const atrasadas = dados.tarefas.filter(t=>t.estado!=='concluida'&&t.data_prevista&&t.data_prevista<hoje)
    if (atrasadas.length > 0) {
      notifsPendentes.push({ user_id:userId, tipo:'tratamento', titulo:`⏰ ${atrasadas.length} tarefa(s) em atraso`, corpo:atrasadas.slice(0,2).map(t=>t.titulo).join(', '), url:'checklist' })
    }
  }

  // Inserir apenas as que não existem hoje
  for (const n of notifsPendentes) {
    const { data: existe } = await supabase.from('notificacoes')
      .select('id').eq('user_id', userId).eq('tipo', n.tipo).gte('created_at', hoje+'T00:00:00').limit(1)
    if (!existe?.length) {
      await supabase.from('notificacoes').insert(n).catch(()=>{})
    }
  }
}
