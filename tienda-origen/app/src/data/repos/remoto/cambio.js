// Conversión de moneda de la tienda (implementación REMOTA). La fuente de verdad es la base (tienda_config.cambio):
//   · el público la lee por `tienda_sitio_publico()` y se guarda en el dispositivo (config.cambio) para abrir al instante;
//   · la administración la cambia por `tienda_guardar_cambio()`, que sube la versión y deja historial.
import { db } from '../../db.js'
import { errorDeBase } from '../../../lib/errores.js'
import { obtenerSupabase } from '../../supabase.js'
import { CAMBIO_INICIAL } from '../local/cambio.js'

const guardarLocal = (valor) => db.config.put({ clave: 'cambio', valor })

export const cambio = {
  async obtener() {
    return (await db.config.get('cambio'))?.valor ?? CAMBIO_INICIAL
  },
  // Trae la conversión vigente. Sin red deja lo último que se vio (el servidor decide igual al confirmar el pedido).
  async refrescar() {
    try {
      const sb = await obtenerSupabase()
      const { data, error } = await sb.rpc('tienda_sitio_publico')
      if (error) throw error
      if (data?.recargo_mp) {
        const actualRec = (await db.config.get('recargo_mp'))?.valor
        if (actualRec?.pct !== data.recargo_mp.pct) await db.config.put({ clave: 'recargo_mp', valor: data.recargo_mp })
      }
      const c = data?.cambio
      if (c && Number(c.bs) > 0 && Number(c.ars) > 0) {
        const valor = { bs: Number(c.bs), ars: Number(c.ars), version: Number(c.version ?? 0), actualizado_en: c.actualizado_en ?? null }
        const actual = (await db.config.get('cambio'))?.valor
        // Solo se escribe si cambió: escribir dispara a toda la app (consultas en vivo).
        if (!actual || actual.version !== valor.version || actual.bs !== valor.bs || actual.ars !== valor.ars) await guardarLocal(valor)
        return valor
      }
    } catch {
      /* sin red o servidor caído */
    }
    return this.obtener()
  },
  async guardar({ bs, ars, nota = '' }) {
    const sb = await obtenerSupabase()
    const { data, error } = await sb.rpc('tienda_guardar_cambio', { p: { bs: Number(bs), ars: Number(ars), nota } })
    if (error) throw errorDeBase(error)
    const valor = { bs: Number(data.bs), ars: Number(data.ars), version: Number(data.version), actualizado_en: data.actualizado_en }
    await guardarLocal(valor)
    return valor
  },
  async historial() {
    const sb = await obtenerSupabase()
    const { data, error } = await sb.from('tienda_cambio_historial').select('version, bs, ars, nota, creado_en').order('id', { ascending: false }).limit(10)
    if (error) throw errorDeBase(error)
    return (data ?? []).map((h) => ({ ...h, bs: Number(h.bs), ars: Number(h.ars) }))
  },
}
