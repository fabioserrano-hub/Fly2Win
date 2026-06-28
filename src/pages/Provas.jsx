import { useState, useEffect, useCallback, useRef } from 'react'
import { db, supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useIdioma } from '../hooks/useIdioma'
import { useToast, Spinner, Modal, EmptyState, Field, Badge } from '../components/ui'
import { classificarPombo } from './Pombos'
import { verificarConquistas } from '../components/Conquistas'

const TIPOS = ['Velocidade', 'Meio-Fundo', 'Fundo', 'Grande Fundo', 'Treino Federado']
const EMPTY_PROVA = { nome: '', tipo: 'Velocidade', dist: '', data_reg: new Date().toISOString().slice(0, 10), local_solta: '', lat_solta: '', lon_solta: '', hora_solta: '08:00', n_pombos: '', n_socios: '', custo: '', posicao_geral: '', cesto: '', hora_encestamento: '', estado_encestamento: 'pendente' }

function calcVelocidade(distKm, horaSolta, horaChegada) {
  if (!distKm || !horaSolta || !horaChegada) return null
  const [hS, mS] = horaSolta.split(':').map(Number)
  const [hC, mC] = horaChegada.split(':').map(Number)
  let mins = (hC * 60 + mC) - (hS * 60 + mS)
  if (mins <= 0) mins += 24 * 60
  const horas = mins / 60
  return { mins, vel: Math.round((distKm / horas) * 100) / 100, mpm: Math.round((distKm * 1000 / mins) * 100) / 100 }
}

