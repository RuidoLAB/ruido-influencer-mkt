import { useState } from 'react'
import supabase from '../lib/supabaseClient'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email o contraseña incorrectos.')
      setPassword('')
    } else {
      onLogin()
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#F7F7F5',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff', border: '0.5px solid #E5E5E2',
        borderRadius: 16, padding: '36px 32px', width: '100%', maxWidth: 360,
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{
            width: 32, height: 32, background: '#E8313A', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: '#fff',
          }}>K</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>KOLINSET</div>
            <div style={{ fontSize: 11, color: '#AAA' }}>Influencer MKT</div>
          </div>
        </div>

        <h1 style={{ fontSize: 18, fontWeight: 500, marginBottom: 6 }}>Bienvenido</h1>
        <p style={{ fontSize: 13, color: '#AAA', marginBottom: 24 }}>Ingresá con tu cuenta para acceder.</p>

        <form onSubmit={handleSubmit}>
          <div className="fg">
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              placeholder="nombre@kolinset.com"
              autoFocus
            />
          </div>

          <div className="fg">
            <label className="label">Contraseña</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              placeholder="••••••••"
              style={{
                borderColor: error ? '#E8313A' : undefined,
                background: error ? '#FCEBEB' : undefined,
              }}
            />
            {error && (
              <div style={{ fontSize: 12, color: '#A32D2D', marginTop: 4 }}>
                {error}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn-red"
            disabled={loading || !password || !email}
            style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
          >
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
