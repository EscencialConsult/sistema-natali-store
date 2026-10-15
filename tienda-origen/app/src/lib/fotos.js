// Miniaturas por CONVENCIÓN de ruta (sin cambiar el esquema ni los objetos foto):
//   - ruta relativa de Storage `MN-001/1.jpg`                         → `MN-001/1.jpg.mini.webp` (mismo bucket)
//   - URL pública del Supabase configurado, bucket naty_productos      → misma URL con `.mini.webp` en el pathname
//   - foto de la demo `/seed/imagenes/<n>.<ext>`                       → `/seed/imagenes/mini/<n>.webp`
//   - otro origen, blob o data URL                                     → sin miniatura
// Si la miniatura no existe (fotos viejas), el componente Foto retira el srcSet y se queda con la original.
import { urlDeImagen } from './blobUrl.js'

export const ANCHO_MINI = 640
export const BUCKET_FOTOS = 'naty_productos'
export const SUFIJO_MINI = '.mini.webp'
const PREFIJO_STORAGE = `/storage/v1/object/public/${BUCKET_FOTOS}/`

const origenDe = (u) => {
  try {
    return new URL(u).origin
  } catch {
    return null
  }
}

export function urlMiniatura(ruta, origenSupabase = import.meta.env?.VITE_SUPABASE_URL) {
  if (!ruta || typeof ruta !== 'string') return null
  if (/^(blob:|data:)/.test(ruta)) return null
  const seed = /^\/seed\/imagenes\/([^/]+)\.(jpe?g|png|webp)$/i.exec(ruta)
  if (seed) return `/seed/imagenes/mini/${seed[1]}.webp`
  if (/^https?:\/\//i.test(ruta)) {
    const propio = origenSupabase && origenDe(ruta) === origenDe(origenSupabase)
    if (!propio) return null
    const u = new URL(ruta)
    if (!u.pathname.startsWith(PREFIJO_STORAGE) || u.pathname.endsWith(SUFIJO_MINI)) return null
    u.pathname += SUFIJO_MINI
    return u.toString()
  }
  if (ruta.startsWith('/')) return null // otra ruta del sitio, sin convención
  return `${ruta}${SUFIJO_MINI}` // ruta relativa de Storage
}

// { src, srcSet } para un <img>. srcSet ofrece la miniatura (640w) y la original (ancho declarado aproximado).
export function urlsFoto(foto) {
  const src = urlDeImagen(foto)
  if (!src) return { src: null, srcSet: null }
  const mini = foto?.blob ? null : urlMiniatura(foto?.ruta)
  return { src, srcSet: mini ? `${mini} ${ANCHO_MINI}w, ${src} 1200w` : null }
}

// En el navegador: miniatura webp de un blob de foto (para subirla junto a la original). Devuelve null si no se puede.
export async function crearMiniatura(blob, ancho = ANCHO_MINI) {
  try {
    const bmp = await createImageBitmap(blob)
    if (bmp.width <= ancho) return null
    const alto = Math.round((bmp.height * ancho) / bmp.width)
    const lienzo = new OffscreenCanvas(ancho, alto)
    lienzo.getContext('2d').drawImage(bmp, 0, 0, ancho, alto)
    return await lienzo.convertToBlob({ type: 'image/webp', quality: 0.74 })
  } catch {
    return null
  }
}
