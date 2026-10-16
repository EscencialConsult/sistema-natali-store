// Mensaje de pedido para WhatsApp. Nunca se recorta en silencio: si no entra en el enlace, se manda un mensaje breve
// claramente identificado y la persona copia el detalle completo.
import { formatear } from '../../../lib/moneda.js'
import { textoCantidad } from '../../../lib/docenas.js'
import { enlaceWhatsApp } from './whatsapp.js'

export const LIMITE_ENLACE = 1800

const unidad = (c) => `${textoCantidad(c)} ${c === 1 ? 'docena' : 'docenas'}`

export function detallePedido({ resumen, vendedor, pago, entrega, negocio = 'Modas Naty' }) {
  const L = [`Hola${vendedor?.nombre ? ` ${vendedor.nombre}` : ''}, quiero hacer este pedido en ${negocio}:`, '']
  for (const l of resumen.lineas) {
    if (l.estado === 'no_disponible') continue
    const precio = l.subtotalCent !== null ? `— ${formatear(l.subtotalCent, resumen.moneda)}` : '— precio a confirmar'
    L.push(`• ${l.codigo} · ${l.nombre}: ${unidad(l.cantidad)} ${precio}`)
  }
  L.push('')
  L.push(resumen.totalCent !== null ? `Total estimado: ${formatear(resumen.totalCent, resumen.moneda)}` : 'Total: a confirmar')
  L.push(`Pago: ${pago === 'transferencia' ? 'transferencia' : 'efectivo en el local'}`)
  if (entrega?.tipo === 'retiro') L.push(`Entrega: retiro en el local${entrega.local ? ` (${entrega.local})` : ''}`)
  else L.push('Entrega: quiero recibirlo, coordinamos')
  L.push('', 'Confirmame disponibilidad y precio final, por favor.')
  return L.join('\n')
}

/** @returns {{ enlace: string|null, largo: boolean, detalle: string }} */
export function armarEnvio({ detalle, telefono, nombre }) {
  const completo = enlaceWhatsApp(telefono, detalle)
  if (completo && completo.length <= LIMITE_ENLACE) return { enlace: completo, largo: false, detalle }
  if (!completo) return { enlace: null, largo: false, detalle }
  const breve = `Hola${nombre ? ` ${nombre}` : ''}, te quiero hacer un pedido con muchos modelos. Te paso el detalle completo en el próximo mensaje.`
  return { enlace: enlaceWhatsApp(telefono, breve), largo: true, detalle }
}
