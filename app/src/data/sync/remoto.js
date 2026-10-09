// Sincronización con Supabase. El cliente (`sb`) llega como parámetro: así se prueba con un Postgres real en memoria.
//   ENVÍO   enviarRemoto(sb, item)  → lo usa la cola (cola.js). Cada operación es idempotente: reenviar no duplica.
//   BAJADA  descargar(sb)           → trae lo que cambió en el servidor desde la última vez y lo guarda en el dispositivo.
// Regla de oro de la bajada: si algo está "por enviar" en este dispositivo, NO se pisa con lo del servidor.
import { db } from '../db.js'

export const BUCKET = 'naty_productos'
const SOLAPE_MS = 5_000
const PAGINA = 1_000
const LOTE_IN = 100
const SOLO_LOCAL = /^(correlativo:|sync_|origen$)/

const fallar = (error, contexto) => {
  if (error) throw Object.assign(new Error(`${contexto}: ${error.message}`), { code: error.code })
}
const rpc = async (sb, nombre, p) => {
  const { data, error } = await sb.rpc(nombre, { p })
  fallar(error, nombre)
  return data
}
const por = (lista, n) => Array.from({ length: Math.ceil(lista.length / n) }, (_, i) => lista.slice(i * n, i * n + n))

// ───────────────────────────── ENVÍO ─────────────────────────────

const pick = (o, claves) => Object.fromEntries(claves.map((k) => [k, o[k]]))
const movimiento = (m) => pick(m, ['id', 'producto_id', 'color_id', 'delta', 'motivo', 'creado_en'])

export function armarVenta({ venta, items, movimientos }) {
  return {
    ...pick(venta, ['id', 'numero', 'vendedor_id', 'vendedor_nombre', 'moneda', 'tipo_cambio', 'metodo_pago', 'cliente_nombre', 'cliente_telefono', 'cliente_email', 'cliente_direccion', 'metodo_entrega', 'total_cent', 'creada_en']),
    items: items.map((i) => pick(i, ['id', 'producto_id', 'color_id', 'codigo', 'nombre', 'color_nombre', 'cantidad', 'unidad', 'unidades', 'precio_cent', 'subtotal_cent'])),
    movimientos: movimientos.map(movimiento),
  }
}

async function subirImagen(sb, ruta, blob) {
  const { error } = await sb.storage.from(BUCKET).upload(ruta, blob, { upsert: true, contentType: blob.type || 'image/jpeg' })
  fallar(error, 'subir foto')
  return sb.storage.from(BUCKET).getPublicUrl(ruta).data.publicUrl
}

async function enviarProducto(sb, id) {
  const p = await db.productos.get(id)
  if (!p) return
  const [colores, fotos, cat] = await Promise.all([
    db.producto_colores.where('producto_id').equals(id).toArray(),
    db.producto_fotos.where('producto_id').equals(id).toArray(),
    p.categoria_id ? db.categorias.get(p.categoria_id) : null,
  ])
  // Las fotos subidas desde el celular viajan primero a Storage; en el dispositivo la foto pasa de "blob" a su dirección pública.
  for (const f of fotos) {
    if (!f.blob) continue
    f.ruta = await subirImagen(sb, `${p.codigo}/${f.id}.jpg`, f.blob)
    await db.producto_fotos.update(f.id, { ruta: f.ruta, blob: undefined })
  }
  await rpc(sb, 'naty_guardar_producto', {
    ...pick(p, ['id', 'codigo', 'nombre', 'descripcion', 'precio_docena_usd_cent', 'nuevo', 'activo']),
    categoria: cat ? pick(cat, ['id', 'nombre', 'orden']) : null,
    colores: colores.sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)).map((c, orden) => ({ id: c.id, nombre: c.nombre, hex: c.hex, orden })),
    fotos: fotos.sort((a, b) => a.orden - b.orden).map((f, orden) => ({ id: f.id, orden, ruta: f.ruta })),
  })
}

async function enviarMovimiento(sb, id) {
  const m = await db.movimientos_stock.get(id)
  if (!m) return
  const { error } = await sb.from('naty_movimientos_stock').upsert(pick(m, ['id', 'producto_id', 'color_id', 'tipo', 'delta', 'motivo', 'usuario_id', 'venta_id', 'creado_en']), { onConflict: 'id', ignoreDuplicates: true })
  fallar(error, 'movimiento de stock')
}

