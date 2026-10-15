// Reglas del panel rediseñado: cola de trabajo, menú por rol y umbral de stock único.
import { describe, expect, it } from 'vitest'
import { menuDe, PANTALLAS } from '../app/navegacion.js'
import { antiguedad, ordenarCola, siguienteAccion } from './colaPedidos.js'
import { umbralStockBajo, UMBRAL_STOCK_BAJO } from './stock.js'

describe('cola "Para hacer"', () => {
  const p = (codigo, estado, creado_en) => ({ codigo, estado, creado_en })
  it('incluye pedidos abiertos de meses anteriores, del más viejo al más nuevo, y deja afuera los cerrados', () => {
    const cola = ordenarCola([
      p('TN-3', 'pagado', '2026-10-08T10:00:00Z'),
      p('TN-1', 'listo_retiro', '2026-09-02T10:00:00Z'), // del mes anterior: tiene que aparecer
      p('TN-2', 'entregado', '2026-10-01T10:00:00Z'),
      p('TN-4', 'cancelado', '2026-10-01T10:00:00Z'),
      p('TN-5', 'en_preparacion', '2026-10-05T10:00:00Z'),
    ])
    expect(cola.map((x) => x.codigo)).toEqual(['TN-1', 'TN-5', 'TN-3'])
  })
  it('dice la siguiente acción y la antigüedad', () => {
    expect(siguienteAccion('pagado')).toBe('Preparar')
    expect(siguienteAccion('entregado')).toBeNull()
    const ahora = new Date('2026-10-09T12:00:00Z')
    expect(antiguedad('2026-10-09T11:55:00Z', ahora)).toBe('hace 5 min')
    expect(antiguedad('2026-10-09T09:00:00Z', ahora)).toBe('hace 3 h')
    expect(antiguedad('2026-10-08T11:00:00Z', ahora)).toBe('hace 1 día')
    expect(antiguedad('2026-10-01T12:00:00Z', ahora)).toBe('hace 8 días')
  })
})

describe('menú del panel por rol', () => {
  const rutas = (items) => items.map((x) => x.ruta.replace('/administracion/', ''))
  it('admin: 4 entradas principales y el resto en Administración', () => {
    const m = menuDe('admin')
    expect(rutas(m.principal)).toEqual(['inicio', 'pedidos', 'productos', 'gastos'])
    expect(rutas(m.mas)).toEqual(['stock', 'reportes', 'cobros', 'usuarios', 'configuracion'])
  })
  it('encargadas de tienda y de ventas: sin Administración, sin Stock', () => {
    for (const rol of ['enc_tienda', 'enc_ventas']) {
      const m = menuDe(rol)
      expect(rutas(m.principal)).toEqual(['inicio', 'pedidos', 'productos', 'gastos'])
      expect(m.mas).toEqual([])
    }
  })
  it('depósito: Productos y Stock en la barra', () => {
    const m = menuDe('enc_deposito')
    expect(rutas(m.principal)).toEqual(['productos', 'stock'])
    expect(m.mas).toEqual([])
  })
  it('ninguna ruta se pierde: Buscar sigue registrada aunque no esté en el menú', () => {
    expect(PANTALLAS.some((p) => p.ruta === '/administracion/buscar')).toBe(true)
    expect(PANTALLAS.some((p) => p.ruta === '/administracion/stock')).toBe(true)
  })
})

describe('umbral de stock bajo', () => {
  it('un solo valor por defecto y respeta el configurado (incluido 0)', () => {
    expect(umbralStockBajo(undefined)).toBe(UMBRAL_STOCK_BAJO)
    expect(umbralStockBajo({ stock_bajo_unidades: 10 })).toBe(10)
    expect(umbralStockBajo({ stock_bajo_unidades: 0 })).toBe(0)
    expect(umbralStockBajo({ stock_bajo_unidades: 'x' })).toBe(UMBRAL_STOCK_BAJO)
  })
})
