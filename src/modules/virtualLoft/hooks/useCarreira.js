// src/modules/virtualLoft/hooks/useCarreira.js
import { useState, useCallback } from 'react'
import { gerarPlantelInicial } from '../engine/genetics'

const ORCAMENTOS = {
  jovem: 2500, amador: 8000, profissional: 25000, lenda: 100000
}

const DIFICULDADE_MULT = {
  facil: 1.5, normal: 1.0, dificil: 0.7, lenda: 0.5
}

export function useCarreira() {
  const [carreira, setCarreira] = useState(() => {
    try {
      const saved = localStorage.getItem('vl_carreira')
      if (saved) return JSON.parse(saved)
    } catch(e) {}
    return null
  })
  const [loading, setLoading] = useState(false)

  const criarCarreira = useCallback(async (form) => {
    setLoading(true)
    
    const orcBase = ORCAMENTOS[form.tipoInicio] || 8000
    const mult = DIFICULDADE_MULT[form.dificuldade] || 1.0
    const orcamento = Math.round(orcBase * mult)
    
    const pombos = gerarPlantelInicial(form.tipoInicio, form.idioma)

    const novaCarreira = {
      id: `carreira_${Date.now()}`,
      // Dados do gestor
      nomePombal: form.nomePombal,
      nomeGestor: form.nomeGestor,
      pais: form.pais,
      idioma: form.idioma,
      dificuldade: form.dificuldade,
      tipoInicio: form.tipoInicio,
      guardarEm: form.guardarEm,
      logotipo: form.logotipo || '🕊️',
      // Estado financeiro
      orcamento,
      receitas: 0,
      despesas: 0,
      // Época e tempo
      epoca: 1,
      semana: 1,
      data_criacao: new Date().toISOString(),
      // Reputação
      reputacao: form.tipoInicio === 'lenda' ? 80 : form.tipoInicio === 'profissional' ? 40 : form.tipoInicio === 'amador' ? 20 : 5,
      nivel_reputacao: 'local', // local → distrital → regional → nacional → internacional → olimpico
      // Pombos
      pombos,
      // Staff
      staff: [],
      // Pombal (estruturas)
      estruturas: {
        viveiros: { nivel: 1, capacidade: 20 },
        reproducao: { nivel: 0, capacidade: 0 },
        quarentena: { nivel: 0, capacidade: 0 },
        clinica: { nivel: 0 },
        treinos: { nivel: 0 },
        armazem: { nivel: 1 },
      },
      // Histórico
      historico_provas: [],
      historico_epocas: [],
      // Conquistas
      conquistas: [],
      // Ranking
      ranking_nacional: null,
      ranking_local: null,
    }

    // Guardar
    if (form.guardarEm === 'localStorage') {
      try {
        localStorage.setItem('vl_carreira', JSON.stringify(novaCarreira))
      } catch(e) {
        console.warn('Erro ao guardar localmente:', e)
      }
    }
    // Supabase — implementar depois

    setCarreira(novaCarreira)
    setLoading(false)
    return novaCarreira
  }, [])

  const carregarCarreira = useCallback(() => {
    try {
      const saved = localStorage.getItem('vl_carreira')
      if (saved) {
        const dados = JSON.parse(saved)
        setCarreira(dados)
        return dados  // retorna os dados directamente
      }
    } catch(e) {}
    return null
  }, [])

  const guardarCarreira = useCallback((dados) => {
    if (dados?.guardarEm === 'localStorage') {
      try { localStorage.setItem('vl_carreira', JSON.stringify(dados)) } catch(e) {}
    }
    setCarreira(dados)
  }, [])

  return { carreira, loading, criarCarreira, carregarCarreira, guardarCarreira }
}
