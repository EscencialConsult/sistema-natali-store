// Fotos del catálogo para usar sin internet. Se guardan en la misma caché que usa el service worker
// ('fotos-catalogo', ver vite.config.js), así que una vez descargadas se muestran aunque no haya señal.
const CACHE = 'fotos-catalogo'
const PARALELO = 4

export const hayCacheApi = () => typeof caches !== 'undefined'

// Se descargan las fotos con dirección (del sitio o de Storage); las subidas desde el celular y aún sin enviar ya están guardadas acá.
export const urlsDescargables = (fotos) => [...new Set(fotos.map((f) => f.ruta).filter((r) => r && (r.startsWith('/') || /^https?:\/\//.test(r))))]

export async function contarGuardadas(urls) {
  if (!hayCacheApi()) return 0
  const c = await caches.open(CACHE)
  const r = await Promise.all(urls.map((u) => c.match(u)))
  return r.filter(Boolean).length
}

// onProgreso(hechas, total). Devuelve { guardadas, fallidas }. Reintentable: salta las que ya están.
export async function descargarFotos(urls, onProgreso = () => {}) {
  const c = await caches.open(CACHE)
  const pendientes = []
  for (const u of urls) if (!(await c.match(u))) pendientes.push(u)
  let hechas = urls.length - pendientes.length
  let fallidas = 0
  onProgreso(hechas, urls.length)
  const cola = [...pendientes]
  await Promise.all(
    Array.from({ length: PARALELO }, async () => {
      while (cola.length) {
        const u = cola.shift()
        try {
          const r = await fetch(u)
          if (!r.ok) throw new Error(String(r.status))
          await c.put(u, r)
        } catch {
          fallidas++
        }
        hechas++
        onProgreso(hechas, urls.length)
      }
    }),
  )
  return { guardadas: urls.length - fallidas, fallidas }
}
