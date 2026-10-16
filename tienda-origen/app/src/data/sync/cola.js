// Cola de sincronización. Toda escritura local que deba llegar al servidor entra acá y sale cuando hay conexión.
// Sin servidor configurado el transporte es simulado (la etapa 4 lo reemplaza por Supabase sin tocar el resto).
//   encolar(op) · procesar({ enviar }) · pendientes() · ultimoError(id) · iniciarAutomatico()
import { db } from '../db.js'
import { nuevoId } from '../../lib/id.js'

const ESPERA_BASE_MS = 5_000
const ESPERA_MAX_MS = 5 * 60_000

// Se llama dentro de la transacción de la operación, para que el dato y su envío se guarden juntos o ninguno.
export async function encolar({ operacion, entidad, entidad_id, payload = null }) {
  await db.cola_sync.add({
    id: nuevoId(),
    operacion,
    entidad,
    entidad_id,
    payload,
    estado: 'pendiente',
    intentos: 0,
    proximo_intento: 0,
    ultimo_error: null,
    creado_en: new Date().toISOString(),
  })
  // Avisa que hay algo para enviar: el envío arranca solo, sin esperar al ciclo de 30 s (ver iniciarAutomatico).
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('tienda:cola'))
}

// Último error registrado para una entidad (por ejemplo un pedido que el servidor rechazó).
export async function ultimoError(entidad_id) {
  const item = await db.cola_sync.filter((i) => i.entidad_id === entidad_id && i.estado === 'error').first()
  return item?.ultimo_error ?? null
}

export const pendientes = () => db.cola_sync.where('estado').anyOf('pendiente', 'error').count()

export const hayConexion = () => (typeof navigator === 'undefined' ? true : navigator.onLine !== false)

// Transporte simulado: hace de cuenta que el servidor aceptó.
export async function enviarSimulado() {
  await new Promise((r) => setTimeout(r, 150))
}

let procesando = false

export async function procesar({ enviar = enviarSimulado, ahora = Date.now() } = {}) {
  if (procesando || !hayConexion()) return { enviadas: 0, errores: 0 }
  procesando = true
  const resultado = { enviadas: 0, errores: 0 }
  try {
    const items = (await db.cola_sync.where('estado').anyOf('pendiente', 'error').sortBy('creado_en')).filter((i) => i.proximo_intento <= ahora)
    for (const item of items) {
      try {
        await enviar(item)
        await db.cola_sync.delete(item.id)
        resultado.enviadas++
      } catch (e) {
        const intentos = item.intentos + 1
        const espera = Math.min(ESPERA_BASE_MS * 2 ** intentos, ESPERA_MAX_MS)
        await db.cola_sync.update(item.id, { estado: 'error', intentos, ultimo_error: String(e?.message ?? e), proximo_intento: ahora + espera })
        resultado.errores++
      }
    }
  } finally {
    procesando = false
  }
  return resultado
}

// Reintenta al volver la conexión y cada 30 s. Devuelve una función para detenerlo.
// opciones: { enviar, despues, onResultado }. `despues` corre luego de enviar (con servidor: baja lo nuevo).
export function iniciarAutomatico(opciones) {
  let corriendo = false
  const correr = async () => {
    if (corriendo) return
    corriendo = true
    try {
      const r = await procesar(opciones)
      if (opciones?.despues && hayConexion()) await opciones.despues().catch(() => {})
      if (r.enviadas || r.errores) opciones?.onResultado?.(r)
    } catch {
      /* se reintenta en el próximo ciclo */
    } finally {
      corriendo = false
    }
  }
  // Un cambio nuevo se envía ~1 s después (espera a que termine de guardarse y junta varios seguidos).
  let espera
  const pronto = () => {
    clearTimeout(espera)
    espera = setTimeout(correr, 1_000)
  }
  window.addEventListener('online', correr)
  window.addEventListener('tienda:cola', pronto)
  const t = setInterval(correr, 30_000)
  correr()
  return () => {
    window.removeEventListener('online', correr)
    window.removeEventListener('tienda:cola', pronto)
    clearTimeout(espera)
    clearInterval(t)
  }
}