function calcRumoVoo(latSolta, lonSolta, latPombal, lonPombal) {
  const toRad = d => d * Math.PI / 180
  const toDeg = r => r * 180 / Math.PI
  const dLon = toRad(lonPombal - lonSolta)
  const y = Math.sin(dLon) * Math.cos(toRad(latPombal))
  const x = Math.cos(toRad(latSolta)) * Math.sin(toRad(latPombal)) - Math.sin(toRad(latSolta)) * Math.cos(toRad(latPombal)) * Math.cos(dLon)
  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

function classificarVento(rumoVoo, direcaoVento) {
  let diff = Math.abs(rumoVoo - direcaoVento)
  if (diff > 180) diff = 360 - diff
  if (diff <= 45) return { tipo: 'Vento de Cauda', icon: '⬆️', cor: '#2DD4A7', desc: 'Vento a favor — condições propícias a boas médias' }
  if (diff >= 135) return { tipo: 'Vento de Proa', icon: '⬇️', cor: '#f87171', desc: 'Vento contra o voo — pode atrasar a chegada' }
  return { tipo: 'Vento Lateral', icon: '↔️', cor: '#D4AF37', desc: 'Vento de lado — pode dispersar o bando' }
}

export default function Provas({ nav, params }) {
  const toast = useToast()
  const { user } = useAuth()
  const { t } = useIdioma()

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
  const [cesto, setCesto] = useState('')
  const [horaEncestamento, setHoraEncestamento] = useState('')
  const [meteo, setMeteo] = useState(null)
  const [loadingMeteo, setLoadingMeteo] = useState(false)
  const [historicoSemelhante, setHistoricoSemelhante] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [uploadingAnexo, setUploadingAnexo] = useState(false)
  const [modalImportFPC, setModalImportFPC] = useState(false)
  const [importandoFPC, setImportandoFPC] = useState(false)
  const [fpcUrl, setFpcUrl] = useState('')
  const [filtroProvas, setFiltroProvas] = useState('todas')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [pesquisaLocal, setPesquisaLocal] = useState('')
  const [resultadosPesquisa, setResultadosPesquisa] = useState([])
  const [pesquisandoLocal, setPesquisandoLocal] = useState(false)
  const [dropdownAberto, setDropdownAberto] = useState(false)
  const debounceRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [p, pb, pf] = await Promise.all([db.getProvas(), db.getPombos(), db.getPerfil()])
      setProvas(p); setPombos(pb); setPerfil(pf)
    } catch (e) { toast('Erro: ' + e.message, 'err') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (params?.provaId && provas.length) {
      const p = provas.find(x => x.id === params.provaId)
      if (p) openDetail(p)
    }
  }, [params, provas])

  // ── importar FPC ──────────────────────────────────────────────────────────
  const importarFPC = async () => {
    if (!fpcUrl.trim()) { toast('Introduz os dados CSV', 'warn'); return }
    setImportandoFPC(true)
    try {
      const linhas = fpcUrl.trim().split('\n').filter(l => l.trim())
      if (linhas.length < 2) { toast('Formato inválido. Cole os resultados em CSV', 'warn'); setImportandoFPC(false); return }
      const sep = linhas[0].includes(';') ? ';' : ','
      const headers = linhas[0].split(sep).map(h => h.trim().toLowerCase())
      const anilhaIdx = headers.findIndex(h => h.includes('anil') || h.includes('ring'))
      const posIdx = headers.findIndex(h => h.includes('pos') || h.includes('lugar') || h.includes('clas'))
      const velIdx = headers.findIndex(h => h.includes('vel') || h.includes('speed'))
      let provaId = selected?.id
      if (!provaId) {
        const { data: novaProva } = await supabase.from('races').insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          nome: `Importação FPC ${new Date().toLocaleDateString('pt-PT')}`,
          data_reg: new Date().toISOString().slice(0, 10),
          tipo: 'velocidade', dist: 0
        }).select().single()
        provaId = novaProva?.id
      }
      let ok = 0
      for (const linha of linhas.slice(1)) {
        const cols = linha.split(sep).map(c => c.trim())
        const anilha = anilhaIdx >= 0 ? cols[anilhaIdx] : cols[0]
        const posicao = posIdx >= 0 ? parseInt(cols[posIdx]) : 0
        const velocidade = velIdx >= 0 ? parseFloat(cols[velIdx]?.replace(',', '.')) : 0
        if (!anilha) continue
        const { data: pombo } = await supabase.from('pigeons').select('id').eq('anilha', anilha).maybeSingle()
        if (pombo && provaId) {
          await supabase.from('race_results').insert({
            user_id: (await supabase.auth.getUser()).data.user?.id,
            race_id: provaId, pigeon_id: pombo.id, posicao, velocidade, dist: selected?.dist || 0
          })
          ok++
        }
      }
      toast(`${ok} resultado(s) importado(s)!`, 'ok')
      setModalImportFPC(false); setFpcUrl(''); load()
    } catch (e) { toast('Erro: ' + e.message, 'err') }
    finally { setImportandoFPC(false) }
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const openNew = () => { setForm(EMPTY_PROVA); setSelected(null); setModal('form') }
  const openEdit = p => {
    setSelected(p)
    setForm({ nome: p.nome || '', tipo: p.tipo || 'Velocidade', dist: String(p.dist || ''), data_reg: p.data_reg?.slice(0, 10) || '', local_solta: p.local_solta || '', lat_solta: String(p.lat_solta || ''), lon_solta: String(p.lon_solta || ''), hora_solta: p.hora_solta || '08:00', n_pombos: String(p.n_pombos || ''), n_socios: String(p.n_socios || ''), custo: String(p.custo || ''), posicao_geral: String(p.posicao_geral || ''), cesto: p.cesto || '', hora_encestamento: p.hora_encestamento || '', estado_encestamento: p.estado_encestamento || 'pendente' })
    setModal('form')
  }
  const close = () => { setModal(null); setSelected(null); setResultados([]); setEncestados([]); setCesto(''); setHoraEncestamento(''); setMeteo(null); setHistoricoSemelhante(null) }

  const save = async () => {
    if (!form.nome.trim() || !form.dist) { toast('Nome e distância obrigatórios', 'warn'); return }
    setSaving(true)
    try {
      const payload = { nome: form.nome.trim(), tipo: form.tipo, dist: parseFloat(form.dist), data_reg: form.data_reg, local_solta: form.local_solta, lat_solta: form.lat_solta ? parseFloat(form.lat_solta) : null, lon_solta: form.lon_solta ? parseFloat(form.lon_solta) : null, hora_solta: form.hora_solta, n_pombos: form.n_pombos ? parseInt(form.n_pombos) : null, n_socios: form.n_socios ? parseInt(form.n_socios) : null, custo: form.custo ? parseFloat(form.custo) : null, posicao_geral: form.posicao_geral ? parseInt(form.posicao_geral) : null }
      selected ? await db.updateProva(selected.id, payload) : await db.createProva(payload)
      toast(selected ? 'Actualizada!' : 'Prova criada!', 'ok'); close(); load()
      if (!selected && user?.id) {
        const { data: todasProvas } = await supabase.from('races').select('posicao_geral,tipo,dist').eq('user_id', user.id)
        const nProvas = todasProvas?.length || 0
        const vitorias = todasProvas?.filter(p => p.posicao_geral === 1).length || 0
        const temGrandeFundo = todasProvas?.some(p => (p.dist || 0) > 700) || false
        const novas = await verificarConquistas(user.id, { nProvas, vitorias, maxPercentil: 0, temGrandeFundo })
        if (novas.length > 0) toast('🏅 Nova conquista desbloqueada!', 'ok')
      }
    } catch (e) { toast('Erro: ' + e.message, 'err') }
    finally { setSaving(false) }
  }

  const del = async () => {
    try { await db.deleteProva(confirm.id); toast('Eliminada', 'ok'); setConfirm(null); load() }
    catch (e) { toast('Erro: ' + e.message, 'err') }
  }

  // ── detail ────────────────────────────────────────────────────────────────
  const openDetail = async p => {
    setSelected(p); setModal('detail'); setLoadingRes(true)
    try {
      setResultados(await db.getResultados(p.id))
      const semelhantes = provas.filter(o => o.id !== p.id && ((p.local_solta && o.local_solta === p.local_solta) || (p.dist && o.dist && Math.abs(o.dist - p.dist) <= 50)))
      if (semelhantes.length > 0) {
        const { data } = await supabase.from('race_results').select('posicao, velocidade, race_id').in('race_id', semelhantes.map(s => s.id)).not('posicao', 'is', null)
        const comPos = data || []
        if (comPos.length > 0) {
          const top3 = comPos.filter(r => r.posicao <= 3).length
          const velMedia = comPos.filter(r => r.velocidade).reduce((s, r) => s + r.velocidade, 0) / (comPos.filter(r => r.velocidade).length || 1)
          setHistoricoSemelhante({ nProvas: semelhantes.length, nResultados: comPos.length, top3, velMedia: Math.round(velMedia * 10) / 10 })
        } else setHistoricoSemelhante({ nProvas: semelhantes.length, nResultados: 0 })
      } else setHistoricoSemelhante(null)
    } catch (e) { setResultados([]); setHistoricoSemelhante(null) }
    finally { setLoadingRes(false) }
  }

  // ── encestamento ──────────────────────────────────────────────────────────
  const openEncestamento = p => {
    setSelected(p)
    setModal('encestamento')
    setEncestados(p.pombos_encestados || resultados.map(r => r.pigeon_id))
    setCesto(p.cesto || '')
    setHoraEncestamento(p.hora_encestamento || '')
  }

  const toggleEncestado = id => setEncestados(e => e.includes(id) ? e.filter(x => x !== id) : [...e, id])

  const confirmarEncestamento = async () => {
    if (encestados.length === 0) { toast('Seleccione pelo menos um pombo', 'warn'); return }
    setSaving(true)
    try {
      // guardar encestamento na prova
      await db.updateProva(selected.id, {
        pombos_encestados: encestados,
        cesto: cesto || null,
        hora_encestamento: horaEncestamento || null,
        estado_encestamento: 'encestado',
      })
      // sincronizar race_results
      const existentes = resultados.map(r => r.pigeon_id)
      const novos = encestados.filter(id => !existentes.includes(id))
      const removidos = existentes.filter(id => !encestados.includes(id))
      await Promise.all(novos.map(pid => db.createResultado({ race_id: selected.id, pigeon_id: pid })))
      const aRemover = resultados.filter(r => removidos.includes(r.pigeon_id))
      await Promise.all(aRemover.map(r => db.deleteResultado(r.id)))
      // marcar pombos como em_prova
      await Promise.all(encestados.map(pid =>
        supabase.from('pigeons').update({ estado_ext: 'em_prova' }).eq('id', pid)
      ))
      toast(`${encestados.length} pombo(s) encestado(s)!`, 'ok')
      const novosResultados = await db.getResultados(selected.id)
      setResultados(novosResultados)
      setSelected(s => ({ ...s, pombos_encestados: encestados, cesto, hora_encestamento: horaEncestamento, estado_encestamento: 'encestado' }))
      setModal('detail')
      load()
    } catch (e) { toast('Erro: ' + e.message, 'err') }
    finally { setSaving(false) }
  }

  // registar chegadas — repor estado_ext dos pombos
  const registarChegadas = async () => {
    if (!selected?.pombos_encestados?.length) return
    try {
      await Promise.all(selected.pombos_encestados.map(pid =>
        supabase.from('pigeons').update({ estado_ext: 'proprio' }).eq('id', pid)
      ))
      await db.updateProva(selected.id, { estado_encestamento: 'regressaram' })
      toast('Chegadas registadas — pombos de volta ao efectivo!', 'ok')
      setSelected(s => ({ ...s, estado_encestamento: 'regressaram' }))
      load()
    } catch (e) { toast('Erro: ' + e.message, 'err') }
  }

  const guardarResultado = async (resultado, posicao, horaChegada) => {
    try {
      const calc = calcVelocidade(selected.dist, selected.hora_solta, horaChegada)
      await db.updateResultado(resultado.id, { posicao: posicao ? parseInt(posicao) : null, hora_chegada: horaChegada || null, velocidade: calc?.vel || null, mpm: calc?.mpm || null })
      setResultados(await db.getResultados(selected.id))
      toast('Resultado guardado', 'ok')
    } catch (e) { toast('Erro: ' + e.message, 'err') }
  }

  // ── meteorologia ──────────────────────────────────────────────────────────
  const buscarMeteo = async () => {
    if (!selected?.lat_solta || !selected?.lon_solta) { toast('Sem coordenadas GPS de solta nesta prova', 'warn'); return }
    setLoadingMeteo(true)
    try {
      const hoje = new Date().toISOString().slice(0, 10)
      const diaProva = new Date(selected.data_reg).toISOString().slice(0, 10)
      const endpoint = diaProva < hoje
        ? `https://archive-api.open-meteo.com/v1/archive?latitude=${selected.lat_solta}&longitude=${selected.lon_solta}&hourly=temperature_2m,windspeed_10m,winddirection_10m,precipitation,cloudcover&start_date=${diaProva}&end_date=${diaProva}`
        : `https://api.open-meteo.com/v1/forecast?latitude=${selected.lat_solta}&longitude=${selected.lon_solta}&hourly=temperature_2m,windspeed_10m,winddirection_10m,precipitation,cloudcover&start_date=${diaProva}&end_date=${diaProva}`
      const res = await fetch(endpoint)
      setMeteo(await res.json())
    } catch (e) { toast('Erro ao obter meteorologia', 'err') }
    finally { setLoadingMeteo(false) }
  }

  const abrirMeteoRota = () => {
    if (!selected || !perfil?.pombal_lat) { toast('Defina as coordenadas do pombal no Perfil', 'warn'); return }
    close(); nav('meteorologia', { provaId: selected.id })
  }

  // ── anexos ────────────────────────────────────────────────────────────────
  const uploadAnexo = async file => {
    if (!file) return
    setUploadingAnexo(true)
    try {
      const anexo = await db.uploadAnexoProva(user.id, selected.id, file)
      const novosAnexos = [...(selected.anexos || []), anexo]
      await db.updateProva(selected.id, { anexos: novosAnexos })
      setSelected(s => ({ ...s, anexos: novosAnexos }))
      toast('Anexo carregado!', 'ok')
    } catch (e) { toast('Erro: ' + e.message, 'err') }
    finally { setUploadingAnexo(false) }
  }

  const removerAnexo = async anexo => {
    try {
      await db.deleteAnexoProva(anexo.path)
      const novosAnexos = (selected.anexos || []).filter(a => a.path !== anexo.path)
      await db.updateProva(selected.id, { anexos: novosAnexos })
      setSelected(s => ({ ...s, anexos: novosAnexos }))
      toast('Anexo removido', 'ok')
    } catch (e) { toast('Erro: ' + e.message, 'err') }
  }

  // ── pesquisa de local ─────────────────────────────────────────────────────
  const calcDistanciaAoPombal = (lat, lon) => {
    if (!perfil?.pombal_lat || !perfil?.pombal_lon || !lat || !lon) return null
    const R = 6371
    const dLat = (perfil.pombal_lat - lat) * Math.PI / 180
    const dLon = (perfil.pombal_lon - lon) * Math.PI / 180
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat * Math.PI / 180) * Math.cos(perfil.pombal_lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
  }

  const onLatLonChange = (campo, valor) => {
    sf(campo, valor)
    const lat = campo === 'lat_solta' ? parseFloat(valor) : parseFloat(form.lat_solta)
    const lon = campo === 'lon_solta' ? parseFloat(valor) : parseFloat(form.lon_solta)
    if (lat && lon && perfil?.pombal_lat && perfil?.pombal_lon) {
      const dist = calcDistanciaAoPombal(lat, lon)
      if (dist) sf('dist', String(dist))
    }
  }

  const pesquisarLocalSolta = q => {
    setPesquisaLocal(q); setDropdownAberto(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.length < 2) { setResultadosPesquisa([]); return }
    debounceRef.current = setTimeout(async () => {
      setPesquisandoLocal(true)
      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=pt`)
        const data = await res.json()
        const todos = data.results || []
        const filtrados = todos.filter(l => ['PT', 'ES'].includes(l.country_code))
        setResultadosPesquisa(filtrados.length > 0 ? filtrados : todos.slice(0, 5))
      } catch (e) { setResultadosPesquisa([]) }
      finally { setPesquisandoLocal(false) }
    }, 350)
  }

  const selecionarLocal = loc => {
    const dist = calcDistanciaAoPombal(loc.latitude, loc.longitude)
    const nome = `${loc.name}${loc.admin2 ? ', ' + loc.admin2 : ''}${loc.admin1 ? ', ' + loc.admin1 : ''} (${loc.country_code})`
    sf('local_solta', nome); sf('lat_solta', String(loc.latitude)); sf('lon_solta', String(loc.longitude))
    if (dist) sf('dist', String(dist))
    setPesquisaLocal(''); setResultadosPesquisa([]); setDropdownAberto(false)
  }

  // ── computed ──────────────────────────────────────────────────────────────
  const hoje = new Date().toISOString().slice(0, 10)
  const provasOrdenadas = [...provas].sort((a, b) => new Date(b.data_reg) - new Date(a.data_reg))
  const provasFiltradas = provasOrdenadas.filter(p => {
    const passada = p.data_reg <= hoje
    if (filtroProvas === 'passadas' && !passada) return false
    if (filtroProvas === 'futuras' && passada) return false
    if (filtroTipo !== 'todos' && p.tipo !== filtroTipo) return false
    return true
  })
  const pombosAtivos = pombos.filter(p => (!p.estado_ext || p.estado_ext === 'proprio') && p.estado === 'ativo')
  const pombosClassificados = pombosAtivos
    .map(p => ({ ...p, classificacao: classificarPombo(p) }))
    .sort((a, b) => b.classificacao.prioridade - a.classificacao.prioridade)
  // Incluir pombos já encestados nesta prova para poder remover
  const pombosParaEncestar = pombos
    .filter(p => p.estado === 'ativo' && (!p.estado_ext || p.estado_ext === 'proprio' || p.estado_ext === 'em_prova'))
    .map(p => ({ ...p, classificacao: classificarPombo(p) }))
    .sort((a, b) => b.classificacao.prioridade - a.classificacao.prioridade)

  // ── estado do encestamento na badge da lista ──────────────────────────────
  const badgeEncestamento = p => {
    if (p.estado_encestamento === 'encestado') return { cor: '#D4AF37', label: '📦 Encestado' }
    if (p.estado_encestamento === 'regressaram') return { cor: '#2DD4A7', label: '🏁 Regressaram' }
    return null
  }

  return (
    <div>
      <div className="section-header">
        <div><div className="section-title">Provas</div><div className="section-sub">{provas.length} provas registadas</div></div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setModalImportFPC(true)}>📥 FPC</button>
          <button className="btn btn-primary" onClick={openNew}>＋ Nova Prova</button>
        </div>
      </div>

      {loading
        ? <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner lg /></div>
        : provas.length === 0
          ? <EmptyState icon="🏆" title="Sem provas" desc="Registe a primeira prova da época" action={<button className="btn btn-primary" onClick={openNew}>＋ Nova Prova</button>} />
          : <>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                {[['todas', 'Todas'], ['passadas', 'Passadas'], ['futuras', 'Futuras']].map(([v, l]) => (
                  <button key={v} onClick={() => setFiltroProvas(v)} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: 'none', fontFamily: 'inherit', background: filtroProvas === v ? '#1E5FD9' : '#101F40', color: filtroProvas === v ? '#fff' : '#94a3b8' }}>{l}</button>
                ))}
                <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className="input" style={{ maxWidth: 160, fontSize: 12, padding: '4px 10px', borderRadius: 20 }}>
                  <option value="todos">Todos os tipos</option>
                  {TIPOS.map(tp => <option key={tp} value={tp}>{tp}</option>)}
                </select>
                <span style={{ fontSize: 11, color: '#7A8699', alignSelf: 'center' }}>{provasFiltradas.length} prova(s)</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {provasFiltradas.map(p => {
                  const passada = p.data_reg <= hoje
                  const enc = badgeEncestamento(p)
                  return (
                    <div key={p.id} className="card card-p" style={{ cursor: 'pointer', opacity: passada ? 1 : 0.9, borderColor: p.estado_encestamento === 'encestado' ? 'rgba(212,175,55,.3)' : undefined }} onClick={() => openDetail(p)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 10, background: passada ? '#101F40' : 'rgba(76,141,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                          {p.estado_encestamento === 'encestado' ? '📦' : passada ? '🏆' : '📅'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{p.nome}</div>
                          <div style={{ fontSize: 12, color: '#7A8699' }}>{p.tipo} · {p.dist}km · {p.local_solta || '—'} · {new Date(p.data_reg).toLocaleDateString('pt-PT')}</div>
                          {enc && <div style={{ fontSize: 10, color: enc.cor, marginTop: 2 }}>{enc.label}{p.cesto ? ` · 🧺 ${p.cesto}` : ''}</div>}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                          <Badge v={passada ? 'blue' : 'green'}>{passada ? p.tipo : 'Próxima'}</Badge>
                          {!passada && p.data_reg && <div style={{ fontSize: 10, color: '#D4AF37' }}>Em {Math.ceil((new Date(p.data_reg) - new Date()) / (1000 * 60 * 60 * 24))} dias</div>}
                        </div>
                        <button className="btn btn-icon btn-sm" onClick={e => { e.stopPropagation(); setConfirm(p) }}>🗑️</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
      }

      {/* ══ MODAL FORM ════════════════════════════════════════════════════════ */}
      <Modal open={modal === 'form'} onClose={close} title={selected ? '✏️ Editar Prova' : '🏆 Nova Prova'} wide
        footer={<><button className="btn btn-secondary" onClick={close}>Cancelar</button><button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? <Spinner /> : null}{selected ? t('guardar') : 'Criar'}</button></>}>
        <div className="form-grid">
          <div className="col-2"><Field label="Nome *"><input className="input" placeholder="Ex: Prova de Vendas Novas" value={form.nome} onChange={e => sf('nome', e.target.value)} /></Field></div>
          <Field label="Tipo"><select className="input" value={form.tipo} onChange={e => sf('tipo', e.target.value)}>{TIPOS.map(tp => <option key={tp}>{tp}</option>)}</select></Field>
          <Field label="Distância (km) *"><input className="input" type="number" placeholder="320" value={form.dist} onChange={e => sf('dist', e.target.value)} /></Field>
          <Field label="Data"><input className="input" type="date" value={form.data_reg} onChange={e => sf('data_reg', e.target.value)} /></Field>
          <Field label="Hora de Solta"><input className="input" type="time" value={form.hora_solta} onChange={e => sf('hora_solta', e.target.value)} /></Field>
          <div className="col-2">
            <Field label="🔍 Local de Solta">
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input className="input" placeholder="Ex: Vendas Novas, Badajoz, Cáceres..." value={pesquisaLocal} onChange={e => pesquisarLocalSolta(e.target.value)} style={{ flex: 1 }} />
                  {pesquisandoLocal && <div style={{ position: 'absolute', right: form.local_solta ? 80 : 10, top: 10, fontSize: 13, color: '#7A8699' }}>🔄</div>}
                  {form.local_solta && <button type="button" className="btn btn-secondary btn-sm" onClick={() => { sf('local_solta', ''); sf('lat_solta', ''); sf('lon_solta', ''); sf('dist', ''); setPesquisaLocal(''); setResultadosPesquisa([]) }}>✕</button>}
                </div>
                {form.local_solta && !pesquisaLocal && (
                  <div style={{ fontSize: 11, color: '#2DD4A7', marginTop: 6 }}>✅ {form.local_solta}{form.dist ? ` · ${form.dist}km ao pombal` : ''}</div>
                )}
                {resultadosPesquisa.length > 0 && dropdownAberto && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#0B1830', border: '1px solid #1B2D52', borderRadius: 8, zIndex: 200, marginTop: 4, boxShadow: '0 8px 24px rgba(0,0,0,.5)' }}>
                    <div style={{ padding: '6px 12px', fontSize: 10, color: '#7A8699', borderBottom: '1px solid #1B2D52' }}>SELECCIONE O LOCAL</div>
                    {resultadosPesquisa.map((loc, i) => (
                      <div key={i} onClick={() => selecionarLocal(loc)} style={{ padding: '12px 14px', cursor: 'pointer', borderBottom: i < resultadosPesquisa.length - 1 ? '1px solid #101F40' : 'none', fontSize: 13 }}
                        onMouseEnter={e => e.currentTarget.style.background = '#101F40'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <div style={{ color: '#fff', fontWeight: 500 }}>{loc.name}{loc.admin2 ? <span style={{ color: '#7A8699' }}>, {loc.admin2}</span> : null}</div>
                        <div style={{ fontSize: 11, color: '#7A8699', marginTop: 2 }}>{loc.admin1 && `${loc.admin1} · `}<span style={{ color: loc.country_code === 'PT' ? '#4C8DFF' : '#D4AF37', fontWeight: 600 }}>{loc.country_code}</span> · {loc.latitude.toFixed(3)}, {loc.longitude.toFixed(3)}</div>
                      </div>
                    ))}
                    <div onClick={() => { setResultadosPesquisa([]); setDropdownAberto(false) }} style={{ padding: '8px 14px', fontSize: 11, color: '#7A8699', cursor: 'pointer', textAlign: 'center' }}>Fechar ✕</div>
                  </div>
                )}
              </div>
            </Field>
          </div>
          <Field label="Latitude"><input className="input" placeholder="38.68" value={form.lat_solta} onChange={e => onLatLonChange('lat_solta', e.target.value)} /></Field>
          <Field label="Longitude"><input className="input" placeholder="-8.46" value={form.lon_solta} onChange={e => onLatLonChange('lon_solta', e.target.value)} /></Field>
          <Field label="Nº Pombos (geral)"><input className="input" type="number" value={form.n_pombos} onChange={e => sf('n_pombos', e.target.value)} /></Field>
          <Field label="A Minha Posição"><input className="input" type="number" placeholder="Ex: 5" value={form.posicao_geral} onChange={e => sf('posicao_geral', e.target.value)} /></Field>
          <Field label="Nº Sócios"><input className="input" type="number" value={form.n_socios} onChange={e => sf('n_socios', e.target.value)} /></Field>
          <Field label="Custo (€)"><input className="input" type="number" step="0.01" value={form.custo} onChange={e => sf('custo', e.target.value)} /></Field>
        </div>
      </Modal>

      {/* ══ MODAL DETAIL ══════════════════════════════════════════════════════ */}
      {selected && (
        <Modal open={modal === 'detail'} onClose={close} title={`🏆 ${selected.nome}`} wide
          footer={
            <div style={{ display: 'flex', gap: 8, width: '100%', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => openEncestamento(selected)}>
                📦 {selected.estado_encestamento === 'encestado' ? `Encestado (${(selected.pombos_encestados || []).length})` : `Encestamento (${resultados.length})`}
              </button>
              {selected.estado_encestamento === 'encestado' && (
                <button className="btn btn-secondary btn-sm" style={{ color: '#2DD4A7', borderColor: 'rgba(45,212,167,.3)' }} onClick={registarChegadas}>
                  🏁 Registar Chegadas
                </button>
              )}
              <button className="btn btn-secondary btn-sm" onClick={buscarMeteo} disabled={loadingMeteo}>{loadingMeteo ? <Spinner /> : '🌦️'} MeteoProva</button>
              {perfil?.pombal_lat && <button className="btn btn-primary btn-sm" onClick={abrirMeteoRota}>🗺️ Rota de Voo</button>}
              <div style={{ flex: 1 }} />
              <button className="btn btn-secondary" onClick={close}>Fechar</button>
              <button className="btn btn-primary" onClick={() => openEdit(selected)}>✏️ Editar</button>
            </div>
          }>

          {/* badge encestamento */}
          {selected.estado_encestamento === 'encestado' && (
            <div style={{ background: 'rgba(212,175,55,.07)', border: '1px solid rgba(212,175,55,.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 20 }}>📦</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#D4AF37' }}>{(selected.pombos_encestados || []).length} pombos encestados</div>
                <div style={{ fontSize: 11, color: '#7A8699' }}>
                  {selected.cesto ? `🧺 ${selected.cesto}` : ''}
                  {selected.hora_encestamento ? ` · 🕐 ${selected.hora_encestamento}` : ''}
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" style={{ color: '#2DD4A7', borderColor: 'rgba(45,212,167,.3)' }} onClick={registarChegadas}>
                🏁 Registar Chegadas
              </button>
            </div>
          )}

          {selected.estado_encestamento === 'regressaram' && (
            <div style={{ background: 'rgba(45,212,167,.07)', border: '1px solid rgba(45,212,167,.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#2DD4A7' }}>✅ Pombos de volta ao efectivo</div>
            </div>
          )}

          <div className="grid-3" style={{ marginBottom: 16 }}>
            <div className="kpi"><div className="kpi-val" style={{ fontSize: 22 }}>{selected.dist}km</div><div className="kpi-label">Distância</div></div>
            <div className="kpi"><div className="kpi-val" style={{ fontSize: 22 }}>{resultados.length}</div><div className="kpi-label">Encestados</div></div>
            <div className="kpi"><div className="kpi-val" style={{ fontSize: 22 }}>{resultados.filter(r => r.posicao).length}</div><div className="kpi-label">Com Resultado</div></div>
          </div>

          {historicoSemelhante && (
            <div className="card card-p" style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, color: '#fff', marginBottom: 6 }}>📊 Histórico em Provas Semelhantes</div>
              {historicoSemelhante.nResultados === 0
                ? <div style={{ fontSize: 12, color: '#7A8699' }}>{historicoSemelhante.nProvas} prova(s) parecida(s) sem resultados ainda.</div>
                : <div style={{ fontSize: 12, color: '#94a3b8' }}>Em <strong style={{ color: '#cbd5e1' }}>{historicoSemelhante.nProvas}</strong> prova(s) parecidas, top 3 por <strong style={{ color: '#2DD4A7' }}>{historicoSemelhante.top3}</strong> vez(es), velocidade média <strong style={{ color: '#cbd5e1' }}>{historicoSemelhante.velMedia} km/h</strong>.</div>
              }
            </div>
          )}

          {selected.local_solta && selected.lat_solta && selected.lon_solta && (() => {
            const latS = parseFloat(selected.lat_solta), lonS = parseFloat(selected.lon_solta)
            const latP = perfil?.pombal_lat, lonP = perfil?.pombal_lon
            const html = `<!DOCTYPE html><html><head><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script><style>body{margin:0}#map{height:100vh}<\/style><\/head><body><div id="map"><\/div><script>var map=L.map('map',{attributionControl:false});L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);L.circleMarker([${latS},${lonS}],{radius:8,color:'#f87171',fillColor:'#f87171',fillOpacity:1}).addTo(map).bindPopup('Solta');${latP && lonP ? `L.circleMarker([${latP},${lonP}],{radius:8,color:'#2DD4A7',fillColor:'#2DD4A7',fillOpacity:1}).addTo(map).bindPopup('Pombal');L.polyline([[${latS},${lonS}],[${latP},${lonP}]],{color:'#D4AF37',weight:2.5,dashArray:'6,4'}).addTo(map);map.fitBounds([[${Math.min(latS, latP) - .3},${Math.min(lonS, lonP) - .3}],[${Math.max(latS, latP) + .3},${Math.max(lonS, lonP) + .3}]]);` : `map.setView([${latS},${lonS}],9);`}<\/script><\/body><\/html>`
            return (
              <div style={{ marginBottom: 16 }}>
                <div className="label" style={{ marginBottom: 6 }}>📍 Local de Solta</div>
                <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #1B2D52', height: 240 }}>
                  <iframe srcDoc={html} width="100%" height="100%" frameBorder="0" style={{ display: 'block' }} />
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 6, fontSize: 11, color: '#94a3b8', flexWrap: 'wrap' }}>
                  <span>🔴 Solta</span><span style={{ color: '#D4AF37' }}>– – –</span><span style={{ color: '#2DD4A7' }}>🟢 Pombal</span>
                  {selected.dist && <span style={{ color: '#D4AF37' }}>{selected.dist}km em linha recta</span>}
                  {perfil?.pombal_lat && <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }} onClick={abrirMeteoRota}>🌦️ Ver Rota de Voo</button>}
                </div>
              </div>
            )
          })()}

          {meteo?.hourly && (() => {
            const diaProvaStr = selected.data_reg.slice(0, 10)
            const diasUnicos = [...new Set(meteo.hourly.time.map(t => t.slice(0, 10)))]
            const ventoInfo = (() => {
              if (!perfil?.pombal_lat || !perfil?.pombal_lon || !selected.lat_solta || !selected.lon_solta) return null
              const rumo = calcRumoVoo(selected.lat_solta, selected.lon_solta, perfil.pombal_lat, perfil.pombal_lon)
              const idxSolta = meteo.hourly.time.findIndex(t => t === `${diaProvaStr}T${(selected.hora_solta || '08:00').slice(0, 2)}:00`)
              if (idxSolta < 0) return null
              const direcaoVento = meteo.hourly.winddirection_10m?.[idxSolta]
              if (direcaoVento === undefined) return null
              return { ...classificarVento(rumo, direcaoVento), velocidadeVento: meteo.hourly.windspeed_10m?.[idxSolta] }
            })()
            return (
              <div className="card card-p" style={{ marginBottom: 16, background: '#101F40' }}>
                <div style={{ fontWeight: 600, color: '#fff', marginBottom: 10 }}>🌦️ Meteorologia</div>
                {ventoInfo && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: `${ventoInfo.cor}14`, border: `1px solid ${ventoInfo.cor}40`, marginBottom: 10 }}>
                    <span style={{ fontSize: 20 }}>{ventoInfo.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: ventoInfo.cor }}>{ventoInfo.tipo} ({ventoInfo.velocidadeVento}km/h)</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{ventoInfo.desc}</div>
                    </div>
                  </div>
                )}
                {diasUnicos.map(diaStr => {
                  const isDiaProva = diaStr === diaProvaStr
                  return (
                    <div key={diaStr} style={{ border: isDiaProva ? '1px solid rgba(212,175,55,.35)' : '1px solid #1B2D52', borderRadius: 8, padding: '8px 10px', background: isDiaProva ? 'rgba(212,175,55,.05)' : 'transparent', marginBottom: 6 }}>
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
            )
          })()}

          <div className="card card-p" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontWeight: 600, color: '#fff' }}>📎 Anexos ({(selected.anexos || []).length})</div>
              <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                {uploadingAnexo ? <Spinner /> : '＋ Carregar'}
                <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }} disabled={uploadingAnexo} onChange={e => { uploadAnexo(e.target.files[0]); e.target.value = '' }} />
              </label>
            </div>
            {(selected.anexos || []).length === 0
              ? <div style={{ fontSize: 12, color: '#7A8699' }}>Sem anexos. Carregue uma foto do encestamento ou o boletim de resultados.</div>
              : (selected.anexos || []).map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#101F40', borderRadius: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 16 }}>{a.tipo?.includes('pdf') ? '📄' : '🖼️'}</span>
                    <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, fontSize: 12, color: '#4C8DFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: 'none' }}>{a.nome}</a>
                    <button className="btn btn-icon btn-sm" onClick={() => removerAnexo(a)}>🗑️</button>
                  </div>
                ))
            }
          </div>

          <div className="label" style={{ marginBottom: 8 }}>Resultados</div>
          {loadingRes
            ? <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><Spinner /></div>
            : resultados.length === 0
              ? <div style={{ textAlign: 'center', color: '#7A8699', padding: '20px 0', fontSize: 13 }}>Nenhum pombo encestado. Use "📦 Encestamento" para adicionar.</div>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {resultados.map(r => <ResultadoRow key={r.id} r={r} onSave={guardarResultado} />)}
                </div>
          }
        </Modal>
      )}

      {/* ══ MODAL ENCESTAMENTO ════════════════════════════════════════════════ */}
      {selected && (
        <Modal open={modal === 'encestamento'} onClose={() => setModal('detail')} title={`📦 Encestamento — ${selected.nome}`} wide
          footer={
            <div style={{ display: 'flex', gap: 8, width: '100%', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ fontSize: 12, color: '#7A8699' }}>{encestados.length} pombo(s) seleccionado(s)</div>
              <div style={{ flex: 1 }} />
              <button className="btn btn-secondary" onClick={() => setModal('detail')}>Cancelar</button>
              <button className="btn btn-primary" onClick={confirmarEncestamento} disabled={saving}>
                {saving ? <Spinner /> : null}
                {selected.estado_encestamento === 'encestado' ? 'Actualizar Encestamento' : '📦 Confirmar Encestamento'}
              </button>
            </div>
          }>

          {/* badge se já encestado */}
          {selected.estado_encestamento === 'encestado' && (
            <div style={{ background: 'rgba(45,212,167,.07)', border: '1px solid rgba(45,212,167,.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 12 }}>
              <div style={{ color: '#2DD4A7', fontWeight: 600, marginBottom: 2 }}>✅ Encestamento já registado — pode actualizar</div>
              {selected.cesto && <div style={{ color: '#94a3b8' }}>🧺 Cesto: {selected.cesto}</div>}
              {selected.hora_encestamento && <div style={{ color: '#94a3b8' }}>🕐 Hora: {selected.hora_encestamento}</div>}
            </div>
          )}

          {/* cesto e hora */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            <Field label="🧺 Cesto / Transportador">
              <input className="input" placeholder="Ex: Cesto 3 — Clube Lisboa" value={cesto} onChange={e => setCesto(e.target.value)} />
            </Field>
            <Field label="🕐 Hora de Encestamento">
              <input className="input" type="time" value={horaEncestamento} onChange={e => setHoraEncestamento(e.target.value)} />
            </Field>
          </div>

          {/* atalhos */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setEncestados(pombosParaEncestar.map(p => p.id))}>Todo o efectivo</button>
            <button className="btn btn-secondary btn-sm" onClick={() => setEncestados(pombosParaEncestar.filter(p => p.sexo === 'M').map(p => p.id))}>♂ Machos</button>
            <button className="btn btn-secondary btn-sm" onClick={() => setEncestados(pombosParaEncestar.filter(p => p.sexo === 'F').map(p => p.id))}>♀ Fêmeas</button>
            <button className="btn btn-secondary btn-sm" onClick={() => setEncestados([])}>Limpar</button>
          </div>

          {pombosParaEncestar.some(p => p.classificacao.prioridade <= 1) && (
            <div style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#f87171' }}>
              ⚠️ Há pombos com alerta de saúde — evite encestar pombos que não estejam aptos.
            </div>
          )}

          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>{encestados.length} de {pombosParaEncestar.length} pombos seleccionados</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 360, overflowY: 'auto' }}>
            {pombosParaEncestar.map(p => {
              const c = p.classificacao
              const atencao = c.prioridade <= 1
              const emProva = p.estado_ext === 'em_prova'
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
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {emProva && <span style={{ fontSize: 10, color: '#D4AF37', fontWeight: 700 }}>Em prova</span>}
                    <span style={{ fontSize: 10, fontWeight: 700, color: c.cor, whiteSpace: 'nowrap' }}>{atencao ? '🏥 ' : ''}{c.tag}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </Modal>
      )}

      {/* ══ CONFIRM DELETE ════════════════════════════════════════════════════ */}
      <Modal open={!!confirm} onClose={() => setConfirm(null)} title="Eliminar prova"
        footer={<><button className="btn btn-secondary" onClick={() => setConfirm(null)}>Cancelar</button><button className="btn btn-danger" onClick={del}>Eliminar</button></>}>
        <p style={{ fontSize: 14, color: '#cbd5e1' }}>Eliminar "{confirm?.nome}"? Os resultados associados também serão perdidos.</p>
      </Modal>

      {/* ══ MODAL IMPORT FPC ══════════════════════════════════════════════════ */}
      <Modal open={modalImportFPC} onClose={() => { setModalImportFPC(false); setFpcUrl('') }} title="📥 Importar Resultados FPC"
        footer={<><button className="btn btn-secondary" onClick={() => setModalImportFPC(false)}>Cancelar</button><button className="btn btn-primary" onClick={importarFPC} disabled={importandoFPC}>{importandoFPC ? <Spinner /> : null}Importar</button></>}>
        <div style={{ marginBottom: 12, padding: '10px 12px', background: 'rgba(76,141,255,.06)', border: '1px solid rgba(76,141,255,.15)', borderRadius: 8, fontSize: 12, color: '#94a3b8', lineHeight: 1.7 }}>
          Cole os resultados exportados do site da FPC em formato CSV.<br />
          Formato: <span style={{ fontFamily: "'Space Mono',monospace", color: '#4C8DFF' }}>anilha;posição;velocidade</span><br />
          A 1ª linha deve ser o cabeçalho. As anilhas devem corresponder ao efectivo.
        </div>
        {selected && <div style={{ fontSize: 12, color: '#2DD4A7', marginBottom: 10 }}>✓ Prova: <strong>{selected.nome}</strong></div>}
        {!selected && <div style={{ fontSize: 12, color: '#D4AF37', marginBottom: 10 }}>⚠️ Nenhuma prova seleccionada — será criada automaticamente</div>}
        <Field label="Resultados CSV">
          <textarea className="input" rows={8} style={{ resize: 'vertical', fontFamily: "'Space Mono',monospace", fontSize: 11 }}
            value={fpcUrl} onChange={e => setFpcUrl(e.target.value)}
            placeholder={'anilha;posicao;velocidade\nPT-2022-00001;1;1420\nPT-2022-00002;3;1398\n...'} />
        </Field>
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
        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: '#7A8699' }}>{p?.anilha}</div>
      </div>
      <input className="input" style={{ width: 60, padding: '4px 8px', fontSize: 12 }} type="number" placeholder="Lugar" value={posicao} onChange={e => setPosicao(e.target.value)} onBlur={handleBlur} />
      <input className="input" style={{ width: 90, padding: '4px 8px', fontSize: 12 }} type="time" value={hora} onChange={e => setHora(e.target.value)} onBlur={handleBlur} />
      {r.velocidade ? <span style={{ fontSize: 11, color: '#2DD4A7', fontFamily: "'Space Mono',monospace", whiteSpace: 'nowrap' }}>{r.velocidade} km/h</span> : <span style={{ fontSize: 10, color: '#475569' }}>—</span>}
    </div>
  )
}
