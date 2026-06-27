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
const ESP_COLOR = { velocidade:'#F59E0B', meio_fundo:'#3B82F6', fundo:'#10B981', geral:'#8B5CF6' }
const MODO_ICON  = { agua:'💧', racao:'🌾', direto:'💊', outros:'🛁' }
const MODO_LABEL = { agua:'Na água', racao:'Na ração', direto:'Direto', outros:'Outros' }
const BASE_LABEL = { pombo:'por pombo', litro:'por litro', kg:'por kg ração' }
const DIAS_SEMANA = [
  { key:'domingo', label:'Dom', full:'Domingo', idx:0 },
  { key:'segunda', label:'Seg', full:'Segunda', idx:1 },
  { key:'terca',   label:'Ter', full:'Terça',   idx:2 },
  { key:'quarta',  label:'Qua', full:'Quarta',  idx:3 },
  { key:'quinta',  label:'Qui', full:'Quinta',  idx:4 },
  { key:'sexta',   label:'Sex', full:'Sexta',   idx:5 },
  { key:'sabado',  label:'Sáb', full:'Sábado',  idx:6 },
]

// ── helpers ───────────────────────────────────────────────────────────────────
const diaIdx = k => DIAS_SEMANA.find(d => d.key === k)?.idx ?? 0
function calcDN(diaItem, diaProva) {
  let d = diaIdx(diaProva) - diaIdx(diaItem)
  if (d < 0) d += 7
  return d === 0 ? 'Prova' : `D-${d}`
}
function segundaFeira(data = new Date()) {
  const d = new Date(data); d.setDate(d.getDate() - (d.getDay()+6)%7)
  return d.toISOString().slice(0,10)
}
const diaHojeKey = () => DIAS_SEMANA[new Date().getDay()].key

function calcDose(prod, n) {
  if (!prod?.dosagem_valor) return null
  if (prod.dosagem_base === 'pombo') {
    const total = (prod.dosagem_valor * n).toFixed(1)
    return { linha1: `${prod.dosagem_valor}${prod.dosagem_unidade}/pombo`, linha2: `→ ${total}${prod.dosagem_unidade} total` }
  }
  return { linha1: `${prod.dosagem_valor}${prod.dosagem_unidade}`, linha2: BASE_LABEL[prod.dosagem_base] }
}

