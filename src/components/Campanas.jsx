import { useState, useEffect } from 'react'
import sql from '../lib/db'
import Modal from './Modal'
import SharePanel from './SharePanel'
import Reportes from './Reportes'
import Pagos from './Pagos'

const TIPOS_CONTENIDO = ['Bailes', 'Reviewers', 'Humor', 'Lifestyle', 'Música', 'Gaming', 'Moda', 'Fitness', 'Viajes', 'Otros']
const TIPOS_CAMPANA = ['Estándar', 'Nano Blast', 'Clipping', 'Playlisting']

const TIPO_COLORS = {
  Bailes:    { bg: '#EEEDFE', color: '#3C3489' },
  Reviewers: { bg: '#E6F1FB', color: '#0C447C' },
  Humor:     { bg: '#FAEEDA', color: '#633806' },
  Lifestyle: { bg: '#E1F5EE', color: '#085041' },
  Música:    { bg: '#FAECE7', color: '#712B13' },
  Gaming:    { bg: '#FBEAF0', color: '#72243E' },
  Moda:      { bg: '#FEF0FB', color: '#6B1560' },
  Fitness:   { bg: '#E8F5E9', color: '#1B5E20' },
  Viajes:    { bg: '#E3F2FD', color: '#0D47A1' },
  Otros:     { bg: '#F1EFE8', color: '#444441' },
}

const SIZE_RANGES = [
  { label: 'Nano',  min: 0,       max: 10000 },
  { label: 'Micro', min: 10000,   max: 150000 },
  { label: 'Mid',   min: 150000,  max: 750000 },
  { label: 'Macro', min: 750000,  max: 4000000 },
  { label: 'Mega',  min: 4000000, max: Infinity },
]

function getSize(n) {
  n = Number(n)
  return SIZE_RANGES.find(r => n >= r.min && n < r.max) || SIZE_RANGES[0]
}

const ESTADOS_INF = ['Contactado', 'Negociando', 'Confirmado', 'Brief enviado', 'Contenido recibido', 'Publicado']

const ESTADO_INF_COLORS = {
  Contactado:           { bg: '#F1EFE8', color: '#5F5E5A' },
  Negociando:           { bg: '#FAEEDA', color: '#633806' },
  Confirmado:           { bg: '#E1F5EE', color: '#085041' },
  'Brief enviado':      { bg: '#E6F1FB', color: '#0C447C' },
  'Contenido recibido': { bg: '#EEEDFE', color: '#3C3489' },
  Publicado:            { bg: '#EAF3DE', color: '#27500A' },
}

const ESTADO_CAMP_COLORS = {
  Activa:    { bg: '#EAF3DE', color: '#27500A' },
  Pausada:   { bg: '#FAEEDA', color: '#633806' },
  Cerrada:   { bg: '#E6F1FB', color: '#0C447C' },
  Cancelada: { bg: '#FCEBEB', color: '#791F1F' },
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

const TABS_LISTA = ['Activas', 'Pausadas', 'Cerradas', 'Canceladas', 'Todas']
const TABS_DETALLE = ['influencers', 'pagos', 'reportes']
const PLATAFORMAS = ['Ambas', 'TikTok', 'Instagram']

function fmtSeg(n) {
  n = Number(n)
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return Math.round(n / 1000) + 'K'
  return n.toLocaleString('es-CL')
}

function fmtNum(n) {
  n = Number(n) || 0
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return Math.round(n / 1000) + 'K'
  return n.toLocaleString('es-CL')
}

function fmtMoney(n, moneda) {
  n = Math.round(Number(n))
  if (moneda === 'USD') return '$' + n.toLocaleString('en-US')
  return '$' + n.toLocaleString('es-CL')
}

function isValidUrl(url) {
  if (!url || !url.trim()) return true
  try {
    const u = new URL(url)
    return u.protocol === 'https:' || u.protocol === 'http:'
  } catch { return false }
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
    }}>{nombre?.[0]?.toUpperCase()}</div>
  )
}

function BudgetBar({ usado, total }) {
  const pct = total > 0 ? Math.min(100, Math.round((usado / total) * 100)) : 0
  const color = pct >= 100 ? '#E24B4A' : pct >= 90 ? '#EF9F27' : '#639922'
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ height: 4, background: '#F0F0EE', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: pct + '%', background: color, borderRadius: 2 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, fontSize: 10.5, color: '#AAA' }}>
        <span style={{ color }}>{pct}%</span>
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
          <span style={{ background: statusBg, color: statusColor, padding: '1px 7px', borderRadius: 20 }}>{pct}% usado</span>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 10.5, color: '#AAA', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>Alcance total</div>
        <div style={{ fontSize: 20, fontWeight: 500 }}>
          {fmtSeg(camp.influencers?.reduce((s, i) => {
            const ig = camp.plataforma !== 'TikTok' ? Number(i.ig_seguidores || 0) : 0
            const tt = camp.plataforma !== 'Instagram' ? Number(i.tt_seguidores || 0) : 0
            return s + ig + tt
          }, 0) || 0)}
        </div>
        <div style={{ fontSize: 11, color: '#AAA', marginTop: 2 }}>{camp.plataforma || 'Ambas'}</div>
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <div style={{ height: 6, background: '#E5E5E2', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: pct + '%', background: barColor, borderRadius: 3 }} />
        </div>
      </div>
    </div>
  )
}

const EMPTY_CAMP = {
  nombre: '', cliente: '', client_id: '', budget: '', moneda: 'CLP',
  brief: '', plataforma: 'Ambas', artista: '', cancion: '',
  fecha_inicio: '', fecha_termino: '', reporte_url_tt: '', reporte_url_ig: '',
  tipo: 'Estándar', contenidos_count: '', views_logradas: '',
  views_min: '', views_max: '',
}
const EMPTY_CI_EDIT = { costo: '', piezas: '1', estado: 'Contactado', notas: '', video_link_tt: '', video_link_ig: '', boostcode: '' }

// ─── BARRA DE PROGRESO CLIPPING ───
function ClippingBar({ logradas, min, max }) {
  const l = Number(logradas) || 0
  const mn = Number(min) || 0
  const mx = Number(max) || 0
  if (mx === 0) return null

  const pctLogradas = Math.min(100, Math.round((l / mx) * 100))
  const pctMin = Math.min(100, Math.round((mn / mx) * 100))

  const superaMax = l >= mx
  const superaMin = l >= mn
  const barColor = superaMax ? '#3B5BDB' : superaMin ? '#639922' : '#E5E5E2'
  const barColorActive = superaMax ? '#3B5BDB' : superaMin ? '#639922' : '#AAA'

  let statusText = ''
  let statusColor = '#AAA'
  let statusBg = '#F0F0EE'
  if (superaMax) { statusText = 'Meta superada ✓'; statusColor = '#0C447C'; statusBg = '#E6F1FB' }
  else if (superaMin) { statusText = 'Dentro del rango ✓'; statusColor = '#27500A'; statusBg = '#EAF3DE' }
  else if (l > 0) { statusText = 'En progreso'; statusColor = '#633806'; statusBg = '#FAEEDA' }

  return (
    <div>
      <div style={{ position: 'relative', height: 8, background: '#E5E5E2', borderRadius: 4, overflow: 'visible', marginBottom: 6 }}>
        {/* Barra de progreso */}
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: pctLogradas + '%', background: barColorActive, borderRadius: 4, transition: 'width .4s ease' }} />
        {/* Marcador mínimo */}
        {mn > 0 && (
          <div style={{ position: 'absolute', left: pctMin + '%', top: -3, width: 2, height: 14, background: '#888', borderRadius: 1, transform: 'translateX(-1px)' }} />
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {statusText && (
            <span style={{ fontSize: 11, background: statusBg, color: statusColor, padding: '2px 8px', borderRadius: 20 }}>{statusText}</span>
          )}
        </div>
        <div style={{ fontSize: 11, color: '#AAA' }}>{pctLogradas}% de {fmtNum(mx)}</div>
      </div>
    </div>
  )
}

