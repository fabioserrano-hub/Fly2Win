export default function PaginaSucesso() {
  const params = new URLSearchParams(window.location.search)
  const plano = params.get('plano') || 'base'
  const planoNomes = {
    base: 'Base', profissional: 'Profissional', elite: 'Elite AI',
    pro_grupo_1_5: 'Pro Grupo', pro_grupo_6_12: 'Pro Grupo', pro_grupo_13: 'Pro Grupo',
    elite_grupo_1_5: 'Elite AI Grupo', elite_grupo_6_12: 'Elite AI Grupo', elite_grupo_13: 'Elite AI Grupo',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f14', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 80, marginBottom: 24 }}>🎉</div>
        <div style={{ fontFamily: 'Barlow Condensed', fontSize: 36, fontWeight: 700, color: '#1ed98a', marginBottom: 8 }}>
          Subscrição Activada!
        </div>
        <div style={{ fontSize: 16, color: '#cbd5e1', marginBottom: 8 }}>
          Plano <strong style={{ color: '#fff' }}>{planoNomes[plano] || plano}</strong> activado com sucesso.
        </div>
        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 32 }}>
          Bem-vindo ao Fly2Win! A tua licença está activa.
        </div>
        <div style={{ background: '#141f2e', border: '1px solid rgba(30,217,138,.2)', borderRadius: 16, padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {['Acesso a todos os módulos do plano', 'Dados sincronizados em tempo real', 'Suporte disponível quando precisares'].map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14, color: '#cbd5e1' }}>
                <span style={{ color: '#1ed98a' }}>✓</span>{f}
              </div>
            ))}
          </div>
        </div>
        <button onClick={() => window.location.href = '/'}
          style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: '#1ed98a', color: '#0a0f14', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          🕊️ Entrar no Fly2Win
        </button>
      </div>
    </div>
  )
}
