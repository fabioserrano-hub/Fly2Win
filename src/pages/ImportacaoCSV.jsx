import { useState, useRef } from 'react'
import { db } from '../lib/supabase'
import { useToast, Spinner, Modal } from '../components/ui'

const COLUNAS_PROVAS = ['prova','nome','data','local_solta','distancia','especialidade','lugar','pontos','percentil','tempo','velocidade','obs']
const COLUNAS_POMBOS = ['nome','anilha','sexo','cor','esp','linhagem','pai','mae','provas','percentil','obs']

const parseData = (str) => {
  if (!str) return ''
  // Tentar vários formatos de data
  const limpo = str.trim().replace(/\//g,'-')
  if (/^\d{4}-\d{2}-\d{2}/.test(limpo)) return limpo.slice(0,10)
  if (/^\d{2}-\d{2}-\d{4}/.test(limpo)) {
    const [d,m,a] = limpo.split('-'); return `${a}-${m}-${d}`
  }
  return str.trim()
}

const parseCSV = (text) => {
  const linhas = text.trim().split(/\r?\n/)
  if (linhas.length < 2) return { headers:[], rows:[] }
  const sep = linhas[0].includes(';') ? ';' : ','
  const headers = linhas[0].split(sep).map(h=>h.trim().toLowerCase().replace(/[^a-z0-9_]/g,'_').replace(/_+/g,'_'))
  const rows = linhas.slice(1).map(l => {
    const vals = l.split(sep)
    const obj = {}
    headers.forEach((h,i) => { obj[h] = (vals[i]||'').trim().replace(/^"|"$/g,'') })
    return obj
  }).filter(r => Object.values(r).some(v=>v))
  return { headers, rows }
}

export default function ImportacaoCSV({ nav }) {
  const toast = useToast()
  const inputRef = useRef(null)
  const [tipo, setTipo] = useState('provas')
  const [etapa, setEtapa] = useState('upload') // upload → mapear → previsualizar → importar
  const [ficheiro, setFicheiro] = useState(null)
  const [parsed, setParsed] = useState(null)
  const [mapeamento, setMapeamento] = useState({})
  const [preview, setPreview] = useState([])
  const [importando, setImportando] = useState(false)
  const [resultado, setResultado] = useState(null)

  const colunasAlvo = tipo === 'provas' ? COLUNAS_PROVAS : COLUNAS_POMBOS

  const onFicheiro = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFicheiro(f)
    const reader = new FileReader()
    reader.onload = ev => {
      const { headers, rows } = parseCSV(ev.target.result)
      setParsed({ headers, rows })
      // Auto-mapear colunas com nomes semelhantes
      const auto = {}
      colunasAlvo.forEach(col => {
        const match = headers.find(h => h === col || h.includes(col) || col.includes(h.replace(/_/g,'')))
        if (match) auto[col] = match
      })
      setMapeamento(auto)
      setEtapa('mapear')
    }
    reader.readAsText(f, 'UTF-8')
  }

  const gerarPreview = () => {
    if (!parsed) return
    const rows = parsed.rows.slice(0,5).map(row => {
      const obj = {}
      Object.entries(mapeamento).forEach(([alvo, origem]) => {
        if (origem && row[origem] !== undefined) obj[alvo] = row[origem]
      })
      return obj
    })
    setPreview(rows)
    setEtapa('previsualizar')
  }

  const importar = async () => {
    if (!parsed) return
    setImportando(true)
    let ok = 0, erros = 0
    try {
      for (const row of parsed.rows) {
        const obj = {}
        Object.entries(mapeamento).forEach(([alvo, origem]) => {
          if (origem && row[origem] !== undefined) obj[alvo] = row[origem]
        })
        try {
          if (tipo === 'provas') {
            await db.createProva({
              nome: obj.nome || obj.prova || 'Sem nome',
              data_reg: parseData(obj.data) || new Date().toISOString().slice(0,10),
              local_solta: obj.local_solta || '',
              dist: parseFloat(obj.distancia) || 0,
              esp: obj.especialidade ? [obj.especialidade.toLowerCase()] : ['velocidade'],
              lugar: parseInt(obj.lugar) || 0,
              pontos: parseFloat(obj.pontos) || 0,
              percentil: parseFloat(obj.percentil) || 0,
              obs: obj.obs || '',
            })
          } else {
            await db.createPombo({
              nome: obj.nome || 'Sem nome',
              anilha: obj.anilha || '',
              sexo: obj.sexo?.toUpperCase() === 'F' ? 'F' : 'M',
              cor: obj.cor || '',
              esp: obj.esp ? [obj.esp.toLowerCase()] : ['velocidade'],
              linhagem: obj.linhagem || '',
              pai: obj.pai || '',
              mae: obj.mae || '',
              provas: parseInt(obj.provas) || 0,
              percentil: parseFloat(obj.percentil) || 0,
              obs: obj.obs || '',
              estado: 'ativo',
              estado_ext: 'proprio',
            })
          }
          ok++
        } catch { erros++ }
      }
      setResultado({ ok, erros, total: parsed.rows.length })
      setEtapa('importar')
      toast(`${ok} registos importados!`, 'ok')
    } catch(e) { toast('Erro: '+e.message,'err') }
    finally { setImportando(false) }
  }

  const resetar = () => {
    setEtapa('upload'); setFicheiro(null); setParsed(null)
    setMapeamento({}); setPreview([]); setResultado(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#050D1A,#0B1830)', border:'1px solid rgba(76,141,255,.2)', borderRadius:14, padding:'14px 16px', marginBottom:14, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#1E5FD9,#4C8DFF)' }} />
        <div style={{ fontSize:18, fontWeight:900, color:'#fff', fontFamily:"'Fraunces',serif" }}>📥 Importação de Dados</div>
        <div style={{ fontSize:11, color:'#7A8699', marginTop:2 }}>CSV compatível com FPC, LoftGest e Excel</div>
      </div>

      {/* Tipo */}
      <div style={{ display:'flex', gap:6, marginBottom:14 }}>
        {[['provas','🏆 Provas'],['pombos','🐦 Pombos']].map(([t,l])=>(
          <button key={t} onClick={()=>{setTipo(t);resetar()}}
            style={{ flex:1, padding:'10px', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', border:`2px solid ${tipo===t?'#4C8DFF':'#1B2D52'}`, fontFamily:'inherit', background:tipo===t?'rgba(76,141,255,.1)':'none', color:tipo===t?'#4C8DFF':'#475569' }}>
            {l}
          </button>
        ))}
      </div>

      {/* Progresso */}
      <div style={{ display:'flex', gap:0, marginBottom:16 }}>
        {[['upload','1. Upload'],['mapear','2. Mapear'],['previsualizar','3. Pré-ver'],['importar','4. Concluído']].map(([e,l],i,arr)=>{
          const activo = e===etapa
          const feito = ['upload','mapear','previsualizar','importar'].indexOf(e) < ['upload','mapear','previsualizar','importar'].indexOf(etapa)
          return (
            <div key={e} style={{ flex:1, display:'flex', alignItems:'center' }}>
              <div style={{ flex:1, textAlign:'center' }}>
                <div style={{ width:28, height:28, borderRadius:'50%', margin:'0 auto 4px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, background:feito?'#2DD4A7':activo?'#4C8DFF':'#101F40', color:feito||activo?'#fff':'#475569', border:`2px solid ${feito?'#2DD4A7':activo?'#4C8DFF':'#1B2D52'}` }}>
                  {feito?'✓':i+1}
                </div>
                <div style={{ fontSize:9, color:activo?'#4C8DFF':feito?'#2DD4A7':'#475569', fontWeight:activo?700:400 }}>{l}</div>
              </div>
              {i<arr.length-1 && <div style={{ width:20, height:2, background:feito?'#2DD4A7':'#1B2D52', flexShrink:0 }} />}
            </div>
          )
        })}
      </div>

      {/* ETAPA 1: Upload */}
      {etapa==='upload' && (
        <div>
          <div onClick={()=>inputRef.current?.click()}
            style={{ border:'2px dashed #1B2D52', borderRadius:12, padding:'40px 20px', textAlign:'center', cursor:'pointer', transition:'all .2s' }}
            onMouseEnter={e=>e.currentTarget.style.borderColor='#4C8DFF'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='#1B2D52'}>
            <div style={{ fontSize:40, marginBottom:12 }}>📂</div>
            <div style={{ fontSize:15, fontWeight:600, color:'#fff', marginBottom:4 }}>Clique para seleccionar ficheiro</div>
            <div style={{ fontSize:12, color:'#7A8699' }}>CSV ou Excel exportado da FPC, LoftGest, Pombos.pt ou qualquer outro sistema</div>
            <div style={{ fontSize:11, color:'#475569', marginTop:8 }}>Separador: vírgula (,) ou ponto-e-vírgula (;) · Codificação: UTF-8</div>
            <input ref={inputRef} type="file" accept=".csv,.txt,.xls,.xlsx" onChange={onFicheiro} style={{ display:'none' }} />
          </div>
          <div style={{ marginTop:14, padding:'12px 14px', background:'rgba(76,141,255,.06)', border:'1px solid rgba(76,141,255,.15)', borderRadius:8 }}>
            <div style={{ fontSize:12, fontWeight:600, color:'#4C8DFF', marginBottom:6 }}>💡 Formato esperado para {tipo==='provas'?'Provas':'Pombos'}</div>
            <div style={{ fontSize:11, color:'#7A8699', fontFamily:"'Space Mono',monospace" }}>
              {tipo==='provas'
                ? 'nome,data,local_solta,distancia,especialidade,lugar,pontos,percentil'
                : 'nome,anilha,sexo,cor,linhagem,pai,mae,provas,percentil'}
            </div>
          </div>
        </div>
      )}

      {/* ETAPA 2: Mapeamento */}
      {etapa==='mapear' && parsed && (
        <div>
          <div style={{ marginBottom:12, padding:'10px 14px', background:'rgba(45,212,167,.06)', border:'1px solid rgba(45,212,167,.15)', borderRadius:8, fontSize:12, color:'#2DD4A7' }}>
            ✅ {ficheiro?.name} · {parsed.rows.length} linhas detectadas · {parsed.headers.length} colunas
          </div>
          <div style={{ fontWeight:600, color:'#fff', fontSize:13, marginBottom:10 }}>Mapear colunas do ficheiro → campos ChampionsLoft</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:14 }}>
            {colunasAlvo.map(col => (
              <div key={col} style={{ display:'flex', gap:10, alignItems:'center' }}>
                <div style={{ width:120, fontSize:12, color:'#4C8DFF', fontWeight:600, flexShrink:0 }}>{col}</div>
                <div style={{ fontSize:12, color:'#475569', flexShrink:0 }}>←</div>
                <select className="input" style={{ flex:1, fontSize:12 }} value={mapeamento[col]||''} onChange={e=>setMapeamento(m=>({...m,[col]:e.target.value}))}>
                  <option value="">— ignorar —</option>
                  {parsed.headers.map(h=><option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn btn-secondary" onClick={resetar}>← Voltar</button>
            <button className="btn btn-primary" style={{ flex:1 }} onClick={gerarPreview}>Pré-visualizar →</button>
          </div>
        </div>
      )}

      {/* ETAPA 3: Pré-visualização */}
      {etapa==='previsualizar' && (
        <div>
          <div style={{ fontWeight:600, color:'#fff', fontSize:13, marginBottom:10 }}>
            Pré-visualização (primeiros 5 de {parsed?.rows.length} registos)
          </div>
          <div style={{ overflowX:'auto', marginBottom:14 }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
              <thead>
                <tr>{Object.keys(preview[0]||{}).map(k=>(
                  <th key={k} style={{ padding:'6px 10px', background:'#101F40', color:'#4C8DFF', textAlign:'left', borderBottom:'1px solid #1B2D52', whiteSpace:'nowrap' }}>{k}</th>
                ))}</tr>
              </thead>
              <tbody>
                {preview.map((row,i)=>(
                  <tr key={i} style={{ borderBottom:'1px solid #0d1b2e' }}>
                    {Object.values(row).map((v,j)=>(
                      <td key={j} style={{ padding:'6px 10px', color:'#cbd5e1', whiteSpace:'nowrap' }}>{String(v).slice(0,30)}{String(v).length>30?'…':''}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding:'10px 14px', background:'rgba(212,175,55,.06)', border:'1px solid rgba(212,175,55,.15)', borderRadius:8, fontSize:12, color:'#D4AF37', marginBottom:14 }}>
            ⚠️ Serão importados <strong>{parsed?.rows.length} registos</strong> para {tipo==='provas'?'Provas':'Pombos'}. Esta acção não pode ser desfeita automaticamente.
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn btn-secondary" onClick={()=>setEtapa('mapear')}>← Voltar</button>
            <button className="btn btn-primary" style={{ flex:1 }} onClick={importar} disabled={importando}>
              {importando ? <><Spinner /> A importar...</> : `📥 Importar ${parsed?.rows.length} registos`}
            </button>
          </div>
        </div>
      )}

      {/* ETAPA 4: Resultado */}
      {etapa==='importar' && resultado && (
        <div style={{ textAlign:'center', padding:'20px 0' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>{resultado.erros===0?'🎉':'⚠️'}</div>
          <div style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:8 }}>Importação concluída</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:20 }}>
            {[[resultado.total,'Total','#94a3b8'],[resultado.ok,'Importados','#2DD4A7'],[resultado.erros,'Erros','#f87171']].map(([v,l,c])=>(
              <div key={l} className="card card-p" style={{ textAlign:'center' }}>
                <div style={{ fontSize:24, fontWeight:700, color:c }}>{v}</div>
                <div style={{ fontSize:11, color:'#7A8699' }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
            <button className="btn btn-secondary" onClick={resetar}>Nova importação</button>
            <button className="btn btn-primary" onClick={()=>nav?.(tipo==='provas'?'provas':'pombos')}>
              Ver {tipo==='provas'?'Provas':'Pombos'} →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
