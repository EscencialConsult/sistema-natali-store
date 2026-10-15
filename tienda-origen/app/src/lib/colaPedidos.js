// Cola de trabajo del panel: pedidos abiertos que alguien tiene que mover, sin importar en qué mes se crearon.
// Los pendientes de pago de caja/transferencia se confirman aparte (PagosPorConfirmar); los de Mercado Pago vencen solos.
export const ESTADOS_EN_CURSO = ['pagado', 'en_preparacion', 'listo_retiro', 'enviado']

const SIGUIENTE = {
  pagado: 'Preparar',
  en_preparacion: 'Dejar listo o enviar',
  listo_retiro: 'Entregar al retirar',
  enviado: 'Confirmar entrega',
}

export const siguienteAccion = (estado) => SIGUIENTE[estado] ?? null

// Más viejo primero: lo que lleva más tiempo esperando es lo urgente.
export const ordenarCola = (pedidos) =>
  [...pedidos].filter((p) => ESTADOS_EN_CURSO.includes(p.estado)).sort((a, b) => a.creado_en.localeCompare(b.creado_en))

// "hace 5 min", "hace 3 h", "hace 2 días". El tiempo transcurrido no depende de la zona horaria.
export function antiguedad(fecha, ahora = new Date()) {
  const min = Math.max(0, Math.floor((ahora.getTime() - new Date(fecha).getTime()) / 60000))
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.floor(h / 24)
  return d === 1 ? 'hace 1 día' : `hace ${d} días`
}
