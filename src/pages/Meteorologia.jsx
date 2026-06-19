import { useState, useEffect, useCallback } from 'react'
import { db } from '../lib/supabase'
import { useToast, Spinner, EmptyState } from '../components/ui'

const ICONES_WMO = {
  0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',48:'🌫️',
  51:'🌦️',53:'🌦️',55:'🌦️',61:'🌧️',63:'🌧️',65:'🌧️',
  71:'🌨️',73:'🌨️',75:'🌨️',80:'🌦️',81:'🌧️',82:'⛈️',
  95:'⛈️',96:'⛈️',99:'⛈️',
}
const descWMO = (c) => {
  if (c===0) return 'Céu limpo'
  if ([1,2,3].includes(c)) return 'Parcialmente nublado'
  if ([45,48].includes(c)) return 'Nevoeiro'
  if ([51,53,55,61,63,65,80,81].includes(c)) return 'Chuva'
  if ([71,73,75].includes(c)) return 'Neve'
  if ([82,95,96,99].includes(c)) return 'Trovoada'
  return 'Indefinido'
}
const avaliarVoo = (vento, precip, cod) => {
  if (precip>2||[80,81,82,95,96,99].includes(cod)) return { txt:'Desfavorável', cor:'#f87171' }
  if (vento>30) return { txt:'Vento forte — risco', cor:'#D4AF37' }
  if (vento>20) return { txt:'Aceitável com cautela', cor:'#D4AF37' }
  return { txt:'Favorável', cor:'#2DD4A7' }
}

// Rumo geográfico (bearing) da solta para o pombal
function calcRumo(latS,lonS,latP,lonP) {
  const r=d=>d*Math.PI/180, d=r=>r*180/Math.PI
  const dL=r(lonP-lonS)
  const y=Math.sin(dL)*Math.cos(r(latP))
  const x=Math.cos(r(latS))*Math.sin(r(latP))-Math.sin(r(latS))*Math.cos(r(latP))*Math.cos(dL)
  return (d(Math.atan2(y,x))+360)%360
}
function classificarVento(rumo,dir) {
  let diff=Math.abs(rumo-dir); if(diff>180) diff=360-diff
  if(diff<=45) return {tipo:'Vento de Cauda',icon:'⬆️',cor:'#2DD4A7'}
  if(diff>=135) return {tipo:'Vento de Proa',icon:'⬇️',cor:'#f87171'}
  return {tipo:'Vento Lateral',icon:'↔️',cor:'#D4AF37'}
}

// Calcula N pontos intermédios em linha recta entre solta e pombal
function pontosTrajeto(latS,lonS,latP,lonP,n) {
  const pts=[]
  for(let i=0;i<=n+1;i++) {
    const t=i/(n+1)
    pts.push({ lat:latS+(latP-latS)*t, lon:lonS+(lonP-lonS)*t,
      label: i===0 ? '📍 Solta' : i===n+1 ? '🏠 Pombal' : `Ponto ${i}` })
  }
  return pts
}

