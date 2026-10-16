import { describe, expect, it } from 'vitest'
import { codigoPedido, ESTADOS, esquemaPedido, esquemaPedidoKiosco, puedeTransicionar, TRANSICIONES } from './pedido.js'

describe('estados del pedido', () => {
  it('toda transición apunta a un estado existente y los finales no salen', () => {
    for (const [de, lista] of Object.entries(TRANSICIONES)) {
      expect(ESTADOS[de]).toBeDefined()
      for (const a of lista) expect(ESTADOS[a]).toBeDefined()
    }
    expect(TRANSICIONES.cancelado).toEqual([])
    expect(TRANSICIONES.reembolsado).toEqual([])
  })
  it('un pedido pendiente solo se paga o se cancela', () => {
    expect(puedeTransicionar('pendiente_pago', 'pagado')).toBe(true)
    expect(puedeTransicionar('pendiente_pago', 'enviado')).toBe(false)
    expect(puedeTransicionar('entregado', 'pagado')).toBe(false)
  })
  it('código con seis dígitos', () => {
    expect(codigoPedido(7)).toBe('TN-000007')
    expect(codigoPedido(123456)).toBe('TN-123456')
  })
})

describe('esquema del pedido', () => {
  const base = { comprador_nombre: 'Ana', comprador_telefono: '59171234567', items: [{ producto_id: 'p', color_id: 'c', cantidad: 1 }] }
  it('acepta retiro sin dirección y exige dirección para envío', () => {
    expect(esquemaPedido.safeParse(base).success).toBe(true)
    expect(esquemaPedido.safeParse({ ...base, entrega: 'envio' }).success).toBe(false)
    expect(esquemaPedido.safeParse({ ...base, entrega: 'envio', envio_ciudad: 'Bermejo', envio_direccion: 'Calle 1' }).success).toBe(true)
  })
  it('rechaza carrito vacío y teléfono inválido', () => {
    expect(esquemaPedido.safeParse({ ...base, items: [] }).success).toBe(false)
    expect(esquemaPedido.safeParse({ ...base, comprador_telefono: 'abc' }).success).toBe(false)
  })
  it('el kiosco no exige nombre ni teléfono', () => {
    expect(esquemaPedidoKiosco.safeParse({ origen: 'kiosco', items: base.items }).success).toBe(true)
  })
})
