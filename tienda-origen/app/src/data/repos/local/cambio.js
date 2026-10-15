// Conversión de moneda de la tienda: "bs bolivianos = ars pesos argentinos". Implementación LOCAL (modo sin servidor).
//   obtener() · refrescar() · guardar({ bs, ars, nota }) · historial()
// La versión sube en cada cambio: el checkout manda la que vio y, si ya no coincide, se pide revisar el total.
import { db } from '../../db.js'

export const CAMBIO_INICIAL = { bs: 5, ars: 1, version: 1, actualizado_en: null }
const CLAVE = 'cambio'
const HISTORIAL = 'cambio_historial'

export const cambio = {
  async obtener() {
    return (await db.config.get(CLAVE))?.valor ?? CAMBIO_INICIAL
  },
  // Sin servidor no hay nada que traer: es lo guardado en el dispositivo.
  refrescar() {
    return this.obtener()
  },
  async guardar({ bs, ars, nota = '' }) {
    const nBs = Number(bs)
    const nArs = Number(ars)
    if (!(nBs > 0) || !(nArs > 0)) throw new Error('La conversión necesita dos números mayores a 0.')
    const previo = await this.obtener()
    const nuevo = { bs: nBs, ars: nArs, version: (previo.version ?? 0) + 1, actualizado_en: new Date().toISOString() }
    const hist = (await db.config.get(HISTORIAL))?.valor ?? []
    await db.transaction('rw', db.config, async () => {
      await db.config.put({ clave: CLAVE, valor: nuevo })
      await db.config.put({ clave: HISTORIAL, valor: [{ version: nuevo.version, bs: nBs, ars: nArs, nota, creado_en: nuevo.actualizado_en }, ...hist].slice(0, 20) })
    })
    return nuevo
  },
  async historial() {
    return (await db.config.get(HISTORIAL))?.valor ?? []
  },
}
