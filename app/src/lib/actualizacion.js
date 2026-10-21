// Punto único para pedirle al navegador «¿hay una versión nueva de la app?». Lo usa el chequeo automático (ActualizacionPWA)
// y el botón «Buscar actualización» de Ajustes. Antes solo había un chequeo cada 30 minutos y, en una PC que queda abierta todo
// el día en Nueva venta, la versión nueva podía tardar horas en llegar sin que nadie pudiera forzarla.
let registro = null

export const guardarRegistro = (r) => {
  registro = r
}

// 'nueva' (se descargó una versión y está lista) · 'al_dia' · 'error' (sin conexión o servidor caído) · 'sin_sw' (no hay service worker).
export async function buscarActualizacion() {
  if (!registro) return 'sin_sw'
  try {
    await registro.update()
  } catch {
    return 'error'
  }
  return registro.installing || registro.waiting ? 'nueva' : 'al_dia'
}
