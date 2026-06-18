import { useState } from 'react'
import { useToast, Modal, Field, Badge } from '../components/ui'

const CATEGORIAS = [
  ['todos', 'Todos'],
  ['racao', 'Racoes'],
  ['saude', 'Saude'],
  ['equipamento', 'Equipamento'],
  ['genetica', 'Genetica'],
]

const PRODUTOS_DEFAULT = [
  { id: 1, nome: 'Versele-Laga Racing', cat: 'racao', icon: 'grain', desc: 'Mistura premium para pombos de competicao. Formula enriquecida com aminoacidos essenciais e vitaminas do complexo B.', preco: '18.90/5kg', link: 'https://www.versele-laga.com', destaque: true, tag: 'Mais vendido' },
  { id: 2, nome: 'Beyers Champion Plus', cat: 'racao', icon: 'grain', desc: 'Racao de alta energia para provas de velocidade e meio-fundo. Rica em milho branco e cartamo.', preco: '22.50/5kg', link: '', destaque: false, tag: '' },
  { id: 3, nome: 'Eletrolitos DAC', cat: 'saude', icon: 'pill', desc: 'Reposicao de sais minerais e eletrolitos apos provas longas. Reduz o stress e acelera a recuperacao.', preco: '8.90/400g', link: '', destaque: false, tag: 'Recomendado IA' },
  { id: 4, nome: 'Rohnfried Bt-Amin Forte', cat: 'saude', icon: 'pill', desc: 'Vitaminas e aminoacidos para recuperacao muscular. Ideal nos 2 dias antes e apos provas.', preco: '14.50/250ml', link: '', destaque: true, tag: 'Recomendado IA' },
  { id: 5, nome: 'Trapi Trichomonox', cat: 'saude', icon: 'pill', desc: 'Tratamento eficaz contra tricomonease. Ronidazol de alta pureza.', preco: '9.90/100ml', link: '', destaque: false, tag: '' },
  { id: 6, nome: 'Comedouro Automatico 12L', cat: 'equipamento', icon: 'tool', desc: 'Comedouro automatico com saida regulavel. Capacidade 12L, facil de limpar.', preco: '34.90', link: '', destaque: false, tag: '' },
  { id: 7, nome: 'Antena Chegada Electronic', cat: 'equipamento', icon: 'tool', desc: 'Antena de cronometragem eletronica compativel com os principais chips do mercado.', preco: '189.00', link: '', destaque: false, tag: 'Premium' },
  { id: 8, nome: 'Pedigree Ases Belgas 2024', cat: 'genetica', icon: 'dna', desc: 'Acesso a base de dados de pedigrees de criadores de referencia belgas e holandeses.', preco: '29.00/ano', link: '', destaque: false, tag: '' },
]

const ICON_MAP = { grain: 'grain', pill: 'pill', tool: 'tool', dna: 'dna' }
const ICON_EMOJI = { grain: '🌾', pill: '💊', tool: '🔧', dna: '🧬' }
const catIcon = { racao: '🌾', saude: '💊', equipamento: '🔧', genetica: '🧬' }

