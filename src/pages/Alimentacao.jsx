import { useState, useEffect, useCallback, useRef } from 'react'
import { db } from '../lib/supabase'
import { useIdioma } from '../hooks/useIdioma'
import { useToast, Spinner, Modal, EmptyState, Field, Badge } from '../components/ui'

// ── constantes ────────────────────────────────────────────────────────────────
const CEREAIS = ['Milho','Cevada','Trigo','Aveia','Ervilha','Girassol','Cártamo','Colza','Painço','Arroz']
const RACOES_COMERCIAIS = ['Versele-Laga Gerry Plus','Versele-Laga Coloured','Beyers Sport','Beyers Energy Plus','Roehnfried Champion','Roehnfried Original','DAC Mistura Competição','DAC Mistura Muda']
const MEDICAMENTOS_LISTA = ['Amprolium','Ronidazol','Enrofloxacina','Doxiciclina','Spartrix','Tylan','Baycox','Eskazole','Vitaminas A+D3+E','Eletrólitos','Hepatox','Probiotic Total B','Vitapombo','Vita Amino Plus','Ampola X','Hexa Plus','Formix','Haemo Plus','Columbovet','Tetrakilon Forte','Respiral Vet','Oxigen Plus','Total Bath MG++']
const TIPOS_STOCK = ['Cereal','Ração Comercial','Medicamento','Suplemento','Outro']
const UNIDADES = ['kg','g','L','ml','comprimidos','unidades']
const ESPECIALIDADES = ['velocidade','meio_fundo','fundo','geral']
const ESP_LABEL = { velocidade:'Velocidade', meio_fundo:'Meio-Fundo', fundo:'Fundo', geral:'Geral' }
const MODO_LABEL = { agua:'💧 Na água', racao:'🌾 Na ração', direto:'💊 Direto ao pombo', outros:'🛁 Outros' }
const BASE_LABEL = { pombo:'por pombo', litro:'por litro', kg:'por kg de ração' }
const DIAS_SEMANA = [
  { key:'domingo', label:'Domingo', idx:0 },
  { key:'segunda', label:'Segunda', idx:1 },
  { key:'terca',   label:'Terça',   idx:2 },
  { key:'quarta',  label:'Quarta',  idx:3 },
  { key:'quinta',  label:'Quinta',  idx:4 },
  { key:'sexta',   label:'Sexta',   idx:5 },
  { key:'sabado',  label:'Sábado',  idx:6 },
]
const diaIdx = k => DIAS_SEMANA.find(d => d.key === k)?.idx ?? 0

function calcDN(diaItem, diaProva) {
  let diff = diaIdx(diaProva) - diaIdx(diaItem)
  if (diff < 0) diff += 7
  return diff === 0 ? 'Dia da Prova' : `D-${diff}`
}

function segundaFeira(data = new Date()) {
  const d = new Date(data)
  const diff = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - diff)
  return d.toISOString().slice(0, 10)
}

function hoje() { return new Date().toISOString().slice(0, 10) }
function diaSemanaHoje() { return DIAS_SEMANA[new Date().getDay()].key }

// ── valores iniciais ──────────────────────────────────────────────────────────
const ITEM_VAZIO = (periodo = 'manha') => ({
  periodo,           // 'manha' | 'tarde'
  dia_semana: 'quarta',
  product_id: '',
  racao_g: '',
  tipo_racao: '',
  voo_min: '',
  outros: '',
  notas: '',
})

const PLANO_VAZIO = {
  nome: '', especialidade: 'velocidade', dia_prova: 'domingo',
  itens: [], obs: '',
}

const PRODUTO_VAZIO = {
  nome: '', modo: 'agua',
  dosagem_valor: '', dosagem_unidade: 'ml', dosagem_base: 'litro',
  categoria: 'Suplemento', obs: '',
}

const STOCK_VAZIO = {
  tipo: 'Medicamento', nome: '', qtd: '', unidade: 'ml',
  qtd_minima: '', margem_dias: '7', validade: '', preco: '', obs: '',
}

