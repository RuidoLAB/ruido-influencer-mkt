import { useState, useEffect } from 'react'
import sql from '../lib/db'

const ESTADO_CAMP_COLORS = {
  Activa:    { bg: '#EAF3DE', color: '#27500A' },
  Pausada:   { bg: '#FAEEDA', color: '#633806' },
  Cerrada:   { bg: '#E6F1FB', color: '#0C447C' },
  Cancelada: { bg: '#FCEBEB', color: '#791F1F' },
}

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
  return SIZE_RANGES.find(r => n >= r.min && n < r.max)?.label || 'Nano'
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

function Avatar({ nombre, index, size = 32 }) {
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

function ProfileLink({ username, link }) {
  if (!username) return <span style={{ color: '#CCC', fontSize: 13 }}>—</span>
  if (link) return (
    <a href={link} target="_blank" rel="noopener noreferrer"
      style={{ color: '#E8313A', fontWeight: 500, textDecoration: 'none', fontSize: 13 }}
      onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
      onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
    >{username} <span style={{ fontSize: 10, opacity: 0.6 }}>↗</span></a>
  )
  return <span style={{ fontSize: 13, color: '#555', fontWeight: 500 }}>{username}</span>
}

function ReporteCard({ url, plataforma }) {
  const isTT = plataforma === 'TikTok'
  const platBg = isTT ? '#F0F0EE' : '#FEF0FB'
  const platColor = isTT ? '#555' : '#6B1560'
  return (
    <div style={{
      background: '#111', borderRadius: 14, padding: '22px 28px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 20, flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>◈</div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 500, color: '#fff' }}>Reporte de métricas</span>
            <span style={{ fontSize: 10.5, padding: '1px 7px', borderRadius: 20, background: platBg, color: platColor }}>{plataforma}</span>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Revisa el reporte completo de resultados de esta campaña.</div>
        </div>
      </div>
      <a href={url} target="_blank" rel="noopener noreferrer"
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 10, background: '#E8313A', color: '#fff', textDecoration: 'none', fontSize: 13.5, fontWeight: 500, flexShrink: 0, transition: 'background .15s' }}
        onMouseEnter={e => e.currentTarget.style.background = '#c9242c'}
        onMouseLeave={e => e.currentTarget.style.background = '#E8313A'}
      >Ver reporte métricas ↗</a>
    </div>
  )
}

export default function VistaClienteDashboard({ token }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCamp, setSelectedCamp] = useState(null)
  const [search, setSearch] = useState('')
  const [filterEstado, setFilterEstado] = useState('')
  const [filterAnio, setFilterAnio] = useState('')
  const [sortOrder, setSortOrder] = useState('reciente')

  useEffect(() => { if (token) fetchData(token) }, [token])

  async function fetchData(t) {
    setLoading(true)
    try {
      const tokenData = await sql`
        SELECT ct.*, c.nombre AS client_nombre, c.color, c.slug
        FROM client_tokens ct
        JOIN clients c ON c.id = ct.client_id
        WHERE ct.token = ${t} AND ct.activo = true
        LIMIT 1
      `
      if (tokenData.length === 0) {
        const check = await sql`SELECT id FROM client_tokens WHERE token = ${t}`
        setError(check.length === 0 ? 'not_found' : 'inactive')
        setLoading(false)
        return
      }

      const clientInfo = tokenData[0]
      const camps = await sql`
        SELECT
          c.id, c.nombre, c.artista, c.cancion, c.estado,
          c.fecha_inicio, c.fecha_termino, c.plataforma,
          c.share_token, c.share_active,
          c.reporte_url_tt, c.reporte_url_ig,
          COUNT(DISTINCT ci.id) AS total_influencers,
          COUNT(DISTINCT CASE WHEN ci.video_link_tt != '' OR ci.video_link_ig != '' THEN ci.id END) AS videos_publicados
        FROM campaigns c
        LEFT JOIN campaign_influencers ci ON ci.campaign_id = c.id
        WHERE c.client_id = ${clientInfo.client_id}
        GROUP BY c.id
        ORDER BY c.created_at DESC
      `
      setData({ client: clientInfo, camps })
    } catch (e) { console.error(e); setError('error') }
    setLoading(false)
  }

  async function openCamp(camp) {
    try {
      const rows = await sql`
        SELECT
          i.nombre, i.ig_usuario, i.ig_seguidores, i.ig_link,
          i.tt_usuario, i.tt_seguidores, i.tt_link,
          i.tipos_contenido,
          ci.video_link_tt, ci.video_link_ig, ci.boostcode
        FROM campaign_influencers ci
        JOIN influencers i ON i.id = ci.influencer_id
        WHERE ci.campaign_id = ${camp.id}
        ORDER BY (i.ig_seguidores + i.tt_seguidores) DESC
      `
      setSelectedCamp({ ...camp, influencers: rows })
    } catch (e) { console.error(e) }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 13, color: '#AAA' }}>Cargando...</div>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#AAA' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>◈</div>
        <div style={{ fontSize: 15, fontWeight: 500, color: '#555', marginBottom: 6 }}>
          {error === 'not_found' ? 'Portal no encontrado' : error === 'inactive' ? 'Este portal ha sido desactivado' : 'Error al cargar'}
        </div>
        <div style={{ fontSize: 13 }}>Contacta a tu agencia.</div>
      </div>
    </div>
  )

  const { client, camps } = data
  const brandColor = client.color || '#E8313A'

  // ─── VISTA CAMPAÑA INDIVIDUAL ───
  if (selectedCamp) {
    const plat = selectedCamp.plataforma || 'Ambas'
    const showIG = plat === 'Ambas' || plat === 'Instagram'
    const showTT = plat === 'Ambas' || plat === 'TikTok'
    const showBoth = plat === 'Ambas'
    const totalIG = selectedCamp.influencers.reduce((s, i) => s + Number(i.ig_seguidores), 0)
    const totalTT = selectedCamp.influencers.reduce((s, i) => s + Number(i.tt_seguidores), 0)
    const totalSeg = (showIG ? totalIG : 0) + (showTT ? totalTT : 0)
    const hasVideoTT = showTT && selectedCamp.influencers.some(i => i.video_link_tt)
    const hasVideoIG = showIG && selectedCamp.influencers.some(i => i.video_link_ig)
    const hasBoostcode = selectedCamp.influencers.some(i => i.boostcode && i.boostcode.trim())
    const hasReporteTT = showTT && selectedCamp.reporte_url_tt
    const hasReporteIG = showIG && selectedCamp.reporte_url_ig
    const hasAnyReporte = hasReporteTT || hasReporteIG

    const thStyle = {
      padding: '11px 16px', textAlign: 'left', fontSize: 10.5,
      fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.08em', color: '#AAA',
    }

    return (
      <div style={{ minHeight: '100vh', background: '#F7F7F5', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        {/* Header campaña */}
        <div style={{ background: '#111', padding: '24px 40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 26, height: 26, background: brandColor, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>
              {client.client_nombre?.slice(0, 2).toUpperCase()}
            </div>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{client.client_nombre}</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>·</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }} onClick={() => setSelectedCamp(null)}>
              ← Volver
            </span>
          </div>

          {/* Título + botones reporte */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 500, color: '#fff', marginBottom: 2 }}>{selectedCamp.nombre}</h1>
              {selectedCamp.artista && (
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                  {selectedCamp.artista}{selectedCamp.cancion ? ` — "${selectedCamp.cancion}"` : ''}
                </p>
              )}
            </div>
            {hasAnyReporte && (
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {hasReporteTT && (
                  <a href={selectedCamp.reporte_url_tt} target="_blank" rel="noopener noreferrer" title="Reporte métricas TikTok"
                    style={{
                      width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.15)',
                      color: '#fff', textDecoration: 'none', fontSize: 13, transition: 'all .15s', flexShrink: 0,
                      flexDirection: 'column', gap: 1,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.16)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
                  >
                    <span style={{ fontSize: 13 }}>◈</span>
                    <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', letterSpacing: '.04em' }}>TT</span>
                  </a>
                )}
                {hasReporteIG && (
                  <a href={selectedCamp.reporte_url_ig} target="_blank" rel="noopener noreferrer" title="Reporte métricas Instagram"
                    style={{
                      width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.15)',
                      color: '#fff', textDecoration: 'none', fontSize: 13, transition: 'all .15s', flexShrink: 0,
                      flexDirection: 'column', gap: 1,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.16)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
                  >
                    <span style={{ fontSize: 13 }}>◈</span>
                    <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', letterSpacing: '.04em' }}>IG</span>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 3 }}>Influencers</div>
              <div style={{ fontSize: 18, fontWeight: 500, color: '#fff' }}>{selectedCamp.influencers.length}</div>
            </div>
            {showIG && <div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 3 }}>Instagram</div>
              <div style={{ fontSize: 18, fontWeight: 500, color: '#fff' }}>{fmtSeg(totalIG)}</div>
            </div>}
            {showTT && <div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 3 }}>TikTok</div>
              <div style={{ fontSize: 18, fontWeight: 500, color: '#fff' }}>{fmtSeg(totalTT)}</div>
            </div>}
            {showBoth && <div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 3 }}>Alcance total</div>
              <div style={{ fontSize: 18, fontWeight: 500, color: '#fff' }}>{fmtSeg(totalSeg)}</div>
            </div>}
          </div>
        </div>

        {/* Tabla influencers */}
        <div style={{ padding: '24px 40px' }}>
          <div style={{ background: '#fff', border: '0.5px solid #E5E5E2', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F7F7F5', borderBottom: '0.5px solid #E5E5E2' }}>
                    <th style={{ ...thStyle, minWidth: 180 }}>Influencer</th>
                    {showIG && <th style={{ ...thStyle, minWidth: 150 }}>Instagram</th>}
                    {showTT && <th style={{ ...thStyle, minWidth: 150 }}>TikTok</th>}
                    <th style={{ ...thStyle, minWidth: 140 }}>Categorías</th>
                    {hasVideoIG && <th style={{ ...thStyle, minWidth: 80 }}>Post IG</th>}
                    {hasVideoTT && <th style={{ ...thStyle, minWidth: 80 }}>Video TT</th>}
                    {hasBoostcode && <th style={{ ...thStyle, minWidth: 110 }}>Boostcode</th>}
                  </tr>
                </thead>
                <tbody>
                  {selectedCamp.influencers.map((inf, i) => {
                    const tipos = inf.tipos_contenido || []
                    const igSize = getSize(inf.ig_seguidores)
                    const ttSize = getSize(inf.tt_seguidores)
                    return (
                      <tr key={i} style={{ borderBottom: i < selectedCamp.influencers.length - 1 ? '0.5px solid #F0F0EE' : 'none' }}>
                        <td style={{ padding: '13px 16px', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Avatar nombre={inf.nombre} index={i} />
                            <span style={{ fontWeight: 500, fontSize: 13 }}>{inf.nombre}</span>
                          </div>
                        </td>
                        {showIG && (
                          <td style={{ padding: '13px 16px', verticalAlign: 'middle' }}>
                            <ProfileLink username={inf.ig_usuario} link={inf.ig_link} />
                            {inf.ig_seguidores > 0 && (
                              <div style={{ fontSize: 11, color: '#AAA', marginTop: 2 }}>
                                {fmtSeg(inf.ig_seguidores)}
                                <span style={{ marginLeft: 4, fontSize: 10, background: '#F1EFE8', color: '#5F5E5A', padding: '0 5px', borderRadius: 10 }}>{igSize}</span>
                              </div>
                            )}
                          </td>
                        )}
                        {showTT && (
                          <td style={{ padding: '13px 16px', verticalAlign: 'middle' }}>
                            <ProfileLink username={inf.tt_usuario} link={inf.tt_link} />
                            {inf.tt_seguidores > 0 && (
                              <div style={{ fontSize: 11, color: '#AAA', marginTop: 2 }}>
                                {fmtSeg(inf.tt_seguidores)}
                                <span style={{ marginLeft: 4, fontSize: 10, background: '#F1EFE8', color: '#5F5E5A', padding: '0 5px', borderRadius: 10 }}>{ttSize}</span>
                              </div>
                            )}
                          </td>
                        )}
                        <td style={{ padding: '13px 16px', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                            {tipos.map(t => {
                              const c = TIPO_COLORS[t] || TIPO_COLORS['Otros']
                              return <span key={t} style={{ background: c.bg, color: c.color, padding: '2px 8px', borderRadius: 20, fontSize: 11 }}>{t}</span>
                            })}
                            {tipos.length === 0 && <span style={{ color: '#CCC', fontSize: 12 }}>—</span>}
                          </div>
                        </td>
                        {hasVideoIG && (
                          <td style={{ padding: '13px 16px', verticalAlign: 'middle' }}>
                            {inf.video_link_ig
                              ? <a href={inf.video_link_ig} target="_blank" rel="noopener noreferrer"
                                  style={{ color: '#C2185B', fontSize: 13, textDecoration: 'none', fontWeight: 500 }}
                                  onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                                  onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                                >Ver ↗</a>
                              : <span style={{ color: '#CCC', fontSize: 12 }}>—</span>}
                          </td>
                        )}
                        {hasVideoTT && (
                          <td style={{ padding: '13px 16px', verticalAlign: 'middle' }}>
                            {inf.video_link_tt
                              ? <a href={inf.video_link_tt} target="_blank" rel="noopener noreferrer"
                                  style={{ color: '#1A1A1A', fontSize: 13, textDecoration: 'none', fontWeight: 500 }}
                                  onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                                  onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                                >Ver ↗</a>
                              : <span style={{ color: '#CCC', fontSize: 12 }}>—</span>}
                          </td>
                        )}
                        {hasBoostcode && (
                          <td style={{ padding: '13px 16px', verticalAlign: 'middle' }}>
                            {inf.boostcode && inf.boostcode.trim()
                              ? <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, background: '#F7F7F5', border: '0.5px solid #E5E5E2', padding: '3px 10px', borderRadius: 6, color: '#1A1A1A', letterSpacing: '.05em' }}>{inf.boostcode}</span>
                              : <span style={{ color: '#CCC', fontSize: 12 }}>—</span>}
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer totales */}
            <div style={{ padding: '14px 16px', background: '#F7F7F5', borderTop: '0.5px solid #E5E5E2', display: 'flex', justifyContent: 'flex-end', gap: 24 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10.5, color: '#AAA', textTransform: 'uppercase', letterSpacing: '.07em' }}>Total influencers</div>
                <div style={{ fontSize: 16, fontWeight: 500 }}>{selectedCamp.influencers.length}</div>
              </div>
              {showIG && <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10.5, color: '#AAA', textTransform: 'uppercase', letterSpacing: '.07em' }}>Instagram</div>
                <div style={{ fontSize: 16, fontWeight: 500 }}>{fmtSeg(totalIG)}</div>
              </div>}
              {showTT && <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10.5, color: '#AAA', textTransform: 'uppercase', letterSpacing: '.07em' }}>TikTok</div>
                <div style={{ fontSize: 16, fontWeight: 500 }}>{fmtSeg(totalTT)}</div>
              </div>}
              {showBoth && <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10.5, color: '#AAA', textTransform: 'uppercase', letterSpacing: '.07em' }}>Alcance total</div>
                <div style={{ fontSize: 16, fontWeight: 500 }}>{fmtSeg(totalSeg)}</div>
              </div>}
            </div>
          </div>

          {/* Tarjetas reporte */}
          {hasAnyReporte && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
              {hasReporteTT && <ReporteCard url={selectedCamp.reporte_url_tt} plataforma="TikTok" />}
              {hasReporteIG && <ReporteCard url={selectedCamp.reporte_url_ig} plataforma="Instagram" />}
            </div>
          )}

          <div style={{ marginTop: 20, textAlign: 'center', fontSize: 11, color: '#CCC' }}>
            Portal generado por RUIDO LAB — Influencer MKT
          </div>
        </div>
      </div>
    )
  }

  // ─── VISTA LISTA DE CAMPAÑAS ───
  const totalCamps = camps.length
  const activas = camps.filter(c => c.estado === 'Activa').length
  const cerradas = camps.filter(c => c.estado === 'Cerrada').length
  const totalInfluencers = camps.reduce((s, c) => s + Number(c.total_influencers), 0)
  const totalVideos = camps.reduce((s, c) => s + Number(c.videos_publicados), 0)
  const anios = [...new Set(camps.map(c => c.created_at ? new Date(c.created_at).getFullYear() : null).filter(Boolean))].sort((a, b) => b - a)

  const filtered = camps
    .filter(c => {
      const q = search.toLowerCase()
      const matchSearch = !q || c.nombre.toLowerCase().includes(q) ||
        (c.artista || '').toLowerCase().includes(q) ||
        (c.cancion || '').toLowerCase().includes(q)
      const matchEstado = !filterEstado || c.estado === filterEstado
      const matchAnio = !filterAnio || (c.created_at && new Date(c.created_at).getFullYear() === parseInt(filterAnio))
      return matchSearch && matchEstado && matchAnio
    })
    .sort((a, b) => sortOrder === 'reciente'
      ? new Date(b.created_at) - new Date(a.created_at)
      : new Date(a.created_at) - new Date(b.created_at)
    )

  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Header */}
      <div style={{ background: '#111', padding: '32px 40px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: brandColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff' }}>
            {client.client_nombre?.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 2 }}>Portal de campañas</div>
            <h1 style={{ fontSize: 22, fontWeight: 500, color: '#fff' }}>{client.client_nombre}</h1>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, auto)', gap: 32, width: 'fit-content' }}>
          {[
            { label: 'Total campañas', value: totalCamps },
            { label: 'Activas', value: activas },
            { label: 'Finalizadas', value: cerradas },
            { label: 'Influencers', value: totalInfluencers },
            { label: 'Videos', value: totalVideos },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 500, color: '#fff' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '28px 40px' }}>
        {/* Filtros */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <input className="input" placeholder="Buscar campaña, artista..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, maxWidth: 280 }} />
          <select className="input" value={filterEstado} onChange={e => setFilterEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            <option>Activa</option><option>Pausada</option>
            <option>Cerrada</option><option>Cancelada</option>
          </select>
          {anios.length > 1 && (
            <select className="input" value={filterAnio} onChange={e => setFilterAnio(e.target.value)}>
              <option value="">Todos los años</option>
              {anios.map(a => <option key={a}>{a}</option>)}
            </select>
          )}
          <select className="input" value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
            <option value="reciente">Más reciente</option>
            <option value="antigua">Más antigua</option>
          </select>
        </div>

        {/* Lista campañas */}
        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#AAA', fontSize: 13 }}>Sin resultados</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(camp => {
              const ec = ESTADO_CAMP_COLORS[camp.estado] || ESTADO_CAMP_COLORS['Activa']
              const plat = camp.plataforma || 'Ambas'
              const hasTT = (plat === 'Ambas' || plat === 'TikTok') && camp.reporte_url_tt
              const hasIG = (plat === 'Ambas' || plat === 'Instagram') && camp.reporte_url_ig
              return (
                <div key={camp.id}
                  style={{
                    background: '#fff', border: '0.5px solid #E5E5E2', borderRadius: 12,
                    padding: '16px 20px', cursor: 'pointer', transition: 'all .15s',
                    display: 'flex', alignItems: 'center', gap: 16,
                  }}
                  onClick={() => openCamp(camp)}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = brandColor; e.currentTarget.style.transform = 'translateX(2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E5E2'; e.currentTarget.style.transform = 'none' }}
                >
                  <div style={{ width: 3, height: 40, borderRadius: 2, background: brandColor, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{camp.nombre}</span>
                      <span style={{ background: ec.bg, color: ec.color, padding: '1px 8px', borderRadius: 20, fontSize: 10.5 }}>{camp.estado}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#AAA' }}>
                      {camp.artista && <span>{camp.artista}</span>}
                      {camp.cancion && <span style={{ fontStyle: 'italic' }}> — "{camp.cancion}"</span>}
                      {!camp.artista && !camp.cancion && <span>Sin artista asignado</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 24, flexShrink: 0, alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 500 }}>{camp.total_influencers}</div>
                      <div style={{ fontSize: 10, color: '#AAA', textTransform: 'uppercase', letterSpacing: '.06em' }}>Influs</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 500 }}>{camp.videos_publicados}</div>
                      <div style={{ fontSize: 10, color: '#AAA', textTransform: 'uppercase', letterSpacing: '.06em' }}>Videos</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: '#888' }}>
                        {camp.fecha_inicio ? new Date(camp.fecha_inicio).toLocaleDateString('es-CL', { month: 'short', year: 'numeric' }) : '—'}
                      </div>
                      <div style={{ fontSize: 10, color: '#AAA', textTransform: 'uppercase', letterSpacing: '.06em' }}>Inicio</div>
                    </div>
                    {/* Botones reporte minimalistas */}
                    {(hasTT || hasIG) && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        {hasTT && (
                          <a href={camp.reporte_url_tt} target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            title="Reporte métricas TikTok"
                            style={{
                              width: 32, height: 32, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: '#F7F7F5', border: '0.5px solid #E5E5E2', color: '#555',
                              textDecoration: 'none', fontSize: 12, transition: 'all .15s', flexDirection: 'column', gap: 1,
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#111'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#111' }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#F7F7F5'; e.currentTarget.style.color = '#555'; e.currentTarget.style.borderColor = '#E5E5E2' }}
                          >
                            <span style={{ fontSize: 12 }}>◈</span>
                            <span style={{ fontSize: 7, letterSpacing: '.04em' }}>TT</span>
                          </a>
                        )}
                        {hasIG && (
                          <a href={camp.reporte_url_ig} target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            title="Reporte métricas Instagram"
                            style={{
                              width: 32, height: 32, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: '#F7F7F5', border: '0.5px solid #E5E5E2', color: '#555',
                              textDecoration: 'none', fontSize: 12, transition: 'all .15s', flexDirection: 'column', gap: 1,
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#111'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#111' }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#F7F7F5'; e.currentTarget.style.color = '#555'; e.currentTarget.style.borderColor = '#E5E5E2' }}
                          >
                            <span style={{ fontSize: 12 }}>◈</span>
                            <span style={{ fontSize: 7, letterSpacing: '.04em' }}>IG</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: 16, color: '#CCC', flexShrink: 0 }}>›</span>
                </div>
              )
            })}
          </div>
        )}

        <div style={{ marginTop: 32, textAlign: 'center', fontSize: 11, color: '#CCC' }}>
          Portal generado por RUIDO LAB — Influencer MKT
        </div>
      </div>
    </div>
  )
}
