// Repositorio de configuración (clave → valor).
//   obtener(clave, porDefecto) · guardar(clave, valor) · todo()
import { db } from '../../db.js'
import { encolar } from '../../sync/cola.js'

// Claves que existen solo en este dispositivo (contadores de notas, marcas de sincronización).
const SOLO_LOCAL = /^(correlativo:|sync_|origen$)/

export const config = {
  async obtener(clave, porDefecto = null) {
    const fila = await db.config.get(clave)
    return fila ? fila.valor : porDefecto
  },
  async guardar(clave, valor) {
    await db.transaction('rw', db.config, db.cola_sync, async () => {
      await db.config.put({ clave, valor })
      if (!SOLO_LOCAL.test(clave)) await encolar({ operacion: 'guardar', entidad: 'config', entidad_id: clave })
    })
  },
  async todo() {
    const filas = await db.config.toArray()
    return Object.fromEntries(filas.map((f) => [f.clave, f.valor]))
  },
}