// ─── FORM FIELDS — definido FUERA del componente para evitar re-mount ───
function CampFormFields({ form, setForm, error, clientsList }) {
  const fPlat = form.plataforma
  const fShowTT = fPlat === 'Ambas' || fPlat === 'TikTok'
  const fShowIG = fPlat === 'Ambas' || fPlat === 'Instagram'
  const isNanoBlast = form.tipo === 'Nano Blast'
  const isClipping = form.tipo === 'Clipping'
  const isPlaylisting = form.tipo === 'Playlisting'

  return (
    <>
      <div className="fg">
        <label className="label">Tipo de campaña</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {TIPOS_CAMPANA.map(t => (
            <div key={t} onClick={() => setForm(f => ({ ...f, tipo: t }))}
              style={{
                flex: '1 1 auto', padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                textAlign: 'center', fontSize: 12, userSelect: 'none', transition: 'all .12s',
                background: form.tipo === t ? '#1A1A1A' : '#F7F7F5',
                color: form.tipo === t ? '#fff' : '#888',
                border: `0.5px solid ${form.tipo === t ? '#1A1A1A' : '#E5E5E2'}`,
              }}
            >{t}</div>
          ))}
        </div>
      </div>
      <div className="fg">
        <label className="label">Nombre de campaña</label>
        <input className="input" value={form.nombre}
          onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
          placeholder="Ej: Baby Rasta & Gringo — Visión" />
      </div>
      <div className="fg">
        <label className="label">Cliente</label>
        <select className="input" value={form.client_id}
          onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}>
          <option value="">Sin cliente asignado</option>
          {clientsList.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </div>
      <div className="form-row-2">
        <div className="fg">
          <label className="label">Artista</label>
          <input className="input" value={form.artista}
            onChange={e => setForm(f => ({ ...f, artista: e.target.value }))}
            placeholder="Ej: Bad Bunny" />
        </div>
        <div className="fg">
          <label className="label">Canción (opcional)</label>
          <input className="input" value={form.cancion}
            onChange={e => setForm(f => ({ ...f, cancion: e.target.value }))}
            placeholder='Ej: "Tití Me Preguntó"' />
        </div>
      </div>
      <div className="form-row-2">
        <div className="fg">
          <label className="label">Budget</label>
          <input className="input" type="number" value={form.budget}
            onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="0" />
        </div>
        <div className="fg">
          <label className="label">Moneda</label>
          <select className="input" value={form.moneda}
            onChange={e => setForm(f => ({ ...f, moneda: e.target.value }))}>
            <option>CLP</option><option>USD</option>
          </select>
        </div>
      </div>
      {!isPlaylisting && (
        <div className="fg">
          <label className="label">Plataforma</label>
          <select className="input" value={form.plataforma}
            onChange={e => setForm(f => ({ ...f, plataforma: e.target.value }))}>
            {PLATAFORMAS.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
      )}
      <div className="form-row-2">
        <div className="fg">
          <label className="label">Fecha inicio</label>
          <input className="input" type="date" value={form.fecha_inicio}
            onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value }))} />
        </div>
        <div className="fg">
          <label className="label">Fecha término</label>
          <input className="input" type="date" value={form.fecha_termino}
            onChange={e => setForm(f => ({ ...f, fecha_termino: e.target.value }))} />
        </div>
      </div>
      <div className="fg">
        <label className="label">Brief / descripción (opcional)</label>
        <textarea className="input" rows={3} value={form.brief}
          onChange={e => setForm(f => ({ ...f, brief: e.target.value }))} style={{ resize: 'vertical' }} />
      </div>

      {isNanoBlast && (
        <div className="fg">
          <label className="label">Contenidos publicados</label>
          <input className="input" type="number" value={form.contenidos_count}
            onChange={e => setForm(f => ({ ...f, contenidos_count: e.target.value }))}
            placeholder="Ej: 95" />
        </div>
      )}
      {isClipping && (
        <>
          <div className="form-row-2">
            <div className="fg">
              <label className="label">Videos publicados</label>
              <input className="input" type="number" value={form.contenidos_count}
                onChange={e => setForm(f => ({ ...f, contenidos_count: e.target.value }))}
                placeholder="Ej: 45" />
            </div>
            <div className="fg">
              <label className="label">Views logradas</label>
              <input className="input" type="number" value={form.views_logradas}
                onChange={e => setForm(f => ({ ...f, views_logradas: e.target.value }))}
                placeholder="Ej: 2500000" />
            </div>
          </div>
          <div className="fg">
            <label className="label">Rango estimado prometido</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input className="input" type="number" value={form.views_min}
                onChange={e => setForm(f => ({ ...f, views_min: e.target.value }))}
                placeholder="Mínimo (ej: 1000000)" style={{ flex: 1 }} />
              <span style={{ color: '#AAA', fontSize: 13, flexShrink: 0 }}>—</span>
              <input className="input" type="number" value={form.views_max}
                onChange={e => setForm(f => ({ ...f, views_max: e.target.value }))}
                placeholder="Máximo (ej: 3000000)" style={{ flex: 1 }} />
            </div>
            <div style={{ fontSize: 11, color: '#AAA', marginTop: 4 }}>Ej: 1,000,000 — 3,000,000 views</div>
          </div>
        </>
      )}

      {!isPlaylisting && (
        <>
          {fShowTT && (
            <div className="fg">
              <label className="label">Reporte métricas TikTok (opcional)</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="input" value={form.reporte_url_tt}
                  onChange={e => setForm(f => ({ ...f, reporte_url_tt: e.target.value }))}
                  placeholder="https://..." style={{ flex: 1 }} />
                {form.reporte_url_tt && isValidUrl(form.reporte_url_tt) && (
                  <a href={form.reporte_url_tt} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', padding: '0 12px', background: '#F7F7F5', border: '0.5px solid #E5E5E2', borderRadius: 8, fontSize: 12, color: '#555', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    Abrir ↗
                  </a>
                )}
              </div>
              {error?.includes('TikTok') && <div style={{ fontSize: 12, color: '#A32D2D', marginTop: 5 }}>⚠ {error}</div>}
            </div>
          )}
          {fShowIG && (
            <div className="fg">
              <label className="label">Reporte métricas Instagram (opcional)</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="input" value={form.reporte_url_ig}
                  onChange={e => setForm(f => ({ ...f, reporte_url_ig: e.target.value }))}
                  placeholder="https://..." style={{ flex: 1 }} />
                {form.reporte_url_ig && isValidUrl(form.reporte_url_ig) && (
                  <a href={form.reporte_url_ig} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', padding: '0 12px', background: '#F7F7F5', border: '0.5px solid #E5E5E2', borderRadius: 8, fontSize: 12, color: '#555', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    Abrir ↗
                  </a>
                )}
              </div>
              {error?.includes('Instagram') && <div style={{ fontSize: 12, color: '#A32D2D', marginTop: 5 }}>⚠ {error}</div>}
            </div>
          )}
        </>
      )}
      {error && !error.includes('TikTok') && !error.includes('Instagram') && (
        <div style={{ fontSize: 12, color: '#A32D2D' }}>⚠ {error}</div>
      )}
    </>
  )
}

