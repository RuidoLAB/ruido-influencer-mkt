import { useState, useEffect } from 'react'
import Login from './components/Login'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Roster from './components/Roster'
import Campanas from './components/Campanas'
import VistaCliente from './components/VistaCliente'
import './index.css'

export default function App() {
  const [auth, setAuth] = useState(false)
  const [page, setPage] = useState('dashboard')
  const [publicToken, setPublicToken] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) {
      setPublicToken(token)
      return
    }
    const saved = localStorage.getItem('ruido_auth')
    if (saved === 'true') setAuth(true)
  }, [])

  function handleLogout() {
    localStorage.removeItem('ruido_auth')
    setAuth(false)
  }

  if (publicToken) return <VistaCliente token={publicToken} />
  if (!auth) return <Login onLogin={() => setAuth(true)} />

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F7F7F5' }}>
      <Sidebar page={page} setPage={setPage} onLogout={handleLogout} />
      <main style={{ flex: 1, minWidth: 0 }}>
        {page === 'dashboard' && <Dashboard onNavigate={setPage} />}
        {page === 'roster' && <Roster />}
        {page === 'campanas' && <Campanas />}
      </main>
    </div>
  )
}
