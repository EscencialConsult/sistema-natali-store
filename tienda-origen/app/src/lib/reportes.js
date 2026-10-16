// Cálculos de reportes sobre listas de pedidos y gastos ya cargadas. Sin acceso a datos: puro, para probarlo fácil.
// Los días se cortan en America/La_Paz (lib/fechas.js). Dinero en centavos; cada moneda se suma por separado.
import { diaLaPaz } from './fechas.js'

export const ESTADOS_VENDIDOS = ['pagado', 'en_preparacion', 'listo_retiro', 'enviado', 'entregado']
export const esVenta = (p) => ESTADOS_VENDIDOS.includes(p.estado)

const sumarPorMoneda = (lista, f = (p) => p.total_cent) => {
  const out = {}
  for (const p of lista) out[p.moneda] = (out[p.moneda] ?? 0) + f(p)
  return out
}

// Pedidos cobrados: total por moneda y cantidad.
export function totalVentas(pedidos) {
  const vendidos = pedidos.filter(esVenta)
  return { cantidad: vendidos.length, por_moneda: sumarPorMoneda(vendidos) }
}

export function pedidosPorEstado(pedidos) {
  const out = {}
  for (const p of pedidos) out[p.estado] = (out[p.estado] ?? 0) + 1
  return out
}

// [{ dia: 'AAAA-MM-DD', cantidad, por_moneda }], ordenado por día.
export function ventasPorDia(pedidos) {
  const porDia = new Map()
  for (const p of pedidos.filter(esVenta)) {
    const dia = diaLaPaz(p.pagado_en ?? p.creado_en)
    const d = porDia.get(dia) ?? { dia, cantidad: 0, por_moneda: {} }
    d.cantidad++
    d.por_moneda[p.moneda] = (d.por_moneda[p.moneda] ?? 0) + p.total_cent
    porDia.set(dia, d)
  }
  return [...porDia.values()].sort((a, b) => a.dia.localeCompare(b.dia))
}

const agrupar = (pedidos, clave) => {
  const out = new Map()
  for (const p of pedidos.filter(esVenta)) {
    const k = clave(p)
    const d = out.get(k) ?? { clave: k, cantidad: 0, por_moneda: {} }
    d.cantidad++
    d.por_moneda[p.moneda] = (d.por_moneda[p.moneda] ?? 0) + p.total_cent
    out.set(k, d)
  }
  return [...out.values()].sort((a, b) => b.cantidad - a.cantidad)
}
export const ventasPorMedioPago = (pedidos) => agrupar(pedidos, (p) => p.proveedor_pago)
export const ventasPorOrigen = (pedidos) => agrupar(pedidos, (p) => p.origen)

// Productos más vendidos (unidades) y ventas por categoría, a partir de los ítems de pedidos cobrados.
export function masVendidos(pedidos, limite = 10) {
  const out = new Map()
  for (const p of pedidos.filter(esVenta)) {
    for (const i of p.items ?? []) {
      const d = out.get(i.producto_id) ?? { producto_id: i.producto_id, codigo: i.codigo, nombre: i.nombre, unidades: 0, por_moneda: {} }
      d.unidades += i.cantidad
      d.por_moneda[p.moneda] = (d.por_moneda[p.moneda] ?? 0) + i.subtotal_cent
      out.set(i.producto_id, d)
    }
  }
  return [...out.values()].sort((a, b) => b.unidades - a.unidades).slice(0, limite)
}

export function ventasPorCategoria(pedidos, categoriaDeProducto) {
  const out = new Map()
  for (const p of pedidos.filter(esVenta)) {
    for (const i of p.items ?? []) {
      const cat = categoriaDeProducto(i.producto_id) ?? 'Sin categoría'
      const d = out.get(cat) ?? { categoria: cat, unidades: 0, por_moneda: {} }
      d.unidades += i.cantidad
      d.por_moneda[p.moneda] = (d.por_moneda[p.moneda] ?? 0) + i.subtotal_cent
      out.set(cat, d)
    }
  }
  return [...out.values()].sort((a, b) => b.unidades - a.unidades)
}

export const totalGastos = (gastos) => gastos.reduce((t, g) => t + g.monto_cent, 0)

export function gastosPorCategoria(gastos, nombreCategoria) {
  const out = new Map()
  for (const g of gastos) {
    const k = nombreCategoria(g.categoria_id) ?? 'Sin categoría'
    out.set(k, (out.get(k) ?? 0) + g.monto_cent)
  }
  return [...out.entries()].map(([categoria, monto_cent]) => ({ categoria, monto_cent })).sort((a, b) => b.monto_cent - a.monto_cent)
}

// Margen en Bs: ventas en Bs menos gastos (los gastos siempre se cargan en Bs). Las ventas en ARS se informan aparte.
export function margen(pedidos, gastos) {
  const v = totalVentas(pedidos).por_moneda
  return { ventas_bs_cent: v.bs ?? 0, ventas_ars_cent: v.ars ?? 0, gastos_cent: totalGastos(gastos), margen_bs_cent: (v.bs ?? 0) - totalGastos(gastos) }
}
