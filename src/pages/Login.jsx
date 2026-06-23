import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useToast, Spinner, Field, Modal } from '../components/ui'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const toast = useToast()
  const [mode, setMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', nome: '' })
  const [termosAceites, setTermosAceites] = useState(false)
  const [showTermos, setShowTermos] = useState(false)
  const [showPrivacidade, setShowPrivacidade] = useState(false)
  const sf = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(form.email, form.password)
        // O useAuth detecta a sessão e o AppContent mostra o AppLayout automaticamente
      } else {
        if (!form.nome.trim()) { toast('Nome obrigatório', 'warn'); setLoading(false); return }
        if (!termosAceites) { toast('Deve aceitar os Termos e Política de Privacidade', 'warn'); setLoading(false); return }
        await signUp(form.email, form.password, { nome: form.nome })
        // Login automático após registo
        try {
          await signIn(form.email, form.password)
        } catch {
          // Se email confirmação obrigatória, mostrar mensagem
          toast('Conta criada! Verifique o seu email para activar.', 'ok')
          setMode('login')
        }
      }
    } catch (err) {
      const m = err.message?.includes('Invalid login') ? 'Email ou password incorrectos'
        : err.message?.includes('already registered') ? 'Email já registado'
        : err.message?.includes('Email not confirmed') ? 'Email não confirmado — verifique a caixa de entrada'
        : err.message || 'Erro desconhecido'
      toast(m, 'err')
    } finally { setLoading(false) }
  }

  const ModalLegal = ({ open, onClose, title, children }) => (
    open ? (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ background: '#141f2e', border: '1px solid #1e3050', borderRadius: 20, width: '100%', maxWidth: 500, maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e3050', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 600, color: '#fff' }}>{title}</div>
            <button className="btn btn-icon" onClick={onClose}>✕</button>
          </div>
          <div style={{ padding: '20px', overflowY: 'auto', fontSize: 13, color: '#94a3b8', lineHeight: 1.7 }}>{children}</div>
          <div style={{ padding: '12px 20px', borderTop: '1px solid #1e3050' }}>
            <button className="btn btn-primary w-full" style={{ justifyContent: 'center' }}
              onClick={() => { setTermosAceites(true); onClose() }}>✅ Aceitar e Fechar</button>
          </div>
        </div>
      </div>
    ) : null
  )

  return (
    <div className="login-page">
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(30,217,138,.06) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(30,217,138,.04) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      <div className="login-card" style={{ position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, background: 'rgba(30,217,138,.1)', border: '1px solid rgba(30,217,138,.2)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 12px' }}>🕊️</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>ChampionsLoft</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Gestão Columbófila Profissional</div>
        </div>

        <div className="tab-switcher">
          <button className={`tab-btn${mode === 'login' ? ' active' : ''}`} onClick={() => setMode('login')}>Entrar</button>
          <button className={`tab-btn${mode === 'register' ? ' active' : ''}`} onClick={() => setMode('register')}>Criar conta</button>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'register' && (
            <Field label="Nome *">
              <input className="input" placeholder="O seu nome" value={form.nome} onChange={e => sf('nome', e.target.value)} required />
            </Field>
          )}
          <Field label="Email *">
            <input className="input" type="email" placeholder="email@exemplo.pt" value={form.email} onChange={e => sf('email', e.target.value)} required autoComplete="email" />
          </Field>
          <Field label="Password *">
            <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={e => sf('password', e.target.value)} required minLength={6} />
          </Field>
          {mode === 'register' && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <input type="checkbox" id="termos" checked={termosAceites} onChange={e => setTermosAceites(e.target.checked)}
                style={{ marginTop: 2, flexShrink: 0, accentColor: '#1ed98a', width: 16, height: 16 }} />
              <label htmlFor="termos" style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>
                Aceito os{' '}
                <button type="button" onClick={() => setShowTermos(true)} style={{ background: 'none', border: 'none', color: '#1ed98a', cursor: 'pointer', fontSize: 12, textDecoration: 'underline', padding: 0 }}>Termos de Utilização</button>
                {' '}e a{' '}
                <button type="button" onClick={() => setShowPrivacidade(true)} style={{ background: 'none', border: 'none', color: '#1ed98a', cursor: 'pointer', fontSize: 12, textDecoration: 'underline', padding: 0 }}>Política de Privacidade</button>
              </label>
            </div>
          )}
          <button type="submit" className="btn btn-primary w-full" style={{ justifyContent: 'center', marginTop: 4 }} disabled={loading}>
            {loading ? <Spinner /> : null}
            {mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>
      </div>

      <ModalLegal open={showTermos} onClose={() => setShowTermos(false)} title="📋 Termos de Utilização">
        <p><strong style={{ color: '#fff' }}>1. Aceitação dos Termos</strong></p>
        <p>Ao utilizar o ChampionsLoft, o utilizador aceita os presentes Termos de Utilização.</p>
        <p style={{ marginTop: 12 }}><strong style={{ color: '#fff' }}>2. Descrição do Serviço</strong></p>
        <p>O ChampionsLoft é uma plataforma de gestão columbófila que permite registar e gerir pombos, provas, saúde, reprodução e financeiro.</p>
        <p style={{ marginTop: 12 }}><strong style={{ color: '#fff' }}>3. Conta de Utilizador</strong></p>
        <p>O utilizador é responsável pela confidencialidade das suas credenciais e por todas as actividades realizadas na sua conta.</p>
        <p style={{ marginTop: 12 }}><strong style={{ color: '#fff' }}>4. Dados e Privacidade</strong></p>
        <p>Os dados introduzidos são armazenados de forma segura. O ChampionsLoft não partilha dados pessoais com terceiros sem consentimento expresso.</p>
        <p style={{ marginTop: 12 }}><strong style={{ color: '#fff' }}>5. Propriedade Intelectual</strong></p>
        <p>Todo o software, design e conteúdo do ChampionsLoft são propriedade dos seus criadores e estão protegidos por direitos de autor.</p>
        <p style={{ marginTop: 12 }}><strong style={{ color: '#fff' }}>6. Limitação de Responsabilidade</strong></p>
        <p>O ChampionsLoft não se responsabiliza por perdas de dados resultantes de uso indevido ou falhas técnicas fora do controlo da plataforma.</p>
        <p style={{ marginTop: 12, color: '#475569', fontSize: 11 }}>Última actualização: Abril 2026</p>
      </ModalLegal>

      <ModalLegal open={showPrivacidade} onClose={() => setShowPrivacidade(false)} title="🔒 Política de Privacidade">
        <p><strong style={{ color: '#fff' }}>1. Dados Recolhidos</strong></p>
        <p>Recolhemos apenas os dados necessários: nome, email, dados dos pombos e actividade columbófila introduzida pelo utilizador.</p>
        <p style={{ marginTop: 12 }}><strong style={{ color: '#fff' }}>2. Utilização dos Dados</strong></p>
        <p>Os dados são utilizados exclusivamente para fornecer as funcionalidades da plataforma e melhorar a experiência do utilizador.</p>
        <p style={{ marginTop: 12 }}><strong style={{ color: '#fff' }}>3. Armazenamento Seguro</strong></p>
        <p>Todos os dados são armazenados em servidores seguros com encriptação, utilizando o Supabase em conformidade com o RGPD.</p>
        <p style={{ marginTop: 12 }}><strong style={{ color: '#fff' }}>4. Partilha de Dados</strong></p>
        <p>Não vendemos nem partilhamos os seus dados pessoais com terceiros para fins comerciais.</p>
        <p style={{ marginTop: 12 }}><strong style={{ color: '#fff' }}>5. Direitos do Utilizador</strong></p>
        <p>Tem o direito de aceder, corrigir ou eliminar os seus dados a qualquer momento através das definições da conta.</p>
        <p style={{ marginTop: 12 }}><strong style={{ color: '#fff' }}>6. Cookies</strong></p>
        <p>Utilizamos apenas cookies essenciais para manter a sessão activa. Sem cookies de rastreamento ou publicidade.</p>
        <p style={{ marginTop: 12, color: '#475569', fontSize: 11 }}>Última actualização: Abril 2026 · Conforme RGPD</p>
      </ModalLegal>
    </div>
  )
}
