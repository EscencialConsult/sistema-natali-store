// Repositorio de gastos (implementación REMOTA). Misma interfaz que local/gastos.js. RLS decide quién ve y edita.
import { obtenerSupabase } from '../../supabase.js'
import { errorDeBase } from '../../../lib/errores.js'
import { idDeterministico, nuevoId } from '../../../lib/id.js'
import { esquemaGasto } from '../local/gastos.js'

const normalizar = (g) => g && { ...g, monto_cent: Number(g.monto_cent) }

export const gastos = {
  async listar({ desde, hasta, categoria_id } = {}) {
    const sb = await obtenerSupabase()
    let q = sb.from('tienda_gastos').select('*').eq('eliminado', false).order('fecha', { ascending: false }).order('creado_en', { ascending: false })
    if (desde) q = q.gte('fecha', desde)
    if (hasta) q = q.lte('fecha', hasta)
    if (categoria_id) q = q.eq('categoria_id', categoria_id)
    const { data, error } = await q
    if (error) throw errorDeBase(error)
    return data.map(normalizar)
  },
  async obtener(id) {
    const sb = await obtenerSupabase()
    const { data, error } = await sb.from('tienda_gastos').select('*').eq('id', id).maybeSingle()
    if (error) throw errorDeBase(error)
    return normalizar(data) ?? undefined
  },
  async crear(datos) {
    const d = esquemaGasto.parse(datos)
    const sb = await obtenerSupabase()
    const { data: sesion } = await sb.auth.getUser()
    const fila = { id: nuevoId(), categoria_id: d.categoria_id, fecha: d.fecha, monto_cent: d.monto_cent, descripcion: d.descripcion, comprobante_ruta: d.comprobante?.ruta ?? '', usuario_id: sesion?.user?.id ?? null }
    const { error } = await sb.from('tienda_gastos').insert(fila)
    if (error) throw errorDeBase(error)
    return fila
  },
  async actualizar(id, datos) {
    const d = esquemaGasto.parse(datos)
    const sb = await obtenerSupabase()
    const { error } = await sb.from('tienda_gastos').update({ categoria_id: d.categoria_id, fecha: d.fecha, monto_cent: d.monto_cent, descripcion: d.descripcion, comprobante_ruta: d.comprobante?.ruta ?? '' }).eq('id', id)
    if (error) throw errorDeBase(error)
    return this.obtener(id)
  },
  async eliminar(id) {
    const sb = await obtenerSupabase()
    const { error } = await sb.from('tienda_gastos').update({ eliminado: true }).eq('id', id)
    if (error) throw errorDeBase(error)
  },
  async categorias() {
    const sb = await obtenerSupabase()
    const { data, error } = await sb.from('tienda_gasto_categorias').select('*').order('orden')
    if (error) throw errorDeBase(error)
    return data
  },
  async crearCategoria(nombre) {
    const limpio = String(nombre ?? '').trim()
    if (!limpio) throw new Error('El nombre de la categoría es obligatorio.')
    const sb = await obtenerSupabase()
    const cat = { id: idDeterministico(`gasto_categoria:${limpio.toLowerCase()}`), nombre: limpio, orden: (await this.categorias()).length + 1 }
    const { error } = await sb.from('tienda_gasto_categorias').upsert(cat, { onConflict: 'id' })
    if (error) throw errorDeBase(error)
    return cat
  },
  async totalPorCategoria(filtros) {
    const lista = await this.listar(filtros)
    const out = {}
    for (const g of lista) out[g.categoria_id] = (out[g.categoria_id] ?? 0) + g.monto_cent
    return out
  },
}
