// Impresión del ticket (ver docs/06-kiosco-e-impresion.md).
// Camino 1: window.print con la hoja de 80 mm de styles/impresion-ticket.css (Chrome --kiosk-printing imprime sin diálogo).
// Camino 2: si la configuración del kiosco tiene `agente_url`, se manda el pedido en JSON a un agente ESC/POS local.
const ESPERA_MAX_MS = 15_000

export function imprimirPorNavegador() {
  return new Promise((resolver) => {
    let listo = false
    const terminar = (ok) => {
      if (listo) return
      listo = true
      window.removeEventListener('afterprint', alTerminar)
      clearTimeout(t)
      resolver(ok)
    }
    const alTerminar = () => terminar(true)
    window.addEventListener('afterprint', alTerminar)
    // Si en 15 s no hubo afterprint (diálogo cancelado, impresora apagada), se informa como no impreso.
    const t = setTimeout(() => terminar(false), ESPERA_MAX_MS)
    try {
      window.print()
    } catch {
      terminar(false)
    }
  })
}

export async function imprimirPorAgente(url, pedido, extra = {}) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 8_000)
  try {
    const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ pedido, ...extra }), signal: ctrl.signal })
    return r.ok
  } catch {
    return false
  } finally {
    clearTimeout(t)
  }
}

// Elige el camino según la configuración. Devuelve true si se imprimió (o el navegador lo reportó así).
export function imprimirTicket({ pedido, agenteUrl = '', negocio, whatsapp, direccion, pie }) {
  if (agenteUrl) return imprimirPorAgente(agenteUrl, pedido, { negocio, whatsapp, direccion, pie })
  return imprimirPorNavegador()
}
