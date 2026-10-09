// Conexión con Supabase. Todo viene de la base de datos: sin estas variables la app muestra "falta configurar el servidor".
// Las claves van en app/.env.local (que git ignora). Aquí solo se usa la clave PÚBLICA (anon): es segura en el navegador porque
// lo que se puede hacer lo decide la base (permisos por rol, ver supabase/migrations). La clave de servicio NUNCA va en la app.
const url = import.meta.env.VITE_SUPABASE_URL
const claveAnonima = import.meta.env.VITE_SUPABASE_ANON_KEY

export const hayBackend = Boolean(url && claveAnonima)

let cliente = null

// El paquete de Supabase se carga recién cuando hace falta (la primera pantalla abre más rápido).
export function obtenerSupabase() {
  if (!hayBackend) return Promise.resolve(null)
  cliente ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(url, claveAnonima, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    }),
  )
  return cliente
}
