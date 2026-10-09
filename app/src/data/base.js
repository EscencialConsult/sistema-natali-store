import { db } from './db.js'

// La base local (IndexedDB) es solo una copia del servidor para trabajar sin internet: todo viene de Supabase.
// Si el dispositivo tiene datos de una versión anterior (la demo con datos de ejemplo), se borran una sola vez.
export async function prepararBase() {
  const origen = await db.config.get('origen')
  if (origen?.valor === 'supabase') return
  await db.delete()
  await db.open()
  await db.config.put({ clave: 'origen', valor: 'supabase' })
}
