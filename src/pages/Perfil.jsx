import { useState, useEffect } from 'react'
import { supabase, db } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useToast, Spinner, Field, Modal } from '../components/ui'
import { useIdioma } from '../hooks/useIdioma'
import { BotaoQR } from '../components/QRCode'
import { GuiaAuto, BotaoGuia } from '../components/GuiaModulo'

const REDES = [
  { id:'facebook', icon:'📘', label:'Facebook', placeholder:'https://facebook.com/...' },
  { id:'instagram', icon:'📸', label:'Instagram', placeholder:'https://instagram.com/...' },
  { id:'youtube', icon:'📺', label:'YouTube', placeholder:'https://youtube.com/...' },
]


// Módulos configuráveis pelo utilizador
const MODULOS_CONFIGURÁVEIS = [
  { id:'pombais',     icon:'🏠', label:'Pombais',         desc:'Gestão dos teus pombais' },
  { id:'treinos',     icon:'🎯', label:'Treinos',          desc:'Registo de treinos' },
  { id:'calendario',  icon:'📅', label:'Calendário',       desc:'Calendário de provas e eventos' },
  { id:'checklist',   icon:'✅', label:'Checklist',        desc:'Tarefas diárias do pombal' },
  { id:'saude',       icon:'🏥', label:'Saúde',            desc:'Tratamentos e saúde dos pombos' },
  { id:'reproducao',  icon:'🥚', label:'Reprodução',       desc:'Gestão de casais e ninhadas' },
  { id:'casais',      icon:'🧬', label:'Casais IA',        desc:'Seleccionador de casais por IA' },
  { id:'alimentacao', icon:'🌾', label:'Alimentação',      desc:'Planos de alimentação' },
  { id:'financas',    icon:'💰', label:'Finanças',         desc:'Controlo financeiro' },
  { id:'analiticas',  icon:'📊', label:'Analíticas',       desc:'Analíticas avançadas' },
  { id:'forma',       icon:'💪', label:'Rastreio Forma',   desc:'Evolução da forma dos pombos' },
  { id:'epoca',       icon:'🏁', label:'Época',            desc:'Resumo de época' },
  { id:'meteorologia',icon:'🌦️', label:'Meteorologia',    desc:'Previsão do tempo para provas' },
  { id:'comunidade',  icon:'🌐', label:'Comunidade',       desc:'Rede social columbófila' },
  { id:'mensagens',   icon:'💬', label:'Mensagens',        desc:'Mensagens directas' },
  { id:'clubes_pers', icon:'🎽', label:'Clubes & Equipes', desc:'Clubes personalizados' },
  { id:'forum',       icon:'💬', label:'Fórum',            desc:'Fórum de discussão' },
  { id:'marketplace', icon:'🛒', label:'Marketplace',      desc:'Compra e venda de pombos' },
  { id:'carteira',    icon:'💎', label:'Carteira',         desc:'Carteira de pontos e prémios' },
  { id:'conquistas',  icon:'🎖️', label:'Conquistas',      desc:'Badges e conquistas' },
]

const MODO_SIMPLES = ['pombais','treinos','calendario','checklist','saude','reproducao','alimentacao']

