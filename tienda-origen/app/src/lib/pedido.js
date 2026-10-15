// Estados del pedido y sus transiciones válidas. Una sola tabla: la usan los repositorios locales y, en la etapa 4,
// se compara con la de la base (tienda_cambiar_estado) en una prueba. Ver docs/04-arquitectura.md.
import { z } from 'zod'

export const ESTADOS = {
  pendiente_pago: { etiqueta: 'Pendiente de pago', tono: 'alerta' },
  pagado: { etiqueta: 'Pagado', tono: 'exito' },
  en_preparacion: { etiqueta: 'En preparación', tono: 'info' },
  listo_retiro: { etiqueta: 'Listo para retirar', tono: 'info' },
  enviado: { etiqueta: 'Enviado', tono: 'info' },
  entregado: { etiqueta: 'Entregado', tono: 'exito' },
  cancelado: { etiqueta: 'Cancelado', tono: 'error' },
  reembolsado: { etiqueta: 'Reembolsado', tono: 'error' },
}

export const TRANSICIONES = {
  pendiente_pago: ['pagado', 'cancelado'],
  pagado: ['en_preparacion', 'listo_retiro', 'enviado', 'entregado', 'reembolsado'],
  en_preparacion: ['listo_retiro', 'enviado', 'entregado', 'reembolsado'],
  listo_retiro: ['entregado', 'reembolsado'],
  enviado: ['entregado', 'reembolsado'],
  entregado: ['reembolsado'],
  cancelado: [],
  reembolsado: [],
}

export const puedeTransicionar = (de, a) => (TRANSICIONES[de] ?? []).includes(a)

export const ORIGENES = ['web', 'kiosco']
export const ENTREGAS = ['retiro', 'envio']
export const PROVEEDORES_PAGO = ['mercadopago', 'caja', 'transferencia']

// Reserva de stock según cómo se va a pagar (ver docs/07, supuestos).
export const RESERVA_MIN = { mercadopago: 30, transferencia: 24 * 60, caja: 12 * 60 }

export const esquemaItem = z.object({
  producto_id: z.string().min(1),
  color_id: z.string().min(1),
  cantidad: z.number().int().min(1, 'La cantidad mínima es 1.').max(999),
})

const telefono = z.string().trim().regex(/^\+?\d{7,15}$/, 'El teléfono parece incompleto (solo números, con código de país si es de otro país).')

const base = z.object({
  id: z.string().uuid().optional(),
  origen: z.enum(ORIGENES).default('web'),
  comprador_nombre: z.string().trim().min(2, 'Decinos tu nombre.').max(80),
  comprador_telefono: telefono,
  comprador_correo: z.string().trim().email('El correo no parece válido.').or(z.literal('')).default(''),
  entrega: z.enum(ENTREGAS).default('retiro'),
  envio_ciudad: z.string().trim().default(''),
  envio_direccion: z.string().trim().default(''),
  envio_costo_cent: z.number().int().min(0).default(0),
  nota: z.string().trim().max(300).default(''),
  // Sin moneda explícita la decide el medio de pago (ver normalizarMoneda).
  moneda: z.enum(['bs', 'ars']).optional(),
  tipo_cambio: z.number().positive().default(1),
  // Versión de la conversión que se le mostró. Si la administración la cambió mientras tanto, el servidor lo avisa.
  cambio_visto: z.number().int().nonnegative().optional(),
  proveedor_pago: z.enum(PROVEEDORES_PAGO).default('mercadopago'),
  dispositivo_kiosco_id: z.string().uuid().nullable().optional(),
  items: z.array(esquemaItem).min(1, 'El carrito está vacío.'),
})

const conEnvioCompleto = (p) => p.entrega === 'retiro' || (p.envio_ciudad && p.envio_direccion)
const envioIncompleto = { message: 'Para el envío hace falta ciudad y dirección.', path: ['envio_direccion'] }

// El pago en línea y la transferencia son en pesos argentinos; el efectivo puede ser en Bs o en pesos.
const EN_PESOS = ['mercadopago', 'transferencia']
const normalizarMoneda = (d) => ({ ...d, moneda: d.moneda ?? (EN_PESOS.includes(d.proveedor_pago) ? 'ars' : 'bs') })
const monedaDelMedio = { message: 'El pago en línea y la transferencia son en pesos argentinos.', path: ['moneda'] }
const respetaMedio = (d) => !EN_PESOS.includes(d.proveedor_pago) || d.moneda === undefined || d.moneda === 'ars'

export const esquemaPedido = base.refine(conEnvioCompleto, envioIncompleto).refine(respetaMedio, monedaDelMedio).transform(normalizarMoneda)

// El kiosco no pide datos: nombre y teléfono son opcionales ahí, y siempre es retiro.
export const esquemaPedidoKiosco = base.extend({
  origen: z.literal('kiosco'),
  comprador_nombre: z.string().trim().max(80).default(''),
  comprador_telefono: z.string().trim().max(20).default(''),
  entrega: z.literal('retiro').default('retiro'),
})
  .refine(respetaMedio, monedaDelMedio)
  .transform(normalizarMoneda)

// Código visible del pedido: TN-000123.
export const codigoPedido = (n) => `TN-${String(n).padStart(6, '0')}`

export const totalItems = (items) => items.reduce((t, i) => t + i.subtotal_cent, 0)
