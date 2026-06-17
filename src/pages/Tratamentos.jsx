import { useState, useEffect, useCallback } from 'react'
import { db } from '../lib/supabase'
import { useToast, Spinner, Modal, EmptyState, Field, Badge } from '../components/ui'

const PRODUTOS_SUGERIDOS = ['Amprolium', 'Ronidazol', 'Enrofloxacina', 'Doxiciclina', 'Spartrix', 'Tylan', 'Baycox', 'Eskazole', 'Vitaminas A+D3+E', 'Eletrólitos', 'Probióticos', 'Levedura de Cerveja']
const ESPECIALIDADES = ['velocidade', 'meio_fundo', 'fundo', 'geral']
const espLabel = { velocidade: 'Velocidade', meio_fundo: 'Meio-Fundo', fundo: 'Fundo', geral: 'Geral' }
const DIAS = [
  { key: 'domingo', label: 'Domingo', idx: 0 },
  { key: 'segunda', label: 'Segunda', idx: 1 },
  { key: 'terca', label: 'Terça', idx: 2 },
  { key: 'quarta', label: 'Quarta', idx: 3 },
  { key: 'quinta', label: 'Quinta', idx: 4 },
  { key: 'sexta', label: 'Sexta', idx: 5 },
  { key: 'sabado', label: 'Sábado', idx: 6 },
]
const diaIdx = (key) => DIAS.find(d => d.key === key)?.idx ?? 0

// Calcula D-N a partir do dia da semana do item e do dia de prova de referência do plano
function calcularDN(diaItemKey, diaProvaKey) {
  const idxItem = diaIdx(diaItemKey)
  const idxProva = diaIdx(diaProvaKey)
  let diff = idxProva - idxItem
  if (diff < 0) diff += 7
  return diff === 0 ? 'Dia da prova' : `D-${diff}`
}

// Segunda-feira da semana corrente, em formato YYYY-MM-DD
function segundaFeiraDesta(data = new Date()) {
  const d = new Date(data)
  const diff = (d.getDay() + 6) % 7 // 0 = segunda
  d.setDate(d.getDate() - diff)
  return d.toISOString().slice(0, 10)
}

// Calcula a dosagem total a partir de um texto como "1ml por litro" ou "1 comprimido por pombo", multiplicando pelo nº de pombos
function calcularDosagemTotal(dosagemTexto, nPombos) {
  const match = dosagemTexto.match(/^([\d.,]+)\s*(\w+)\s*por\s*(pombo|litro)/i)
  if (!match) return dosagemTexto
  const valor = parseFloat(match[1].replace(',', '.'))
  const unidade = match[2]
  const base = match[3].toLowerCase()
  if (base === 'pombo') {
    const total = valor * nPombos
    return `${dosagemTexto} → total: ${total}${unidade} para ${nPombos} pombos`
  }
  return dosagemTexto
}

const ITEM_VAZIO = { dia_semana: 'quarta', produto: '', dosagem: '', notas: '' }
const PLANO_VAZIO = { nome: '', especialidade: 'velocidade', dia_prova: 'domingo', itens: [], obs: '' }

