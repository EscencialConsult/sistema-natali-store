import { describe, expect, it } from 'vitest'
import { gastosPorCategoria, margen, masVendidos, pedidosPorEstado, totalVentas, ventasPorDia, ventasPorMedioPago } from './reportes.js'

const item = (producto_id, cantidad, subtotal_cent) => ({ producto_id, codigo: producto_id, nombre: producto_id, cantidad, subtotal_cent })
const pedidos = [
  { estado: 'pagado', moneda: 'bs', total_cent: 10000, proveedor_pago: 'caja', origen: 'kiosco', pagado_en: '2026-10-10T02:30:00Z', items: [item('A', 2, 10000)] },
  { estado: 'entregado', moneda: 'bs', total_cent: 5000, proveedor_pago: 'mercadopago', origen: 'web', pagado_en: '2026-10-10T05:00:00Z', items: [item('B', 1, 5000)] },
  { estado: 'pagado', moneda: 'ars', total_cent: 200000, proveedor_pago: 'mercadopago', origen: 'web', pagado_en: '2026-10-09T12:00:00Z', items: [item('A', 1, 200000)] },
  { estado: 'pendiente_pago', moneda: 'bs', total_cent: 99999, proveedor_pago: 'caja', origen: 'web', creado_en: '2026-10-09T12:00:00Z', items: [] },
  { estado: 'cancelado', moneda: 'bs', total_cent: 99999, proveedor_pago: 'caja', origen: 'web', creado_en: '2026-10-09T12:00:00Z', items: [] },
]
const gastos = [{ categoria_id: 'c1', monto_cent: 3000 }, { categoria_id: 'c2', monto_cent: 1000 }, { categoria_id: 'c1', monto_cent: 500 }]

describe('reportes', () => {
  it('cuenta solo lo cobrado, por moneda, sin mezclar', () => {
    expect(totalVentas(pedidos)).toEqual({ cantidad: 3, por_moneda: { bs: 15000, ars: 200000 } })
    expect(pedidosPorEstado(pedidos)).toEqual({ pagado: 2, entregado: 1, pendiente_pago: 1, cancelado: 1 })
  })
  it('agrupa por día de Bolivia (02:30 UTC del 10 es el 9 en La Paz)', () => {
    const dias = ventasPorDia(pedidos)
    expect(dias.map((d) => d.dia)).toEqual(['2026-10-09', '2026-10-10'])
    expect(dias[0].por_moneda).toEqual({ bs: 10000, ars: 200000 })
    expect(dias[1].por_moneda).toEqual({ bs: 5000 })
  })
  it('medio de pago, más vendidos, gastos y margen', () => {
    expect(ventasPorMedioPago(pedidos).map((m) => m.clave)).toEqual(['mercadopago', 'caja'])
    expect(masVendidos(pedidos)[0]).toMatchObject({ producto_id: 'A', unidades: 3, por_moneda: { bs: 10000, ars: 200000 } })
    expect(gastosPorCategoria(gastos, (id) => ({ c1: 'Alquiler', c2: 'Envíos' })[id])).toEqual([{ categoria: 'Alquiler', monto_cent: 3500 }, { categoria: 'Envíos', monto_cent: 1000 }])
    expect(margen(pedidos, gastos)).toEqual({ ventas_bs_cent: 15000, ventas_ars_cent: 200000, gastos_cent: 4500, margen_bs_cent: 10500 })
  })
})
