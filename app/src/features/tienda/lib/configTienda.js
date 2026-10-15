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

// El alias de la cuenta se cambia cada 2 meses: pasado ese plazo la tienda avisa que se confirme con el vendedor.
export const DIAS_ALIAS_VIGENTE = 60
export const DIAS_AVISO_EN_AJUSTES = 50

export function diasDesde(iso, ahora = Date.now()) {
  const t = typeof iso === 'string' ? Date.parse(iso) : NaN
  return Number.isFinite(t) ? Math.max(0, Math.floor((ahora - t) / 86400000)) : null
}

// Sin datos de fecha, o con más de 60 días, el alias se considera "a confirmar".
export const aliasAConfirmar = (actualizadoEn, ahora = Date.now()) => {
  const d = diasDesde(actualizadoEn, ahora)
  return d === null || d > DIAS_ALIAS_VIGENTE
}

export const formatearCuit = (digitos) => (/^\d{11}$/.test(digitos ?? '') ? `${digitos.slice(0, 2)}-${digitos.slice(2, 10)}-${digitos.slice(10)}` : digitos ?? '')

export function validarTransferencia(obj) {
  const o = obj && typeof obj === 'object' ? obj : {}
  const cbu = soloDigitos(o.cbu)
  const cuit = soloDigitos(o.cuit)
  const errores = []
  if (cbu && cbu.length !== 22) errores.push('El CBU tiene 22 números.')
  if (cuit && cuit.length !== 11) errores.push('El CUIT o CUIL tiene 11 números.')
  const fecha = typeof o.actualizado_en === 'string' && Number.isFinite(Date.parse(o.actualizado_en)) ? new Date(o.actualizado_en).toISOString() : ''
  const valor = {
    banco: cortar(o.banco, 60),
    titular: cortar(o.titular, 80),
    cuit: cuit.length === 11 ? cuit : '',
    cbu: cbu.length === 22 ? cbu : '',
    cuenta: cortar(o.cuenta, 60),
    alias: cortar(o.alias, 60),
    nota: cortar(o.nota, 300),
    actualizado_en: fecha,
  }
  const hayAlgo = Object.entries(valor).some(([k, v]) => k !== 'actualizado_en' && Boolean(v))
  if (hayAlgo && !valor.cbu && !valor.cuenta && !valor.alias) errores.push('Cargá al menos el CBU, la cuenta o el alias.')
  return { valor: hayAlgo ? valor : null, errores }
}

export function validarLocales(filas) {
  const errores = []
  const valor = []
  for (const [i, f] of (Array.isArray(filas) ? filas : []).entries()) {
    const nombre = cortar(f?.nombre, 60)
    const direccion = cortar(f?.direccion, 160)
    const indicaciones = cortar(f?.indicaciones, 300)
    const horario = cortar(f?.horario, 160)
    const mapaCrudo = typeof f?.mapa === 'string' ? f.mapa.trim() : ''
    if (!nombre && !direccion && !indicaciones && !horario && !mapaCrudo) continue
    if (!nombre) {
      errores.push(`Local ${i + 1}: falta el nombre.`)
      continue
    }
    const mapa = mapaCrudo ? urlMapaSegura(mapaCrudo) : null
    if (mapaCrudo && !mapa) errores.push(`${nombre}: el enlace del mapa tiene que ser de Google Maps (https://maps.app.goo.gl/… o https://www.google.com/maps/…).`)
    valor.push({ nombre, direccion, indicaciones, horario, mapa: mapa ?? '' })
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
