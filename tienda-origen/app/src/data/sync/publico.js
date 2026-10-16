// Sincronización PÚBLICA del catálogo: lo que ve una compradora (o el kiosco) sin sesión de persona.
// Con servidor, `anon` no puede leer las tablas naty_*; solo la vista `tienda_catalogo_publico` (publicados, con precio y
// disponible por color). Esa vista se baja a la base local para que el sitio abra al instante y funcione sin red.
//
// El stock público es una FOTO: una fila de movimiento `snap-<color>` por color con la cantidad disponible (las reservas de
// pedidos pendientes ya están descontadas por la vista). Cuando una persona inicia sesión, esa foto se borra y se baja el
// catálogo completo con sus movimientos reales (ver limpiarDatosPublicos y PrimeraCarga).
import { db } from '../db.js'

export const BUCKET = 'naty_productos'
export const PREFIJO_FOTO_STOCK = 'snap-'
const PAGINA = 1000

const urlFoto = (sb, ruta) => (/^(https?:)?\/\//.test(ruta) || ruta.startsWith('/') ? ruta : sb.storage.from(BUCKET).getPublicUrl(ruta).data.publicUrl)

async function traerVista(sb) {
  const filas = []
  for (let desde = 0; ; desde += PAGINA) {
    const { data, error } = await sb.from('tienda_catalogo_publico').select('*').order('codigo', { ascending: true }).range(desde, desde + PAGINA - 1)
    if (error) throw Object.assign(new Error(`catálogo público: ${error.message}`), { code: error.code })
    filas.push(...data)
    if (data.length < PAGINA) return filas
  }
}

export async function descargarCatalogoPublico(sb) {
  const filas = await traerVista(sb)
  const ahora = new Date().toISOString()
  const idsProductos = new Set(filas.map((f) => f.id))

  const categorias = new Map()
  for (const f of filas) if (f.categoria_id && !categorias.has(f.categoria_id)) categorias.set(f.categoria_id, { id: f.categoria_id, nombre: f.categoria, orden: Number(f.categoria_orden ?? 0) })

  await db.transaction('rw', [db.productos, db.producto_colores, db.producto_fotos, db.categorias, db.movimientos_stock, db.config], async () => {
    // Lo que dejó de estar publicado desaparece del dispositivo.
    const previos = await db.productos.toCollection().primaryKeys()
    const sobran = previos.filter((id) => !idsProductos.has(id))
    if (sobran.length) {
      await db.productos.bulkDelete(sobran)
      await db.producto_colores.where('producto_id').anyOf(sobran).delete()
      await db.producto_fotos.where('producto_id').anyOf(sobran).delete()
    }
    await db.categorias.clear()
    await db.categorias.bulkPut([...categorias.values()])

    const ids = [...idsProductos]
    await db.producto_colores.where('producto_id').anyOf(ids).delete()
    await db.producto_fotos.where('producto_id').anyOf(ids).delete()
    await db.movimientos_stock.where('id').startsWith(PREFIJO_FOTO_STOCK).delete()

    const colores = []
    const fotos = []
    const stock = []
    for (const f of filas) {
      for (const c of f.colores ?? []) {
        colores.push({ id: c.id, producto_id: f.id, nombre: c.nombre, hex: c.hex, orden: c.orden ?? 0 })
        if (c.disponible > 0) stock.push({ id: `${PREFIJO_FOTO_STOCK}${c.id}`, producto_id: f.id, color_id: c.id, tipo: 'entrada', delta: c.disponible, motivo: 'Disponible en la tienda', usuario_id: null, venta_id: null, pedido_id: null, creado_en: ahora })
      }
      for (const [orden, ft] of (f.fotos ?? []).entries()) fotos.push({ id: ft.id, producto_id: f.id, orden: ft.orden ?? orden, ruta: urlFoto(sb, ft.ruta) })
    }
    await db.productos.bulkPut(
      filas.map((f) => ({
        id: f.id,
        codigo: f.codigo,
        nombre: f.nombre,
        slug: f.slug,
        categoria_id: f.categoria_id,
        descripcion: f.descripcion ?? '',
        precio_docena_usd_cent: 0,
        precio_unidad_bs_cent: f.precio_unidad_bs_cent,
        publicado_tienda: true,
        destacado: !!f.destacado,
        nuevo: !!f.nuevo,
        activo: true,
        creado_en: f.creado_en,
      })),
    )
    await db.producto_colores.bulkPut(colores)
    await db.producto_fotos.bulkPut(fotos)
    await db.movimientos_stock.bulkPut(stock)
    await db.config.put({ clave: 'origen_datos', valor: 'publico' })
    await db.config.put({ clave: 'sync_publico', valor: ahora })
  })
  return { productos: filas.length, colores: filas.reduce((t, f) => t + (f.colores?.length ?? 0), 0) }
}

// Al iniciar sesión: se quita todo lo que vino de la vista pública para bajar el catálogo completo sin mezclar la foto de stock
// con los movimientos reales. No toca movimientos ni cola de lo que la persona haya cargado (esos no son de la foto).
export async function limpiarDatosPublicos() {
  const origen = (await db.config.get('origen_datos'))?.valor
  if (origen !== 'publico') return false
  await db.transaction('rw', [db.productos, db.producto_colores, db.producto_fotos, db.categorias, db.movimientos_stock, db.config], async () => {
    await db.movimientos_stock.where('id').startsWith(PREFIJO_FOTO_STOCK).delete()
    await db.productos.clear()
    await db.producto_colores.clear()
    await db.producto_fotos.clear()
    await db.categorias.clear()
    await db.config.delete('sync_ultima')
    await db.config.delete('sync_publico')
    await db.config.put({ clave: 'origen_datos', valor: 'ninguno' })
  })
  return true
}
