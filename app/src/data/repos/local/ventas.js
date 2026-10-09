// Repositorio de ventas.
//   crear(datos) · anular(id, { motivo, usuario_id }) · obtener(id) · listar(filtros) · listarConItems(filtros)
// Crear una venta es UNA transacción: nota + ítems + descuento de stock + cola de sincronización.
// Si algo falla no queda nada a medias. Las ventas se anulan, nunca se borran.
import { z } from 'zod'
import { db } from '../../db.js'
import { nuevoId } from '../../../lib/id.js'
import { esCantidadValida, subtotal } from '../../../lib/docenas.js'
import { METODOS_ENTREGA } from '../../../lib/entrega.js'
import { MONEDAS } from '../../../lib/moneda.js'
import { encolar } from '../../sync/cola.js'
import { insertarMovimiento } from './stock.js'

const esquemaVenta = z.object({
  vendedor_id: z.string().min(1, 'Falta el vendedor.'),
  moneda: z.enum(MONEDAS),
  tipo_cambio: z.number().positive('El tipo de cambio debe ser mayor a 0.'),
  metodo_pago: z.enum(['efectivo', 'transferencia']),
  cliente_nombre: z.string().trim().default(''),
  cliente_telefono: z.string().trim().default(''),
  cliente_email: z
    .string()
    .trim()
    .default('')
    .refine((s) => s === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s), 'El correo está mal escrito (debe ser como nombre@gmail.com). Si el cliente no tiene correo, dejá el campo vacío.'),
  cliente_direccion: z.string().trim().default(''),
  metodo_entrega: z.enum(Object.keys(METODOS_ENTREGA)).nullable().default(null),
  items: z
    .array(
      z.object({
        producto_id: z.string().min(1),
        color_id: z.string().min(1, 'Elegí un color en cada producto.'),
        cantidad: z.number().positive('La cantidad debe ser mayor a 0.').refine(esCantidadValida, 'Solo se vende por docena o media docena.'),
        unidad: z.enum(['docena', 'unidad']).default('docena'),
        precio_cent: z.number().int().min(0),
      }),
    )
    .min(1, 'Agregá al menos un producto.'),
})

async function config(clave, porDefecto) {
  const f = await db.config.get(clave)
  return f ? f.valor : porDefecto
}

// El correlativo sigue desde la nota más alta de esa persona que haya en el dispositivo: en un celular nuevo
// (o después de cerrar sesión) las ventas propias se descargan del servidor y la numeración no vuelve a 0001.
async function siguienteNumero(vendedor_id) {
  const clave = `correlativo:${vendedor_id}`
  const perfil = await db.perfiles.get(vendedor_id)
  const prefijo = `NV-${perfil?.iniciales ?? 'XX'}-`
  let ultimo = await config(clave, 0)
  await db.ventas.where('vendedor_id').equals(vendedor_id).each((v) => {
    if (v.numero?.startsWith(prefijo)) ultimo = Math.max(ultimo, Number.parseInt(v.numero.slice(prefijo.length), 10) || 0)
  })
  const n = ultimo + 1
  await db.config.put({ clave, valor: n })
  return `${prefijo}${String(n).padStart(4, '0')}`
}