// ── helpers de impressão ──────────────────────────────────────────────────────
function imprimirPlano(plano, produtos, nPombos) {
  const itens = [...(plano.itens || [])].sort((a, b) => {
    const na = calcDN(a.dia_semana, plano.dia_prova) === 'Dia da Prova' ? 0 : parseInt(calcDN(a.dia_semana, plano.dia_prova).replace('D-', ''))
    const nb = calcDN(b.dia_semana, plano.dia_prova) === 'Dia da Prova' ? 0 : parseInt(calcDN(b.dia_semana, plano.dia_prova).replace('D-', ''))
    return nb - na
  })

  const dias = [...new Set(itens.map(i => i.dia_semana))]
  const getProd = id => produtos.find(p => p.id === id)

  const linhas = ['manha', 'tarde'].map(per => {
    const label = per === 'manha' ? 'MANHÃ' : 'TARDE'
    const campos = ['Na Água', 'Na Ração', 'Ração (g)', 'Tipo de Ração', 'Voo (min)', 'Outros']
    return campos.map(campo => {
      const cells = dias.map(dia => {
        const item = itens.find(i => i.dia_semana === dia && i.periodo === per)
        if (!item) return '<td style="border:1px solid #ccc;padding:6px 8px;font-size:11px;color:#999">—</td>'
        const prod = getProd(item.product_id)
        let val = ''
        if (campo === 'Na Água' && prod?.modo === 'agua') val = `<strong>${prod.nome}</strong>${prod.dosagem_valor ? `<br><small>${prod.dosagem_valor}${prod.dosagem_unidade}/${prod.dosagem_base === 'litro' ? 'L' : prod.dosagem_base}</small>` : ''}`
        else if (campo === 'Na Ração' && (prod?.modo === 'racao' || prod?.modo === 'direto')) val = `<strong>${prod.nome}</strong>`
        else if (campo === 'Ração (g)' && item.racao_g) val = `${item.racao_g}g`
        else if (campo === 'Tipo de Ração' && item.tipo_racao) val = item.tipo_racao
        else if (campo === 'Voo (min)' && item.voo_min) val = `${item.voo_min} min`
        else if (campo === 'Outros' && item.outros) val = item.outros
        return `<td style="border:1px solid #ccc;padding:6px 8px;font-size:11px;text-align:center">${val || '—'}</td>`
      }).join('')
      return `<tr><td style="border:1px solid #ccc;padding:6px 8px;font-size:11px;font-weight:600;background:#f5f5f5">${campo}</td>${cells}</tr>`
    }).join('')
  }).flat()

  const headerDias = dias.map(d => {
    const dn = calcDN(d, plano.dia_prova)
    return `<th style="border:1px solid #ccc;padding:6px 8px;font-size:11px;background:#1E5FD9;color:#fff">${DIAS_SEMANA.find(x => x.key === d)?.label}<br><small>${dn}</small></th>`
  }).join('')

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${plano.nome}</title>
  <style>body{font-family:Arial,sans-serif;padding:20px;color:#222}h1{font-size:16px;margin:0 0 4px}h2{font-size:12px;color:#555;margin:0 0 16px}table{border-collapse:collapse;width:100%}@media print{button{display:none}}</style>
  </head><body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px">
    <div><h1>🕊️ ChampionsLoft — ${plano.nome}</h1><h2>${ESP_LABEL[plano.especialidade] || plano.especialidade} · Prova ao ${DIAS_SEMANA.find(d => d.key === plano.dia_prova)?.label} · ${nPombos} pombo(s)</h2></div>
    <button onclick="window.print()" style="padding:8px 16px;background:#1E5FD9;color:#fff;border:none;border-radius:6px;cursor:pointer">🖨️ Imprimir</button>
  </div>
  <table><thead><tr>
    <th style="border:1px solid #ccc;padding:6px 8px;font-size:11px;background:#333;color:#fff">MANHÃ / TARDE</th>
    ${headerDias}
  </tr></thead><tbody>${linhas.join('')}</tbody></table>
  ${plano.obs ? `<p style="margin-top:12px;font-size:11px;color:#555">📝 ${plano.obs}</p>` : ''}
  <p style="margin-top:16px;font-size:10px;color:#999">Gerado por ChampionsLoft · ${new Date().toLocaleDateString('pt-PT')}</p>
  <script>window.onload=()=>setTimeout(()=>window.print(),400)</script>
  </body></html>`

  const w = window.open('', '_blank')
  w.document.write(html)
  w.document.close()
}

// ── componente principal ──────────────────────────────────────────────────────
export default function Alimentacao({ nav }) {
  const toast = useToast()
  const { t } = useIdioma()

  // dados
  const [stock, setStock]       = useState([])
  const [planos, setPlanos]     = useState([])
  const [aplicacoes, setAplicacoes] = useState([])
  const [produtos, setProdutos] = useState([])
  const [pombos, setPombos]     = useState([])
  const [provas, setProvas]     = useState([])
  const [loading, setLoading]   = useState(true)

  // ui
  const [tab, setTab]           = useState('hoje')
  const [modal, setModal]       = useState(null)   // null | 'plano' | 'produto' | 'stock'
  const [selected, setSelected] = useState(null)
  const [saving, setSaving]     = useState(false)
  const [confirm, setConfirm]   = useState(null)   // { tipo, item }

  // forms
  const [formPlano, setFormPlano]     = useState(PLANO_VAZIO)
  const [formProduto, setFormProduto] = useState(PRODUTO_VAZIO)
  const [formStock, setFormStock]     = useState(STOCK_VAZIO)
  const sfp = (k, v) => setFormPlano(f => ({ ...f, [k]: v }))
  const sfpr = (k, v) => setFormProduto(f => ({ ...f, [k]: v }))
  const sfs = (k, v) => setFormStock(f => ({ ...f, [k]: v }))

  // calculadora
  const [calcPombos, setCalcPombos]   = useState('20')
  const [calcG, setCalcG]             = useState('35')
  const [calcDias, setCalcDias]       = useState('7')
  const [filtroTipo, setFiltroTipo]   = useState('todos')

  // ── load ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [s, pl, ap, pr, pb, pv] = await Promise.all([
        db.getStock(),
        db.getTreatmentPlans(),
        db.getTreatmentApplications(),
        db.getTreatmentProducts(),
        db.getPombos(),
        db.getProvas().catch(() => []),
      ])
      setStock(s); setPlanos(pl); setAplicacoes(ap)
      setProdutos(pr); setPombos(pb); setProvas(pv)
    } catch (e) { toast('Erro: ' + e.message, 'err') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  // ── computed ──────────────────────────────────────────────────────────────
  const semanaAtual   = segundaFeira()
  const aplicacaoAtiva = aplicacoes.find(a => a.semana_inicio === semanaAtual)
  const planoAtivo    = aplicacaoAtiva ? planos.find(p => p.id === aplicacaoAtiva.plan_id) : null
  const getProd       = id => produtos.find(p => p.id === id)
  const efectivoAtivo = pombos.filter(p => (!p.estado_ext || p.estado_ext === 'proprio') && p.estado === 'ativo')
  const nPombosAtivos = aplicacaoAtiva?.pombos_ids?.length || aplicacaoAtiva?.n_pombos || 0

  // alertas de stock (com margem de dias configurável)
  const G_DIA = 35
  const consumoDiarioKg = (efectivoAtivo.length * G_DIA) / 1000
  const alertasStock = stock.filter(s => {
    if (!s.qtd_minima) return false
    const margem = parseFloat(s.margem_dias || 7)
    const consumo = ['Cereal','Ração Comercial'].includes(s.tipo) ? consumoDiarioKg * margem : 0
    const limiar = parseFloat(s.qtd_minima) + consumo
    return s.qtd <= limiar
  })
  const validadeProxima = stock.filter(s => {
    if (!s.validade) return false
    const dias = (new Date(s.validade) - new Date()) / 86400000
    return dias >= 0 && dias <= 30
  })

  // itens de hoje (manhã e tarde)
  const hojeKey = diaSemanaHoje()
  const itensManha = (planoAtivo?.itens || []).filter(i => i.dia_semana === hojeKey && i.periodo !== 'tarde')
  const itensTarde = (planoAtivo?.itens || []).filter(i => i.dia_semana === hojeKey && i.periodo === 'tarde')
  const temHoje = itensManha.length > 0 || itensTarde.length > 0

  // itens ordenados por D-N
  const itensOrdenados = (plano) => {
    if (!plano) return []
    return [...(plano.itens || [])].sort((a, b) => {
      const na = calcDN(a.dia_semana, plano.dia_prova) === 'Dia da Prova' ? 0 : parseInt(calcDN(a.dia_semana, plano.dia_prova).replace('D-', ''))
      const nb = calcDN(b.dia_semana, plano.dia_prova) === 'Dia da Prova' ? 0 : parseInt(calcDN(b.dia_semana, plano.dia_prova).replace('D-', ''))
      return nb - na
    })
  }

  // toggle dia feito
  const toggleDia = async (diaKey, periodo) => {
    if (!aplicacaoAtiva) return
    const chave = `${diaKey}_${periodo}`
    try {
      const novo = { ...aplicacaoAtiva.estado_dias, [chave]: !aplicacaoAtiva.estado_dias?.[chave] }
      await db.updateTreatmentApplication(aplicacaoAtiva.id, { estado_dias: novo })
      load()
    } catch (e) { toast('Erro', 'err') }
  }

  // ── plano CRUD ────────────────────────────────────────────────────────────
  const openNewPlano  = () => { setFormPlano(PLANO_VAZIO); setSelected(null); setModal('plano') }
  const openEditPlano = p  => { setSelected(p); setFormPlano({ nome: p.nome, especialidade: p.especialidade || 'geral', dia_prova: p.dia_prova || 'domingo', itens: p.itens || [], obs: p.obs || '' }); setModal('plano') }

  const addItem = (per) => setFormPlano(f => ({ ...f, itens: [...f.itens, ITEM_VAZIO(per)] }))
  const updItem = (i, k, v) => setFormPlano(f => ({ ...f, itens: f.itens.map((it, idx) => idx === i ? { ...it, [k]: v } : it) }))
  const delItem = i => setFormPlano(f => ({ ...f, itens: f.itens.filter((_, idx) => idx !== i) }))

  const savePlano = async () => {
    if (!formPlano.nome.trim()) { toast('Nome obrigatório', 'warn'); return }
    setSaving(true)
    try {
      const payload = { nome: formPlano.nome.trim(), especialidade: formPlano.especialidade, dia_prova: formPlano.dia_prova, itens: formPlano.itens, obs: formPlano.obs }
      selected ? await db.updateTreatmentPlan(selected.id, payload) : await db.createTreatmentPlan(payload)
      toast(selected ? 'Plano actualizado!' : 'Plano criado!', 'ok'); setModal(null); setSelected(null); load()
    } catch (e) { toast('Erro: ' + e.message, 'err') }
    finally { setSaving(false) }
  }

  const delPlano = async () => {
    try { await db.deleteTreatmentPlan(confirm.item.id); toast('Eliminado', 'ok'); setConfirm(null); load() }
    catch (e) { toast('Erro', 'err') }
  }

  // ── produto CRUD ──────────────────────────────────────────────────────────
  const openNewProd  = () => { setFormProduto(PRODUTO_VAZIO); setSelected(null); setModal('produto') }
  const openEditProd = p  => { setSelected(p); setFormProduto({ nome: p.nome, modo: p.modo, dosagem_valor: p.dosagem_valor || '', dosagem_unidade: p.dosagem_unidade || 'ml', dosagem_base: p.dosagem_base || 'litro', categoria: p.categoria || 'Suplemento', obs: p.obs || '' }); setModal('produto') }

  const saveProduto = async () => {
    if (!formProduto.nome.trim()) { toast('Nome obrigatório', 'warn'); return }
    setSaving(true)
    try {
      const payload = { nome: formProduto.nome.trim(), modo: formProduto.modo, dosagem_valor: parseFloat(formProduto.dosagem_valor) || null, dosagem_unidade: formProduto.dosagem_unidade, dosagem_base: formProduto.dosagem_base, categoria: formProduto.categoria, obs: formProduto.obs }
      selected ? await db.updateTreatmentProduct(selected.id, payload) : await db.createTreatmentProduct(payload)
      toast(selected ? 'Produto actualizado!' : 'Produto criado!', 'ok'); setModal(null); setSelected(null); load()
    } catch (e) { toast('Erro: ' + e.message, 'err') }
    finally { setSaving(false) }
  }

  const delProduto = async () => {
    try { await db.deleteTreatmentProduct(confirm.item.id); toast('Eliminado', 'ok'); setConfirm(null); load() }
    catch (e) { toast('Erro', 'err') }
  }

  // ── stock CRUD ────────────────────────────────────────────────────────────
  const openNewStock  = () => { setFormStock(STOCK_VAZIO); setSelected(null); setModal('stock') }
  const openEditStock = s  => { setSelected(s); setFormStock({ tipo: s.tipo || 'Medicamento', nome: s.nome || '', qtd: String(s.qtd || ''), unidade: s.unidade || 'ml', qtd_minima: String(s.qtd_minima || ''), margem_dias: String(s.margem_dias || 7), validade: s.validade || '', preco: String(s.preco || ''), obs: s.obs || '' }); setModal('stock') }

  const saveStock = async () => {
    if (!formStock.nome.trim() || !formStock.qtd) { toast('Nome e quantidade obrigatórios', 'warn'); return }
    setSaving(true)
    try {
      const payload = { tipo: formStock.tipo, nome: formStock.nome.trim(), qtd: parseFloat(formStock.qtd), unidade: formStock.unidade, qtd_minima: formStock.qtd_minima ? parseFloat(formStock.qtd_minima) : null, margem_dias: formStock.margem_dias ? parseInt(formStock.margem_dias) : 7, validade: formStock.validade || null, preco: formStock.preco ? parseFloat(formStock.preco) : null, obs: formStock.obs }
      selected ? await db.updateStockItem(selected.id, payload) : await db.createStockItem(payload)
      toast(selected ? 'Actualizado!' : 'Adicionado!', 'ok'); setModal(null); setSelected(null); load()
    } catch (e) { toast('Erro: ' + e.message, 'err') }
    finally { setSaving(false) }
  }

  const delStock = async () => {
    try { await db.deleteStockItem(confirm.item.id); toast('Eliminado', 'ok'); setConfirm(null); load() }
    catch (e) { toast('Erro', 'err') }
  }

  const ajustarQtd = async (item, delta) => {
    try { await db.updateStockItem(item.id, { qtd: Math.max(0, item.qtd + delta) }); load() }
    catch (e) { toast('Erro', 'err') }
  }

  // ── aplicar plano ─────────────────────────────────────────────────────────
  const [modalAplicar, setModalAplicar]     = useState(false)
  const [planoParaAplicar, setPlanoParaAplicar] = useState(null)
  const [pombosSel, setPombosSel]           = useState([])
  const [savingAplicar, setSavingAplicar]   = useState(false)

  const abrirAplicar = (plano) => {
    setPlanoParaAplicar(plano)
    const sugeridos = plano.especialidade && plano.especialidade !== 'geral'
      ? efectivoAtivo.filter(p => (p.esp || []).includes(plano.especialidade)).map(p => p.id)
      : efectivoAtivo.map(p => p.id)
    setPombosSel(sugeridos)
    setModalAplicar(true)
  }

  const confirmarAplicar = async () => {
    if (pombosSel.length === 0) { toast('Seleccione pelo menos um pombo', 'warn'); return }
    setSavingAplicar(true)
    try {
      await db.createTreatmentApplication({ plan_id: planoParaAplicar.id, semana_inicio: semanaAtual, pombos_ids: pombosSel, n_pombos: pombosSel.length, estado_dias: {} })
      toast('Plano aplicado!', 'ok'); setModalAplicar(false); load()
    } catch (e) { toast('Erro: ' + e.message, 'err') }
    finally { setSavingAplicar(false) }
  }

  const encerrarAplicacao = async () => {
    try { await db.deleteTreatmentApplication(aplicacaoAtiva.id); toast('Plano removido desta semana', 'ok'); load() }
    catch (e) { toast('Erro', 'err') }
  }

  // avisosStock ao aplicar
  const avisosStockAplicar = (() => {
    if (!planoParaAplicar) return []
    const n = pombosSel.length; const avisos = []
    planoParaAplicar.itens.forEach(it => {
      const prod = getProd(it.product_id)
      if (!prod?.dosagem_valor) return
      const itemStk = stock.find(s => s.nome.toLowerCase() === prod.nome.toLowerCase())
      if (!itemStk) return
      const nec = prod.dosagem_base === 'pombo' ? prod.dosagem_valor * n : prod.dosagem_valor
      if (itemStk.qtd < nec) avisos.push(`${prod.nome}: precisa ~${nec}${prod.dosagem_unidade || ''}, tem ${itemStk.qtd}${itemStk.unidade || ''}`)
    })
    return avisos
  })()

  // calculadora
  const consumoCalc = (parseFloat(calcPombos) || 0) * (parseFloat(calcG) || 0) * (parseFloat(calcDias) || 0) / 1000
  const stockFiltrado = stock.filter(s => filtroTipo === 'todos' || s.tipo === filtroTipo)

  function diasParaEsgotar(item) {
    if (!['Cereal','Ração Comercial'].includes(item.tipo) || consumoDiarioKg <= 0) return null
    const qtdKg = item.unidade === 'g' ? item.qtd / 1000 : item.unidade === 'kg' ? item.qtd : null
    if (qtdKg === null) return null
    return Math.floor(qtdKg / consumoDiarioKg)
  }

  // ── renderização de card de período (manhã/tarde) ─────────────────────────
  const renderPeriodo = (itens, per, estado) => {
    if (itens.length === 0) return null
    const icon = per === 'manha' ? '🌅' : '🌆'
    const label = per === 'manha' ? 'Manhã' : 'Tarde'
    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{icon} {label}</div>
        {itens.map((item, i) => {
          const chave = `${item.dia_semana}_${per}`
          const feito = !!estado?.[chave]
          const prod = getProd(item.product_id)
          const doseTotal = prod?.dosagem_valor && prod?.dosagem_base === 'pombo'
            ? (prod.dosagem_valor * nPombosAtivos).toFixed(1) : null
          return (
            <div key={i} className="card card-p" style={{ marginBottom: 6, borderColor: feito ? 'rgba(45,212,167,.3)' : undefined, padding: '10px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <button onClick={() => toggleDia(item.dia_semana, per)}
                  style={{ width: 22, height: 22, borderRadius: 6, border: feito ? 'none' : '2px solid #1B2D52', background: feito ? '#2DD4A7' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, fontSize: 13, marginTop: 1 }}>
                  {feito && '✓'}
                </button>
                <div style={{ flex: 1 }}>
                  {prod && (
                    <div style={{ fontSize: 13, fontWeight: 600, color: feito ? '#7A8699' : '#fff', textDecoration: feito ? 'line-through' : 'none', marginBottom: 2 }}>
                      {prod.nome}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: '#7A8699', display: 'flex', flexWrap: 'wrap', gap: '2px 12px' }}>
                    {prod && <span>{MODO_LABEL[prod.modo]}{prod.dosagem_valor ? ` · ${prod.dosagem_valor}${prod.dosagem_unidade} ${BASE_LABEL[prod.dosagem_base]}` : ''}{doseTotal ? ` → ${doseTotal}${prod.dosagem_unidade} total` : ''}</span>}
                    {item.racao_g && <span>🌾 {item.racao_g}g{item.tipo_racao ? ` ${item.tipo_racao}` : ''}</span>}
                    {item.voo_min && <span>✈️ {item.voo_min} min de voo</span>}
                    {item.outros && <span>🛁 {item.outros}</span>}
                    {item.notas && <span style={{ fontStyle: 'italic' }}>📝 {item.notas}</span>}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // ── tabs ──────────────────────────────────────────────────────────────────
  const TABS = [
    ['hoje','☀️ Hoje'],
    ['semana','📋 Semana'],
    ['planos','🗂️ Planos'],
    ['biblioteca','💊 Biblioteca'],
    ['stock','📦 Stock'],
    ['calculadora','🧮 Calc'],
  ]

  const btnAdd = () => {
    if (tab === 'planos') return <button className="btn btn-primary" onClick={openNewPlano}>＋ Plano</button>
    if (tab === 'biblioteca') return <button className="btn btn-primary" onClick={openNewProd}>＋ Produto</button>
    if (tab === 'stock') return <button className="btn btn-primary" onClick={openNewStock}>＋ Item</button>
    return null
  }

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding: 80 }}><Spinner lg /></div>

  return (
    <div>
      {/* header */}
      <div className="section-header">
        <div>
          <div className="section-title">Alimentação &amp; Tratamentos</div>
          <div className="section-sub">
            {planoAtivo ? `✅ Plano activo: ${planoAtivo.nome}` : '— Sem plano activo esta semana'}
          </div>
        </div>
        {btnAdd()}
      </div>

      {/* alertas globais */}
      {(alertasStock.length > 0 || validadeProxima.length > 0) && (
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
          {alertasStock.length > 0 && (
            <div style={{ background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', borderRadius:12, padding:'12px 16px', cursor:'pointer' }} onClick={() => setTab('stock')}>
              <div style={{ fontWeight:600, color:'#f87171', marginBottom:4 }}>⚠️ {alertasStock.length} produto(s) a precisar de reposição</div>
              {alertasStock.map(s => <div key={s.id} style={{ fontSize:11, color:'#cbd5e1' }}>{s.nome} — {s.qtd}{s.unidade} restante(s)</div>)}
            </div>
          )}
          {validadeProxima.length > 0 && (
            <div style={{ background:'rgba(234,179,8,.08)', border:'1px solid rgba(234,179,8,.2)', borderRadius:12, padding:'12px 16px' }}>
              <div style={{ fontWeight:600, color:'#D4AF37', marginBottom:4 }}>📅 {validadeProxima.length} produto(s) a expirar em 30 dias</div>
              {validadeProxima.map(s => <div key={s.id} style={{ fontSize:11, color:'#cbd5e1' }}>{s.nome} — válido até {new Date(s.validade).toLocaleDateString('pt-PT')}</div>)}
            </div>
          )}
        </div>
      )}

      {/* tabs */}
      <div style={{ display:'flex', gap:4, background:'#101F40', borderRadius:8, padding:4, marginBottom:16, overflowX:'auto' }}>
        {TABS.map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ flex:1, padding:'8px 10px', borderRadius:6, fontSize:12, fontWeight:500, cursor:'pointer', border:'none', fontFamily:'inherit', whiteSpace:'nowrap', background:tab===k?'#1E5FD9':'none', color:tab===k?'#fff':'#94a3b8' }}>{l}</button>
        ))}
      </div>

      {/* ── TAB HOJE ── */}
      {tab === 'hoje' && (
        <div>
          <div style={{ fontSize:12, color:'#94a3b8', marginBottom:12 }}>
            {new Date().toLocaleDateString('pt-PT',{weekday:'long',day:'numeric',month:'long'})}
          </div>
          {!planoAtivo ? (
            <EmptyState icon="☀️" title="Sem plano activo" desc="Aplique um plano a esta semana em 'Planos' para ver o que fazer hoje"
              action={<button className="btn btn-primary" onClick={() => setTab('planos')}>Ver Planos →</button>} />
          ) : !temHoje ? (
            <div className="card card-p" style={{ textAlign:'center', padding:32 }}>
              <div style={{ fontSize:28, marginBottom:8 }}>✅</div>
              <div style={{ color:'#fff', fontWeight:600, marginBottom:4 }}>Dia de descanso!</div>
              <div style={{ fontSize:12, color:'#7A8699' }}>Hoje não há tratamentos no plano {planoAtivo.nome}.</div>
            </div>
          ) : (
            <div>
              <div style={{ background:'rgba(30,95,217,.08)', border:'1px solid rgba(30,95,217,.2)', borderRadius:12, padding:'10px 16px', marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontWeight:600, color:'#fff', fontSize:13 }}>{planoAtivo.nome}</div>
                  <div style={{ fontSize:11, color:'#7A8699' }}>{ESP_LABEL[planoAtivo.especialidade]} · {nPombosAtivos} pombos</div>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => imprimirPlano(planoAtivo, produtos, nPombosAtivos)}>🖨️</button>
              </div>
              {renderPeriodo(itensManha, 'manha', aplicacaoAtiva?.estado_dias)}
              {renderPeriodo(itensTarde, 'tarde', aplicacaoAtiva?.estado_dias)}
            </div>
          )}
        </div>
      )}

      {/* ── TAB SEMANA ── */}
      {tab === 'semana' && (
        <div>
          {!planoAtivo ? (
            planos.length === 0 ? (
              <EmptyState icon="🗂️" title="Sem planos" desc="Crie primeiro um plano em 'Planos'"
                action={<button className="btn btn-primary" onClick={() => setTab('planos')}>Criar Plano →</button>} />
            ) : (
              <div>
                <div style={{ fontSize:13, color:'#94a3b8', marginBottom:12 }}>Nenhum plano activo. Escolha um para aplicar esta semana:</div>
                {planos.map(p => (
                  <div key={p.id} className="card card-p" style={{ marginBottom:8 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                      <div style={{ fontSize:20 }}>🗂️</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:'#fff' }}>{p.nome}</div>
                        <div style={{ fontSize:11, color:'#7A8699' }}>{ESP_LABEL[p.especialidade]} · {(p.itens||[]).length} dias de tratamento</div>
                      </div>
                      <button className="btn btn-primary btn-sm" onClick={() => abrirAplicar(p)}>Aplicar esta semana</button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div>
              <div style={{ background:'rgba(30,95,217,.08)', border:'1px solid rgba(30,95,217,.2)', borderRadius:12, padding:'10px 16px', marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontWeight:600, color:'#fff', fontSize:13 }}>{planoAtivo.nome}</div>
                  <div style={{ fontSize:11, color:'#7A8699' }}>{ESP_LABEL[planoAtivo.especialidade]} · {nPombosAtivos} pombos · semana de {new Date(semanaAtual).toLocaleDateString('pt-PT')}</div>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => imprimirPlano(planoAtivo, produtos, nPombosAtivos)}>🖨️</button>
                  <Badge v="blue">Activo</Badge>
                </div>
              </div>

              {/* tabela por dia (manhã/tarde) */}
              {DIAS_SEMANA.map(({ key, label }) => {
                const iM = itensOrdenados(planoAtivo).filter(i => i.dia_semana === key && i.periodo !== 'tarde')
                const iT = itensOrdenados(planoAtivo).filter(i => i.dia_semana === key && i.periodo === 'tarde')
                if (iM.length === 0 && iT.length === 0) return null
                const isHoje = key === hojeKey
                const dn = calcDN(key, planoAtivo.dia_prova)
                return (
                  <div key={key} className="card card-p" style={{ marginBottom:8, borderColor: isHoje ? 'rgba(212,175,55,.4)' : undefined }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                      <div style={{ fontWeight:700, color: isHoje ? '#D4AF37' : '#fff', fontSize:13 }}>{label} {isHoje && '← Hoje'}</div>
                      <div style={{ fontSize:11, color:'#D4AF37', fontWeight:600 }}>{dn}</div>
                    </div>
                    {renderPeriodo(iM, 'manha', aplicacaoAtiva?.estado_dias)}
                    {renderPeriodo(iT, 'tarde', aplicacaoAtiva?.estado_dias)}
                  </div>
                )
              })}

              <div style={{ textAlign:'center', marginTop:8 }}>
                <button className="btn btn-secondary btn-sm" onClick={encerrarAplicacao}>Remover plano desta semana</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB PLANOS ── */}
      {tab === 'planos' && (
        planos.length === 0
          ? <EmptyState icon="🗂️" title="Sem planos" desc="Construa o primeiro plano de tratamento"
              action={<button className="btn btn-primary" onClick={openNewPlano}>＋ Novo Plano</button>} />
          : <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {planos.map(p => (
                <div key={p.id} className="card card-p">
                  <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                    <div style={{ fontSize:20 }}>🗂️</div>
                    <div style={{ flex:1, minWidth:160 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:'#fff' }}>{p.nome}</div>
                      <div style={{ fontSize:11, color:'#7A8699' }}>{ESP_LABEL[p.especialidade]} · prova ao {DIAS_SEMANA.find(d=>d.key===p.dia_prova)?.label?.toLowerCase()} · {(p.itens||[]).length} entradas</div>
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={() => imprimirPlano(p, produtos, nPombosAtivos)}>🖨️</button>
                    <button className="btn btn-primary btn-sm" onClick={() => abrirAplicar(p)}>Aplicar</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEditPlano(p)}>✏️</button>
                    <button className="btn btn-icon btn-sm" onClick={() => setConfirm({ tipo:'plano', item:p })}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
      )}

      {/* ── TAB BIBLIOTECA ── */}
      {tab === 'biblioteca' && (
        produtos.length === 0
          ? <EmptyState icon="💊" title="Biblioteca vazia" desc="Adicione produtos com dosagem padrão"
              action={<button className="btn btn-primary" onClick={openNewProd}>＋ Novo Produto</button>} />
          : <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {produtos.map(p => (
                <div key={p.id} className="card card-p">
                  <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                    <div style={{ fontSize:20 }}>💊</div>
                    <div style={{ flex:1, minWidth:160 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:'#fff' }}>{p.nome}</div>
                      <div style={{ fontSize:11, color:'#7A8699' }}>{MODO_LABEL[p.modo]}{p.dosagem_valor ? ` · ${p.dosagem_valor}${p.dosagem_unidade} ${BASE_LABEL[p.dosagem_base]}` : ' · sem dosagem'}</div>
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEditProd(p)}>✏️</button>
                    <button className="btn btn-icon btn-sm" onClick={() => setConfirm({ tipo:'produto', item:p })}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
      )}

      {/* ── TAB STOCK ── */}
      {tab === 'stock' && (
        <div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
            {['todos', ...TIPOS_STOCK].map(tp => (
              <button key={tp} onClick={() => setFiltroTipo(tp)} className={`chip${filtroTipo===tp?' active':''}`}>{tp==='todos'?'Todos':tp}</button>
            ))}
          </div>
          {stockFiltrado.length === 0
            ? <EmptyState icon="📦" title="Sem itens" desc="Adicione cereais, rações e medicamentos ao stock"
                action={<button className="btn btn-primary" onClick={openNewStock}>＋ Novo Item</button>} />
            : <div className="grid-2">
                {stockFiltrado.map(s => {
                  const icon = s.tipo==='Cereal'?'🌾':s.tipo==='Ração Comercial'?'🥫':s.tipo==='Medicamento'?'💊':s.tipo==='Suplemento'?'🧪':'📦'
                  const baixo = alertasStock.some(a => a.id === s.id)
                  const dias = diasParaEsgotar(s)
                  return (
                    <div key={s.id} className="card card-p">
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                        <div style={{ fontSize:22 }}>{icon}</div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:13, fontWeight:600, color:'#fff' }}>{s.nome}</div>
                          <div style={{ fontSize:11, color:'#7A8699' }}>{s.tipo}</div>
                        </div>
                        <button className="btn btn-icon btn-sm" onClick={() => openEditStock(s)}>✏️</button>
                        <button className="btn btn-icon btn-sm" onClick={() => setConfirm({ tipo:'stock', item:s })}>🗑️</button>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                        <button className="btn btn-icon btn-sm" onClick={() => ajustarQtd(s, -1)}>−</button>
                        <div style={{ flex:1, textAlign:'center', fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:700, color:baixo?'#f87171':'#fff' }}>{s.qtd}{s.unidade}</div>
                        <button className="btn btn-icon btn-sm" onClick={() => ajustarQtd(s, 1)}>＋</button>
                      </div>
                      {s.qtd_minima && <div className="progress"><div className="progress-bar" style={{ width:`${Math.min(100,(s.qtd/(s.qtd_minima*3))*100)}%`, background:baixo?'#f87171':'#2DD4A7' }} /></div>}
                      {dias !== null && (
                        <div style={{ fontSize:11, color:dias<=5?'#f87171':dias<=14?'#D4AF37':'#7A8699', marginTop:6, fontWeight:dias<=14?600:400 }}>
                          ⏳ Esgota em ~{dias} dia{dias!==1?'s':''} ao ritmo actual
                        </div>
                      )}
                      {s.margem_dias && s.qtd_minima && (
                        <div style={{ fontSize:10, color:'#475569', marginTop:2 }}>🔔 Alerta com {s.margem_dias} dias de margem</div>
                      )}
                      {s.validade && <div style={{ fontSize:11, color:'#7A8699', marginTop:2 }}>📅 Válido até {new Date(s.validade).toLocaleDateString('pt-PT')}</div>}
                      {s.preco && <div style={{ fontSize:11, color:'#D4AF37', marginTop:2 }}>💶 {s.preco}€</div>}
                    </div>
                  )
                })}
              </div>
          }
        </div>
      )}

      {/* ── TAB CALCULADORA ── */}
      {tab === 'calculadora' && (
        <div className="card card-p">
          <div style={{ fontWeight:600, color:'#fff', marginBottom:16 }}>🧮 Calculadora de Consumo</div>
          <div className="form-grid">
            <Field label="Nº de Pombos"><input className="input" type="number" value={calcPombos} onChange={e => setCalcPombos(e.target.value)} /></Field>
            <Field label="Gramas por pombo/dia"><input className="input" type="number" value={calcG} onChange={e => setCalcG(e.target.value)} /></Field>
            <div className="col-2"><Field label="Período (dias)"><input className="input" type="number" value={calcDias} onChange={e => setCalcDias(e.target.value)} /></Field></div>
          </div>
          <button className="btn btn-secondary btn-sm" style={{ marginBottom:16 }} onClick={() => setCalcPombos(String(efectivoAtivo.length))}>
            Usar efectivo activo ({efectivoAtivo.length} pombos)
          </button>
          <div style={{ background:'#101F40', borderRadius:12, padding:20, textAlign:'center', marginBottom:16 }}>
            <div style={{ fontFamily:"'Fraunces',serif", fontSize:40, fontWeight:700, color:'#2DD4A7' }}>{consumoCalc.toFixed(1)} kg</div>
            <div style={{ fontSize:12, color:'#7A8699', marginTop:4 }}>Consumo total estimado</div>
          </div>
          <div style={{ fontSize:12, color:'#94a3b8' }}>
            <div style={{ fontWeight:600, marginBottom:6, color:'#cbd5e1' }}>📊 Referências:</div>
            <div>Repouso/Muda: 25-30g/pombo/dia</div>
            <div>Pré-competição: 30-35g/pombo/dia</div>
            <div>Competição: 35-45g/pombo/dia</div>
            <div>Reprodução: 40-50g/pombo/dia</div>
          </div>

          {/* doses por produto */}
          {planoAtivo && produtos.length > 0 && (
            <div style={{ marginTop:20 }}>
              <div style={{ fontWeight:600, color:'#fff', marginBottom:10 }}>💊 Doses para {nPombosAtivos} pombos (plano activo)</div>
              {[...new Set(planoAtivo.itens.map(i => i.product_id))].map(pid => {
                const prod = getProd(pid)
                if (!prod?.dosagem_valor) return null
                const total = prod.dosagem_base === 'pombo' ? (prod.dosagem_valor * nPombosAtivos) : prod.dosagem_valor
                return (
                  <div key={pid} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid #1B2D52', fontSize:12 }}>
                    <span style={{ color:'#cbd5e1' }}>{prod.nome}</span>
                    <span style={{ color:'#2DD4A7', fontWeight:600 }}>{total.toFixed(1)}{prod.dosagem_unidade} {prod.dosagem_base === 'pombo' ? `(${prod.dosagem_valor}${prod.dosagem_unidade}/pombo)` : BASE_LABEL[prod.dosagem_base]}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── MODAL PLANO ── */}
      <Modal open={modal==='plano'} onClose={() => { setModal(null); setSelected(null) }}
        title={selected ? '✏️ Editar Plano' : '🗂️ Novo Plano de Tratamento'} wide
        footer={<><button className="btn btn-secondary" onClick={() => { setModal(null); setSelected(null) }}>Cancelar</button><button className="btn btn-primary" onClick={savePlano} disabled={saving}>{saving?<Spinner/>:null}{selected?'Guardar':'Criar Plano'}</button></>}>
        <div className="form-grid">
          <div className="col-2"><Field label="Nome do Plano *"><input className="input" placeholder="Ex: Plano Velocidade Carlos Teixeira" value={formPlano.nome} onChange={e => sfp('nome', e.target.value)} /></Field></div>
          <Field label="Especialidade"><select className="input" value={formPlano.especialidade} onChange={e => sfp('especialidade', e.target.value)}>{ESPECIALIDADES.map(e => <option key={e} value={e}>{ESP_LABEL[e]}</option>)}</select></Field>
          <Field label="Dia de Prova (ref. D-N)"><select className="input" value={formPlano.dia_prova} onChange={e => sfp('dia_prova', e.target.value)}>{DIAS_SEMANA.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}</select></Field>
        </div>

        {/* Manhã */}
        <div style={{ marginTop:16, marginBottom:6, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#D4AF37' }}>🌅 Manhã</div>
          <button className="btn btn-secondary btn-sm" onClick={() => addItem('manha')} disabled={produtos.length===0}>＋ Adicionar</button>
        </div>
        {formPlano.itens.filter(i => i.periodo !== 'tarde').map((item, idx) => {
          const realIdx = formPlano.itens.indexOf(item)
          return <ItemPlanoRow key={realIdx} item={item} idx={realIdx} produtos={produtos} plano={formPlano} updItem={updItem} delItem={delItem} />
        })}

        {/* Tarde */}
        <div style={{ marginTop:16, marginBottom:6, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#4C8DFF' }}>🌆 Tarde</div>
          <button className="btn btn-secondary btn-sm" onClick={() => addItem('tarde')} disabled={produtos.length===0}>＋ Adicionar</button>
        </div>
        {formPlano.itens.filter(i => i.periodo === 'tarde').map((item, idx) => {
          const realIdx = formPlano.itens.indexOf(item)
          return <ItemPlanoRow key={realIdx} item={item} idx={realIdx} produtos={produtos} plano={formPlano} updItem={updItem} delItem={delItem} />
        })}

        {produtos.length === 0 && (
          <div style={{ background:'rgba(212,175,55,.08)', border:'1px solid rgba(212,175,55,.2)', borderRadius:8, padding:'10px 14px', marginTop:12, fontSize:12, color:'#D4AF37' }}>
            💊 Biblioteca vazia — crie primeiro produtos na tab "Biblioteca".
          </div>
        )}

        <div style={{ marginTop:16 }}>
          <Field label="Observações"><textarea className="input" rows={2} style={{ resize:'none' }} value={formPlano.obs} onChange={e => sfp('obs', e.target.value)} /></Field>
        </div>
      </Modal>

      {/* ── MODAL PRODUTO ── */}
      <Modal open={modal==='produto'} onClose={() => { setModal(null); setSelected(null) }}
        title={selected ? '✏️ Editar Produto' : '💊 Novo Produto'}
        footer={<><button className="btn btn-secondary" onClick={() => { setModal(null); setSelected(null) }}>Cancelar</button><button className="btn btn-primary" onClick={saveProduto} disabled={saving}>{saving?<Spinner/>:null}{selected?'Guardar':'Criar'}</button></>}>
        <Field label="Nome *">
          <select className="input" value={formProduto.nome} onChange={e => sfpr('nome', e.target.value)} style={{ marginBottom:6 }}>
            <option value="">— Sugestões —</option>
            {MEDICAMENTOS_LISTA.map(m => <option key={m}>{m}</option>)}
          </select>
          <input className="input" placeholder="Ou escreva o nome" value={formProduto.nome} onChange={e => sfpr('nome', e.target.value)} />
        </Field>
        <div style={{ fontSize:11, color:'#7A8699', margin:'4px 0 12px' }}>💡 Nome igual ao do Stock → verificação automática de quantidade.</div>
        <Field label="Modo de Administração">
          <select className="input" value={formProduto.modo} onChange={e => sfpr('modo', e.target.value)}>
            <option value="agua">💧 Na água</option>
            <option value="racao">🌾 Na ração</option>
            <option value="direto">💊 Direto ao pombo</option>
            <option value="outros">🛁 Outros (banho, narinas…)</option>
          </select>
        </Field>
        <div className="form-grid">
          <Field label="Dosagem"><input className="input" type="number" step="0.1" placeholder="Ex: 15" value={formProduto.dosagem_valor} onChange={e => sfpr('dosagem_valor', e.target.value)} /></Field>
          <Field label="Unidade"><input className="input" placeholder="ml, g, comprimido…" value={formProduto.dosagem_unidade} onChange={e => sfpr('dosagem_unidade', e.target.value)} /></Field>
          <Field label="Por">
            <select className="input" value={formProduto.dosagem_base} onChange={e => sfpr('dosagem_base', e.target.value)}>
              <option value="pombo">Pombo</option>
              <option value="litro">Litro de água</option>
              <option value="kg">Kg de ração</option>
            </select>
          </Field>
          <Field label="Categoria">
            <select className="input" value={formProduto.categoria} onChange={e => sfpr('categoria', e.target.value)}>
              {['Vitamina','Suplemento','Probiótico','Antibiótico','Antiparasitário','Antifúngico','Energético','Outro'].map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Observações"><textarea className="input" rows={2} style={{ resize:'none' }} value={formProduto.obs} onChange={e => sfpr('obs', e.target.value)} /></Field>
      </Modal>

      {/* ── MODAL STOCK ── */}
      <Modal open={modal==='stock'} onClose={() => { setModal(null); setSelected(null) }}
        title={selected ? '✏️ Editar Item' : '📦 Novo Item de Stock'}
        footer={<><button className="btn btn-secondary" onClick={() => { setModal(null); setSelected(null) }}>Cancelar</button><button className="btn btn-primary" onClick={saveStock} disabled={saving}>{saving?<Spinner/>:null}{selected?'Guardar':'Adicionar'}</button></>}>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <Field label="Tipo"><select className="input" value={formStock.tipo} onChange={e => sfs('tipo', e.target.value)}>{TIPOS_STOCK.map(t => <option key={t}>{t}</option>)}</select></Field>
          <Field label="Nome *">
            <select className="input" value={formStock.nome} onChange={e => sfs('nome', e.target.value)} style={{ marginBottom:6 }}>
              <option value="">— Sugestões —</option>
              {[...CEREAIS,...RACOES_COMERCIAIS,...MEDICAMENTOS_LISTA].map(n => <option key={n}>{n}</option>)}
            </select>
            <input className="input" placeholder="Ou escreva o nome" value={formStock.nome} onChange={e => sfs('nome', e.target.value)} />
          </Field>
          <div className="form-grid" style={{ gridTemplateColumns:'1fr 1fr' }}>
            <Field label="Quantidade *"><input className="input" type="number" step="0.1" value={formStock.qtd} onChange={e => sfs('qtd', e.target.value)} /></Field>
            <Field label="Unidade"><select className="input" value={formStock.unidade} onChange={e => sfs('unidade', e.target.value)}>{UNIDADES.map(u => <option key={u}>{u}</option>)}</select></Field>
            <Field label="Stock Mínimo (alerta)"><input className="input" type="number" step="0.1" placeholder="Ex: 200" value={formStock.qtd_minima} onChange={e => sfs('qtd_minima', e.target.value)} /></Field>
            <Field label="Margem de segurança (dias)">
              <input className="input" type="number" placeholder="7" value={formStock.margem_dias} onChange={e => sfs('margem_dias', e.target.value)} />
              <div style={{ fontSize:10, color:'#7A8699', marginTop:2 }}>Avisa N dias antes de atingir o mínimo</div>
            </Field>
            <Field label="Validade"><input className="input" type="date" value={formStock.validade} onChange={e => sfs('validade', e.target.value)} /></Field>
            <Field label="Preço (€)"><input className="input" type="number" step="0.01" value={formStock.preco} onChange={e => sfs('preco', e.target.value)} /></Field>
          </div>
          <Field label="Observações"><input className="input" value={formStock.obs} onChange={e => sfs('obs', e.target.value)} /></Field>
        </div>
      </Modal>

      {/* ── MODAL APLICAR ── */}
      <Modal open={modalAplicar} onClose={() => setModalAplicar(false)}
        title={`Aplicar "${planoParaAplicar?.nome}"`} wide
        footer={<><button className="btn btn-secondary" onClick={() => setModalAplicar(false)}>Cancelar</button><button className="btn btn-primary" onClick={confirmarAplicar} disabled={savingAplicar}>{savingAplicar?<Spinner/>:null}Aplicar a {pombosSel.length} pombo(s)</button></>}>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setPombosSel(efectivoAtivo.map(p=>p.id))}>Todo o efectivo</button>
          {ESPECIALIDADES.filter(e=>e!=='geral').map(e => <button key={e} className="btn btn-secondary btn-sm" onClick={() => setPombosSel(efectivoAtivo.filter(p=>(p.esp||[]).includes(e)).map(p=>p.id))}>{ESP_LABEL[e]}</button>)}
          <button className="btn btn-secondary btn-sm" onClick={() => setPombosSel(efectivoAtivo.filter(p=>p.sexo==='M').map(p=>p.id))}>Machos</button>
          <button className="btn btn-secondary btn-sm" onClick={() => setPombosSel(efectivoAtivo.filter(p=>p.sexo==='F').map(p=>p.id))}>Fêmeas</button>
          <button className="btn btn-secondary btn-sm" onClick={() => setPombosSel([])}>Limpar</button>
        </div>
        {avisosStockAplicar.length > 0 && (
          <div style={{ background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', borderRadius:8, padding:'10px 14px', marginBottom:12, fontSize:12, color:'#f87171' }}>
            <div style={{ fontWeight:600, marginBottom:4 }}>⚠️ Stock insuficiente:</div>
            {avisosStockAplicar.map((a,i) => <div key={i}>{a}</div>)}
          </div>
        )}
        <div style={{ fontSize:12, color:'#94a3b8', marginBottom:8 }}>{pombosSel.length} de {efectivoAtivo.length} pombos seleccionados</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, maxHeight:220, overflowY:'auto' }}>
          {efectivoAtivo.map(p => (
            <button key={p.id} type="button" onClick={() => setPombosSel(s => s.includes(p.id)?s.filter(x=>x!==p.id):[...s,p.id])}
              className={`chip${pombosSel.includes(p.id)?' active':''}`} style={{ fontSize:11 }}>
              {p.emoji} {p.nome}
            </button>
          ))}
        </div>
      </Modal>

      {/* ── CONFIRM DELETE ── */}
      <Modal open={!!confirm} onClose={() => setConfirm(null)} title="Confirmar eliminação"
        footer={<><button className="btn btn-secondary" onClick={() => setConfirm(null)}>Cancelar</button><button className="btn btn-danger" onClick={() => { if(confirm.tipo==='plano') delPlano(); else if(confirm.tipo==='produto') delProduto(); else delStock() }}>Eliminar</button></>}>
        <p style={{ fontSize:14, color:'#cbd5e1' }}>
          {confirm?.tipo==='plano' && `Eliminar o plano "${confirm.item.nome}"? As aplicações semanais já feitas não serão apagadas.`}
          {confirm?.tipo==='produto' && `Eliminar "${confirm.item.nome}"? Planos que usam este produto deixarão de o mostrar correctamente.`}
          {confirm?.tipo==='stock' && `Eliminar "${confirm.item.nome}" do stock?`}
        </p>
      </Modal>
    </div>
  )
}

// ── sub-componente linha de item do plano ─────────────────────────────────────
function ItemPlanoRow({ item, idx, produtos, plano, updItem, delItem }) {
  const dn = calcDN(item.dia_semana, plano.dia_prova)
  return (
    <div style={{ background:'#101F40', borderRadius:8, padding:12, marginBottom:8 }}>
      <div style={{ display:'flex', gap:8, marginBottom:8, alignItems:'flex-end' }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:10, color:'#7A8699', marginBottom:4 }}>Dia</div>
          <select className="input" value={item.dia_semana} onChange={e => updItem(idx,'dia_semana',e.target.value)}>
            {DIAS_SEMANA.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
          </select>
        </div>
        <div style={{ flex:'0 0 80px', textAlign:'center' }}>
          <div style={{ fontSize:10, color:'#7A8699', marginBottom:4 }}>Posição</div>
          <div style={{ background:'#0B1830', borderRadius:6, padding:'8px 0', fontSize:12, fontWeight:700, color:'#D4AF37' }}>{dn}</div>
        </div>
        <button className="btn btn-icon btn-sm" onClick={() => delItem(idx)}>🗑️</button>
      </div>
      <Field label="Produto (da biblioteca)">
        <select className="input" value={item.product_id} onChange={e => updItem(idx,'product_id',e.target.value)}>
          <option value="">— Escolher produto —</option>
          {produtos.map(p => <option key={p.id} value={p.id}>{p.nome} ({MODO_LABEL[p.modo] || p.modo})</option>)}
        </select>
      </Field>
      <div className="form-grid" style={{ marginTop:8, gridTemplateColumns:'1fr 1fr 1fr' }}>
        <Field label="Ração (g)"><input className="input" type="number" placeholder="Ex: 20" value={item.racao_g} onChange={e => updItem(idx,'racao_g',e.target.value)} /></Field>
        <Field label="Tipo de Ração"><input className="input" placeholder="Ex: Gerry Plus" value={item.tipo_racao} onChange={e => updItem(idx,'tipo_racao',e.target.value)} /></Field>
        <Field label="Voo (min)"><input className="input" type="number" placeholder="Ex: 35" value={item.voo_min} onChange={e => updItem(idx,'voo_min',e.target.value)} /></Field>
      </div>
      <div className="form-grid" style={{ marginTop:8, gridTemplateColumns:'1fr 1fr' }}>
        <Field label="Outros (banho, narinas…)"><input className="input" placeholder="Ex: Total Bath MG++" value={item.outros} onChange={e => updItem(idx,'outros',e.target.value)} /></Field>
        <Field label="Notas"><input className="input" placeholder="Opcional" value={item.notas} onChange={e => updItem(idx,'notas',e.target.value)} /></Field>
      </div>
    </div>
  )
}
