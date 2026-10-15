import { describe, expect, it } from 'vitest'
import { agregarLinea, cambiarCantidad, carritoVacio, normalizarCarrito, quitarLinea } from './lib/carrito.js'
import { monedasDisponibles, resumirPedido, sinConfirmar } from './lib/pedido.js'
import { armarEnvio, detallePedido, LIMITE_ENLACE } from './lib/mensaje.js'

const AJ = { tipo_cambio_bs: 12, tipo_cambio_ars: 1590, tipo_cambio_es_ejemplo: false }
const prod = (id, codigo, usd, extra = {}) => ({ id, codigo, nombre: `Modelo ${codigo}`, precio_docena_usd_cent: usd, ...extra })

describe('carrito', () => {
  it('un almacenamiento roto, viejo o manipulado da un carrito vacío', () => {
    for (const malo of [null, 'x', 5, {}, { v: 99, lineas: [] }, { v: 1, lineas: 'x' }]) expect(normalizarCarrito(malo)).toEqual(carritoVacio())
  })

  it('descarta líneas inválidas y duplicadas y normaliza cantidades a medias docenas', () => {
    const c = normalizarCarrito({
      v: 1,
      lineas: [
        { id: 'a', codigo: 'A1', nombre: 'A', precioUsdCent: 1000, cantidad: 1.3 },
        { id: 'a', codigo: 'A1', nombre: 'A', precioUsdCent: 1000, cantidad: 5 },
        { id: '', cantidad: 1 },
        { id: 'b', cantidad: 0 },
        { id: 'c', cantidad: -2 },
        { id: 'd', cantidad: 'mucho' },
        { id: 'e', codigo: 'E1', nombre: 'E', precioUsdCent: '99', cantidad: 2 },
        null,
      ],
    })
    expect(c.lineas.map((l) => l.id)).toEqual(['a', 'e'])
    expect(c.lineas[0].cantidad).toBe(1.5)
    expect(c.lineas[1].precioUsdCent).toBeNull()
  })

  it('agregar suma cantidades del mismo modelo y respeta el máximo', () => {
    let c = agregarLinea(carritoVacio(), prod('a', 'A1', 1000), 0.5)
    c = agregarLinea(c, prod('a', 'A1', 1200), 1)
    expect(c.lineas).toHaveLength(1)
    expect(c.lineas[0]).toMatchObject({ cantidad: 1.5, precioUsdCent: 1200 })
    c = agregarLinea(c, prod('a', 'A1', 1200), 5000)
    expect(c.lineas[0].cantidad).toBeLessThanOrEqual(999)
  })

  it('cantidad cero o menos quita la línea; quitar no toca las demás', () => {
    let c = agregarLinea(agregarLinea(carritoVacio(), prod('a', 'A1', 1), 1), prod('b', 'B1', 1), 1)
    expect(cambiarCantidad(c, 'a', 0).lineas.map((l) => l.id)).toEqual(['b'])
    expect(cambiarCantidad(c, 'a', 2).lineas[0].cantidad).toBe(2)
    expect(quitarLinea(c, 'b').lineas.map((l) => l.id)).toEqual(['a'])
    c = cambiarCantidad(c, 'a', 0.2)
    expect(c.lineas.find((l) => l.id === 'a').cantidad).toBe(0.5)
  })
})

describe('resumen del pedido', () => {
  const carrito = () => agregarLinea(agregarLinea(carritoVacio(), prod('a', 'A1', 12000), 1), prod('b', 'B1', 5000), 0.5)

  it('calcula líneas y total con el precio vigente', () => {
    const vigentes = new Map([['a', prod('a', 'A1', 12000)], ['b', prod('b', 'B1', 5000)]])
    const r = resumirPedido({ carrito: carrito(), vigentes, ajustes: AJ, moneda: 'bs' })
    expect(r.lineas.map((l) => l.subtotalCent)).toEqual([144000, 30000])
    expect(r.totalCent).toBe(174000)
    expect(r.hayCambios).toBe(false)
  })

  it('un producto que ya no está deja el total en null (nunca un total que omita productos)', () => {
    const vigentes = new Map([['a', prod('a', 'A1', 12000)]])
    const r = resumirPedido({ carrito: carrito(), vigentes, ajustes: AJ, moneda: 'usd' })
    expect(r.hayNoDisponibles).toBe(true)
    expect(r.totalCent).toBeNull()
    expect(r.lineas[1].estado).toBe('no_disponible')
  })

  it('precio oculto deja el total en "a confirmar", sin ceros', () => {
    const vigentes = new Map([['a', prod('a', 'A1', 12000)], ['b', prod('b', 'B1', null)]])
    const r = resumirPedido({ carrito: carrito(), vigentes, ajustes: AJ, moneda: 'usd' })
    expect(r.totalCent).toBeNull()
    expect(r.lineas[1]).toMatchObject({ estado: 'precio_oculto', subtotalCent: null })
  })

  it('avisa si el precio cambió desde que se agregó', () => {
    const vigentes = new Map([['a', prod('a', 'A1', 13000)], ['b', prod('b', 'B1', 5000)]])
    const r = resumirPedido({ carrito: carrito(), vigentes, ajustes: AJ, moneda: 'usd' })
    expect(r.hayCambios).toBe(true)
    expect(r.lineas[0]).toMatchObject({ cambio: true, docenaCent: 13000 })
    expect(r.totalCent).toBe(13000 + 2500)
  })

  it('moneda sin tasa válida: sin importe en esa moneda', () => {
    const vigentes = new Map([['a', prod('a', 'A1', 12000)], ['b', prod('b', 'B1', 5000)]])
    const r = resumirPedido({ carrito: carrito(), vigentes, ajustes: { ...AJ, tipo_cambio_bs: 0 }, moneda: 'bs' })
    expect(r.totalCent).toBeNull()
    expect(r.lineas[0].estado).toBe('sin_moneda')
  })

  it('sin conexión: cantidades conservadas, precios a confirmar', () => {
    const r = sinConfirmar({ carrito: carrito(), moneda: 'usd' })
    expect(r.totalCent).toBeNull()
    expect(r.lineas.every((l) => l.estado === 'sin_confirmar' && l.subtotalCent === null)).toBe(true)
  })

  it('monedas disponibles según la tasa', () => {
    expect(monedasDisponibles(AJ)).toEqual(['usd', 'ars', 'bs'])
    expect(monedasDisponibles({ ...AJ, tipo_cambio_ars: null })).toEqual(['usd', 'bs'])
    expect(monedasDisponibles({ ...AJ, tipo_cambio_es_ejemplo: true })).toEqual(['usd'])
    expect(monedasDisponibles(null)).toEqual(['usd'])
  })
})

