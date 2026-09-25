import supabase from './supabaseClient'

// Reemplazo drop-in de `neon(...)`: se usa exactamente igual —
// `sql\`SELECT * FROM x WHERE id = ${id}\`` — pero por dentro NO habla
// directo con Postgres. Arma la consulta parametrizada y se la manda a
// nuestro propio backend (/api/query), que es el único lugar donde vive
// la contraseña real de la base de datos.
async function sql(strings, ...values) {
  let text = strings[0]
  const params = []
  values.forEach((v, i) => {
    params.push(v)
    text += `$${i + 1}` + strings[i + 1]
  })

  // Si hay sesión iniciada (Lucas/Nico logueados), mandamos su token para
  // que el backend permita también escrituras/borrados, no solo lecturas.
  const { data: { session } } = await supabase.auth.getSession()

  const res = await fetch('/api/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify({ text, params }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Error de base de datos')
  }

  const { rows } = await res.json()
  return rows
}

export default sql