function TabMenu({ toast }) {
  const [ocultos, setOcultos] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cl_modulos_ocultos') || '[]') } catch { return [] }
  })
  const [modoSimples, setModoSimples] = useState(() => !!localStorage.getItem('cl_modo_simples'))

  const toggle = (id) => {
    const novos = ocultos.includes(id) ? ocultos.filter(x => x !== id) : [...ocultos, id]
    setOcultos(novos)
    localStorage.setItem('cl_modulos_ocultos', JSON.stringify(novos))
    window.dispatchEvent(new Event('cl_menu_change'))
  }

  const activarModoSimples = () => {
    const novosOcultos = MODULOS_CONFIGURÁVEIS.filter(m => !MODO_SIMPLES.includes(m.id)).map(m => m.id)
    setOcultos(novosOcultos)
    setModoSimples(true)
    localStorage.setItem('cl_modulos_ocultos', JSON.stringify(novosOcultos))
    localStorage.setItem('cl_modo_simples', '1')
    window.dispatchEvent(new Event('cl_menu_change'))
    toast('Modo simplificado activado', 'ok')
  }

  const desactivarModoSimples = () => {
    setOcultos([])
    setModoSimples(false)
    localStorage.removeItem('cl_modulos_ocultos')
    localStorage.removeItem('cl_modo_simples')
    window.dispatchEvent(new Event('cl_menu_change'))
    toast('Menu completo restaurado', 'ok')
  }

  const repor = () => {
    setOcultos([]); setModoSimples(false)
    localStorage.removeItem('cl_modulos_ocultos')
    localStorage.removeItem('cl_modo_simples')
    window.dispatchEvent(new Event('cl_menu_change'))
    toast('Menu reposto para o padrão', 'ok')
  }

  return (
    <div className="card card-p" style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:'#fff', marginBottom:2 }}>📋 Personalizar menu</div>
          <div style={{ fontSize:11, color:'#7A8699' }}>Oculta os módulos que não usas</div>
        </div>
        {(ocultos.length > 0 || modoSimples) && (
          <button onClick={repor} className="btn btn-secondary btn-sm">↺ Repor tudo</button>
        )}
      </div>

      {/* Modo Simplificado */}
      <div style={{ padding:'12px 14px', background: modoSimples ? 'rgba(45,212,167,.08)' : 'rgba(76,141,255,.06)', border:`1px solid ${modoSimples ? 'rgba(45,212,167,.3)' : 'rgba(76,141,255,.15)'}`, borderRadius:10 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color: modoSimples ? '#2DD4A7' : '#fff', marginBottom:2 }}>
              {modoSimples ? '✅ Modo simplificado activo' : '⚡ Modo simplificado'}
            </div>
            <div style={{ fontSize:11, color:'#7A8699' }}>
              Mostra só o essencial: Pombos, Provas, Saúde, Alimentação, Checklist e Calendário
            </div>
          </div>
          {modoSimples
            ? <button onClick={desactivarModoSimples} className="btn btn-secondary btn-sm">Desactivar</button>
            : <button onClick={activarModoSimples} className="btn btn-primary btn-sm">Activar</button>
          }
        </div>
      </div>

      {/* Lista de módulos */}
      <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
        {MODULOS_CONFIGURÁVEIS.map(m => {
          const activo = !ocultos.includes(m.id)
          return (
            <div key={m.id} onClick={() => toggle(m.id)}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'9px 12px', background: activo ? '#0B1830' : 'rgba(255,255,255,.02)', borderRadius:9, border:`1px solid ${activo ? '#1B2D52' : 'rgba(255,255,255,.05)'}`, cursor:'pointer', opacity: activo ? 1 : 0.45, transition:'all .15s' }}>
              <span style={{ fontSize:17, width:22, textAlign:'center', flexShrink:0 }}>{m.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:600, color: activo ? '#fff' : '#7A8699' }}>{m.label}</div>
                <div style={{ fontSize:10, color:'#475569' }}>{m.desc}</div>
              </div>
              <div style={{ width:40, height:22, borderRadius:11, background: activo ? '#2DD4A7' : '#1B2D52', position:'relative', transition:'background .2s', flexShrink:0 }}>
                <div style={{ position:'absolute', top:2, left: activo ? 19 : 2, width:18, height:18, borderRadius:'50%', background:'#fff', transition:'left .2s' }}/>
              </div>
            </div>
          )
        })}
      </div>

      {ocultos.length > 0 && (
        <div style={{ padding:'8px 12px', background:'rgba(76,141,255,.06)', border:'1px solid rgba(76,141,255,.15)', borderRadius:8, fontSize:11, color:'#7A8699' }}>
          {ocultos.length} módulo(s) oculto(s) · Menu lateral actualiza automaticamente
        </div>
      )}
    </div>
  )
}