async function enviarConfig(sb, clave) {
  const fila = await db.config.get(clave)
  if (!fila) return
  let valor = fila.valor
  if (clave === 'logo' && valor?.blob) {
    valor = { ruta: await subirImagen(sb, '_config/logo.jpg', valor.blob) }
    await db.config.put({ clave, valor })
  }
  const { error } = await sb.from('naty_config').upsert({ clave, valor }, { onConflict: 'clave' })
  fallar(error, `ajuste ${clave}`)
}

async function enviarPerfil(sb, id) {
  const p = await db.perfiles.get(id)
  if (!p) return
  const { error } = await sb.from('naty_perfiles').update(pick(p, ['nombre', 'telefono', 'activo'])).eq('id', id)
  fallar(error, 'perfil')
}

async function enviarCategoria(sb, id) {
  const c = await db.categorias.get(id)
  if (!c) return
  const { error } = await sb.from('naty_categorias').upsert(pick(c, ['id', 'nombre', 'orden']), { onConflict: 'id' })
  fallar(error, 'categoría')
}

export async function enviarRemoto(sb, item) {
  switch (`${item.entidad}/${item.operacion}`) {
    case 'venta/crear':
      return rpc(sb, 'naty_registrar_venta', armarVenta(item.payload))
    case 'venta/anular':
      return rpc(sb, 'naty_anular_venta', { id: item.entidad_id, motivo: item.payload.motivo, anulada_en: item.payload.anulada_en, movimientos: item.payload.movimientos.map(movimiento) })
    case 'producto/guardar':
      return enviarProducto(sb, item.entidad_id)
    case 'movimiento/registrar':
      return enviarMovimiento(sb, item.entidad_id)
    case 'config/guardar':
      return enviarConfig(sb, item.entidad_id)
    case 'perfil/actualizar':
      return enviarPerfil(sb, item.entidad_id)
    case 'categoria/guardar':
      return enviarCategoria(sb, item.entidad_id)
    default:
      throw new Error(`Operación desconocida en la cola: ${item.entidad}/${item.operacion}`)
  }
}

// ───────────────────────────── BAJADA ─────────────────────────────

