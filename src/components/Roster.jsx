import { useState, useEffect } from 'react'
import sql from '../lib/db'
import Modal from './Modal'

const TIPOS = ['Bailes', 'Reviewers', 'Humor', 'Lifestyle', 'Música', 'Gaming', 'Otros']

const TIPO_COLORS = {
  Bailes: { bg: '#EEEDFE', color: '#3C3489' },
  Reviewers: { bg: '#E6F1FB', color: '#0C447C' },
  Humor: { bg: '#FAEEDA', color: '#633806' },
  Lifestyle: { bg: '#E1F5EE', color: '#085041' },
  Música: { bg: '#FAECE7', color: '#712B13' },
  Gaming: { bg: '#FBEAF0', color: '#72243E' },
  Otros: { bg: '#F1EFE8', color: '#444441' },
}

const AV_COLORS = [
  { bg: '#FDDADA', color: '#C0392B' },
  { bg: '#E6EEFF', color: '#3B5BDB' },
  { bg: '#E1F5EE', color: '#1D9E75' },
  { bg: '#F3E8FF', color: '#7C3AED' },
  { bg: '#FFF3CD', color: '#BA7517' },
  { bg: '#FDE8F0', color: '#C2185B' },
  { bg: '#D4F4FF', color: '#0369A1' },
  { bg: '#E8F5E9', color: '#2E7D32' },
]

function fmtSeg(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return Math.round(n / 1000) + 'K'
  return Number(n).toLocaleString('es-CL')
}

function Avatar({ nombre, index, size = 32 }) {
  const c = AV_COLORS[index % AV_COLORS.length]
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: c.bg, color: c.color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 500, flexShrink: 0,
      border: '0.5px solid rgba(0,0,0,0.06)',
    }}>
      {nombre?.[0]?.toUpperCase()}
    </div>
  )
}

function UserLink({ username, link }) {
  if (!username) return <span style={{ color: '#CCC' }}>—</span>
  if (link) return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: '#E8313A', textDecoration: 'none', fontSize: 12.5 }}
      onMouseEnter={e => e.target.style.textDecoration = 'underline'}
      onMouseLeave={e => e.target.style.textDecoration = 'none'}
    >
      {username} ↗
    </a>
  )
  return <span style={{ fontSize: 12.5, color: '#555' }}>{username}</span>
}

function TipoBadge({ tipo }) {
  const c = TIPO_COLORS[tipo] || TIPO_COLORS['Otros']
  return (
    <span style={{
      background: c.bg, color: c.color,
      padding: '2px 9px', borderRadius: 20, fontSize: 11,
    }}>
      {tipo}
    </span>
  )
}

const EMPTY = {
  nombre: '', ig_usuario: '', ig_seguidores: '', ig_link: '',
  tt_usuario: '', tt_seguidores: '', tt_link: '',
  tipo_contenido: 'Lifestyle', estado: 'Activo', notas: '',
}

