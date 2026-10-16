// Repositorio del sitio (implementación REMOTA). El público lee por `tienda_sitio_publico()` (sin sesión);
// el panel guarda en `tienda_config` (RLS: solo administración). Se guarda también en el dispositivo (config.sitio)
// para que el sitio abra al instante y funcione sin red.
import { db } from '../../db.js'
import { obtenerSupabase } from '../../supabase.js'
import { errorDeBase } from '../../../lib/errores.js'
import { esquemaSitio } from '../local/sitio.js'

let ultimaLectura = 0
const FRESCURA_MS = 60_000

export const sitio = {
  async obtener() {
    const cacheado = (await db.config.get('sitio'))?.valor
    if (cacheado && Date.now() - ultimaLectura < FRESCURA_MS) return esquemaSitio.parse(cacheado)
    try {
      const sb = await obtenerSupabase()
      const { data, error } = await sb.rpc('tienda_sitio_publico')
      if (error) throw error
      const valor = esquemaSitio.parse(data?.sitio ?? {})
      await db.config.put({ clave: 'sitio', valor })
      // Los datos del negocio que viven en naty_config también se guardan para el pie y el contacto.
      if (data?.whatsapp_tienda !== undefined) await db.config.put({ clave: 'whatsapp_tienda', valor: data.whatsapp_tienda })
      if (data?.negocio) await db.config.put({ clave: 'negocio', valor: data.negocio })
      if (data?.stock_bajo_unidades !== undefined) await db.config.put({ clave: 'stock_bajo_unidades', valor: data.stock_bajo_unidades })
      if (data?.tipo_cambio) await db.config.put({ clave: 'tipo_cambio', valor: data.tipo_cambio })
      if (data?.recargo_mp) await db.config.put({ clave: 'recargo_mp', valor: data.recargo_mp })
      ultimaLectura = Date.now()
      return valor
    } catch {
      // Sin red: lo último que se vio (o los valores por defecto).
      return esquemaSitio.parse(cacheado ?? {})
    }
  },
  async guardar(parcial) {
    const actual = await this.obtener()
    const nuevo = esquemaSitio.parse({ ...actual, ...parcial })
    const sb = await obtenerSupabase()
    const { error } = await sb.from('tienda_config').upsert({ clave: 'sitio', valor: nuevo }, { onConflict: 'clave' })
    if (error) throw errorDeBase(error)
    await db.config.put({ clave: 'sitio', valor: nuevo })
    return nuevo
  },
}