export default function Tratamentos({ nav }) {
  const toast = useToast()
  const [planos, setPlanos] = useState([])
  const [aplicacoes, setAplicacoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('semana')
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [form, setForm] = useState(PLANO_VAZIO)
  const sf = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const [modalAplicar, setModalAplicar] = useState(false)
  const [planoParaAplicar, setPlanoParaAplicar] = useState(null)
  const [nPombosAplicar, setNPombosAplicar] = useState('20')
  const [savingAplicar, setSavingAplicar] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try { const [p, a] = await Promise.all([db.getTreatmentPlans(), db.getTreatmentApplications()]); setPlanos(p); setAplicacoes(a) }
    catch (e) { toast('Erro: ' + e.message + ' (verifique se as tabelas treatment_plans/treatment_applications existem)', 'err') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const semanaAtual = segundaFeiraDesta()
  const aplicacaoAtiva = aplicacoes.find(a => a.semana_inicio === semanaAtual)
  const planoAtivo = aplicacaoAtiva ? planos.find(p => p.id === aplicacaoAtiva.plan_id) : null

  const openNewPlano = () => { setForm(PLANO_VAZIO); setSelected(null); setModal('plano') }
  const openEditPlano = (p) => { setSelected(p); setForm({ nome: p.nome, especialidade: p.especialidade || 'geral', dia_prova: p.dia_prova || 'domingo', itens: p.itens || [], obs: p.obs || '' }); setModal('plano') }
  const closePlano = () => { setModal(null); setSelected(null) }

  const addItem = () => setForm(f => ({ ...f, itens: [...f.itens, { ...ITEM_VAZIO }] }))
  const updateItem = (i, k, v) => setForm(f => ({ ...f, itens: f.itens.map((it, idx) => idx === i ? { ...it, [k]: v } : it) }))
  const removeItem = (i) => setForm(f => ({ ...f, itens: f.itens.filter((_, idx) => idx !== i) }))

  const savePlano = async () => {
    if (!form.nome.trim()) { toast('Nome do plano obrigatório', 'warn'); return }
    if (form.itens.length === 0) { toast('Adicione pelo menos um dia ao plano', 'warn'); return }
    setSaving(true)
    try {
      const payload = { nome: form.nome.trim(), especialidade: form.especialidade, dia_prova: form.dia_prova, itens: form.itens, obs: form.obs }
      selected ? await db.updateTreatmentPlan(selected.id, payload) : await db.createTreatmentPlan(payload)
      toast(selected ? 'Plano actualizado!' : 'Plano criado!', 'ok'); closePlano(); load()
    } catch (e) { toast('Erro: ' + e.message, 'err') }
    finally { setSaving(false) }
  }

  const delPlano = async () => {
    try { await db.deleteTreatmentPlan(confirm.id); toast('Plano eliminado', 'ok'); setConfirm(null); load() }
    catch (e) { toast('Erro: ' + e.message, 'err') }
  }

  const abrirAplicar = (plano) => { setPlanoParaAplicar(plano); setNPombosAplicar('20'); setModalAplicar(true) }

  const confirmarAplicar = async () => {
    setSavingAplicar(true)
    try {
      await db.createTreatmentApplication({ plan_id: planoParaAplicar.id, semana_inicio: semanaAtual, n_pombos: parseInt(nPombosAplicar) || 0, estado_dias: {} })
      toast('Plano aplicado a esta semana!', 'ok'); setModalAplicar(false); load()
    } catch (e) { toast('Erro: ' + e.message, 'err') }
    finally { setSavingAplicar(false) }
  }

  const toggleDiaFeito = async (diaKey) => {
    if (!aplicacaoAtiva) return
    try {
      const novoEstado = { ...aplicacaoAtiva.estado_dias, [diaKey]: !aplicacaoAtiva.estado_dias[diaKey] }
      await db.updateTreatmentApplication(aplicacaoAtiva.id, { estado_dias: novoEstado })
      load()
    } catch (e) { toast('Erro: ' + e.message, 'err') }
  }

  const encerrarAplicacao = async () => {
    try { await db.deleteTreatmentApplication(aplicacaoAtiva.id); toast('Aplicação removida desta semana', 'ok'); load() }
    catch (e) { toast('Erro: ' + e.message, 'err') }
  }

  const itensOrdenadosPorDia = (plano) => {
    if (!plano) return []
    return [...plano.itens].sort((a, b) => {
      const da = calcularDN(a.dia_semana, plano.dia_prova)
      const dbb = calcularDN(b.dia_semana, plano.dia_prova)
      const na = da === 'Dia da prova' ? 0 : parseInt(da.replace('D-', ''))
      const nb = dbb === 'Dia da prova' ? 0 : parseInt(dbb.replace('D-', ''))
      return nb - na
    })
  }

  return (
    <div>
      <div className="section-header">
        <div><div className="section-title">Tratamentos</div><div className="section-sub">{planos.length} plano(s) · {aplicacaoAtiva ? 'plano activo esta semana' : 'sem plano activo esta semana'}</div></div>
        {tab === 'planos' && <button className="btn btn-primary" onClick={openNewPlano}>＋ Novo Plano</button>}
      </div>

      <div style={{ display: 'flex', gap: 4, background: '#101F40', borderRadius: 8, padding: 4, marginBottom: 16 }}>
        {[['semana', '📅 Esta Semana'], ['planos', '🧪 Os Meus Planos']].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '8px 14px', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none', fontFamily: 'inherit', background: tab === t ? '#1E5FD9' : 'none', color: tab === t ? '#fff' : '#94a3b8' }}>{l}</button>
        ))}
      </div>

      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner lg /></div> : (
        <>
          {tab === 'semana' && (
            <div>
              {!aplicacaoAtiva ? (
                planos.length === 0 ? (
                  <EmptyState icon="🧪" title="Sem planos de tratamento" desc="Crie o seu primeiro plano em 'Os Meus Planos' para começar a aplicá-lo semana a semana" action={<button className="btn btn-primary" onClick={() => setTab('planos')}>Criar Plano →</button>} />
                ) : (
                  <div>
                    <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>Nenhum plano activo nesta semana. Escolha um plano para aplicar:</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {planos.map(p => (
                        <div key={p.id} className="card card-p">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ fontSize: 20 }}>🧪</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{p.nome}</div>
                              <div style={{ fontSize: 11, color: '#7A8699' }}>{espLabel[p.especialidade] || p.especialidade} · {p.itens.length} dia(s) de tratamento</div>
                            </div>
                            <button className="btn btn-primary btn-sm" onClick={() => abrirAplicar(p)}>Aplicar esta semana</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ) : (
                <div>
                  <div className="card card-p mb-6">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <div>
                        <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 16, color: '#fff' }}>{planoAtivo?.nome || 'Plano'}</div>
                        <div style={{ fontSize: 11, color: '#7A8699' }}>{espLabel[planoAtivo?.especialidade] || ''} · {aplicacaoAtiva.n_pombos} pombo(s) a tratar</div>
                      </div>
                      <Badge v="blue">Activo</Badge>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                    {itensOrdenadosPorDia(planoAtivo).map((item, i) => {
                      const dn = calcularDN(item.dia_semana, planoAtivo.dia_prova)
                      const feito = !!aplicacaoAtiva.estado_dias[item.dia_semana]
                      return (
                        <div key={i} className="card card-p" style={{ borderColor: feito ? 'rgba(45,212,167,.3)' : undefined }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <button onClick={() => toggleDiaFeito(item.dia_semana)} style={{ width: 22, height: 22, borderRadius: 6, border: feito ? 'none' : '2px solid #1B2D52', background: feito ? '#2DD4A7' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, fontSize: 13, padding: 0 }}>
                              {feito && '✓'}
                            </button>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 500, color: feito ? '#7A8699' : '#fff', textDecoration: feito ? 'line-through' : 'none' }}>{DIAS.find(d => d.key === item.dia_semana)?.label} <span style={{ color: '#D4AF37', fontWeight: 600 }}>({dn})</span> — {item.produto || 'Produto não definido'}</div>
                              {item.dosagem && <div style={{ fontSize: 11, color: '#7A8699' }}>{calcularDosagemTotal(item.dosagem, aplicacaoAtiva.n_pombos)}</div>}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <button className="btn btn-secondary btn-sm" onClick={encerrarAplicacao}>Remover plano desta semana</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'planos' && (
            planos.length === 0 ? <EmptyState icon="🧪" title="Sem planos" desc="Construa o seu primeiro plano de tratamento por especialidade" action={<button className="btn btn-primary" onClick={openNewPlano}>＋ Novo Plano</button>} />
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {planos.map(p => (
                  <div key={p.id} className="card card-p">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ fontSize: 20 }}>🧪</div>
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{p.nome}</div>
                        <div style={{ fontSize: 11, color: '#7A8699' }}>{espLabel[p.especialidade] || p.especialidade} · prova ao {DIAS.find(d => d.key === p.dia_prova)?.label?.toLowerCase()} · {p.itens.length} dia(s)</div>
                      </div>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEditPlano(p)}>✏️ Editar</button>
                      <button className="btn btn-icon btn-sm" onClick={() => setConfirm(p)}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
          )}
        </>
      )}

      <Modal open={modal === 'plano'} onClose={closePlano} title={selected ? '✏️ Editar Plano' : '🧪 Novo Plano de Tratamento'} wide
        footer={<><button className="btn btn-secondary" onClick={closePlano}>Cancelar</button><button className="btn btn-primary" onClick={savePlano} disabled={saving}>{saving ? <Spinner /> : null}{selected ? 'Guardar' : 'Criar Plano'}</button></>}>
        <div className="form-grid">
          <div className="col-2"><Field label="Nome do Plano *"><input className="input" placeholder="Ex: Plano Velocidade" value={form.nome} onChange={e => sf('nome', e.target.value)} /></Field></div>
          <Field label="Especialidade"><select className="input" value={form.especialidade} onChange={e => sf('especialidade', e.target.value)}>{ESPECIALIDADES.map(e => <option key={e} value={e}>{espLabel[e]}</option>)}</select></Field>
          <Field label="Dia da Prova (referência para D-N)"><select className="input" value={form.dia_prova} onChange={e => sf('dia_prova', e.target.value)}>{DIAS.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}</select></Field>
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Dias de Tratamento</div>
            <button className="btn btn-secondary btn-sm" onClick={addItem}>＋ Adicionar Dia</button>
          </div>
          {form.itens.length === 0 ? (
            <div style={{ fontSize: 12, color: '#7A8699', textAlign: 'center', padding: '16px 0' }}>Ainda sem dias. Adicione o primeiro.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {form.itens.map((item, i) => (
                <div key={i} style={{ background: '#101F40', borderRadius: 8, padding: 12 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, color: '#7A8699', marginBottom: 4 }}>Dia da Semana</div>
                      <select className="input" value={item.dia_semana} onChange={e => updateItem(i, 'dia_semana', e.target.value)}>
                        {DIAS.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
                      </select>
                    </div>
                    <div style={{ flex: '0 0 90px', textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: '#7A8699', marginBottom: 4 }}>Posição</div>
                      <div style={{ background: '#0B1830', borderRadius: 6, padding: '8px 0', fontSize: 12, fontWeight: 700, color: '#D4AF37' }}>{calcularDN(item.dia_semana, form.dia_prova)}</div>
                    </div>
                    <button className="btn btn-icon btn-sm" onClick={() => removeItem(i)}>🗑️</button>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <input className="input" list={`produtos-${i}`} placeholder="Produto (ex: Eletrólitos)" value={item.produto} onChange={e => updateItem(i, 'produto', e.target.value)} />
                      <datalist id={`produtos-${i}`}>{PRODUTOS_SUGERIDOS.map(p => <option key={p} value={p} />)}</datalist>
                    </div>
                    <input className="input" style={{ flex: 1 }} placeholder="Dosagem (ex: 1ml por litro de água)" value={item.dosagem} onChange={e => updateItem(i, 'dosagem', e.target.value)} />
                  </div>
                  <input className="input" placeholder="Notas (opcional)" value={item.notas} onChange={e => updateItem(i, 'notas', e.target.value)} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: 16 }}>
          <Field label="Observações Gerais do Plano"><textarea className="input" rows={2} style={{ resize: 'none' }} value={form.obs} onChange={e => sf('obs', e.target.value)} /></Field>
        </div>
      </Modal>

      <Modal open={modalAplicar} onClose={() => setModalAplicar(false)} title={`Aplicar "${planoParaAplicar?.nome}" a esta semana`}
        footer={<><button className="btn btn-secondary" onClick={() => setModalAplicar(false)}>Cancelar</button><button className="btn btn-primary" onClick={confirmarAplicar} disabled={savingAplicar}>{savingAplicar ? <Spinner /> : null}Aplicar</button></>}>
        <Field label="Quantos pombos vai tratar nesta aplicação?">
          <input className="input" type="number" value={nPombosAplicar} onChange={e => setNPombosAplicar(e.target.value)} />
        </Field>
        <div style={{ fontSize: 11, color: '#7A8699', marginTop: 8 }}>Este número é independente do efectivo geral — indique apenas os pombos que vai tratar nesta aplicação concreta (ex: só os que vão a prova este fim de semana).</div>
      </Modal>

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title="Eliminar plano"
        footer={<><button className="btn btn-secondary" onClick={() => setConfirm(null)}>Cancelar</button><button className="btn btn-danger" onClick={delPlano}>Eliminar</button></>}>
        <p style={{ fontSize: 14, color: '#cbd5e1' }}>Eliminar o plano "{confirm?.nome}"? As aplicações semanais já feitas não serão apagadas.</p>
      </Modal>
    </div>
  )
}

