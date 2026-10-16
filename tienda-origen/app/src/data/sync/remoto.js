// Sincronización con Supabase. El cliente (`sb`) llega como parámetro: así se prueba con un Postgres real en memoria.
//   ENVÍO   enviarRemoto(sb, item)  → lo usa la cola (cola.js). Cada operación es idempotente: reenviar no duplica.
//   BAJADA  descargar(sb)           → trae lo que cambió en el servidor desde la última vez y lo guarda en el dispositivo.
// Regla de oro de la bajada: si algo está "por enviar" en este dispositivo, NO se pisa con lo del servidor.
import { crearMiniatura, SUFIJO_MINI } from '../../lib/fotos.js'
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
    const ruta = `${p.codigo}/${f.id}.jpg`
    // Miniatura opcional junto a la original (convención `<ruta>.mini.webp`, ver lib/fotos.js): si falla, la foto viaja igual.
    const mini = await crearMiniatura(f.blob)
    if (mini) await sb.storage.from(BUCKET).upload(`${ruta}${SUFIJO_MINI}`, mini, { upsert: true, contentType: 'image/webp' }).catch(() => null)
    f.ruta = await subirImagen(sb, ruta, f.blob)
    await db.producto_fotos.update(f.id, { ruta: f.ruta, blob: undefined })
  }
  // El catálogo (nombre, categoría, colores, fotos) lo guarda la función del sistema de nota; la publicación en la tienda
  // (precio minorista, publicado, destacado, slug) es de la tienda y va por su propia función. Así no depende de que
  // naty_guardar_producto conozca esos campos.
  await rpc(sb, 'naty_guardar_producto', {
    ...pick(p, ['id', 'codigo', 'nombre', 'descripcion', 'precio_docena_usd_cent', 'nuevo', 'activo']),
    categoria: cat ? pick(cat, ['id', 'nombre', 'orden']) : null,
    colores: colores.sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)).map((c, orden) => ({ id: c.id, nombre: c.nombre, hex: c.hex, orden })),
    fotos: fotos.sort((a, b) => a.orden - b.orden).map((f, orden) => ({ id: f.id, orden, ruta: f.ruta })),
  })
  await rpc(sb, 'tienda_guardar_publicacion', pick(p, ['id', 'precio_unidad_bs_cent', 'publicado_tienda', 'destacado', 'slug']))
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

// Un pedido creado en el dispositivo (kiosco sin red) se manda con su mismo id: reenviar no lo duplica.
async function enviarPedido(sb, id) {
  const p = await db.pedidos.get(id)
  if (!p) return
  const items = await db.pedido_items.where('pedido_id').equals(id).toArray()
  await rpc(sb, 'tienda_crear_pedido', {
    ...pick(p, ['id', 'origen', 'comprador_nombre', 'comprador_telefono', 'comprador_correo', 'entrega', 'envio_ciudad', 'envio_direccion', 'envio_costo_cent', 'nota', 'moneda', 'tipo_cambio', 'proveedor_pago', 'dispositivo_kiosco_id']),
    items: items.map((i) => pick(i, ['producto_id', 'color_id', 'cantidad'])),
  })
  await db.pedidos.update(id, { sync_status: 'synced' })
}

async function enviarPagoPedido(sb, id, payload) {
  await rpc(sb, 'tienda_confirmar_pago', { id, proveedor: payload?.proveedor ?? 'caja', proveedor_id: payload?.proveedor_id ?? null })
}

async function enviarEstadoPedido(sb, id, payload) {
  await rpc(sb, 'tienda_cambiar_estado', { id, estado: payload?.estado, motivo: payload?.motivo ?? '' })
}

export async function enviarRemoto(sb, item) {
  switch (`${item.entidad}/${item.operacion}`) {
    case 'pedido/crear':
      return enviarPedido(sb, item.entidad_id)
    case 'pedido/pago':
      return enviarPagoPedido(sb, item.entidad_id, item.payload)
    case 'pedido/estado':
      return enviarEstadoPedido(sb, item.entidad_id, item.payload)
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

// orden: columna por la que se pagina ('updated_at' para lo incremental).
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
      await db.productos.bulkPut(lote.map((p) => pick(p, ['id', 'codigo', 'nombre', 'categoria_id', 'descripcion', 'precio_docena_usd_cent', 'nuevo', 'activo', 'creado_en', 'precio_unidad_bs_cent', 'publicado_tienda', 'destacado', 'slug'])))
      await db.producto_colores.bulkPut(colores.map((c) => pick(c, ['id', 'producto_id', 'nombre', 'hex', 'orden'])))
      await db.producto_fotos.bulkPut(fotos.map((f) => ({ id: f.id, producto_id: f.producto_id, orden: f.orden, ruta: urlFoto(sb, f.ruta) })))
    })
  }
  nuevo.productos = maximo(productos, meta.productos)
  resumen.productos = productos.length

  // Movimientos de stock de todos los dispositivos (incluidos los del sistema de nota). Mismo id local y remoto: no se duplican.
  const movimientos = await traer(sb, 'naty_movimientos_stock', { desde: conSolape(meta.movimientos) })
  for (const lote of por(movimientos, 500)) await db.movimientos_stock.bulkPut(lote.map((m) => pick(m, ['id', 'producto_id', 'color_id', 'tipo', 'delta', 'motivo', 'usuario_id', 'venta_id', 'pedido_id', 'creado_en'])))
  nuevo.movimientos = maximo(movimientos, meta.movimientos)
  resumen.movimientos = movimientos.length


  await db.config.put({ clave: 'sync_ultima', valor: nuevo })
  return resumen
}
