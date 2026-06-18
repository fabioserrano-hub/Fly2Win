import { useState, useEffect, useCallback } from 'react'
import { db, supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useToast, Spinner, Modal, EmptyState, Field, Badge } from '../components/ui'
import { classificarPombo } from './Pombos'

const TIPOS = ['Velocidade', 'Meio-Fundo', 'Fundo', 'Grande Fundo', 'Treino Federado']
const EMPTY_PROVA = { nome: '', tipo: 'Velocidade', dist: '', data_reg: new Date().toISOString().slice(0, 10), local_solta: '', lat_solta: '', lon_solta: '', hora_solta: '08:00', n_pombos: '', n_socios: '', custo: '', posicao_geral: '' }

function calcVelocidade(distKm, horaSolta, horaChegada) {
  if (!distKm || !horaSolta || !horaChegada) return null
  const [hS, mS] = horaSolta.split(':').map(Number)
  const [hC, mC] = horaChegada.split(':').map(Number)
  let mins = (hC * 60 + mC) - (hS * 60 + mS)
  if (mins <= 0) mins += 24 * 60
  const horas = mins / 60
  const vel = (distKm / horas)
  return { mins, vel: Math.round(vel * 100) / 100, mpm: Math.round((distKm * 1000 / mins) * 100) / 100 }
}