export const ventas = {
  async crear(datos) {
    const d = esquemaVenta.parse(datos)
    const idVenta = nuevoId()
    await db.transaction('rw', db.ventas, db.venta_items, db.movimientos_stock, db.config, db.cola_sync, db.perfiles, db.productos, db.producto_colores, async () => {
      const porDocena = await config('unidades_por_docena', 12)
      // Se guarda una copia del nombre y color: la nota debe seguir diciendo lo mismo aunque el producto cambie después.
      const items = []
      for (const i of d.items) {
        const [prod, color] = await Promise.all([db.productos.get(i.producto_id), db.producto_colores.get(i.color_id)])
        if (!prod) throw new Error('Uno de los productos ya no existe.')
        if (!color || color.producto_id !== prod.id) throw new Error(`El color elegido no corresponde a ${prod.codigo}.`)
        items.push({
          ...i,
          id: nuevoId(),
          venta_id: idVenta,
          codigo: prod.codigo,
          nombre: prod.nombre,
          color_nombre: color.nombre,
          unidades: i.cantidad * (i.unidad === 'docena' ? porDocena : 1),
          subtotal_cent: subtotal(i.cantidad, i.precio_cent),
        })
      }
      const { items: _omitidos, ...cabecera } = d
      const vendedor = await db.perfiles.get(d.vendedor_id)
      const venta = {
        ...cabecera,
        vendedor_nombre: vendedor?.nombre ?? '',
        id: idVenta,
        numero: await siguienteNumero(d.vendedor_id),
        total_cent: items.reduce((t, i) => t + i.subtotal_cent, 0),
        estado: 'activa',
        sync_status: 'pending',
        creada_en: new Date().toISOString(),
      }
      await db.ventas.add(venta)
      await db.venta_items.bulkAdd(items)
      const movimientos = []
      for (const i of items) {
        movimientos.push(await insertarMovimiento({
          producto_id: i.producto_id,
          color_id: i.color_id,
          tipo: 'venta',
          delta: -i.unidades,
          motivo: venta.numero,
          usuario_id: d.vendedor_id,
          venta_id: idVenta,
        }))
      }
      // Los movimientos viajan con la nota y con sus mismos ids: así al descargar no se cuentan dos veces.
      await encolar({ operacion: 'crear', entidad: 'venta', entidad_id: idVenta, payload: { venta, items, movimientos } })
    })
    return ventas.obtener(idVenta)
  },

  async anular(id, { motivo, usuario_id }) {
    if (!String(motivo ?? '').trim()) throw new Error('Indicá el motivo de la anulación.')
    await db.transaction('rw', db.ventas, db.venta_items, db.movimientos_stock, db.cola_sync, async () => {
      const venta = await db.ventas.get(id)
      if (!venta) throw new Error('La venta no existe.')
      if (venta.estado === 'anulada') throw new Error('La venta ya está anulada.')
      const items = await db.venta_items.where('venta_id').equals(id).toArray()
      const anuladaEn = new Date().toISOString()
      const movimientos = []
      for (const i of items) {
        movimientos.push(await insertarMovimiento({
          producto_id: i.producto_id,
          color_id: i.color_id,
          tipo: 'anulacion',
          delta: i.unidades,
          motivo: `Anulación ${venta.numero}: ${motivo}`,
          usuario_id,
          venta_id: id,
        }))
      }
      await db.ventas.update(id, { estado: 'anulada', anulada_en: anuladaEn, anulacion_motivo: motivo, sync_status: 'pending' })
      await encolar({ operacion: 'anular', entidad: 'venta', entidad_id: id, payload: { motivo, usuario_id, anulada_en: anuladaEn, movimientos } })
    })
    return ventas.obtener(id)
  },

  async obtener(id) {
    const venta = await db.ventas.get(id)
    if (!venta) return undefined
    return { ...venta, items: await db.venta_items.where('venta_id').equals(id).toArray() }
  },

  async listar({ vendedor_id, moneda, metodo_pago, sync_status, estado, desde, hasta } = {}) {
    let lista = await db.ventas.toArray()
    if (vendedor_id) lista = lista.filter((v) => v.vendedor_id === vendedor_id)
    if (moneda) lista = lista.filter((v) => v.moneda === moneda)
    if (metodo_pago) lista = lista.filter((v) => v.metodo_pago === metodo_pago)
    if (sync_status) lista = lista.filter((v) => v.sync_status === sync_status)
    if (estado) lista = lista.filter((v) => v.estado === estado)
    if (desde) lista = lista.filter((v) => v.creada_en >= desde)
    if (hasta) lista = lista.filter((v) => v.creada_en <= hasta)
    return lista.sort((a, b) => b.creada_en.localeCompare(a.creada_en))
  },
  // Para exportar: cada venta con sus ítems.
  async listarConItems(filtros) {
    const lista = await ventas.listar(filtros)
    const items = await db.venta_items.where('venta_id').anyOf(lista.map((v) => v.id)).toArray()
    return lista.map((v) => ({ ...v, items: items.filter((i) => i.venta_id === v.id) }))
  },
}
