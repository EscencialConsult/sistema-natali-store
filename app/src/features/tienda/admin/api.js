// Acceso a los datos del Gestor web. Escribe SOLO en `tienda_config` y `tienda_oculto` (tablas propias de la tienda), con el
// cliente autenticado de la app. Nunca en `naty_config` ni en ninguna tabla de Renzo (por eso no usa config.guardar).
import { obtenerSupabase } from '../../../data/supabase.js'

export const sinTabla = (e) =>
  e?.code === '42P01' || e?.code === 'PGRST205' || (/tienda_config/.test(e?.message ?? '') && /does not exist|schema cache/i.test(e?.message ?? ''))

export async function leerTodo() {
  const sb = await obtenerSupabase()
  const { data, error } = await sb.from('tienda_config').select('clave,valor')
  if (error) throw error
  return Object.fromEntries(data.map((f) => [f.clave, f.valor]))
}

export async function guardarClave(clave, valor) {
  const sb = await obtenerSupabase()
  const { error } = await sb.from('tienda_config').upsert({ clave, valor, publico: true }, { onConflict: 'clave' })
  if (error) {
    if (error.code === '42501' || /row-level security|permission denied/i.test(error.message)) throw new Error('Solo la administración puede cambiar estos datos.')
    throw new Error('No se pudo guardar. Revisá tu conexión e intentá de nuevo.')
  }
}

export async function leerModelos() {
  const sb = await obtenerSupabase()
  const [p, o] = await Promise.all([
    sb.from('naty_productos').select('id,codigo,nombre').eq('activo', true).order('codigo').limit(1000),
    sb.from('tienda_oculto').select('producto_id').eq('oculto', true),
  ])
  if (p.error || o.error) throw p.error ?? o.error
  return { productos: p.data, ocultos: new Set(o.data.map((f) => f.producto_id)) }
}

export async function marcarOculto(productoId, oculto) {
  const sb = await obtenerSupabase()
  const { error } = await sb.from('tienda_oculto').upsert({ producto_id: productoId, oculto }, { onConflict: 'producto_id' })
  if (error) throw error
}

// Identidad estable para cada fila editable (no viaja al guardar: los validadores la descartan).
export const conClave = (fila) => ({ ...fila, _k: globalThis.crypto?.randomUUID?.() ?? `k${Math.random().toString(36).slice(2)}` })
