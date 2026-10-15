// Validación de la configuración editable de la tienda. Se usa al GUARDAR (editor) y al LEER (pantallas públicas):
// aunque alguien escriba algo raro directo en la base, lo que no pasa estas reglas no se muestra.
// Todo se muestra como texto: nunca como HTML.

const cortar = (v, max) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '')
const soloDigitos = (t) => String(t ?? '').replace(/\D/g, '')

export const MAX_CONTACTOS = 12
export const MAX_LOCALES = 6
export const MAX_LINEAS_HORARIO = 8
export const MAX_PASOS = 10

// Enlaces de mapa: solo https, sin credenciales, y solo hosts de Google Maps. Se compara protocolo, host y ruta por separado.
const HOSTS_MAPA = new Set(['maps.app.goo.gl', 'maps.google.com'])
const HOSTS_GOOGLE = new Set(['www.google.com', 'google.com', 'www.google.com.bo', 'google.com.bo', 'www.google.com.ar', 'google.com.ar', 'goo.gl'])

export function urlMapaSegura(entrada) {
  const t = typeof entrada === 'string' ? entrada.trim() : ''
  if (!t || t.length > 500) return null
  let u
  try {
    u = new URL(t)
  } catch {
    return null
  }
  if (u.protocol !== 'https:' || u.username || u.password || u.port) return null
  const host = u.hostname.toLowerCase()
  const ok = HOSTS_MAPA.has(host) || (HOSTS_GOOGLE.has(host) && /^\/maps(\/|$)/i.test(u.pathname))
  return ok ? u.href : null
}

export function validarContactos(filas) {
  const errores = []
  const valor = []
  for (const [i, f] of (Array.isArray(filas) ? filas : []).entries()) {
    const nombre = cortar(f?.nombre, 60)
    const telefono = soloDigitos(f?.telefono)
    if (!nombre && !telefono) continue // fila vacía
    if (!nombre) errores.push(`Contacto ${i + 1}: falta el nombre.`)
    else if (telefono.length < 8 || telefono.length > 15) errores.push(`${nombre}: el teléfono debe tener entre 8 y 15 dígitos, con código de país.`)
    else valor.push({ nombre, telefono })
  }
  if (valor.length > MAX_CONTACTOS) errores.push(`Como máximo ${MAX_CONTACTOS} contactos.`)
  return { valor: valor.slice(0, MAX_CONTACTOS), errores }
}

export function validarTransferencia(obj) {
  const o = obj && typeof obj === 'object' ? obj : {}
  const valor = { banco: cortar(o.banco, 60), titular: cortar(o.titular, 80), cuenta: cortar(o.cuenta, 60), alias: cortar(o.alias, 60), nota: cortar(o.nota, 300) }
  const errores = []
  const hayAlgo = Object.values(valor).some(Boolean)
  if (hayAlgo && !valor.cuenta && !valor.alias) errores.push('Cargá al menos la cuenta o el alias.')
  return { valor: hayAlgo ? valor : null, errores }
}

export function validarLocales(filas) {
  const errores = []
  const valor = []
  for (const [i, f] of (Array.isArray(filas) ? filas : []).entries()) {
    const nombre = cortar(f?.nombre, 60)
    const direccion = cortar(f?.direccion, 160)
    const indicaciones = cortar(f?.indicaciones, 300)
    const mapaCrudo = typeof f?.mapa === 'string' ? f.mapa.trim() : ''
    if (!nombre && !direccion && !indicaciones && !mapaCrudo) continue
    if (!nombre) {
      errores.push(`Local ${i + 1}: falta el nombre.`)
      continue
    }
    const mapa = mapaCrudo ? urlMapaSegura(mapaCrudo) : null
    if (mapaCrudo && !mapa) errores.push(`${nombre}: el enlace del mapa tiene que ser de Google Maps (https://maps.app.goo.gl/… o https://www.google.com/maps/…).`)
    valor.push({ nombre, direccion, indicaciones, mapa: mapa ?? '' })
  }
  if (valor.length > MAX_LOCALES) errores.push(`Como máximo ${MAX_LOCALES} locales.`)
  return { valor: valor.slice(0, MAX_LOCALES), errores }
}

// Texto multilínea → lista de líneas (horarios, pasos de "Cómo comprar").
const lineas = (v, maxLineas, maxLargo) => {
  const bruto = Array.isArray(v) ? v : String(v ?? '').split(/\r?\n/)
  return bruto.map((l) => cortar(String(l), maxLargo)).filter(Boolean)
}

export function validarHorarios(v) {
  const todas = lineas(v, MAX_LINEAS_HORARIO, 80)
  const errores = todas.length > MAX_LINEAS_HORARIO ? [`Como máximo ${MAX_LINEAS_HORARIO} líneas de horario.`] : []
  return { valor: todas.slice(0, MAX_LINEAS_HORARIO), errores }
}

export function validarComoComprar(v) {
  const todas = lineas(v, MAX_PASOS, 200)
  const errores = todas.length > MAX_PASOS ? [`Como máximo ${MAX_PASOS} pasos.`] : []
  return { valor: todas.slice(0, MAX_PASOS), errores }
}

// Pasos por defecto: salen de lo que pidió la clienta. La administración puede reemplazarlos desde Ajustes.
export const PASOS_POR_DEFECTO = [
  'Mirá el catálogo y abrí el modelo que te gusta.',
  'Elegí la cantidad: se vende por media docena o por docena.',
  'Armá tu pedido y elegí con qué vendedor querés hablar.',
  'Pagá por transferencia (los datos están en tu pedido) o en efectivo en el local.',
  'Pasá por el local o coordiná la entrega con tu vendedor.',
]