export default function Perfil({ nav }) {
  const { user, signOut } = useAuth()
  const toast = useToast()
  const { t } = useIdioma()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [tab, setTab] = useState('pessoal')
  const [modalDangerZone, setModalDangerZone] = useState(false)
  const [fotoPerfilFile, setFotoPerfilFile] = useState(null)
  const [fotoPombalFile, setFotoPombalFile] = useState(null)
  const [fotoPerfilPreview, setFotoPerfilPreview] = useState(null)
  const [fotoPombalPreview, setFotoPombalPreview] = useState(null)
  const [fotoLogoFile, setFotoLogoFile] = useState(null)
  const [fotoLogoPreview, setFotoLogoPreview] = useState(null)
  const [stats, setStats] = useState({ pombos:0, provas:0, vitorias:0, acasalamentos:0 })
  const [form, setForm] = useState({
    nome:'', tel:'', fed:'', org:'', pombal_nome:'', pombal_morada:'',
    pombal_lat:'', pombal_lon:'', foto_perfil_url:'', foto_pombal_url:'',
    logo_url:'', conquistas:[], slug:'', bio:'', perfil_publico:false,
    notif_eclosao:true, notif_provas:true, notif_tarefas:true,
    redes:{ facebook:'', instagram:'', youtube:'' }
  })
  const sf = (k,v) => setForm(f=>({...f,[k]:v}))

  useEffect(()=>{
    async function load() {
      setLoading(true)
      try {
        const [p, pombos, provas, acas] = await Promise.all([
          db.getPerfil(),
          db.getPombos().catch(()=>[]),
          db.getProvas().catch(()=>[]),
          db.getAcasalamentos().catch(()=>[]),
        ])
        if (p) setForm({
          nome:p.nome||'', tel:p.tel||'', fed:p.fed||'', org:p.org||'',
          pombal_nome:p.pombal_nome||'', pombal_morada:p.pombal_morada||'',
          pombal_lat:String(p.pombal_lat||''), pombal_lon:String(p.pombal_lon||''),
          foto_perfil_url:p.foto_perfil_url||'', foto_pombal_url:p.foto_pombal_url||'',
          logo_url:p.logo_url||'', conquistas:p.conquistas||[], slug:p.slug||'',
          bio:p.bio||'', perfil_publico:p.perfil_publico||false,
          notif_eclosao:p.notif_eclosao!==false, notif_provas:p.notif_provas!==false,
          notif_tarefas:p.notif_tarefas!==false,
          redes:p.redes||{ facebook:'', instagram:'', youtube:'' }
        })
        else setForm(f=>({...f, nome:user?.user_metadata?.nome||''}))
        const vitorias = provas.filter(p=>p.lugar===1).length
        setStats({ pombos:pombos.length, provas:provas.length, vitorias, acasalamentos:acas.length })
      } catch(e) {}
      finally { setLoading(false) }
    }
    load()
  },[user])

  const uploadFoto = async (file, path) => {
    const ext = file.name.split('.').pop()
    const fullPath = `${path}.${ext}`
    const { error } = await supabase.storage.from('fotos').upload(fullPath, file, { upsert:true })
    if (error) throw error
    const { data } = supabase.storage.from('fotos').getPublicUrl(fullPath)
    return data.publicUrl
  }

  const save = async () => {
    if (!form.nome.trim()) { toast('Nome obrigatório','warn'); return }
    setSaving(true)
    try {
      let foto_perfil_url = form.foto_perfil_url
      let foto_pombal_url = form.foto_pombal_url
      let logo_url = form.logo_url
      const uid = user?.id
      if (fotoPerfilFile && uid) { try { foto_perfil_url = await uploadFoto(fotoPerfilFile,`perfis/${uid}/columbofilo`) } catch(e) { toast('Foto perfil não guardada','warn') } }
      if (fotoPombalFile && uid) { try { foto_pombal_url = await uploadFoto(fotoPombalFile,`perfis/${uid}/pombal`) } catch(e) { toast('Foto pombal não guardada','warn') } }
      if (fotoLogoFile && uid) { try { logo_url = await uploadFoto(fotoLogoFile,`perfis/${uid}/logo`) } catch(e) { toast('Logo não guardado','warn') } }
      await db.savePerfil({
        nome:form.nome, tel:form.tel, fed:form.fed, org:form.org,
        pombal_nome:form.pombal_nome, pombal_morada:form.pombal_morada,
        pombal_lat:form.pombal_lat?parseFloat(form.pombal_lat):null,
        pombal_lon:form.pombal_lon?parseFloat(form.pombal_lon):null,
        foto_perfil_url, foto_pombal_url, logo_url,
        conquistas:form.conquistas.filter(c=>c.trim()),
        slug:form.slug.toLowerCase().replace(/[^a-z0-9-]/g,'').slice(0,30)||null,
        bio:form.bio, perfil_publico:form.perfil_publico,
        notif_eclosao:form.notif_eclosao, notif_provas:form.notif_provas,
        notif_tarefas:form.notif_tarefas, redes:form.redes
      })
      setForm(f=>({...f, foto_perfil_url, foto_pombal_url, logo_url}))
      toast('Perfil guardado! ✅','ok')
    } catch(e) { toast('Erro: '+e.message,'err') }
    finally { setSaving(false) }
  }

  const exportarBackup = async () => {
    setExportando(true)
    try {
      const [pombos,provas,saude,financas,acasalamentos,treinos,tarefas,stock,vacinas] = await Promise.all([
        db.getPombos().catch(()=>[]),db.getProvas().catch(()=>[]),db.getSaude().catch(()=>[]),
        db.getFinancas().catch(()=>[]),db.getAcasalamentos().catch(()=>[]),
        supabase.from('treinos').select('*').then(r=>r.data||[]).catch(()=>[]),
        db.getTarefas().catch(()=>[]),db.getStock().catch(()=>[]),db.getVacinas().catch(()=>[]),
      ])
      const backup = {
        versao:'2.0', app:'Fly2Win', data_exportacao:new Date().toISOString(),
        columbofilo:{ nome:form.nome, email:user?.email, fed:form.fed, org:form.org },
        dados:{ pombos,provas,saude,financas,acasalamentos,treinos,tarefas,stock,vacinas },
        estatisticas:{ total_pombos:pombos.length, total_provas:provas.length, total_saude:saude.length, total_acasalamentos:acasalamentos.length }
      }
      const blob = new Blob([JSON.stringify(backup,null,2)],{type:'application/json'})
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href=url; a.download=`fly2win-backup-${new Date().toISOString().slice(0,10)}.json`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast('Backup exportado!','ok')
    } catch(e) { toast('Erro: '+e.message,'err') }
    finally { setExportando(false) }
  }

  const FotoUpload = ({ id, preview, url, onChange, icon, label, round }) => (
    <div style={{ display:'flex', alignItems:'center', gap:14 }}>
      <div onClick={()=>document.getElementById(id).click()}
        style={{ width:72, height:72, borderRadius:round?'50%':14, border:'2px dashed #1B2D52', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', cursor:'pointer', flexShrink:0, background:'#101F40', position:'relative' }}>
        {(preview||url)?<img src={preview||url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>:<span style={{ fontSize:28 }}>{icon}</span>}
        <div style={{ position:'absolute', bottom:3, right:3, background:'#2DD4A7', borderRadius:'50%', width:18, height:18, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10 }}>📷</div>
      </div>
      <div>
        <input type="file" id={id} accept="image/*" style={{ display:'none' }} onChange={onChange}/>
        <div style={{ fontSize:13, fontWeight:500, color:'#fff' }}>{label}</div>
        <div style={{ fontSize:11, color:'#7A8699', marginTop:2 }}>Toque para alterar</div>
      </div>
    </div>
  )

  const Toggle = ({ checked, onChange, label, desc }) => (
    <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', padding:'10px 12px', background:checked?'rgba(45,212,167,.06)':'#101F40', borderRadius:8, border:`1px solid ${checked?'rgba(45,212,167,.2)':'#1B2D52'}` }}>
      <input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)} style={{ accentColor:'#2DD4A7', width:16, height:16 }}/>
      <div>
        <div style={{ fontSize:12, fontWeight:600, color:checked?'#2DD4A7':'#cbd5e1' }}>{label}</div>
        {desc&&<div style={{ fontSize:11, color:'#7A8699' }}>{desc}</div>}
      </div>
    </label>
  )

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:60 }}><Spinner lg/></div>

  const initials = form.nome?.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()||'?'

  return (
    <div>
      <GuiaAuto modulo="perfil"/>

      {/* Hero do perfil */}
      <div style={{ background:'linear-gradient(160deg,#050D1A,#0B1830)', border:'1px solid rgba(212,175,55,.2)', borderRadius:16, marginBottom:14, overflow:'hidden', position:'relative' }}>
        {/* Capa */}
        <div style={{ height:90, background:'linear-gradient(135deg,#0A1628,#112036,#0A1A2E)', position:'relative' }}>
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 70% 50%, rgba(212,175,55,.1), transparent 70%)' }}/>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#B8960C,#D4AF37,#B8960C)' }}/>
        </div>
        {/* Avatar + info */}
        <div style={{ padding:'0 18px 16px', position:'relative' }}>
          <div style={{ display:'flex', alignItems:'flex-end', gap:14, marginTop:-30 }}>
            <div onClick={()=>document.getElementById('foto-perfil-up').click()} style={{ width:64, height:64, borderRadius:'50%', border:'3px solid #D4AF37', overflow:'hidden', flexShrink:0, cursor:'pointer', background:'linear-gradient(135deg,#1E5FD9,#4C8DFF)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:700, color:'#fff' }}>
              {(fotoPerfilPreview||form.foto_perfil_url)?<img src={fotoPerfilPreview||form.foto_perfil_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>:initials}
            </div>
            <input type="file" id="foto-perfil-up" accept="image/*" style={{ display:'none' }} onChange={e=>{ const f=e.target.files[0]; if(f){ setFotoPerfilFile(f); setFotoPerfilPreview(URL.createObjectURL(f)) } }}/>
            <div style={{ flex:1, paddingBottom:4 }}>
              <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:900, color:'#fff' }}>{form.nome||'O teu nome'}</div>
              <div style={{ fontSize:11, color:'#7A8699' }}>{form.org||'Columbófilo'}{form.fed?` · ${form.fed}`:''}</div>
            </div>
            <div style={{ display:'flex', gap:6, paddingBottom:4 }}>
              <BotaoGuia modulo="perfil"/>
              <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>{saving?<Spinner/>:'💾'} Guardar</button>
              <button className="btn btn-secondary btn-sm" onClick={signOut}>Sair</button>
            </div>
          </div>
          {/* Stats rápidos */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginTop:14 }}>
            {[[stats.pombos,'🐦','Pombos','#4C8DFF'],[stats.provas,'🏆','Provas','#D4AF37'],[stats.vitorias,'🥇','Vitórias','#2DD4A7'],[stats.acasalamentos,'🥚','Casais','#C084FC']].map(([v,icon,l,c])=>(
              <div key={l} style={{ textAlign:'center', padding:'8px 4px', background:'rgba(255,255,255,.03)', borderRadius:8, border:`1px solid ${c}20` }}>
                <div style={{ fontSize:9, color:c, marginBottom:2 }}>{icon}</div>
                <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:900, color:c }}>{v}</div>
                <div style={{ fontSize:9, color:'#475569' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:3, background:'#0A1628', borderRadius:10, padding:3, marginBottom:14, overflowX:'auto' }}>
        {[['pessoal','👤 Pessoal'],['pombal','🏠 Pombal'],['publico','🌐 Público'],['palmares','🏆 Palmarés'],['notif','🔔 Notificações'],['menu','📋 Menu'],['dados','💾 Dados']].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{ flex:'none', padding:'8px 12px', borderRadius:8, fontSize:11, fontWeight:600, cursor:'pointer', border:'none', fontFamily:'inherit', whiteSpace:'nowrap', background:tab===k?'linear-gradient(135deg,#B8960C,#7A6020)':'none', color:tab===k?'#fff':'#475569' }}>{l}</button>
        ))}
      </div>

      {/* PESSOAL */}
      {tab==='pessoal'&&(
        <div className="card card-p">
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <Field label="Nome Completo *"><input className="input" value={form.nome} onChange={e=>sf('nome',e.target.value)}/></Field>
            <Field label="Email"><input className="input" value={user?.email} disabled style={{ opacity:.5 }}/></Field>
            <Field label="Telefone"><input className="input" placeholder="+351 9XX XXX XXX" value={form.tel} onChange={e=>sf('tel',e.target.value)}/></Field>
            <Field label="Nº Federativo FCP"><input className="input" placeholder="FCP-2026-XXXX" value={form.fed} onChange={e=>sf('fed',e.target.value)}/></Field>
            <Field label="Organização / Clube"><input className="input" placeholder="Sociedade Columbófila..." value={form.org} onChange={e=>sf('org',e.target.value)}/></Field>
            <div style={{ borderTop:'1px solid #1B2D52', paddingTop:14 }}>
              <div style={{ fontSize:12, fontWeight:600, color:'#fff', marginBottom:10 }}>🔗 Redes Sociais</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {REDES.map(r=>(
                  <div key={r.id} style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <span style={{ fontSize:18, width:24, textAlign:'center' }}>{r.icon}</span>
                    <input className="input" style={{ flex:1 }} placeholder={r.placeholder} value={form.redes?.[r.id]||''} onChange={e=>sf('redes',{...form.redes,[r.id]:e.target.value})}/>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POMBAL */}
      {tab==='pombal'&&(
        <div className="card card-p">
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              <FotoUpload id="foto-pombal-up" preview={fotoPombalPreview} url={form.foto_pombal_url} icon="🏠" label="Foto do pombal"
                onChange={e=>{ const f=e.target.files[0]; if(f){ setFotoPombalFile(f); setFotoPombalPreview(URL.createObjectURL(f)) } }}/>
              <FotoUpload id="foto-logo-up" preview={fotoLogoPreview} url={form.logo_url} icon="🎨" label="Logo / Marca"
                onChange={e=>{ const f=e.target.files[0]; if(f){ setFotoLogoFile(f); setFotoLogoPreview(URL.createObjectURL(f)) } }}/>
            </div>
            <Field label="Nome do Pombal"><input className="input" placeholder="Pombal da Quinta..." value={form.pombal_nome} onChange={e=>sf('pombal_nome',e.target.value)}/></Field>
            <Field label="Morada"><input className="input" placeholder="Localidade, Concelho" value={form.pombal_morada} onChange={e=>sf('pombal_morada',e.target.value)}/></Field>
            <div className="form-grid" style={{ gridTemplateColumns:'1fr 1fr' }}>
              <Field label="Latitude GPS"><input className="input" placeholder="38.80234" value={form.pombal_lat} onChange={e=>sf('pombal_lat',e.target.value)}/></Field>
              <Field label="Longitude GPS"><input className="input" placeholder="-9.38142" value={form.pombal_lon} onChange={e=>sf('pombal_lon',e.target.value)}/></Field>
            </div>
            {form.pombal_lat&&form.pombal_lon&&(
              <div style={{ borderRadius:10, overflow:'hidden', border:'1px solid #1B2D52', height:140 }}>
                <iframe width="100%" height="100%" frameBorder="0" style={{ display:'block' }} src={`https://maps.google.com/maps?q=${form.pombal_lat},${form.pombal_lon}&z=14&output=embed`}/>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PÚBLICO */}
      {tab==='publico'&&(
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div className="card card-p">
            <Toggle checked={form.perfil_publico} onChange={v=>sf('perfil_publico',v)} label="Perfil visível na Comunidade" desc="Outros columbófilos podem seguir-te e ver as tuas publicações"/>
            <div style={{ marginTop:12 }}>
              <Field label="🔗 URL do teu perfil público">
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <span style={{ fontSize:11, color:'#7A8699', whiteSpace:'nowrap' }}>fly2win.pt/p/</span>
                  <input className="input" placeholder="fabio-serrano" value={form.slug} onChange={e=>sf('slug',e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,''))}/>
                </div>
                {form.slug&&<div style={{ fontSize:11, color:'#2DD4A7', marginTop:4 }}>✅ fly2win.pt/p/{form.slug}</div>}
              </Field>
            </div>
            {form.slug&&form.perfil_publico&&(
              <div style={{ marginTop:12, display:'flex', gap:8 }}>
                <BotaoQR titulo={form.nome||'O meu perfil'} conteudo={`${window.location.origin}/p/${form.slug}`} subtitulo={`fly2win.pt/p/${form.slug}`}/>
                <button className="btn btn-secondary btn-sm" onClick={()=>{ navigator.clipboard?.writeText(`${window.location.origin}/p/${form.slug}`); toast('Link copiado!','ok') }}>🔗 Copiar link</button>
              </div>
            )}
          </div>
          <div className="card card-p">
            <Field label="Bio (aparece no teu perfil público)">
              <textarea className="input" rows={3} style={{ resize:'none' }} placeholder="Ex: Columbófilo há 20 anos, especialista em Fundo..." value={form.bio} onChange={e=>sf('bio',e.target.value)}/>
            </Field>
          </div>
          {/* Top 3 pombos */}
          <div className="card card-p">
            <div style={{ fontSize:13, fontWeight:600, color:'#fff', marginBottom:8 }}>⭐ Top 3 Pombos em Destaque</div>
            <div style={{ fontSize:11, color:'#7A8699', marginBottom:10 }}>Aparecem no teu perfil público. Vai a Pombos e selecciona os que queres destacar.</div>
            <button className="btn btn-secondary btn-sm" onClick={()=>nav?.('pombos')}>Ir para Pombos →</button>
          </div>
        </div>
      )}

      {/* PALMARÉS */}
      {tab==='palmares'&&(
        <div className="card card-p">
          <div style={{ fontSize:13, fontWeight:600, color:'#fff', marginBottom:4 }}>🏆 Palmarés / Conquistas</div>
          <div style={{ fontSize:12, color:'#94a3b8', marginBottom:12 }}>Aparecem no PDF do Pedigree e no teu perfil público. Uma por linha.</div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {(form.conquistas.length>0?form.conquistas:['']).map((c,i)=>(
              <div key={i} style={{ display:'flex', gap:6 }}>
                <span style={{ fontSize:14, color:'#D4AF37', alignSelf:'center' }}>🏆</span>
                <input className="input" style={{ flex:1 }} placeholder="Ex: 1.º Nacional Velocidade 2024" value={c}
                  onChange={e=>{ const a=[...form.conquistas]; a[i]=e.target.value; sf('conquistas',a) }}/>
                <button className="btn btn-secondary btn-sm" onClick={()=>{ const a=[...form.conquistas]; a.splice(i,1); sf('conquistas',a.length?a:['']) }}>✕</button>
              </div>
            ))}
          </div>
          <button className="btn btn-secondary btn-sm" style={{ marginTop:10 }} onClick={()=>sf('conquistas',[...form.conquistas,''])}>+ Adicionar conquista</button>
          <div style={{ marginTop:16, padding:'10px 12px', background:'rgba(212,175,55,.06)', border:'1px solid rgba(212,175,55,.15)', borderRadius:8, fontSize:11, color:'#7A8699' }}>
            💡 As conquistas ficam guardadas automaticamente ao clicar "Guardar" no topo do perfil
          </div>
        </div>
      )}

      {/* NOTIFICAÇÕES */}
      {tab==='notif'&&(
        <div className="card card-p">
          <div style={{ fontSize:13, fontWeight:600, color:'#fff', marginBottom:12 }}>🔔 Preferências de Notificação</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <Toggle checked={form.notif_eclosao} onChange={v=>sf('notif_eclosao',v)} label="🐣 Alertas de eclosão" desc="Notificação quando uma eclosão é prevista para os próximos 2 dias"/>
            <Toggle checked={form.notif_provas} onChange={v=>sf('notif_provas',v)} label="🏆 Lembretes de provas" desc="Notificação 24h antes de uma prova agendada"/>
            <Toggle checked={form.notif_tarefas} onChange={v=>sf('notif_tarefas',v)} label="✅ Tarefas em atraso" desc="Notificação diária se existirem tarefas da checklist em atraso"/>
          </div>
          <div style={{ marginTop:14, padding:'10px 12px', background:'rgba(76,141,255,.06)', border:'1px solid rgba(76,141,255,.15)', borderRadius:8, fontSize:11, color:'#7A8699' }}>
            ℹ️ As notificações push requerem que tenhas instalado a app (PWA) e autorizado as notificações no browser.
          </div>
        </div>
      )}

      {/* MENU */}
      {tab==='menu'&&<TabMenu toast={toast}/>}

      {/* DADOS */}
      {tab==='dados'&&(
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div className="card card-p">
            <div style={{ fontSize:13, fontWeight:600, color:'#fff', marginBottom:4 }}>💾 Backup dos Dados</div>
            <div style={{ fontSize:12, color:'#94a3b8', marginBottom:12 }}>Exporta todos os teus dados em JSON — pombos, provas, saúde, finanças, acasalamentos, treinos, tarefas, stock e vacinas.</div>
            <button className="btn btn-primary" onClick={exportarBackup} disabled={exportando}>
              {exportando?<Spinner/>:'📥'} {exportando?'A exportar...':'Descarregar Backup (JSON)'}
            </button>
            <div style={{ marginTop:10, fontSize:11, color:'#7A8699', lineHeight:1.6 }}>
              💡 Guarda o ficheiro no Google Drive, Dropbox ou outro serviço de cloud. Pode ser reimportado no futuro.
            </div>
          </div>
          <div className="card card-p" style={{ border:'1px solid rgba(248,113,113,.2)', background:'rgba(248,113,113,.03)' }}>
            <div style={{ fontSize:13, fontWeight:600, color:'#f87171', marginBottom:4 }}>⚠️ Zona de Perigo</div>
            <div style={{ fontSize:12, color:'#94a3b8', marginBottom:12 }}>Acções irreversíveis — tem cuidado.</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <button className="btn btn-secondary btn-sm" onClick={()=>{ navigator.clipboard?.writeText(user?.email||''); toast('Email copiado!','ok') }}>📋 Copiar dados RGPD</button>
              <button className="btn btn-danger btn-sm" onClick={()=>setModalDangerZone(true)}>🗑️ Apagar conta</button>
            </div>
          </div>
        </div>
      )}

      <Modal open={modalDangerZone} onClose={()=>setModalDangerZone(false)} title="⚠️ Apagar conta"
        footer={<><button className="btn btn-secondary" onClick={()=>setModalDangerZone(false)}>Cancelar</button><button className="btn btn-danger" onClick={()=>{ toast('Contacte suporte@fly2win.pt para apagar a conta','ok'); setModalDangerZone(false) }}>Confirmar pedido</button></>}>
        <p style={{ fontSize:14, color:'#cbd5e1', marginBottom:12 }}>Para apagar a tua conta e todos os dados associados, o pedido será enviado para a nossa equipa.</p>
        <p style={{ fontSize:13, color:'#f87171' }}>Esta acção é irreversível. Exporta primeiro o teu backup.</p>
      </Modal>
    </div>
  )
}
