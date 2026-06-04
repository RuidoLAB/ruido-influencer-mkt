import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Roster from './components/Roster'
import Campanas from './components/Campanas'
import VistaCliente from './components/VistaCliente'
import './index.css'

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [publicToken, setPublicToken] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) setPublicToken(token)
  }, [])

  if (publicToken) {
    return <VistaCliente token={publicToken} />
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F7F7F5' }}>
      <Sidebar page={page} setPage={setPage} />
      <main style={{ flex: 1, minWidth: 0 }}>
        {page === 'dashboard' && <Dashboard onNavigate={setPage} />}
        {page === 'roster' && <Roster />}
        {page === 'campanas' && <Campanas />}
      </main>
    </div>
  )
}
