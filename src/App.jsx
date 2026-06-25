import { useState, useEffect } from 'react'
import Login from './components/Login'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Roster from './components/Roster'
import Campanas from './components/Campanas'
import Clientes from './components/Clientes'
import ClienteDashboard from './components/ClienteDashboard'
import VistaCliente from './components/VistaCliente'
import VistaReporte from './components/VistaReporte'
import VistaClienteDashboard from './components/VistaClienteDashboard'
import './index.css'

export default function App() {
  const [auth, setAuth] = useState(false)
  const [page, setPage] = useState('dashboard')
  const [publicToken, setPublicToken] = useState(null)
  const [reportToken, setReportToken] = useState(null)
  const [clientDashboardToken, setClientDashboardToken] = useState(null)
  const [selectedClient, setSelectedClient] = useState(null)
  const [campanaFromClient, setCampanaFromClient] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const report = params.get('report')
    const clientDash = params.get('clientDashboard')
    if (token) { setPublicToken(token); return }
    if (report) { setReportToken(report); return }
    if (clientDash) { setClientDashboardToken(clientDash); return }
    const saved = localStorage.getItem('ruido_auth')
    if (saved === 'true') setAuth(true)
  }, [])

  function handleLogout() {
    localStorage.removeItem('ruido_auth')
    setAuth(false)
  }

  function handleSelectCliente(client) {
    setSelectedClient(client)
    setPage('cliente-detail')
  }

  function handleOpenCampanaFromClient(camp) {
    setCampanaFromClient(camp)
    setPage('campanas')
  }

  // Vistas públicas — sin login
  if (publicToken) return <VistaCliente token={publicToken} />
  if (reportToken) return <VistaReporte token={reportToken} />
  if (clientDashboardToken) return <VistaClienteDashboard token={clientDashboardToken} />

  if (!auth) return <Login onLogin={() => setAuth(true)} />

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F7F7F5' }}>
      <Sidebar page={page} setPage={(p) => {
        setSelectedClient(null)
        setCampanaFromClient(null)
        setPage(p)
      }} onLogout={handleLogout} />
      <main style={{ flex: 1, minWidth: 0 }}>
        {page === 'dashboard' && <Dashboard onNavigate={setPage} />}
        {page === 'roster' && <Roster />}
        {page === 'campanas' && <Campanas initialCamp={campanaFromClient} />}
        {page === 'clientes' && (
          <Clientes onSelectCliente={handleSelectCliente} />
        )}
        {page === 'cliente-detail' && selectedClient && (
          <ClienteDashboard
            client={selectedClient}
            onBack={() => setPage('clientes')}
            onOpenCampaign={handleOpenCampanaFromClient}
          />
        )}
      </main>
    </div>
  )
}
