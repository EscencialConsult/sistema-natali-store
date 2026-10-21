// Cola de sincronización. Toda escritura de venta entra acá y sale hacia el servidor cuando hay conexión.
// Hoy el transporte es simulado (etapa 8 lo reemplaza por Supabase sin tocar el resto).
//   encolar(tx, op) · procesar({ enviar }) · pendientes() · iniciarAutomatico()
import { db } from '../db.js'
import { nuevoId } from '../../lib/id.js'
import { clasificar } from './errores.js'

const ESPERA_BASE_MS = 5_000
const ESPERA_MAX_MS = 5 * 60_000
// Sesión o red caídas no son culpa de la venta: se reintenta pronto (la sesión suele renovarse en segundos).
const ESPERA_TRANSITORIA_MAX_MS = 60_000

// Se llama dentro de la transacción de la operación, para que venta y cola se guarden juntas o ninguna.
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
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('naty:cola'))
}

// Último error registrado para una entidad (por ejemplo una venta que el servidor rechazó).
export async function ultimoError(entidad_id) {
  const item = await db.cola_sync.filter((i) => i.entidad_id === entidad_id && i.estado === 'error').first()
  return item?.ultimo_error ?? null
}

export const pendientes = () => db.cola_sync.where('estado').anyOf('pendiente', 'error').count()

export const hayConexion = () => (typeof navigator === 'undefined' ? true : navigator.onLine !== false)

// Reintento inmediato. Sin `soloTransitorios` (botón «Reintentar ahora») también se reintentan las rechazadas.
export async function liberarEspera({ soloTransitorios = false } = {}) {
  const items = db.cola_sync.where('estado').anyOf(soloTransitorios ? ['pendiente'] : ['pendiente', 'error'])
  await items.modify({ proximo_intento: 0 })
}

// Envíos que quedaron «con problema» solo porque la sesión o la red fallaron (versiones anteriores los marcaban como rechazados).
export async function rescatarTransitorios() {
  const marcados = await db.cola_sync.where('estado').equals('error').filter((i) => clasificar(i.ultimo_error) !== 'rechazo').toArray()
  if (!marcados.length) return 0
  await db.transaction('rw', db.cola_sync, db.ventas, async () => {
    for (const i of marcados) {
      await db.cola_sync.update(i.id, { estado: 'pendiente', proximo_intento: 0 })
      if (i.entidad === 'venta') await db.ventas.update(i.entidad_id, { sync_status: 'pending' })
    }
  })
  return marcados.length
}

let procesando = false

// enviar(item): manda un cambio al servidor (ver sync/remoto.js). Siempre es el servidor real: no hay envío simulado.
export async function procesar({ enviar, ahora = Date.now() } = {}) {
  if (!enviar) throw new Error('procesar() necesita la función enviar.')
  if (procesando || !hayConexion()) return { enviadas: 0, errores: 0 }
  procesando = true
  const resultado = { enviadas: 0, errores: 0 }
  try {
    const items = (await db.cola_sync.where('estado').anyOf('pendiente', 'error').sortBy('creado_en')).filter((i) => i.proximo_intento <= ahora)
    for (const item of items) {
      try {
        await enviar(item)
        await db.transaction('rw', db.cola_sync, db.ventas, async () => {
          await db.cola_sync.delete(item.id)
          if (item.entidad === 'venta') {
            const aun = await db.cola_sync.where('estado').anyOf('pendiente', 'error').filter((i) => i.entidad === 'venta' && i.entidad_id === item.entidad_id).count()
            if (aun === 0) await db.ventas.update(item.entidad_id, { sync_status: 'synced' })
          }
        })
        resultado.enviadas++
      } catch (e) {
        const intentos = item.intentos + 1
        const ultimo_error = String(e?.message ?? e)
        if (clasificar(e) === 'rechazo') {
          const espera = Math.min(ESPERA_BASE_MS * 2 ** intentos, ESPERA_MAX_MS)
          await db.cola_sync.update(item.id, { estado: 'error', intentos, ultimo_error, proximo_intento: ahora + espera })
          if (item.entidad === 'venta') await db.ventas.update(item.entidad_id, { sync_status: 'error' })
          resultado.errores++
          continue
        }
        const espera = Math.min(ESPERA_BASE_MS * 2 ** Math.min(intentos, 4), ESPERA_TRANSITORIA_MAX_MS)
        await db.cola_sync.update(item.id, { estado: 'pendiente', intentos, ultimo_error, proximo_intento: ahora + espera })
        if (item.entidad === 'venta') await db.ventas.update(item.entidad_id, { sync_status: 'pending' })
        resultado.transitorios = (resultado.transitorios ?? 0) + 1
        resultado.ultimoFallo = e
        break // el resto fallaría igual: se prueba en el próximo ciclo
      }
    }
  } finally {
    procesando = false
  }
  return resultado
}

// Reintenta al volver la conexión y cada 30 s. Devuelve una función para detenerlo.
// opciones: { enviar, despues, onResultado, onCiclo }. `despues` corre luego de enviar (con servidor: baja lo nuevo).
// onCiclo({ …resultado, falloBajada }) se llama al terminar cada vuelta con conexión: sirve para mostrar si la app se está actualizando.
export function iniciarAutomatico(opciones) {
  let corriendo = false
  const correr = async () => {
    if (corriendo) return
    corriendo = true
    try {
      const r = await procesar(opciones)
      let falloBajada = null
      if (opciones?.despues && hayConexion()) falloBajada = await opciones.despues().then(() => null, (e) => e)
      if (hayConexion()) opciones?.onCiclo?.({ ...r, falloBajada })
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
  // Al volver la señal o la ventana, lo que esperaba por sesión/red se reintenta ya, sin esperar el turno de espera.
  const reintentarYa = () => liberarEspera({ soloTransitorios: true }).then(correr, correr)
  const alVolver = () => document.visibilityState === 'visible' && reintentarYa()
  window.addEventListener('online', reintentarYa)
  window.addEventListener('naty:cola', pronto)
  document.addEventListener('visibilitychange', alVolver)
  const t = setInterval(correr, 30_000)
  rescatarTransitorios().then(correr, correr)
  return () => {
    window.removeEventListener('online', reintentarYa)
    window.removeEventListener('naty:cola', pronto)
    document.removeEventListener('visibilitychange', alVolver)
    clearTimeout(espera)
    clearInterval(t)
  }
}
