import { useState, useEffect, useCallback } from 'react'
import { db } from '../lib/supabase'
import { useToast, Spinner, Modal, EmptyState, Badge } from '../components/ui'
import { BloqueioPlano } from '../hooks/useLicenca'

export default function FimEpoca({ nav }) {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [pombos, setPombos] = useState([])
  const [provas, setProvas] = useState([])
  const [tab, setTab] = useState('ranking')
  const [confirmDispensa, setConfirmDispensa] = useState(null)
  const [relatorioIA, setRelatorioIA] = useState(null)
  const [loadingIA, setLoadingIA] = useState(false)

  const anoAtual = new Date().getFullYear()

  const load = useCallback(async () => {
    setLoading(true)
    try { const [p, pv] = await Promise.all([db.getPombos(), db.getProvas()]); setPombos(p); setProvas(pv) }
    catch (e) { toast('Erro: ' + e.message, 'err') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const efectivo = pombos.filter(p => !p.estado_ext || p.estado_ext === 'proprio')
  const ranking = [...efectivo].sort((a, b) => (b.percentil || 0) - (a.percentil || 0))
  const aDispensar = ranking.filter(p => (p.percentil || 0) < 35 && (p.provas || 0) >= 3)

  const dispensar = async (pombo) => {
    try {
      await db.updatePombo(pombo.id, { estado_ext: 'cedido', estado: 'inativo', destino_obs: `Dispensado no fim da época ${anoAtual} por baixo desempenho (${pombo.percentil || 0}%)` })
      toast(`${pombo.nome} movido para "Cedidos"`, 'ok')
      setConfirmDispensa(null)
      load()
    } catch (e) { toast('Erro: ' + e.message, 'err') }
  }

  // Sugestão de casais simples: cruza melhores machos com melhores fêmeas evitando irmãos directos (mesmo pai E mesma mãe)
  const sugerirCasais = () => {
    const machos = [...ranking].filter(p => p.sexo === 'M').slice(0, 6)
    const femeas = [...ranking].filter(p => p.sexo === 'F').slice(0, 6)
    const pares = []
    const femeasUsadas = new Set()
    machos.forEach(m => {
      const candidata = femeas.find(f => !femeasUsadas.has(f.id) && !(f.pai === m.pai && f.mae === m.mae && f.pai))
      if (candidata) { pares.push({ macho: m, femea: candidata, scoreCombinado: Math.round(((m.percentil || 0) + (candidata.percentil || 0)) / 2) }); femeasUsadas.add(candidata.id) }
    })
    return pares.sort((a, b) => b.scoreCombinado - a.scoreCombinado)
  }
  const casaisSugeridos = sugerirCasais()

  const irParaAcasalamento = (par) => {
    toast(`Vá a Reprodução e crie o acasalamento ${par.macho.nome} × ${par.femea.nome}`, 'ok')
    nav?.('reproducao')
  }

  const gerarRelatorioIA = async () => {
    setLoadingIA(true)
    try {
      const resumo = {
        ano: anoAtual,
        efectivo: efectivo.length,
        provas: provas.filter(p => new Date(p.data_reg).getFullYear() === anoAtual).length,
        vitorias: provas.filter(p => p.lugar === 1 && new Date(p.data_reg).getFullYear() === anoAtual).length,
        topPombos: ranking.slice(0, 5).map(p => ({ nome: p.nome, percentil: p.percentil, provas: p.provas })),
        aDispensar: aDispensar.map(p => ({ nome: p.nome, percentil: p.percentil })),
      }
      const res = await fetch('/api/relatorio-ia', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(resumo) })
      if (!res.ok) throw new Error('Endpoint /api/relatorio-ia indisponível')
      const data = await res.json()
      setRelatorioIA(data.relatorio || data.text || 'Relatório gerado sem conteúdo.')
    } catch (e) {
      toast('Relatório IA indisponível: ' + e.message, 'err')
    } finally { setLoadingIA(false) }
  }

  return (
    <div>
      <div className="section-header">
        <div><div className="section-title">Fim de Época</div><div className="section-sub">Balanço e preparação para {anoAtual + 1}</div></div>
      </div>

      <div style={{ display: 'flex', gap: 4, background: '#1a2840', borderRadius: 10, padding: 4, marginBottom: 16, overflowX: 'auto' }}>
        {[['ranking', '🏆 Ranking'], ['dispensar', `✂️ Dispensar (${aDispensar.length})`], ['casais', '🥚 Casais Sugeridos'], ['ia', '🧠 Relatório IA']].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: 'none', fontFamily: 'inherit', whiteSpace: 'nowrap', background: tab === t ? '#1ed98a' : 'none', color: tab === t ? '#0a0f14' : '#94a3b8' }}>{l}</button>
        ))}
      </div>

      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner lg /></div> : (
        <>
          {tab === 'ranking' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {ranking.length === 0 ? <EmptyState icon="🏆" title="Sem pombos" desc="Sem efectivo para classificar" /> : ranking.map((p, i) => (
                <div key={p.id} className="card card-p">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: 'Barlow Condensed', fontSize: 20, fontWeight: 700, width: 28, color: i === 0 ? '#facc15' : i === 1 ? '#cbd5e1' : i === 2 ? '#b45309' : '#475569' }}>{i + 1}</span>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1a2840', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, overflow: 'hidden', flexShrink: 0 }}>
                      {p.foto_url ? <img src={p.foto_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : p.emoji}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{p.nome}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{p.provas || 0} provas</div>
                    </div>
                    <div style={{ width: 60 }}>
                      <div className="progress"><div className="progress-bar" style={{ width: `${p.percentil || 0}%`, background: (p.percentil || 0) >= 60 ? '#1ed98a' : (p.percentil || 0) >= 35 ? '#facc15' : '#f87171' }} /></div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, width: 36, textAlign: 'right' }}>{p.percentil || 0}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'dispensar' && (
            aDispensar.length === 0 ? <EmptyState icon="✂️" title="Nenhum pombo a dispensar" desc="Todos os pombos com 3+ provas têm desempenho acima de 35%" />
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Pombos com percentil abaixo de 35% após 3 ou mais provas:</div>
                {aDispensar.map(p => (
                  <div key={p.id} className="card card-p">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ fontSize: 20 }}>{p.emoji}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{p.nome}</div>
                        <div style={{ fontSize: 11, color: '#f87171' }}>{p.percentil || 0}% em {p.provas} provas</div>
                      </div>
                      <button className="btn btn-danger btn-sm" onClick={() => setConfirmDispensa(p)}>Dispensar</button>
                    </div>
                  </div>
                ))}
              </div>
          )}

          {tab === 'casais' && (
            casaisSugeridos.length === 0 ? <EmptyState icon="🥚" title="Sem sugestões" desc="É necessário ter machos e fêmeas no efectivo para sugerir cruzamentos" />
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Cruzamentos sugeridos pelos melhores scores, evitando irmãos directos:</div>
                {casaisSugeridos.map((par, i) => (
                  <div key={i} className="card card-p">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{par.macho.nome} ♂ × {par.femea.nome} ♀</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{par.macho.anilha} × {par.femea.anilha}</div>
                      </div>
                      <Badge v="green">{par.scoreCombinado}% combinado</Badge>
                      <button className="btn btn-secondary btn-sm" onClick={() => irParaAcasalamento(par)}>🥚 Acasalar</button>
                    </div>
                  </div>
                ))}
              </div>
          )}

          {tab === 'ia' && (
            <BloqueioPlano plano="elite" nav={nav}>
              <div>
                {!relatorioIA ? (
                  <div style={{ textAlign: 'center', padding: '30px 0' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🧠</div>
                    <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 20, maxWidth: 360, margin: '0 auto 20px' }}>
                      Gere uma análise completa da época com resumo executivo, identificação de pombos a dispensar e sugestões de casais — tudo com base nos seus dados reais.
                    </div>
                    <button className="btn btn-primary" onClick={gerarRelatorioIA} disabled={loadingIA}>{loadingIA ? <Spinner /> : '✨'} Gerar Relatório IA</button>
                  </div>
                ) : (
                  <div className="card card-p">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ fontWeight: 600, color: '#fff' }}>🧠 Análise IA — Época {anoAtual}</div>
                      <Badge v="green">ELITE AI</Badge>
                    </div>
                    <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{relatorioIA}</div>
                    <button className="btn btn-secondary btn-sm" style={{ marginTop: 16 }} onClick={gerarRelatorioIA} disabled={loadingIA}>{loadingIA ? <Spinner /> : '🔄'} Gerar Novamente</button>
                  </div>
                )}
              </div>
            </BloqueioPlano>
          )}
        </>
      )}

      <Modal open={!!confirmDispensa} onClose={() => setConfirmDispensa(null)} title="Dispensar pombo"
        footer={<><button className="btn btn-secondary" onClick={() => setConfirmDispensa(null)}>Cancelar</button><button className="btn btn-danger" onClick={() => dispensar(confirmDispensa)}>Confirmar Dispensa</button></>}>
        <p style={{ fontSize: 14, color: '#cbd5e1' }}>Dispensar "{confirmDispensa?.nome}"? Vai ficar marcado como "Cedido" e inactivo. Pode reverter depois em Pombos.</p>
      </Modal>
    </div>
  )
}