export default function Campanas({ initialCamp = null }) {
  const [camps, setCamps] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentCamp, setCurrentCamp] = useState(initialCamp)
  const [roster, setRoster] = useState([])
  const [clientsList, setClientsList] = useState([])
  const [tab, setTab] = useState('Activas')
  const [campTab, setCampTab] = useState('influencers')

  const [modalNewCamp, setModalNewCamp] = useState(false)
  const [campForm, setCampForm] = useState(EMPTY_CAMP)
  const [campFormError, setCampFormError] = useState('')
  const [savingCamp, setSavingCamp] = useState(false)

  const [editCampModal, setEditCampModal] = useState(false)
  const [editCampForm, setEditCampForm] = useState(EMPTY_CAMP)
  const [editCampFormError, setEditCampFormError] = useState('')
  const [savingEditCamp, setSavingEditCamp] = useState(false)

  const [modalAddInf, setModalAddInf] = useState(false)
  const [infSearch, setInfSearch] = useState('')
  const [infFilterTipo, setInfFilterTipo] = useState('')
  const [infFilterSize, setInfFilterSize] = useState('')
  const [selectedInfIds, setSelectedInfIds] = useState([])
  const [savingCI, setSavingCI] = useState(false)

  const [editCIModal, setEditCIModal] = useState(false)
  const [editCI, setEditCI] = useState(null)
  const [editCIForm, setEditCIForm] = useState(EMPTY_CI_EDIT)

  const [deleteCampId, setDeleteCampId] = useState(null)
  const [deleteCI, setDeleteCI] = useState(null)
  const [changeEstadoModal, setChangeEstadoModal] = useState(false)

  // Playlists
  const [playlists, setPlaylists] = useState([])
  const [playlistForm, setPlaylistForm] = useState({ nombre: '', link: '' })
  const [savingPlaylist, setSavingPlaylist] = useState(false)
  const [deletePlaylistId, setDeletePlaylistId] = useState(null)
  const [editPlaylistModal, setEditPlaylistModal] = useState(false)
  const [editPlaylist, setEditPlaylist] = useState(null)
  const [editPlaylistForm, setEditPlaylistForm] = useState({ nombre: '', link: '' })

  useEffect(() => { fetchCamps(); fetchRosterAndClients() }, [])

  useEffect(() => {
    if (currentCamp?.tipo === 'Playlisting') fetchPlaylists(currentCamp.id)
  }, [currentCamp?.id, currentCamp?.tipo])

  async function fetchPlaylists(campId) {
    try {
      const data = await sql`SELECT * FROM campaign_playlists WHERE campaign_id = ${campId} ORDER BY created_at ASC`
      setPlaylists(data)
    } catch (e) { console.error(e) }
  }

  async function fetchCamps() {
    setLoading(true)
    try {
      const data = await sql`
        SELECT
          c.*,
          cl.nombre AS client_nombre, cl.color AS client_color,
          ci.id AS ci_id, ci.costo, ci.piezas,
          ci.estado AS ci_estado, ci.notas AS ci_notas,
          ci.video_link_tt, ci.video_link_ig,
          ci.boostcode, ci.estado_pago, ci.link_boleta,
          ci.influencer_id,
          i.nombre AS inf_nombre,
          i.ig_usuario, i.ig_seguidores,
          i.tt_usuario, i.tt_seguidores,
          i.tipos_contenido, i.avatar_url
        FROM campaigns c
        LEFT JOIN clients cl ON cl.id = c.client_id
        LEFT JOIN campaign_influencers ci ON ci.campaign_id = c.id
        LEFT JOIN influencers i ON i.id = ci.influencer_id
        ORDER BY c.created_at DESC
      `
      const grouped = {}
      data.forEach(row => {
        if (!grouped[row.id]) {
          grouped[row.id] = {
            id: row.id, nombre: row.nombre, cliente: row.cliente,
            client_id: row.client_id, client_nombre: row.client_nombre,
            client_color: row.client_color,
            budget: row.budget, moneda: row.moneda, brief: row.brief,
            estado: row.estado, share_token: row.share_token,
            share_active: row.share_active, created_at: row.created_at,
            plataforma: row.plataforma || 'Ambas',
            artista: row.artista || '', cancion: row.cancion || '',
            fecha_inicio: row.fecha_inicio || '', fecha_termino: row.fecha_termino || '',
            reporte_url_tt: row.reporte_url_tt || '',
            reporte_url_ig: row.reporte_url_ig || '',
            tipo: row.tipo || 'Estándar',
            contenidos_count: row.contenidos_count || 0,
            views_logradas: row.views_logradas || 0,
            views_min: row.views_min || 0,
            views_max: row.views_max || 0,
            influencers: [],
          }
        }
        if (row.ci_id) {
          grouped[row.id].influencers.push({
            ci_id: row.ci_id, influencer_id: row.influencer_id,
            costo: row.costo, piezas: row.piezas,
            ci_estado: row.ci_estado, ci_notas: row.ci_notas,
            video_link_tt: row.video_link_tt || '',
            video_link_ig: row.video_link_ig || '',
            boostcode: row.boostcode || '',
            estado_pago: row.estado_pago || 'Pendiente',
            link_boleta: row.link_boleta || '',
            nombre: row.inf_nombre,
            ig_usuario: row.ig_usuario, ig_seguidores: row.ig_seguidores,
            tt_usuario: row.tt_usuario, tt_seguidores: row.tt_seguidores,
            tipos_contenido: row.tipos_contenido || [],
          })
        }
      })
      const list = Object.values(grouped).map(camp => ({
        ...camp,
        influencers: camp.influencers.sort((a, b) =>
          (Number(b.ig_seguidores) + Number(b.tt_seguidores)) -
          (Number(a.ig_seguidores) + Number(a.tt_seguidores))
        )
      }))
      setCamps(list)
      if (currentCamp) {
        const updated = list.find(c => c.id === currentCamp.id)
        if (updated) setCurrentCamp(updated)
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  async function fetchRosterAndClients() {
    try {
      const [rosterData, clientsData] = await Promise.all([
        sql`SELECT * FROM influencers WHERE estado = 'Activo' ORDER BY (ig_seguidores + tt_seguidores) DESC`,
        sql`SELECT id, nombre, color FROM clients ORDER BY nombre ASC`
      ])
      setRoster(rosterData)
      setClientsList(clientsData)
    } catch (e) { console.error(e) }
  }

  function validateForm(form) {
    const plat = form.plataforma
    const showTT = plat === 'Ambas' || plat === 'TikTok'
    const showIG = plat === 'Ambas' || plat === 'Instagram'
    if (showTT && form.reporte_url_tt && !isValidUrl(form.reporte_url_tt))
      return 'El link del reporte TikTok no es una URL válida.'
    if (showIG && form.reporte_url_ig && !isValidUrl(form.reporte_url_ig))
      return 'El link del reporte Instagram no es una URL válida.'
    return ''
  }

  async function saveCamp() {
    if (!campForm.nombre.trim()) return
    const err = validateForm(campForm)
    if (err) { setCampFormError(err); return }
    setCampFormError('')
    setSavingCamp(true)
    try {
      await sql`
        INSERT INTO campaigns (nombre, cliente, client_id, budget, moneda, brief, plataforma, share_token, artista, cancion, fecha_inicio, fecha_termino, reporte_url_tt, reporte_url_ig, tipo, contenidos_count, views_logradas, views_min, views_max)
        VALUES (
          ${campForm.nombre},
          ${campForm.client_id ? (clientsList.find(c => c.id === campForm.client_id)?.nombre || '') : campForm.cliente},
          ${campForm.client_id || null},
          ${parseInt(campForm.budget) || 0},
          ${campForm.moneda}, ${campForm.brief},
          ${campForm.plataforma}, ${crypto.randomUUID()},
          ${campForm.artista}, ${campForm.cancion},
          ${campForm.fecha_inicio || null}, ${campForm.fecha_termino || null},
          ${campForm.reporte_url_tt || ''}, ${campForm.reporte_url_ig || ''},
          ${campForm.tipo || 'Estándar'},
          ${parseInt(campForm.contenidos_count) || 0},
          ${parseInt(campForm.views_logradas) || 0},
          ${parseInt(campForm.views_min) || 0},
          ${parseInt(campForm.views_max) || 0}
        )
      `
      setModalNewCamp(false)
      setCampForm(EMPTY_CAMP)
      await fetchCamps()
    } catch (e) { console.error(e) }
    setSavingCamp(false)
  }

  function openEditCamp() {
    setEditCampForm({
      nombre: currentCamp.nombre,
      cliente: currentCamp.cliente || '',
      client_id: currentCamp.client_id || '',
      budget: currentCamp.budget,
      moneda: currentCamp.moneda,
      brief: currentCamp.brief || '',
      plataforma: currentCamp.plataforma || 'Ambas',
      artista: currentCamp.artista || '',
      cancion: currentCamp.cancion || '',
      fecha_inicio: currentCamp.fecha_inicio || '',
      fecha_termino: currentCamp.fecha_termino || '',
      reporte_url_tt: currentCamp.reporte_url_tt || '',
      reporte_url_ig: currentCamp.reporte_url_ig || '',
      tipo: currentCamp.tipo || 'Estándar',
      contenidos_count: currentCamp.contenidos_count || '',
      views_logradas: currentCamp.views_logradas || '',
      views_min: currentCamp.views_min || '',
      views_max: currentCamp.views_max || '',
    })
    setEditCampFormError('')
    setEditCampModal(true)
  }

  async function saveEditCamp() {
    if (!editCampForm.nombre.trim()) return
    const err = validateForm(editCampForm)
    if (err) { setEditCampFormError(err); return }
    setEditCampFormError('')
    setSavingEditCamp(true)
    try {
      await sql`
        UPDATE campaigns SET
          nombre = ${editCampForm.nombre},
          cliente = ${editCampForm.client_id ? (clientsList.find(c => c.id === editCampForm.client_id)?.nombre || editCampForm.cliente) : editCampForm.cliente},
          client_id = ${editCampForm.client_id || null},
          budget = ${parseInt(editCampForm.budget) || 0},
          moneda = ${editCampForm.moneda},
          plataforma = ${editCampForm.plataforma},
          brief = ${editCampForm.brief},
          artista = ${editCampForm.artista},
          cancion = ${editCampForm.cancion},
          fecha_inicio = ${editCampForm.fecha_inicio || null},
          fecha_termino = ${editCampForm.fecha_termino || null},
          reporte_url_tt = ${editCampForm.reporte_url_tt || ''},
          reporte_url_ig = ${editCampForm.reporte_url_ig || ''},
          tipo = ${editCampForm.tipo || 'Estándar'},
          contenidos_count = ${parseInt(editCampForm.contenidos_count) || 0},
          views_logradas = ${parseInt(editCampForm.views_logradas) || 0},
          views_min = ${parseInt(editCampForm.views_min) || 0},
          views_max = ${parseInt(editCampForm.views_max) || 0}
        WHERE id = ${currentCamp.id}
      `
      setEditCampModal(false)
      await fetchCamps()
    } catch (e) { console.error(e) }
    setSavingEditCamp(false)
  }

  async function updateEstado(id, estado) {
    try {
      await sql`UPDATE campaigns SET estado = ${estado} WHERE id = ${id}`
      setChangeEstadoModal(false)
      await fetchCamps()
    } catch (e) { console.error(e) }
  }

  async function deleteCamp(id) {
    try {
      await sql`DELETE FROM campaigns WHERE id = ${id}`
      setDeleteCampId(null)
      if (currentCamp?.id === id) setCurrentCamp(null)
      await fetchCamps()
    } catch (e) { console.error(e) }
  }

  // Playlist CRUD
  async function addPlaylist() {
    if (!playlistForm.nombre.trim() || !playlistForm.link.trim()) return
    if (!isValidUrl(playlistForm.link)) return alert('El link no es una URL válida.')
    setSavingPlaylist(true)
    try {
      await sql`INSERT INTO campaign_playlists (campaign_id, nombre, link) VALUES (${currentCamp.id}, ${playlistForm.nombre}, ${playlistForm.link})`
      setPlaylistForm({ nombre: '', link: '' })
      await fetchPlaylists(currentCamp.id)
    } catch (e) { console.error(e) }
    setSavingPlaylist(false)
  }

  async function deletePlaylist(id) {
    try {
      await sql`DELETE FROM campaign_playlists WHERE id = ${id}`
      setDeletePlaylistId(null)
      await fetchPlaylists(currentCamp.id)
    } catch (e) { console.error(e) }
  }

  function openEditPlaylist(pl) {
    setEditPlaylist(pl)
    setEditPlaylistForm({ nombre: pl.nombre, link: pl.link })
    setEditPlaylistModal(true)
  }

  async function saveEditPlaylist() {
    if (!editPlaylistForm.nombre.trim() || !editPlaylistForm.link.trim()) return
    try {
      await sql`UPDATE campaign_playlists SET nombre = ${editPlaylistForm.nombre}, link = ${editPlaylistForm.link} WHERE id = ${editPlaylist.id}`
      setEditPlaylistModal(false)
      await fetchPlaylists(currentCamp.id)
    } catch (e) { console.error(e) }
  }

  function openAddInfModal() {
    setSelectedInfIds([])
    setInfSearch('')
    setInfFilterTipo('')
    setInfFilterSize('')
    setModalAddInf(true)
  }

  function toggleInfSelection(id) {
    setSelectedInfIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  async function addSelectedInfluencers() {
    if (selectedInfIds.length === 0) return
    setSavingCI(true)
    try {
      for (const infId of selectedInfIds) {
        await sql`
          INSERT INTO campaign_influencers (campaign_id, influencer_id, costo, piezas, estado, notas, video_link_tt, video_link_ig, boostcode, estado_pago, link_boleta)
          VALUES (${currentCamp.id}, ${infId}, 0, 1, 'Contactado', '', '', '', '', 'Pendiente', '')
        `
      }
      setModalAddInf(false)
      setSelectedInfIds([])
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
      video_link_tt: inf.video_link_tt || '',
      video_link_ig: inf.video_link_ig || '',
      boostcode: inf.boostcode || '',
    })
    setEditCIModal(true)
  }

  async function saveEditCI() {
    try {
      const ttAnterior = editCI.video_link_tt
      const igAnterior = editCI.video_link_ig
      await sql`
        UPDATE campaign_influencers SET
          costo = ${parseInt(editCIForm.costo) || 0},
          piezas = ${parseInt(editCIForm.piezas) || 1},
          estado = ${editCIForm.estado},
          notas = ${editCIForm.notas},
          video_link_tt = ${editCIForm.video_link_tt},
          video_link_ig = ${editCIForm.video_link_ig},
          boostcode = ${editCIForm.boostcode}
        WHERE id = ${editCI.ci_id}
      `
      if (editCIForm.video_link_tt && editCIForm.video_link_tt !== ttAnterior) {
        const existing = await sql`SELECT id FROM posts WHERE campaign_id = ${currentCamp.id} AND influencer_id = ${editCI.influencer_id} AND plataforma = 'TikTok' LIMIT 1`
        if (existing.length === 0) {
          await sql`INSERT INTO posts (campaign_id, influencer_id, plataforma, url) VALUES (${currentCamp.id}, ${editCI.influencer_id}, 'TikTok', ${editCIForm.video_link_tt})`
        } else {
          await sql`UPDATE posts SET url = ${editCIForm.video_link_tt} WHERE id = ${existing[0].id}`
        }
      }
      if (editCIForm.video_link_ig && editCIForm.video_link_ig !== igAnterior) {
        const existing = await sql`SELECT id FROM posts WHERE campaign_id = ${currentCamp.id} AND influencer_id = ${editCI.influencer_id} AND plataforma = 'Instagram' LIMIT 1`
        if (existing.length === 0) {
          await sql`INSERT INTO posts (campaign_id, influencer_id, plataforma, url) VALUES (${currentCamp.id}, ${editCI.influencer_id}, 'Instagram', ${editCIForm.video_link_ig})`
        } else {
          await sql`UPDATE posts SET url = ${editCIForm.video_link_ig} WHERE id = ${existing[0].id}`
        }
      }
      setEditCIModal(false)
      await fetchCamps()
    } catch (e) { console.error(e) }
  }

  const filteredCamps = camps.filter(c => {
    if (tab === 'Todas') return true
    return c.estado === tab.slice(0, -1)
  })

  const availableInfs = roster.filter(inf => {
    if (currentCamp?.influencers.find(i => i.influencer_id === inf.id)) return false
    const q = infSearch.toLowerCase()
    const matchSearch = !q || inf.nombre.toLowerCase().includes(q) ||
      (inf.ig_usuario || '').toLowerCase().includes(q) ||
      (inf.tt_usuario || '').toLowerCase().includes(q)
    const tipos = inf.tipos_contenido || []
    const matchTipo = !infFilterTipo || tipos.includes(infFilterTipo)
    const matchSize = !infFilterSize || (
      getSize(inf.ig_seguidores).label === infFilterSize ||
      getSize(inf.tt_seguidores).label === infFilterSize
    )
    return matchSearch && matchTipo && matchSize
  })

  const isReadOnly = currentCamp && (currentCamp.estado === 'Cerrada' || currentCamp.estado === 'Cancelada')
  const plat = currentCamp?.plataforma || 'Ambas'
  const showIG = plat === 'Ambas' || plat === 'Instagram'
  const showTT = plat === 'Ambas' || plat === 'TikTok'
  const isEspecial = currentCamp && (currentCamp.tipo === 'Nano Blast' || currentCamp.tipo === 'Clipping' || currentCamp.tipo === 'Playlisting')

  function VideoLinkFields({ form, setForm }) {
    return (
      <>
        {showTT && (
          <div className="fg">
            <label className="label">Link video TikTok</label>
            <input className="input" value={form.video_link_tt}
              onChange={e => setForm(f => ({ ...f, video_link_tt: e.target.value }))}
              placeholder="https://tiktok.com/..." />
          </div>
        )}
        {showIG && (
          <div className="fg">
            <label className="label">Link post Instagram</label>
            <input className="input" value={form.video_link_ig}
              onChange={e => setForm(f => ({ ...f, video_link_ig: e.target.value }))}
              placeholder="https://instagram.com/p/..." />
          </div>
        )}
      </>
    )
  }

  function VideoCell({ inf }) {
    const hasTT = inf.video_link_tt
    const hasIG = inf.video_link_ig
    if (!hasTT && !hasIG) return <span style={{ color: '#CCC', fontSize: 12 }}>—</span>
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {showTT && hasTT && (
          <a href={hasTT} target="_blank" rel="noopener noreferrer"
            style={{ color: '#1A1A1A', fontSize: 11.5, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}
            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
          >
            <span style={{ fontSize: 10, background: '#F0F0EE', padding: '1px 5px', borderRadius: 4 }}>TT</span> Ver ↗
          </a>
        )}
        {showIG && hasIG && (
          <a href={hasIG} target="_blank" rel="noopener noreferrer"
            style={{ color: '#C2185B', fontSize: 11.5, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}
            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
          >
            <span style={{ fontSize: 10, background: '#FEF0FB', color: '#6B1560', padding: '1px 5px', borderRadius: 4 }}>IG</span> Ver ↗
          </a>
        )}
      </div>
    )
  }

  if (loading) return <div style={{ padding: 40, color: '#AAA', fontSize: 13 }}>Cargando...</div>

  // ─── VISTA DETALLE ───
  if (currentCamp) {
    const ec = ESTADO_CAMP_COLORS[currentCamp.estado] || ESTADO_CAMP_COLORS['Activa']
    const clientColor = currentCamp.client_color || '#E8313A'
    const hasReporteTT = showTT && currentCamp.reporte_url_tt
    const hasReporteIG = showIG && currentCamp.reporte_url_ig
    const isPlaylisting = currentCamp.tipo === 'Playlisting'

    return (
      <div style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 12, color: '#AAA', cursor: 'pointer', marginBottom: 4 }}
              onClick={() => { setCurrentCamp(null); setCampTab('influencers') }}>
              ← Volver a campañas
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 20, fontWeight: 500 }}>{currentCamp.nombre}</h1>
              <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, background: ec.bg, color: ec.color }}>{currentCamp.estado}</span>
              {!isPlaylisting && <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, background: '#F0F0EE', color: '#666' }}>{plat}</span>}
              {currentCamp.tipo !== 'Estándar' && <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, background: '#1A1A1A', color: '#fff' }}>{currentCamp.tipo}</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
              {currentCamp.client_nombre && <span style={{ fontSize: 12, color: clientColor, fontWeight: 500 }}>{currentCamp.client_nombre}</span>}
              {currentCamp.artista && <span style={{ fontSize: 12, color: '#888' }}>· {currentCamp.artista}{currentCamp.cancion ? ` — "${currentCamp.cancion}"` : ''}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {hasReporteTT && (
              <a href={currentCamp.reporte_url_tt} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, fontSize: 12.5, background: '#1A1A1A', color: '#fff', textDecoration: 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = '#333'}
                onMouseLeave={e => e.currentTarget.style.background = '#1A1A1A'}
              >
                <span style={{ fontSize: 11, background: '#F0F0EE', color: '#555', padding: '1px 5px', borderRadius: 4 }}>TT</span>
                Ver reporte métricas
              </a>
            )}
            {hasReporteIG && (
              <a href={currentCamp.reporte_url_ig} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, fontSize: 12.5, background: '#1A1A1A', color: '#fff', textDecoration: 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = '#333'}
                onMouseLeave={e => e.currentTarget.style.background = '#1A1A1A'}
              >
                <span style={{ fontSize: 11, background: '#FEF0FB', color: '#6B1560', padding: '1px 5px', borderRadius: 4 }}>IG</span>
                Ver reporte métricas
              </a>
            )}
            <button className="btn-ghost" onClick={openEditCamp}>✎ Editar</button>
            <button className="btn-ghost" onClick={() => setChangeEstadoModal(true)}>Cambiar estado</button>
            {!isReadOnly && !isEspecial && campTab === 'influencers' && (
              <button className="btn-red" onClick={openAddInfModal}>+ Agregar influencers</button>
            )}
          </div>
        </div>

        {isReadOnly && (
          <div style={{
            background: currentCamp.estado === 'Cancelada' ? '#FCEBEB' : '#E6F1FB',
            border: `0.5px solid ${currentCamp.estado === 'Cancelada' ? '#F7C1C1' : '#B5D4F4'}`,
            borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 13,
            color: currentCamp.estado === 'Cancelada' ? '#791F1F' : '#0C447C',
          }}>
            Campaña {currentCamp.estado.toLowerCase()} — modo lectura.
          </div>
        )}

        {/* KPIs especiales */}
        {(currentCamp.tipo === 'Nano Blast' || currentCamp.tipo === 'Clipping') && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            {currentCamp.tipo === 'Nano Blast' && (
              <div style={{ background: '#F7F7F5', border: '0.5px solid #E5E5E2', borderRadius: 12, padding: '14px 20px', flex: 1 }}>
                <div style={{ fontSize: 10.5, color: '#AAA', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>Contenidos publicados</div>
                <div style={{ fontSize: 28, fontWeight: 500 }}>{fmtNum(currentCamp.contenidos_count)}</div>
                <div style={{ fontSize: 11, color: '#AAA', marginTop: 2 }}>videos en TikTok</div>
              </div>
            )}
            {currentCamp.tipo === 'Clipping' && (
              <>
                <div style={{ background: '#F7F7F5', border: '0.5px solid #E5E5E2', borderRadius: 12, padding: '14px 20px', flex: '0 0 auto' }}>
                  <div style={{ fontSize: 10.5, color: '#AAA', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>Videos publicados</div>
                  <div style={{ fontSize: 28, fontWeight: 500 }}>{fmtNum(currentCamp.contenidos_count)}</div>
                </div>
                <div style={{ background: '#F7F7F5', border: '0.5px solid #E5E5E2', borderRadius: 12, padding: '14px 20px', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 10.5, color: '#AAA', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>Views logradas</div>
                      <div style={{ fontSize: 28, fontWeight: 500 }}>{fmtNum(currentCamp.views_logradas)}</div>
                    </div>
                    {currentCamp.views_min > 0 && currentCamp.views_max > 0 && (
                      <div style={{ fontSize: 11, color: '#AAA', textAlign: 'right', marginTop: 2 }}>
                        Meta: {fmtNum(currentCamp.views_min)} — {fmtNum(currentCamp.views_max)}
                      </div>
                    )}
                  </div>
                  {currentCamp.views_max > 0 && (
                    <ClippingBar logradas={currentCamp.views_logradas} min={currentCamp.views_min} max={currentCamp.views_max} />
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* KPI Playlisting */}
        {isPlaylisting && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <div style={{ background: '#F7F7F5', border: '0.5px solid #E5E5E2', borderRadius: 12, padding: '14px 20px', flex: 1 }}>
              <div style={{ fontSize: 10.5, color: '#AAA', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>Playlists</div>
              <div style={{ fontSize: 28, fontWeight: 500 }}>{playlists.length}</div>
              <div style={{ fontSize: 11, color: '#AAA', marginTop: 2 }}>en Spotify</div>
            </div>
          </div>
        )}

        <BudgetSummary camp={currentCamp} />
        <SharePanel camp={currentCamp} onUpdate={fetchCamps} />

        {/* Vista Playlisting */}
        {isPlaylisting && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h2 style={{ fontSize: 14, fontWeight: 500 }}>Playlists de Spotify</h2>
            </div>

            {/* Agregar playlist */}
            {!isReadOnly && (
              <div style={{ background: '#F7F7F5', border: '0.5px solid #E5E5E2', borderRadius: 10, padding: 14, marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <div className="fg" style={{ flex: 1, margin: 0 }}>
                    <label className="label">Nombre de la playlist</label>
                    <input className="input" value={playlistForm.nombre}
                      onChange={e => setPlaylistForm(f => ({ ...f, nombre: e.target.value }))}
                      placeholder="Ej: Hits del Verano" />
                  </div>
                  <div className="fg" style={{ flex: 2, margin: 0 }}>
                    <label className="label">Link de Spotify</label>
                    <input className="input" value={playlistForm.link}
                      onChange={e => setPlaylistForm(f => ({ ...f, link: e.target.value }))}
                      placeholder="https://open.spotify.com/playlist/..." />
                  </div>
                  <button className="btn-red" onClick={addPlaylist} disabled={savingPlaylist || !playlistForm.nombre.trim() || !playlistForm.link.trim()}
                    style={{ flexShrink: 0 }}>
                    {savingPlaylist ? '...' : '+ Agregar'}
                  </button>
                </div>
              </div>
            )}

            <div className="card" style={{ overflow: 'hidden' }}>
              {playlists.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#AAA', fontSize: 13 }}>
                  No hay playlists agregadas todavía.
                </div>
              ) : (
                playlists.map((pl, i) => (
                  <div key={pl.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                    borderBottom: i < playlists.length - 1 ? '0.5px solid #F0F0EE' : 'none',
                  }}>
                    {/* Ícono Spotify */}
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: '#1DB954', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 500 }}>{pl.nombre}</div>
                      <a href={pl.link} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 11.5, color: '#1DB954', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: '100%' }}
                        onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                      >
                        {pl.link}
                      </a>
                    </div>
                    <a href={pl.link} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 12, padding: '5px 12px', borderRadius: 7, background: '#1DB954', color: '#fff', textDecoration: 'none', flexShrink: 0 }}>
                      Abrir ↗
                    </a>
                    {!isReadOnly && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn-icon" onClick={() => openEditPlaylist(pl)}>✎</button>
                        <button className="btn-icon btn-icon-danger" onClick={() => setDeletePlaylistId(pl.id)}>✕</button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tabs estándar */}
        {!isEspecial && (
          <>
            <div style={{ display: 'flex', gap: 2, background: '#F0F0EE', borderRadius: 10, padding: 3, marginBottom: 20, width: 'fit-content', border: '0.5px solid #E5E5E2' }}>
              {TABS_DETALLE.map(t => (
                <div key={t} onClick={() => setCampTab(t)} style={{
                  padding: '6px 18px', borderRadius: 8, cursor: 'pointer', fontSize: 12.5,
                  background: campTab === t ? '#fff' : 'transparent',
                  color: campTab === t ? '#1A1A1A' : '#888',
                  boxShadow: campTab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  border: campTab === t ? '0.5px solid #E5E5E2' : '0.5px solid transparent',
                  textTransform: 'capitalize',
                }}>{t}</div>
              ))}
            </div>

            {campTab === 'influencers' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h2 style={{ fontSize: 14, fontWeight: 500 }}>Influencers en campaña</h2>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#AAA' }}>{currentCamp.influencers.length} seleccionados</span>
                    {showTT && (
                      <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => {
                        const links = currentCamp.influencers.map(i => i.video_link_tt).filter(l => l && l.trim())
                        if (!links.length) return alert('No hay links de TikTok cargados')
                        navigator.clipboard.writeText(links.join('\n')).then(() => alert(`${links.length} links copiados`)).catch(() => prompt('Copia:', links.join('\n')))
                      }}>Copiar links TT</button>
                    )}
                    {showIG && (
                      <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => {
                        const links = currentCamp.influencers.map(i => i.video_link_ig).filter(l => l && l.trim())
                        if (!links.length) return alert('No hay links de Instagram cargados')
                        navigator.clipboard.writeText(links.join('\n')).then(() => alert(`${links.length} links copiados`)).catch(() => prompt('Copia:', links.join('\n')))
                      }}>Copiar links IG</button>
                    )}
                  </div>
                </div>
                <div className="card" style={{ overflow: 'hidden' }}>
                  {currentCamp.influencers.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: '#AAA', fontSize: 13 }}>Agrega influencers desde el roster.</div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                        <thead>
                          <tr style={{ background: '#F7F7F5', borderBottom: '0.5px solid #E5E5E2' }}>
                            <th className="th" style={{ width: 180 }}>Influencer</th>
                            {showIG && <th className="th" style={{ width: 100 }}>Instagram</th>}
                            {showTT && <th className="th" style={{ width: 100 }}>TikTok</th>}
                            <th className="th" style={{ width: 110 }}>Categorías</th>
                            <th className="th" style={{ width: 90 }}>Costo</th>
                            <th className="th" style={{ width: 50 }}>Piezas</th>
                            <th className="th" style={{ width: 120 }}>Estado</th>
                            <th className="th" style={{ width: 90 }}>Videos</th>
                            <th className="th" style={{ width: 100 }}>Boostcode</th>
                            {!isReadOnly && <th className="th" style={{ width: 70 }}></th>}
                          </tr>
                        </thead>
                        <tbody>
                          {currentCamp.influencers.map((inf, i) => {
                            const ec = ESTADO_INF_COLORS[inf.ci_estado] || ESTADO_INF_COLORS['Contactado']
                            const igSize = getSize(inf.ig_seguidores)
                            const ttSize = getSize(inf.tt_seguidores)
                            const tipos = inf.tipos_contenido || []
                            return (
                              <tr key={inf.ci_id} style={{ borderBottom: '0.5px solid #F0F0EE' }}>
                                <td className="td">
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Avatar nombre={inf.nombre} index={i} />
                                    <div style={{ fontWeight: 500, fontSize: 13 }}>{inf.nombre}</div>
                                  </div>
                                </td>
                                {showIG && (
                                  <td className="td">
                                    <div style={{ fontSize: 12.5, color: '#555' }}>{fmtSeg(inf.ig_seguidores)}</div>
                                    <span style={{ background: igSize.bg, color: igSize.color, padding: '0 6px', borderRadius: 20, fontSize: 10 }}>{igSize.label}</span>
                                  </td>
                                )}
                                {showTT && (
                                  <td className="td">
                                    <div style={{ fontSize: 12.5, color: '#555' }}>{fmtSeg(inf.tt_seguidores)}</div>
                                    <span style={{ background: ttSize.bg, color: ttSize.color, padding: '0 6px', borderRadius: 20, fontSize: 10 }}>{ttSize.label}</span>
                                  </td>
                                )}
                                <td className="td">
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                    {tipos.slice(0, 2).map(t => {
                                      const c = TIPO_COLORS[t] || TIPO_COLORS['Otros']
                                      return <span key={t} style={{ background: c.bg, color: c.color, padding: '1px 6px', borderRadius: 20, fontSize: 10 }}>{t}</span>
                                    })}
                                    {tipos.length > 2 && <span style={{ fontSize: 10, color: '#AAA' }}>+{tipos.length - 2}</span>}
                                  </div>
                                </td>
                                <td className="td" style={{ fontWeight: 500 }}>{fmtMoney(inf.costo, currentCamp.moneda)}</td>
                                <td className="td" style={{ color: '#555' }}>{inf.piezas}</td>
                                <td className="td">
                                  <span style={{ background: ec.bg, color: ec.color, padding: '2px 8px', borderRadius: 20, fontSize: 11 }}>{inf.ci_estado}</span>
                                </td>
                                <td className="td"><VideoCell inf={inf} /></td>
                                <td className="td">
                                  {inf.boostcode ? <span style={{ fontFamily: 'monospace', fontSize: 12, background: '#F7F7F5', padding: '2px 7px', borderRadius: 6, color: '#555' }}>{inf.boostcode}</span> : <span style={{ color: '#CCC', fontSize: 12 }}>—</span>}
                                </td>
                                {!isReadOnly && (
                                  <td className="td">
                                    <div style={{ display: 'flex', gap: 4 }}>
                                      <button className="btn-icon" onClick={() => openEditCI(inf)}>✎</button>
                                      <button className="btn-icon btn-icon-danger" onClick={() => setDeleteCI(inf.ci_id)}>✕</button>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
            {campTab === 'pagos' && <Pagos camp={currentCamp} onUpdate={fetchCamps} />}
            {campTab === 'reportes' && <Reportes camp={currentCamp} roster={roster} />}
          </>
        )}

        {/* Modals */}
        <Modal open={editCampModal} onClose={() => setEditCampModal(false)} title="Editar campaña">
          <CampFormFields form={editCampForm} setForm={setEditCampForm} error={editCampFormError} clientsList={clientsList} />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button className="btn-ghost" onClick={() => setEditCampModal(false)}>Cancelar</button>
            <button className="btn-red" onClick={saveEditCamp} disabled={savingEditCamp}>
              {savingEditCamp ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </Modal>

        <Modal open={changeEstadoModal} onClose={() => setChangeEstadoModal(false)} title="Cambiar estado">
          <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>Estado actual: <strong>{currentCamp.estado}</strong></p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {['Activa', 'Pausada', 'Cerrada', 'Cancelada'].filter(e => e !== currentCamp.estado).map(estado => {
              const ec = ESTADO_CAMP_COLORS[estado]
              return (
                <button key={estado} onClick={() => updateEstado(currentCamp.id, estado)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, cursor: 'pointer', border: `0.5px solid ${ec.bg}`, background: '#fff', fontSize: 13, fontFamily: 'inherit' }}
                  onMouseEnter={e => e.currentTarget.style.background = ec.bg}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                >
                  <span>{estado}</span>
                  <span style={{ fontSize: 11, background: ec.bg, color: ec.color, padding: '2px 9px', borderRadius: 20 }}>
                    {estado === 'Activa' ? 'En curso' : estado === 'Pausada' ? 'Pausa temporal' : estado === 'Cerrada' ? 'Finalizada' : 'No ejecutada'}
                  </span>
                </button>
              )
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn-ghost" onClick={() => setChangeEstadoModal(false)}>Cancelar</button>
          </div>
        </Modal>

        <Modal open={modalAddInf} onClose={() => setModalAddInf(false)} title="Agregar influencers">
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input className="input" placeholder="Buscar..." value={infSearch} onChange={e => setInfSearch(e.target.value)} style={{ flex: 1 }} />
            <select className="input" style={{ width: 120 }} value={infFilterTipo} onChange={e => setInfFilterTipo(e.target.value)}>
              <option value="">Categoría</option>
              {TIPOS_CONTENIDO.map(t => <option key={t}>{t}</option>)}
            </select>
            <select className="input" style={{ width: 100 }} value={infFilterSize} onChange={e => setInfFilterSize(e.target.value)}>
              <option value="">Tamaño</option>
              {SIZE_RANGES.map(s => <option key={s.label}>{s.label}</option>)}
            </select>
          </div>
          <div style={{ border: '0.5px solid #E5E5E2', borderRadius: 8, maxHeight: 340, overflowY: 'auto', marginBottom: 14 }}>
            {availableInfs.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#AAA', fontSize: 13 }}>Sin resultados</div>
            ) : availableInfs.map((inf, i) => {
              const isSelected = selectedInfIds.includes(inf.id)
              const igS = getSize(inf.ig_seguidores)
              const ttS = getSize(inf.tt_seguidores)
              const tipos = inf.tipos_contenido || []
              return (
                <div key={inf.id} onClick={() => toggleInfSelection(inf.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', cursor: 'pointer', borderBottom: '0.5px solid #F0F0EE', background: isSelected ? '#FEF9F9' : 'transparent' }}
                >
                  <div style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, border: `1.5px solid ${isSelected ? '#E8313A' : '#D0D0CC'}`, background: isSelected ? '#E8313A' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isSelected && <span style={{ fontSize: 11, color: '#fff', fontWeight: 700 }}>✓</span>}
                  </div>
                  <Avatar nombre={inf.nombre} index={i} size={28} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{inf.nombre}</div>
                    <div style={{ fontSize: 11, color: '#AAA', display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
                      {showIG && inf.ig_seguidores > 0 && <span>IG {fmtSeg(inf.ig_seguidores)} <span style={{ background: igS.bg, color: igS.color, padding: '0 5px', borderRadius: 10 }}>{igS.label}</span></span>}
                      {showTT && inf.tt_seguidores > 0 && <span>TT {fmtSeg(inf.tt_seguidores)} <span style={{ background: ttS.bg, color: ttS.color, padding: '0 5px', borderRadius: 10 }}>{ttS.label}</span></span>}
                      {tipos.slice(0, 2).map(t => { const c = TIPO_COLORS[t] || TIPO_COLORS['Otros']; return <span key={t} style={{ background: c.bg, color: c.color, padding: '0 5px', borderRadius: 10 }}>{t}</span> })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 13, color: selectedInfIds.length > 0 ? '#1A1A1A' : '#AAA' }}>
              {selectedInfIds.length > 0 ? <><strong>{selectedInfIds.length}</strong> seleccionado{selectedInfIds.length > 1 ? 's' : ''}</> : 'Selecciona uno o más'}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {selectedInfIds.length > 0 && <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setSelectedInfIds([])}>Limpiar</button>}
              <button className="btn-ghost" onClick={() => setModalAddInf(false)}>Cancelar</button>
              <button className="btn-red" onClick={addSelectedInfluencers} disabled={selectedInfIds.length === 0 || savingCI}>
                {savingCI ? 'Agregando...' : `Agregar${selectedInfIds.length > 0 ? ` (${selectedInfIds.length})` : ''}`}
              </button>
            </div>
          </div>
        </Modal>

        <Modal open={editCIModal} onClose={() => setEditCIModal(false)} title={`Editar — ${editCI?.nombre}`}>
          <div className="form-row-2">
            <div className="fg">
              <label className="label">Costo ({currentCamp.moneda})</label>
              <input className="input" type="number" value={editCIForm.costo} onChange={e => setEditCIForm(f => ({ ...f, costo: e.target.value }))} />
            </div>
            <div className="fg">
              <label className="label">Piezas</label>
              <input className="input" type="number" value={editCIForm.piezas} onChange={e => setEditCIForm(f => ({ ...f, piezas: e.target.value }))} />
            </div>
          </div>
          <div className="fg">
            <label className="label">Estado</label>
            <select className="input" value={editCIForm.estado} onChange={e => setEditCIForm(f => ({ ...f, estado: e.target.value }))}>
              {ESTADOS_INF.map(e => <option key={e}>{e}</option>)}
            </select>
          </div>
          <VideoLinkFields form={editCIForm} setForm={setEditCIForm} />
          <div className="fg">
            <label className="label">Boostcode</label>
            <input className="input" value={editCIForm.boostcode} onChange={e => setEditCIForm(f => ({ ...f, boostcode: e.target.value }))} placeholder="Ej: ABC123" style={{ fontFamily: 'monospace' }} />
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
          <p style={{ fontSize: 13, color: '#555', marginBottom: 20 }}>¿Quitar este influencer? Los datos se perderán.</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn-ghost" onClick={() => setDeleteCI(null)}>Cancelar</button>
            <button className="btn-danger" onClick={() => removeInfluencer(deleteCI)}>Quitar</button>
          </div>
        </Modal>

        <Modal open={editPlaylistModal} onClose={() => setEditPlaylistModal(false)} title="Editar playlist">
          <div className="fg">
            <label className="label">Nombre</label>
            <input className="input" value={editPlaylistForm.nombre}
              onChange={e => setEditPlaylistForm(f => ({ ...f, nombre: e.target.value }))} />
          </div>
          <div className="fg">
            <label className="label">Link de Spotify</label>
            <input className="input" value={editPlaylistForm.link}
              onChange={e => setEditPlaylistForm(f => ({ ...f, link: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button className="btn-ghost" onClick={() => setEditPlaylistModal(false)}>Cancelar</button>
            <button className="btn-red" onClick={saveEditPlaylist}>Guardar</button>
          </div>
        </Modal>

        <Modal open={!!deletePlaylistId} onClose={() => setDeletePlaylistId(null)} title="Eliminar playlist">
          <p style={{ fontSize: 13, color: '#555', marginBottom: 20 }}>¿Eliminar esta playlist?</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn-ghost" onClick={() => setDeletePlaylistId(null)}>Cancelar</button>
            <button className="btn-danger" onClick={() => deletePlaylist(deletePlaylistId)}>Eliminar</button>
          </div>
        </Modal>
      </div>
    )
  }

  // ─── VISTA LISTA ───
  return (
    <div style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 500 }}>Campañas</h1>
          <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{camps.length} campañas en total</p>
        </div>
        <button className="btn-red" onClick={() => { setCampForm(EMPTY_CAMP); setCampFormError(''); setModalNewCamp(true) }}>+ Nueva campaña</button>
      </div>

      <div style={{ display: 'flex', gap: 2, background: '#F0F0EE', borderRadius: 10, padding: 3, marginBottom: 20, width: 'fit-content', border: '0.5px solid #E5E5E2' }}>
        {TABS_LISTA.map(t => {
          const count = t === 'Todas' ? camps.length : camps.filter(c => c.estado === t.slice(0, -1)).length
          return (
            <div key={t} onClick={() => setTab(t)} style={{ padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 5, background: tab === t ? '#fff' : 'transparent', color: tab === t ? '#1A1A1A' : '#888', boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', border: tab === t ? '0.5px solid #E5E5E2' : '0.5px solid transparent' }}>
              {t}{count > 0 && <span style={{ fontSize: 10, color: '#AAA' }}>{count}</span>}
            </div>
          )
        })}
      </div>

      {filteredCamps.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#AAA', fontSize: 13 }}>No hay campañas {tab !== 'Todas' ? tab.toLowerCase() : ''}.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {filteredCamps.map(camp => {
            const usado = camp.influencers.reduce((s, i) => s + Number(i.costo), 0)
            const ec = ESTADO_CAMP_COLORS[camp.estado] || ESTADO_CAMP_COLORS['Activa']
            const isInactive = camp.estado === 'Cerrada' || camp.estado === 'Cancelada'
            const clientColor = camp.client_color || '#AAA'
            const isEspecialCamp = camp.tipo !== 'Estándar'
            return (
              <div key={camp.id} className="card"
                style={{ padding: 18, cursor: 'pointer', transition: 'border-color .15s', opacity: isInactive ? 0.75 : 1 }}
                onClick={() => { setCurrentCamp(camp); setCampTab('influencers') }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#E8313A'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#E5E5E2'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, flex: 1, paddingRight: 8 }}>{camp.nombre}</div>
                  <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                    <span style={{ fontSize: 10.5, padding: '1px 7px', borderRadius: 20, background: ec.bg, color: ec.color }}>{camp.estado}</span>
                    <button className="btn-icon btn-icon-danger" onClick={e => { e.stopPropagation(); setDeleteCampId(camp.id) }}>✕</button>
                  </div>
                </div>
                {camp.client_nombre && <div style={{ fontSize: 11, color: clientColor, fontWeight: 500, marginBottom: 1 }}>{camp.client_nombre}</div>}
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
                  {camp.artista && <span style={{ fontSize: 11, color: '#888' }}>{camp.artista}{camp.cancion ? ` — "${camp.cancion}"` : ''}</span>}
                  {isEspecialCamp && <span style={{ fontSize: 10, background: '#1A1A1A', color: '#fff', padding: '1px 6px', borderRadius: 10 }}>{camp.tipo}</span>}
                  {!camp.artista && !isEspecialCamp && <span style={{ fontSize: 11, color: '#AAA' }}>{camp.plataforma || 'Ambas'}</span>}
                </div>
                <div style={{ display: 'flex', gap: 14, marginBottom: 4 }}>
                  {camp.tipo === 'Playlisting' ? (
                    <div><div style={{ fontSize: 10.5, color: '#AAA' }}>Spotify</div><div style={{ fontSize: 15, fontWeight: 500 }}>Playlisting</div></div>
                  ) : isEspecialCamp ? (
                    <>
                      <div><div style={{ fontSize: 10.5, color: '#AAA' }}>Contenidos</div><div style={{ fontSize: 15, fontWeight: 500 }}>{fmtNum(camp.contenidos_count)}</div></div>
                      {camp.tipo === 'Clipping' && <div><div style={{ fontSize: 10.5, color: '#AAA' }}>Views</div><div style={{ fontSize: 15, fontWeight: 500 }}>{fmtNum(camp.views_logradas)}</div></div>}
                    </>
                  ) : (
                    <>
                      <div><div style={{ fontSize: 10.5, color: '#AAA' }}>Influencers</div><div style={{ fontSize: 15, fontWeight: 500 }}>{camp.influencers.length}</div></div>
                      <div><div style={{ fontSize: 10.5, color: '#AAA' }}>Alcance</div><div style={{ fontSize: 15, fontWeight: 500 }}>{fmtSeg(camp.influencers.reduce((s, i) => s + Number(i.ig_seguidores || 0) + Number(i.tt_seguidores || 0), 0))}</div></div>
                    </>
                  )}
                  <div><div style={{ fontSize: 10.5, color: '#AAA' }}>Moneda</div><div style={{ fontSize: 15, fontWeight: 500 }}>{camp.moneda}</div></div>
                </div>
                <BudgetBar usado={usado} total={Number(camp.budget)} />
              </div>
            )
          })}
        </div>
      )}

      <Modal open={modalNewCamp} onClose={() => setModalNewCamp(false)} title="Nueva campaña">
        <CampFormFields form={campForm} setForm={setCampForm} error={campFormError} clientsList={clientsList} />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
          <button className="btn-ghost" onClick={() => setModalNewCamp(false)}>Cancelar</button>
          <button className="btn-red" onClick={saveCamp} disabled={savingCamp}>{savingCamp ? 'Creando...' : 'Crear campaña'}</button>
        </div>
      </Modal>

      <Modal open={!!deleteCampId} onClose={() => setDeleteCampId(null)} title="Eliminar campaña">
        <p style={{ fontSize: 13, color: '#555', marginBottom: 20 }}>¿Eliminar esta campaña? Se borrarán todos los datos asociados.</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn-ghost" onClick={() => setDeleteCampId(null)}>Cancelar</button>
          <button className="btn-danger" onClick={() => deleteCamp(deleteCampId)}>Eliminar</button>
        </div>
      </Modal>
    </div>
  )
}
