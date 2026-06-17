import { useState, useEffect } from 'react'
import { useToast, Modal, EmptyState, Field } from '../components/ui'

const TIPOS_ICON = { Certificado: '🏆', Regulamento: '📋', Relatório: '📊', Comprovativo: '📄', Outro: '📁' }

export default function Documentos() {
  const toast = useToast()
  const [docs, setDocs] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ nome: '', tipo: 'Certificado', desc: '', url: '' })
  const sf = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    try { setDocs(JSON.parse(localStorage.getItem('cl_docs') || '[]')) } catch (e) {}
  }, [])

  const save = () => {
    if (!form.nome.trim()) { toast('Nome obrigatório', 'warn'); return }
    const novo = [...docs, { id: Date.now(), ...form, data: new Date().toISOString().slice(0, 10) }]
    setDocs(novo)
    try { localStorage.setItem('cl_docs', JSON.stringify(novo)) } catch (e) {}
    toast('Documento adicionado!', 'ok')
    setModal(false)
    setForm({ nome: '', tipo: 'Certificado', desc: '', url: '' })
  }

  const del = (id) => {
    const novo = docs.filter(d => d.id !== id)
    setDocs(novo)
    try { localStorage.setItem('cl_docs', JSON.stringify(novo)) } catch (e) {}
    toast('Removido', 'ok')
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <div className="section-title">Documentos</div>
          <div className="section-sub">{docs.length} documentos</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>＋ Novo Documento</button>
      </div>

      {docs.length === 0
        ? <EmptyState icon="📄" title="Sem documentos" desc="Guarde links para documentos importantes"
            action={<button className="btn btn-primary" onClick={() => setModal(true)}>＋ Novo Documento</button>} />
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {docs.map(d => (
              <div key={d.id} className="card card-p" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 28, flexShrink: 0 }}>{TIPOS_ICON[d.tipo] || '📁'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, color: '#fff' }}>{d.nome}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{d.tipo} · {d.data}</div>
                  {d.desc && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{d.desc}</div>}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {d.url && <a href={d.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">🔗 Abrir</a>}
                  <button className="btn btn-danger btn-sm" onClick={() => del(d.id)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
      }

      <Modal open={modal} onClose={() => setModal(false)} title="📄 Novo Documento"
        footer={<><button className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={save}>Guardar</button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Nome *"><input className="input" placeholder="Ex: Certificado de Campeão 2026" value={form.nome} onChange={e => sf('nome', e.target.value)} /></Field>
          <Field label="Tipo">
            <select className="input" value={form.tipo} onChange={e => sf('tipo', e.target.value)}>
              {['Certificado', 'Regulamento', 'Relatório', 'Comprovativo', 'Outro'].map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Descrição"><input className="input" placeholder="Breve descrição..." value={form.desc} onChange={e => sf('desc', e.target.value)} /></Field>
          <Field label="Link (URL)"><input className="input" placeholder="https://..." value={form.url} onChange={e => sf('url', e.target.value)} /></Field>
        </div>
      </Modal>
    </div>
  )
}