describe('mensaje de WhatsApp', () => {
  const vigentes = new Map([['a', prod('a', 'A1', 12000, { nombre: 'Blusa satín ñandú' })], ['b', prod('b', 'B1', 5000)]])
  const carrito = agregarLinea(agregarLinea(carritoVacio(), vigentes.get('a'), 1), vigentes.get('b'), 0.5)
  const resumen = resumirPedido({ carrito, vigentes, ajustes: AJ, moneda: 'usd' })
  const base = { resumen, vendedor: { nombre: 'Ariel', telefono: '+591 7000-0000' }, pago: 'transferencia', entrega: { tipo: 'retiro', local: 'Local Centro' }, negocio: 'Modas Naty' }

  it('arma un detalle completo, con tildes y sin perder líneas', () => {
    const t = detallePedido(base)
    expect(t).toContain('Hola Ariel')
    expect(t).toContain('• A1 · Blusa satín ñandú: 1 docena — US$ 120,00')
    expect(t).toContain('• B1 · Modelo B1: 0,5 docenas — US$ 25,00')
    expect(t).toContain('Total estimado: US$ 145,00')
    expect(t).toContain('Pago: transferencia')
    expect(t).toContain('Entrega: retiro en el local (Local Centro)')
  })

  it('no incluye modelos que ya no están y no inventa un total', () => {
    const r = resumirPedido({ carrito, vigentes: new Map([['a', vigentes.get('a')]]), ajustes: AJ, moneda: 'usd' })
    const t = detallePedido({ ...base, resumen: r })
    expect(t).not.toContain('B1')
    expect(t).toContain('Total: a confirmar')
  })

  it('un pedido corto sale completo en el enlace', () => {
    const e = armarEnvio({ detalle: detallePedido(base), telefono: '+591 7000-0000', nombre: 'Ariel' })
    expect(e.largo).toBe(false)
    expect(e.enlace.startsWith('https://wa.me/59170000000?text=')).toBe(true)
    expect(decodeURIComponent(e.enlace.split('text=')[1])).toBe(e.detalle)
  })

  it('un pedido largo NO se recorta: sale un mensaje breve y el detalle queda completo para copiar', () => {
    const muchos = Array.from({ length: 40 }, (_, i) => prod(`m${i}`, `M${String(i).padStart(3, '0')}`, 9000))
    const v = new Map(muchos.map((p) => [p.id, p]))
    const c = muchos.reduce((acc, p) => agregarLinea(acc, p, 1), carritoVacio())
    const r = resumirPedido({ carrito: c, vigentes: v, ajustes: AJ, moneda: 'usd' })
    const detalle = detallePedido({ ...base, resumen: r })
    const e = armarEnvio({ detalle, telefono: '59170000000', nombre: 'Ariel' })
    expect(e.largo).toBe(true)
    expect(e.enlace.length).toBeLessThanOrEqual(LIMITE_ENLACE)
    expect(decodeURIComponent(e.enlace.split('text=')[1])).toContain('muchos modelos')
    expect(e.detalle).toBe(detalle)
    for (let i = 0; i < 40; i++) expect(e.detalle).toContain(`M${String(i).padStart(3, '0')}`)
  })

  it('sin teléfono válido no hay enlace', () => {
    expect(armarEnvio({ detalle: 'x', telefono: '12', nombre: '' }).enlace).toBeNull()
    expect(armarEnvio({ detalle: 'x', telefono: null, nombre: '' }).enlace).toBeNull()
  })

  it('recibir en lugar de retirar', () => {
    expect(detallePedido({ ...base, entrega: { tipo: 'recibir' }, pago: 'efectivo' })).toMatch(/Pago: efectivo en el local[\s\S]*Entrega: quiero recibirlo/)
  })
})
