// Conexión con Supabase. Si no hay variables de entorno, la app funciona 100% local (modo prueba con datos de ejemplo).
// Las claves van en app/.env.local (que git ignora). Aquí solo se usa la clave PÚBLICA (anon): es segura en el navegador porque
// lo que se puede hacer lo decide la base (permisos por rol, ver supabase/migrations). La clave de servicio NUNCA va en la app.
const url = import.meta.env.VITE_SUPABASE_URL
const claveAnonima = import.meta.env.VITE_SUPABASE_ANON_KEY

export const hayBackend = Boolean(url && claveAnonima)

let cliente = null

// Se carga recién cuando hace falta: en modo local el paquete de Supabase ni se descarga.
export function obtenerSupabase() {
  if (!hayBackend) return Promise.resolve(null)
  cliente ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(url, claveAnonima, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    }),
  )
  return cliente
}
