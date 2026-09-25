import { createClient } from '@supabase/supabase-js'

// La "anon key" está diseñada para ser pública — a diferencia de la connection
// string de Postgres que usábamos antes, esta clave por sí sola NO permite
// leer ni escribir nada en la base de datos sin pasar por nuestro backend
// (ver /api/query.js) o sin estar logueado.
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export default supabase
