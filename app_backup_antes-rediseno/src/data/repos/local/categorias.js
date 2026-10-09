// Repositorio de categorías.
//   listar() · crear(nombre)
import { db } from '../../db.js'
import { idDeterministico } from '../../../lib/id.js'
import { encolar } from '../../sync/cola.js'

export const categorias = {
  listar: () => db.categorias.orderBy('orden').toArray(),
  async crear(nombre) {
    const limpio = String(nombre ?? '').trim().toUpperCase()
    if (!limpio) throw new Error('El nombre de la categoría es obligatorio.')
    const existente = await db.categorias.where('nombre').equals(limpio).first()
    if (existente) return existente
    const orden = (await db.categorias.count()) + 1
    const cat = { id: idDeterministico(`categoria:${limpio}`), nombre: limpio, orden }
    await db.transaction('rw', db.categorias, db.cola_sync, async () => {
      await db.categorias.add(cat)
      await encolar({ operacion: 'guardar', entidad: 'categoria', entidad_id: cat.id })
    })
    return cat
  },
}
