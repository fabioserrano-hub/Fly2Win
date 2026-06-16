import { useState, useEffect, useCallback } from 'react'
import { db, supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useToast, Spinner, Modal, EmptyState, Field, Badge } from '../components/ui'

const FASES = ['Não Competitivo', 'Pré-Competitivo', 'Competição', 'Muda', 'Repouso']
const APTIDOES = ['Apto', 'Em Observação', 'Lesionado', 'Doente', 'Inapto']
const aptBadge = { 'Apto': 'green', 'Em Observação': 'yellow', 'Lesionado': 'red', 'Doente': 'red', 'Inapto': 'gray' }
const EMPTY = { pigeon_id: '', fase: 'Não Competitivo', aptidao: 'Apto', peso: '', obs: '', data_reg: new Date().toISOString().slice(0, 10) }
const EMPTY_VAC = { pigeon_id: '', nome: '', data_aplicacao: new Date().toISOString().slice(0, 10), proxima_dose: '', obs: '' }

export default function Saude({ nav, params }) {
  const toast = useToast()
  const { user } = useAuth()
  const [registos, setRegistos] = useState([])
  const [pombos, setPombos] = useState([])
  const [vacinas, setVacinas] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('registos')
  const [modal, setModal] = useState(false)
  const [modalVac, setModalVac] = useState(false)
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [formVac, setFormVac] = useState(EMPTY_VAC)
  const sf = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const sfv = (k, v) => setFormVac(f => ({ ...f, [k]: v }))

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [r, p] = await Promise.all([db.getSaude(), db.getPombos()])
      setRegistos(r); setPombos(p)
      try { setVacinas(JSON.parse(localStorage.getItem('cl_vacinas') || '[]')) } catch (e) { setVacinas([]) }
    } catch (e) { toast('Erro: ' + e.message, 'err') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (params?.prefillPomboId && pombos.length) {
      const p = pombos.find(x => x.id === params.prefillPomboId)
      if (p) {
        setForm({ ...EMPTY, pigeon_id: p.id })
        setSelected(null)
        setModal(true)
      }
    }
  }, [params, pombos])

  const openNew = () => { setForm(EMPTY); setSelected(null); setModal(true) }
  const openEdit = (r) => { setSelected(r); setForm({ pigeon_id: r.pigeon_id || '', fase: r.fase || 'Não Competitivo', aptidao: r.apt || r.aptidao || 'Apto', peso: String(r.peso || ''), obs: r.obs || '', data_reg: r.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10) }); setModal(true) }
  const close = () => { setModal(false); setSelected(null) }

  const save = async () => {
    if (!form.pigeon_id) { toast('Seleccione um pombo', 'warn'); return }
    setSaving(true)
    try {
      const pombo = pombos.find(p => p.id === form.pigeon_id)
      const payload = { pigeon_id: form.pigeon_id, anel: pombo?.anilha || '', nome_pombo: pombo?.nome || '', fase: form.fase, apt: form.aptidao, aptidao: form.aptidao, peso: form.peso ? parseInt(form.peso) : null, obs: form.obs }
      selected ? await db.updateSaude(selected.id, payload) : await db.createSaude(payload)
      toast(selected ? 'Actualizado!' : 'Registo criado!', 'ok'); close(); load()
    } catch (e) { toast('Erro: ' + e.message, 'err') }
    finally { setSaving(false) }
  }

  const del = async () => {
    try { await db.deleteSaude(confirm.id); toast('Eliminado', 'ok'); setConfirm(null); load() }
    catch (e) { toast('Erro: ' + e.message, 'err') }
  }

  const openNewVac = () => { setFormVac(EMPTY_VAC); setModalVac(true) }
  const saveVac = () => {
    if (!formVac.pigeon_id || !formVac.nome.trim()) { toast('Pombo e nome da vacina obrigatórios', 'warn'); return }
    const pombo = pombos.find(p => p.id === formVac.pigeon_id)
    const novo = [...vacinas, { id: Date.now(), ...formVac, nome_pombo: pombo?.nome || '' }]
    setVacinas(novo)
    try { localStorage.setItem('cl_vacinas', JSON.stringify(novo)) } catch (e) {}
    toast('Vacina registada!', 'ok'); setModalVac(false)
  }
  const delVac = (id) => {
    const novo = vacinas.filter(v => v.id !== id)
    setVacinas(novo)
    try { localStorage.setItem('cl_vacinas', JSON.stringify(novo)) } catch (e) {}
    toast('Removida', 'ok')
  }

  const registosOrdenados = [...registos].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  const kpiApt = registos.filter(r => (r.apt || r.aptidao) === 'Apto').length
  const kpiObs = registos.filter(r => (r.apt || r.aptidao) === 'Em Observação').length
  const kpiLes = registos.filter(r => ['Lesionado', 'Doente'].includes(r.apt || r.aptidao)).length

  const vacinasProximas = vacinas.filter(v => {
    if (!v.proxima_dose) return false
    const dias = (new Date(v.proxima_dose) - new Date()) / 86400000
    return dias >= 0 && dias <= 14
  })

  return (
    <div>
      <div className="section-header">
        <div><div className="section-title">Saúde</div><div className="section-sub">{registos.length} registos clínicos</div></div>
        <button className="btn btn-primary" onClick={tab === 'registos' ? openNew : openNewVac}>＋ {tab === 'registos' ? 'Novo Registo' : 'Nova Vacina'}</button>
      </div>

      <div style={{ display: 'flex', gap: 4, background: '#1a2840', borderRadius: 10, padding: 4, marginBottom: 16 }}>
        {[['registos', '🏥 Registos Clínicos'], ['vacinas', `💉 Vacinas${vacinasProximas.length ? ` (${vacinasProximas.length})` : ''}`]].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none', fontFamily: 'inherit', background: tab === t ? '#1ed98a' : 'none', color: tab === t ? '#0a0f14' : '#94a3b8' }}>{l}</button>
        ))}
      </div>

      {tab === 'registos' && (
        <>
          <div className="grid-3 mb-6">
            <div className="kpi"><div className="kpi-val text-green">{kpiApt}</div><div className="kpi-label">Aptos</div></div>
            <div className="kpi"><div className="kpi-val text-yellow">{kpiObs}</div><div className="kpi-label">Em Observação</div></div>
            <div className="kpi"><div className="kpi-val text-red">{kpiLes}</div><div className="kpi-label">Lesionados/Doentes</div></div>
          </div>

          {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner lg /></div>
            : registos.length === 0 ? <EmptyState icon="🏥" title="Sem registos" desc="Registe o primeiro acompanhamento clínico" action={<button className="btn btn-primary" onClick={openNew}>＋ Novo Registo</button>} />
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {registosOrdenados.map(r => (
                  <div key={r.id} className="card card-p">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: '#1a2840', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                        {r.pigeons?.emoji || '🐦'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{r.nome_pombo || r.pigeons?.nome || '—'}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{r.fase} {r.peso ? `· ${r.peso}g` : ''} · {new Date(r.created_at).toLocaleDateString('pt-PT')}</div>
                        {r.obs && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{r.obs}</div>}
                      </div>
                      <Badge v={aptBadge[r.apt || r.aptidao] || 'gray'}>{r.apt || r.aptidao}</Badge>
                      <button className="btn btn-icon btn-sm" onClick={() => openEdit(r)}>✏️</button>
                      <button className="btn btn-icon btn-sm" onClick={() => setConfirm(r)}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
          }
        </>
      )}

      {tab === 'vacinas' && (
        <div>
          {vacinasProximas.length > 0 && (
            <div style={{ background: 'rgba(234,179,8,.08)', border: '1px solid rgba(234,179,8,.2)', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
              <div style={{ fontWeight: 600, color: '#facc15', marginBottom: 6 }}>💉 {vacinasProximas.length} próxima(s) dose(s) nos próximos 14 dias</div>
              {vacinasProximas.map(v => <div key={v.id} style={{ fontSize: 12, color: '#cbd5e1' }}>{v.nome_pombo} — {v.nome} em {new Date(v.proxima_dose).toLocaleDateString('pt-PT')}</div>)}
            </div>
          )}
          {vacinas.length === 0
            ? <EmptyState icon="💉" title="Sem vacinas registadas" desc="Registe vacinas e tratamentos preventivos" action={<button className="btn btn-primary" onClick={openNewVac}>＋ Nova Vacina</button>} />
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {vacinas.map(v => (
                  <div key={v.id} className="card card-p">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ fontSize: 22 }}>💉</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{v.nome} — {v.nome_pombo}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>Aplicada: {new Date(v.data_aplicacao).toLocaleDateString('pt-PT')}{v.proxima_dose ? ` · Próxima: ${new Date(v.proxima_dose).toLocaleDateString('pt-PT')}` : ''}</div>
                      </div>
                      <button className="btn btn-danger btn-sm" onClick={() => delVac(v.id)}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>
      )}

      <Modal open={modal} onClose={close} title={selected ? '✏️ Editar Registo' : '🏥 Novo Registo de Saúde'}
        footer={<><button className="btn btn-secondary" onClick={close}>Cancelar</button><button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? <Spinner /> : null}{selected ? 'Guardar' : 'Registar'}</button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Pombo *">
            <select className="input" value={form.pigeon_id} onChange={e => sf('pigeon_id', e.target.value)} disabled={!!selected}>
              <option value="">— Seleccionar —</option>
              {pombos.map(p => <option key={p.id} value={p.id}>{p.nome} ({p.anilha})</option>)}
            </select>
          </Field>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <Field label="Fase"><select className="input" value={form.fase} onChange={e => sf('fase', e.target.value)}>{FASES.map(f => <option key={f}>{f}</option>)}</select></Field>
            <Field label="Aptidão"><select className="input" value={form.aptidao} onChange={e => sf('aptidao', e.target.value)}>{APTIDOES.map(a => <option key={a}>{a}</option>)}</select></Field>
            <Field label="Peso (g)"><input className="input" type="number" placeholder="420" value={form.peso} onChange={e => sf('peso', e.target.value)} /></Field>
            <Field label="Data"><input className="input" type="date" value={form.data_reg} onChange={e => sf('data_reg', e.target.value)} /></Field>
          </div>
          <Field label="Observações"><textarea className="input" rows={3} style={{ resize: 'none' }} placeholder="Sintomas, tratamento aplicado..." value={form.obs} onChange={e => sf('obs', e.target.value)} /></Field>
        </div>
      </Modal>

      <Modal open={modalVac} onClose={() => setModalVac(false)} title="💉 Nova Vacina"
        footer={<><button className="btn btn-secondary" onClick={() => setModalVac(false)}>Cancelar</button><button className="btn btn-primary" onClick={saveVac}>Registar</button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Pombo *">
            <select className="input" value={formVac.pigeon_id} onChange={e => sfv('pigeon_id', e.target.value)}>
              <option value="">— Seleccionar —</option>
              {pombos.map(p => <option key={p.id} value={p.id}>{p.nome} ({p.anilha})</option>)}
            </select>
          </Field>
          <Field label="Vacina / Tratamento *"><input className="input" placeholder="Ex: Paramyxovirus" value={formVac.nome} onChange={e => sfv('nome', e.target.value)} /></Field>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <Field label="Data Aplicação"><input className="input" type="date" value={formVac.data_aplicacao} onChange={e => sfv('data_aplicacao', e.target.value)} /></Field>
            <Field label="Próxima Dose"><input className="input" type="date" value={formVac.proxima_dose} onChange={e => sfv('proxima_dose', e.target.value)} /></Field>
          </div>
          <Field label="Observações"><input className="input" placeholder="Notas..." value={formVac.obs} onChange={e => sfv('obs', e.target.value)} /></Field>
        </div>
      </Modal>

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title="Eliminar registo"
        footer={<><button className="btn btn-secondary" onClick={() => setConfirm(null)}>Cancelar</button><button className="btn btn-danger" onClick={del}>Eliminar</button></>}>
        <p style={{ fontSize: 14, color: '#cbd5e1' }}>Eliminar este registo de saúde?</p>
      </Modal>
    </div>
  )
}
