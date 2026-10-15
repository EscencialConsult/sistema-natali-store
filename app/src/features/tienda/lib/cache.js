// Caché propia de la tienda: nombre y versión propios, nunca toca el service worker ni la IndexedDB de Renzo.
const VERSION = 'tienda-v1'

export function guardarCache(clave, datos, origen = '') {
  try {
    localStorage.setItem(`${VERSION}:${origen}:${clave}`, JSON.stringify({ t: Date.now(), datos }))
  } catch {
    /* sin almacenamiento: la tienda funciona igual, solo sin caché */
  }
}

export function leerCache(clave, origen = '') {
  try {
    const crudo = localStorage.getItem(`${VERSION}:${origen}:${clave}`)
    if (!crudo) return null
    const { t, datos } = JSON.parse(crudo)
    return typeof t === 'number' ? { t, datos } : null
  } catch {
    return null
  }
}
