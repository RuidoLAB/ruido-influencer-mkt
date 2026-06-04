import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Roster from './components/Roster'
import Campanas from './components/Campanas'
import VistaCliente from './components/VistaCliente'
import './index.css'

function Placeholder({ title }) {
  return (
    <div style={{ padding: '40px 24px', color: '#AAA', fontSize: 14 }}>
      {title} — próximamente
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState('roster')
  const [publicToken, setPublicToken] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) setPublicToken(token)
  }, [])

  function handleShareCamp(camp) {
    setPage('campanas')
  }

  if (publicToken) {
    return <VistaCliente token={publicToken} />
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F7F7F5' }}>
      <Sidebar page={page} setPage={setPage} />
      <main style={{ flex: 1, minWidth: 0 }}>
        {page === 'dashboard' && <Placeholder title="Dashboard" />}
        {page === 'roster' && <Roster />}
        {page === 'campanas' && <Campanas onShareCamp={handleShareCamp} />}
      </main>
    </div>
  )
}
