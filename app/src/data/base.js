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

// Lo que se le muestra a quien soporta el equipo: nombre técnico del error + mensaje (el texto genérico no alcanza para diagnosticar).
export const detalleDelError = (e) => [e?.name, e?.message].filter(Boolean).join(': ').slice(0, 240) || String(e)
