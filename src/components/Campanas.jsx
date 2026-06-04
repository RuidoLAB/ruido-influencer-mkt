import { useState, useEffect } from 'react'
import sql from '../lib/db'
import Modal from './Modal'
import SharePanel from './SharePanel'

const ESTADOS_INF = ['Contactado', 'Negociando', 'Confirmado', 'Brief enviado', 'Contenido recibido', 'Publicado']

const ESTADO_INF_COLORS = {
  Contactado: { bg: '#F1EFE8', color: '#5F5E5A' },
  Negociando: { bg: '#FAEEDA', color: '#633806' },
  Confirmado: { bg: '#E1F5EE', color: '#085041' },
  'Brief enviado': { bg: '#E6F1FB', color: '#0C447C' },
  'Contenido recibido': { bg: '#EEEDFE', color: '#3C3489' },
  Publicado: { bg: '#EAF3DE', color: '#27500A' },
}

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
  n = Number(n)
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return Math.round(n / 1000) + 'K'
  return n.toLocaleString('es-CL')
}

function fmtMoney(n, moneda) {
  n = Math.round(Number(n))
  if (moneda === 'USD') return '$' + n.toLocaleString('en-US')
  return '$' + n.toLocaleString('es-CL')
}

function Avatar({ nombre, index, size = 30 }) {
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

function BudgetBar({ usado, total }) {
  const pct = total > 0 ? Math.min(100, Math.round((usado / total) * 100)) : 0
  const color = pct >= 100 ? '#E24B4A' : pct >= 90 ? '#EF9F27' : '#639922'
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ height: 4, background: '#F0F0EE', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: pct + '%', background: color, borderRadius: 2, transition: 'width .3s' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, fontSize: 10.5, color: '#AAA' }}>
        <span style={{ color }}>{pct}% utilizado</span>
        <span>{fmtMoney(total, 'CLP')}</span>
      </div>
    </div>
  )
}

