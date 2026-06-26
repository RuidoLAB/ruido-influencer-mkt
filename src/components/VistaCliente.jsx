import { useState, useEffect } from 'react'
import sql from '../lib/db'

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

function Avatar({ nombre, index, size = 36 }) {
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

export default function VistaCliente({ token }) {
  const [camp, setCamp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => { if (token) fetchPublicCamp(token) }, [token])

  async function fetchPublicCamp(t) {
    setLoading(true)
    try {
      const rows = await sql`
        SELECT
          c.nombre AS camp_nombre, c.cliente, c.plataforma, c.reporte_url,
          i.nombre,
          i.ig_usuario, i.ig_seguidores, i.ig_link,
          i.tt_usuario, i.tt_seguidores, i.tt_link,
          i.tipos_contenido, i.avatar_url,
          ci.video_link_tt, ci.video_link_ig,
          ci.boostcode
        FROM campaigns c
        JOIN campaign_influencers ci ON ci.campaign_id = c.id
        JOIN influencers i ON i.id = ci.influencer_id
        WHERE c.share_token = ${t} AND c.share_active = true
      `
      if (rows.length === 0) {
        const check = await sql`SELECT id FROM campaigns WHERE share_token = ${t}`
        setError(check.length === 0 ? 'not_found' : 'inactive')
      } else {
        setCamp({
          nombre: rows[0].camp_nombre,
          cliente: rows[0].cliente,
          plataforma: rows[0].plataforma || 'Ambas',
          reporte_url: rows[0].reporte_url || '',
          influencers: rows.sort((a, b) =>
            (Number(b.ig_seguidores) + Number(b.tt_seguidores)) -
            (Number(a.ig_seguidores) + Number(a.tt_seguidores))
          ),
        })
      }
    } catch (e) { console.error(e); setError('error') }
    setLoading(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F7F5' }}>
      <div style={{ fontSize: 13, color: '#AAA' }}>Cargando propuesta...</div>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F7F5' }}>
      <div style={{ textAlign: 'center', color: '#AAA' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>◈</div>
        <div style={{ fontSize: 15, fontWeight: 500, color: '#555', marginBottom: 6 }}>
          {error === 'not_found' ? 'Propuesta no encontrada' : error === 'inactive' ? 'Este link ha sido desactivado' : 'Error al cargar'}
        </div>
        <div style={{ fontSize: 13 }}>
          {error === 'not_found' ? 'Verifica el link con tu agencia.' : 'Contacta a tu agencia para obtener un link actualizado.'}
        </div>
      </div>
    </div>
  )

  const plat = camp.plataforma || 'Ambas'
  const showIG = plat === 'Ambas' || plat === 'Instagram'
  const showTT = plat === 'Ambas' || plat === 'TikTok'
  const showBoth = plat === 'Ambas'

  const totalIG = camp.influencers.reduce((s, i) => s + Number(i.ig_seguidores), 0)
  const totalTT = camp.influencers.reduce((s, i) => s + Number(i.tt_seguidores), 0)
  const totalSeg = (showIG ? totalIG : 0) + (showTT ? totalTT : 0)

  const hasVideoTT = showTT && camp.influencers.some(i => i.video_link_tt)
  const hasVideoIG = showIG && camp.influencers.some(i => i.video_link_ig)
  const hasBoostcode = camp.influencers.some(i => i.boostcode && i.boostcode.trim() !== '')

  const thStyle = {
    padding: '11px 16px', textAlign: 'left', fontSize: 10.5,
    fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.08em', color: '#AAA',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Header */}
      <div style={{ background: '#111', padding: '28px 40px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 28, height: 28, background: '#E8313A', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>R</div>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', letterSpacing: '.05em' }}>RUIDO LAB — Influencer MKT</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 500, color: '#fff', marginBottom: 4 }}>{camp.nombre}</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
            Propuesta para {camp.cliente}
            {plat !== 'Ambas' && <span style={{ marginLeft: 8, background: 'rgba(255,255,255,0.1)', padding: '1px 8px', borderRadius: 20, fontSize: 11 }}>{plat}</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 20, textAlign: 'right', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>Influencers</div>
            <div style={{ fontSize: 20, fontWeight: 500, color: '#fff' }}>{camp.influencers.length}</div>
          </div>
          {showIG && (
            <div>
              <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>Instagram</div>
              <div style={{ fontSize: 20, fontWeight: 500, color: '#fff' }}>{fmtSeg(totalIG)}</div>
            </div>
          )}
          {showTT && (
            <div>
              <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>TikTok</div>
              <div style={{ fontSize: 20, fontWeight: 500, color: '#fff' }}>{fmtSeg(totalTT)}</div>
            </div>
          )}
          {showBoth && (
            <div>
              <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>Alcance total</div>
              <div style={{ fontSize: 20, fontWeight: 500, color: '#fff' }}>{fmtSeg(totalSeg)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div style={{ padding: '28px 40px' }}>
        <div style={{ background: '#fff', border: '0.5px solid #E5E5E2', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F7F7F5', borderBottom: '0.5px solid #E5E5E2' }}>
                  <th style={{ ...thStyle, minWidth: 180 }}>Influencer</th>
                  {showIG && <th style={{ ...thStyle, minWidth: 150 }}>Instagram</th>}
                  {showTT && <th style={{ ...thStyle, minWidth: 150 }}>TikTok</th>}
                  <th style={{ ...thStyle, minWidth: 150 }}>Categorías</th>
                  {hasVideoIG && <th style={{ ...thStyle, minWidth: 80 }}>Post IG</th>}
                  {hasVideoTT && <th style={{ ...thStyle, minWidth: 80 }}>Video TT</th>}
                  {hasBoostcode && <th style={{ ...thStyle, minWidth: 110 }}>Boostcode</th>}
                </tr>
              </thead>
              <tbody>
                {camp.influencers.map((inf, i) => {
                  const tipos = inf.tipos_contenido || []
                  const igSize = getSize(inf.ig_seguidores)
                  const ttSize = getSize(inf.tt_seguidores)
                  return (
                    <tr key={i} style={{ borderBottom: i < camp.influencers.length - 1 ? '0.5px solid #F0F0EE' : 'none' }}>
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
                            : <span style={{ color: '#CCC', fontSize: 12 }}>—</span>
                          }
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
                            : <span style={{ color: '#CCC', fontSize: 12 }}>—</span>
                          }
                        </td>
                      )}
                      {hasBoostcode && (
                        <td style={{ padding: '13px 16px', verticalAlign: 'middle' }}>
                          {inf.boostcode && inf.boostcode.trim()
                            ? <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, background: '#F7F7F5', border: '0.5px solid #E5E5E2', padding: '3px 10px', borderRadius: 6, color: '#1A1A1A', letterSpacing: '.05em' }}>{inf.boostcode}</span>
                            : <span style={{ color: '#CCC', fontSize: 12 }}>—</span>
                          }
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
              <div style={{ fontSize: 16, fontWeight: 500 }}>{camp.influencers.length}</div>
            </div>
            {showIG && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10.5, color: '#AAA', textTransform: 'uppercase', letterSpacing: '.07em' }}>Instagram</div>
                <div style={{ fontSize: 16, fontWeight: 500 }}>{fmtSeg(totalIG)}</div>
              </div>
            )}
            {showTT && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10.5, color: '#AAA', textTransform: 'uppercase', letterSpacing: '.07em' }}>TikTok</div>
                <div style={{ fontSize: 16, fontWeight: 500 }}>{fmtSeg(totalTT)}</div>
              </div>
            )}
            {showBoth && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10.5, color: '#AAA', textTransform: 'uppercase', letterSpacing: '.07em' }}>Alcance total</div>
                <div style={{ fontSize: 16, fontWeight: 500 }}>{fmtSeg(totalSeg)}</div>
              </div>
            )}
          </div>
        </div>

        {/* Tarjeta reporte de métricas — solo si existe el link */}
        {camp.reporte_url && (
          <div style={{
            marginTop: 20,
            background: '#111',
            borderRadius: 14,
            padding: '22px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
            flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, flexShrink: 0,
              }}>◈</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 500, color: '#fff', marginBottom: 3 }}>
                  Reporte de métricas
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
                  Revisa el reporte completo de resultados de esta campaña.
                </div>
              </div>
            </div>
            <a
              href={camp.reporte_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 22px', borderRadius: 10,
                background: '#E8313A', color: '#fff',
                textDecoration: 'none', fontSize: 13.5, fontWeight: 500,
                flexShrink: 0, transition: 'background .15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#c9242c'}
              onMouseLeave={e => e.currentTarget.style.background = '#E8313A'}
            >
              Ver reporte métricas ↗
            </a>
          </div>
        )}

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 11, color: '#CCC' }}>
          Propuesta generada por RUIDO LAB — Influencer MKT
        </div>
      </div>
    </div>
  )
}