// Rumo geográfico (bearing) do ponto de solta para o pombal, em graus (0=Norte, 90=Este...)
function calcRumoVoo(latSolta, lonSolta, latPombal, lonPombal) {
  const toRad = (d) => d * Math.PI / 180
  const toDeg = (r) => r * 180 / Math.PI
  const dLon = toRad(lonPombal - lonSolta)
  const y = Math.sin(dLon) * Math.cos(toRad(latPombal))
  const x = Math.cos(toRad(latSolta)) * Math.sin(toRad(latPombal)) - Math.sin(toRad(latSolta)) * Math.cos(toRad(latPombal)) * Math.cos(dLon)
  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

// Classifica o vento relativo ao rumo de voo: cauda (favorável), proa (contra), ou lateral
function classificarVento(rumoVoo, direcaoVento) {
  // direcaoVento é a direção DE ONDE o vento vem (convenção meteorológica padrão).
  // Se o vento vem da mesma direção do rumo de voo, está a "empurrar pelas costas" -> vento de cauda.
  // Se vem da direção oposta ao rumo de voo, está a soprar de frente -> vento de proa.
  let diff = Math.abs(rumoVoo - direcaoVento)
  if (diff > 180) diff = 360 - diff
  if (diff <= 45) return { tipo: 'Vento de Cauda', icon: '⬆️', cor: '#2DD4A7', desc: 'Vento a favor — condições propícias a boas médias' }
  if (diff >= 135) return { tipo: 'Vento de Proa', icon: '⬇️', cor: '#f87171', desc: 'Vento contra o voo — pode atrasar a chegada' }
  return { tipo: 'Vento Lateral', icon: '↔️', cor: '#D4AF37', desc: 'Vento de lado — pode dispersar o bando' }
}

export default function Provas({ nav, params }) {
  const toast = useToast()
  const { user } = useAuth()
  const [uploadingAnexo, setUploadingAnexo] = useState(false)
  const [provas, setProvas] = useState([])
  const [pombos, setPombos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [form, setForm] = useState(EMPTY_PROVA)
  const sf = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const [resultados, setResultados] = useState([])
  const [loadingRes, setLoadingRes] = useState(false)
  const [encestados, setEncestados] = useState([])
  const [meteo, setMeteo] = useState(null)
  const [loadingMeteo, setLoadingMeteo] = useState(false)
  const [historicoSemelhante, setHistoricoSemelhante] = useState(null)

  const [perfil, setPerfil] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try { const [p, pb, pf] = await Promise.all([db.getProvas(), db.getPombos(), db.getPerfil()]); setProvas(p); setPombos(pb); setPerfil(pf) }
    catch (e) { toast('Erro: ' + e.message, 'err') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (params?.provaId && provas.length) {
      const p = provas.find(x => x.id === params.provaId)
      if (p) openDetail(p)
    }
  }, [params, provas])

  const openNew = () => { setForm(EMPTY_PROVA); setSelected(null); setModal('form') }
  const openEdit = (p) => {
    setSelected(p)
    setForm({ nome: p.nome || '', tipo: p.tipo || 'Velocidade', dist: String(p.dist || ''), data_reg: p.data_reg?.slice(0, 10) || '', local_solta: p.local_solta || '', lat_solta: String(p.lat_solta || ''), lon_solta: String(p.lon_solta || ''), hora_solta: p.hora_solta || '08:00', n_pombos: String(p.n_pombos || ''), n_socios: String(p.n_socios || ''), custo: String(p.custo || ''), posicao_geral: String(p.posicao_geral || '') })
    setModal('form')
  }
  const close = () => { setModal(null); setSelected(null); setResultados([]); setEncestados([]); setMeteo(null); setHistoricoSemelhante(null) }

  const uploadAnexo = async (file) => {
    if (!file) return
    setUploadingAnexo(true)
    try {
      const anexo = await db.uploadAnexoProva(user.id, selected.id, file)
      const novosAnexos = [...(selected.anexos || []), anexo]
      await db.updateProva(selected.id, { anexos: novosAnexos })
      setSelected(s => ({ ...s, anexos: novosAnexos }))
      toast('Anexo carregado!', 'ok')
    } catch (e) { toast('Erro: ' + e.message + ' (verifique se o bucket documentos-provas existe)', 'err') }
    finally { setUploadingAnexo(false) }
  }

  const removerAnexo = async (anexo) => {
    try {
      await db.deleteAnexoProva(anexo.path)
      const novosAnexos = (selected.anexos || []).filter(a => a.path !== anexo.path)
      await db.updateProva(selected.id, { anexos: novosAnexos })
      setSelected(s => ({ ...s, anexos: novosAnexos }))
      toast('Anexo removido', 'ok')
    } catch (e) { toast('Erro: ' + e.message, 'err') }
  }

  const save = async () => {
    if (!form.nome.trim() || !form.dist) { toast('Nome e distância obrigatórios', 'warn'); return }
    setSaving(true)
    try {
      const payload = { nome: form.nome.trim(), tipo: form.tipo, dist: parseFloat(form.dist), data_reg: form.data_reg, local_solta: form.local_solta, lat_solta: form.lat_solta ? parseFloat(form.lat_solta) : null, lon_solta: form.lon_solta ? parseFloat(form.lon_solta) : null, hora_solta: form.hora_solta, n_pombos: form.n_pombos ? parseInt(form.n_pombos) : null, n_socios: form.n_socios ? parseInt(form.n_socios) : null, custo: form.custo ? parseFloat(form.custo) : null, posicao_geral: form.posicao_geral ? parseInt(form.posicao_geral) : null }
      selected ? await db.updateProva(selected.id, payload) : await db.createProva(payload)
      toast(selected ? 'Actualizada!' : 'Prova criada!', 'ok'); close(); load()
    } catch (e) { toast('Erro: ' + e.message, 'err') }
    finally { setSaving(false) }
  }

  const del = async () => {
    try { await db.deleteProva(confirm.id); toast('Eliminada', 'ok'); setConfirm(null); load() }
    catch (e) { toast('Erro: ' + e.message, 'err') }
  }

  const openDetail = async (p) => {
    setSelected(p); setModal('detail'); setLoadingRes(true)
    try {
      setResultados(await db.getResultados(p.id))
      // Histórico de desempenho em provas semelhantes (mesma distância ±50km ou mesmo local de solta)
      const semelhantes = provas.filter(o => o.id !== p.id && (
        (p.local_solta && o.local_solta === p.local_solta) ||
        (p.dist && o.dist && Math.abs(o.dist - p.dist) <= 50)
      ))
      if (semelhantes.length > 0) {
        const { data } = await supabase.from('race_results').select('posicao, velocidade, race_id').in('race_id', semelhantes.map(s => s.id)).not('posicao', 'is', null)
        const comPos = data || []
        if (comPos.length > 0) {
          const top3 = comPos.filter(r => r.posicao <= 3).length
          const velMedia = comPos.filter(r => r.velocidade).reduce((s, r) => s + r.velocidade, 0) / (comPos.filter(r => r.velocidade).length || 1)
          setHistoricoSemelhante({ nProvas: semelhantes.length, nResultados: comPos.length, top3, velMedia: Math.round(velMedia * 10) / 10 })
        } else setHistoricoSemelhante({ nProvas: semelhantes.length, nResultados: 0 })
      } else setHistoricoSemelhante(null)
    }
    catch (e) { setResultados([]); setHistoricoSemelhante(null) }
    finally { setLoadingRes(false) }
  }

  const openEncestamento = (p) => { setSelected(p); setModal('encestamento'); setEncestados(resultados.map(r => r.pigeon_id)) }
  const toggleEncestado = (pomboId) => setEncestados(e => e.includes(pomboId) ? e.filter(x => x !== pomboId) : [...e, pomboId])

  const confirmarEncestamento = async () => {
    setSaving(true)
    try {
      const existentes = resultados.map(r => r.pigeon_id)
      const novos = encestados.filter(id => !existentes.includes(id))
      const removidos = existentes.filter(id => !encestados.includes(id))
      await Promise.all(novos.map(pid => db.createResultado({ race_id: selected.id, pigeon_id: pid })))
      const aRemover = resultados.filter(r => removidos.includes(r.pigeon_id))
      await Promise.all(aRemover.map(r => db.deleteResultado(r.id)))
      toast('Encestamento actualizado!', 'ok')
      setResultados(await db.getResultados(selected.id))
      setModal('detail')
    } catch (e) { toast('Erro: ' + e.message, 'err') }
    finally { setSaving(false) }
  }

  const guardarResultado = async (resultado, posicao, horaChegada) => {
    try {
      const calc = calcVelocidade(selected.dist, selected.hora_solta, horaChegada)
      await db.updateResultado(resultado.id, { posicao: posicao ? parseInt(posicao) : null, hora_chegada: horaChegada || null, velocidade: calc?.vel || null, mpm: calc?.mpm || null })
      setResultados(await db.getResultados(selected.id))
      toast('Resultado guardado', 'ok')
    } catch (e) { toast('Erro: ' + e.message, 'err') }
  }

  const buscarMeteo = async () => {
    if (!selected?.lat_solta || !selected?.lon_solta) { toast('Sem coordenadas GPS de solta nesta prova', 'warn'); return }
    setLoadingMeteo(true)
    try {
      const dataProva = new Date(selected.data_reg)
      const inicio = new Date(dataProva); inicio.setDate(inicio.getDate() - 1)
      const fim = new Date(dataProva); fim.setDate(fim.getDate() + 1)
      const fmt = (d) => d.toISOString().slice(0, 10)
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${selected.lat_solta}&longitude=${selected.lon_solta}&hourly=temperature_2m,windspeed_10m,winddirection_10m,precipitation,cloudcover&start_date=${fmt(inicio)}&end_date=${fmt(fim)}`)
      const data = await res.json()
      setMeteo(data)
    } catch (e) { toast('Erro ao obter meteorologia', 'err') }
    finally { setLoadingMeteo(false) }
  }

  const provasOrdenadas = [...provas].sort((a, b) => new Date(b.data_reg) - new Date(a.data_reg))
  const PombosNaoEncestados = pombos.filter(p => (!p.estado_ext || p.estado_ext === 'proprio') && p.estado === 'ativo')
  const PombosNaoEncestadosClassificados = PombosNaoEncestados
    .map(p => ({ ...p, classificacao: classificarPombo(p) }))
    .sort((a, b) => b.classificacao.prioridade - a.classificacao.prioridade)

  return (
    <div>
      <div className="section-header">
        <div><div className="section-title">Provas</div><div className="section-sub">{provas.length} provas registadas</div></div>
        <button className="btn btn-primary" onClick={openNew}>＋ Nova Prova</button>
      </div>

      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner lg /></div>
        : provas.length === 0 ? <EmptyState icon="🏆" title="Sem provas" desc="Registe a primeira prova da época" action={<button className="btn btn-primary" onClick={openNew}>＋ Nova Prova</button>} />
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {provasOrdenadas.map(p => (
              <div key={p.id} className="card card-p" style={{ cursor: 'pointer' }} onClick={() => openDetail(p)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: '#101F40', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🏆</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{p.nome}</div>
                    <div style={{ fontSize: 12, color: '#7A8699' }}>{p.tipo} · {p.dist}km · {p.local_solta || '—'} · {new Date(p.data_reg).toLocaleDateString('pt-PT')}</div>
                  </div>
                  <Badge v="blue">{p.tipo}</Badge>
                  <button className="btn btn-icon btn-sm" onClick={e => { e.stopPropagation(); setConfirm(p) }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
      }

      <Modal open={modal === 'form'} onClose={close} title={selected ? '✏️ Editar Prova' : '🏆 Nova Prova'} wide
        footer={<><button className="btn btn-secondary" onClick={close}>Cancelar</button><button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? <Spinner /> : null}{selected ? 'Guardar' : 'Criar'}</button></>}>
        <div className="form-grid">
          <div className="col-2"><Field label="Nome *"><input className="input" placeholder="Ex: Prova de Vendas Novas" value={form.nome} onChange={e => sf('nome', e.target.value)} /></Field></div>
          <Field label="Tipo"><select className="input" value={form.tipo} onChange={e => sf('tipo', e.target.value)}>{TIPOS.map(t => <option key={t}>{t}</option>)}</select></Field>
          <Field label="Distância (km) *"><input className="input" type="number" placeholder="320" value={form.dist} onChange={e => sf('dist', e.target.value)} /></Field>
          <Field label="Data"><input className="input" type="date" value={form.data_reg} onChange={e => sf('data_reg', e.target.value)} /></Field>
          <Field label="Hora de Solta"><input className="input" type="time" value={form.hora_solta} onChange={e => sf('hora_solta', e.target.value)} /></Field>
          <div className="col-2"><Field label="Local de Solta"><input className="input" placeholder="Ex: Vendas Novas" value={form.local_solta} onChange={e => sf('local_solta', e.target.value)} /></Field></div>
          <Field label="Latitude Solta"><input className="input" placeholder="38.68" value={form.lat_solta} onChange={e => sf('lat_solta', e.target.value)} /></Field>
          <Field label="Longitude Solta"><input className="input" placeholder="-8.46" value={form.lon_solta} onChange={e => sf('lon_solta', e.target.value)} /></Field>
          <Field label="Nº Pombos (geral)"><input className="input" type="number" value={form.n_pombos} onChange={e => sf('n_pombos', e.target.value)} /></Field>
          <Field label="A Minha Posição (classificação oficial)"><input className="input" type="number" placeholder="Ex: 5" value={form.posicao_geral} onChange={e => sf('posicao_geral', e.target.value)} /></Field>
          <Field label="Nº Sócios"><input className="input" type="number" value={form.n_socios} onChange={e => sf('n_socios', e.target.value)} /></Field>
          <Field label="Custo (€)"><input className="input" type="number" step="0.01" value={form.custo} onChange={e => sf('custo', e.target.value)} /></Field>
        </div>
      </Modal>

      {selected && (
        <Modal open={modal === 'detail'} onClose={close} title={`🏆 ${selected.nome}`} wide
          footer={
            <div style={{ display: 'flex', gap: 8, width: '100%', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => openEncestamento(selected)}>📦 Encestamento ({resultados.length})</button>
              <button className="btn btn-secondary btn-sm" onClick={buscarMeteo} disabled={loadingMeteo}>{loadingMeteo ? <Spinner /> : '🌦️'} MeteoProva</button>
              <div style={{ flex: 1 }} />
              <button className="btn btn-secondary" onClick={close}>Fechar</button>
              <button className="btn btn-primary" onClick={() => openEdit(selected)}>✏️ Editar</button>
            </div>
          }>
          <div className="grid-3" style={{ marginBottom: 16 }}>
            <div className="kpi"><div className="kpi-val" style={{ fontSize: 22 }}>{selected.dist}km</div><div className="kpi-label">Distância</div></div>
            <div className="kpi"><div className="kpi-val" style={{ fontSize: 22 }}>{resultados.length}</div><div className="kpi-label">Encestados</div></div>
            <div className="kpi"><div className="kpi-val" style={{ fontSize: 22 }}>{resultados.filter(r => r.posicao).length}</div><div className="kpi-label">Com Resultado</div></div>
          </div>

          {historicoSemelhante && (
            <div className="card card-p" style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, color: '#fff', marginBottom: 6 }}>📊 Histórico em Provas Semelhantes</div>
              {historicoSemelhante.nResultados === 0 ? (
                <div style={{ fontSize: 12, color: '#7A8699' }}>{historicoSemelhante.nProvas} prova(s) com distância ou local parecido, mas ainda sem resultados registados.</div>
              ) : (
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  Em <strong style={{ color: '#cbd5e1' }}>{historicoSemelhante.nProvas}</strong> prova(s) parecidas (mesma distância ±50km ou mesmo local de solta), os seus pombos ficaram entre os 3 primeiros <strong style={{ color: '#2DD4A7' }}>{historicoSemelhante.top3}</strong> vez(es), com velocidade média de <strong style={{ color: '#cbd5e1' }}>{historicoSemelhante.velMedia} km/h</strong>.
                </div>
              )}
            </div>
          )}

          {selected.local_solta && (
            <div style={{ marginBottom: 16 }}>
              <div className="label" style={{ marginBottom: 6 }}>📍 Local de Solta</div>
              {selected.lat_solta && selected.lon_solta ? (
                <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #1B2D52', height: 160 }}>
                  <iframe width="100%" height="100%" frameBorder="0" style={{ display: 'block' }} src={`https://maps.google.com/maps?q=${selected.lat_solta},${selected.lon_solta}&z=10&output=embed`} />
                </div>
              ) : <div style={{ fontSize: 13, color: '#94a3b8' }}>{selected.local_solta} (sem coordenadas GPS)</div>}
            </div>
          )}

          {meteo && (
            <div className="card card-p" style={{ marginBottom: 16, background: '#101F40' }}>
              <div style={{ fontWeight: 600, color: '#fff', marginBottom: 10 }}>🌦️ Previsão — Dia Anterior, da Prova e Seguinte</div>
              {meteo.hourly ? (() => {
                const diaProvaStr = selected.data_reg.slice(0, 10)
                const diasUnicos = [...new Set(meteo.hourly.time.map(t => t.slice(0, 10)))]
                const ventoInfo = (() => {
                  if (!perfil?.pombal_lat || !perfil?.pombal_lon || !selected.lat_solta || !selected.lon_solta) return null
                  const rumo = calcRumoVoo(selected.lat_solta, selected.lon_solta, perfil.pombal_lat, perfil.pombal_lon)
                  const horaSolta = selected.hora_solta || '08:00'
                  const idxSolta = meteo.hourly.time.findIndex(t => t === `${diaProvaStr}T${horaSolta.slice(0, 2)}:00`)
                  if (idxSolta < 0) return null
                  const direcaoVento = meteo.hourly.winddirection_10m?.[idxSolta]
                  if (direcaoVento === undefined) return null
                  return { ...classificarVento(rumo, direcaoVento), velocidadeVento: meteo.hourly.windspeed_10m?.[idxSolta] }
                })()
                return (
                  <div>
                    {ventoInfo && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: `${ventoInfo.cor}14`, border: `1px solid ${ventoInfo.cor}40`, marginBottom: 10 }}>
                        <span style={{ fontSize: 20 }}>{ventoInfo.icon}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: ventoInfo.cor }}>{ventoInfo.tipo} ({ventoInfo.velocidadeVento}km/h) na hora de solta</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{ventoInfo.desc}</div>
                        </div>
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {diasUnicos.map(diaStr => {
                        const isDiaProva = diaStr === diaProvaStr
                        return (
                          <div key={diaStr} style={{ border: isDiaProva ? '1px solid rgba(212,175,55,.35)' : '1px solid #1B2D52', borderRadius: 8, padding: '8px 10px', background: isDiaProva ? 'rgba(212,175,55,.05)' : 'transparent' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: isDiaProva ? '#D4AF37' : '#94a3b8', marginBottom: 6 }}>{isDiaProva ? '🏁 ' : ''}{new Date(diaStr).toLocaleDateString('pt-PT', { weekday: 'short', day: '2-digit', month: '2-digit' })}{isDiaProva ? ' (dia da prova)' : ''}</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, textAlign: 'center' }}>
                              {[8, 11, 14, 17].map(h => {
                                const idx = meteo.hourly.time.findIndex(t => t === `${diaStr}T${String(h).padStart(2, '0')}:00`)
                                if (idx < 0) return null
                                return (
                                  <div key={h}>
                                    <div style={{ fontSize: 10, color: '#7A8699' }}>{h}h</div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{meteo.hourly.temperature_2m?.[idx]}°C</div>
                                    <div style={{ fontSize: 9, color: '#4C8DFF' }}>💨 {meteo.hourly.windspeed_10m?.[idx]}km/h</div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {!ventoInfo && (!perfil?.pombal_lat || !perfil?.pombal_lon) && (
                      <div style={{ fontSize: 11, color: '#7A8699', marginTop: 10 }}>💡 Defina as coordenadas GPS do pombal em Perfil para ver a análise de vento de cauda/proa.</div>
                    )}
                  </div>
                )
              })() : <div style={{ fontSize: 12, color: '#7A8699' }}>Sem dados meteorológicos disponíveis</div>}
            </div>
          )}

          <div className="card card-p" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontWeight: 600, color: '#fff' }}>📎 Anexos ({(selected.anexos || []).length})</div>
              <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                {uploadingAnexo ? <Spinner /> : '＋ Carregar'}
                <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }} disabled={uploadingAnexo}
                  onChange={e => { uploadAnexo(e.target.files[0]); e.target.value = '' }} />
              </label>
            </div>
            {(selected.anexos || []).length === 0
              ? <div style={{ fontSize: 12, color: '#7A8699' }}>Sem anexos. Carregue uma foto do encestamento ou o boletim de resultados em PDF.</div>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selected.anexos.map((a, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#101F40', borderRadius: 8 }}>
                      <span style={{ fontSize: 16 }}>{a.tipo?.includes('pdf') ? '📄' : '🖼️'}</span>
                      <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, fontSize: 12, color: '#4C8DFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: 'none' }}>{a.nome}</a>
                      <button className="btn btn-icon btn-sm" onClick={() => removerAnexo(a)}>🗑️</button>
                    </div>
                  ))}
                </div>
            }
          </div>

          <div className="label" style={{ marginBottom: 8 }}>Resultados</div>
          {loadingRes ? <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><Spinner /></div>
            : resultados.length === 0 ? <div style={{ textAlign: 'center', color: '#7A8699', padding: '20px 0', fontSize: 13 }}>Nenhum pombo encestado. Use "📦 Encestamento" para adicionar.</div>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {resultados.map(r => (<ResultadoRow key={r.id} r={r} onSave={guardarResultado} />))}
              </div>
          }
        </Modal>
      )}

      {selected && (
        <Modal open={modal === 'encestamento'} onClose={() => setModal('detail')} title="📦 Encestamento"
          footer={<><button className="btn btn-secondary" onClick={() => setModal('detail')}>Cancelar</button><button className="btn btn-primary" onClick={confirmarEncestamento} disabled={saving}>{saving ? <Spinner /> : null}Confirmar ({encestados.length})</button></>}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>Seleccione os pombos a encestar para esta prova. Pombos "Prontos a competir" aparecem primeiro.</div>
          {PombosNaoEncestadosClassificados.some(p => p.classificacao.prioridade <= 1) && (
            <div style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#f87171' }}>
              ⚠️ Há pombos lesionados ou em queda de rendimento na lista — evite encestar pombos que não estejam aptos.
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 360, overflowY: 'auto' }}>
            {PombosNaoEncestadosClassificados.map(p => {
              const c = p.classificacao
              const atencao = c.prioridade <= 1
              return (
                <div key={p.id} onClick={() => toggleEncestado(p.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, cursor: 'pointer', background: encestados.includes(p.id) ? 'rgba(76,141,255,.08)' : '#101F40', border: encestados.includes(p.id) ? '1px solid #4C8DFF' : atencao ? '1px solid rgba(239,68,68,.3)' : '1px solid #1B2D52' }}>
                  <input type="checkbox" checked={encestados.includes(p.id)} onChange={() => {}} style={{ accentColor: '#4C8DFF', width: 16, height: 16 }} />
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: '#0B1830', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, overflow: 'hidden', flexShrink: 0 }}>
                    {p.foto_url ? <img src={p.foto_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : p.emoji}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: '#fff' }}>{p.nome}</div>
                    <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: '#7A8699' }}>{p.anilha}</div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: c.cor, display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>{atencao ? '🏥' : ''} {c.tag}</span>
                </div>
              )
            })}
          </div>
        </Modal>
      )}

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title="Eliminar prova"
        footer={<><button className="btn btn-secondary" onClick={() => setConfirm(null)}>Cancelar</button><button className="btn btn-danger" onClick={del}>Eliminar</button></>}>
        <p style={{ fontSize: 14, color: '#cbd5e1' }}>Eliminar "{confirm?.nome}"? Os resultados associados também serão perdidos.</p>
      </Modal>
    </div>
  )
}

