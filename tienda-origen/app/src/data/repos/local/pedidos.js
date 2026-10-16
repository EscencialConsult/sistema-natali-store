// Repositorio de pedidos (implementación LOCAL, Dexie). En la etapa 4 la remota llama a tienda_crear_pedido y compañía
// con la misma interfaz; las pantallas no cambian.
//   crear(datos) · obtener(id) · obtenerPorCodigo(codigo) · consultarPublico(codigo, telefono)
//   listar({ estado, origen, desde, hasta, texto }) · cambiarEstado(id, estado, { usuario_id, motivo })
//   confirmarPago(id, { proveedor, proveedor_id }) · cancelar(id, { motivo, usuario_id }) · vencerReservas(ahora)
// Cada pedido sale con `items` e `historial`. Dinero en centavos; precio copiado al momento de crear el pedido.
import { db } from '../../db.js'
import { nuevoId } from '../../../lib/id.js'
import { codigoPedido, esquemaPedido, esquemaPedidoKiosco, puedeTransicionar, RESERVA_MIN } from '../../../lib/pedido.js'
import { encolar } from '../../sync/cola.js'
import { insertarMovimiento } from './stock.js'

const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

async function armar(lista) {
  const ids = lista.map((p) => p.id)
  const [items, historial] = await Promise.all([
    db.pedido_items.where('pedido_id').anyOf(ids).toArray(),
    db.pedido_historial.where('pedido_id').anyOf(ids).toArray(),
  ])
  return lista.map((p) => ({
    ...p,
    items: items.filter((i) => i.pedido_id === p.id),
    historial: historial.filter((h) => h.pedido_id === p.id).sort((a, b) => a.creado_en.localeCompare(b.creado_en)),
  }))
}

// Stock disponible de un color: movimientos (que ya incluyen las reservas vigentes como delta negativo).
async function disponible(producto_id, color_id) {
  const movs = await db.movimientos_stock.where('producto_id').equals(producto_id).toArray()
  return movs.filter((m) => m.color_id === color_id).reduce((t, m) => t + m.delta, 0)
}

async function siguienteNumero() {
  const fila = await db.config.get('correlativo:pedido')
  const n = (fila?.valor ?? 0) + 1
  await db.config.put({ clave: 'correlativo:pedido', valor: n })
  return n
}

async function registrarHistorial(pedido_id, de_estado, a_estado, { usuario_id = null, motivo = '' } = {}) {
  await db.pedido_historial.add({ id: nuevoId(), pedido_id, de_estado, a_estado, usuario_id, motivo, creado_en: new Date().toISOString() })
}

// Devuelve el stock reservado por un pedido (movimientos tipo 'reserva' con delta negativo).
async function liberarReserva(pedido) {
  const reservas = await db.movimientos_stock.where('pedido_id').equals(pedido.id).filter((m) => m.tipo === 'reserva').toArray()
  for (const r of reservas) {
    await insertarMovimiento({ producto_id: r.producto_id, color_id: r.color_id, tipo: 'liberacion', delta: -r.delta, motivo: `Pedido ${pedido.codigo}`, pedido_id: pedido.id })
  }
}

const TABLAS = [db.pedidos, db.pedido_items, db.pedido_historial, db.movimientos_stock, db.productos, db.producto_colores, db.config, db.cola_sync]

