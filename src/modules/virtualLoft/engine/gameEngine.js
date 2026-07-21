// src/modules/virtualLoft/engine/gameEngine.js
// Pipeline semanal central — importado APENAS pelo HubPombal
// Funções: inicializarClubesIA | processWeek | gerarNoticiasEngine | clubesParaMercado | aiParaProva

import { gerarPombalIA, simularResultadoIA, evoluirIAs } from './ai'
import { PROVAS_CALENDARIO } from '../data/calendario'

const N_CLUBES = 20  // 4 elite + 8 bom + 8 normal

// ── Inicialização (chamada uma vez ao carregar carreira) ─────────────────────
export function inicializarClubesIA(carreira) {
  if ((carreira.clubes_ia || []).length >= N_CLUBES) return carreira
  const clubes = [
    ...Array.from({ length: 4 }, () => { const c = gerarPombalIA('elite'); return { ...c, pombos: c.pombos.slice(0, 10) } }),
    ...Array.from({ length: 8 }, () => { const c = gerarPombalIA('bom');   return { ...c, pombos: c.pombos.slice(0, 8)  } }),
    ...Array.from({ length: 8 }, () => { const c = gerarPombalIA('normal');return { ...c, pombos: c.pombos.slice(0, 6)  } }),
  ]
  return { ...carreira, clubes_ia: clubes }
}

// ── Pipeline semanal ─────────────────────────────────────────────────────────
export function processWeek(carreira) {
  if (!carreira.clubes_ia?.length) return carreira
  let n = { ...carreira }
  const semana = n.semana || 1
  const eventos = []

  // 1. Evolução estatística dos clubes
  n.clubes_ia = evoluirIAs(n.clubes_ia)

  // 2. Provas desta semana — IA compete e pontua
  const provasSemana = PROVAS_CALENDARIO.filter(p => p.semana === semana)
  provasSemana.forEach(prova => {
    const res = n.clubes_ia
      .map(cl => { const r = simularResultadoIA(cl, prova); return r ? { ...r, clube: cl } : null })
      .filter(Boolean)
      .sort((a, b) => b.velocidade - a.velocidade)

    const ia_camp = { ...(n.campeonato_ia || { clubes: [], pontos: {} }) }
    ia_camp.pontos = { ...ia_camp.pontos }

    res.forEach((r, idx) => {
      const pts = idx === 0 ? prova.pontos : idx === 1 ? Math.round(prova.pontos * .6) : idx === 2 ? Math.round(prova.pontos * .3) : 0
      if (!pts) return
      const e = { ...(ia_camp.pontos[r.pombalNome] || {}) }
      e.geral = (e.geral || 0) + pts
      e[prova.tipo] = (e[prova.tipo] || 0) + pts
      ia_camp.pontos[r.pombalNome] = e
      if (idx === 0) {
        r.clube.vitorias = (r.clube.vitorias || 0) + 1
        eventos.push({ tipo: 'vitoria_ia', clube: r.pombalNome, pombo: r.pomboNome, prova: prova.nome, semana })
      }
    })
    n.campeonato_ia = ia_camp
  })

  // 3. Mercado: 2 clubes põem pombos à venda por semana
  if (Math.random() < 0.8) {
    const expirados = (n.mercado_ia || []).filter(a => a.expires > semana)
    const novos = []
    const nVenda = 1 + Math.floor(Math.random() * 2)
    const idxUsados = new Set()
    for (let i = 0; i < nVenda; i++) {
      let ci = Math.floor(Math.random() * n.clubes_ia.length)
      if (idxUsados.has(ci)) continue
      idxUsados.add(ci)
      const clube = n.clubes_ia[ci]
      if (!clube.pombos?.length) continue
      const pi = Math.floor(Math.random() * clube.pombos.length)
      const p = clube.pombos[pi]
      const a = p.atributos || {}
      const media = ((a.velocidade || 50) + (a.resistencia || 50) + (a.orientacao || 50)) / 3
      const preco = Math.round(media * 30 + (clube.nivel === 'elite' ? 1500 : clube.nivel === 'bom' ? 800 : 300) + Math.random() * 400)
      novos.push({
        id: `mkt_${Date.now()}_${i}`,
        pomboId: p.id, pomboNome: p.nome, pomboSexo: p.sexo,
        clubeId: clube.id, clubeNome: clube.nome, clubeNivel: clube.nivel,
        especialidade: p.especialidade, atributos: a, anilha: p.anilha,
        preco, semana, expires: semana + 4,
      })
      eventos.push({ tipo: 'venda_ia', clube: clube.nome, pombo: p.nome, preco, semana })
    }
    n.mercado_ia = [...expirados, ...novos]
  }

  // 4. Evento ocasional de crise
  if (Math.random() < 0.08) {
    const cl = n.clubes_ia[Math.floor(Math.random() * n.clubes_ia.length)]
    eventos.push({ tipo: 'crise', clube: cl.nome, semana })
  }

  // 5. Guardar eventos (max 60)
  n.eventos_engine = [...(n.eventos_engine || []).slice(-40), ...eventos]
  return n
}

// ── Notícias automáticas do motor ────────────────────────────────────────────
export function gerarNoticiasEngine(carreira) {
  return (carreira.eventos_engine || []).slice(-25).reverse().map((e, i) => {
    if (e.tipo === 'vitoria_ia') return {
      id: `eng_${i}`, tipo: 'mundo', prioridade: 2,
      titulo: `${e.clube} vence ${e.prova}!`,
      descricao: `${e.pombo} do ${e.clube} sagrou-se campeão da ${e.prova} na semana ${e.semana}.`,
      semana: e.semana, icon: '🏆',
    }
    if (e.tipo === 'venda_ia') return {
      id: `eng_${i}`, tipo: 'mundo', prioridade: 3,
      titulo: `${e.clube} vende ${e.pombo}`,
      descricao: `O ${e.clube} colocou ${e.pombo} no mercado por ${e.preco.toLocaleString()}€.`,
      semana: e.semana, icon: '💰',
    }
    if (e.tipo === 'crise') return {
      id: `eng_${i}`, tipo: 'mundo', prioridade: 3,
      titulo: `${e.clube} em dificuldades financeiras`,
      descricao: `Fontes indicam que o ${e.clube} enfrenta sérios problemas orçamentais esta época.`,
      semana: e.semana, icon: '💸',
    }
    return null
  }).filter(Boolean)
}

// ── Pombos IA disponíveis no mercado ────────────────────────────────────────
export function clubesParaMercado(carreira) {
  const semana = carreira.semana || 1
  return (carreira.mercado_ia || []).filter(a => a.expires > semana)
}

// ── Adversários reais para uma prova ────────────────────────────────────────
export function aiParaProva(carreira, prova) {
  if (!carreira.clubes_ia?.length) return []
  return carreira.clubes_ia
    .map(cl => simularResultadoIA(cl, prova))
    .filter(Boolean)
    .map(r => ({
      pombo: null, score: r.score, velocidade: r.velocidade,
      tempo: Math.round((prova.dist * 1000) / r.velocidade),
      nome: r.pomboNome, pombalNome: r.pombalNome, isMeu: false, isIA: true,
    }))
}
