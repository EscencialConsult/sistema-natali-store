// Enlaces a WhatsApp con mensaje prearmado. El número viene de config.whatsapp_tienda (solo dígitos, con código de país).
export const soloDigitos = (t) => String(t ?? '').replace(/\D/g, '')

export function urlWhatsApp(telefono, mensaje = '') {
  const tel = soloDigitos(telefono)
  if (!tel) return null
  const q = mensaje ? `?text=${encodeURIComponent(mensaje)}` : ''
  return `https://wa.me/${tel}${q}`
}

export const mensajeConsulta = (producto, color) =>
  producto ? `Hola, consulto por ${producto.codigo} ${producto.nombre}${color ? ` (color ${color})` : ''}.` : 'Hola, quiero hacer una consulta.'

export const mensajePedido = (codigo) => `Hola, consulto por mi pedido ${codigo}.`

// "+591 7123-4567" para mostrar; el enlace usa los dígitos.
export function telefonoLegible(telefono) {
  const d = soloDigitos(telefono)
  if (!d) return ''
  if (d.startsWith('591') && d.length === 11) return `+591 ${d.slice(3, 4)} ${d.slice(4, 7)} ${d.slice(7)}`
  return `+${d}`
}
