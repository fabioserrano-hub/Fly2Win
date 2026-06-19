import { useState, useEffect, useCallback } from 'react'
import { db } from '../lib/supabase'
import { useToast, Spinner, Badge } from '../components/ui'
import { classificarPombo } from './Pombos'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const CORES_GRAFICO = ['#4C8DFF', '#2DD4A7', '#D4AF37', '#f87171', '#a78bfa', '#fb923c', '#34d399', '#e879f9']

const TooltipCustom = ({ active, payload, label, formato }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0B1830', border: '1px solid #1B2D52', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      <div style={{ color: '#94a3b8', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => <div key={i} style={{ color: p.color || '#2DD4A7' }}>{p.name || ''}: <strong>{formato ? formato(p.value) : p.value}</strong></div>)}
    </div>
  )
}

export default function Relatorios({ nav }) {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [pombos, setPombos] = useState([])
  const [provas, setProvas] = useState([])
  const [financas, setFinancas] = useState([])
  const [saude, setSaude] = useState([])
  const [tab, setTab] = useState('desempenho')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [p, pv, f, s] = await Promise.all([db.getPombos(), db.getProvas(), db.getFinancas(), db.getSaude()])
      setPombos(p); setProvas(pv); setFinancas(f); setSaude(s)
    } catch (e) { toast('Erro: ' + e.message, 'err') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const ano = new Date().getFullYear()
  const efectivo = pombos.filter(p => !p.estado_ext || p.estado_ext === 'proprio')

  // Desempenho
  const topPombos = [...efectivo].sort((a, b) => (b.percentil || 0) - (a.percentil || 0)).slice(0, 8)
  const porEspecialidade = {}
  efectivo.forEach(p => (p.esp || []).forEach(e => { porEspecialidade[e] = (porEspecialidade[e] || 0) + 1 }))
  const vitoriasPorMes = Array.from({ length: 12 }, (_, i) => ({
    label: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i],
    valor: provas.filter(p => p.lugar === 1 && new Date(p.data_reg).getMonth() === i && new Date(p.data_reg).getFullYear() === ano).length,
  }))

  // Finanças
  const finPorMes = Array.from({ length: 12 }, (_, i) => {
    const doMes = financas.filter(f => new Date(f.data_reg).getMonth() === i && new Date(f.data_reg).getFullYear() === ano)
    const rec = doMes.filter(f => f.tipo === 'receita').reduce((s, f) => s + f.val, 0)
    const dep = doMes.filter(f => f.tipo === 'despesa').reduce((s, f) => s + f.val, 0)
    return { label: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i], valor: rec - dep }
  })
  const recTotal = financas.filter(f => f.tipo === 'receita' && new Date(f.data_reg).getFullYear() === ano).reduce((s, f) => s + f.val, 0)
  const depTotal = financas.filter(f => f.tipo === 'despesa' && new Date(f.data_reg).getFullYear() === ano).reduce((s, f) => s + f.val, 0)

  // Saúde
  const aptosCount = saude.filter(s => (s.apt || s.aptidao) === 'Apto').length
  const obsCount = saude.filter(s => (s.apt || s.aptidao) === 'Em Observação').length
  const lesCount = saude.filter(s => ['Lesionado', 'Doente'].includes(s.apt || s.aptidao)).length
  const pesoMedio = (() => {
    const comPeso = saude.filter(s => s.peso)
    if (!comPeso.length) return null
    return Math.round(comPeso.reduce((s, r) => s + r.peso, 0) / comPeso.length)
  })()

  const custoEfetivo = depTotal && efectivo.length ? (depTotal / efectivo.length).toFixed(2) : '0.00'

  // Distribuição agregada por classificação automática (mesma lógica usada em Pombos)
  const distribuicaoClassificacao = {}
  efectivo.forEach(p => {
    const c = classificarPombo(p)
    distribuicaoClassificacao[c.tag] = (distribuicaoClassificacao[c.tag] || { n: 0, cor: c.cor })
    distribuicaoClassificacao[c.tag].n++
  })

  return (
    <div>
      <div className="section-header">
        <div><div className="section-title">Relatórios</div><div className="section-sub">Indicadores da época {ano}</div></div>
      </div>

      <div style={{ display: 'flex', gap: 4, background: '#101F40', borderRadius: 10, padding: 4, marginBottom: 16, overflowX: 'auto' }}>
        {[['desempenho', '🏆 Desempenho'], ['financas', '💰 Finanças'], ['saude', '🏥 Saúde']].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '8px 14px', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none', fontFamily: 'inherit', whiteSpace: 'nowrap', background: tab === t ? '#1E5FD9' : 'none', color: tab === t ? '#fff' : '#94a3b8' }}>{l}</button>
        ))}
      </div>

      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner lg /></div> : (
        <>
          {tab === 'desempenho' && (
            <div>
              <div className="grid-3 mb-6">
                <div className="kpi"><div className="kpi-val text-green">{efectivo.length}</div><div className="kpi-label">Efectivo</div></div>
                <div className="kpi"><div className="kpi-val text-yellow">{provas.filter(p => p.lugar === 1).length}</div><div className="kpi-label">Vitórias</div></div>
                <div className="kpi"><div className="kpi-val text-blue">{provas.length}</div><div className="kpi-label">Provas Disputadas</div></div>
              </div>

              <div className="card card-p mb-6">
                <div style={{ fontWeight: 600, color: '#fff', marginBottom: 16 }}>🥇 Vitórias por Mês ({ano})</div>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={vitoriasPorMes} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <XAxis dataKey="label" tick={{ fill: '#7A8699', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#7A8699', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<TooltipCustom />} />
                    <Bar dataKey="valor" name="Vitórias" fill="#D4AF37" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="card card-p mb-6">
                <div style={{ fontWeight: 600, color: '#fff', marginBottom: 12 }}>📊 Top 8 Pombos por Percentil</div>
                <ResponsiveContainer width="100%" height={topPombos.length * 36 + 20}>
                  <BarChart data={topPombos.map(p => ({ nome: p.nome, percentil: p.percentil || 0 }))} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: '#7A8699', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="nome" tick={{ fill: '#cbd5e1', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                    <Tooltip content={<TooltipCustom formato={v => v + '%'} />} />
                    <Bar dataKey="percentil" name="Percentil" fill="#2DD4A7" radius={[0,4,4,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="card card-p mb-6">
                <div style={{ fontWeight: 600, color: '#fff', marginBottom: 4 }}>🔎 Estado do Efectivo</div>
                <div style={{ fontSize: 11, color: '#7A8699', marginBottom: 12 }}>Classificação automática calculada a partir de percentil, idade e estado de saúde.</div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie data={Object.entries(distribuicaoClassificacao).map(([tag, { n, cor }]) => ({ name: tag, value: n, fill: cor }))} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2} dataKey="value">
                        {Object.entries(distribuicaoClassificacao).map(([tag, { cor }], i) => <Cell key={i} fill={cor} />)}
                      </Pie>
                      <Tooltip content={<TooltipCustom />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {Object.entries(distribuicaoClassificacao).sort((a, b) => b[1].n - a[1].n).map(([tag, { n, cor }]) => (
                      <div key={tag} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: cor, flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: 12, color: '#cbd5e1' }}>{tag}</span>
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>{n} ({Math.round((n / Math.max(efectivo.length, 1)) * 100)}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="card card-p">
                <div style={{ fontWeight: 600, color: '#fff', marginBottom: 12 }}>🎯 Efectivo por Especialidade</div>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={Object.entries(porEspecialidade).map(([esp, n]) => ({ esp: esp.replace('_', ' '), n }))} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <XAxis dataKey="esp" tick={{ fill: '#7A8699', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#7A8699', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<TooltipCustom />} />
                    <Bar dataKey="n" name="Pombos" fill="#4C8DFF" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {tab === 'financas' && (
            <div>
              <div className="grid-3 mb-6">
                <div className="kpi"><div className="kpi-val text-green">{recTotal.toFixed(0)}€</div><div className="kpi-label">Receitas {ano}</div></div>
                <div className="kpi"><div className="kpi-val text-red">{depTotal.toFixed(0)}€</div><div className="kpi-label">Despesas {ano}</div></div>
                <div className="kpi"><div className="kpi-val" style={{ color: recTotal - depTotal >= 0 ? '#2DD4A7' : '#f87171' }}>{(recTotal - depTotal).toFixed(0)}€</div><div className="kpi-label">Saldo {ano}</div></div>
              </div>
              <div className="card card-p mb-6">
                <div style={{ fontWeight: 600, color: '#fff', marginBottom: 16 }}>💰 Receitas vs Despesas por Mês ({ano})</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={Array.from({ length: 12 }, (_, i) => {
                    const doMes = financas.filter(f => new Date(f.data_reg).getMonth() === i && new Date(f.data_reg).getFullYear() === ano)
                    return {
                      label: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][i],
                      receitas: doMes.filter(f => f.tipo === 'receita').reduce((s, f) => s + (f.val || 0), 0),
                      despesas: doMes.filter(f => f.tipo === 'despesa').reduce((s, f) => s + (f.val || 0), 0),
                    }
                  })} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                    <XAxis dataKey="label" tick={{ fill: '#7A8699', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#7A8699', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<TooltipCustom formato={v => v.toFixed(0) + '€'} />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                    <Bar dataKey="receitas" name="Receitas" fill="#2DD4A7" radius={[4,4,0,0]} />
                    <Bar dataKey="despesas" name="Despesas" fill="#f87171" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="card card-p mb-6">
                <div style={{ fontWeight: 600, color: '#fff', marginBottom: 16 }}>📈 Saldo Acumulado ({ano})</div>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={(() => {
                    let acum = 0
                    return Array.from({ length: 12 }, (_, i) => {
                      const doMes = financas.filter(f => new Date(f.data_reg).getMonth() === i && new Date(f.data_reg).getFullYear() === ano)
                      const rec = doMes.filter(f => f.tipo === 'receita').reduce((s, f) => s + (f.val || 0), 0)
                      const dep = doMes.filter(f => f.tipo === 'despesa').reduce((s, f) => s + (f.val || 0), 0)
                      acum += rec - dep
                      return { label: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][i], saldo: Math.round(acum) }
                    })
                  })()} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                    <XAxis dataKey="label" tick={{ fill: '#7A8699', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#7A8699', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<TooltipCustom formato={v => v + '€'} />} />
                    <Line type="monotone" dataKey="saldo" name="Saldo acumulado" stroke="#D4AF37" strokeWidth={2} dot={{ fill: '#D4AF37', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ textAlign: 'center' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => nav?.('financas')}>Ver detalhe em Finanças →</button>
              </div>
            </div>
          )}

          {tab === 'saude' && (
            <div>
              <div className="grid-3 mb-6">
                <div className="kpi"><div className="kpi-val text-green">{aptosCount}</div><div className="kpi-label">Registos Aptos</div></div>
                <div className="kpi"><div className="kpi-val text-yellow">{obsCount}</div><div className="kpi-label">Em Observação</div></div>
                <div className="kpi"><div className="kpi-val text-red">{lesCount}</div><div className="kpi-label">Lesionados/Doentes</div></div>
              </div>
              {pesoMedio && (
                <div className="card card-p mb-6">
                  <div style={{ fontWeight: 600, color: '#fff', marginBottom: 8 }}>⚖️ Peso Médio do Efectivo</div>
                  <div style={{ fontFamily: "'Fraunces',serif", fontSize: 32, fontWeight: 700, color: '#4C8DFF' }}>{pesoMedio}g</div>
                </div>
              )}
              <div style={{ textAlign: 'center' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => nav?.('saude')}>Ver detalhe em Saúde →</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
