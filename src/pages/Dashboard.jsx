import { useState, useEffect } from 'react'
import { supabase, db } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useIdioma } from '../hooks/useIdioma'
import { useToast, Spinner } from '../components/ui'

export default function Dashboard({ nav }) {
  const { user } = useAuth()
  const toast = useToast()
  const { t } = useIdioma()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const nome = user?.user_metadata?.nome?.split(' ')[0] || 'Columbófilo'
  const h = new Date().getHours()
  const saudacao = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [pombos, provas, fin, saude, treinos, tarefas, acas] = await Promise.all([
          db.getPombos().catch(() => []),
          db.getProvas().catch(() => []),
          db.getFinancas().catch(() => []),
          supabase.from('health').select('*').order('created_at', { ascending: false }).limit(10).then(r => r.data || []),
          supabase.from('treinos').select('*').order('data_reg', { ascending: false }).limit(3).then(r => r.data || []),
          db.getTarefas().catch(() => []),
          supabase.from('breeding').select('*').eq('estado', 'em_progresso').then(r => r.data || []),
        ])

        const hojeStr = new Date().toISOString().slice(0, 10)
        const pombosAtivos = pombos.filter(p => !p.estado_ext || p.estado_ext === 'proprio')
        const top = [...pombosAtivos].sort((a, b) => (b.percentil || 0) - (a.percentil || 0)).slice(0, 5)
        const vitorias = provas.filter(p => p.posicao_geral === 1).length
        const rec = fin.filter(f => f.tipo === 'receita').reduce((s, f) => s + (f.valor || 0), 0)
        const dep = fin.filter(f => f.tipo === 'despesa').reduce((s, f) => s + (f.valor || 0), 0)
        const tarefasAtraso = tarefas.filter(t => t.estado !== 'concluida' && t.data_prevista && t.data_prevista < hojeStr)
        const provasRecentes = [...provas].sort((a, b) => new Date(b.data_reg) - new Date(a.data_reg)).slice(0, 5)

        setData({ pombos, provas, top, vitorias, rec, dep, saude, treinos, tarefasAtraso, acas, provasRecentes, ativos: pombosAtivos.length })
      } catch (e) {
        toast('Erro ao carregar: ' + e.message, 'err')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><Spinner lg /></div>
  if (!data) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><Spinner lg /></div>

  const mediaScore = data.top.length
    ? Math.round(data.top.reduce((s, p) => s + (p.percentil || 0), 0) / data.top.length)
    : 0

  const ACOES = [
    { icon: '🏆', label: 'Registar Chegada', page: 'provas' },
    { icon: '🏥', label: 'Registo Saúde', page: 'saude' },
    { icon: '🎯', label: 'Novo Treino', page: 'treinos' },
    { icon: '✅', label: 'Checklist', page: 'checklist' },
  ]

  return (
    <div>
      {/* Saudação */}
      <div style={{ background: 'linear-gradient(135deg,#050D1A,#0B1830)', border: '1px solid rgba(212,175,55,.2)', borderRadius: 14, padding: '16px', marginBottom: 14, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#D4AF37,#4C8DFF,#2DD4A7)' }} />
        <div style={{ fontSize: 11, color: '#7A8699', marginBottom: 4 }}>{saudacao},</div>
        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 900, color: '#fff' }}>{nome} 🕊️</div>
        <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>
          {data.ativos} pombos activos · {data.provas.length} provas · {data.vitorias} vitória(s)
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 14 }}>
        {[
          { v: data.ativos, l: 'Pombos', c: '#4C8DFF', icon: '🐦' },
          { v: data.provas.length, l: 'Provas', c: '#D4AF37', icon: '🏆' },
          { v: mediaScore + '%', l: 'Percentil', c: '#2DD4A7', icon: '📊' },
          { v: data.vitorias, l: 'Vitórias', c: '#A855F7', icon: '🥇' },
        ].map(({ v, l, c, icon }) => (
          <div key={l} style={{ textAlign: 'center', padding: '10px 6px', background: '#0B1830', border: `1px solid ${c}25`, borderRadius: 10 }}>
            <div style={{ fontSize: 16, marginBottom: 2 }}>{icon}</div>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 900, color: c }}>{v}</div>
            <div style={{ fontSize: 9, color: '#7A8699' }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Alertas */}
      {data.tarefasAtraso.length > 0 && (
        <div onClick={() => nav('checklist')} style={{ background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 20 }}>⏰</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#f87171' }}>{data.tarefasAtraso.length} tarefa(s) em atraso</div>
            <div style={{ fontSize: 11, color: '#7A8699' }}>{data.tarefasAtraso.slice(0, 2).map(t => t.titulo).join(', ')}</div>
          </div>
        </div>
      )}

      {/* Acções rápidas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 14 }}>
        {ACOES.map(({ icon, label, page }) => (
          <button key={page} onClick={() => nav(page)} style={{ background: '#0B1830', border: '1px solid #1B2D52', borderRadius: 10, padding: '12px 6px', cursor: 'pointer', textAlign: 'center', fontFamily: 'inherit' }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
            <div style={{ fontSize: 9, color: '#7A8699', lineHeight: 1.3 }}>{label}</div>
          </button>
        ))}
      </div>

      {/* Top pombos */}
      {data.top.length > 0 && (
        <div style={{ background: '#0B1830', border: '1px solid #1B2D52', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, color: '#fff', fontSize: 14 }}>⭐ Top Pombos</div>
            <button className="btn btn-secondary btn-sm" onClick={() => nav('pombos')}>Ver todos →</button>
          </div>
          {data.top.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: i < data.top.length - 1 ? '1px solid #1B2D52' : 'none' }}>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 14, fontWeight: 900, color: i === 0 ? '#D4AF37' : i === 1 ? '#cbd5e1' : i === 2 ? '#b45309' : '#475569', width: 20, textAlign: 'center' }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{p.nome}</div>
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: '#475569' }}>{p.anilha}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 900, color: (p.percentil || 0) >= 80 ? '#2DD4A7' : (p.percentil || 0) >= 60 ? '#D4AF37' : '#94a3b8' }}>{p.percentil || 0}%</div>
                <div style={{ fontSize: 9, color: '#475569' }}>{p.n_provas || 0} provas</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Últimas provas */}
      {data.provasRecentes.length > 0 && (
        <div style={{ background: '#0B1830', border: '1px solid #1B2D52', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, color: '#fff', fontSize: 14 }}>🏆 Últimas Provas</div>
            <button className="btn btn-secondary btn-sm" onClick={() => nav('provas')}>Ver todas →</button>
          </div>
          {data.provasRecentes.map(p => (
            <div key={p.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #1B2D52' }}>
              <span style={{ fontSize: 18 }}>{p.posicao_geral === 1 ? '🥇' : '🕊️'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{p.nome}</div>
                <div style={{ fontSize: 10, color: '#7A8699' }}>{p.dist || 0}km · {new Date(p.data_reg).toLocaleDateString('pt-PT')}</div>
              </div>
              {p.posicao_geral && p.n_pombos && (
                <div style={{ fontSize: 12, fontWeight: 700, color: p.posicao_geral === 1 ? '#D4AF37' : '#94a3b8' }}>
                  {p.posicao_geral}º/{p.n_pombos}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Finanças resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ background: '#0B1830', border: '1px solid rgba(45,212,167,.2)', borderRadius: 10, padding: '12px 14px', cursor: 'pointer' }} onClick={() => nav('financas')}>
          <div style={{ fontSize: 11, color: '#7A8699' }}>💰 Receitas</div>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 900, color: '#2DD4A7' }}>{data.rec.toFixed(0)}€</div>
        </div>
        <div style={{ background: '#0B1830', border: '1px solid rgba(248,113,113,.2)', borderRadius: 10, padding: '12px 14px', cursor: 'pointer' }} onClick={() => nav('financas')}>
          <div style={{ fontSize: 11, color: '#7A8699' }}>💸 Despesas</div>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 900, color: '#f87171' }}>{data.dep.toFixed(0)}€</div>
        </div>
      </div>
    </div>
  )
}