export default function Meteorologia({ nav }) {
  const toast = useToast()
  const [tab, setTab] = useState('local')
  const [perfil, setPerfil] = useState(null)
  const [provas, setProvas] = useState([])
  const [loading, setLoading] = useState(true)

  // Tab local
  const [loadingMeteo, setLoadingMeteo] = useState(false)
  const [previsao, setPrevisao] = useState(null)
  const [localNome, setLocalNome] = useState('')
  const [coordsAtuais, setCoordsAtuais] = useState(null)
  const [pesquisa, setPesquisa] = useState('')

  // Tab rota
  const [provaRota, setProvaRota] = useState('')
  const [nPontos, setNPontos] = useState(3)
  const [loadingRota, setLoadingRota] = useState(false)
  const [dadosRota, setDadosRota] = useState(null)
  // Estado para controlar qual ponto está expandido
  const [pontoExpandido, setPontoExpandido] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [p, pv] = await Promise.all([db.getPerfil(), db.getProvas()])
      setPerfil(p); setProvas(pv)
      if (p?.pombal_lat && p?.pombal_lon) {
        setCoordsAtuais({ lat: p.pombal_lat, lon: p.pombal_lon })
        setLocalNome(p.pombal_nome || 'Pombal')
      }
    } catch(e) { toast('Erro: '+e.message,'err') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const buscarPrevisao = useCallback(async (lat, lon, nome) => {
    setLoadingMeteo(true)
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,weathercode&timezone=auto`)
      const data = await res.json()
      setPrevisao(data); if(nome) setLocalNome(nome)
    } catch(e) { toast('Erro ao obter previsão','err') }
    finally { setLoadingMeteo(false) }
  }, [])

  useEffect(() => { if(coordsAtuais) buscarPrevisao(coordsAtuais.lat, coordsAtuais.lon) }, [coordsAtuais, buscarPrevisao])

  const pesquisarLocal = async () => {
    if (!pesquisa.trim()) return
    setLoadingMeteo(true)
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(pesquisa)}&count=1&language=pt`)
      const data = await res.json()
      const loc = data.results?.[0]
      if (!loc) { toast('Local não encontrado','warn'); return }
      setCoordsAtuais({ lat: loc.latitude, lon: loc.longitude })
      buscarPrevisao(loc.latitude, loc.longitude, `${loc.name}${loc.admin1?', '+loc.admin1:''}`)
    } catch(e) { toast('Erro na pesquisa','err') }
    finally { setLoadingMeteo(false) }
  }

  const analisarRota = async () => {
    const prova = provas.find(p => p.id === provaRota)
    if (!prova?.lat_solta || !prova?.lon_solta) { toast('A prova seleccionada não tem coordenadas GPS de solta','warn'); return }
    if (!perfil?.pombal_lat || !perfil?.pombal_lon) { toast('Defina as coordenadas GPS do pombal em Perfil','warn'); return }
    setLoadingRota(true)
    setPontoExpandido(null) // Resetar expansão ao carregar nova rota
    try {
      const pts = pontosTrajeto(parseFloat(prova.lat_solta), parseFloat(prova.lon_solta), perfil.pombal_lat, perfil.pombal_lon, nPontos)
      const dataStr = prova.data_reg.slice(0,10)
      const rumo = calcRumo(parseFloat(prova.lat_solta), parseFloat(prova.lon_solta), perfil.pombal_lat, perfil.pombal_lon)
      const horaSolta = (prova.hora_solta || '08:00').slice(0,2)
      
      // --- CALCULAR DISTÂNCIAS ACUMULADAS (em linha reta) ---
      let distAcumulada = 0
      const kmPorPonto = []
      for(let k=1; k < pts.length; k++) {
        const p1 = pts[k-1];
        const p2 = pts[k];
        // Fórmula de Haversine simplificada para distância entre dois pontos GPS
        const R = 6371; // Raio Terra em km
        const dLat = (p2.lat - p1.lat) * Math.PI / 180;
        const dLon = (p2.lon - p1.lon) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        distAcumulada += R * c;
        kmPorPonto.push(distAcumulada);
      }
      // Inserir Km 0 no ponto 0 (Solta) e deslocar os restantes
      kmPorPonto.unshift(0);

      const resultados = await Promise.all(pts.map(async (pt, index) => {
        const hoje = new Date().toISOString().slice(0,10)
        const endpoint = dataStr < hoje
          ? `https://archive-api.open-meteo.com/v1/archive?latitude=${pt.lat}&longitude=${pt.lon}&hourly=temperature_2m,windspeed_10m,winddirection_10m,precipitation&start_date=${dataStr}&end_date=${dataStr}`
          : `https://api.open-meteo.com/v1/forecast?latitude=${pt.lat}&longitude=${pt.lon}&hourly=temperature_2m,windspeed_10m,winddirection_10m,precipitation&start_date=${dataStr}&end_date=${dataStr}&timezone=auto`
        const res = await fetch(endpoint)
        const data = await res.json()
        
        // ALTERAÇÃO 1: Guardar dados horários completos
        const hourly = data.hourly || {}
        const idx = hourly.time?.findIndex(t => t.slice(11,13) === horaSolta) ?? 0
        
        const vento = hourly.windspeed_10m?.[idx] ?? null
        const dir = hourly.winddirection_10m?.[idx] ?? null
        const temp = hourly.temperature_2m?.[idx] ?? null
        const precip = hourly.precipitation?.[idx] ?? 0
        const classVento = (vento!==null && dir!==null) ? classificarVento(rumo, dir) : null
        
        // ALTERAÇÃO 2: Geocoding reverso
        let localidade = null
        if(index > 0 && index < pts.length - 1) { // Apenas pontos intermédios
          try {
            const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${pt.lat}&longitude=${pt.lon}&language=pt`)
            const geoData = await geoRes.json()
            if(geoData.results?.[0]) {
              const loc = geoData.results[0]
              localidade = loc.name || loc.admin1 || null
            }
          } catch (e) { /* falha silenciosa no geocoding reverso */ }
        }

        // ALTERAÇÃO 3: Km acumulado + Dados horários completos
        return { 
          ...pt, 
          vento, dir, temp, precip, classVento,
          kmAcumulado: kmPorPonto[index] || 0,
          localidade,
          dadosHorarios: { // Guarda tudo para o gráfico/expansão
            horas: hourly.time || [],
            temperaturas: hourly.temperature_2m || [],
            ventos: hourly.windspeed_10m || [],
            chuvas: hourly.precipitation || []
          }
        }
      }))
      setDadosRota({ prova, pontos: resultados, rumo })
    } catch(e) { toast('Erro ao analisar rota: '+e.message,'err') }
    finally { setLoadingRota(false) }
  }

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:60 }}><Spinner lg /></div>

  return (
    <div>
      <div className="section-header">
        <div><div className="section-title">Meteorologia</div><div className="section-sub">{tab==='local' ? (localNome||'Pesquise um local') : 'Rota da Prova'}</div></div>
      </div>

      <div style={{ display:'flex', gap:4, background:'#101F40', borderRadius:8, padding:4, marginBottom:16 }}>
        {[['local','🌦️ Previsão Local'],['rota','🏁 Rota da Prova']].map(([t,l]) => (
          <button key={t} onClick={() => setTab(t)} style={{ flex:1, padding:'8px 14px', borderRadius:6, fontSize:13, fontWeight:500, cursor:'pointer', border:'none', fontFamily:'inherit', background:tab===t?'#1E5FD9':'none', color:tab===t?'#fff':'#94a3b8' }}>{l}</button>
        ))}
      </div>

      {tab==='local' && (
        <div>
          <div className="card card-p mb-6">
            <div style={{ display:'flex', gap:8, marginBottom:10 }}>
              <input className="input" placeholder="Pesquisar localidade..." value={pesquisa} onChange={e => setPesquisa(e.target.value)} onKeyDown={e => e.key==='Enter' && pesquisarLocal()} />
              <button className="btn btn-primary" onClick={pesquisarLocal} disabled={loadingMeteo}>{loadingMeteo ? <Spinner /> : '🔍'}</button>
            </div>
            {perfil?.pombal_lat
              ? <button className="btn btn-secondary btn-sm" onClick={() => { setCoordsAtuais({ lat:perfil.pombal_lat, lon:perfil.pombal_lon }); buscarPrevisao(perfil.pombal_lat, perfil.pombal_lon, perfil.pombal_nome||'Pombal') }}>🏠 Usar localização do meu pombal</button>
              : <div style={{ fontSize:12, color:'#7A8699' }}>Defina as coordenadas GPS do pombal em Perfil para acesso rápido.</div>
            }
          </div>

          {!previsao ? (
            <EmptyState icon="🌦️" title="Sem previsão" desc="Pesquise uma localidade para ver a previsão de 7 dias" />
          ) : (
            <div>
              <div className="grid-2" style={{ marginBottom:16 }}>
                {previsao.daily?.time?.slice(0,2).map((dia,i) => (
                  <div key={i} className="card card-p" style={{ textAlign:'center' }}>
                    <div style={{ fontSize:12, color:'#94a3b8', marginBottom:4 }}>{i===0?'Hoje':new Date(dia).toLocaleDateString('pt-PT',{weekday:'long'})}</div>
                    <div style={{ fontSize:36 }}>{ICONES_WMO[previsao.daily.weathercode[i]]||'🌡️'}</div>
                    <div style={{ fontFamily:"'Fraunces',serif", fontSize:24, fontWeight:700, color:'#fff' }}>{Math.round(previsao.daily.temperature_2m_max[i])}° / {Math.round(previsao.daily.temperature_2m_min[i])}°</div>
                    <div style={{ fontSize:11, color:'#7A8699' }}>{descWMO(previsao.daily.weathercode[i])}</div>
                    <div style={{ fontSize:11, color:'#4C8DFF', marginTop:4 }}>💨 {Math.round(previsao.daily.windspeed_10m_max[i])}km/h</div>
                    {(() => { const av=avaliarVoo(previsao.daily.windspeed_10m_max[i],previsao.daily.precipitation_sum[i],previsao.daily.weathercode[i]); return <div style={{ fontSize:11, color:av.cor, fontWeight:600, marginTop:6 }}>🕊️ {av.txt}</div> })()}
                  </div>
                ))}
              </div>
              <div className="card card-p">
                <div style={{ fontWeight:600, color:'#fff', marginBottom:12 }}>📅 Previsão 7 Dias</div>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {previsao.daily?.time?.map((dia,i) => {
                    const av=avaliarVoo(previsao.daily.windspeed_10m_max[i],previsao.daily.precipitation_sum[i],previsao.daily.weathercode[i])
                    return (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 10px', background:'#101F40', borderRadius:8 }}>
                        <div style={{ fontSize:11, color:'#94a3b8', width:70 }}>{new Date(dia).toLocaleDateString('pt-PT',{weekday:'short',day:'2-digit'})}</div>
                        <div style={{ fontSize:20 }}>{ICONES_WMO[previsao.daily.weathercode[i]]||'🌡️'}</div>
                        <div style={{ flex:1, fontSize:12, color:'#cbd5e1' }}>{descWMO(previsao.daily.weathercode[i])}</div>
                        <div style={{ fontSize:12, color:'#fff', fontWeight:600 }}>{Math.round(previsao.daily.temperature_2m_max[i])}°/{Math.round(previsao.daily.temperature_2m_min[i])}°</div>
                        <div style={{ fontSize:11, color:'#4C8DFF', width:50, textAlign:'right' }}>{Math.round(previsao.daily.windspeed_10m_max[i])}km/h</div>
                        <div style={{ fontSize:10, color:av.cor, fontWeight:700, width:90, textAlign:'right' }}>{av.txt}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab==='rota' && (
        <div>
          <div className="card card-p mb-6">
            <div style={{ fontSize:13, color:'#94a3b8', marginBottom:12 }}>Seleccione uma prova para ver as condições meteorológicas ao longo da rota de voo, desde o local de solta até ao pombal.</div>
            {!perfil?.pombal_lat && <div style={{ background:'rgba(212,175,55,.08)', border:'1px solid rgba(212,175,55,.2)', borderRadius:8, padding:'10px 14px', marginBottom:12, fontSize:12, color:'#D4AF37' }}>⚠️ Defina as coordenadas GPS do pombal em Perfil para activar esta funcionalidade.</div>}
            <div className="form-grid">
              <div className="col-2">
                <div style={{ fontSize:10, color:'#7A8699', marginBottom:4, fontWeight:600, letterSpacing:.5 }}>PROVA</div>
                <select className="input" value={provaRota} onChange={e => { setProvaRota(e.target.value); setDadosRota(null); setPontoExpandido(null) }}>
                  <option value="">— Seleccionar prova —</option>
                  {provas.filter(p => p.lat_solta && p.lon_solta).map(p => <option key={p.id} value={p.id}>{p.nome} ({p.tipo} · {p.dist}km)</option>)}
                  {provas.filter(p => !p.lat_solta || !p.lon_solta).length > 0 && <optgroup label="Sem GPS (não disponíveis)">{provas.filter(p => !p.lat_solta || !p.lon_solta).map(p => <option key={p.id} disabled>{p.nome} — sem coordenadas GPS</option>)}</optgroup>}
                </select>
              </div>
              <div>
                <div style={{ fontSize:10, color:'#7A8699', marginBottom:4, fontWeight:600, letterSpacing:.5 }}>Nº PONTOS INTERMÉDIOS</div>
                <select className="input" value={nPontos} onChange={e => setNPontos(parseInt(e.target.value))}>
                  {[2,3,4,5].map(n => <option key={n} value={n}>{n} pontos ({n+2} análises no total)</option>)}
                </select>
              </div>
            </div>
            <button className="btn btn-primary" style={{ marginTop:12 }} onClick={analisarRota} disabled={loadingRota||!provaRota||!perfil?.pombal_lat}>{loadingRota ? <Spinner /> : '🔍'} Analisar Rota</button>
          </div>

          {loadingRota && <div style={{ textAlign:'center', padding:40 }}><Spinner lg /><div style={{ fontSize:12, color:'#7A8699', marginTop:12 }}>A consultar {nPontos+2} pontos ao longo da rota...</div></div>}

          {dadosRota && !loadingRota && (
            <div>
              <div style={{ fontSize:12, color:'#94a3b8', marginBottom:12 }}>
                Rumo de voo: <strong style={{ color:'#cbd5e1' }}>{Math.round(dadosRota.rumo)}°</strong> · {dadosRota.prova.dist}km · condições na hora de solta ({dadosRota.prova.hora_solta||'08:00'})
              </div>

              {/* Resumo geral da rota */}
              {(() => {
                const comVento = dadosRota.pontos.filter(p => p.classVento)
                const nCauda = comVento.filter(p => p.classVento.tipo==='Vento de Cauda').length
                const nProa = comVento.filter(p => p.classVento.tipo==='Vento de Proa').length
                const cor = nCauda > nProa ? '#2DD4A7' : nProa > nCauda ? '#f87171' : '#D4AF37'
                const txt = nCauda > nProa ? 'Maioria do trajeto com vento favorável' : nProa > nCauda ? 'Maioria do trajeto com vento contra' : 'Condições mistas ao longo da rota'
                return (
                  <div style={{ background:`${cor}14`, border:`1px solid ${cor}40`, borderRadius:8, padding:'10px 14px', marginBottom:14, display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:20 }}>{nCauda>nProa?'⬆️':nProa>nCauda?'⬇️':'↔️'}</span>
                    <div style={{ fontSize:13, color:cor, fontWeight:600 }}>{txt}</div>
                  </div>
                )
              })()}

              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {dadosRota.pontos.map((pt, i) => (
                  <div key={i} className="card card-p" style={{ cursor: 'pointer' }} onClick={() => setPontoExpandido(pontoExpandido === i ? null : i)}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ fontSize:13, fontWeight:600, color:'#fff' }}>{pt.label}</div>
                          {/* KM ACUMULADO & LOCALIDADE */}
                          {pt.kmAcumulado > 0 && (
                            <div style={{ fontSize:10, color:'#94a3b8', background:'#101F40', padding:'0 6px', borderRadius:4 }}>
                              {pt.kmAcumulado.toFixed(1)} km
                            </div>
                          )}
                          {pt.localidade && (
                            <div style={{ fontSize:10, color:'#4C8DFF', background:'rgba(76, 141, 255, 0.1)', padding:'0 6px', borderRadius:4 }}>
                              {pt.localidade}
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize:11, color:'#7A8699' }}>
                          {pt.temp!==null ? `${pt.temp}°C` : '—'} · 💨 {pt.vento!==null ? `${pt.vento}km/h` : '—'}
                          {pt.precip>0 ? ` · 🌧️ ${pt.precip}mm` : ''}
                        </div>
                      </div>
                      {pt.classVento && (
                        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:600, color:pt.classVento.cor }}>
                          <span style={{ fontSize:16 }}>{pt.classVento.icon}</span>
                          {pt.classVento.tipo}
                        </div>
                      )}
                    </div>

                    {/* CONTEÚDO EXPANSÍVEL: Evolução ao longo do dia */}
                    {pontoExpandido === i && pt.dadosHorarios && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 8 }}>Evolução horária (temperatura e vento):</div>
                        <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:4 }}>
                          {pt.dadosHorarios.horas.map((h, idx) => {
                            // Mostrar apenas das 6h às 20h para não poluir
                            const hour = parseInt(h.slice(11,13))
                            if (hour < 6 || hour > 20) return null
                            return (
                              <div key={idx} style={{ 
                                minWidth: 36, textAlign: 'center', padding: '4px 2px',
                                background: idx === pt.dadosHorarios.horas.findIndex(t => t.slice(11,13) === (provaRota.hora_solta || '08:00').slice(0,2)) ? '#1E5FD9' : 'transparent',
                                borderRadius: 4
                              }}>
                                <div style={{ fontSize: 8, color: '#94a3b8' }}>{h.slice(11,13)}h</div>
                                <div style={{ fontSize: 10, fontWeight: 600, color: '#fff' }}>
                                  {Math.round(pt.dadosHorarios.temperaturas[idx] || 0)}°
                                </div>
                                <div style={{ fontSize: 8, color: '#4C8DFF' }}>
                                  {Math.round(pt.dadosHorarios.ventos[idx] || 0)}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        <div style={{ fontSize: 9, color: '#7A8699', marginTop: 4, display:'flex', justifyContent:'space-between' }}>
                          <span>⬆️ Temp (°C)</span>
                          <span>💨 Vento (km/h) ➡️</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!dadosRota && !loadingRota && provaRota && (
            <EmptyState icon="🏁" title="Rota não analisada" desc="Clique em 'Analisar Rota' para ver as condições ao longo do trajeto" />
          )}
          {!dadosRota && !loadingRota && !provaRota && (
            <EmptyState icon="🏁" title="Seleccione uma prova" desc="Escolha uma prova com coordenadas GPS de solta para analisar as condições da rota" />
          )}
        </div>
      )}
    </div>
  )
}
