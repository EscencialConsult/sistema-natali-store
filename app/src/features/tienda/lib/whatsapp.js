// Enlace a WhatsApp: host fijo, teléfono solo dígitos (mínimo de longitud) y mensaje codificado.
export function enlaceWhatsApp(telefono, mensaje = '') {
  const t = String(telefono ?? '').replace(/\D/g, '')
  if (t.length < 8) return null
  return `https://wa.me/${t}${mensaje ? `?text=${encodeURIComponent(mensaje)}` : ''}`
}

export const soloDigitos = (t) => String(t ?? '').replace(/\D/g, '')
