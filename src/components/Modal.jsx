export default function Modal({ open, onClose, title, children }) {
  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
        zIndex: 200, display: 'flex', alignItems: 'flex-start',
        justifyContent: 'center', paddingTop: 60,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#fff', border: '0.5px solid #E5E5E2',
        borderRadius: 16, width: '100%', maxWidth: 480,
        maxHeight: '85vh', overflowY: 'auto',
        boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
      }}>
        <div style={{
          padding: '18px 20px', borderBottom: '0.5px solid #F0F0EE',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 500 }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 7,
              border: '0.5px solid #E5E5E2', background: 'transparent',
              cursor: 'pointer', fontSize: 14, color: '#888',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
        </div>
        <div style={{ padding: '18px 20px' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
