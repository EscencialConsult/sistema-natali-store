// Repositorio de perfiles (usuarios del sistema).
//   listar({ soloActivos }) · obtener(id) · actualizar(id, cambios)
import { db } from '../../db.js'
import { encolar } from '../../sync/cola.js'

export const perfiles = {
  async listar({ soloActivos = true } = {}) {
    const todos = await db.perfiles.toArray()
    return todos.filter((p) => !soloActivos || p.activo).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  },
  obtener: (id) => db.perfiles.get(id),
  async actualizar(id, cambios) {
    await db.transaction('rw', db.perfiles, db.cola_sync, async () => {
      await db.perfiles.update(id, cambios)
      await encolar({ operacion: 'actualizar', entidad: 'perfil', entidad_id: id })
    })
    return db.perfiles.get(id)
  },
}
