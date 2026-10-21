// Token vencido: el servidor lo rechaza con "JWT expired" aunque la persona tenga la sesión bien. Pasa cuando el reloj de la PC
// está atrasado (la app cree que el token todavía vale), después de dormir el equipo o con red intermitente justo al renovar.
// Antes la venta quedaba «con problema» y había que esperar. Ahora la consulta se repite UNA vez con un token recién renovado.
const TOKEN_VENCIDO = /JWT expired|PGRST303|"exp" claim timestamp check failed|InvalidJWT/i

async function rechazoPorTokenVencido(respuesta) {
  if (respuesta.status !== 401 && respuesta.status !== 400) return false
  const texto = await respuesta.clone().text().catch(() => '')
  return TOKEN_VENCIDO.test(texto)
}

// obtenerCliente: devuelve el cliente de Supabase (se crea después que esta función). base: el fetch real (se inyecta en pruebas).
export function fetchConRenovacion(obtenerCliente, base = (...args) => globalThis.fetch(...args)) {
  return async (input, init) => {
    const respuesta = await base(input, init)
    const url = typeof input === 'string' ? input : (input?.url ?? String(input))
    // Las llamadas de inicio de sesión y renovación no se reintentan acá: las maneja la propia librería.
    if (url.includes('/auth/v1/') || !(await rechazoPorTokenVencido(respuesta))) return respuesta

    let sesion = null
    try {
      sesion = (await obtenerCliente()?.auth.refreshSession())?.data?.session ?? null
    } catch {
      /* sin conexión o sesión terminada: se devuelve el rechazo original */
    }
    if (!sesion) return respuesta
    const headers = new Headers(init?.headers)
    headers.set('Authorization', `Bearer ${sesion.access_token}`)
    return base(input, { ...init, headers })
  }
}