function BudgetSummary({ camp }) {
  const usado = camp.influencers?.reduce((s, i) => s + Number(i.costo), 0) || 0
  const restante = camp.budget - usado
  const pct = camp.budget > 0 ? Math.min(100, Math.round((usado / camp.budget) * 100)) : 0
  const statusColor = pct >= 100 ? '#A32D2D' : pct >= 90 ? '#854F0B' : '#3B6D11'
  const statusBg = pct >= 100 ? '#FCEBEB' : pct >= 90 ? '#FAEEDA' : '#EAF3DE'
  const barColor = pct >= 100 ? '#E24B4A' : pct >= 90 ? '#EF9F27' : '#639922'

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
      background: '#F7F7F5', borderRadius: 12, padding: '14px 16px', marginBottom: 20,
      border: '0.5px solid #E5E5E2',
    }}>
      <div>
        <div style={{ fontSize: 10.5, color: '#AAA', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>Budget</div>
        <div style={{ fontSize: 20, fontWeight: 500 }}>{fmtMoney(camp.budget, camp.moneda)}</div>
        <div style={{ fontSize: 11, color: '#AAA', marginTop: 2 }}>{camp.moneda}</div>
      </div>
      <div>
        <div style={{ fontSize: 10.5, color: '#AAA', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>Gastado</div>
        <div style={{ fontSize: 20, fontWeight: 500 }}>{fmtMoney(usado, camp.moneda)}</div>
        <div style={{ fontSize: 11, color: '#AAA', marginTop: 2 }}>{camp.influencers?.length || 0} influencers</div>
      </div>
      <div>
        <div style={{ fontSize: 10.5, color: '#AAA', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>Restante</div>
        <div style={{ fontSize: 20, fontWeight: 500, color: statusColor }}>{fmtMoney(restante, camp.moneda)}</div>
        <div style={{ fontSize: 11, marginTop: 2 }}>
          <span style={{ background: statusBg, color: statusColor, padding: '1px 7px', borderRadius: 20 }}>
            {pct}% usado
          </span>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 10.5, color: '#AAA', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>Alcance total</div>
        <div style={{ fontSize: 20, fontWeight: 500 }}>
          {fmtSeg(camp.influencers?.reduce((s, i) => s + Number(i.ig_seguidores || 0) + Number(i.tt_seguidores || 0), 0) || 0)}
        </div>
        <div style={{ fontSize: 11, color: '#AAA', marginTop: 2 }}>seguidores</div>
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <div style={{ height: 6, background: '#E5E5E2', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: pct + '%', background: barColor, borderRadius: 3, transition: 'width .3s' }} />
        </div>
      </div>
    </div>
  )
}

const EMPTY_CAMP = { nombre: '', cliente: '', budget: '', moneda: 'CLP', brief: '' }
const EMPTY_CI = { costo: '', piezas: '1', estado: 'Contactado', notas: '' }

export default function Campanas() {
  const [camps, setCamps] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentCamp, setCurrentCamp] = useState(null)
  const [roster, setRoster] = useState([])

  const [modalNewCamp, setModalNewCamp] = useState(false)
  const [campForm, setCampForm] = useState(EMPTY_CAMP)
  const [savingCamp, setSavingCamp] = useState(false)

  const [modalAddInf, setModalAddInf] = useState(false)
  const [infSearch, setInfSearch] = useState('')
  const [selInf, setSelInf] = useState(null)
  const [ciForm, setCiForm] = useState(EMPTY_CI)
  const [savingCI, setSavingCI] = useState(false)

  const [editCIModal, setEditCIModal] = useState(false)
  const [editCI, setEditCI] = useState(null)
  const [editCIForm, setEditCIForm] = useState(EMPTY_CI)

  const [deleteCampId, setDeleteCampId] = useState(null)
  const [deleteCI, setDeleteCI] = useState(null)

  useEffect(() => { fetchCamps(); fetchRoster() }, [])

  async function fetchCamps() {
    setLoading(true)
    try {
      const data = await sql`
        SELECT
          c.*,
          ci.id AS ci_id,
          ci.costo, ci.piezas,
          ci.estado AS ci_estado,
          ci.notas AS ci_notas,
          ci.influencer_id,
          i.nombre AS inf_nombre,
          i.ig_usuario, i.ig_seguidores,
          i.tt_usuario, i.tt_seguidores,
          i.tipo_contenido, i.avatar_url
        FROM campaigns c
        LEFT JOIN campaign_influencers ci ON ci.campaign_id = c.id
        LEFT JOIN influencers i ON i.id = ci.influencer_id
        ORDER BY c.created_at DESC
      `
      const grouped = {}
      data.forEach(row => {
        if (!grouped[row.id]) {
          grouped[row.id] = {
            id: row.id, nombre: row.nombre, cliente: row.cliente,
            budget: row.budget, moneda: row.moneda, brief: row.brief,
            estado: row.estado, share_token: row.share_token,
            share_active: row.share_active, created_at: row.created_at,
            influencers: [],
          }
        }
        if (row.ci_id) {
          grouped[row.id].influencers.push({
            ci_id: row.ci_id,
            influencer_id: row.influencer_id,
            costo: row.costo, piezas: row.piezas,
            ci_estado: row.ci_estado, ci_notas: row.ci_notas,
            nombre: row.inf_nombre,
            ig_usuario: row.ig_usuario, ig_seguidores: row.ig_seguidores,
            tt_usuario: row.tt_usuario, tt_seguidores: row.tt_seguidores,
            tipo_contenido: row.tipo_contenido,
          })
        }
      })
      const list = Object.values(grouped)
      setCamps(list)
      if (currentCamp) {
        const updated = list.find(c => c.id === currentCamp.id)
        if (updated) setCurrentCamp(updated)
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  async function fetchRoster() {
    try {
      const data = await sql`
        SELECT * FROM influencers WHERE estado = 'Activo'
        ORDER BY (ig_seguidores + tt_seguidores) DESC
      `
      setRoster(data)
    } catch (e) { console.error(e) }
  }

  async function saveCamp() {
    if (!campForm.nombre.trim() || !campForm.cliente.trim()) return
    setSavingCamp(true)
    try {
      await sql`
        INSERT INTO campaigns (nombre, cliente, budget, moneda, brief, share_token)
        VALUES (
          ${campForm.nombre}, ${campForm.cliente},
          ${parseInt(campForm.budget) || 0},
          ${campForm.moneda}, ${campForm.brief},
          ${crypto.randomUUID()}
        )
      `
      setModalNewCamp(false)
      setCampForm(EMPTY_CAMP)
      await fetchCamps()
    } catch (e) { console.error(e) }
    setSavingCamp(false)
  }

  async function deleteCamp(id) {
    try {
      await sql`DELETE FROM campaigns WHERE id = ${id}`
      setDeleteCampId(null)
      if (currentCamp?.id === id) setCurrentCamp(null)
      await fetchCamps()
    } catch (e) { console.error(e) }
  }

  function openAddInf() {
    setSelInf(null)
    setCiForm(EMPTY_CI)
    setInfSearch('')
    setModalAddInf(true)
  }

  async function addInfluencer() {
    if (!selInf) return
    setSavingCI(true)
    try {
      await sql`
        INSERT INTO campaign_influencers (campaign_id, influencer_id, costo, piezas, estado, notas)
        VALUES (
          ${currentCamp.id}, ${selInf.id},
          ${parseInt(ciForm.costo) || 0},
          ${parseInt(ciForm.piezas) || 1},
          ${ciForm.estado}, ${ciForm.notas}
        )
      `
      setModalAddInf(false)
      await fetchCamps()
    } catch (e) { console.error(e) }
    setSavingCI(false)
  }

  async function removeInfluencer(ciId) {
    try {
      await sql`DELETE FROM campaign_influencers WHERE id = ${ciId}`
      setDeleteCI(null)
      await fetchCamps()
    } catch (e) { console.error(e) }
  }

  function openEditCI(inf) {
    setEditCI(inf)
    setEditCIForm({
      costo: inf.costo, piezas: inf.piezas,
      estado: inf.ci_estado, notas: inf.ci_notas || '',
    })
    setEditCIModal(true)
  }

  async function saveEditCI() {
    try {
      await sql`
        UPDATE campaign_influencers SET
          costo = ${parseInt(editCIForm.costo) || 0},
          piezas = ${parseInt(editCIForm.piezas) || 1},
          estado = ${editCIForm.estado},
          notas = ${editCIForm.notas}
        WHERE id = ${editCI.ci_id}
      `
      setEditCIModal(false)
      await fetchCamps()
    } catch (e) { console.error(e) }
  }

  const availableInfs = roster.filter(inf =>
    !currentCamp?.influencers.find(i => i.influencer_id === inf.id) &&
    (infSearch === '' ||
      inf.nombre.toLowerCase().includes(infSearch.toLowerCase()) ||
      inf.ig_usuario.toLowerCase().includes(infSearch.toLowerCase()) ||
      inf.tt_usuario.toLowerCase().includes(infSearch.toLowerCase()))
  )

  if (loading) return <div style={{ padding: 40, color: '#AAA', fontSize: 13 }}>Cargando...</div>

  if (currentCamp) {
    return (
      <div style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div
              style={{ fontSize: 12, color: '#AAA', cursor: 'pointer', marginBottom: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}
              onClick={() => setCurrentCamp(null)}
            >
              ← Volver a campañas
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 500 }}>{currentCamp.nombre}</h1>
            <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{currentCamp.cliente} · {currentCamp.moneda}</p>
          </div>
          <button className="btn-red" onClick={openAddInf}>+ Agregar influencer</button>
        </div>

        <BudgetSummary camp={currentCamp} />
        <SharePanel camp={currentCamp} onUpdate={fetchCamps} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ fontSize: 14, fontWeight: 500 }}>Influencers en campaña</h2>
          <span style={{ fontSize: 12, color: '#AAA' }}>{currentCamp.influencers.length} seleccionados</span>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          {currentCamp.influencers.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#AAA', fontSize: 13 }}>
              Aún no hay influencers en esta campaña. Agrega desde el roster.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{ background: '#F7F7F5', borderBottom: '0.5px solid #E5E5E2' }}>
                    <th className="th" style={{ width: 200 }}>Influencer</th>
                    <th className="th" style={{ width: 90 }}>Total seg.</th>
                    <th className="th" style={{ width: 90 }}>Tipo</th>
                    <th className="th" style={{ width: 100 }}>Costo</th>
                    <th className="th" style={{ width: 60 }}>Piezas</th>
                    <th className="th" style={{ width: 130 }}>Estado</th>
                    <th className="th" style={{ width: 70 }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentCamp.influencers.map((inf, i) => {
                    const total = Number(inf.ig_seguidores) + Number(inf.tt_seguidores)
                    const tc = TIPO_COLORS[inf.tipo_contenido] || TIPO_COLORS['Otros']
                    const ec = ESTADO_INF_COLORS[inf.ci_estado] || ESTADO_INF_COLORS['Contactado']
                    return (
                      <tr key={inf.ci_id} style={{ borderBottom: '0.5px solid #F0F0EE' }}>
                        <td className="td">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                            <Avatar nombre={inf.nombre} index={i} />
                            <div>
                              <div style={{ fontWeight: 500, fontSize: 13 }}>{inf.nombre}</div>
                              <div style={{ fontSize: 11, color: '#AAA' }}>{inf.tt_usuario || inf.ig_usuario}</div>
                            </div>
                          </div>
                        </td>
                        <td className="td" style={{ fontWeight: 500, fontSize: 13 }}>{fmtSeg(total)}</td>
                        <td className="td">
                          <span style={{ background: tc.bg, color: tc.color, padding: '2px 8px', borderRadius: 20, fontSize: 11 }}>
                            {inf.tipo_contenido}
                          </span>
                        </td>
                        <td className="td" style={{ fontWeight: 500 }}>{fmtMoney(inf.costo, currentCamp.moneda)}</td>
                        <td className="td" style={{ color: '#555' }}>{inf.piezas}</td>
                        <td className="td">
                          <span style={{ background: ec.bg, color: ec.color, padding: '2px 8px', borderRadius: 20, fontSize: 11 }}>
                            {inf.ci_estado}
                          </span>
                        </td>
                        <td className="td">
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn-icon" onClick={() => openEditCI(inf)} title="Editar">✎</button>
                            <button className="btn-icon btn-icon-danger" onClick={() => setDeleteCI(inf.ci_id)} title="Quitar">✕</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Modal open={modalAddInf} onClose={() => setModalAddInf(false)} title="Agregar influencer">
          <div className="fg">
            <label className="label">Buscar en roster</label>
            <input className="input" placeholder="Nombre o usuario..." value={infSearch} onChange={e => { setInfSearch(e.target.value); setSelInf(null) }} />
          </div>
          <div style={{ border: '0.5px solid #E5E5E2', borderRadius: 8, maxHeight: 220, overflowY: 'auto', marginBottom: 14 }}>
            {availableInfs.length === 0 ? (
              <div style={{ padding: 16, textAlign: 'center', color: '#AAA', fontSize: 12 }}>
                {infSearch ? 'Sin resultados' : 'Todos los influencers activos ya están en la campaña'}
              </div>
            ) : availableInfs.map((inf, i) => (
              <div
                key={inf.id}
                onClick={() => setSelInf(inf)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', cursor: 'pointer',
                  borderBottom: '0.5px solid #F0F0EE',
                  background: selInf?.id === inf.id ? '#FCEBEB' : 'transparent',
                  transition: 'background .1s',
                }}
              >
                <div style={{
                  width: 16, height: 16, borderRadius: 4,
                  border: '0.5px solid ' + (selInf?.id === inf.id ? '#E8313A' : '#D0D0CC'),
                  background: selInf?.id === inf.id ? '#E8313A' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, fontSize: 10, color: '#fff',
                }}>
                  {selInf?.id === inf.id ? '✓' : ''}
                </div>
                <Avatar nombre={inf.nombre} index={i} size={26} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{inf.nombre}</div>
                  <div style={{ fontSize: 11, color: '#AAA' }}>
                    {inf.tt_usuario} · {fmtSeg(Number(inf.ig_seguidores) + Number(inf.tt_seguidores))} seg. · {inf.tipo_contenido}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {selInf && (
            <div style={{ borderTop: '0.5px solid #F0F0EE', paddingTop: 14 }}>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>
                Configurando: <strong>{selInf.nombre}</strong>
              </div>
              <div className="form-row-2">
                <div className="fg">
                  <label className="label">Costo ({currentCamp.moneda})</label>
                  <input className="input" type="number" value={ciForm.costo} onChange={e => setCiForm(f => ({ ...f, costo: e.target.value }))} placeholder="0" />
                </div>
                <div className="fg">
                  <label className="label">Piezas / posts</label>
                  <input className="input" type="number" value={ciForm.piezas} onChange={e => setCiForm(f => ({ ...f, piezas: e.target.value }))} />
                </div>
              </div>
              <div className="fg">
                <label className="label">Estado</label>
                <select className="input" value={ciForm.estado} onChange={e => setCiForm(f => ({ ...f, estado: e.target.value }))}>
                  {ESTADOS_INF.map(e => <option key={e}>{e}</option>)}
                </select>
              </div>
              <div className="fg">
                <label className="label">Notas internas</label>
                <textarea className="input" rows={2} value={ciForm.notas} onChange={e => setCiForm(f => ({ ...f, notas: e.target.value }))} style={{ resize: 'vertical' }} />
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button className="btn-ghost" onClick={() => setModalAddInf(false)}>Cancelar</button>
            <button className="btn-red" onClick={addInfluencer} disabled={!selInf || savingCI}>
              {savingCI ? 'Agregando...' : 'Agregar'}
            </button>
          </div>
        </Modal>

        <Modal open={editCIModal} onClose={() => setEditCIModal(false)} title={`Editar — ${editCI?.nombre}`}>
          <div className="form-row-2">
            <div className="fg">
              <label className="label">Costo ({currentCamp.moneda})</label>
              <input className="input" type="number" value={editCIForm.costo} onChange={e => setEditCIForm(f => ({ ...f, costo: e.target.value }))} />
            </div>
            <div className="fg">
              <label className="label">Piezas / posts</label>
              <input className="input" type="number" value={editCIForm.piezas} onChange={e => setEditCIForm(f => ({ ...f, piezas: e.target.value }))} />
            </div>
          </div>
          <div className="fg">
            <label className="label">Estado</label>
            <select className="input" value={editCIForm.estado} onChange={e => setEditCIForm(f => ({ ...f, estado: e.target.value }))}>
              {ESTADOS_INF.map(e => <option key={e}>{e}</option>)}
            </select>
          </div>
          <div className="fg">
            <label className="label">Notas internas</label>
            <textarea className="input" rows={2} value={editCIForm.notas} onChange={e => setEditCIForm(f => ({ ...f, notas: e.target.value }))} style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button className="btn-ghost" onClick={() => setEditCIModal(false)}>Cancelar</button>
            <button className="btn-red" onClick={saveEditCI}>Guardar</button>
          </div>
        </Modal>

        <Modal open={!!deleteCI} onClose={() => setDeleteCI(null)} title="Quitar influencer">
          <p style={{ fontSize: 13, color: '#555', marginBottom: 20 }}>
            ¿Quitar este influencer de la campaña? Los datos de costo y estado se perderán.
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn-ghost" onClick={() => setDeleteCI(null)}>Cancelar</button>
            <button className="btn-danger" onClick={() => removeInfluencer(deleteCI)}>Quitar</button>
          </div>
        </Modal>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 500 }}>Campañas</h1>
          <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{camps.length} campañas</p>
        </div>
        <button className="btn-red" onClick={() => { setCampForm(EMPTY_CAMP); setModalNewCamp(true) }}>+ Nueva campaña</button>
      </div>

      {camps.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#AAA', fontSize: 13 }}>
          Aún no hay campañas. Crea la primera.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {camps.map(camp => {
            const usado = camp.influencers.reduce((s, i) => s + Number(i.costo), 0)
            return (
              <div
                key={camp.id}
                className="card"
                style={{ padding: 18, cursor: 'pointer', transition: 'border-color .15s', position: 'relative' }}
                onClick={() => setCurrentCamp(camp)}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#E8313A'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#E5E5E2'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, flex: 1, paddingRight: 8 }}>{camp.nombre}</div>
                  <button
                    className="btn-icon btn-icon-danger"
                    style={{ flexShrink: 0 }}
                    onClick={e => { e.stopPropagation(); setDeleteCampId(camp.id) }}
                    title="Eliminar campaña"
                  >✕</button>
                </div>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>{camp.cliente}</div>
                <div style={{ display: 'flex', gap: 14, marginBottom: 4 }}>
                  <div>
                    <div style={{ fontSize: 10.5, color: '#AAA' }}>Influencers</div>
                    <div style={{ fontSize: 15, fontWeight: 500 }}>{camp.influencers.length}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, color: '#AAA' }}>Alcance</div>
                    <div style={{ fontSize: 15, fontWeight: 500 }}>
                      {fmtSeg(camp.influencers.reduce((s, i) => s + Number(i.ig_seguidores || 0) + Number(i.tt_seguidores || 0), 0))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, color: '#AAA' }}>Moneda</div>
                    <div style={{ fontSize: 15, fontWeight: 500 }}>{camp.moneda}</div>
                  </div>
                </div>
                <BudgetBar usado={usado} total={Number(camp.budget)} />
              </div>
            )
          })}
        </div>
      )}

      <Modal open={modalNewCamp} onClose={() => setModalNewCamp(false)} title="Nueva campaña">
        <div className="fg">
          <label className="label">Nombre de campaña</label>
          <input className="input" value={campForm.nombre} onChange={e => setCampForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Baby Rasta & Gringo — Visión" />
        </div>
        <div className="fg">
          <label className="label">Cliente</label>
          <input className="input" value={campForm.cliente} onChange={e => setCampForm(f => ({ ...f, cliente: e.target.value }))} placeholder="Nombre del cliente" />
        </div>
        <div className="form-row-2">
          <div className="fg">
            <label className="label">Budget</label>
            <input className="input" type="number" value={campForm.budget} onChange={e => setCampForm(f => ({ ...f, budget: e.target.value }))} placeholder="0" />
          </div>
          <div className="fg">
            <label className="label">Moneda</label>
            <select className="input" value={campForm.moneda} onChange={e => setCampForm(f => ({ ...f, moneda: e.target.value }))}>
              <option>CLP</option>
              <option>USD</option>
            </select>
          </div>
        </div>
        <div className="fg">
          <label className="label">Brief / descripción (opcional)</label>
          <textarea className="input" rows={3} value={campForm.brief} onChange={e => setCampForm(f => ({ ...f, brief: e.target.value }))} style={{ resize: 'vertical' }} />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
          <button className="btn-ghost" onClick={() => setModalNewCamp(false)}>Cancelar</button>
          <button className="btn-red" onClick={saveCamp} disabled={savingCamp}>
            {savingCamp ? 'Creando...' : 'Crear campaña'}
          </button>
        </div>
      </Modal>

      <Modal open={!!deleteCampId} onClose={() => setDeleteCampId(null)} title="Eliminar campaña">
        <p style={{ fontSize: 13, color: '#555', marginBottom: 20 }}>
          ¿Eliminar esta campaña? Se borrarán todos los influencers asociados. Esta acción no se puede deshacer.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn-ghost" onClick={() => setDeleteCampId(null)}>Cancelar</button>
          <button className="btn-danger" onClick={() => deleteCamp(deleteCampId)}>Eliminar</button>
        </div>
      </Modal>
    </div>
  )
}
