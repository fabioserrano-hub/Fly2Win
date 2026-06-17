import { useState, useEffect } from 'react'
import { supabase, db } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useToast, Spinner, Field } from '../components/ui'

export default function Perfil() {
  const { user, signOut } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fotoPerfilFile, setFotoPerfilFile] = useState(null)
  const [fotoPombalFile, setFotoPombalFile] = useState(null)
  const [fotoPerfilPreview, setFotoPerfilPreview] = useState(null)
  const [fotoPombalPreview, setFotoPombalPreview] = useState(null)
  const [form, setForm] = useState({ nome: '', tel: '', fed: '', org: '', pombal_nome: '', pombal_morada: '', pombal_lat: '', pombal_lon: '', foto_perfil_url: '', foto_pombal_url: '' })
  const sf = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const p = await db.getPerfil()
        if (p) setForm({ nome: p.nome || '', tel: p.tel || '', fed: p.fed || '', org: p.org || '', pombal_nome: p.pombal_nome || '', pombal_morada: p.pombal_morada || '', pombal_lat: String(p.pombal_lat || ''), pombal_lon: String(p.pombal_lon || ''), foto_perfil_url: p.foto_perfil_url || '', foto_pombal_url: p.foto_pombal_url || '' })
        else setForm(f => ({ ...f, nome: user?.user_metadata?.nome || '' }))
      } catch (e) {}
      finally { setLoading(false) }
    }
    load()
  }, [user])

  const uploadFoto = async (file, path) => {
    const ext = file.name.split('.').pop()
    const fullPath = `${path}.${ext}`
    const { error } = await supabase.storage.from('fotos').upload(fullPath, file, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from('fotos').getPublicUrl(fullPath)
    return data.publicUrl
  }

  const save = async () => {
    if (!form.nome.trim()) { toast('Nome obrigatório', 'warn'); return }
    setSaving(true)
    try {
      let foto_perfil_url = form.foto_perfil_url
      let foto_pombal_url = form.foto_pombal_url
      const uid = user?.id
      if (fotoPerfilFile && uid) {
        try { foto_perfil_url = await uploadFoto(fotoPerfilFile, `perfis/${uid}/columbofilo`) }
        catch (e) { toast('Foto perfil não guardada: ' + e.message, 'warn') }
      }
      if (fotoPombalFile && uid) {
        try { foto_pombal_url = await uploadFoto(fotoPombalFile, `perfis/${uid}/pombal`) }
        catch (e) { toast('Foto pombal não guardada: ' + e.message, 'warn') }
      }
      await db.savePerfil({ nome: form.nome, tel: form.tel, fed: form.fed, org: form.org, pombal_nome: form.pombal_nome, pombal_morada: form.pombal_morada, pombal_lat: form.pombal_lat ? parseFloat(form.pombal_lat) : null, pombal_lon: form.pombal_lon ? parseFloat(form.pombal_lon) : null, foto_perfil_url, foto_pombal_url })
      setForm(f => ({ ...f, foto_perfil_url, foto_pombal_url }))
      toast('Perfil guardado! ✅', 'ok')
    } catch (e) { toast('Erro: ' + e.message, 'err') }
    finally { setSaving(false) }
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner lg /></div>

  const FotoUpload = ({ id, preview, url, onChange, icon, label }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div onClick={() => document.getElementById(id).click()}
        style={{ width: 80, height: 80, borderRadius: 14, border: '2px dashed #243860', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer', flexShrink: 0, background: '#1a2840', position: 'relative' }}>
        {(preview || url) ? <img src={preview || url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 32 }}>{icon}</span>}
        <div style={{ position: 'absolute', bottom: 4, right: 4, background: '#1ed98a', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>📷</div>
      </div>
      <div>
        <input type="file" id={id} accept="image/*" style={{ display: 'none' }} onChange={onChange} />
        <div style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>{label}</div>
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Toque na imagem para alterar</div>
      </div>
    </div>
  )

  return (
    <div>
      <div className="section-header">
        <div><div className="section-title">Perfil</div><div className="section-sub">{user?.email}</div></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? <Spinner /> : '💾'} Guardar</button>
          <button className="btn btn-secondary" onClick={signOut}>Sair</button>
        </div>
      </div>

      <div className="grid-2">
        <div className="card card-p">
          <div style={{ fontWeight: 600, color: '#fff', marginBottom: 16 }}>👤 Dados Pessoais</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <FotoUpload id="foto-perfil-up" preview={fotoPerfilPreview} url={form.foto_perfil_url} icon="👤" label="Foto do columbófilo"
              onChange={e => { const f = e.target.files[0]; if (f) { setFotoPerfilFile(f); setFotoPerfilPreview(URL.createObjectURL(f)) } }} />
            <Field label="Nome Completo *"><input className="input" value={form.nome} onChange={e => sf('nome', e.target.value)} /></Field>
            <Field label="Email"><input className="input" value={user?.email} disabled style={{ opacity: .6 }} /></Field>
            <Field label="Telefone"><input className="input" placeholder="+351 9XX XXX XXX" value={form.tel} onChange={e => sf('tel', e.target.value)} /></Field>
            <Field label="Nº Federativo"><input className="input" placeholder="FCP-2026-XXXX" value={form.fed} onChange={e => sf('fed', e.target.value)} /></Field>
            <Field label="Organização / Clube"><input className="input" placeholder="Sociedade Columbófila..." value={form.org} onChange={e => sf('org', e.target.value)} /></Field>
          </div>
        </div>

        <div className="card card-p">
          <div style={{ fontWeight: 600, color: '#fff', marginBottom: 16 }}>🏠 Dados do Pombal</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <FotoUpload id="foto-pombal-up" preview={fotoPombalPreview} url={form.foto_pombal_url} icon="🏠" label="Foto do pombal"
              onChange={e => { const f = e.target.files[0]; if (f) { setFotoPombalFile(f); setFotoPombalPreview(URL.createObjectURL(f)) } }} />
            <Field label="Nome do Pombal"><input className="input" placeholder="Pombal da Quinta..." value={form.pombal_nome} onChange={e => sf('pombal_nome', e.target.value)} /></Field>
            <Field label="Morada"><input className="input" placeholder="Localidade, Concelho" value={form.pombal_morada} onChange={e => sf('pombal_morada', e.target.value)} /></Field>
            <Field label="Latitude GPS"><input className="input" placeholder="38.80234" value={form.pombal_lat} onChange={e => sf('pombal_lat', e.target.value)} /></Field>
            <Field label="Longitude GPS"><input className="input" placeholder="-9.38142" value={form.pombal_lon} onChange={e => sf('pombal_lon', e.target.value)} /></Field>
            {form.pombal_lat && form.pombal_lon && (
              <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #243860', height: 140 }}>
                <iframe width="100%" height="100%" frameBorder="0" style={{ display: 'block' }}
                  src={`https://maps.google.com/maps?q=${form.pombal_lat},${form.pombal_lon}&z=14&output=embed`} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
