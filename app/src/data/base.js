import { db } from './db.js'

// La base local (IndexedDB) es solo una copia del servidor para trabajar sin internet: todo viene de Supabase.
// Si el dispositivo tiene datos de una versión anterior (la demo, o las pruebas de QA borradas del servidor el 2026-10-09),
// se borran una sola vez. Cambiar ORIGEN obliga a todos los dispositivos a rehacer su copia local.
export const ORIGEN = 'supabase-2026-10-09'

export async function prepararBase() {
  const origen = await db.config.get('origen')
  if (origen?.valor === ORIGEN) return
  await db.delete()
  await db.open()
  await db.config.put({ clave: 'origen', valor: ORIGEN })
}

// Cuántos cambios (ventas, etc.) siguen sin enviarse en este equipo. null = la base local no se puede leer.
export async function pendientesSinEnviar() {
  try {
    return await db.cola_sync.where('estado').anyOf('pendiente', 'error').count()
  } catch {
    return null
  }
}

// Lo que se le muestra a quien soporta el equipo: nombre técnico del error + mensaje (el texto genérico no alcanza para diagnosticar).
export const detalleDelError = (e) => [e?.name, e?.message].filter(Boolean).join(': ').slice(0, 240) || String(e)

// Último recurso cuando el almacenamiento del navegador quedó dañado: borra la copia local, la caché de la app y el service worker,
// y recarga. Hace falta internet para volver a bajar el catálogo. Lo que estaba sin enviar se pierde (la pantalla lo advierte).
export async function restablecerDispositivo() {
  try {
    db.close()
  } catch {
    /* ya estaba cerrada */
  }
  await new Promise((listo) => {
    const pedido = indexedDB.deleteDatabase(db.name)
    pedido.onsuccess = pedido.onerror = pedido.onblocked = () => listo()
    setTimeout(listo, 4_000) // «blocked» por otra ventana abierta: se sigue igual y se recarga
  })
  try {
    await Promise.all((await caches.keys()).map((k) => caches.delete(k)))
    await Promise.all((await navigator.serviceWorker.getRegistrations()).map((r) => r.unregister()))
  } catch {
    /* sin Cache Storage o sin service worker: nada que limpiar */
  }
  window.location.reload()
}