function ProdutoCard({ p }) {
  const [exp, setExp] = useState(false)
  const bordaDestaque = p.destaque || p.tag === 'Recomendado IA'
  return (
    <div className="card card-p" style={bordaDestaque ? { borderColor: 'rgba(212,175,55,.3)', background: 'rgba(212,175,55,.04)' } : undefined}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: '#101F40', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{ICON_EMOJI[p.icon] || catIcon[p.cat] || '📦'}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 2 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{p.nome}</div>
            {p.tag && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: p.tag === 'Recomendado IA' ? 'rgba(45,212,167,.15)' : p.tag === 'Premium' ? 'rgba(212,175,55,.15)' : 'rgba(76,141,255,.15)', color: p.tag === 'Recomendado IA' ? '#2DD4A7' : p.tag === 'Premium' ? '#D4AF37' : '#4C8DFF' }}>{p.tag}</span>}
          </div>
          <div style={{ fontSize: 11, color: '#7A8699', marginBottom: 4 }}>{exp ? p.desc : p.desc.slice(0, 80) + (p.desc.length > 80 ? '...' : '')}</div>
          {p.desc.length > 80 && <button onClick={() => setExp(e => !e)} style={{ fontSize: 11, color: '#4C8DFF', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>{exp ? 'Ver menos' : 'Ver mais'}</button>}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8 }}>
            {p.preco && <span style={{ fontFamily: "'Fraunces',serif", fontSize: 14, fontWeight: 700, color: '#2DD4A7' }}>{p.preco}€</span>}
            {p.link && <a href={p.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#4C8DFF', textDecoration: 'none' }}>Ver produto →</a>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Patrocinadores({ nav }) {
  const toast = useToast()
  const [cat, setCat] = useState('todos')
  const [modal, setModal] = useState(false)
  const [extras, setExtras] = useState([])
  const [form, setForm] = useState({ nome: '', cat: 'racao', desc: '', preco: '', link: '', tag: '' })
  const sf = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const todos = [...PRODUTOS_DEFAULT, ...extras]
  const filtrados = cat === 'todos' ? todos : todos.filter(p => p.cat === cat)
  const destaques = todos.filter(p => p.destaque || p.tag === 'Recomendado IA')
  const resto = filtrados.filter(p => !p.destaque && p.tag !== 'Recomendado IA')

  const addProduto = () => {
    if (!form.nome.trim()) { toast('Nome obrigatorio', 'warn'); return }
    const icon = form.cat === 'racao' ? 'grain' : form.cat === 'saude' ? 'pill' : form.cat === 'equipamento' ? 'tool' : 'dna'
    setExtras(e => [...e, { ...form, id: Date.now(), icon, destaque: false }])
    toast('Produto adicionado!', 'ok'); setModal(false)
    setForm({ nome: '', cat: 'racao', desc: '', preco: '', link: '', tag: '' })
  }

  return (
    <div>
      <div className="section-header">
        <div><div className="section-title">Parceiros & Produtos</div><div className="section-sub">Produtos seleccionados para columbófilos</div></div>
        <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>+ Sugerir</button>
      </div>

      <div style={{ background: 'linear-gradient(135deg,rgba(76,141,255,.12),rgba(45,212,167,.08))', border: '1px solid rgba(76,141,255,.2)', borderRadius: 10, padding: '14px 18px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ fontSize: 28 }}>🤖</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 3 }}>Recomendação IA para esta semana</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>Com base no perfil do seu pombal e na época em curso, a IA recomenda reforçar os eletrólitos e vitaminas B antes das provas de fundo. Consulte os produtos marcados com "Recomendado IA".</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {CATEGORIAS.map(([c, l]) => (
          <button key={c} onClick={() => setCat(c)} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: 'none', fontFamily: 'inherit', background: cat === c ? '#1E5FD9' : '#101F40', color: cat === c ? '#fff' : '#94a3b8' }}>
            {c !== 'todos' && catIcon[c] + ' '}{l}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#7A8699', alignSelf: 'center' }}>{filtrados.length} produto(s)</span>
      </div>

      {cat === 'todos' && destaques.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#D4AF37', marginBottom: 10, letterSpacing: .5 }}>DESTAQUES</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {destaques.map(p => <ProdutoCard key={p.id} p={p} />)}
          </div>
          {resto.length > 0 && <div style={{ fontSize: 11, fontWeight: 700, color: '#7A8699', marginTop: 16, marginBottom: 10, letterSpacing: .5 }}>OUTROS PRODUTOS</div>}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(cat === 'todos' ? resto : filtrados).map(p => <ProdutoCard key={p.id} p={p} />)}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Sugerir Produto"
        footer={<><button className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={addProduto}>Adicionar</button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Nome *"><input className="input" value={form.nome} onChange={e => sf('nome', e.target.value)} /></Field>
          <Field label="Categoria"><select className="input" value={form.cat} onChange={e => sf('cat', e.target.value)}>{CATEGORIAS.slice(1).map(([v,l]) => <option key={v} value={v}>{catIcon[v]} {l}</option>)}</select></Field>
          <Field label="Descricao"><textarea className="input" rows={3} style={{ resize: 'none' }} value={form.desc} onChange={e => sf('desc', e.target.value)} /></Field>
          <div className="form-grid">
            <Field label="Preco (referencia)"><input className="input" placeholder="12.90/250ml" value={form.preco} onChange={e => sf('preco', e.target.value)} /></Field>
            <Field label="Link (opcional)"><input className="input" placeholder="https://..." value={form.link} onChange={e => sf('link', e.target.value)} /></Field>
          </div>
        </div>
      </Modal>
    </div>
  )
}
