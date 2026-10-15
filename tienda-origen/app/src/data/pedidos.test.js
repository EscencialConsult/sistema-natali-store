import 'fake-indexeddb/auto'
import { beforeAll, describe, expect, it } from 'vitest'
import { db } from './db.js'
import { cargarSeedSiVacio } from './seed/cargar.js'
import { carrito, gastos, kiosco, pagos, pedidos, productos, sitio, stock } from './repos/index.js'
import { pendientes } from './sync/cola.js'

beforeAll(async () => {
  await cargarSeedSiVacio()
})

async function productoConStock(minimo = 10) {
  for (const p of await productos.listar()) {
    const s = await stock.stockPorColor(p.id)
    const color = p.colores.find((c) => (s[c.id] ?? 0) >= minimo)
    if (color) return { p, color, antes: s[color.id] }
  }
  throw new Error('sin stock en el seed')
}

const comprador = { comprador_nombre: 'Ana Pérez', comprador_telefono: '59171234567' }

describe('seed de la tienda', () => {
  it('los productos tienen precio minorista, slug y publicación', async () => {
    const [p] = await productos.listar()
    expect(Number.isInteger(p.precio_unidad_bs_cent)).toBe(true)
    expect(p.slug).toMatch(/^[a-z0-9-]+$/)
    expect(p.publicado_tienda).toBe(true)
  })
  it('hay categorías de gasto y el sitio tiene valores por defecto', async () => {
    expect((await gastos.categorias()).length).toBeGreaterThan(0)
    expect((await sitio.obtener()).envios.retiro).toBe(true)
  })
})

describe('carrito', () => {
  it('junta el mismo producto y color, y respeta el máximo', async () => {
    const { p, color } = await productoConStock()
    await carrito.vaciar()
    await carrito.agregar({ producto_id: p.id, color_id: color.id, cantidad: 2 })
    await carrito.agregar({ producto_id: p.id, color_id: color.id, cantidad: 1 })
    const items = await carrito.items()
    expect(items).toHaveLength(1)
    expect(items[0].cantidad).toBe(3)
    await carrito.cantidad(items[0].key, 0)
    expect(await carrito.items()).toHaveLength(0)
  })
})

