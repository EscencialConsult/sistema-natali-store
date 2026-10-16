// Cliente Supabase PÚBLICO e independiente del de Renzo: sin sesión, sin renovación de token, sin leer la URL.
// Así una persona que tiene abierta la app interna en el mismo navegador igual consulta como anónima.
const url = import.meta.env.VITE_SUPABASE_URL
const clave = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseUrl = url ?? ''
export const hayBackendPublico = Boolean(url && clave)

let cliente = null
export function clientePublico() {
  if (!hayBackendPublico) return Promise.resolve(null)
  cliente ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(url, clave, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'tienda-publica-sin-sesion' },
    }),
  )
  return cliente
}
