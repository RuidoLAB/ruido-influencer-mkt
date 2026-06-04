export default function Sidebar({ page, setPage }) {
  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: '◈' },
    { id: 'roster', label: 'Roster', icon: '◉' },
    { id: 'campanas', label: 'Campañas', icon: '◎' },
  ]

  return (
    <aside style={{
      width: 208, background: '#fff', borderRight: '0.5px solid #E5E5E2',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      minHeight: '100vh',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px', borderBottom: '0.5px solid #E5E5E2', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 28, height: 28, background: '#E8313A', borderRadius: 7,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
        }}>R</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>RUIDO</div>
          <div style={{ fontSize: 11, color: '#AAA' }}>Influencer MKT</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '8px 0' }}>
        {items.map(item => (
          <div
            key={item.id}
            onClick={() => setPage(item.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px', margin: '1px 6px', borderRadius: 8,
              cursor: 'pointer', fontSize: 13,
              background: page === item.id ? '#FCEBEB' : 'transparent',
              color: page === item.id ? '#A32D2D' : '#666',
              transition: 'all .12s',
            }}
          >
            <span style={{ fontSize: 15, width: 16, textAlign: 'center' }}>{item.icon}</span>
            {item.label}
          </div>
        ))}
      </nav>
    </aside>
  )
}