const urlFoto = (sb, ruta) => (/^(https?:)?\/\//.test(ruta) || ruta.startsWith('/') ? ruta : sb.storage.from(BUCKET).getPublicUrl(ruta).data.publicUrl)

async function pendientes() {
  const items = await db.cola_sync.where('estado').anyOf('pendiente', 'error').toArray()
  return new Set(items.map((i) => `${i.entidad}:${i.entidad_id}`))
}

// orden: columna por la que se pagina ('updated_at' para lo incremental; venta_items no la tiene y se ordena por id).
async function traer(sb, tabla, { desde, orden = 'updated_at', filtros = (q) => q } = {}) {
  const filas = []
  for (let desdeFila = 0; ; desdeFila += PAGINA) {
    let q = sb.from(tabla).select('*')
    if (desde) q = q.gt('updated_at', desde)
    const { data, error } = await filtros(q).order(orden, { ascending: true }).range(desdeFila, desdeFila + PAGINA - 1)
    fallar(error, `descargar ${tabla}`)
    filas.push(...data)
    if (data.length < PAGINA) return filas
  }
}

const maximo = (filas, previo) => filas.reduce((m, f) => (f.updated_at > m ? f.updated_at : m), previo ?? '')
const conSolape = (iso) => (iso ? new Date(new Date(iso).getTime() - SOLAPE_MS).toISOString() : null)

export async function descargar(sb) {
  const bloqueados = await pendientes()
  const meta = (await db.config.get('sync_ultima'))?.valor ?? {}
  const nuevo = { ...meta }
  const resumen = {}

  // Perfiles y categorías son pocos: se bajan completos.
  const perfiles = (await traer(sb, 'naty_perfiles')).filter((p) => !bloqueados.has(`perfil:${p.id}`))
  await db.perfiles.bulkPut(perfiles.map((p) => pick(p, ['id', 'nombre', 'iniciales', 'rol', 'telefono', 'activo'])))
  resumen.perfiles = perfiles.length

  const categorias = await traer(sb, 'naty_categorias')
  await db.transaction('rw', db.categorias, db.productos, async () => {
    for (const c of categorias) {
      // Si este dispositivo tenía la misma categoría con otro id, se unifica.
      const igual = await db.categorias.where('nombre').equals(c.nombre).first()
      if (igual && igual.id !== c.id) {
        await db.productos.where('categoria_id').equals(igual.id).modify({ categoria_id: c.id })
        await db.categorias.delete(igual.id)
      }
      await db.categorias.put(pick(c, ['id', 'nombre', 'orden']))
    }
  })
  resumen.categorias = categorias.length

  const config = (await traer(sb, 'naty_config')).filter((c) => !SOLO_LOCAL.test(c.clave) && !bloqueados.has(`config:${c.clave}`))
  await db.config.bulkPut(config.map((c) => ({ clave: c.clave, valor: c.valor })))
  resumen.config = config.length

  // Productos con sus colores y fotos: si cambió algo de un producto, se baja el producto completo.
  const productos = (await traer(sb, 'naty_productos', { desde: conSolape(meta.productos) })).filter((p) => !bloqueados.has(`producto:${p.id}`))
  for (const lote of por(productos, LOTE_IN)) {
    const ids = lote.map((p) => p.id)
    const [colores, fotos] = await Promise.all([
      traer(sb, 'naty_producto_colores', { filtros: (q) => q.in('producto_id', ids).eq('eliminado', false) }),
      traer(sb, 'naty_producto_fotos', { filtros: (q) => q.in('producto_id', ids) }),
    ])
    await db.transaction('rw', db.productos, db.producto_colores, db.producto_fotos, async () => {
      await db.producto_colores.where('producto_id').anyOf(ids).delete()
      await db.producto_fotos.where('producto_id').anyOf(ids).delete()
      await db.productos.bulkPut(lote.map((p) => pick(p, ['id', 'codigo', 'nombre', 'categoria_id', 'descripcion', 'precio_docena_usd_cent', 'nuevo', 'activo', 'creado_en'])))
      await db.producto_colores.bulkPut(colores.map((c) => pick(c, ['id', 'producto_id', 'nombre', 'hex', 'orden'])))
      await db.producto_fotos.bulkPut(fotos.map((f) => ({ id: f.id, producto_id: f.producto_id, orden: f.orden, ruta: urlFoto(sb, f.ruta) })))
    })
  }
  nuevo.productos = maximo(productos, meta.productos)
  resumen.productos = productos.length

  // Movimientos de stock (las ventas y anulaciones de todos los dispositivos). Mismo id local y remoto: no se duplican.
  const movimientos = await traer(sb, 'naty_movimientos_stock', { desde: conSolape(meta.movimientos) })
  for (const lote of por(movimientos, 500)) await db.movimientos_stock.bulkPut(lote.map((m) => pick(m, ['id', 'producto_id', 'color_id', 'tipo', 'delta', 'motivo', 'usuario_id', 'venta_id', 'creado_en'])))
  nuevo.movimientos = maximo(movimientos, meta.movimientos)
  resumen.movimientos = movimientos.length

  // Ventas (solo las que este usuario puede ver) con sus ítems.
  const ventas = (await traer(sb, 'naty_ventas', { desde: conSolape(meta.ventas) })).filter((v) => !bloqueados.has(`venta:${v.id}`))
  for (const lote of por(ventas, LOTE_IN)) {
    const ids = lote.map((v) => v.id)
    const items = await traer(sb, 'naty_venta_items', { orden: 'id', filtros: (q) => q.in('venta_id', ids) })
    await db.transaction('rw', db.ventas, db.venta_items, async () => {
      await db.venta_items.where('venta_id').anyOf(ids).delete()
      await db.ventas.bulkPut(lote.map((v) => ({ ...pick(v, ['id', 'numero', 'vendedor_id', 'vendedor_nombre', 'moneda', 'metodo_pago', 'cliente_nombre', 'cliente_telefono', 'cliente_email', 'cliente_direccion', 'metodo_entrega', 'estado', 'anulada_en', 'anulacion_motivo', 'creada_en']), tipo_cambio: Number(v.tipo_cambio), total_cent: Number(v.total_cent), sync_status: 'synced' })))
      await db.venta_items.bulkPut(items.map((i) => ({ ...pick(i, ['id', 'venta_id', 'producto_id', 'color_id', 'codigo', 'nombre', 'color_nombre', 'unidad', 'unidades']), cantidad: Number(i.cantidad), precio_cent: Number(i.precio_cent), subtotal_cent: Number(i.subtotal_cent) })))
    })
  }
  nuevo.ventas = maximo(ventas, meta.ventas)
  resumen.ventas = ventas.length

  await db.config.put({ clave: 'sync_ultima', valor: nuevo })
  return resumen
}