export const pedidos = {
  // Valida, copia precio y nombres al momento, reserva stock y encola. Si falta stock, no deja nada a medias.
  async crear(datos) {
    const d = (datos?.origen === 'kiosco' ? esquemaPedidoKiosco : esquemaPedido).parse(datos)
    const id = d.id ?? nuevoId()
    // Idempotencia: el cliente puede reintentar con el mismo id (doble clic, red lenta) sin crear dos pedidos.
    const existente = await db.pedidos.get(id)
    if (existente) return (await armar([existente]))[0]

    const ahora = new Date()
    return db.transaction('rw', TABLAS, async () => {
      const items = []
      for (const it of d.items) {
        const p = await db.productos.get(it.producto_id)
        if (!p || !p.activo) throw new Error('Uno de los productos ya no está disponible.')
        const color = await db.producto_colores.get(it.color_id)
        if (!color || color.producto_id !== p.id) throw new Error(`El color elegido no corresponde a ${p.nombre}.`)
        const hay = await disponible(p.id, color.id)
        if (hay < it.cantidad) {
          const e = new Error(`No hay stock suficiente de ${p.nombre} (${color.nombre}): quedan ${Math.max(0, hay)}.`)
          e.code = 'TIENDA_STOCK_INSUFICIENTE'
          e.detalle = { producto_id: p.id, color_id: color.id, disponible: Math.max(0, hay) }
          throw e
        }
        const precioBs = p.precio_unidad_bs_cent
        if (!Number.isInteger(precioBs)) throw new Error(`${p.nombre} no tiene precio de tienda.`)
        // En pesos el precio se redondea al centavo y nunca baja de 1 centavo (igual que la base).
        const precio_cent = d.moneda === 'bs' ? precioBs : Math.max(1, Math.round(precioBs * d.tipo_cambio))
        items.push({
          id: nuevoId(),
          pedido_id: id,
          producto_id: p.id,
          color_id: color.id,
          codigo: p.codigo,
          nombre: p.nombre,
          color_nombre: color.nombre,
          cantidad: it.cantidad,
          precio_cent,
          subtotal_cent: precio_cent * it.cantidad,
        })
      }
      const subtotal_cent = items.reduce((t, i) => t + i.subtotal_cent, 0)
      // El costo de envío viene en Bs: en un pedido en pesos se convierte.
      const envio_cent = d.entrega === 'envio' ? (d.moneda === 'bs' ? d.envio_costo_cent : Math.round(d.envio_costo_cent * d.tipo_cambio)) : 0
      const numero = await siguienteNumero()
      const codigo = codigoPedido(numero)
      const minutos = RESERVA_MIN[d.proveedor_pago] ?? 30
      const pedido = {
        id,
        numero,
        codigo,
        origen: d.origen,
        estado: 'pendiente_pago',
        comprador_nombre: d.comprador_nombre,
        comprador_telefono: d.comprador_telefono,
        comprador_correo: d.comprador_correo,
        entrega: d.entrega,
        envio_ciudad: d.envio_ciudad,
        envio_direccion: d.envio_direccion,
        envio_costo_cent: envio_cent,
        nota: d.nota,
        moneda: d.moneda,
        tipo_cambio: d.tipo_cambio,
        proveedor_pago: d.proveedor_pago,
        dispositivo_kiosco_id: d.dispositivo_kiosco_id ?? null,
        subtotal_cent,
        total_cent: subtotal_cent + envio_cent,
        reserva_vence_en: new Date(ahora.getTime() + minutos * 60_000).toISOString(),
        pagado_en: null,
        creado_en: ahora.toISOString(),
        sync_status: 'pending',
      }
      await db.pedidos.add(pedido)
      await db.pedido_items.bulkAdd(items)
      for (const i of items) {
        await insertarMovimiento({ producto_id: i.producto_id, color_id: i.color_id, tipo: 'reserva', delta: -i.cantidad, motivo: `Pedido ${codigo}`, pedido_id: id })
      }
      await registrarHistorial(id, null, 'pendiente_pago')
      await encolar({ operacion: 'crear', entidad: 'pedido', entidad_id: id })
      return (await armar([pedido]))[0]
    })
  },

  async obtener(id) {
    const p = await db.pedidos.get(id)
    return p ? (await armar([p]))[0] : undefined
  },

  async obtenerPorCodigo(codigo) {
    const p = await db.pedidos.where('codigo').equals(String(codigo).trim().toUpperCase()).first()
    return p ? (await armar([p]))[0] : undefined
  },

  // Consulta pública: código + teléfono. Si no coincide devuelve undefined sin decir cuál de los dos falló.
  async consultarPublico(codigo, telefono) {
    const p = await this.obtenerPorCodigo(codigo)
    const tel = String(telefono ?? '').replace(/\D/g, '')
    if (!p || !tel || p.comprador_telefono.replace(/\D/g, '') !== tel) return undefined
    return p
  },

  // Sin servidor no hay cobros reales de Mercado Pago.
  async cobros() {
    return []
  },

  async listar({ estado, origen, desde, hasta, texto = '' } = {}) {
    let lista = await db.pedidos.orderBy('creado_en').reverse().toArray()
    if (estado) lista = lista.filter((p) => [estado].flat().includes(p.estado))
    if (origen) lista = lista.filter((p) => p.origen === origen)
    if (desde) lista = lista.filter((p) => p.creado_en >= desde)
    if (hasta) lista = lista.filter((p) => p.creado_en <= hasta)
    const q = norm(texto.trim())
    if (q) lista = lista.filter((p) => norm(`${p.codigo} ${p.comprador_nombre} ${p.comprador_telefono}`).includes(q))
    return armar(lista)
  },

  async cambiarEstado(id, estado, { usuario_id = null, motivo = '' } = {}) {
    return db.transaction('rw', TABLAS, async () => {
      const p = await db.pedidos.get(id)
      if (!p) throw new Error('El pedido no existe.')
      if (!puedeTransicionar(p.estado, estado)) {
        const e = new Error(`Un pedido ${p.estado.replaceAll('_', ' ')} no puede pasar a ${estado.replaceAll('_', ' ')}.`)
        e.code = 'TIENDA_TRANSICION_INVALIDA'
        throw e
      }
      if ((estado === 'cancelado' || estado === 'reembolsado') && !motivo.trim()) throw new Error('Indicá el motivo.')
      if (estado === 'cancelado') await liberarReserva(p)
      if (estado === 'reembolsado') {
        // Vuelve el stock vendido.
        const ventas = await db.movimientos_stock.where('pedido_id').equals(id).filter((m) => m.tipo === 'venta').toArray()
        for (const v of ventas) await insertarMovimiento({ producto_id: v.producto_id, color_id: v.color_id, tipo: 'devolucion', delta: -v.delta, motivo: `Reembolso ${p.codigo}`, pedido_id: id })
      }
      await db.pedidos.update(id, { estado })
      await registrarHistorial(id, p.estado, estado, { usuario_id, motivo })
      await encolar({ operacion: 'estado', entidad: 'pedido', entidad_id: id, payload: { estado, motivo } })
      return this.obtener(id)
    })
  },

  // Pago confirmado (webhook, caja o transferencia): la reserva se vuelve venta en la misma transacción.
  async confirmarPago(id, { proveedor, proveedor_id = null, usuario_id = null } = {}) {
    return db.transaction('rw', TABLAS, async () => {
      const p = await db.pedidos.get(id)
      if (!p) throw new Error('El pedido no existe.')
      if (p.estado === 'pagado') return this.obtener(id)
      if (!puedeTransicionar(p.estado, 'pagado')) throw new Error(`Un pedido ${p.estado.replaceAll('_', ' ')} no se puede marcar como pagado.`)
      const reservas = await db.movimientos_stock.where('pedido_id').equals(id).filter((m) => m.tipo === 'reserva').toArray()
      for (const r of reservas) {
        await insertarMovimiento({ producto_id: r.producto_id, color_id: r.color_id, tipo: 'liberacion', delta: -r.delta, motivo: `Pedido ${p.codigo}`, pedido_id: id })
        await insertarMovimiento({ producto_id: r.producto_id, color_id: r.color_id, tipo: 'venta', delta: r.delta, motivo: `Pedido ${p.codigo}`, pedido_id: id })
      }
      const pagado_en = new Date().toISOString()
      await db.pedidos.update(id, { estado: 'pagado', pagado_en, proveedor_pago: proveedor ?? p.proveedor_pago, pago_proveedor_id: proveedor_id })
      await registrarHistorial(id, p.estado, 'pagado', { usuario_id, motivo: proveedor ? `Pago por ${proveedor}` : '' })
      await encolar({ operacion: 'pago', entidad: 'pedido', entidad_id: id, payload: { proveedor, proveedor_id } })
      return this.obtener(id)
    })
  },

  cancelar(id, { motivo, usuario_id = null }) {
    return this.cambiarEstado(id, 'cancelado', { motivo, usuario_id })
  },

  // Pedidos pendientes cuya reserva venció: se cancelan y el stock vuelve. Devuelve cuántos.
  async vencerReservas(ahora = new Date()) {
    const iso = ahora.toISOString()
    const vencidos = await db.pedidos.where('estado').equals('pendiente_pago').filter((p) => p.reserva_vence_en && p.reserva_vence_en <= iso).toArray()
    for (const p of vencidos) await this.cambiarEstado(p.id, 'cancelado', { motivo: 'Venció el plazo de pago' })
    return vencidos.length
  },
}
