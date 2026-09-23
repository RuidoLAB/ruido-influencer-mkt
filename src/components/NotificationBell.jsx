import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function tiempoRelativo(fecha) {
  const seg = Math.floor((Date.now() - new Date(fecha).getTime()) / 1000)
  if (seg < 60) return 'ahora'
  if (seg < 3600) return `hace ${Math.floor(seg / 60)} min`
  if (seg < 86400) return `hace ${Math.floor(seg / 3600)} h`
  return `hace ${Math.floor(seg / 86400)} d`
}

export default function NotificationBell() {
  const navigate = useNavigate()
  const [notifs, setNotifs] = useState([])
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const load = async () => {
    const { data } = await supabase
      .from('notificaciones')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30)
    setNotifs(data || [])
  }

  useEffect(() => {
    load()
    const ch = supabase.channel('notificaciones-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notificaciones' }, load)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  useEffect(() => {
    const onClickOutside = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const noLeidas = notifs.filter(n => !n.leida)

  const marcarLeida = async n => {
    await supabase.from('notificaciones').update({ leida: true }).eq('id', n.id)
    if (n.cliente_id) navigate(`/clientes/${n.cliente_id}`)
    setOpen(false)
  }

  const marcarTodasLeidas = async () => {
    const ids = noLeidas.map(n => n.id)
    if (ids.length === 0) return
    await supabase.from('notificaciones').update({ leida: true }).in('id', ids)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          position: 'relative', background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-sub)', fontSize: '18px', padding: '4px', lineHeight: 1,
        }}
        title="Notificaciones"
      >
        🔔
        {noLeidas.length > 0 && (
          <span style={{
            position: 'absolute', top: '-2px', right: '-4px',
            background: 'var(--red)', color: '#fff', borderRadius: '100px',
            fontSize: '10px', fontWeight: 700, minWidth: '16px', height: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px',
          }}>
            {noLeidas.length > 9 ? '9+' : noLeidas.length}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '28px', left: 0, zIndex: 50,
          width: '320px', maxHeight: '400px', overflowY: 'auto',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-sub)' }}>Notificaciones</span>
            {noLeidas.length > 0 && (
              <button onClick={marcarTodasLeidas} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer' }}>
                Marcar todas leídas
              </button>
            )}
          </div>

          {notifs.length === 0
            ? <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>Sin notificaciones</div>
            : notifs.map(n => (
              <div key={n.id}
                onClick={() => marcarLeida(n)}
                style={{
                  padding: '10px 14px', cursor: 'pointer',
                  borderBottom: '1px solid var(--border)',
                  background: n.leida ? 'transparent' : 'var(--accent-dim)',
                  display: 'flex', gap: '8px', alignItems: 'flex-start',
                }}>
                {!n.leida && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', marginTop: '5px', flexShrink: 0 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.4 }}>{n.mensaje}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{tiempoRelativo(n.created_at)}</div>
                </div>
              </div>
            ))
          }
        </div>
      )}
    </div>
  )
}
