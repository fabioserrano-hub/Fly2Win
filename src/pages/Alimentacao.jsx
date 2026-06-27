import { useState, useEffect, useCallback } from 'react'
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
const MODO_LABEL = { agua:'💧 Água', racao:'🌾 Ração', direto:'💊 Direto', outros:'🛁 Outros' }
const MODO_LABEL_FULL = { agua:'💧 Na água', racao:'🌾 Na ração', direto:'💊 Direto ao pombo', outros:'🛁 Outros (banho, narinas…)' }
const BASE_LABEL = { pombo:'por pombo', litro:'por litro', kg:'por kg ração' }
const DIAS_SEMANA = [
  { key:'domingo', label:'Dom', labelFull:'Domingo', idx:0 },
  { key:'segunda', label:'Seg', labelFull:'Segunda', idx:1 },
  { key:'terca',   label:'Ter', labelFull:'Terça',   idx:2 },
  { key:'quarta',  label:'Qua', labelFull:'Quarta',  idx:3 },
  { key:'quinta',  label:'Qui', labelFull:'Quinta',  idx:4 },
  { key:'sexta',   label:'Sex', labelFull:'Sexta',   idx:5 },
  { key:'sabado',  label:'Sáb', labelFull:'Sábado',  idx:6 },
]
const diaIdx = k => DIAS_SEMANA.find(d => d.key === k)?.idx ?? 0

function calcDN(diaItem, diaProva) {
  let diff = diaIdx(diaProva) - diaIdx(diaItem)
  if (diff < 0) diff += 7
  return diff === 0 ? 'Prova' : `D-${diff}`
}

function segundaFeira(data = new Date()) {
  const d = new Date(data)
  const diff = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - diff)
  return d.toISOString().slice(0, 10)
}

function diaSemanaHoje() { return DIAS_SEMANA[new Date().getDay()].key }

// dosagem formatada com cálculo para N pombos
function calcDose(prod, nPombos) {
  if (!prod || !prod.dosagem_valor) return null
  if (prod.dosagem_base === 'pombo') {
    const total = (prod.dosagem_valor * nPombos).toFixed(1)
    return `${prod.dosagem_valor}${prod.dosagem_unidade}/pombo → ${total}${prod.dosagem_unidade} total`
  }
  return `${prod.dosagem_valor}${prod.dosagem_unidade} ${BASE_LABEL[prod.dosagem_base]}`
}

