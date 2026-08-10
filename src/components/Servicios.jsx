import { useState, useEffect } from 'react'
import sql from '../lib/db'
import Modal from './Modal'

function fmtPct(n) {
  return Number(n).toFixed(1).replace('.0', '') + '%'
}

const EMPTY_FORM = { nombre: '', descripcion: '', utilizable_pct: '100', activo: true }

export default function Servicios() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteModal, setDeleteModal] = useState(null)

  useEffect(() => { fetchServices() }, [])

  async function fetchServices() {
    setLoading(true)
    try {
      const data = await sql`
        SELECT s.*, COUNT(c.id) AS camp_count
        FROM services s
        LEFT JOIN campaigns c ON c.service_id = s.id
        GROUP BY s.id
        ORDER BY s.created_at ASC
      `
      setServices(data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  function openNew() {
    setForm(EMPTY_FORM)
    setEditId(null)
    setError('')
    setModalOpen(true)
  }

  function openEdit(s) {
    setForm({
      nombre: s.nombre,
      descripcion: s.descripcion || '',
      utilizable_pct: String(s.utilizable_pct),
      activo: s.activo,
    })
    setEditId(s.id)
    setError('')
    setModalOpen(true)
  }

  function validate() {
    if (!form.nombre.trim()) return 'El nombre es obligatorio.'
    const pct = parseFloat(form.utilizable_pct)
    if (isNaN(pct) || pct < 0 || pct > 100) return 'El porcentaje debe estar entre 0 y 100.'
    return ''
  }

  async function handleSave() {
    const err = validate()
    if (err) { setError(err); return }
    setSaving(true)
    setError('')
    try {
      const pct = parseFloat(form.utilizable_pct)
      if (editId) {
        await sql`
          UPDATE services SET
            nombre = ${form.nombre.trim()},
            descripcion = ${form.descripcion},
            utilizable_pct = ${pct},
            activo = ${form.activo}
          WHERE id = ${editId}
        `
      } else {
        await sql`
          INSERT INTO services (nombre, descripcion, utilizable_pct, activo)
          VALUES (${form.nombre.trim()}, ${form.descripcion}, ${pct}, ${form.activo})
        `
      }
      setModalOpen(false)
      await fetchServices()
    } catch (e) {
      if (e.message?.toLowerCase().includes('unique')) setError('Ya existe un servicio con ese nombre.')
      else console.error(e)
    }
    setSaving(false)
  }

  async function toggleActivo(s) {
    try {
      await sql`UPDATE services SET activo = ${!s.activo} WHERE id = ${s.id}`
      await fetchServices()
    } catch (e) { console.error(e) }
  }

  const margen = (() => {
    const pct = parseFloat(form.utilizable_pct)
    if (isNaN(pct)) return '—'
    return (100 - pct).toFixed(1).replace('.0', '') + '%'
  })()

  return (
    <div style={{ padding: '20px 24px', maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 500 }}>Servicios</h1>
          <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
            {services.filter(s => s.activo).length} activos · {services.length} en total
          </p>
        </div>
        <button className="btn-red" onClick={openNew}>+ Nuevo servicio</button>
      </div>

      {/* Tabla */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#AAA', fontSize: 13 }}>Cargando...</div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F7F7F5', borderBottom: '0.5px solid #E5E5E2' }}>
                <th className="th" style={{ width: 200 }}>Servicio</th>
                <th className="th" style={{ width: 120 }}>% Utilizable</th>
                <th className="th" style={{ width: 120 }}>Margen agencia</th>
                <th className="th" style={{ width: 100 }}>Campañas</th>
                <th className="th" style={{ width: 90 }}>Estado</th>
                <th className="th" style={{ width: 100 }}></th>
              </tr>
            </thead>
            <tbody>
              {services.map(s => {
                const margenPct = 100 - Number(s.utilizable_pct)
                return (
                  <tr key={s.id} style={{ borderBottom: '0.5px solid #F0F0EE', opacity: s.activo ? 1 : 0.5 }}>
                    <td className="td">
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{s.nombre}</div>
                      {s.descripcion && <div style={{ fontSize: 11, color: '#AAA', marginTop: 1 }}>{s.descripcion}</div>}
                    </td>
                    <td className="td">
                      <span style={{ fontWeight: 500, fontSize: 14 }}>{fmtPct(s.utilizable_pct)}</span>
                    </td>
                    <td className="td">
                      <span style={{ fontSize: 13, color: '#639922', fontWeight: 500 }}>{fmtPct(margenPct)}</span>
                    </td>
                    <td className="td">
                      <span style={{ fontSize: 13, color: '#888' }}>{s.camp_count}</span>
                    </td>
                    <td className="td">
                      <span style={{
                        background: s.activo ? '#EAF3DE' : '#F1EFE8',
                        color: s.activo ? '#27500A' : '#5F5E5A',
                        padding: '2px 9px', borderRadius: 20, fontSize: 11,
                      }}>{s.activo ? 'Activo' : 'Inactivo'}</span>
                    </td>
                    <td className="td">
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-icon" onClick={() => openEdit(s)} title="Editar">✎</button>
                        <button
                          className="btn-icon"
                          onClick={() => toggleActivo(s)}
                          title={s.activo ? 'Desactivar' : 'Activar'}
                          style={{ fontSize: 12 }}
                        >{s.activo ? '⏸' : '▶'}</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Info box */}
      <div style={{ marginTop: 20, padding: '12px 16px', background: '#F7F7F5', border: '0.5px solid #E5E5E2', borderRadius: 10, fontSize: 12, color: '#888' }}>
        <strong style={{ color: '#555' }}>¿Cómo funciona?</strong> — El % utilizable es el porcentaje del budget total que se destina al costo real de la campaña.
        El margen de agencia se calcula automáticamente como <code>100% − % utilizable</code>.
        Al crear una campaña, el porcentaje del servicio se guarda como snapshot histórico y no cambia aunque modifiques el servicio después.
      </div>

      {/* Modal crear/editar */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar servicio' : 'Nuevo servicio'}>
        <div className="fg">
          <label className="label">Nombre del servicio</label>
          <input className="input" value={form.nombre}
            onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
            placeholder="Ej: UGC, TikTok Ads, Spotify Pitching" />
        </div>
        <div className="fg">
          <label className="label">Descripción (opcional)</label>
          <input className="input" value={form.descripcion}
            onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
            placeholder="Breve descripción del servicio" />
        </div>
        <div className="fg">
          <label className="label">% Utilizable (costo real de campaña)</label>
          <input className="input" type="number" min="0" max="100" step="0.1"
            value={form.utilizable_pct}
            onChange={e => setForm(f => ({ ...f, utilizable_pct: e.target.value }))}
            placeholder="Ej: 65" />
        </div>

        {/* Preview de cálculo */}
        {form.utilizable_pct !== '' && (
          <div style={{
            background: '#F7F7F5', border: '0.5px solid #E5E5E2',
            borderRadius: 10, padding: '12px 14px',
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12,
          }}>
            <div>
              <div style={{ fontSize: 10, color: '#AAA', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>Budget total</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>$1.000.000</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#AAA', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>Utilizable</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#1A1A1A' }}>
                {isNaN(parseFloat(form.utilizable_pct)) ? '—' : '$' + Math.round(1000000 * parseFloat(form.utilizable_pct) / 100).toLocaleString('es-CL')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#AAA', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>Margen agencia</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#639922' }}>{margen}</div>
            </div>
          </div>
        )}

        <div className="fg">
          <label className="label">Estado</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[true, false].map(v => (
              <div key={String(v)} onClick={() => setForm(f => ({ ...f, activo: v }))}
                style={{
                  flex: 1, padding: '8px', borderRadius: 8, textAlign: 'center',
                  cursor: 'pointer', fontSize: 13, userSelect: 'none',
                  background: form.activo === v ? (v ? '#EAF3DE' : '#FCEBEB') : '#F7F7F5',
                  color: form.activo === v ? (v ? '#27500A' : '#A32D2D') : '#AAA',
                  border: `0.5px solid ${form.activo === v ? (v ? '#8BC34A' : '#F7C1C1') : '#E5E5E2'}`,
                  fontWeight: form.activo === v ? 500 : 400,
                }}
              >{v ? 'Activo' : 'Inactivo'}</div>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ background: '#FCEBEB', border: '0.5px solid #F7C1C1', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#791F1F' }}>
            ⚠ {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
          <button className="btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
          <button className="btn-red" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
