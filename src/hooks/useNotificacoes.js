// src/hooks/useNotificacoes.js
// Hook para gerir notificações push PWA

export async function pedirPermissaoNotificacoes() {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const resultado = await Notification.requestPermission()
  return resultado === 'granted'
}

export function notificar(titulo, opcoes = {}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  const { body='', icon='/icons/icon-192.png', tag='cl', url='/' } = opcoes
  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.ready.then(reg => {
      reg.showNotification(titulo, { body, icon, tag, data: { url }, badge: icon, vibrate: [200,100,200] })
    })
  } else {
    new Notification(titulo, { body, icon, tag })
  }
}

// Verificar e notificar eventos pendentes
export async function verificarAlertas(dados) {
  if (Notification.permission !== 'granted') return
  const hoje = new Date().toISOString().slice(0,10)
  const em3dias = new Date(Date.now()+3*86400000).toISOString().slice(0,10)

  // Eclosões próximas
  if (dados.acasalamentos) {
    dados.acasalamentos.filter(a => a.data_eclosao_prev && a.estado==='em_progresso').forEach(a => {
      const dataEcl = a.data_eclosao_prev.slice(0,10)
      if (dataEcl === hoje) notificar('🐣 Eclosão hoje!', { body:`${a.pai_nome?.split(' ')[0]} × ${a.mae_nome?.split(' ')[0]} — Cacifo ${a.cacifo||'?'}`, tag:`eclosao-${a.id}` })
      else if (dataEcl <= em3dias) notificar('🥚 Eclosão em breve', { body:`${a.pai_nome?.split(' ')[0]} × ${a.mae_nome?.split(' ')[0]} — ${dataEcl}`, tag:`eclosao-${a.id}` })
    })
  }

  // Tarefas em atraso
  if (dados.tarefas) {
    const atrasadas = dados.tarefas.filter(t => t.estado!=='concluida' && t.data_prevista && t.data_prevista < hoje)
    if (atrasadas.length > 0) notificar(`⏰ ${atrasadas.length} tarefa(s) em atraso`, { body: atrasadas.slice(0,2).map(t=>t.titulo).join(', '), tag:'tarefas-atraso' })
  }

  // Provas hoje
  if (dados.provas) {
    const hoje_provas = dados.provas.filter(p => p.data_reg === hoje)
    if (hoje_provas.length > 0) notificar(`🏆 ${hoje_provas.length} prova(s) hoje`, { body: hoje_provas[0].nome, tag:'provas-hoje' })
  }
}

export function usePushNotificacoes() {
  const pedir = () => pedirPermissaoNotificacoes()
  const permissao = typeof window !== 'undefined' ? Notification.permission : 'default'
  return { pedir, permissao, notificar }
}