// ── impressão ─────────────────────────────────────────────────────────────────
function imprimirPlano(plano, produtos, nPombos) {
  const diasComItens = DIAS_SEMANA.filter(d =>
    (plano.itens || []).some(i => i.dia_semana === d.key)
  )
  const getProd = id => produtos.find(p => p.id === id)
  const periodos = ['manha', 'tarde']
  const campos = ['Na Água','Na Ração','Ração (g)','Tipo Ração','Voo (min)','Outros']

  const linhas = periodos.flatMap(per => {
    const label = per === 'manha' ? 'MANHÃ' : 'TARDE'
    const bgPer = per === 'manha' ? '#e8f4fd' : '#fdf0e8'
    return campos.map((campo, ci) => {
      const cells = diasComItens.map(d => {
        const item = (plano.itens || []).find(i => i.dia_semana === d.key && (per === 'manha' ? i.periodo !== 'tarde' : i.periodo === 'tarde'))
        if (!item) return `<td style="border:1px solid #ddd;padding:5px 8px;font-size:10px;color:#ccc;text-align:center">—</td>`
        const prod = getProd(item.product_id)
        let val = ''
        if (campo === 'Na Água' && prod?.modo === 'agua') val = `<b>${prod.nome}</b><br><small>${calcDose(prod, nPombos) || ''}</small>`
        else if (campo === 'Na Ração' && (prod?.modo === 'racao' || prod?.modo === 'direto')) val = `<b>${prod.nome}</b><br><small>${calcDose(prod, nPombos) || ''}</small>`
        else if (campo === 'Ração (g)' && item.racao_g) val = `${item.racao_g}g`
        else if (campo === 'Tipo Ração' && item.tipo_racao) val = item.tipo_racao
        else if (campo === 'Voo (min)' && item.voo_min) val = `${item.voo_min} min`
        else if (campo === 'Outros' && item.outros) val = item.outros
        return `<td style="border:1px solid #ddd;padding:5px 8px;font-size:10px;text-align:center">${val || '<span style=color:#ccc>—</span>'}</td>`
      }).join('')
      const isFirst = ci === 0
      return `<tr><td style="border:1px solid #ddd;padding:5px 8px;font-size:10px;background:#f5f5f5;font-weight:600;white-space:nowrap">${isFirst ? `<span style="background:${bgPer};padding:1px 6px;border-radius:4px;font-size:9px">${label}</span><br>` : ''}${campo}</td>${cells}</tr>`
    })
  })

  const headerDias = diasComItens.map(d => {
    const dn = calcDN(d.key, plano.dia_prova)
    return `<th style="border:1px solid #ddd;padding:6px 8px;font-size:10px;background:#1E5FD9;color:#fff;text-align:center;min-width:90px">${d.labelFull}<br><span style="font-size:9px;opacity:.8">${dn}</span></th>`
  }).join('')

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${plano.nome}</title>
  <style>body{font-family:Arial,sans-serif;padding:20px;color:#222;font-size:12px}h1{font-size:15px;margin:0 0 2px}h2{font-size:11px;color:#666;margin:0 0 14px;font-weight:normal}table{border-collapse:collapse;width:100%}@media print{.noprint{display:none}}</style>
  </head><body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px">
    <div><h1>🕊️ ChampionsLoft — ${plano.nome}</h1><h2>${ESP_LABEL[plano.especialidade] || plano.especialidade} · Prova ao ${DIAS_SEMANA.find(d=>d.key===plano.dia_prova)?.labelFull} · ${nPombos} pombo(s)</h2></div>
    <button class="noprint" onclick="window.print()" style="padding:6px 14px;background:#1E5FD9;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px">🖨️ Imprimir</button>
  </div>
  <table><thead><tr>
    <th style="border:1px solid #ddd;padding:6px 8px;font-size:10px;background:#333;color:#fff;min-width:100px">Período / Campo</th>
    ${headerDias}
  </tr></thead><tbody>${linhas.join('')}</tbody></table>
  ${plano.obs ? `<p style="margin-top:10px;font-size:10px;color:#666">📝 ${plano.obs}</p>` : ''}
  <p style="margin-top:12px;font-size:9px;color:#aaa">Gerado por ChampionsLoft · ${new Date().toLocaleDateString('pt-PT')}</p>
  <script>window.onload=()=>setTimeout(()=>window.print(),500)</script>
  </body></html>`

  const w = window.open('', '_blank')
  w.document.write(html)
  w.document.close()
}

// ── valores iniciais ──────────────────────────────────────────────────────────
const ITEM_VAZIO = (periodo = 'manha') => ({ periodo, dia_semana: 'quarta', product_id: '', racao_g: '', tipo_racao: '', voo_min: '', outros: '', notas: '' })
const PLANO_VAZIO = { nome: '', especialidade: 'velocidade', dia_prova: 'domingo', itens: [], obs: '' }
const PRODUTO_VAZIO = { nome: '', modo: 'agua', dosagem_valor: '', dosagem_unidade: 'ml', dosagem_base: 'litro', categoria: 'Suplemento', obs: '' }
const STOCK_VAZIO = { tipo: 'Medicamento', nome: '', qtd: '', unidade: 'ml', qtd_minima: '', margem_dias: '7', validade: '', preco: '', obs: '' }

// ── componente principal ──────────────────────────────────────────────────────
export default function Alimentacao({ nav }) {
  const toast = useToast()
  const { t } = useIdioma()

  const [stock, setStock]           = useState([])
  const [planos, setPlanos]         = useState([])
  const [aplicacoes, setAplicacoes] = useState([])
  const [produtos, setProdutos]     = useState([])
  const [pombos, setPombos]         = useState([])
  const [provas, setProvas]         = useState([])
  const [loading, setLoading]       = useState(true)

  const [tab, setTab]       = useState('hoje')
  const [vistaTabela, setVistaTabela] = useState(false)   // toggle lista ↔ tabela
  const [modal, setModal]   = useState(null)
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(null)

  const [formPlano, setFormPlano]     = useState(PLANO_VAZIO)
  const [formProduto, setFormProduto] = useState(PRODUTO_VAZIO)
  const [formStock, setFormStock]     = useState(STOCK_VAZIO)
  const sfp = (k,v) => setFormPlano(f=>({...f,[k]:v}))
  const sfpr = (k,v) => setFormProduto(f=>({...f,[k]:v}))
  const sfs = (k,v) => setFormStock(f=>({...f,[k]:v}))

  const [calcPombos, setCalcPombos] = useState('20')
  const [calcG, setCalcG]           = useState('35')
  const [calcDias, setCalcDias]     = useState('7')
  const [filtroTipo, setFiltroTipo] = useState('todos')

  // modal editar pombos do plano ativo
  const [modalPombos, setModalPombos]   = useState(false)
  const [pombosSel, setPombosSel]       = useState([])
  const [savingPombos, setSavingPombos] = useState(false)

  // modal aplicar plano
  const [modalAplicar, setModalAplicar]         = useState(false)
  const [planoParaAplicar, setPlanoParaAplicar] = useState(null)
  const [pombosAplicar, setPombosAplicar]       = useState([])
  const [savingAplicar, setSavingAplicar]       = useState(false)

  // ── load ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [s,pl,ap,pr,pb,pv] = await Promise.all([
        db.getStock(), db.getTreatmentPlans(), db.getTreatmentApplications(),
        db.getTreatmentProducts(), db.getPombos(), db.getProvas().catch(()=>[]),
      ])
      setStock(s); setPlanos(pl); setAplicacoes(ap)
      setProdutos(pr); setPombos(pb); setProvas(pv)
    } catch(e) { toast('Erro: '+e.message,'err') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  // ── computed ──────────────────────────────────────────────────────────────
  const semanaAtual    = segundaFeira()
  const aplicacaoAtiva = aplicacoes.find(a => a.semana_inicio === semanaAtual)
  const planoAtivo     = aplicacaoAtiva ? planos.find(p => p.id === aplicacaoAtiva.plan_id) : null
  const getProd        = id => produtos.find(p => p.id === id)
  const efectivoAtivo  = pombos.filter(p => (!p.estado_ext || p.estado_ext === 'proprio') && p.estado === 'ativo')
  const nPombos        = aplicacaoAtiva?.pombos_ids?.length || aplicacaoAtiva?.n_pombos || 0
  const hojeKey        = diaSemanaHoje()

  // stock alerts
  const G_DIA = 35
  const consumoDiarioKg = (efectivoAtivo.length * G_DIA) / 1000
  const alertasStock = stock.filter(s => {
    if (!s.qtd_minima) return false
    const margem = parseFloat(s.margem_dias || 7)
    const extra = ['Cereal','Ração Comercial'].includes(s.tipo) ? consumoDiarioKg * margem : 0
    return s.qtd <= parseFloat(s.qtd_minima) + extra
  })
  const validadeProxima = stock.filter(s => {
    if (!s.validade) return false
    return (new Date(s.validade) - new Date()) / 86400000 <= 30
  })

  function diasParaEsgotar(item) {
    if (!['Cereal','Ração Comercial'].includes(item.tipo) || consumoDiarioKg <= 0) return null
    const qtdKg = item.unidade==='g' ? item.qtd/1000 : item.unidade==='kg' ? item.qtd : null
    return qtdKg === null ? null : Math.floor(qtdKg / consumoDiarioKg)
  }

  // itens ordenados D-N
  const itensOrdenados = (plano) => {
    if (!plano) return []
    return [...(plano.itens||[])].sort((a,b) => {
      const na = calcDN(a.dia_semana,plano.dia_prova)==='Prova'?0:parseInt(calcDN(a.dia_semana,plano.dia_prova).replace('D-',''))
      const nb = calcDN(b.dia_semana,plano.dia_prova)==='Prova'?0:parseInt(calcDN(b.dia_semana,plano.dia_prova).replace('D-',''))
      return nb - na
    })
  }

  const itensDia = (dia, per) => (planoAtivo?.itens||[]).filter(i => i.dia_semana===dia && (per==='manha' ? i.periodo!=='tarde' : i.periodo==='tarde'))
  const temHoje  = itensDia(hojeKey,'manha').length>0 || itensDia(hojeKey,'tarde').length>0

  // toggle feito
  const toggleDia = async (diaKey, per) => {
    if (!aplicacaoAtiva) return
    const chave = `${diaKey}_${per}`
    try {
      const novo = { ...aplicacaoAtiva.estado_dias, [chave]: !aplicacaoAtiva.estado_dias?.[chave] }
      await db.updateTreatmentApplication(aplicacaoAtiva.id, { estado_dias: novo })
      load()
    } catch(e) { toast('Erro','err') }
  }

  // ── plano CRUD ────────────────────────────────────────────────────────────
  const openNewPlano  = () => { setFormPlano(PLANO_VAZIO); setSelected(null); setModal('plano') }
  const openEditPlano = p  => { setSelected(p); setFormPlano({ nome:p.nome, especialidade:p.especialidade||'geral', dia_prova:p.dia_prova||'domingo', itens:p.itens||[], obs:p.obs||'' }); setModal('plano') }

  const addItem = per => setFormPlano(f=>({...f, itens:[...f.itens, ITEM_VAZIO(per)]}))
  const updItem = (i,k,v) => setFormPlano(f=>({...f, itens:f.itens.map((it,idx)=>idx===i?{...it,[k]:v}:it)}))
  const delItem = i => setFormPlano(f=>({...f, itens:f.itens.filter((_,idx)=>idx!==i)}))

  const savePlano = async () => {
    if (!formPlano.nome.trim()) { toast('Nome obrigatório','warn'); return }
    setSaving(true)
    try {
      const payload = { nome:formPlano.nome.trim(), especialidade:formPlano.especialidade, dia_prova:formPlano.dia_prova, itens:formPlano.itens, obs:formPlano.obs }
      selected ? await db.updateTreatmentPlan(selected.id, payload) : await db.createTreatmentPlan(payload)
      toast(selected?'Plano actualizado!':'Plano criado!','ok'); setModal(null); setSelected(null); load()
    } catch(e) { toast('Erro: '+e.message,'err') }
    finally { setSaving(false) }
  }
  const delPlano = async () => {
    try { await db.deleteTreatmentPlan(confirm.item.id); toast('Eliminado','ok'); setConfirm(null); load() }
    catch(e) { toast('Erro','err') }
  }

  // ── produto CRUD ──────────────────────────────────────────────────────────
  const openNewProd  = () => { setFormProduto(PRODUTO_VAZIO); setSelected(null); setModal('produto') }
  const openEditProd = p  => { setSelected(p); setFormProduto({ nome:p.nome, modo:p.modo, dosagem_valor:p.dosagem_valor||'', dosagem_unidade:p.dosagem_unidade||'ml', dosagem_base:p.dosagem_base||'litro', categoria:p.categoria||'Suplemento', obs:p.obs||'' }); setModal('produto') }

  const saveProduto = async () => {
    if (!formProduto.nome.trim()) { toast('Nome obrigatório','warn'); return }
    setSaving(true)
    try {
      const payload = { nome:formProduto.nome.trim(), modo:formProduto.modo, dosagem_valor:parseFloat(formProduto.dosagem_valor)||null, dosagem_unidade:formProduto.dosagem_unidade, dosagem_base:formProduto.dosagem_base, categoria:formProduto.categoria, obs:formProduto.obs }
      selected ? await db.updateTreatmentProduct(selected.id, payload) : await db.createTreatmentProduct(payload)
      toast(selected?'Actualizado!':'Criado!','ok'); setModal(null); setSelected(null); load()
    } catch(e) { toast('Erro: '+e.message,'err') }
    finally { setSaving(false) }
  }
  const delProduto = async () => {
    try { await db.deleteTreatmentProduct(confirm.item.id); toast('Eliminado','ok'); setConfirm(null); load() }
    catch(e) { toast('Erro','err') }
  }

  // ── stock CRUD ────────────────────────────────────────────────────────────
  const openNewStock  = () => { setFormStock(STOCK_VAZIO); setSelected(null); setModal('stock') }
  const openEditStock = s  => { setSelected(s); setFormStock({ tipo:s.tipo||'Medicamento', nome:s.nome||'', qtd:String(s.qtd||''), unidade:s.unidade||'ml', qtd_minima:String(s.qtd_minima||''), margem_dias:String(s.margem_dias||7), validade:s.validade||'', preco:String(s.preco||''), obs:s.obs||'' }); setModal('stock') }

  const saveStock = async () => {
    if (!formStock.nome.trim()||!formStock.qtd) { toast('Nome e quantidade obrigatórios','warn'); return }
    setSaving(true)
    try {
      const payload = { tipo:formStock.tipo, nome:formStock.nome.trim(), qtd:parseFloat(formStock.qtd), unidade:formStock.unidade, qtd_minima:formStock.qtd_minima?parseFloat(formStock.qtd_minima):null, margem_dias:formStock.margem_dias?parseInt(formStock.margem_dias):7, validade:formStock.validade||null, preco:formStock.preco?parseFloat(formStock.preco):null, obs:formStock.obs }
      selected ? await db.updateStockItem(selected.id, payload) : await db.createStockItem(payload)
      toast(selected?'Actualizado!':'Adicionado!','ok'); setModal(null); setSelected(null); load()
    } catch(e) { toast('Erro: '+e.message,'err') }
    finally { setSaving(false) }
  }
  const delStock = async () => {
    try { await db.deleteStockItem(confirm.item.id); toast('Eliminado','ok'); setConfirm(null); load() }
    catch(e) { toast('Erro','err') }
  }
  const ajustarQtd = async (item, delta) => {
    try { await db.updateStockItem(item.id, { qtd:Math.max(0,item.qtd+delta) }); load() }
    catch(e) { toast('Erro','err') }
  }

  // ── aplicar plano ─────────────────────────────────────────────────────────
  const abrirAplicar = (plano) => {
    setPlanoParaAplicar(plano)
    const sug = plano.especialidade && plano.especialidade!=='geral'
      ? efectivoAtivo.filter(p=>(p.esp||[]).includes(plano.especialidade)).map(p=>p.id)
      : efectivoAtivo.map(p=>p.id)
    setPombosAplicar(sug)
    setModalAplicar(true)
  }
  const confirmarAplicar = async () => {
    if (pombosAplicar.length===0) { toast('Seleccione pelo menos um pombo','warn'); return }
    setSavingAplicar(true)
    try {
      await db.createTreatmentApplication({ plan_id:planoParaAplicar.id, semana_inicio:semanaAtual, pombos_ids:pombosAplicar, n_pombos:pombosAplicar.length, estado_dias:{} })
      toast('Plano aplicado!','ok'); setModalAplicar(false); load()
    } catch(e) { toast('Erro: '+e.message,'err') }
    finally { setSavingAplicar(false) }
  }
  const encerrarAplicacao = async () => {
    try { await db.deleteTreatmentApplication(aplicacaoAtiva.id); toast('Plano removido desta semana','ok'); load() }
    catch(e) { toast('Erro','err') }
  }

  // avisos de stock ao aplicar
  const avisosStockAplicar = (() => {
    if (!planoParaAplicar) return []
    const n = pombosAplicar.length; const av = []
    planoParaAplicar.itens.forEach(it => {
      const prod = getProd(it.product_id)
      if (!prod?.dosagem_valor) return
      const stk = stock.find(s=>s.nome.toLowerCase()===prod.nome.toLowerCase())
      if (!stk) return
      const nec = prod.dosagem_base==='pombo' ? prod.dosagem_valor*n : prod.dosagem_valor
      if (stk.qtd < nec) av.push(`${prod.nome}: precisa ~${nec}${prod.dosagem_unidade||''}, tem ${stk.qtd}${stk.unidade||''}`)
    })
    return av
  })()

  // ── editar pombos do plano ativo ──────────────────────────────────────────
  const abrirEditarPombos = () => {
    setPombosSel(aplicacaoAtiva?.pombos_ids || [])
    setModalPombos(true)
  }
  const salvarPombos = async () => {
    if (pombosSel.length===0) { toast('Seleccione pelo menos um pombo','warn'); return }
    setSavingPombos(true)
    try {
      await db.updateTreatmentApplication(aplicacaoAtiva.id, { pombos_ids:pombosSel, n_pombos:pombosSel.length })
      toast('Pombos actualizados!','ok'); setModalPombos(false); load()
    } catch(e) { toast('Erro','err') }
    finally { setSavingPombos(false) }
  }
  const togglePomboSel = (id, setter) => setter(s => s.includes(id)?s.filter(x=>x!==id):[...s,id])

  // ── render card de período (lista) ────────────────────────────────────────
  const renderPeriodoLista = (itens, per, estado) => {
    if (itens.length===0) return null
    const isM = per==='manha'
    return (
      <div style={{ marginBottom:10 }}>
        <div style={{ fontSize:11, fontWeight:700, color:isM?'#D4AF37':'#4C8DFF', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>
          {isM?'🌅 Manhã':'🌆 Tarde'}
        </div>
        {itens.map((item,i) => {
          const chave = `${item.dia_semana}_${per}`
          const feito = !!estado?.[chave]
          const prod  = getProd(item.product_id)
          const dose  = calcDose(prod, nPombos)
          const stk   = prod ? stock.find(s=>s.nome.toLowerCase()===prod.nome.toLowerCase()) : null
          return (
            <div key={i} className="card card-p" style={{ marginBottom:6, borderColor:feito?'rgba(45,212,167,.3)':undefined, padding:'10px 14px' }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                <button onClick={() => toggleDia(item.dia_semana, per)}
                  style={{ width:22, height:22, borderRadius:6, border:feito?'none':'2px solid #1B2D52', background:feito?'#2DD4A7':'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, fontSize:13, marginTop:1 }}>
                  {feito && '✓'}
                </button>
                <div style={{ flex:1 }}>
                  {prod && <div style={{ fontSize:13, fontWeight:600, color:feito?'#7A8699':'#fff', textDecoration:feito?'line-through':'none', marginBottom:4 }}>{prod.nome}</div>}
                  <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                    {prod && <div style={{ fontSize:12, color:'#94a3b8' }}>{MODO_LABEL_FULL[prod.modo]} {dose && <span style={{ color:'#2DD4A7', fontWeight:600 }}>· {dose}</span>}</div>}
                    {stk && <div style={{ fontSize:11, color:alertasStock.some(a=>a.id===stk.id)?'#f87171':'#7A8699' }}>📦 Stock: {stk.qtd}{stk.unidade}</div>}
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'2px 12px', fontSize:11, color:'#7A8699' }}>
                      {item.racao_g && <span>🌾 {item.racao_g}g{item.tipo_racao?` ${item.tipo_racao}`:''}</span>}
                      {item.voo_min && <span>✈️ {item.voo_min} min voo</span>}
                      {item.outros  && <span>🛁 {item.outros}</span>}
                      {item.notas   && <span style={{ fontStyle:'italic' }}>📝 {item.notas}</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // ── render tabela (como as imagens) ───────────────────────────────────────
  const renderTabelaSemana = (plano, estado) => {
    const diasComItens = DIAS_SEMANA.filter(d => (plano.itens||[]).some(i=>i.dia_semana===d.key))
    if (diasComItens.length===0) return <div style={{ fontSize:12, color:'#7A8699', textAlign:'center', padding:24 }}>Sem dias de tratamento no plano.</div>

    const campos = [
      { key:'agua',   label:'Na Água',    per:'ambos' },
      { key:'racao',  label:'Na Ração',   per:'ambos' },
      { key:'gramas', label:'Ração (g)',  per:'ambos' },
      { key:'tipo',   label:'Tipo Ração', per:'ambos' },
      { key:'voo',    label:'Voo (min)',  per:'ambos' },
      { key:'outros', label:'Outros',     per:'ambos' },
    ]
    const periodos = ['manha','tarde']
    const tdBase = { border:'1px solid #1B2D52', padding:'6px 8px', fontSize:11, textAlign:'center', verticalAlign:'top' }
    const thBase = { border:'1px solid #1B2D52', padding:'7px 8px', fontSize:11, fontWeight:600, background:'#0B1830', color:'#94a3b8', textAlign:'center', whiteSpace:'nowrap' }

    return (
      <div style={{ overflowX:'auto' }}>
        <table style={{ borderCollapse:'collapse', width:'100%', minWidth: diasComItens.length * 110 + 120 }}>
          <thead>
            <tr>
              <th style={{ ...thBase, background:'#050D1A', color:'#7A8699', minWidth:110, textAlign:'left' }}>Período / Campo</th>
              {diasComItens.map(d => {
                const dn = calcDN(d.key, plano.dia_prova)
                const isHoje = d.key === hojeKey
                return (
                  <th key={d.key} style={{ ...thBase, background:isHoje?'rgba(212,175,55,.15)':'#0B1830', color:isHoje?'#D4AF37':'#94a3b8', minWidth:110 }}>
                    {d.labelFull}{isHoje?' ⬅️ Hoje':''}
                    <div style={{ fontSize:10, color:'#D4AF37', fontWeight:700 }}>{dn}</div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {periodos.map(per => {
              const isM = per==='manha'
              const perLabel = isM ? '🌅 Manhã' : '🌆 Tarde'
              const perColor = isM ? '#D4AF37' : '#4C8DFF'
              return campos.map((campo, ci) => (
                <tr key={`${per}_${campo.key}`}>
                  <td style={{ ...tdBase, background:'#0B1830', textAlign:'left', whiteSpace:'nowrap' }}>
                    {ci===0 && <div style={{ fontSize:10, fontWeight:700, color:perColor, marginBottom:3, textTransform:'uppercase', letterSpacing:1 }}>{perLabel}</div>}
                    <span style={{ color:'#7A8699' }}>{campo.label}</span>
                  </td>
                  {diasComItens.map(d => {
                    const item = (plano.itens||[]).find(i => i.dia_semana===d.key && (per==='manha'?i.periodo!=='tarde':i.periodo==='tarde'))
                    const chave = `${d.key}_${per}`
                    const feito = !!estado?.[chave]
                    const prod  = item ? getProd(item.product_id) : null
                    const dose  = calcDose(prod, nPombos)
                    const stk   = prod ? stock.find(s=>s.nome.toLowerCase()===prod.nome.toLowerCase()) : null
                    const isHoje = d.key===hojeKey

                    let conteudo = null
                    if (!item) {
                      conteudo = <span style={{ color:'#1B2D52' }}>—</span>
                    } else if (campo.key==='agua' && prod?.modo==='agua') {
                      conteudo = <><div style={{ fontWeight:600, color:feito?'#7A8699':'#fff', textDecoration:feito?'line-through':'none' }}>{prod.nome}</div>{dose&&<div style={{ fontSize:10, color:'#2DD4A7' }}>{dose}</div>}{stk&&<div style={{ fontSize:10, color:alertasStock.some(a=>a.id===stk.id)?'#f87171':'#475569' }}>📦 {stk.qtd}{stk.unidade}</div>}</>
                    } else if (campo.key==='racao' && (prod?.modo==='racao'||prod?.modo==='direto'||prod?.modo==='outros')) {
                      conteudo = <><div style={{ fontWeight:600, color:feito?'#7A8699':'#fff', textDecoration:feito?'line-through':'none' }}>{prod.nome}</div>{dose&&<div style={{ fontSize:10, color:'#2DD4A7' }}>{dose}</div>}{stk&&<div style={{ fontSize:10, color:alertasStock.some(a=>a.id===stk.id)?'#f87171':'#475569' }}>📦 {stk.qtd}{stk.unidade}</div>}</>
                    } else if (campo.key==='gramas' && item.racao_g) {
                      conteudo = <span style={{ fontWeight:600, color:'#fff' }}>{item.racao_g}g</span>
                    } else if (campo.key==='tipo' && item.tipo_racao) {
                      conteudo = <span style={{ color:'#cbd5e1' }}>{item.tipo_racao}</span>
                    } else if (campo.key==='voo' && item.voo_min) {
                      conteudo = <span style={{ fontWeight:600, color:'#4C8DFF' }}>{item.voo_min} min</span>
                    } else if (campo.key==='outros' && item.outros) {
                      conteudo = <span style={{ color:'#94a3b8' }}>{item.outros}</span>
                    } else {
                      conteudo = <span style={{ color:'#1B2D52' }}>—</span>
                    }

                    return (
                      <td key={d.key} style={{ ...tdBase, background:isHoje?'rgba(212,175,55,.04)':feito?'rgba(45,212,167,.04)':'transparent', position:'relative' }}>
                        {ci===0 && item && (
                          <button onClick={() => toggleDia(d.key, per)}
                            style={{ position:'absolute', top:4, right:4, width:18, height:18, borderRadius:4, border:feito?'none':'1px solid #1B2D52', background:feito?'#2DD4A7':'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:10, padding:0 }}>
                            {feito&&'✓'}
                          </button>
                        )}
                        {conteudo}
                      </td>
                    )
                  })}
                </tr>
              ))
            })}
          </tbody>
        </table>
      </div>
    )
  }

  // calculadora
  const consumoCalc = (parseFloat(calcPombos)||0)*(parseFloat(calcG)||0)*(parseFloat(calcDias)||0)/1000
  const stockFiltrado = stock.filter(s => filtroTipo==='todos' || s.tipo===filtroTipo)

  // ── TABS ──────────────────────────────────────────────────────────────────
  const TABS = [['hoje','☀️ Hoje'],['semana','📋 Semana'],['planos','🗂️ Planos'],['biblioteca','💊 Biblioteca'],['stock','📦 Stock'],['calculadora','🧮 Calc']]

  const btnAdd = () => {
    if (tab==='planos') return <button className="btn btn-primary" onClick={openNewPlano}>＋ Plano</button>
    if (tab==='biblioteca') return <button className="btn btn-primary" onClick={openNewProd}>＋ Produto</button>
    if (tab==='stock') return <button className="btn btn-primary" onClick={openNewStock}>＋ Item</button>
    return null
  }

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:80 }}><Spinner lg /></div>

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* header */}
      <div className="section-header">
        <div>
          <div className="section-title">Alimentação &amp; Tratamentos</div>
          <div className="section-sub">
            {planoAtivo ? `✅ ${planoAtivo.nome} · ${nPombos} pombos` : '— Sem plano activo esta semana'}
          </div>
        </div>
        {btnAdd()}
      </div>

      {/* alertas globais */}
      {(alertasStock.length>0||validadeProxima.length>0) && (
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
          {alertasStock.length>0 && (
            <div style={{ background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', borderRadius:12, padding:'10px 16px', cursor:'pointer' }} onClick={()=>setTab('stock')}>
              <div style={{ fontWeight:600, color:'#f87171', marginBottom:4 }}>⚠️ {alertasStock.length} produto(s) a precisar de reposição — clique para ver</div>
              {alertasStock.map(s=><div key={s.id} style={{ fontSize:11, color:'#cbd5e1' }}>{s.nome} — {s.qtd}{s.unidade}</div>)}
            </div>
          )}
          {validadeProxima.length>0 && (
            <div style={{ background:'rgba(234,179,8,.08)', border:'1px solid rgba(234,179,8,.2)', borderRadius:12, padding:'10px 16px' }}>
              <div style={{ fontWeight:600, color:'#D4AF37', marginBottom:4 }}>📅 {validadeProxima.length} produto(s) a expirar em 30 dias</div>
              {validadeProxima.map(s=><div key={s.id} style={{ fontSize:11, color:'#cbd5e1' }}>{s.nome} — válido até {new Date(s.validade).toLocaleDateString('pt-PT')}</div>)}
            </div>
          )}
        </div>
      )}

      {/* tabs */}
      <div style={{ display:'flex', gap:4, background:'#101F40', borderRadius:8, padding:4, marginBottom:16, overflowX:'auto' }}>
        {TABS.map(([k,l]) => (
          <button key={k} onClick={()=>setTab(k)} style={{ flex:1, padding:'8px 10px', borderRadius:6, fontSize:12, fontWeight:500, cursor:'pointer', border:'none', fontFamily:'inherit', whiteSpace:'nowrap', background:tab===k?'#1E5FD9':'none', color:tab===k?'#fff':'#94a3b8' }}>{l}</button>
        ))}
      </div>

      {/* ══ TAB HOJE ══════════════════════════════════════════════════════════ */}
      {tab==='hoje' && (
        <div>
          <div style={{ fontSize:12, color:'#94a3b8', marginBottom:12 }}>
            {new Date().toLocaleDateString('pt-PT',{weekday:'long',day:'numeric',month:'long'})}
          </div>
          {!planoAtivo ? (
            <EmptyState icon="☀️" title="Sem plano activo" desc="Aplique um plano a esta semana em 'Planos'"
              action={<button className="btn btn-primary" onClick={()=>setTab('planos')}>Ver Planos →</button>} />
          ) : !temHoje ? (
            <div className="card card-p" style={{ textAlign:'center', padding:32 }}>
              <div style={{ fontSize:28, marginBottom:8 }}>✅</div>
              <div style={{ color:'#fff', fontWeight:600, marginBottom:4 }}>Dia de descanso!</div>
              <div style={{ fontSize:12, color:'#7A8699' }}>Hoje não há tratamentos no plano {planoAtivo.nome}.</div>
            </div>
          ) : (
            <div>
              {/* info plano ativo */}
              <div style={{ background:'rgba(30,95,217,.08)', border:'1px solid rgba(30,95,217,.2)', borderRadius:12, padding:'12px 16px', marginBottom:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
                  <div>
                    <div style={{ fontWeight:700, color:'#fff', fontSize:14 }}>{planoAtivo.nome}</div>
                    <div style={{ fontSize:11, color:'#7A8699' }}>{ESP_LABEL[planoAtivo.especialidade]} · prova ao {DIAS_SEMANA.find(d=>d.key===planoAtivo.dia_prova)?.labelFull}</div>
                  </div>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    <button className="btn btn-secondary btn-sm" onClick={abrirEditarPombos}>
                      👥 {nPombos} pombos ✏️
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={()=>imprimirPlano(planoAtivo,produtos,nPombos)}>🖨️</button>
                  </div>
                </div>
              </div>

              {/* resumo doses de hoje */}
              {(() => {
                const todosItensHoje = [...itensDia(hojeKey,'manha'),...itensDia(hojeKey,'tarde')]
                const produtosHoje = [...new Set(todosItensHoje.map(i=>i.product_id))].map(id=>getProd(id)).filter(Boolean)
                if (produtosHoje.length===0) return null
                return (
                  <div style={{ background:'rgba(45,212,167,.06)', border:'1px solid rgba(45,212,167,.2)', borderRadius:12, padding:'12px 16px', marginBottom:16 }}>
                    <div style={{ fontWeight:600, color:'#2DD4A7', marginBottom:8, fontSize:12 }}>💊 Doses de hoje para {nPombos} pombos</div>
                    {produtosHoje.map(prod => {
                      const dose = calcDose(prod, nPombos)
                      const stk  = stock.find(s=>s.nome.toLowerCase()===prod.nome.toLowerCase())
                      const semStk = stk && prod.dosagem_valor && prod.dosagem_base==='pombo' && stk.qtd < prod.dosagem_valor*nPombos
                      return (
                        <div key={prod.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'4px 0', borderBottom:'1px solid rgba(45,212,167,.1)', fontSize:12 }}>
                          <div>
                            <span style={{ color:'#fff', fontWeight:500 }}>{prod.nome}</span>
                            <span style={{ color:'#7A8699', marginLeft:8 }}>{MODO_LABEL[prod.modo]}</span>
                          </div>
                          <div style={{ textAlign:'right' }}>
                            {dose && <div style={{ color:'#2DD4A7', fontWeight:600 }}>{dose}</div>}
                            {stk && <div style={{ fontSize:10, color:semStk?'#f87171':'#475569' }}>{semStk?'⚠️ stock insuficiente':''} 📦 {stk.qtd}{stk.unidade}</div>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}

              {renderPeriodoLista(itensDia(hojeKey,'manha'),'manha',aplicacaoAtiva?.estado_dias)}
              {renderPeriodoLista(itensDia(hojeKey,'tarde'),'tarde',aplicacaoAtiva?.estado_dias)}
            </div>
          )}
        </div>
      )}

      {/* ══ TAB SEMANA ════════════════════════════════════════════════════════ */}
      {tab==='semana' && (
        <div>
          {!planoAtivo ? (
            planos.length===0 ? (
              <EmptyState icon="🗂️" title="Sem planos" desc="Crie primeiro um plano"
                action={<button className="btn btn-primary" onClick={()=>setTab('planos')}>Criar Plano →</button>} />
            ) : (
              <div>
                <div style={{ fontSize:13, color:'#94a3b8', marginBottom:12 }}>Escolha um plano para aplicar esta semana:</div>
                {planos.map(p => (
                  <div key={p.id} className="card card-p" style={{ marginBottom:8 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:'#fff' }}>{p.nome}</div>
                        <div style={{ fontSize:11, color:'#7A8699' }}>{ESP_LABEL[p.especialidade]} · {(p.itens||[]).length} entradas</div>
                      </div>
                      <button className="btn btn-primary btn-sm" onClick={()=>abrirAplicar(p)}>Aplicar esta semana</button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div>
              {/* header plano ativo */}
              <div style={{ background:'rgba(30,95,217,.08)', border:'1px solid rgba(30,95,217,.2)', borderRadius:12, padding:'12px 16px', marginBottom:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
                  <div>
                    <div style={{ fontWeight:700, color:'#fff', fontSize:14 }}>{planoAtivo.nome}</div>
                    <div style={{ fontSize:11, color:'#7A8699' }}>{ESP_LABEL[planoAtivo.especialidade]} · semana {new Date(semanaAtual).toLocaleDateString('pt-PT')}</div>
                  </div>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
                    <button className="btn btn-secondary btn-sm" onClick={abrirEditarPombos}>👥 {nPombos} pombos ✏️</button>
                    <button className="btn btn-secondary btn-sm" onClick={()=>imprimirPlano(planoAtivo,produtos,nPombos)}>🖨️</button>
                    {/* toggle vista */}
                    <button className="btn btn-secondary btn-sm" onClick={()=>setVistaTabela(v=>!v)}>
                      {vistaTabela ? '☰ Lista' : '⊞ Tabela'}
                    </button>
                    <Badge v="blue">Activo</Badge>
                  </div>
                </div>
              </div>

              {vistaTabela ? (
                renderTabelaSemana(planoAtivo, aplicacaoAtiva?.estado_dias)
              ) : (
                DIAS_SEMANA.map(({ key, labelFull }) => {
                  const iM = itensDia(key,'manha')
                  const iT = itensDia(key,'tarde')
                  if (iM.length===0 && iT.length===0) return null
                  const isHoje = key===hojeKey
                  const dn = calcDN(key, planoAtivo.dia_prova)
                  return (
                    <div key={key} className="card card-p" style={{ marginBottom:8, borderColor:isHoje?'rgba(212,175,55,.4)':undefined }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                        <div style={{ fontWeight:700, color:isHoje?'#D4AF37':'#fff', fontSize:13 }}>{labelFull}{isHoje?' ← Hoje':''}</div>
                        <div style={{ fontSize:11, color:'#D4AF37', fontWeight:600 }}>{dn}</div>
                      </div>
                      {renderPeriodoLista(iM,'manha',aplicacaoAtiva?.estado_dias)}
                      {renderPeriodoLista(iT,'tarde',aplicacaoAtiva?.estado_dias)}
                    </div>
                  )
                })
              )}

              <div style={{ textAlign:'center', marginTop:12 }}>
                <button className="btn btn-secondary btn-sm" onClick={encerrarAplicacao}>Remover plano desta semana</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB PLANOS ════════════════════════════════════════════════════════ */}
      {tab==='planos' && (
        planos.length===0
          ? <EmptyState icon="🗂️" title="Sem planos" desc="Construa o primeiro plano de tratamento"
              action={<button className="btn btn-primary" onClick={openNewPlano}>＋ Novo Plano</button>} />
          : <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {planos.map(p => (
                <div key={p.id} className="card card-p">
                  <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                    <div style={{ flex:1, minWidth:160 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:'#fff' }}>{p.nome}</div>
                      <div style={{ fontSize:11, color:'#7A8699' }}>{ESP_LABEL[p.especialidade]} · prova ao {DIAS_SEMANA.find(d=>d.key===p.dia_prova)?.labelFull?.toLowerCase()} · {(p.itens||[]).length} entradas</div>
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={()=>imprimirPlano(p,produtos,nPombos)}>🖨️</button>
                    <button className="btn btn-primary btn-sm" onClick={()=>abrirAplicar(p)}>Aplicar</button>
                    <button className="btn btn-secondary btn-sm" onClick={()=>openEditPlano(p)}>✏️</button>
                    <button className="btn btn-icon btn-sm" onClick={()=>setConfirm({tipo:'plano',item:p})}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
      )}

      {/* ══ TAB BIBLIOTECA ════════════════════════════════════════════════════ */}
      {tab==='biblioteca' && (
        produtos.length===0
          ? <EmptyState icon="💊" title="Biblioteca vazia" desc="Adicione produtos com dosagem padrão — serão reutilizados na construção dos planos"
              action={<button className="btn btn-primary" onClick={openNewProd}>＋ Novo Produto</button>} />
          : <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {produtos.map(p => {
                const dose = calcDose(p, nPombos||1)
                return (
                  <div key={p.id} className="card card-p">
                    <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                      <div style={{ fontSize:20 }}>💊</div>
                      <div style={{ flex:1, minWidth:160 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:'#fff' }}>{p.nome}</div>
                        <div style={{ fontSize:11, color:'#7A8699' }}>{MODO_LABEL_FULL[p.modo]}</div>
                        {dose && <div style={{ fontSize:11, color:'#2DD4A7', marginTop:2 }}>
                          {dose}{nPombos>0 && ` (${nPombos} pombos activos)`}
                        </div>}
                      </div>
                      <button className="btn btn-secondary btn-sm" onClick={()=>openEditProd(p)}>✏️</button>
                      <button className="btn btn-icon btn-sm" onClick={()=>setConfirm({tipo:'produto',item:p})}>🗑️</button>
                    </div>
                  </div>
                )
              })}
            </div>
      )}

      {/* ══ TAB STOCK ═════════════════════════════════════════════════════════ */}
      {tab==='stock' && (
        <div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
            {['todos',...TIPOS_STOCK].map(tp => (
              <button key={tp} onClick={()=>setFiltroTipo(tp)} className={`chip${filtroTipo===tp?' active':''}`}>{tp==='todos'?'Todos':tp}</button>
            ))}
          </div>
          {stockFiltrado.length===0
            ? <EmptyState icon="📦" title="Sem itens" desc="Adicione cereais, rações e medicamentos ao stock"
                action={<button className="btn btn-primary" onClick={openNewStock}>＋ Novo Item</button>} />
            : <div className="grid-2">
                {stockFiltrado.map(s => {
                  const icon = s.tipo==='Cereal'?'🌾':s.tipo==='Ração Comercial'?'🥫':s.tipo==='Medicamento'?'💊':s.tipo==='Suplemento'?'🧪':'📦'
                  const baixo = alertasStock.some(a=>a.id===s.id)
                  const dias = diasParaEsgotar(s)
                  return (
                    <div key={s.id} className="card card-p">
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                        <div style={{ fontSize:22 }}>{icon}</div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:13, fontWeight:600, color:'#fff' }}>{s.nome}</div>
                          <div style={{ fontSize:11, color:'#7A8699' }}>{s.tipo}</div>
                        </div>
                        <button className="btn btn-icon btn-sm" onClick={()=>openEditStock(s)}>✏️</button>
                        <button className="btn btn-icon btn-sm" onClick={()=>setConfirm({tipo:'stock',item:s})}>🗑️</button>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                        <button className="btn btn-icon btn-sm" onClick={()=>ajustarQtd(s,-1)}>−</button>
                        <div style={{ flex:1, textAlign:'center', fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:700, color:baixo?'#f87171':'#fff' }}>{s.qtd}{s.unidade}</div>
                        <button className="btn btn-icon btn-sm" onClick={()=>ajustarQtd(s,1)}>＋</button>
                      </div>
                      {s.qtd_minima && <div className="progress"><div className="progress-bar" style={{ width:`${Math.min(100,(s.qtd/(s.qtd_minima*3))*100)}%`, background:baixo?'#f87171':'#2DD4A7' }} /></div>}
                      {dias!==null && <div style={{ fontSize:11, color:dias<=5?'#f87171':dias<=14?'#D4AF37':'#7A8699', marginTop:6, fontWeight:dias<=14?600:400 }}>⏳ Esgota em ~{dias} dia{dias!==1?'s':''}</div>}
                      {s.margem_dias && s.qtd_minima && <div style={{ fontSize:10, color:'#475569', marginTop:2 }}>🔔 Alerta com {s.margem_dias} dias de margem</div>}
                      {s.validade && <div style={{ fontSize:11, color:'#7A8699', marginTop:2 }}>📅 Válido até {new Date(s.validade).toLocaleDateString('pt-PT')}</div>}
                      {s.preco && <div style={{ fontSize:11, color:'#D4AF37', marginTop:2 }}>💶 {s.preco}€</div>}
                    </div>
                  )
                })}
              </div>
          }
        </div>
      )}

      {/* ══ TAB CALCULADORA ══════════════════════════════════════════════════ */}
      {tab==='calculadora' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="card card-p">
            <div style={{ fontWeight:600, color:'#fff', marginBottom:16 }}>🧮 Consumo de Ração</div>
            <div className="form-grid">
              <Field label="Nº de Pombos"><input className="input" type="number" value={calcPombos} onChange={e=>setCalcPombos(e.target.value)} /></Field>
              <Field label="Gramas por pombo/dia"><input className="input" type="number" value={calcG} onChange={e=>setCalcG(e.target.value)} /></Field>
              <div className="col-2"><Field label="Período (dias)"><input className="input" type="number" value={calcDias} onChange={e=>setCalcDias(e.target.value)} /></Field></div>
            </div>
            <button className="btn btn-secondary btn-sm" style={{ marginBottom:16 }} onClick={()=>setCalcPombos(String(efectivoAtivo.length))}>
              Usar efectivo activo ({efectivoAtivo.length} pombos)
            </button>
            <div style={{ background:'#101F40', borderRadius:12, padding:20, textAlign:'center' }}>
              <div style={{ fontFamily:"'Fraunces',serif", fontSize:40, fontWeight:700, color:'#2DD4A7' }}>{consumoCalc.toFixed(1)} kg</div>
              <div style={{ fontSize:12, color:'#7A8699', marginTop:4 }}>Consumo total estimado</div>
            </div>
            <div style={{ marginTop:12, fontSize:12, color:'#94a3b8' }}>
              <div style={{ fontWeight:600, marginBottom:4, color:'#cbd5e1' }}>📊 Referências:</div>
              <div>Repouso/Muda: 25-30g · Pré-competição: 30-35g · Competição: 35-45g · Reprodução: 40-50g</div>
            </div>
          </div>

          {/* doses do plano ativo */}
          {planoAtivo && produtos.length>0 && (
            <div className="card card-p">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <div style={{ fontWeight:600, color:'#fff' }}>💊 Doses — {planoAtivo.nome}</div>
                <button className="btn btn-secondary btn-sm" onClick={abrirEditarPombos}>👥 {nPombos} pombos ✏️</button>
              </div>
              {[...new Set((planoAtivo.itens||[]).map(i=>i.product_id))].map(pid => {
                const prod = getProd(pid)
                if (!prod) return null
                const dose = calcDose(prod, nPombos)
                const stk  = stock.find(s=>s.nome.toLowerCase()===prod.nome.toLowerCase())
                const baixo = stk && prod.dosagem_valor && prod.dosagem_base==='pombo' && stk.qtd<prod.dosagem_valor*nPombos
                return (
                  <div key={pid} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid #1B2D52', fontSize:12 }}>
                    <div>
                      <div style={{ color:'#cbd5e1', fontWeight:500 }}>{prod.nome}</div>
                      <div style={{ color:'#7A8699', fontSize:11 }}>{MODO_LABEL_FULL[prod.modo]}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      {dose && <div style={{ color:'#2DD4A7', fontWeight:600 }}>{dose}</div>}
                      {stk && <div style={{ fontSize:10, color:baixo?'#f87171':'#475569' }}>📦 {stk.qtd}{stk.unidade}{baixo?' ⚠️':''}</div>}
                    </div>
                  </div>
                )
              })}
              {nPombos===0 && <div style={{ fontSize:11, color:'#7A8699', marginTop:8 }}>ℹ️ Aplique o plano a pombos para ver as doses calculadas.</div>}
            </div>
          )}
        </div>
      )}

      {/* ══ MODAL PLANO ══════════════════════════════════════════════════════ */}
      <Modal open={modal==='plano'} onClose={()=>{setModal(null);setSelected(null)}}
        title={selected?'✏️ Editar Plano':'🗂️ Novo Plano de Tratamento'} wide
        footer={<><button className="btn btn-secondary" onClick={()=>{setModal(null);setSelected(null)}}>Cancelar</button><button className="btn btn-primary" onClick={savePlano} disabled={saving}>{saving?<Spinner/>:null}{selected?'Guardar':'Criar Plano'}</button></>}>
        <div className="form-grid">
          <div className="col-2"><Field label="Nome do Plano *"><input className="input" placeholder="Ex: Velocidade Sem. Prova" value={formPlano.nome} onChange={e=>sfp('nome',e.target.value)} /></Field></div>
          <Field label="Especialidade"><select className="input" value={formPlano.especialidade} onChange={e=>sfp('especialidade',e.target.value)}>{ESPECIALIDADES.map(e=><option key={e} value={e}>{ESP_LABEL[e]}</option>)}</select></Field>
          <Field label="Dia de Prova (ref. D-N)"><select className="input" value={formPlano.dia_prova} onChange={e=>sfp('dia_prova',e.target.value)}>{DIAS_SEMANA.map(d=><option key={d.key} value={d.key}>{d.labelFull}</option>)}</select></Field>
        </div>

        {produtos.length===0 && (
          <div style={{ background:'rgba(212,175,55,.08)', border:'1px solid rgba(212,175,55,.2)', borderRadius:8, padding:'10px 14px', marginTop:12, fontSize:12, color:'#D4AF37' }}>
            💊 Biblioteca vazia — vá a "Biblioteca" e crie os produtos primeiro.
          </div>
        )}

        {['manha','tarde'].map(per => (
          <div key={per} style={{ marginTop:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <div style={{ fontSize:13, fontWeight:700, color:per==='manha'?'#D4AF37':'#4C8DFF' }}>{per==='manha'?'🌅 Manhã':'🌆 Tarde'}</div>
              <button className="btn btn-secondary btn-sm" onClick={()=>addItem(per)} disabled={produtos.length===0}>＋ Adicionar dia</button>
            </div>
            {formPlano.itens.filter(i=>per==='manha'?i.periodo!=='tarde':i.periodo==='tarde').map(item => {
              const realIdx = formPlano.itens.indexOf(item)
              return <ItemPlanoRow key={realIdx} item={item} idx={realIdx} produtos={produtos} plano={formPlano} updItem={updItem} delItem={delItem} />
            })}
          </div>
        ))}

        <div style={{ marginTop:16 }}>
          <Field label="Observações Gerais"><textarea className="input" rows={2} style={{ resize:'none' }} value={formPlano.obs} onChange={e=>sfp('obs',e.target.value)} /></Field>
        </div>
      </Modal>

      {/* ══ MODAL PRODUTO ════════════════════════════════════════════════════ */}
      <Modal open={modal==='produto'} onClose={()=>{setModal(null);setSelected(null)}}
        title={selected?'✏️ Editar Produto':'💊 Novo Produto'}
        footer={<><button className="btn btn-secondary" onClick={()=>{setModal(null);setSelected(null)}}>Cancelar</button><button className="btn btn-primary" onClick={saveProduto} disabled={saving}>{saving?<Spinner/>:null}{selected?'Guardar':'Criar'}</button></>}>
        <Field label="Nome *">
          <select className="input" value={formProduto.nome} onChange={e=>sfpr('nome',e.target.value)} style={{ marginBottom:6 }}>
            <option value="">— Sugestões —</option>
            {MEDICAMENTOS_LISTA.map(m=><option key={m}>{m}</option>)}
          </select>
          <input className="input" placeholder="Ou escreva o nome" value={formProduto.nome} onChange={e=>sfpr('nome',e.target.value)} />
        </Field>
        <div style={{ fontSize:11, color:'#7A8699', margin:'4px 0 12px' }}>💡 Nome igual ao do Stock → verificação automática de quantidade.</div>
        <Field label="Modo de Administração">
          <select className="input" value={formProduto.modo} onChange={e=>sfpr('modo',e.target.value)}>
            <option value="agua">💧 Na água</option>
            <option value="racao">🌾 Na ração</option>
            <option value="direto">💊 Direto ao pombo</option>
            <option value="outros">🛁 Outros (banho, narinas…)</option>
          </select>
        </Field>
        <div className="form-grid">
          <Field label="Dosagem"><input className="input" type="number" step="0.1" placeholder="Ex: 15" value={formProduto.dosagem_valor} onChange={e=>sfpr('dosagem_valor',e.target.value)} /></Field>
          <Field label="Unidade"><input className="input" placeholder="ml, g, comprimido…" value={formProduto.dosagem_unidade} onChange={e=>sfpr('dosagem_unidade',e.target.value)} /></Field>
          <Field label="Por">
            <select className="input" value={formProduto.dosagem_base} onChange={e=>sfpr('dosagem_base',e.target.value)}>
              <option value="pombo">Pombo</option>
              <option value="litro">Litro de água</option>
              <option value="kg">Kg de ração</option>
            </select>
          </Field>
          <Field label="Categoria">
            <select className="input" value={formProduto.categoria} onChange={e=>sfpr('categoria',e.target.value)}>
              {['Vitamina','Suplemento','Probiótico','Antibiótico','Antiparasitário','Antifúngico','Energético','Outro'].map(c=><option key={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Observações"><textarea className="input" rows={2} style={{ resize:'none' }} value={formProduto.obs} onChange={e=>sfpr('obs',e.target.value)} /></Field>
      </Modal>

      {/* ══ MODAL STOCK ══════════════════════════════════════════════════════ */}
      <Modal open={modal==='stock'} onClose={()=>{setModal(null);setSelected(null)}}
        title={selected?'✏️ Editar Item':'📦 Novo Item de Stock'}
        footer={<><button className="btn btn-secondary" onClick={()=>{setModal(null);setSelected(null)}}>Cancelar</button><button className="btn btn-primary" onClick={saveStock} disabled={saving}>{saving?<Spinner/>:null}{selected?'Guardar':'Adicionar'}</button></>}>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <Field label="Tipo"><select className="input" value={formStock.tipo} onChange={e=>sfs('tipo',e.target.value)}>{TIPOS_STOCK.map(tp=><option key={tp}>{tp}</option>)}</select></Field>
          <Field label="Nome *">
            <select className="input" value={formStock.nome} onChange={e=>sfs('nome',e.target.value)} style={{ marginBottom:6 }}>
              <option value="">— Sugestões —</option>
              {[...CEREAIS,...RACOES_COMERCIAIS,...MEDICAMENTOS_LISTA].map(n=><option key={n}>{n}</option>)}
            </select>
            <input className="input" placeholder="Ou escreva o nome" value={formStock.nome} onChange={e=>sfs('nome',e.target.value)} />
          </Field>
          <div className="form-grid" style={{ gridTemplateColumns:'1fr 1fr' }}>
            <Field label="Quantidade *"><input className="input" type="number" step="0.1" value={formStock.qtd} onChange={e=>sfs('qtd',e.target.value)} /></Field>
            <Field label="Unidade"><select className="input" value={formStock.unidade} onChange={e=>sfs('unidade',e.target.value)}>{UNIDADES.map(u=><option key={u}>{u}</option>)}</select></Field>
            <Field label="Stock Mínimo (alerta)"><input className="input" type="number" step="0.1" placeholder="Ex: 200" value={formStock.qtd_minima} onChange={e=>sfs('qtd_minima',e.target.value)} /></Field>
            <Field label="Margem segurança (dias)">
              <input className="input" type="number" placeholder="7" value={formStock.margem_dias} onChange={e=>sfs('margem_dias',e.target.value)} />
              <div style={{ fontSize:10, color:'#7A8699', marginTop:2 }}>Avisa N dias antes de atingir o mínimo</div>
            </Field>
            <Field label="Validade"><input className="input" type="date" value={formStock.validade} onChange={e=>sfs('validade',e.target.value)} /></Field>
            <Field label="Preço (€)"><input className="input" type="number" step="0.01" value={formStock.preco} onChange={e=>sfs('preco',e.target.value)} /></Field>
          </div>
          <Field label="Observações"><input className="input" value={formStock.obs} onChange={e=>sfs('obs',e.target.value)} /></Field>
        </div>
      </Modal>

      {/* ══ MODAL APLICAR ════════════════════════════════════════════════════ */}
      <Modal open={modalAplicar} onClose={()=>setModalAplicar(false)}
        title={`Aplicar "${planoParaAplicar?.nome}"`} wide
        footer={<><button className="btn btn-secondary" onClick={()=>setModalAplicar(false)}>Cancelar</button><button className="btn btn-primary" onClick={confirmarAplicar} disabled={savingAplicar}>{savingAplicar?<Spinner/>:null}Aplicar a {pombosAplicar.length} pombo(s)</button></>}>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
          <button className="btn btn-secondary btn-sm" onClick={()=>setPombosAplicar(efectivoAtivo.map(p=>p.id))}>Todo o efectivo</button>
          {ESPECIALIDADES.filter(e=>e!=='geral').map(e=><button key={e} className="btn btn-secondary btn-sm" onClick={()=>setPombosAplicar(efectivoAtivo.filter(p=>(p.esp||[]).includes(e)).map(p=>p.id))}>{ESP_LABEL[e]}</button>)}
          <button className="btn btn-secondary btn-sm" onClick={()=>setPombosAplicar(efectivoAtivo.filter(p=>p.sexo==='M').map(p=>p.id))}>Machos</button>
          <button className="btn btn-secondary btn-sm" onClick={()=>setPombosAplicar(efectivoAtivo.filter(p=>p.sexo==='F').map(p=>p.id))}>Fêmeas</button>
          <button className="btn btn-secondary btn-sm" onClick={()=>setPombosAplicar([])}>Limpar</button>
        </div>
        {avisosStockAplicar.length>0 && (
          <div style={{ background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', borderRadius:8, padding:'10px 14px', marginBottom:12, fontSize:12, color:'#f87171' }}>
            <div style={{ fontWeight:600, marginBottom:4 }}>⚠️ Stock insuficiente:</div>
            {avisosStockAplicar.map((a,i)=><div key={i}>{a}</div>)}
          </div>
        )}
        <div style={{ fontSize:12, color:'#94a3b8', marginBottom:8 }}>{pombosAplicar.length} de {efectivoAtivo.length} pombos seleccionados</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, maxHeight:220, overflowY:'auto' }}>
          {efectivoAtivo.map(p=>(
            <button key={p.id} type="button" onClick={()=>togglePomboSel(p.id,setPombosAplicar)}
              className={`chip${pombosAplicar.includes(p.id)?' active':''}`} style={{ fontSize:11 }}>
              {p.emoji} {p.nome}
            </button>
          ))}
        </div>
      </Modal>

      {/* ══ MODAL EDITAR POMBOS DO PLANO ATIVO ═══════════════════════════════ */}
      <Modal open={modalPombos} onClose={()=>setModalPombos(false)}
        title="👥 Editar Pombos em Tratamento" wide
        footer={<><button className="btn btn-secondary" onClick={()=>setModalPombos(false)}>Cancelar</button><button className="btn btn-primary" onClick={salvarPombos} disabled={savingPombos}>{savingPombos?<Spinner/>:null}Guardar ({pombosSel.length} pombos)</button></>}>
        <div style={{ fontSize:12, color:'#94a3b8', marginBottom:12 }}>
          Altere os pombos incluídos no tratamento desta semana. As doses serão recalculadas automaticamente.
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
          <button className="btn btn-secondary btn-sm" onClick={()=>setPombosSel(efectivoAtivo.map(p=>p.id))}>Todo o efectivo</button>
          {ESPECIALIDADES.filter(e=>e!=='geral').map(e=><button key={e} className="btn btn-secondary btn-sm" onClick={()=>setPombosSel(efectivoAtivo.filter(p=>(p.esp||[]).includes(e)).map(p=>p.id))}>{ESP_LABEL[e]}</button>)}
          <button className="btn btn-secondary btn-sm" onClick={()=>setPombosSel(efectivoAtivo.filter(p=>p.sexo==='M').map(p=>p.id))}>Machos</button>
          <button className="btn btn-secondary btn-sm" onClick={()=>setPombosSel(efectivoAtivo.filter(p=>p.sexo==='F').map(p=>p.id))}>Fêmeas</button>
          <button className="btn btn-secondary btn-sm" onClick={()=>setPombosSel([])}>Limpar</button>
        </div>
        <div style={{ fontSize:12, color:'#94a3b8', marginBottom:8 }}>{pombosSel.length} de {efectivoAtivo.length} seleccionados</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, maxHeight:260, overflowY:'auto' }}>
          {efectivoAtivo.map(p=>(
            <button key={p.id} type="button" onClick={()=>togglePomboSel(p.id,setPombosSel)}
              className={`chip${pombosSel.includes(p.id)?' active':''}`} style={{ fontSize:11 }}>
              {p.emoji} {p.nome}
            </button>
          ))}
        </div>
      </Modal>

      {/* ══ CONFIRM DELETE ═══════════════════════════════════════════════════ */}
      <Modal open={!!confirm} onClose={()=>setConfirm(null)} title="Confirmar eliminação"
        footer={<><button className="btn btn-secondary" onClick={()=>setConfirm(null)}>Cancelar</button><button className="btn btn-danger" onClick={()=>{if(confirm.tipo==='plano')delPlano();else if(confirm.tipo==='produto')delProduto();else delStock()}}>Eliminar</button></>}>
        <p style={{ fontSize:14, color:'#cbd5e1' }}>
          {confirm?.tipo==='plano' && `Eliminar o plano "${confirm.item.nome}"?`}
          {confirm?.tipo==='produto' && `Eliminar "${confirm.item.nome}"? Planos que o usam serão afectados.`}
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
          <select className="input" value={item.dia_semana} onChange={e=>updItem(idx,'dia_semana',e.target.value)}>
            {DIAS_SEMANA.map(d=><option key={d.key} value={d.key}>{d.labelFull}</option>)}
          </select>
        </div>
        <div style={{ flex:'0 0 76px', textAlign:'center' }}>
          <div style={{ fontSize:10, color:'#7A8699', marginBottom:4 }}>Posição</div>
          <div style={{ background:'#0B1830', borderRadius:6, padding:'8px 0', fontSize:12, fontWeight:700, color:'#D4AF37' }}>{dn}</div>
        </div>
        <button className="btn btn-icon btn-sm" onClick={()=>delItem(idx)}>🗑️</button>
      </div>
      <Field label="Produto (da biblioteca)">
        <select className="input" value={item.product_id} onChange={e=>updItem(idx,'product_id',e.target.value)}>
          <option value="">— Escolher produto —</option>
          {produtos.map(p=><option key={p.id} value={p.id}>{p.nome} ({MODO_LABEL[p.modo]})</option>)}
        </select>
      </Field>
      <div className="form-grid" style={{ marginTop:8, gridTemplateColumns:'1fr 1fr 1fr' }}>
        <Field label="Ração (g)"><input className="input" type="number" placeholder="Ex: 20" value={item.racao_g} onChange={e=>updItem(idx,'racao_g',e.target.value)} /></Field>
        <Field label="Tipo de Ração"><input className="input" placeholder="Ex: Gerry Plus" value={item.tipo_racao} onChange={e=>updItem(idx,'tipo_racao',e.target.value)} /></Field>
        <Field label="Voo (min)"><input className="input" type="number" placeholder="Ex: 35" value={item.voo_min} onChange={e=>updItem(idx,'voo_min',e.target.value)} /></Field>
      </div>
      <div className="form-grid" style={{ marginTop:8, gridTemplateColumns:'1fr 1fr' }}>
        <Field label="Outros (banho, narinas…)"><input className="input" placeholder="Ex: Total Bath MG++" value={item.outros} onChange={e=>updItem(idx,'outros',e.target.value)} /></Field>
        <Field label="Notas"><input className="input" placeholder="Opcional" value={item.notas} onChange={e=>updItem(idx,'notas',e.target.value)} /></Field>
      </div>
    </div>
  )
}
