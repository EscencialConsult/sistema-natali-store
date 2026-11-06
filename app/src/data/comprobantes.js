// Ver el comprobante de una transferencia. El bucket es privado: se pide un enlace firmado que vence en unos minutos.
// Si todavía no se subió (sin conexión), se abre el archivo guardado en el dispositivo.
import { obtenerSupabase } from './supabase.js'
import { hayConexion } from './sync/cola.js'
import { BUCKET_COMPROBANTES } from './sync/remoto.js'

const VIGENCIA_S = 10 * 60

export async function urlComprobante(venta) {
  if (venta.comprobante_blob) return URL.createObjectURL(venta.comprobante_blob)
  if (!venta.comprobante_ruta) return null
  if (!hayConexion()) throw new Error('Necesitás conexión a internet para ver el comprobante.')
  const sb = await obtenerSupabase()
  if (!sb) throw new Error('Falta configurar el servidor.')
  const { data, error } = await sb.storage.from(BUCKET_COMPROBANTES).createSignedUrl(venta.comprobante_ruta, VIGENCIA_S)
  if (error) throw new Error('No se pudo abrir el comprobante.')
  return data.signedUrl
}