// ── impressão ─────────────────────────────────────────────────────────────────
function imprimirPlano(plano, produtos, nPombos) {
  const diasComItens = DIAS_SEMANA.filter(d => (plano.itens||[]).some(i=>i.dia_semana===d.key))
  const getProd = id => produtos.find(p=>p.id===id)
  const campos = [
    { key:'agua', label:'Na Água' },
    { key:'racao', label:'Na Ração' },
    { key:'gramas', label:'Ração (g)' },
    { key:'tipo', label:'Tipo Ração' },
    { key:'voo', label:'Voo (min)' },
    { key:'outros', label:'Outros' },
  ]
  const linhas = ['manha','tarde'].flatMap(per => {
    const bg = per==='manha'?'#e8f4fd':'#fdf4e8'
    const lbl = per==='manha'?'MANHÃ':'TARDE'
    return campos.map((campo,ci) => {
      const cells = diasComItens.map(d => {
        const item = (plano.itens||[]).find(i=>i.dia_semana===d.key&&(per==='manha'?i.periodo!=='tarde':i.periodo==='tarde'))
        if (!item) return `<td style="border:1px solid #e2e8f0;padding:6px 8px;color:#ccc;text-align:center;font-size:10px">—</td>`
        const prod = getProd(item.product_id)
        const dose = calcDose(prod, nPombos)
        let val = ''
        if (campo.key==='agua' && prod?.modo==='agua') val = `<b>${prod.nome}</b>${dose?`<br><small style="color:#059669">${dose.linha1} ${dose.linha2}</small>`:''}`
        else if (campo.key==='racao' && prod && prod.modo!=='agua') val = `<b>${prod.nome}</b>${dose?`<br><small style="color:#059669">${dose.linha1} ${dose.linha2}</small>`:''}`
        else if (campo.key==='gramas' && item.racao_g) val = `<b>${item.racao_g}g</b>`
        else if (campo.key==='tipo' && item.tipo_racao) val = item.tipo_racao
        else if (campo.key==='voo' && item.voo_min) val = `<b>${item.voo_min} min</b>`
        else if (campo.key==='outros' && item.outros) val = item.outros
        return `<td style="border:1px solid #e2e8f0;padding:6px 8px;text-align:center;font-size:10px">${val||'<span style=color:#ddd>—</span>'}</td>`
      }).join('')
      return `<tr>${ci===0?`<td rowspan="6" style="border:1px solid #e2e8f0;padding:4px 8px;background:${bg};font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:1px;writing-mode:vertical-rl;text-align:center;width:28px">${lbl}</td>`:''}<td style="border:1px solid #e2e8f0;padding:6px 8px;font-size:10px;font-weight:600;background:#f8fafc;white-space:nowrap">${campo.label}</td>${cells}</tr>`
    })
  })
  const hDias = diasComItens.map(d=>{
    const dn = calcDN(d.key,plano.dia_prova)
    return `<th style="border:1px solid #e2e8f0;padding:8px;font-size:10px;background:#1e3a5f;color:#fff;text-align:center;min-width:100px">${d.full}<br><span style="font-size:9px;opacity:.75;font-weight:400">${dn}</span></th>`
  }).join('')
  const espColor = ESP_COLOR[plano.especialidade]||'#1e3a5f'
  const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${plano.nome}</title>
  <style>*{box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;padding:24px;color:#1e293b;margin:0}h1{font-size:18px;margin:0 0 2px;color:#0f172a}h2{font-size:12px;color:#64748b;margin:0 0 18px;font-weight:400}table{border-collapse:collapse;width:100%}.badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700;color:#fff;background:${espColor}}@media print{.noprint{display:none}}</style>
  </head><body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px">
    <div>
      <h1>🕊️ ${plano.nome}</h1>
      <h2><span class="badge">${ESP_LABEL[plano.especialidade]||plano.especialidade}</span> &nbsp; Prova ao ${DIAS_SEMANA.find(d=>d.key===plano.dia_prova)?.full} &nbsp;·&nbsp; ${nPombos} pombo(s)</h2>
    </div>
    <button class="noprint" onclick="window.print()" style="padding:8px 18px;background:#1e3a5f;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px">🖨️ Imprimir</button>
  </div>
  <table><thead><tr>
    <th style="border:1px solid #e2e8f0;padding:8px;background:#0f172a;color:#fff;font-size:10px;width:28px"></th>
    <th style="border:1px solid #e2e8f0;padding:8px;background:#0f172a;color:#fff;font-size:10px;min-width:90px">Campo</th>
    ${hDias}
  </tr></thead><tbody>${linhas.join('')}</tbody></table>
  ${plano.obs?`<p style="margin-top:14px;font-size:11px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:10px">📝 ${plano.obs}</p>`:''}
  <p style="margin-top:14px;font-size:9px;color:#94a3b8">Gerado por ChampionsLoft · ${new Date().toLocaleDateString('pt-PT')}</p>
  <script>window.onload=()=>setTimeout(()=>window.print(),400)</script></body></html>`
  const w=window.open('','_blank'); w.document.write(html); w.document.close()
}

// ── valores iniciais ──────────────────────────────────────────────────────────
const ITEM_VAZIO = (per='manha') => ({ periodo:per, dia_semana:'quarta', product_id:'', racao_g:'', tipo_racao:'', voo_min:'', outros:'', notas:'' })
const PLANO_VAZIO = { nome:'', especialidade:'velocidade', dia_prova:'domingo', itens:[], obs:'' }
const PROD_VAZIO  = { nome:'', modo:'agua', dosagem_valor:'', dosagem_unidade:'ml', dosagem_base:'litro', categoria:'Suplemento', obs:'' }
const STOCK_VAZIO = { tipo:'Medicamento', nome:'', qtd:'', unidade:'ml', qtd_minima:'', margem_dias:'7', validade:'', preco:'', obs:'' }

// ── estilos partilhados ───────────────────────────────────────────────────────
const S = {
  card: { background:'#0B1830', border:'1px solid #1B2D52', borderRadius:12, padding:'14px 16px' },
  th:   { border:'1px solid #162040', padding:'10px 10px', fontSize:11, fontWeight:700, textAlign:'center', whiteSpace:'nowrap' },
  td:   { border:'1px solid #162040', padding:'6px 8px', fontSize:11, textAlign:'center', verticalAlign:'top', position:'relative' },
  pill: (color) => ({ display:'inline-block', padding:'2px 8px', borderRadius:12, fontSize:10, fontWeight:700, background:`${color}22`, color, border:`1px solid ${color}44` }),
}

// ── componente célula editável inline ─────────────────────────────────────────
function CelulaEditavel({ valor, placeholder, tipo='text', opcoesSelect, onChange, cor }) {
  const [editando, setEditando] = useState(false)
  const [val, setVal] = useState(valor||'')
  const ref = useRef()
  useEffect(()=>{ setVal(valor||'') },[valor])
  useEffect(()=>{ if(editando && ref.current) ref.current.focus() },[editando])

  const confirmar = () => { setEditando(false); if(val!==valor) onChange(val) }
  const s = { background:'transparent', border:'none', borderBottom:'1px solid #4C8DFF', color:'#fff', fontSize:11, width:'100%', padding:'2px 0', outline:'none', fontFamily:'inherit' }

  if (!editando) return (
    <div onClick={()=>setEditando(true)} style={{ cursor:'pointer', minHeight:20, color:val?cor||'#e2e8f0':'#334155', fontSize:11, padding:'1px 2px', borderRadius:4, transition:'background .15s' }}
      onMouseEnter={e=>e.currentTarget.style.background='rgba(76,141,255,.08)'}
      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
      {val || <span style={{ fontSize:10, color:'#334155', fontStyle:'italic' }}>{placeholder||'—'}</span>}
    </div>
  )

  if (opcoesSelect) return (
    <select ref={ref} value={val} onChange={e=>setVal(e.target.value)} onBlur={confirmar} style={{ ...s }}>
      <option value="">—</option>
      {opcoesSelect.map(o => <option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}
    </select>
  )
  return <input ref={ref} type={tipo} value={val} onChange={e=>setVal(e.target.value)} onBlur={confirmar} onKeyDown={e=>{if(e.key==='Enter')confirmar();if(e.key==='Escape'){setVal(valor||'');setEditando(false)}}} style={s} placeholder={placeholder} />
}

// ── tabela de plano (construção e visualização) ────────────────────────────────
function TabelaPlano({ plano, produtos, stock, nPombos, alertasStock, estado, overrides, onToggleDia, onOverride, hojeKey, modoEdicao, onUpdItem, onDelItem }) {
  const getProd = id => produtos.find(p=>p.id===id)
  const diasComItens = DIAS_SEMANA.filter(d=>(plano.itens||[]).some(i=>i.dia_semana===d.key))
  if (diasComItens.length===0) return <div style={{ textAlign:'center', padding:32, color:'#475569', fontSize:13 }}>Sem dias de tratamento. Adicione itens abaixo.</div>

  const campos = [
    { key:'produto', label:'Produto / Dose' },
    { key:'gramas',  label:'Ração (g)' },
    { key:'tipo',    label:'Tipo Ração' },
    { key:'voo',     label:'Voo (min)' },
    { key:'outros',  label:'Outros' },
  ]

  return (
    <div style={{ overflowX:'auto', borderRadius:12, border:'1px solid #162040' }}>
      <table style={{ borderCollapse:'collapse', width:'100%', minWidth: diasComItens.length*130+160 }}>
        <thead>
          <tr>
            <th style={{ ...S.th, background:'#050D1A', color:'#475569', width:36, borderRight:'2px solid #1E5FD9' }}></th>
            <th style={{ ...S.th, background:'#050D1A', color:'#7A8699', textAlign:'left', paddingLeft:12, minWidth:110, borderRight:'2px solid #1E5FD9' }}>Campo</th>
            {diasComItens.map(d => {
              const dn = calcDN(d.key, plano.dia_prova)
              const isHoje = d.key===hojeKey
              const isDiaProva = dn==='Prova'
              return (
                <th key={d.key} style={{ ...S.th, background: isHoje?'rgba(212,175,55,.12)':isDiaProva?'rgba(45,212,167,.08)':'#070F20', color:isHoje?'#D4AF37':isDiaProva?'#2DD4A7':'#94a3b8', minWidth:130, borderLeft:'1px solid #162040' }}>
                  <div>{d.full}{isHoje&&<span style={{ fontSize:9, marginLeft:4, color:'#D4AF37' }}>● HOJE</span>}</div>
                  <div style={{ fontSize:10, marginTop:2, fontWeight:800, letterSpacing:.5, color:isDiaProva?'#2DD4A7':isHoje?'#D4AF37':'#D4AF37', opacity:isDiaProva||isHoje?1:.7 }}>{dn}</div>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {['manha','tarde'].map(per => {
            const isM = per==='manha'
            const perColor = isM?'#F59E0B':'#60A5FA'
            return campos.map((campo, ci) => (
              <tr key={`${per}_${campo.key}`} style={{ background: ci%2===0?'rgba(11,24,48,.6)':'rgba(7,15,32,.4)' }}>
                {/* célula período */}
                {ci===0 && (
                  <td rowSpan={campos.length} style={{ ...S.td, background:isM?'rgba(245,158,11,.06)':'rgba(96,165,250,.06)', borderRight:'2px solid #1E5FD9', padding:0, width:36 }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', minHeight:130 }}>
                      <div style={{ writingMode:'vertical-rl', transform:'rotate(180deg)', fontSize:10, fontWeight:800, color:perColor, letterSpacing:2, textTransform:'uppercase' }}>
                        {isM?'🌅 Manhã':'🌆 Tarde'}
                      </div>
                    </div>
                  </td>
                )}
                {/* label campo */}
                <td style={{ ...S.td, background:'#070F20', textAlign:'left', paddingLeft:12, color:'#7A8699', fontWeight:600, borderRight:'2px solid #1E5FD9', whiteSpace:'nowrap' }}>
                  {campo.label}
                </td>
                {/* células por dia */}
                {diasComItens.map(d => {
                  const item = (plano.itens||[]).find(i=>i.dia_semana===d.key&&(per==='manha'?i.periodo!=='tarde':i.periodo==='tarde'))
                  const realIdx = item ? (plano.itens||[]).indexOf(item) : -1
                  const chave = `${d.key}_${per}`
                  const feito = !!estado?.[chave]
                  const isHoje = d.key===hojeKey
                  // override semanal
                  const ovKey = `${chave}_${campo.key}`
                  const ovVal = overrides?.[ovKey]
                  const temOverride = ovVal !== undefined

                  const prod = item ? getProd(item.product_id) : null
                  const dose = calcDose(prod, nPombos)
                  const stk  = prod ? stock.find(s=>s.nome.toLowerCase()===prod.nome.toLowerCase()) : null
                  const stkBaixo = stk && alertasStock?.some(a=>a.id===stk.id)

                  const tdStyle = {
                    ...S.td,
                    background: feito?'rgba(45,212,167,.05)':isHoje?'rgba(212,175,55,.04)':'transparent',
                    borderLeft:'1px solid #162040',
                    outline: temOverride?'1px solid rgba(167,139,250,.5)':undefined,
                  }

                  if (!item) return <td key={d.key} style={{ ...tdStyle, color:'#1B2D52' }}>—</td>

                  // checkbox no canto (só quando plano aplicado / não modo edição)
                  const checkBox = !modoEdicao && onToggleDia && campo.key==='produto' && (
                    <button onClick={()=>onToggleDia(d.key,per)} style={{ position:'absolute', top:4, right:4, width:18, height:18, borderRadius:4, border:feito?'none':'1px solid #1B2D52', background:feito?'#2DD4A7':'transparent', cursor:'pointer', fontSize:9, display:'flex', alignItems:'center', justifyContent:'center', padding:0, zIndex:1 }}>
                      {feito&&'✓'}
                    </button>
                  )

                  // conteúdo da célula
                  let conteudo = null

                  if (modoEdicao) {
                    // MODO EDIÇÃO — célula editável
                    if (campo.key==='produto') {
                      const opProd = produtos.map(p=>({ value:p.id, label:`${MODO_ICON[p.modo]} ${p.nome}` }))
                      conteudo = (
                        <div>
                          <CelulaEditavel
                            valor={item.product_id}
                            opcoesSelect={opProd}
                            onChange={v=>onUpdItem(realIdx,'product_id',v)}
                            cor='#fff'
                            placeholder='— produto —'
                          />
                          {prod && dose && <div style={{ fontSize:10, color:'#2DD4A7', marginTop:3 }}>{dose.linha1}<br/>{dose.linha2}</div>}
                        </div>
                      )
                    } else if (campo.key==='gramas') {
                      conteudo = <CelulaEditavel valor={item.racao_g} tipo='number' placeholder='g' onChange={v=>onUpdItem(realIdx,'racao_g',v)} cor='#fff' />
                    } else if (campo.key==='tipo') {
                      const opRac = RACOES_COMERCIAIS.map(r=>({ value:r, label:r }))
                      conteudo = <CelulaEditavel valor={item.tipo_racao} opcoesSelect={opRac} placeholder='ração' onChange={v=>onUpdItem(realIdx,'tipo_racao',v)} cor='#e2e8f0' />
                    } else if (campo.key==='voo') {
                      conteudo = <CelulaEditavel valor={item.voo_min} tipo='number' placeholder='min' onChange={v=>onUpdItem(realIdx,'voo_min',v)} cor='#60A5FA' />
                    } else if (campo.key==='outros') {
                      conteudo = <CelulaEditavel valor={item.outros} placeholder='banho, narinas…' onChange={v=>onUpdItem(realIdx,'outros',v)} cor='#94a3b8' />
                    }
                  } else {
                    // MODO VISUALIZAÇÃO (com overrides semanais)
                    if (campo.key==='produto') {
                      conteudo = (
                        <div style={{ paddingRight:22 }}>
                          {prod ? <>
                            <div style={{ fontWeight:600, color:feito?'#475569':'#e2e8f0', textDecoration:feito?'line-through':'none', fontSize:11 }}>
                              {MODO_ICON[prod.modo]} {prod.nome}
                            </div>
                            {dose && <div style={{ fontSize:10, color:feito?'#334155':'#2DD4A7', marginTop:2 }}>{dose.linha1}</div>}
                            {dose && <div style={{ fontSize:10, color:feito?'#334155':'#34d399', marginTop:1 }}>{dose.linha2}</div>}
                            {stk && <div style={{ fontSize:10, color:stkBaixo?'#f87171':'#334155', marginTop:3 }}>📦 {stk.qtd}{stk.unidade}{stkBaixo&&' ⚠️'}</div>}
                          </> : <span style={{ color:'#334155', fontSize:10 }}>Produto removido</span>}
                        </div>
                      )
                    } else if (campo.key==='gramas') {
                      const v = ovVal??item.racao_g
                      conteudo = v ? (
                        <div>
                          <span style={{ fontWeight:600, color:'#e2e8f0' }}>{v}g</span>
                          {temOverride && campo.key==='gramas' && <span title="Ajuste semanal" style={{ marginLeft:4, fontSize:9, color:'#A78BFA' }}>✱</span>}
                        </div>
                      ) : null
                    } else if (campo.key==='tipo') {
                      const v = ovVal??item.tipo_racao
                      conteudo = v ? <span style={{ color:'#cbd5e1', fontSize:10 }}>{v}{temOverride&&<span title="Ajuste" style={{ marginLeft:3, fontSize:9, color:'#A78BFA' }}>✱</span>}</span> : null
                    } else if (campo.key==='voo') {
                      const v = ovVal??item.voo_min
                      conteudo = v ? <span style={{ fontWeight:600, color:'#60A5FA' }}>{v} min</span> : null
                    } else if (campo.key==='outros') {
                      const v = ovVal??item.outros
                      conteudo = v ? <span style={{ color:'#94a3b8', fontSize:10 }}>{v}</span> : null
                    }

                    // override semanal — clique longo/ícone de ajuste
                    if (onOverride && !modoEdicao && campo.key!=='produto') {
                      const valAtual = ovVal ?? (campo.key==='gramas'?item.racao_g:campo.key==='tipo'?item.tipo_racao:campo.key==='voo'?item.voo_min:item.outros) ?? ''
                      conteudo = (
                        <div style={{ position:'relative' }}>
                          {conteudo}
                          <button onClick={()=>onOverride(ovKey, valAtual, campo)} style={{ position:'absolute', bottom:0, right:0, background:'none', border:'none', cursor:'pointer', fontSize:9, color:temOverride?'#A78BFA':'#1B2D52', padding:0 }} title={temOverride?'Ajuste semanal ativo — clique para editar':'Ajustar para esta semana'}>
                            ✱
                          </button>
                        </div>
                      )
                    }
                  }

                  return (
                    <td key={d.key} style={tdStyle}>
                      {checkBox}
                      {temOverride && campo.key==='produto' && <span style={{ position:'absolute', top:3, left:3, fontSize:9, color:'#A78BFA' }} title="Campo ajustado esta semana">✱</span>}
                      {conteudo || <span style={{ color:'#1B2D52', fontSize:10 }}>—</span>}
                    </td>
                  )
                })}
              </tr>
            ))
          })}
        </tbody>
      </table>
      {!modoEdicao && overrides && Object.keys(overrides).length>0 && (
        <div style={{ padding:'8px 14px', background:'rgba(167,139,250,.06)', borderTop:'1px solid #162040', fontSize:11, color:'#A78BFA', display:'flex', alignItems:'center', gap:6 }}>
          <span>✱</span><span>Células com ajuste semanal (afetam apenas esta semana, não o plano base)</span>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function Alimentacao({ nav }) {
  const toast = useToast()
  const { t } = useIdioma()

  const [stock, setStock]           = useState([])
  const [planos, setPlanos]         = useState([])
  const [aplicacoes, setAplicacoes] = useState([])
  const [produtos, setProdutos]     = useState([])
  const [pombos, setPombos]         = useState([])
  const [loading, setLoading]       = useState(true)

  const [tab, setTab]               = useState('hoje')
  const [vistaTabela, setVistaTabela] = useState(true)
  const [modal, setModal]           = useState(null)
  const [selected, setSelected]     = useState(null)
  const [saving, setSaving]         = useState(false)
  const [confirm, setConfirm]       = useState(null)

  // forms
  const [formPlano, setFormPlano]   = useState(PLANO_VAZIO)
  const [vistaPlanoTabela, setVistaPlanoTabela] = useState(false)
  const [formProd, setFormProd]     = useState(PROD_VAZIO)
  const [formStock, setFormStock]   = useState(STOCK_VAZIO)
  const sfp  = (k,v) => setFormPlano(f=>({...f,[k]:v}))
  const sfpr = (k,v) => setFormProd(f=>({...f,[k]:v}))
  const sfs  = (k,v) => setFormStock(f=>({...f,[k]:v}))

  // modal override semanal
  const [modalOverride, setModalOverride] = useState(null) // { ovKey, valor, campo }
  const [overrides, setOverrides]         = useState({})   // { ovKey: valor }

  // modal pombos
  const [modalPombos, setModalPombos]   = useState(false)
  const [pombosSel, setPombosSel]       = useState([])
  const [savingPombos, setSavingPombos] = useState(false)

  // modal aplicar
  const [modalAplicar, setModalAplicar]         = useState(false)
  const [planoParaAplicar, setPlanoParaAplicar] = useState(null)
  const [pombosAplicar, setPombosAplicar]       = useState([])
  const [savingAplicar, setSavingAplicar]       = useState(false)

  // calculadora
  const [calcPombos, setCalcPombos] = useState('20')
  const [calcG, setCalcG]           = useState('35')
  const [calcDias, setCalcDias]     = useState('7')
  const [filtroTipo, setFiltroTipo] = useState('todos')

  // ── load ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [s,pl,ap,pr,pb] = await Promise.all([
        db.getStock(), db.getTreatmentPlans(), db.getTreatmentApplications(),
        db.getTreatmentProducts(), db.getPombos(),
      ])
      setStock(s); setPlanos(pl); setAplicacoes(ap); setProdutos(pr); setPombos(pb)
    } catch(e) { toast('Erro: '+e.message,'err') }
    finally { setLoading(false) }
  }, [])
  useEffect(()=>{ load() },[load])

  // ── computed ──────────────────────────────────────────────────────────────
  const semanaAtual    = segundaFeira()
  const aplicacaoAtiva = aplicacoes.find(a=>a.semana_inicio===semanaAtual)
  const planoAtivo     = aplicacaoAtiva ? planos.find(p=>p.id===aplicacaoAtiva.plan_id) : null
  const getProd        = id => produtos.find(p=>p.id===id)
  const efectivo       = pombos.filter(p=>(!p.estado_ext||p.estado_ext==='proprio')&&p.estado==='ativo')
  const nPombos        = aplicacaoAtiva?.pombos_ids?.length||aplicacaoAtiva?.n_pombos||0
  const hojeKey        = diaHojeKey()

  const G_DIA = 35
  const consumoDiarioKg = (efectivo.length*G_DIA)/1000
  const alertasStock = stock.filter(s=>{
    if(!s.qtd_minima) return false
    const m = parseFloat(s.margem_dias||7)
    const extra = ['Cereal','Ração Comercial'].includes(s.tipo)?consumoDiarioKg*m:0
    return s.qtd<=parseFloat(s.qtd_minima)+extra
  })
  const validadeProxima = stock.filter(s=>s.validade&&(new Date(s.validade)-new Date())/86400000<=30)

  function diasParaEsgotar(item) {
    if(!['Cereal','Ração Comercial'].includes(item.tipo)||consumoDiarioKg<=0) return null
    const kg=item.unidade==='g'?item.qtd/1000:item.unidade==='kg'?item.qtd:null
    return kg===null?null:Math.floor(kg/consumoDiarioKg)
  }

  const itensDia = (dia,per) => (planoAtivo?.itens||[]).filter(i=>i.dia_semana===dia&&(per==='manha'?i.periodo!=='tarde':i.periodo==='tarde'))
  const temHoje = itensDia(hojeKey,'manha').length>0||itensDia(hojeKey,'tarde').length>0

  const toggleDia = async (diaKey,per) => {
    if(!aplicacaoAtiva) return
    const chave=`${diaKey}_${per}`
    try {
      const novo={...aplicacaoAtiva.estado_dias,[chave]:!aplicacaoAtiva.estado_dias?.[chave]}
      await db.updateTreatmentApplication(aplicacaoAtiva.id,{estado_dias:novo}); load()
    } catch(e){toast('Erro','err')}
  }

  // ── override semanal ──────────────────────────────────────────────────────
  const abrirOverride = (ovKey, valAtual, campo) => setModalOverride({ ovKey, valor:valAtual, campo })
  const guardarOverride = async (ovKey, novoVal) => {
    const novosOverrides = { ...overrides }
    if (novoVal==='' || novoVal===null) delete novosOverrides[ovKey]
    else novosOverrides[ovKey] = novoVal
    setOverrides(novosOverrides)
    // persistir no estado da aplicação
    if (aplicacaoAtiva) {
      try { await db.updateTreatmentApplication(aplicacaoAtiva.id,{overrides_semana:novosOverrides}) }
      catch(e){toast('Erro ao guardar ajuste','err')}
    }
    setModalOverride(null)
    toast('Ajuste semanal guardado!','ok')
  }

  const guardarPlanoComOverrides = async () => {
    if (!planoAtivo || Object.keys(overrides).length===0) return
    // criar novo plano com os overrides aplicados
    const novosItens = (planoAtivo.itens||[]).map(item => {
      const per = item.periodo==='tarde'?'tarde':'manha'
      const nova = { ...item }
      const chave = `${item.dia_semana}_${per}`
      const ovGramas = overrides[`${chave}_gramas`]; if(ovGramas!==undefined) nova.racao_g = ovGramas
      const ovTipo   = overrides[`${chave}_tipo`];   if(ovTipo!==undefined) nova.tipo_racao = ovTipo
      const ovVoo    = overrides[`${chave}_voo`];    if(ovVoo!==undefined) nova.voo_min = ovVoo
      const ovOutros = overrides[`${chave}_outros`]; if(ovOutros!==undefined) nova.outros = ovOutros
      return nova
    })
    const novoNome = `${planoAtivo.nome} (variante ${new Date().toLocaleDateString('pt-PT')})`
    try {
      await db.createTreatmentPlan({ nome:novoNome, especialidade:planoAtivo.especialidade, dia_prova:planoAtivo.dia_prova, itens:novosItens, obs:planoAtivo.obs })
      toast(`Guardado como "${novoNome}"!`,'ok'); load()
    } catch(e){toast('Erro: '+e.message,'err')}
  }

  // carregar overrides da aplicação ativa
  useEffect(()=>{
    if(aplicacaoAtiva?.overrides_semana) setOverrides(aplicacaoAtiva.overrides_semana)
    else setOverrides({})
  },[aplicacaoAtiva?.id])

  // ── plano CRUD ────────────────────────────────────────────────────────────
  const openNewPlano  = () => { setFormPlano(PLANO_VAZIO); setSelected(null); setModal('plano') }
  const openEditPlano = p  => { setSelected(p); setFormPlano({ nome:p.nome, especialidade:p.especialidade||'geral', dia_prova:p.dia_prova||'domingo', itens:JSON.parse(JSON.stringify(p.itens||[])), obs:p.obs||'' }); setModal('plano') }

  const addItem = per => setFormPlano(f=>({...f, itens:[...f.itens,ITEM_VAZIO(per)]}))
  const updItem = (i,k,v) => setFormPlano(f=>({...f, itens:f.itens.map((it,idx)=>idx===i?{...it,[k]:v}:it)}))
  const delItem = i => setFormPlano(f=>({...f, itens:f.itens.filter((_,idx)=>idx!==i)}))

  const savePlano = async () => {
    if(!formPlano.nome.trim()){toast('Nome obrigatório','warn');return}
    setSaving(true)
    try {
      const payload={nome:formPlano.nome.trim(),especialidade:formPlano.especialidade,dia_prova:formPlano.dia_prova,itens:formPlano.itens,obs:formPlano.obs}
      selected?await db.updateTreatmentPlan(selected.id,payload):await db.createTreatmentPlan(payload)
      toast(selected?'Plano actualizado!':'Plano criado!','ok'); setModal(null); setSelected(null); load()
    } catch(e){toast('Erro: '+e.message,'err')}
    finally{setSaving(false)}
  }
  const delPlano = async () => {
    try{await db.deleteTreatmentPlan(confirm.item.id);toast('Eliminado','ok');setConfirm(null);load()}
    catch(e){toast('Erro','err')}
  }

  // ── produto CRUD ──────────────────────────────────────────────────────────
  const openNewProd  = () => { setFormProd(PROD_VAZIO); setSelected(null); setModal('produto') }
  const openEditProd = p  => { setSelected(p); setFormProd({nome:p.nome,modo:p.modo,dosagem_valor:p.dosagem_valor||'',dosagem_unidade:p.dosagem_unidade||'ml',dosagem_base:p.dosagem_base||'litro',categoria:p.categoria||'Suplemento',obs:p.obs||''}); setModal('produto') }
  const saveProd = async () => {
    if(!formProd.nome.trim()){toast('Nome obrigatório','warn');return}
    setSaving(true)
    try {
      const payload={nome:formProd.nome.trim(),modo:formProd.modo,dosagem_valor:parseFloat(formProd.dosagem_valor)||null,dosagem_unidade:formProd.dosagem_unidade,dosagem_base:formProd.dosagem_base,categoria:formProd.categoria,obs:formProd.obs}
      selected?await db.updateTreatmentProduct(selected.id,payload):await db.createTreatmentProduct(payload)
      toast(selected?'Actualizado!':'Criado!','ok'); setModal(null); setSelected(null); load()
    } catch(e){toast('Erro: '+e.message,'err')}
    finally{setSaving(false)}
  }
  const delProd = async () => {
    try{await db.deleteTreatmentProduct(confirm.item.id);toast('Eliminado','ok');setConfirm(null);load()}
    catch(e){toast('Erro','err')}
  }

  // ── stock CRUD ────────────────────────────────────────────────────────────
  const openNewStock  = () => { setFormStock(STOCK_VAZIO); setSelected(null); setModal('stock') }
  const openEditStock = s  => { setSelected(s); setFormStock({tipo:s.tipo||'Medicamento',nome:s.nome||'',qtd:String(s.qtd||''),unidade:s.unidade||'ml',qtd_minima:String(s.qtd_minima||''),margem_dias:String(s.margem_dias||7),validade:s.validade||'',preco:String(s.preco||''),obs:s.obs||''}); setModal('stock') }
  const saveStock = async () => {
    if(!formStock.nome.trim()||!formStock.qtd){toast('Nome e quantidade obrigatórios','warn');return}
    setSaving(true)
    try {
      const payload={tipo:formStock.tipo,nome:formStock.nome.trim(),qtd:parseFloat(formStock.qtd),unidade:formStock.unidade,qtd_minima:formStock.qtd_minima?parseFloat(formStock.qtd_minima):null,margem_dias:formStock.margem_dias?parseInt(formStock.margem_dias):7,validade:formStock.validade||null,preco:formStock.preco?parseFloat(formStock.preco):null,obs:formStock.obs}
      selected?await db.updateStockItem(selected.id,payload):await db.createStockItem(payload)
      toast(selected?'Actualizado!':'Adicionado!','ok'); setModal(null); setSelected(null); load()
    } catch(e){toast('Erro: '+e.message,'err')}
    finally{setSaving(false)}
  }
  const delStock = async () => {
    try{await db.deleteStockItem(confirm.item.id);toast('Eliminado','ok');setConfirm(null);load()}
    catch(e){toast('Erro','err')}
  }
  const ajustarQtd = async (item,delta) => {
    try{await db.updateStockItem(item.id,{qtd:Math.max(0,item.qtd+delta)});load()}
    catch(e){toast('Erro','err')}
  }

  // ── aplicar plano ─────────────────────────────────────────────────────────
  const abrirAplicar = (plano) => {
    setPlanoParaAplicar(plano)
    const sug=plano.especialidade&&plano.especialidade!=='geral'
      ?efectivo.filter(p=>(p.esp||[]).includes(plano.especialidade)).map(p=>p.id)
      :efectivo.map(p=>p.id)
    setPombosAplicar(sug); setModalAplicar(true)
  }
  const confirmarAplicar = async () => {
    if(pombosAplicar.length===0){toast('Seleccione pombos','warn');return}
    setSavingAplicar(true)
    try {
      await db.createTreatmentApplication({plan_id:planoParaAplicar.id,semana_inicio:semanaAtual,pombos_ids:pombosAplicar,n_pombos:pombosAplicar.length,estado_dias:{},overrides_semana:{}})
      toast('Plano aplicado!','ok'); setModalAplicar(false); load()
    } catch(e){toast('Erro: '+e.message,'err')}
    finally{setSavingAplicar(false)}
  }
  const encerrarAplicacao = async () => {
    try{await db.deleteTreatmentApplication(aplicacaoAtiva.id);toast('Plano removido','ok');setOverrides({});load()}
    catch(e){toast('Erro','err')}
  }

  // pombos do plano ativo
  const abrirEditarPombos = () => { setPombosSel(aplicacaoAtiva?.pombos_ids||[]); setModalPombos(true) }
  const salvarPombos = async () => {
    if(pombosSel.length===0){toast('Seleccione pombos','warn');return}
    setSavingPombos(true)
    try {
      await db.updateTreatmentApplication(aplicacaoAtiva.id,{pombos_ids:pombosSel,n_pombos:pombosSel.length})
      toast('Pombos actualizados!','ok'); setModalPombos(false); load()
    } catch(e){toast('Erro','err')}
    finally{setSavingPombos(false)}
  }
  const toggleSel = (id,setter) => setter(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id])

  // avisos stock ao aplicar
  const avisosStock = (() => {
    if(!planoParaAplicar) return []
    const n=pombosAplicar.length,av=[]
    planoParaAplicar.itens.forEach(it=>{
      const prod=getProd(it.product_id)
      if(!prod?.dosagem_valor) return
      const stk=stock.find(s=>s.nome.toLowerCase()===prod.nome.toLowerCase())
      if(!stk) return
      const nec=prod.dosagem_base==='pombo'?prod.dosagem_valor*n:prod.dosagem_valor
      if(stk.qtd<nec) av.push(`${prod.nome}: precisa ~${nec}${prod.dosagem_unidade||''}, tem ${stk.qtd}${stk.unidade||''}`)
    })
    return av
  })()

  // calculadora
  const consumoCalc=(parseFloat(calcPombos)||0)*(parseFloat(calcG)||0)*(parseFloat(calcDias)||0)/1000
  const stockFiltrado=stock.filter(s=>filtroTipo==='todos'||s.tipo===filtroTipo)

  // ── render lista período ──────────────────────────────────────────────────
  const renderLista = (itens, per) => {
    if(itens.length===0) return null
    const isM=per==='manha'
    return (
      <div style={{ marginBottom:10 }}>
        <div style={{ fontSize:11, fontWeight:700, color:isM?'#F59E0B':'#60A5FA', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>
          {isM?'🌅 Manhã':'🌆 Tarde'}
        </div>
        {itens.map((item,i)=>{
          const chave=`${item.dia_semana}_${per}`
          const feito=!!aplicacaoAtiva?.estado_dias?.[chave]
          const prod=getProd(item.product_id)
          const dose=calcDose(prod,nPombos)
          const stk=prod?stock.find(s=>s.nome.toLowerCase()===prod.nome.toLowerCase()):null
          return (
            <div key={i} style={{ ...S.card, marginBottom:6, borderColor:feito?'rgba(45,212,167,.3)':undefined, padding:'10px 14px' }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                <button onClick={()=>toggleDia(item.dia_semana,per)} style={{ width:22,height:22,borderRadius:6,border:feito?'none':'2px solid #1B2D52',background:feito?'#2DD4A7':'transparent',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0,fontSize:13,marginTop:1 }}>
                  {feito&&'✓'}
                </button>
                <div style={{ flex:1 }}>
                  {prod&&<div style={{ fontSize:13,fontWeight:600,color:feito?'#7A8699':'#fff',textDecoration:feito?'line-through':'none',marginBottom:4 }}>{MODO_ICON[prod.modo]} {prod.nome}</div>}
                  <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                    {dose&&<div style={{ fontSize:12,color:'#2DD4A7' }}>{dose.linha1} {dose.linha2}</div>}
                    {stk&&<div style={{ fontSize:11,color:alertasStock.some(a=>a.id===stk.id)?'#f87171':'#475569' }}>📦 {stk.qtd}{stk.unidade}</div>}
                    <div style={{ display:'flex',flexWrap:'wrap',gap:'2px 12px',fontSize:11,color:'#7A8699' }}>
                      {item.racao_g&&<span>🌾 {item.racao_g}g{item.tipo_racao?` ${item.tipo_racao}`:''}</span>}
                      {item.voo_min&&<span>✈️ {item.voo_min} min</span>}
                      {item.outros&&<span>🛁 {item.outros}</span>}
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

  // ── TABS ──────────────────────────────────────────────────────────────────
  const TABS=[['hoje','☀️ Hoje'],['semana','📋 Semana'],['planos','🗂️ Planos'],['biblioteca','💊 Biblioteca'],['stock','📦 Stock'],['calculadora','🧮 Calc']]
  const btnAdd = () => {
    if(tab==='planos')    return <button className="btn btn-primary" onClick={openNewPlano}>＋ Plano</button>
    if(tab==='biblioteca') return <button className="btn btn-primary" onClick={openNewProd}>＋ Produto</button>
    if(tab==='stock')     return <button className="btn btn-primary" onClick={openNewStock}>＋ Item</button>
    return null
  }

  if(loading) return <div style={{ display:'flex',justifyContent:'center',padding:80 }}><Spinner lg /></div>

  return (
    <div>
      {/* ── header ── */}
      <div className="section-header">
        <div>
          <div className="section-title">Alimentação &amp; Tratamentos</div>
          <div className="section-sub">{planoAtivo?`✅ ${planoAtivo.nome} · ${nPombos} pombos`:'— Sem plano activo esta semana'}</div>
        </div>
        {btnAdd()}
      </div>

      {/* ── alertas ── */}
      {(alertasStock.length>0||validadeProxima.length>0)&&(
        <div style={{ display:'flex',flexDirection:'column',gap:8,marginBottom:16 }}>
          {alertasStock.length>0&&(
            <div style={{ background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.2)',borderRadius:12,padding:'10px 16px',cursor:'pointer' }} onClick={()=>setTab('stock')}>
              <div style={{ fontWeight:600,color:'#f87171',marginBottom:4 }}>⚠️ {alertasStock.length} produto(s) a precisar de reposição</div>
              {alertasStock.map(s=><div key={s.id} style={{ fontSize:11,color:'#cbd5e1' }}>{s.nome} — {s.qtd}{s.unidade}</div>)}
            </div>
          )}
          {validadeProxima.length>0&&(
            <div style={{ background:'rgba(234,179,8,.08)',border:'1px solid rgba(234,179,8,.2)',borderRadius:12,padding:'10px 16px' }}>
              <div style={{ fontWeight:600,color:'#D4AF37',marginBottom:4 }}>📅 {validadeProxima.length} produto(s) a expirar em 30 dias</div>
              {validadeProxima.map(s=><div key={s.id} style={{ fontSize:11,color:'#cbd5e1' }}>{s.nome} — {new Date(s.validade).toLocaleDateString('pt-PT')}</div>)}
            </div>
          )}
        </div>
      )}

      {/* ── tabs ── */}
      <div style={{ display:'flex',gap:4,background:'#101F40',borderRadius:8,padding:4,marginBottom:16,overflowX:'auto' }}>
        {TABS.map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{ flex:1,padding:'8px 10px',borderRadius:6,fontSize:12,fontWeight:500,cursor:'pointer',border:'none',fontFamily:'inherit',whiteSpace:'nowrap',background:tab===k?'#1E5FD9':'none',color:tab===k?'#fff':'#94a3b8' }}>{l}</button>
        ))}
      </div>

      {/* ══ HOJE ══════════════════════════════════════════════════════════════ */}
      {tab==='hoje'&&(
        <div>
          <div style={{ fontSize:12,color:'#94a3b8',marginBottom:12 }}>{new Date().toLocaleDateString('pt-PT',{weekday:'long',day:'numeric',month:'long'})}</div>
          {!planoAtivo?(
            <EmptyState icon="☀️" title="Sem plano activo" desc="Aplique um plano em 'Planos' para ver o que fazer hoje"
              action={<button className="btn btn-primary" onClick={()=>setTab('planos')}>Ver Planos →</button>} />
          ):!temHoje?(
            <div style={{ ...S.card,textAlign:'center',padding:32 }}>
              <div style={{ fontSize:28,marginBottom:8 }}>✅</div>
              <div style={{ color:'#fff',fontWeight:600,marginBottom:4 }}>Dia de descanso!</div>
              <div style={{ fontSize:12,color:'#7A8699' }}>Hoje não há tratamentos no plano {planoAtivo.nome}.</div>
            </div>
          ):(
            <div>
              {/* banner plano */}
              <div style={{ background:`linear-gradient(135deg, rgba(30,95,217,.15), rgba(${ESP_COLOR[planoAtivo.especialidade]||'30,95,217'},.08))`, border:'1px solid rgba(30,95,217,.3)', borderRadius:12, padding:'14px 18px', marginBottom:16 }}>
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8 }}>
                  <div>
                    <div style={{ fontWeight:700,color:'#fff',fontSize:15 }}>{planoAtivo.nome}</div>
                    <div style={{ display:'flex',gap:8,marginTop:4,flexWrap:'wrap' }}>
                      <span style={S.pill(ESP_COLOR[planoAtivo.especialidade]||'#1E5FD9')}>{ESP_LABEL[planoAtivo.especialidade]}</span>
                      <span style={{ fontSize:11,color:'#7A8699' }}>Prova ao {DIAS_SEMANA.find(d=>d.key===planoAtivo.dia_prova)?.full}</span>
                    </div>
                  </div>
                  <div style={{ display:'flex',gap:6 }}>
                    <button className="btn btn-secondary btn-sm" onClick={abrirEditarPombos}>👥 {nPombos} ✏️</button>
                    <button className="btn btn-secondary btn-sm" onClick={()=>imprimirPlano(planoAtivo,produtos,nPombos)}>🖨️</button>
                  </div>
                </div>
              </div>

              {/* resumo doses */}
              {(()=>{
                const todosHoje=[...itensDia(hojeKey,'manha'),...itensDia(hojeKey,'tarde')]
                const prods=[...new Set(todosHoje.map(i=>i.product_id))].map(id=>getProd(id)).filter(Boolean)
                if(prods.length===0) return null
                return (
                  <div style={{ background:'rgba(45,212,167,.06)',border:'1px solid rgba(45,212,167,.2)',borderRadius:12,padding:'12px 16px',marginBottom:16 }}>
                    <div style={{ fontWeight:700,color:'#2DD4A7',marginBottom:10,fontSize:12,textTransform:'uppercase',letterSpacing:.5 }}>💊 Doses de hoje · {nPombos} pombos</div>
                    {prods.map(prod=>{
                      const dose=calcDose(prod,nPombos)
                      const stk=stock.find(s=>s.nome.toLowerCase()===prod.nome.toLowerCase())
                      const insuf=stk&&prod.dosagem_valor&&prod.dosagem_base==='pombo'&&stk.qtd<prod.dosagem_valor*nPombos
                      return (
                        <div key={prod.id} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 0',borderBottom:'1px solid rgba(45,212,167,.1)',fontSize:12 }}>
                          <div>
                            <span style={{ color:'#fff',fontWeight:600 }}>{MODO_ICON[prod.modo]} {prod.nome}</span>
                            <span style={{ color:'#7A8699',marginLeft:8,fontSize:11 }}>{MODO_LABEL[prod.modo]}</span>
                          </div>
                          <div style={{ textAlign:'right' }}>
                            {dose&&<><div style={{ color:'#2DD4A7',fontWeight:700 }}>{dose.linha1}</div><div style={{ color:'#34d399',fontSize:10 }}>{dose.linha2}</div></>}
                            {stk&&<div style={{ fontSize:10,color:insuf?'#f87171':'#475569' }}>📦 {stk.qtd}{stk.unidade}{insuf&&' ⚠️'}</div>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}

              {renderLista(itensDia(hojeKey,'manha'),'manha')}
              {renderLista(itensDia(hojeKey,'tarde'),'tarde')}
            </div>
          )}
        </div>
      )}

      {/* ══ SEMANA ════════════════════════════════════════════════════════════ */}
      {tab==='semana'&&(
        <div>
          {!planoAtivo?(
            planos.length===0?(
              <EmptyState icon="🗂️" title="Sem planos" desc="Crie primeiro um plano"
                action={<button className="btn btn-primary" onClick={()=>setTab('planos')}>Criar Plano →</button>} />
            ):(
              <div>
                <div style={{ fontSize:13,color:'#94a3b8',marginBottom:12 }}>Escolha um plano para aplicar esta semana:</div>
                {planos.map(p=>(
                  <div key={p.id} style={{ ...S.card,marginBottom:8 }}>
                    <div style={{ display:'flex',alignItems:'center',gap:12,flexWrap:'wrap' }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13,fontWeight:600,color:'#fff' }}>{p.nome}</div>
                        <div style={{ fontSize:11,color:'#7A8699' }}><span style={S.pill(ESP_COLOR[p.especialidade]||'#8B5CF6')}>{ESP_LABEL[p.especialidade]}</span> · {(p.itens||[]).length} entradas</div>
                      </div>
                      <button className="btn btn-primary btn-sm" onClick={()=>abrirAplicar(p)}>Aplicar esta semana</button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ):(
            <div>
              {/* banner */}
              <div style={{ background:'linear-gradient(135deg,rgba(30,95,217,.15),rgba(11,24,48,.4))',border:'1px solid rgba(30,95,217,.3)',borderRadius:12,padding:'14px 18px',marginBottom:16 }}>
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8 }}>
                  <div>
                    <div style={{ fontWeight:700,color:'#fff',fontSize:15 }}>{planoAtivo.nome}</div>
                    <div style={{ display:'flex',gap:8,marginTop:4,flexWrap:'wrap',alignItems:'center' }}>
                      <span style={S.pill(ESP_COLOR[planoAtivo.especialidade]||'#1E5FD9')}>{ESP_LABEL[planoAtivo.especialidade]}</span>
                      <span style={{ fontSize:11,color:'#7A8699' }}>semana {new Date(semanaAtual).toLocaleDateString('pt-PT')}</span>
                      {Object.keys(overrides).length>0&&<span style={{ ...S.pill('#A78BFA'), fontSize:10 }}>✱ {Object.keys(overrides).length} ajuste(s)</span>}
                    </div>
                  </div>
                  <div style={{ display:'flex',gap:6,flexWrap:'wrap' }}>
                    <button className="btn btn-secondary btn-sm" onClick={abrirEditarPombos}>👥 {nPombos} ✏️</button>
                    {Object.keys(overrides).length>0&&(
                      <button className="btn btn-secondary btn-sm" style={{ color:'#A78BFA',borderColor:'rgba(167,139,250,.3)' }} onClick={guardarPlanoComOverrides} title="Guardar variante com os ajustes desta semana">💾 Guardar variante</button>
                    )}
                    <button className="btn btn-secondary btn-sm" onClick={()=>imprimirPlano(planoAtivo,produtos,nPombos)}>🖨️</button>
                    <button className="btn btn-secondary btn-sm" onClick={()=>setVistaTabela(v=>!v)}>{vistaTabela?'☰ Lista':'⊞ Tabela'}</button>
                  </div>
                </div>
              </div>

              {vistaTabela?(
                <TabelaPlano
                  plano={planoAtivo} produtos={produtos} stock={stock} nPombos={nPombos}
                  alertasStock={alertasStock} estado={aplicacaoAtiva?.estado_dias}
                  overrides={overrides} onToggleDia={toggleDia} onOverride={abrirOverride}
                  hojeKey={hojeKey} modoEdicao={false}
                />
              ):(
                DIAS_SEMANA.map(({key,full})=>{
                  const iM=itensDia(key,'manha'), iT=itensDia(key,'tarde')
                  if(iM.length===0&&iT.length===0) return null
                  const isHoje=key===hojeKey
                  const dn=calcDN(key,planoAtivo.dia_prova)
                  return (
                    <div key={key} style={{ ...S.card,marginBottom:8,borderColor:isHoje?'rgba(212,175,55,.4)':undefined }}>
                      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10 }}>
                        <div style={{ fontWeight:700,color:isHoje?'#D4AF37':'#fff',fontSize:13 }}>{full}{isHoje&&' ← Hoje'}</div>
                        <div style={{ fontSize:11,color:'#D4AF37',fontWeight:700 }}>{dn}</div>
                      </div>
                      {renderLista(iM,'manha')}
                      {renderLista(iT,'tarde')}
                    </div>
                  )
                })
              )}

              <div style={{ textAlign:'center',marginTop:12 }}>
                <button className="btn btn-secondary btn-sm" onClick={encerrarAplicacao}>Remover plano desta semana</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ PLANOS ════════════════════════════════════════════════════════════ */}
      {tab==='planos'&&(
        planos.length===0
          ?<EmptyState icon="🗂️" title="Sem planos" desc="Construa o primeiro plano de tratamento"
              action={<button className="btn btn-primary" onClick={openNewPlano}>＋ Novo Plano</button>} />
          :<div style={{ display:'flex',flexDirection:'column',gap:10 }}>
              {planos.map(p=>{
                const espC=ESP_COLOR[p.especialidade]||'#8B5CF6'
                const isAtivo=planoAtivo?.id===p.id
                return (
                  <div key={p.id} style={{ ...S.card, borderColor:isAtivo?'rgba(45,212,167,.4)':undefined }}>
                    <div style={{ display:'flex',alignItems:'flex-start',gap:12,flexWrap:'wrap' }}>
                      <div style={{ flex:1,minWidth:160 }}>
                        <div style={{ display:'flex',gap:8,alignItems:'center',marginBottom:4 }}>
                          <div style={{ fontSize:14,fontWeight:700,color:'#fff' }}>{p.nome}</div>
                          {isAtivo&&<Badge v="green">Activo</Badge>}
                        </div>
                        <div style={{ display:'flex',gap:6,flexWrap:'wrap',alignItems:'center' }}>
                          <span style={S.pill(espC)}>{ESP_LABEL[p.especialidade]}</span>
                          <span style={{ fontSize:11,color:'#7A8699' }}>Prova ao {DIAS_SEMANA.find(d=>d.key===p.dia_prova)?.full?.toLowerCase()}</span>
                          <span style={{ fontSize:11,color:'#475569' }}>· {(p.itens||[]).length} entradas</span>
                        </div>
                        {p.obs&&<div style={{ fontSize:11,color:'#475569',marginTop:6,fontStyle:'italic' }}>{p.obs}</div>}
                      </div>
                      <div style={{ display:'flex',gap:6,flexWrap:'wrap' }}>
                        <button className="btn btn-secondary btn-sm" onClick={()=>imprimirPlano(p,produtos,nPombos)}>🖨️</button>
                        {!isAtivo&&<button className="btn btn-primary btn-sm" onClick={()=>abrirAplicar(p)}>▶ Aplicar</button>}
                        <button className="btn btn-secondary btn-sm" onClick={()=>openEditPlano(p)}>✏️ Editar</button>
                        <button className="btn btn-icon btn-sm" onClick={()=>setConfirm({tipo:'plano',item:p})}>🗑️</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
      )}

      {/* ══ BIBLIOTECA ════════════════════════════════════════════════════════ */}
      {tab==='biblioteca'&&(
        produtos.length===0
          ?<EmptyState icon="💊" title="Biblioteca vazia" desc="Adicione produtos — serão reutilizados na construção de planos"
              action={<button className="btn btn-primary" onClick={openNewProd}>＋ Novo Produto</button>} />
          :<div style={{ display:'flex',flexDirection:'column',gap:8 }}>
              {produtos.map(p=>{
                const dose=calcDose(p,nPombos||1)
                const stk=stock.find(s=>s.nome.toLowerCase()===p.nome.toLowerCase())
                return (
                  <div key={p.id} style={S.card}>
                    <div style={{ display:'flex',alignItems:'center',gap:12,flexWrap:'wrap' }}>
                      <div style={{ fontSize:22 }}>{MODO_ICON[p.modo]}</div>
                      <div style={{ flex:1,minWidth:160 }}>
                        <div style={{ fontSize:13,fontWeight:600,color:'#fff' }}>{p.nome}</div>
                        <div style={{ fontSize:11,color:'#7A8699',marginTop:2 }}>{MODO_LABEL[p.modo]}{p.categoria?` · ${p.categoria}`:''}</div>
                        {dose&&<div style={{ fontSize:11,color:'#2DD4A7',marginTop:3 }}>{dose.linha1} {dose.linha2}{nPombos>0?` (${nPombos} pombos)`:''}</div>}
                        {stk&&<div style={{ fontSize:10,color:alertasStock.some(a=>a.id===stk.id)?'#f87171':'#475569',marginTop:2 }}>📦 Stock: {stk.qtd}{stk.unidade}</div>}
                      </div>
                      <button className="btn btn-secondary btn-sm" onClick={()=>openEditProd(p)}>✏️</button>
                      <button className="btn btn-icon btn-sm" onClick={()=>setConfirm({tipo:'produto',item:p})}>🗑️</button>
                    </div>
                  </div>
                )
              })}
            </div>
      )}

      {/* ══ STOCK ════════════════════════════════════════════════════════════ */}
      {tab==='stock'&&(
        <div>
          <div style={{ display:'flex',gap:6,flexWrap:'wrap',marginBottom:12 }}>
            {['todos',...TIPOS_STOCK].map(tp=>(
              <button key={tp} onClick={()=>setFiltroTipo(tp)} className={`chip${filtroTipo===tp?' active':''}`}>{tp==='todos'?'Todos':tp}</button>
            ))}
          </div>
          {stockFiltrado.length===0
            ?<EmptyState icon="📦" title="Sem itens" desc="Adicione cereais, rações e medicamentos"
                action={<button className="btn btn-primary" onClick={openNewStock}>＋ Novo Item</button>} />
            :<div className="grid-2">
                {stockFiltrado.map(s=>{
                  const icon=s.tipo==='Cereal'?'🌾':s.tipo==='Ração Comercial'?'🥫':s.tipo==='Medicamento'?'💊':s.tipo==='Suplemento'?'🧪':'📦'
                  const baixo=alertasStock.some(a=>a.id===s.id)
                  const dias=diasParaEsgotar(s)
                  return (
                    <div key={s.id} style={{ ...S.card,borderColor:baixo?'rgba(248,113,113,.3)':undefined }}>
                      <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:10 }}>
                        <div style={{ fontSize:22 }}>{icon}</div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:13,fontWeight:600,color:'#fff' }}>{s.nome}</div>
                          <div style={{ fontSize:11,color:'#7A8699' }}>{s.tipo}</div>
                        </div>
                        <button className="btn btn-icon btn-sm" onClick={()=>openEditStock(s)}>✏️</button>
                        <button className="btn btn-icon btn-sm" onClick={()=>setConfirm({tipo:'stock',item:s})}>🗑️</button>
                      </div>
                      <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:8 }}>
                        <button className="btn btn-icon btn-sm" onClick={()=>ajustarQtd(s,-1)}>−</button>
                        <div style={{ flex:1,textAlign:'center',fontFamily:"'Fraunces',serif",fontSize:24,fontWeight:700,color:baixo?'#f87171':'#fff' }}>{s.qtd}<span style={{ fontSize:14,color:'#7A8699' }}>{s.unidade}</span></div>
                        <button className="btn btn-icon btn-sm" onClick={()=>ajustarQtd(s,1)}>＋</button>
                      </div>
                      {s.qtd_minima&&<div className="progress"><div className="progress-bar" style={{ width:`${Math.min(100,(s.qtd/(s.qtd_minima*3))*100)}%`,background:baixo?'#f87171':'#2DD4A7' }} /></div>}
                      {dias!==null&&<div style={{ fontSize:11,color:dias<=5?'#f87171':dias<=14?'#D4AF37':'#7A8699',marginTop:6,fontWeight:dias<=14?600:400 }}>⏳ Esgota em ~{dias} dia{dias!==1?'s':''}</div>}
                      {s.margem_dias&&s.qtd_minima&&<div style={{ fontSize:10,color:'#475569',marginTop:2 }}>🔔 Alerta {s.margem_dias}d de antecedência</div>}
                      {s.validade&&<div style={{ fontSize:11,color:'#7A8699',marginTop:2 }}>📅 Válido até {new Date(s.validade).toLocaleDateString('pt-PT')}</div>}
                      {s.preco&&<div style={{ fontSize:11,color:'#D4AF37',marginTop:2 }}>💶 {s.preco}€</div>}
                    </div>
                  )
                })}
              </div>
          }
        </div>
      )}

      {/* ══ CALCULADORA ══════════════════════════════════════════════════════ */}
      {tab==='calculadora'&&(
        <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
          <div style={S.card}>
            <div style={{ fontWeight:700,color:'#fff',marginBottom:16 }}>🧮 Consumo de Ração</div>
            <div className="form-grid">
              <Field label="Nº de Pombos"><input className="input" type="number" value={calcPombos} onChange={e=>setCalcPombos(e.target.value)} /></Field>
              <Field label="Gramas/pombo/dia"><input className="input" type="number" value={calcG} onChange={e=>setCalcG(e.target.value)} /></Field>
              <div className="col-2"><Field label="Período (dias)"><input className="input" type="number" value={calcDias} onChange={e=>setCalcDias(e.target.value)} /></Field></div>
            </div>
            <button className="btn btn-secondary btn-sm" style={{ marginBottom:16 }} onClick={()=>setCalcPombos(String(efectivo.length))}>Usar efectivo activo ({efectivo.length})</button>
            <div style={{ background:'#050D1A',borderRadius:12,padding:20,textAlign:'center' }}>
              <div style={{ fontFamily:"'Fraunces',serif",fontSize:40,fontWeight:700,color:'#2DD4A7' }}>{consumoCalc.toFixed(1)} kg</div>
              <div style={{ fontSize:12,color:'#7A8699',marginTop:4 }}>Consumo total estimado</div>
            </div>
            <div style={{ marginTop:12,fontSize:12,color:'#94a3b8' }}>
              Repouso/Muda: 25-30g · Pré-competição: 30-35g · Competição: 35-45g · Reprodução: 40-50g
            </div>
          </div>
          {planoAtivo&&produtos.length>0&&(
            <div style={S.card}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12 }}>
                <div style={{ fontWeight:700,color:'#fff' }}>💊 Doses — {planoAtivo.nome}</div>
                <button className="btn btn-secondary btn-sm" onClick={abrirEditarPombos}>👥 {nPombos} ✏️</button>
              </div>
              {[...new Set((planoAtivo.itens||[]).map(i=>i.product_id))].map(pid=>{
                const prod=getProd(pid)
                if(!prod) return null
                const dose=calcDose(prod,nPombos)
                const stk=stock.find(s=>s.nome.toLowerCase()===prod.nome.toLowerCase())
                const insuf=stk&&prod.dosagem_valor&&prod.dosagem_base==='pombo'&&stk.qtd<prod.dosagem_valor*nPombos
                return (
                  <div key={pid} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid #162040',fontSize:12 }}>
                    <div>
                      <div style={{ color:'#e2e8f0',fontWeight:600 }}>{MODO_ICON[prod.modo]} {prod.nome}</div>
                      <div style={{ color:'#7A8699',fontSize:11 }}>{MODO_LABEL[prod.modo]}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      {dose&&<><div style={{ color:'#2DD4A7',fontWeight:700 }}>{dose.linha1}</div><div style={{ color:'#34d399',fontSize:10 }}>{dose.linha2}</div></>}
                      {stk&&<div style={{ fontSize:10,color:insuf?'#f87171':'#475569' }}>📦 {stk.qtd}{stk.unidade}{insuf&&' ⚠️'}</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ══ MODAL PLANO ══════════════════════════════════════════════════════ */}
      <Modal open={modal==='plano'} onClose={()=>{setModal(null);setSelected(null)}}
        title={selected?`✏️ Editar — ${selected.nome}`:'🗂️ Novo Plano de Tratamento'} wide
        footer={<><button className="btn btn-secondary" onClick={()=>{setModal(null);setSelected(null)}}>Cancelar</button><button className="btn btn-primary" onClick={savePlano} disabled={saving}>{saving?<Spinner/>:null}{selected?'Guardar alterações':'Criar Plano'}</button></>}>

        {/* metadados */}
        <div style={{ display:'flex',gap:8,marginBottom:16,flexWrap:'wrap' }}>
          <div style={{ flex:2,minWidth:180 }}>
            <div style={{ fontSize:11,color:'#7A8699',marginBottom:4 }}>Nome do Plano *</div>
            <input className="input" placeholder="Ex: Velocidade — Semana de Prova" value={formPlano.nome} onChange={e=>sfp('nome',e.target.value)} />
          </div>
          <div style={{ flex:1,minWidth:120 }}>
            <div style={{ fontSize:11,color:'#7A8699',marginBottom:4 }}>Especialidade</div>
            <select className="input" value={formPlano.especialidade} onChange={e=>sfp('especialidade',e.target.value)}>
              {ESPECIALIDADES.map(e=><option key={e} value={e}>{ESP_LABEL[e]}</option>)}
            </select>
          </div>
          <div style={{ flex:1,minWidth:120 }}>
            <div style={{ fontSize:11,color:'#7A8699',marginBottom:4 }}>Dia de Prova</div>
            <select className="input" value={formPlano.dia_prova} onChange={e=>sfp('dia_prova',e.target.value)}>
              {DIAS_SEMANA.map(d=><option key={d.key} value={d.key}>{d.full}</option>)}
            </select>
          </div>
        </div>

        {/* toggle vista */}
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12 }}>
          <div style={{ fontSize:12,color:'#94a3b8' }}>
            {formPlano.itens.length} entr{formPlano.itens.length===1?'ada':'adas'} · {[...new Set(formPlano.itens.map(i=>i.dia_semana))].length} dia(s)
          </div>
          <div style={{ display:'flex',gap:6 }}>
            {produtos.length===0&&<span style={{ fontSize:11,color:'#f87171' }}>⚠️ Biblioteca vazia</span>}
            <button className="btn btn-secondary btn-sm" onClick={()=>setVistaPlanoTabela(v=>!v)}>{vistaPlanoTabela?'☰ Lista':'⊞ Tabela'}</button>
          </div>
        </div>

        {/* vista tabela na construção */}
        {vistaPlanoTabela&&formPlano.itens.length>0&&(
          <div style={{ marginBottom:16 }}>
            <TabelaPlano
              plano={formPlano} produtos={produtos} stock={stock} nPombos={0}
              alertasStock={[]} modoEdicao={true}
              onUpdItem={updItem} onDelItem={delItem}
            />
          </div>
        )}

        {/* vista lista (manhã / tarde) */}
        {!vistaPlanoTabela&&['manha','tarde'].map(per=>(
          <div key={per} style={{ marginBottom:16 }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8 }}>
              <div style={{ fontSize:13,fontWeight:700,color:per==='manha'?'#F59E0B':'#60A5FA' }}>{per==='manha'?'🌅 Manhã':'🌆 Tarde'}</div>
              <button className="btn btn-secondary btn-sm" onClick={()=>addItem(per)} disabled={produtos.length===0}>＋ Adicionar dia</button>
            </div>
            {formPlano.itens.filter(i=>per==='manha'?i.periodo!=='tarde':i.periodo==='tarde').map(item=>{
              const realIdx=formPlano.itens.indexOf(item)
              return <ItemPlanoRow key={realIdx} item={item} idx={realIdx} produtos={produtos} plano={formPlano} updItem={updItem} delItem={delItem} racoes={RACOES_COMERCIAIS} />
            })}
            {formPlano.itens.filter(i=>per==='manha'?i.periodo!=='tarde':i.periodo==='tarde').length===0&&(
              <button className="btn btn-secondary btn-sm" style={{ width:'100%',color:'#475569',borderStyle:'dashed' }} onClick={()=>addItem(per)}>＋ Adicionar {per==='manha'?'manhã':'tarde'}</button>
            )}
          </div>
        ))}

        {/* botão adicionar quando tabela */}
        {vistaPlanoTabela&&(
          <div style={{ display:'flex',gap:8,marginBottom:16 }}>
            <button className="btn btn-secondary btn-sm" onClick={()=>addItem('manha')} disabled={produtos.length===0}>＋ Manhã</button>
            <button className="btn btn-secondary btn-sm" onClick={()=>addItem('tarde')} disabled={produtos.length===0}>＋ Tarde</button>
          </div>
        )}

        {produtos.length===0&&(
          <div style={{ background:'rgba(212,175,55,.08)',border:'1px solid rgba(212,175,55,.2)',borderRadius:8,padding:'10px 14px',fontSize:12,color:'#D4AF37',marginBottom:16 }}>
            💊 Biblioteca de produtos vazia — vá a "Biblioteca" e crie produtos primeiro.
          </div>
        )}

        <Field label="Observações Gerais"><textarea className="input" rows={2} style={{ resize:'none' }} value={formPlano.obs} onChange={e=>sfp('obs',e.target.value)} /></Field>
      </Modal>

      {/* ══ MODAL PRODUTO ════════════════════════════════════════════════════ */}
      <Modal open={modal==='produto'} onClose={()=>{setModal(null);setSelected(null)}}
        title={selected?`✏️ ${selected.nome}`:'💊 Novo Produto'}
        footer={<><button className="btn btn-secondary" onClick={()=>{setModal(null);setSelected(null)}}>Cancelar</button><button className="btn btn-primary" onClick={saveProd} disabled={saving}>{saving?<Spinner/>:null}{selected?'Guardar':'Criar'}</button></>}>
        <Field label="Nome *">
          <select className="input" value={formProd.nome} onChange={e=>sfpr('nome',e.target.value)} style={{ marginBottom:6 }}>
            <option value="">— Sugestões —</option>
            {MEDICAMENTOS_LISTA.map(m=><option key={m}>{m}</option>)}
          </select>
          <input className="input" placeholder="Ou escreva o nome" value={formProd.nome} onChange={e=>sfpr('nome',e.target.value)} />
        </Field>
        <div style={{ fontSize:11,color:'#7A8699',margin:'4px 0 12px' }}>💡 Nome igual ao do Stock → verificação automática de quantidade.</div>
        <Field label="Modo de Administração">
          <select className="input" value={formProd.modo} onChange={e=>sfpr('modo',e.target.value)}>
            <option value="agua">💧 Na água</option>
            <option value="racao">🌾 Na ração</option>
            <option value="direto">💊 Direto ao pombo</option>
            <option value="outros">🛁 Outros (banho, narinas…)</option>
          </select>
        </Field>
        <div className="form-grid">
          <Field label="Dosagem"><input className="input" type="number" step="0.1" placeholder="Ex: 15" value={formProd.dosagem_valor} onChange={e=>sfpr('dosagem_valor',e.target.value)} /></Field>
          <Field label="Unidade"><input className="input" placeholder="ml, g…" value={formProd.dosagem_unidade} onChange={e=>sfpr('dosagem_unidade',e.target.value)} /></Field>
          <Field label="Por">
            <select className="input" value={formProd.dosagem_base} onChange={e=>sfpr('dosagem_base',e.target.value)}>
              <option value="pombo">Pombo</option>
              <option value="litro">Litro de água</option>
              <option value="kg">Kg de ração</option>
            </select>
          </Field>
          <Field label="Categoria">
            <select className="input" value={formProd.categoria} onChange={e=>sfpr('categoria',e.target.value)}>
              {['Vitamina','Suplemento','Probiótico','Antibiótico','Antiparasitário','Antifúngico','Energético','Outro'].map(c=><option key={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Observações"><textarea className="input" rows={2} style={{ resize:'none' }} value={formProd.obs} onChange={e=>sfpr('obs',e.target.value)} /></Field>
      </Modal>

      {/* ══ MODAL STOCK ══════════════════════════════════════════════════════ */}
      <Modal open={modal==='stock'} onClose={()=>{setModal(null);setSelected(null)}}
        title={selected?`✏️ ${selected.nome}`:'📦 Novo Item de Stock'}
        footer={<><button className="btn btn-secondary" onClick={()=>{setModal(null);setSelected(null)}}>Cancelar</button><button className="btn btn-primary" onClick={saveStock} disabled={saving}>{saving?<Spinner/>:null}{selected?'Guardar':'Adicionar'}</button></>}>
        <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
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
            <Field label="Stock Mínimo"><input className="input" type="number" step="0.1" placeholder="Ex: 200" value={formStock.qtd_minima} onChange={e=>sfs('qtd_minima',e.target.value)} /></Field>
            <Field label="Margem (dias)">
              <input className="input" type="number" placeholder="7" value={formStock.margem_dias} onChange={e=>sfs('margem_dias',e.target.value)} />
              <div style={{ fontSize:10,color:'#7A8699',marginTop:2 }}>Avisa N dias antes do mínimo</div>
            </Field>
            <Field label="Validade"><input className="input" type="date" value={formStock.validade} onChange={e=>sfs('validade',e.target.value)} /></Field>
            <Field label="Preço (€)"><input className="input" type="number" step="0.01" value={formStock.preco} onChange={e=>sfs('preco',e.target.value)} /></Field>
          </div>
          <Field label="Observações"><input className="input" value={formStock.obs} onChange={e=>sfs('obs',e.target.value)} /></Field>
        </div>
      </Modal>

      {/* ══ MODAL APLICAR ════════════════════════════════════════════════════ */}
      <Modal open={modalAplicar} onClose={()=>setModalAplicar(false)}
        title={`▶ Aplicar "${planoParaAplicar?.nome}"`} wide
        footer={<><button className="btn btn-secondary" onClick={()=>setModalAplicar(false)}>Cancelar</button><button className="btn btn-primary" onClick={confirmarAplicar} disabled={savingAplicar}>{savingAplicar?<Spinner/>:null}Aplicar a {pombosAplicar.length} pombo(s)</button></>}>
        <div style={{ display:'flex',gap:6,flexWrap:'wrap',marginBottom:12 }}>
          <button className="btn btn-secondary btn-sm" onClick={()=>setPombosAplicar(efectivo.map(p=>p.id))}>Todo o efectivo</button>
          {ESPECIALIDADES.filter(e=>e!=='geral').map(e=><button key={e} className="btn btn-secondary btn-sm" onClick={()=>setPombosAplicar(efectivo.filter(p=>(p.esp||[]).includes(e)).map(p=>p.id))}>{ESP_LABEL[e]}</button>)}
          <button className="btn btn-secondary btn-sm" onClick={()=>setPombosAplicar(efectivo.filter(p=>p.sexo==='M').map(p=>p.id))}>♂ Machos</button>
          <button className="btn btn-secondary btn-sm" onClick={()=>setPombosAplicar(efectivo.filter(p=>p.sexo==='F').map(p=>p.id))}>♀ Fêmeas</button>
          <button className="btn btn-secondary btn-sm" onClick={()=>setPombosAplicar([])}>Limpar</button>
        </div>
        {avisosStock.length>0&&(
          <div style={{ background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.2)',borderRadius:8,padding:'10px 14px',marginBottom:12,fontSize:12,color:'#f87171' }}>
            <div style={{ fontWeight:600,marginBottom:4 }}>⚠️ Stock insuficiente:</div>
            {avisosStock.map((a,i)=><div key={i}>{a}</div>)}
          </div>
        )}
        <div style={{ fontSize:12,color:'#94a3b8',marginBottom:8 }}>{pombosAplicar.length} de {efectivo.length} pombos seleccionados</div>
        <div style={{ display:'flex',flexWrap:'wrap',gap:6,maxHeight:220,overflowY:'auto' }}>
          {efectivo.map(p=>(
            <button key={p.id} type="button" onClick={()=>toggleSel(p.id,setPombosAplicar)}
              className={`chip${pombosAplicar.includes(p.id)?' active':''}`} style={{ fontSize:11 }}>
              {p.emoji} {p.nome}
            </button>
          ))}
        </div>
      </Modal>

      {/* ══ MODAL EDITAR POMBOS ══════════════════════════════════════════════ */}
      <Modal open={modalPombos} onClose={()=>setModalPombos(false)}
        title="👥 Pombos em Tratamento" wide
        footer={<><button className="btn btn-secondary" onClick={()=>setModalPombos(false)}>Cancelar</button><button className="btn btn-primary" onClick={salvarPombos} disabled={savingPombos}>{savingPombos?<Spinner/>:null}Guardar ({pombosSel.length})</button></>}>
        <div style={{ fontSize:12,color:'#94a3b8',marginBottom:12 }}>As doses são recalculadas automaticamente ao guardar.</div>
        <div style={{ display:'flex',gap:6,flexWrap:'wrap',marginBottom:12 }}>
          <button className="btn btn-secondary btn-sm" onClick={()=>setPombosSel(efectivo.map(p=>p.id))}>Todo o efectivo</button>
          {ESPECIALIDADES.filter(e=>e!=='geral').map(e=><button key={e} className="btn btn-secondary btn-sm" onClick={()=>setPombosSel(efectivo.filter(p=>(p.esp||[]).includes(e)).map(p=>p.id))}>{ESP_LABEL[e]}</button>)}
          <button className="btn btn-secondary btn-sm" onClick={()=>setPombosSel(efectivo.filter(p=>p.sexo==='M').map(p=>p.id))}>♂ Machos</button>
          <button className="btn btn-secondary btn-sm" onClick={()=>setPombosSel(efectivo.filter(p=>p.sexo==='F').map(p=>p.id))}>♀ Fêmeas</button>
          <button className="btn btn-secondary btn-sm" onClick={()=>setPombosSel([])}>Limpar</button>
        </div>
        <div style={{ fontSize:12,color:'#94a3b8',marginBottom:8 }}>{pombosSel.length} de {efectivo.length} seleccionados</div>
        <div style={{ display:'flex',flexWrap:'wrap',gap:6,maxHeight:260,overflowY:'auto' }}>
          {efectivo.map(p=>(
            <button key={p.id} type="button" onClick={()=>toggleSel(p.id,setPombosSel)}
              className={`chip${pombosSel.includes(p.id)?' active':''}`} style={{ fontSize:11 }}>
              {p.emoji} {p.nome}
            </button>
          ))}
        </div>
      </Modal>

      {/* ══ MODAL OVERRIDE SEMANAL ═══════════════════════════════════════════ */}
      {modalOverride&&(
        <ModalOverride
          ovKey={modalOverride.ovKey} valorAtual={modalOverride.valor} campo={modalOverride.campo}
          racoes={RACOES_COMERCIAIS}
          onGuardar={guardarOverride} onFechar={()=>setModalOverride(null)}
        />
      )}

      {/* ══ CONFIRM DELETE ═══════════════════════════════════════════════════ */}
      <Modal open={!!confirm} onClose={()=>setConfirm(null)} title="Confirmar eliminação"
        footer={<><button className="btn btn-secondary" onClick={()=>setConfirm(null)}>Cancelar</button><button className="btn btn-danger" onClick={()=>{if(confirm.tipo==='plano')delPlano();else if(confirm.tipo==='produto')delProd();else delStock()}}>Eliminar</button></>}>
        <p style={{ fontSize:14,color:'#cbd5e1' }}>
          {confirm?.tipo==='plano'&&`Eliminar o plano "${confirm.item.nome}"?`}
          {confirm?.tipo==='produto'&&`Eliminar "${confirm.item.nome}"? Planos que o usam serão afectados.`}
          {confirm?.tipo==='stock'&&`Eliminar "${confirm.item.nome}" do stock?`}
        </p>
      </Modal>
    </div>
  )
}

// ── linha de item (modal de plano, vista lista) ───────────────────────────────
function ItemPlanoRow({ item, idx, produtos, plano, updItem, delItem, racoes }) {
  const dn = calcDN(item.dia_semana, plano.dia_prova)
  const getProd = id => produtos.find(p=>p.id===id)
  const prod = getProd(item.product_id)
  return (
    <div style={{ background:'#070F20',border:'1px solid #162040',borderRadius:10,padding:12,marginBottom:8 }}>
      <div style={{ display:'flex',gap:8,marginBottom:8,alignItems:'flex-end' }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:10,color:'#7A8699',marginBottom:4 }}>Dia da Semana</div>
          <select className="input" value={item.dia_semana} onChange={e=>updItem(idx,'dia_semana',e.target.value)}>
            {DIAS_SEMANA.map(d=><option key={d.key} value={d.key}>{d.full}</option>)}
          </select>
        </div>
        <div style={{ flex:'0 0 72px',textAlign:'center' }}>
          <div style={{ fontSize:10,color:'#7A8699',marginBottom:4 }}>Posição</div>
          <div style={{ background:'#050D1A',borderRadius:6,padding:'8px 0',fontSize:12,fontWeight:800,color:'#D4AF37',letterSpacing:.5 }}>{dn}</div>
        </div>
        <button className="btn btn-icon btn-sm" onClick={()=>delItem(idx)} style={{ color:'#f87171' }}>🗑️</button>
      </div>
      <div style={{ marginBottom:8 }}>
        <div style={{ fontSize:10,color:'#7A8699',marginBottom:4 }}>Produto *</div>
        <select className="input" value={item.product_id} onChange={e=>updItem(idx,'product_id',e.target.value)}>
          <option value="">— Escolher da biblioteca —</option>
          {produtos.map(p=><option key={p.id} value={p.id}>{MODO_ICON[p.modo]} {p.nome}{p.dosagem_valor?` · ${p.dosagem_valor}${p.dosagem_unidade}/${p.dosagem_base==='pombo'?'pombo':p.dosagem_base==='litro'?'L':'kg'}`:''}</option>)}
        </select>
        {prod&&<div style={{ fontSize:11,color:'#2DD4A7',marginTop:4 }}>{MODO_LABEL[prod.modo]}{prod.dosagem_valor?` · ${prod.dosagem_valor}${prod.dosagem_unidade} ${BASE_LABEL[prod.dosagem_base]}`:''}</div>}
      </div>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:8 }}>
        <div>
          <div style={{ fontSize:10,color:'#7A8699',marginBottom:4 }}>Ração (g)</div>
          <input className="input" type="number" placeholder="20" value={item.racao_g} onChange={e=>updItem(idx,'racao_g',e.target.value)} />
        </div>
        <div>
          <div style={{ fontSize:10,color:'#7A8699',marginBottom:4 }}>Tipo Ração</div>
          <select className="input" value={item.tipo_racao} onChange={e=>updItem(idx,'tipo_racao',e.target.value)}>
            <option value="">—</option>
            {racoes.map(r=><option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize:10,color:'#7A8699',marginBottom:4 }}>Voo (min)</div>
          <input className="input" type="number" placeholder="35" value={item.voo_min} onChange={e=>updItem(idx,'voo_min',e.target.value)} />
        </div>
      </div>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8 }}>
        <div>
          <div style={{ fontSize:10,color:'#7A8699',marginBottom:4 }}>Outros</div>
          <input className="input" placeholder="banho, narinas…" value={item.outros} onChange={e=>updItem(idx,'outros',e.target.value)} />
        </div>
        <div>
          <div style={{ fontSize:10,color:'#7A8699',marginBottom:4 }}>Notas</div>
          <input className="input" placeholder="Opcional" value={item.notas} onChange={e=>updItem(idx,'notas',e.target.value)} />
        </div>
      </div>
    </div>
  )
}

// ── modal override semanal ────────────────────────────────────────────────────
function ModalOverride({ ovKey, valorAtual, campo, racoes, onGuardar, onFechar }) {
  const [val, setVal] = useState(valorAtual||'')
  return (
    <Modal open={true} onClose={onFechar}
      title={`✱ Ajuste semanal — ${campo.label}`}
      footer={
        <>
          <button className="btn btn-secondary" onClick={()=>onGuardar(ovKey,'')}>Remover ajuste</button>
          <button className="btn btn-secondary" onClick={onFechar}>Cancelar</button>
          <button className="btn btn-primary" onClick={()=>onGuardar(ovKey,val)}>Guardar ajuste</button>
        </>
      }>
      <div style={{ fontSize:12,color:'#94a3b8',marginBottom:12 }}>
        Este ajuste afecta apenas a semana actual. O plano base não é alterado.<br/>
        Pode ser guardado como nova variante de plano depois.
      </div>
      {campo.key==='tipo'?(
        <Field label={campo.label}>
          <select className="input" value={val} onChange={e=>setVal(e.target.value)}>
            <option value="">—</option>
            {racoes.map(r=><option key={r} value={r}>{r}</option>)}
          </select>
        </Field>
      ):(
        <Field label={`${campo.label} (valor actual: ${valorAtual||'—'})`}>
          <input className="input" type={campo.key==='gramas'||campo.key==='voo'?'number':'text'} value={val} onChange={e=>setVal(e.target.value)} placeholder={`Novo valor para ${campo.label.toLowerCase()}`} autoFocus />
        </Field>
      )}
    </Modal>
  )
}
