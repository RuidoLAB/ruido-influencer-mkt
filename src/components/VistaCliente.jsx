import { useState, useEffect } from 'react'
import sql from '../lib/db'

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

function Avatar({ nombre, index, size = 36 }) {
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

export default function VistaCliente({ token }) {
  const [camp, setCamp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (token) fetchPublicCamp(token)
  }, [token])

  async function fetchPublicCamp(t) {
    setLoading(true)
    try {
      const rows = await sql`
        SELECT
          c.nombre AS camp_nombre,
          c.cliente,
          i.nombre,
          i.ig_usuario, i.ig_seguidores,
          i.tt_usuario, i.tt_seguidores,
          i.tipo_contenido, i.avatar_url
        FROM campaigns c
        JOIN campaign_influencers ci ON ci.campaign_id = c.id
        JOIN influencers i ON i.id = ci.influencer_id
        WHERE c.share_token = ${t}
          AND c.share_active = true
      `
      if (rows.length === 0) {
        const check = await sql`
          SELECT id FROM campaigns WHERE share_token = ${t}
        `
        if (check.length === 0) setError('not_found')
        else setError('inactive')
      } else {
        setCamp({
          nombre: rows[0].camp_nombre,
          cliente: rows[0].cliente,
          influencers: rows,
        })
      }
    } catch (e) {
      console.error(e)
      setError('error')
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F7F5' }}>
        <div style={{ fontSize: 13, color: '#AAA' }}>Cargando propuesta...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F7F5' }}>
        <div style={{ textAlign: 'center', color: '#AAA' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>◈</div>
          <div style={{ fontSize: 15, fontWeight: 500, color: '#555', marginBottom: 6 }}>
            {error === 'not_found' ? 'Propuesta no encontrada' : error === 'inactive' ? 'Este link ha sido desactivado' : 'Error al cargar la propuesta'}
          </div>
          <div style={{ fontSize: 13 }}>
            {error === 'not_found' ? 'Verifica el link con tu agencia.' : error === 'inactive' ? 'Contacta a tu agencia para obtener un link actualizado.' : 'Intenta recargar la página.'}
          </div>
        </div>
      </div>
    )
  }

  const totalSeg = camp.influencers.reduce((s, i) => s + Number(i.ig_seguidores) + Number(i.tt_seguidores), 0)
  const totalIG = camp.influencers.reduce((s, i) => s + Number(i.ig_seguidores), 0)
  const totalTT = camp.influencers.reduce((s, i) => s + Number(i.tt_seguidores), 0)

  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Header */}
      <div style={{ background: '#111', padding: '28px 40px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 28, height: 28, background: '#E8313A', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>R</div>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', letterSpacing: '.05em' }}>RUIDO — Influencer MKT</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 500, color: '#fff', marginBottom: 4 }}>{camp.nombre}</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Propuesta para {camp.cliente}</p>
        </div>
        <div style={{ display: 'flex', gap: 20, textAlign: 'right' }}>
          <div>
            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>Influencers</div>
            <div style={{ fontSize: 20, fontWeight: 500, color: '#fff' }}>{camp.influencers.length}</div>
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>Alcance total</div>
            <div style={{ fontSize: 20, fontWeight: 500, color: '#fff' }}>{fmtSeg(totalSeg)}</div>
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>Instagram</div>
            <div style={{ fontSize: 20, fontWeight: 500, color: '#fff' }}>{fmtSeg(totalIG)}</div>
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>TikTok</div>
            <div style={{ fontSize: 20, fontWeight: 500, color: '#fff' }}>{fmtSeg(totalTT)}</div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div style={{ padding: '28px 40px' }}>
        <div style={{ background: '#fff', border: '0.5px solid #E5E5E2', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <thead>
                <tr style={{ background: '#F7F7F5', borderBottom: '0.5px solid #E5E5E2' }}>
                  <th style={{ padding: '11px 16px', textAlign: 'left', fontSize: 10.5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.08em', color: '#AAA', width: 220 }}>Influencer</th>
                  <th style={{ padding: '11px 16px', textAlign: 'left', fontSize: 10.5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.08em', color: '#AAA', width: 150 }}>Instagram</th>
                  <th style={{ padding: '11px 16px', textAlign: 'left', fontSize: 10.5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.08em', color: '#AAA', width: 150 }}>TikTok</th>
                  <th style={{ padding: '11px 16px', textAlign: 'left', fontSize: 10.5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.08em', color: '#AAA', width: 110 }}>Total seg.</th>
                  <th style={{ padding: '11px 16px', textAlign: 'left', fontSize: 10.5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.08em', color: '#AAA', width: 100 }}>Tipo</th>
                </tr>
              </thead>
              <tbody>
                {camp.influencers.map((inf, i) => {
                  const total = Number(inf.ig_seguidores) + Number(inf.tt_seguidores)
                  const tc = TIPO_COLORS[inf.tipo_contenido] || TIPO_COLORS['Otros']
                  return (
                    <tr key={i} style={{ borderBottom: i < camp.influencers.length - 1 ? '0.5px solid #F0F0EE' : 'none' }}>
                      <td style={{ padding: '13px 16px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar nombre={inf.nombre} index={i} />
                          <span style={{ fontWeight: 500, fontSize: 13 }}>{inf.nombre}</span>
                        </div>
                      </td>
                      <td style={{ padding: '13px 16px', verticalAlign: 'middle' }}>
                        <div style={{ fontSize: 13, color: '#555' }}>{inf.ig_usuario || '—'}</div>
                        <div style={{ fontSize: 11, color: '#AAA' }}>{inf.ig_seguidores ? fmtSeg(inf.ig_seguidores) + ' seg.' : ''}</div>
                      </td>
                      <td style={{ padding: '13px 16px', verticalAlign: 'middle' }}>
                        <div style={{ fontSize: 13, color: '#555' }}>{inf.tt_usuario || '—'}</div>
                        <div style={{ fontSize: 11, color: '#AAA' }}>{inf.tt_seguidores ? fmtSeg(inf.tt_seguidores) + ' seg.' : ''}</div>
                      </td>
                      <td style={{ padding: '13px 16px', verticalAlign: 'middle', fontWeight: 500, fontSize: 13 }}>{fmtSeg(total)}</td>
                      <td style={{ padding: '13px 16px', verticalAlign: 'middle' }}>
                        <span style={{ background: tc.bg, color: tc.color, padding: '2px 9px', borderRadius: 20, fontSize: 11 }}>
                          {inf.tipo_contenido}
                        </span>
                      </td>
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
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10.5, color: '#AAA', textTransform: 'uppercase', letterSpacing: '.07em' }}>Alcance total</div>
              <div style={{ fontSize: 16, fontWeight: 500 }}>{fmtSeg(totalSeg)}</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 11, color: '#CCC' }}>
          Propuesta generada por RUIDO Influencer MKT
        </div>
      </div>
    </div>
  )
}
