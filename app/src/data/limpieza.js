// Borrados de verdad: se hacen en el servidor (sin conexión no se puede) y después se reflejan en este dispositivo.
//   eliminarProductos(ids) · eliminarProductosDeBaja() · previsualizar({ antesDe }) · borrarVentas({ antesDe }) · resumirMovimientos({ antesDe })
// Los demás dispositivos se enteran al sincronizar (naty_limpiezas, ver sync/remoto.js).
import { obtenerSupabase } from './supabase.js'
import { hayConexion } from './sync/cola.js'
import { BUCKET, borrarProductosDelDispositivo } from './sync/remoto.js'

async function rpc(nombre, p = {}) {
  if (!hayConexion()) throw new Error('Necesitás conexión a internet para borrar.')
  const sb = await obtenerSupabase()
  if (!sb) throw new Error('Falta configurar el servidor.')
  const { data, error } = await sb.rpc(nombre, { p })
  if (error) throw new Error(error.message)
  return { sb, data }
}

// La sincronización automática baja lo que cambió (y aplica la limpieza en este dispositivo).
const sincronizar = () => typeof window !== 'undefined' && window.dispatchEvent(new Event('naty:cola'))

// Ruta dentro del bucket: la foto se guarda como dirección pública completa o como ruta.
const rutaEnBucket = (ruta) => (ruta.includes(`/${BUCKET}/`) ? decodeURIComponent(ruta.split(`/${BUCKET}/`).pop()) : ruta)

async function despuesDeEliminar(sb, ids, fotos) {
  await borrarProductosDelDispositivo(ids)
  // Si falla, las fotos quedan sin uso en el bucket: no rompe nada.
  if (fotos.length) await sb.storage.from(BUCKET).remove(fotos.map(rutaEnBucket)).catch(() => {})
  sincronizar()
}

export const limpieza = {
  async eliminarProductos(ids) {
    const { sb, data } = await rpc('naty_eliminar_productos', { ids })
    await despuesDeEliminar(sb, ids, data.fotos)
    return data.cantidad
  },

  async eliminarProductosDeBaja() {
    const { sb, data } = await rpc('naty_eliminar_productos_de_baja')
    // El servidor no devuelve los ids: la sincronización los quita de este dispositivo.
    if (data.fotos.length) await sb.storage.from(BUCKET).remove(data.fotos.map(rutaEnBucket)).catch(() => {})
    sincronizar()
    return data.cantidad
  },

  // { ventas, movimientos, productos_baja }: cuánto se borraría.
  async previsualizar({ antesDe } = {}) {
    return (await rpc('naty_previsualizar_limpieza', { antes_de: antesDe ?? null })).data
  },

  async borrarVentas({ antesDe }) {
    const { data } = await rpc('naty_borrar_ventas', { antes_de: antesDe })
    sincronizar()
    return data
  },

  async resumirMovimientos({ antesDe }) {
    const { data } = await rpc('naty_resumir_movimientos', { antes_de: antesDe })
    sincronizar()
    return data
  },
}
