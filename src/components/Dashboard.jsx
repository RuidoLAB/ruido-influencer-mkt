import { useState, useEffect } from 'react'
import sql from '../lib/db'

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

function KPI({ label, value, sub, subColor }) {
  return (
    <div style={{
      background: '#fff', border: '0.5px solid #E5E5E2',
      borderRadius: 12, padding: '16px 18px',
    }}>
      <div style={{ fontSize: 11, color: '#AAA', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 500, color: '#1A1A1A', lineHeight: 1 }}>{value}</div>
      {sub && (
        <div style={{ fontSize: 11, color: subColor || '#AAA', marginTop: 6 }}>{sub}</div>
      )}
    </div>
  )
}

function BudgetBar({ usado, total, moneda }) {
  const pct = total > 0 ? Math.min(100, Math.round((usado / total) * 100)) : 0
  const barColor = pct >= 100 ? '#E24B4A' : pct >= 90 ? '#EF9F27' : '#639922'
  const textColor = pct >= 100 ? '#A32D2D' : pct >= 90 ? '#854F0B' : '#3B6D11'
  const bgColor = pct >= 100 ? '#FCEBEB' : pct >= 90 ? '#FAEEDA' : '#EAF3DE'
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <span style={{ fontSize: 11, background: bgColor, color: textColor, padding: '1px 7px', borderRadius: 20 }}>
          {pct}% usado
        </span>
        <span style={{ fontSize: 11, color: '#AAA' }}>
          {fmtMoney(usado, moneda)} / {fmtMoney(total, moneda)}
        </span>
      </div>
      <div style={{ height: 4, background: '#F0F0EE', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: pct + '%', background: barColor, borderRadius: 2 }} />
      </div>
    </div>
  )
}

export default function Dashboard({ onNavigate }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchDashboard() }, [])

  async function fetchDashboard() {
    setLoading(true)
    try {
      const [infRows, campRows, ciRows] = await Promise.all([
        sql`
          SELECT id, nombre, ig_seguidores, tt_seguidores, tipo_contenido, estado,
            (ig_seguidores + tt_seguidores) AS total_seguidores
          FROM influencers
          ORDER BY (ig_seguidores + tt_seguidores) DESC
        `,
        sql`
          SELECT * FROM campaigns ORDER BY created_at DESC
        `,
        sql`
          SELECT campaign_id, influencer_id, costo FROM campaign_influencers
        `,
      ])

      const now = new Date()
      const mesActual = now.getMonth()
      const anioActual = now.getFullYear()

      const campsConDatos = campRows.map(c => {
        const infs = ciRows.filter(ci => ci.campaign_id === c.id)
        const usado = infs.reduce((s, i) => s + Number(i.costo), 0)
        const creado = new Date(c.created_at)
        const esMes = creado.getMonth() === mesActual && creado.getFullYear() === anioActual
        return { ...c, usado, esMes }
      })

      setData({
        influencers: infRows,
        campaigns: campsConDatos,
        totalSeg: infRows.reduce((s, i) => s + Number(i.total_seguidores), 0),
        activos: infRows.filter(i => i.estado === 'Activo').length,
      })
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  if (loading) return <div style={{ padding: 40, color: '#AAA', fontSize: 13 }}>Cargando...</div>
  if (!data) return null

  const campsMes = data.campaigns.filter(c => c.esMes)
  const topInfs = data.influencers.slice(0, 8)

  const mesNombre = new Date().toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })

  return (
    <div style={{ padding: '20px 24px' }}>

      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 20, fontWeight: 500 }}>Dashboard</h1>
        <p style={{ fontSize: 12, color: '#AAA', marginTop: 2 }}>
          {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <KPI
          label="Influencers en roster"
          value={data.influencers.length}
          sub={`${data.activos} activos`}
          subColor="#3B6D11"
        />
        <KPI
          label="Campañas totales"
          value={data.campaigns.length}
          sub={`${campsMes.length} este mes`}
          subColor="#0C447C"
        />
        <KPI
          label="Alcance total roster"
          value={fmtSeg(data.totalSeg)}
          sub="seguidores acumulados"
        />
        <KPI
          label="Presupuesto administrado"
          value={fmtMoney(data.campaigns.reduce((s, c) => s + Number(c.budget), 0), 'CLP')}
          sub="en todas las campañas"
        />
      </div>

      {/* Dos columnas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Top influencers */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 13, fontWeight: 500 }}>Top influencers por seguidores</h2>
            <span
              style={{ fontSize: 12, color: '#E8313A', cursor: 'pointer' }}
              onClick={() => onNavigate('roster')}
            >
              Ver roster →
            </span>
          </div>
          <div style={{ background: '#fff', border: '0.5px solid #E5E5E2', borderRadius: 12, overflow: 'hidden' }}>
            {topInfs.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#AAA', fontSize: 13 }}>
                Aún no hay influencers en el roster.
              </div>
            ) : topInfs.map((inf, i) => (
              <div
                key={inf.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '11px 14px',
                  borderBottom: i < topInfs.length - 1 ? '0.5px solid #F0F0EE' : 'none',
                }}
              >
                <span style={{ fontSize: 11, color: '#CCC', width: 16, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                <Avatar nombre={inf.nombre} index={i} size={30} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {inf.nombre}
                  </div>
                  <div style={{ fontSize: 11, color: '#AAA' }}>{inf.tipo_contenido}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{fmtSeg(inf.total_seguidores)}</div>
                  <div style={{ fontSize: 10, color: '#CCC' }}>
                    IG {fmtSeg(inf.ig_seguidores)} · TT {fmtSeg(inf.tt_seguidores)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Campañas del mes */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 13, fontWeight: 500 }}>Campañas — {mesNombre}</h2>
            <span
              style={{ fontSize: 12, color: '#E8313A', cursor: 'pointer' }}
              onClick={() => onNavigate('campanas')}
            >
              Ver todas →
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {campsMes.length === 0 ? (
              <div style={{
                background: '#fff', border: '0.5px solid #E5E5E2', borderRadius: 12,
                padding: 32, textAlign: 'center', color: '#AAA', fontSize: 13,
              }}>
                No hay campañas creadas este mes.
              </div>
            ) : campsMes.map(camp => (
              <div
                key={camp.id}
                className="card"
                style={{ padding: '14px 16px', cursor: 'pointer', transition: 'border-color .15s' }}
                onClick={() => onNavigate('campanas')}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#E8313A'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#E5E5E2'}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 2 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, flex: 1, paddingRight: 8 }}>{camp.nombre}</div>
                  <span style={{
                    fontSize: 10.5, padding: '1px 7px', borderRadius: 20, flexShrink: 0,
                    background: camp.estado === 'Activa' ? '#EAF3DE' : '#F1EFE8',
                    color: camp.estado === 'Activa' ? '#27500A' : '#5F5E5A',
                  }}>
                    {camp.estado}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#AAA', marginBottom: 8 }}>{camp.cliente}</div>
                <BudgetBar usado={camp.usado} total={Number(camp.budget)} moneda={camp.moneda} />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