function ResultadoRow({ r, onSave }) {
  const [posicao, setPosicao] = useState(r.posicao || '')
  const [hora, setHora] = useState(r.hora_chegada || '')
  const p = r.pigeons

  const handleBlur = () => {
    if (posicao !== (r.posicao || '') || hora !== (r.hora_chegada || '')) onSave(r, posicao, hora)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#101F40', borderRadius: 10, flexWrap: 'wrap' }}>
      <div style={{ width: 26, height: 26, borderRadius: 6, background: '#0B1830', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, overflow: 'hidden', flexShrink: 0 }}>
        {p?.foto_url ? <img src={p.foto_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (p?.emoji || '🐦')}
      </div>
      <div style={{ flex: '1 1 140px', minWidth: 0 }}>
        <div style={{ fontSize: 12, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p?.nome || '—'}</div>
        <div style={{ fontFamily: 'Space Mono', fontSize: 9, color: '#7A8699' }}>{p?.anilha}</div>
      </div>
      <input className="input" style={{ width: 60, padding: '4px 8px', fontSize: 12 }} type="number" placeholder="Lugar" value={posicao} onChange={e => setPosicao(e.target.value)} onBlur={handleBlur} />
      <input className="input" style={{ width: 90, padding: '4px 8px', fontSize: 12 }} type="time" value={hora} onChange={e => setHora(e.target.value)} onBlur={handleBlur} />
      {r.velocidade ? <span style={{ fontSize: 11, color: '#2DD4A7', fontFamily: 'Space Mono', whiteSpace: 'nowrap' }}>{r.velocidade} km/h</span> : <span style={{ fontSize: 10, color: '#475569' }}>—</span>}
    </div>
  )
}