export default function Roster() {
  const [influencers, setInfluencers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterTipo, setFilterTipo] = useState('')
  const [filterEstado, setFilterEstado] = useState('')
  const [sortAsc, setSortAsc] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  useEffect(() => { fetchInfluencers() }, [])

  async function fetchInfluencers() {
    setLoading(true)
    try {
      const data = await sql`
        SELECT *, (ig_seguidores + tt_seguidores) AS total_seguidores
        FROM influencers
        ORDER BY (ig_seguidores + tt_seguidores) DESC
      `
      setInfluencers(data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  function openNew() {
    setForm(EMPTY)
    setEditId(null)
    setModalOpen(true)
  }

  function openEdit(inf) {
    setForm({
      nombre: inf.nombre,
      ig_usuario: inf.ig_usuario || '',
      ig_seguidores: inf.ig_seguidores,
      ig_link: inf.ig_link || '',
      tt_usuario: inf.tt_usuario || '',
      tt_seguidores: inf.tt_seguidores,
      tt_link: inf.tt_link || '',
      tipo_contenido: inf.tipo_contenido,
      estado: inf.estado,
      notas: inf.notas || '',
    })
    setEditId(inf.id)
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.nombre.trim()) return
    setSaving(true)
    try {
      const ig_seg = parseInt(form.ig_seguidores) || 0
      const tt_seg = parseInt(form.tt_seguidores) || 0
      if (editId) {
        await sql`
          UPDATE influencers SET
            nombre = ${form.nombre},
            ig_usuario = ${form.ig_usuario},
            ig_seguidores = ${ig_seg},
            ig_link = ${form.ig_link},
            tt_usuario = ${form.tt_usuario},
            tt_seguidores = ${tt_seg},
            tt_link = ${form.tt_link},
            tipo_contenido = ${form.tipo_contenido},
            estado = ${form.estado},
            notas = ${form.notas}
          WHERE id = ${editId}
        `
      } else {
        await sql`
          INSERT INTO influencers (nombre, ig_usuario, ig_seguidores, ig_link, tt_usuario, tt_seguidores, tt_link, tipo_contenido, estado, notas)
          VALUES (${form.nombre}, ${form.ig_usuario}, ${ig_seg}, ${form.ig_link}, ${form.tt_usuario}, ${tt_seg}, ${form.tt_link}, ${form.tipo_contenido}, ${form.estado}, ${form.notas})
        `
      }
      setModalOpen(false)
      await fetchInfluencers()
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  async function handleDelete(id) {
    try {
      await sql`DELETE FROM influencers WHERE id = ${id}`
      setDeleteId(null)
      await fetchInfluencers()
    } catch (e) { console.error(e) }
  }

  const filtered = influencers
    .filter(i => {
      const q = search.toLowerCase()
      const matchSearch = !q || i.nombre.toLowerCase().includes(q) ||
        (i.ig_usuario || '').toLowerCase().includes(q) ||
        (i.tt_usuario || '').toLowerCase().includes(q)
      const matchTipo = !filterTipo || i.tipo_contenido === filterTipo
      const matchEstado = !filterEstado || i.estado === filterEstado
      return matchSearch && matchTipo && matchEstado
    })
    .sort((a, b) => {
      const diff = Number(b.total_seguidores) - Number(a.total_seguidores)
      return sortAsc ? -diff : diff
    })

  return (
    <div style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 500 }}>Roster</h1>
          <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
            {influencers.length} influencers · {influencers.filter(i => i.estado === 'Activo').length} activos
          </p>
        </div>
        <button className="btn-red" onClick={openNew}>+ Nuevo influencer</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <input
          className="input"
          placeholder="Buscar nombre o usuario..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ minWidth: 220, flex: 1, maxWidth: 320 }}
        />
        <select className="input" value={filterTipo} onChange={e => setFilterTipo(e.target.value)}>
          <option value="">Todos los tipos</option>
          {TIPOS.map(t => <option key={t}>{t}</option>)}
        </select>
        <select className="input" value={filterEstado} onChange={e => setFilterEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          <option>Activo</option>
          <option>Inactivo</option>
        </select>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#AAA', fontSize: 13 }}>Cargando...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#AAA', fontSize: 13 }}>
            {search || filterTipo || filterEstado ? 'Sin resultados para ese filtro' : 'Aún no hay influencers. Agrega el primero.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <thead>
                <tr style={{ background: '#F7F7F5', borderBottom: '0.5px solid #E5E5E2' }}>
                  <th className="th" style={{ width: 220 }}>Influencer</th>
                  <th className="th" style={{ width: 150 }}>Instagram</th>
                  <th className="th" style={{ width: 150 }}>TikTok</th>
                  <th className="th" style={{ width: 110, cursor: 'pointer', userSelect: 'none' }} onClick={() => setSortAsc(s => !s)}>
                    Total seg. {sortAsc ? '↑' : '↓'}
                  </th>
                  <th className="th" style={{ width: 100 }}>Tipo</th>
                  <th className="th" style={{ width: 80 }}>Estado</th>
                  <th className="th" style={{ width: 70 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inf, i) => (
                  <tr key={inf.id} style={{ borderBottom: '0.5px solid #F0F0EE' }}>
                    <td className="td">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <Avatar nombre={inf.nombre} index={i} />
                        <span style={{ fontWeight: 500, fontSize: 13 }}>{inf.nombre}</span>
                      </div>
                    </td>
                    <td className="td">
                      <UserLink username={inf.ig_usuario} link={inf.ig_link} />
                      <div style={{ fontSize: 11, color: '#AAA' }}>{inf.ig_seguidores ? fmtSeg(inf.ig_seguidores) : ''}</div>
                    </td>
                    <td className="td">
                      <UserLink username={inf.tt_usuario} link={inf.tt_link} />
                      <div style={{ fontSize: 11, color: '#AAA' }}>{inf.tt_seguidores ? fmtSeg(inf.tt_seguidores) : ''}</div>
                    </td>
                    <td className="td">
                      <span style={{ fontWeight: 500, fontSize: 13 }}>{fmtSeg(Number(inf.total_seguidores))}</span>
                    </td>
                    <td className="td"><TipoBadge tipo={inf.tipo_contenido} /></td>
                    <td className="td">
                      <span style={{
                        background: inf.estado === 'Activo' ? '#EAF3DE' : '#F1EFE8',
                        color: inf.estado === 'Activo' ? '#27500A' : '#5F5E5A',
                        padding: '2px 9px', borderRadius: 20, fontSize: 11,
                      }}>
                        {inf.estado}
                      </span>
                    </td>
                    <td className="td">
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn-icon" onClick={() => openEdit(inf)} title="Editar">✎</button>
                        <button className="btn-icon btn-icon-danger" onClick={() => setDeleteId(inf.id)} title="Eliminar">✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar influencer' : 'Nuevo influencer'}>
        <div className="fg">
          <label className="label">Nombre</label>
          <input className="input" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre completo" />
        </div>
        <div className="form-row-2">
          <div className="fg">
            <label className="label">Usuario Instagram</label>
            <input className="input" value={form.ig_usuario} onChange={e => setForm(f => ({ ...f, ig_usuario: e.target.value }))} placeholder="@usuario" />
          </div>
          <div className="fg">
            <label className="label">Seguidores Instagram</label>
            <input className="input" type="number" value={form.ig_seguidores} onChange={e => setForm(f => ({ ...f, ig_seguidores: e.target.value }))} placeholder="0" />
          </div>
        </div>
        <div className="fg">
          <label className="label">Link Instagram</label>
          <input className="input" value={form.ig_link} onChange={e => setForm(f => ({ ...f, ig_link: e.target.value }))} placeholder="https://instagram.com/usuario" />
        </div>
        <div className="form-row-2">
          <div className="fg">
            <label className="label">Usuario TikTok</label>
            <input className="input" value={form.tt_usuario} onChange={e => setForm(f => ({ ...f, tt_usuario: e.target.value }))} placeholder="@usuario" />
          </div>
          <div className="fg">
            <label className="label">Seguidores TikTok</label>
            <input className="input" type="number" value={form.tt_seguidores} onChange={e => setForm(f => ({ ...f, tt_seguidores: e.target.value }))} placeholder="0" />
          </div>
        </div>
        <div className="fg">
          <label className="label">Link TikTok</label>
          <input className="input" value={form.tt_link} onChange={e => setForm(f => ({ ...f, tt_link: e.target.value }))} placeholder="https://tiktok.com/@usuario" />
        </div>
        <div className="form-row-2">
          <div className="fg">
            <label className="label">Tipo de contenido</label>
            <select className="input" value={form.tipo_contenido} onChange={e => setForm(f => ({ ...f, tipo_contenido: e.target.value }))}>
              {TIPOS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="fg">
            <label className="label">Estado</label>
            <select className="input" value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}>
              <option>Activo</option>
              <option>Inactivo</option>
            </select>
          </div>
        </div>
        <div className="fg">
          <label className="label">Notas internas</label>
          <textarea className="input" rows={3} value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} placeholder="Solo visible para el equipo..." style={{ resize: 'vertical' }} />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
          <button className="btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
          <button className="btn-red" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Eliminar influencer">
        <p style={{ fontSize: 13, color: '#555', marginBottom: 20 }}>
          ¿Estás segura? Esta acción no se puede deshacer.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn-ghost" onClick={() => setDeleteId(null)}>Cancelar</button>
          <button className="btn-danger" onClick={() => handleDelete(deleteId)}>Eliminar</button>
        </div>
      </Modal>
    </div>
  )
}
