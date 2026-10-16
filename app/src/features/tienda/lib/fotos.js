// Las rutas de foto pueden ser URL absolutas o relativas al bucket público `naty_productos` (como en sync/remoto.js).
export const BUCKET = 'naty_productos'

export function urlDeFoto(ruta, supabaseUrl) {
  const r = String(ruta ?? '').trim()
  if (!r) return null
  if (/^https:\/\//i.test(r)) return r
  if (/^[a-z][a-z0-9+.-]*:/i.test(r) || r.startsWith('//')) return null // otros protocolos: no se aceptan
  if (!supabaseUrl) return null
  const limpia = r.replace(/^\/+/, '').split('/').map(encodeURIComponent).join('/')
  return `${String(supabaseUrl).replace(/\/+$/, '')}/storage/v1/object/public/${BUCKET}/${limpia}`
}

export const fotosDe = (producto, supabaseUrl) =>
  (Array.isArray(producto?.fotos) ? producto.fotos : []).map((r) => urlDeFoto(r, supabaseUrl)).filter(Boolean)