describe('pedidos', () => {
  it('crea un pedido con código, copia precios, reserva stock y entra a la cola', async () => {
    const { p, color, antes } = await productoConStock()
    const pedido = await pedidos.crear({ ...comprador, items: [{ producto_id: p.id, color_id: color.id, cantidad: 2 }] })
    expect(pedido.codigo).toMatch(/^TN-\d{6}$/)
    expect(pedido.estado).toBe('pendiente_pago')
    expect(pedido.items[0]).toMatchObject({ codigo: p.codigo, color_nombre: color.nombre, precio_cent: p.precio_unidad_bs_cent })
    expect(pedido.total_cent).toBe(2 * p.precio_unidad_bs_cent)
    expect(await stock.stockActual(p.id, color.id)).toBe(antes - 2)
    expect(pedido.historial).toHaveLength(1)
    expect(await pendientes()).toBeGreaterThanOrEqual(1)
  })

  it('el mismo id no crea dos pedidos (doble clic)', async () => {
    const { p, color } = await productoConStock()
    const id = crypto.randomUUID()
    const a = await pedidos.crear({ id, ...comprador, items: [{ producto_id: p.id, color_id: color.id, cantidad: 1 }] })
    const b = await pedidos.crear({ id, ...comprador, items: [{ producto_id: p.id, color_id: color.id, cantidad: 1 }] })
    expect(b.codigo).toBe(a.codigo)
  })

  it('sin stock suficiente no deja nada a medias', async () => {
    const { p, color, antes } = await productoConStock()
    const antesPedidos = await db.pedidos.count()
    await expect(pedidos.crear({ ...comprador, items: [{ producto_id: p.id, color_id: color.id, cantidad: antes + 1 }] })).rejects.toMatchObject({ code: 'TIENDA_STOCK_INSUFICIENTE' })
    expect(await db.pedidos.count()).toBe(antesPedidos)
    expect(await stock.stockActual(p.id, color.id)).toBe(antes)
  })

  it('el envío exige dirección y suma el costo', async () => {
    const { p, color } = await productoConStock()
    const base = { ...comprador, entrega: 'envio', items: [{ producto_id: p.id, color_id: color.id, cantidad: 1 }] }
    await expect(pedidos.crear(base)).rejects.toThrow()
    const pedido = await pedidos.crear({ ...base, envio_ciudad: 'Bermejo', envio_direccion: 'Calle 1', envio_costo_cent: 1500 })
    expect(pedido.total_cent).toBe(p.precio_unidad_bs_cent + 1500)
  })

  it('confirmar el pago convierte la reserva en venta; cancelar devuelve el stock', async () => {
    const { p, color, antes } = await productoConStock()
    const a = await pedidos.crear({ ...comprador, items: [{ producto_id: p.id, color_id: color.id, cantidad: 1 }] })
    const pagado = await pedidos.confirmarPago(a.id, { proveedor: 'caja', usuario_id: 'p-pamela' })
    expect(pagado.estado).toBe('pagado')
    expect(pagado.pagado_en).toBeTruthy()
    expect(await stock.stockActual(p.id, color.id)).toBe(antes - 1)
    const tipos = (await db.movimientos_stock.where('pedido_id').equals(a.id).toArray()).map((m) => m.tipo).sort()
    expect(tipos).toEqual(['liberacion', 'reserva', 'venta'])

    const b = await pedidos.crear({ ...comprador, items: [{ producto_id: p.id, color_id: color.id, cantidad: 1 }] })
    await expect(pedidos.cancelar(b.id, { motivo: '  ' })).rejects.toThrow(/motivo/)
    const cancelado = await pedidos.cancelar(b.id, { motivo: 'se arrepintió' })
    expect(cancelado.estado).toBe('cancelado')
    expect(await stock.stockActual(p.id, color.id)).toBe(antes - 1)
    await expect(pedidos.confirmarPago(b.id, { proveedor: 'caja' })).rejects.toThrow()
  })

  it('las transiciones inválidas se rechazan con código', async () => {
    const { p, color } = await productoConStock()
    const a = await pedidos.crear({ ...comprador, items: [{ producto_id: p.id, color_id: color.id, cantidad: 1 }] })
    await expect(pedidos.cambiarEstado(a.id, 'enviado')).rejects.toMatchObject({ code: 'TIENDA_TRANSICION_INVALIDA' })
    await pedidos.confirmarPago(a.id, { proveedor: 'caja' })
    const prep = await pedidos.cambiarEstado(a.id, 'en_preparacion', { usuario_id: 'p-pamela' })
    expect(prep.historial.map((h) => h.a_estado)).toEqual(['pendiente_pago', 'pagado', 'en_preparacion'])
  })

  it('las reservas vencidas se cancelan solas y liberan stock', async () => {
    const { p, color, antes } = await productoConStock()
    const a = await pedidos.crear({ ...comprador, items: [{ producto_id: p.id, color_id: color.id, cantidad: 3 }] })
    expect(await stock.stockActual(p.id, color.id)).toBe(antes - 3)
    expect(await pedidos.vencerReservas(new Date(Date.now() + 31 * 60_000))).toBeGreaterThanOrEqual(1)
    expect((await pedidos.obtener(a.id)).estado).toBe('cancelado')
    // Vencen también las reservas pendientes de las pruebas anteriores: el stock vuelve a ser al menos el de antes.
    expect(await stock.stockActual(p.id, color.id)).toBeGreaterThanOrEqual(antes)
    const tipos = (await db.movimientos_stock.where('pedido_id').equals(a.id).toArray()).map((m) => m.tipo).sort()
    expect(tipos).toEqual(['liberacion', 'reserva'])
  })

  it('consulta pública solo con código y teléfono correctos', async () => {
    const { p, color } = await productoConStock()
    const a = await pedidos.crear({ ...comprador, items: [{ producto_id: p.id, color_id: color.id, cantidad: 1 }] })
    expect((await pedidos.consultarPublico(a.codigo, '591 7123-4567'))?.id).toBe(a.id)
    expect(await pedidos.consultarPublico(a.codigo, '59100000000')).toBeUndefined()
    expect(await pedidos.consultarPublico('TN-999999', comprador.comprador_telefono)).toBeUndefined()
  })

  it('el kiosco crea pedidos sin datos de la persona y el pago simulado lo aprueba', async () => {
    const { p, color } = await productoConStock()
    const a = await pedidos.crear({ origen: 'kiosco', proveedor_pago: 'caja', items: [{ producto_id: p.id, color_id: color.id, cantidad: 1 }] })
    expect(a.origen).toBe('kiosco')
    expect(a.comprador_nombre).toBe('')
    expect((await pagos.iniciar(a.id)).tipo).toBe('manual')
    expect((await pagos.simularAprobado(a.id)).estado).toBe('pagado')
  })
})

describe('gastos y kiosco', () => {
  it('carga un gasto y lo suma por categoría; la baja es lógica', async () => {
    const [cat] = await gastos.categorias()
    const g = await gastos.crear({ categoria_id: cat.id, fecha: '2026-10-09', monto_cent: 12_50, descripcion: 'Bolsas' })
    await expect(gastos.crear({ categoria_id: cat.id, fecha: '2026-10-09', monto_cent: 0 })).rejects.toThrow()
    expect((await gastos.totalPorCategoria({ desde: '2026-10-01', hasta: '2026-10-31' }))[cat.id]).toBe(1250)
    await gastos.eliminar(g.id)
    expect((await gastos.totalPorCategoria({ desde: '2026-10-01', hasta: '2026-10-31' }))[cat.id]).toBeUndefined()
    expect(await gastos.obtener(g.id)).toBeTruthy()
  })
  it('el kiosco se activa con el PIN correcto', async () => {
    await expect(kiosco.activar('0000')).rejects.toThrow(/PIN/)
    const d = await kiosco.activar(await kiosco.pinActual(), 'Mostrador')
    expect((await kiosco.dispositivo()).id).toBe(d.id)
    await kiosco.desactivar()
    expect(await kiosco.dispositivo()).toBeNull()
  })
})
