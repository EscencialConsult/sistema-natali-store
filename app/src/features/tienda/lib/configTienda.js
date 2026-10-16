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

// La cuenta de transferencia se cambia cada 2 meses (alias, CBU y titular): pasado ese plazo la tienda avisa que se confirme con el vendedor.
export const DIAS_ALIAS_VIGENTE = 60
export const DIAS_AVISO_EN_AJUSTES = 50

export function diasDesde(iso, ahora = Date.now()) {
  const t = typeof iso === 'string' ? Date.parse(iso) : NaN
  return Number.isFinite(t) ? Math.max(0, Math.floor((ahora - t) / 86400000)) : null
}

// Sin fecha, o con más de 60 días, los datos de la cuenta se consideran "a confirmar".
export const datosAConfirmar = (actualizadoEn, ahora = Date.now()) => {
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
  // Fecha en la que hay que cambiar la cuenta (AAAA-MM-DD). Vacía = sin recordatorio.
  const cambiarCrudo = typeof o.cambiar_el === 'string' ? o.cambiar_el.trim() : ''
  const cambiarEl = esFechaIso(cambiarCrudo) ? cambiarCrudo : ''
  if (cambiarCrudo && !cambiarEl) errores.push('La fecha de cambio de la cuenta no es válida.')
  const fecha = typeof o.actualizado_en === 'string' && Number.isFinite(Date.parse(o.actualizado_en)) ? new Date(o.actualizado_en).toISOString() : ''
  const valor = {
    banco: cortar(o.banco, 60),
    titular: cortar(o.titular, 80),
    cuit: cuit.length === 11 ? cuit : '',
    cbu: cbu.length === 22 ? cbu : '',
    cuenta: cortar(o.cuenta, 60),
    alias: cortar(o.alias, 60),
    nota: cortar(o.nota, 300),
    moneda: MONEDAS_TRANSFERENCIA.includes(o.moneda) ? o.moneda : 'ars',
    cambiar_el: cambiarEl,
    actualizado_en: fecha,
  }
  const hayAlgo = ['banco', 'titular', 'cuit', 'cbu', 'cuenta', 'alias', 'nota'].some((k) => Boolean(valor[k]))
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

export const MONEDAS_TRANSFERENCIA = ['ars', 'bs', 'usd']
export const NOMBRE_MONEDA = { ars: 'pesos argentinos', bs: 'bolivianos', usd: 'dólares' }

/** @param {string} v AAAA-MM-DD, y que exista en el calendario (no 2026-02-31). */
export function esFechaIso(v) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v ?? '')) return false
  const [a, m, d] = v.split('-').map(Number)
  const f = new Date(Date.UTC(a, m - 1, d))
  return f.getUTCFullYear() === a && f.getUTCMonth() === m - 1 && f.getUTCDate() === d
}

// Con fecha de cambio cargada, el aviso empieza esta cantidad de días antes.
export const AVISO_DIAS_ANTES = 7

/**
 * Estado de la cuenta de transferencia, para el aviso de "cambiala ya" (superadmin) y el de "confirmá los datos" (clienta).
 *   sin_datos  nada cargado
 *   vigente    todo en orden
 *   por_vencer falta poco para cambiarla (o hace mucho que no se revisa)
 *   vencida    pasó la fecha de cambio, o pasaron más de 60 días sin actualizarla
 * Si hay fecha de cambio manda esa; si no, se usa la antigüedad de la última carga.
 * @returns {{ estado: 'sin_datos'|'vigente'|'por_vencer'|'vencida', motivo: 'fecha_de_cambio'|'antiguedad'|'sin_fecha'|null, dias: number|null }}
 *   dias: para fecha de cambio, días que faltan (negativo si ya pasó); para antigüedad, días desde la última carga.
 */
export function estadoCuenta(t, ahora = Date.now()) {
  const hayDatos = Boolean(t && (t.titular || t.cbu || t.alias || t.cuenta))
  if (!hayDatos) return { estado: 'sin_datos', motivo: null, dias: null }

  if (t.cambiar_el && esFechaIso(t.cambiar_el)) {
    const [a, m, d] = t.cambiar_el.split('-').map(Number)
    const finDelDia = new Date(a, m - 1, d, 23, 59, 59, 999).getTime()
    const faltan = Math.ceil((finDelDia - ahora) / 86400000) - 1 // 0 = es hoy
    if (ahora > finDelDia) return { estado: 'vencida', motivo: 'fecha_de_cambio', dias: faltan }
    if (faltan <= AVISO_DIAS_ANTES) return { estado: 'por_vencer', motivo: 'fecha_de_cambio', dias: faltan }
    return { estado: 'vigente', motivo: 'fecha_de_cambio', dias: faltan }
  }

  const desde = diasDesde(t.actualizado_en, ahora)
  if (desde === null) return { estado: 'vencida', motivo: 'sin_fecha', dias: null }
  if (desde > DIAS_ALIAS_VIGENTE) return { estado: 'vencida', motivo: 'antiguedad', dias: desde }
  if (desde >= DIAS_AVISO_EN_AJUSTES) return { estado: 'por_vencer', motivo: 'antiguedad', dias: desde }
  return { estado: 'vigente', motivo: 'antiguedad', dias: desde }
}

// "Quiénes somos": uno o varios párrafos, un párrafo por línea.
export const MAX_PARRAFOS = 6
export function validarQuienesSomos(v) {
  const todas = lineas(v, MAX_PARRAFOS, 400)
  const errores = todas.length > MAX_PARRAFOS ? [`Como máximo ${MAX_PARRAFOS} párrafos.`] : []
  return { valor: todas.slice(0, MAX_PARRAFOS), errores }
}

// Texto por defecto: solo lo que se sabe del negocio. La administración lo reemplaza desde Ajustes.
export const QUIENES_SOMOS_POR_DEFECTO = [
  'Modas Naty es un negocio de indumentaria femenina por mayor, en Bermejo, Tarija, a pasos de la frontera con Argentina.',
  'Vendemos por docena y media docena: blusas, pantalones, faldas, chalecos, vestidos y más, en talles y colores surtidos.',
  'Atendemos en dos locales y por WhatsApp, con un equipo de ventas que te acompaña desde que elegís hasta que retirás o recibís tu pedido.',
]

// Preguntas frecuentes de la ayuda. Son hechos del funcionamiento de la tienda: si cambia el funcionamiento, se cambia acá.
export const PREGUNTAS_FRECUENTES = [
  { p: '¿Se vende por unidad?', r: 'No. Se vende por docena o por media docena, y cada una viene surtida en talles y colores.' },
  { p: '¿Cómo pago?', r: 'Por transferencia bancaria (los datos de la cuenta están en tu pedido) o en efectivo en el local.' },
  { p: '¿En qué moneda pago?', r: 'Los precios están en dólares y se muestran también en pesos argentinos y en bolivianos, con la cotización del día. La transferencia se hace en pesos argentinos.' },
  { p: '¿Enviar el pedido lo reserva?', r: 'No. Tu vendedor confirma la disponibilidad y el precio final, y recién entonces transferís.' },
  { p: '¿Cómo retiro o recibo mi pedido?', r: 'Pasás por uno de nuestros locales, o coordinás la entrega con tu vendedor.' },
  { p: '¿Con quién hablo?', r: 'Elegí un vendedor cuando armás tu pedido, o escribinos por WhatsApp desde Contacto.' },
]

// Pasos por defecto: salen de lo que pidió la clienta. La administración puede reemplazarlos desde Ajustes.
export const PASOS_POR_DEFECTO = [
  'Mirá el catálogo y abrí el modelo que te gusta.',
  'Elegí la cantidad: se vende por media docena o por docena.',
  'Armá tu pedido y elegí con qué vendedor querés hablar.',
  'Pagá por transferencia (los datos están en tu pedido) o en efectivo en el local.',
  'Pasá por el local o coordiná la entrega con tu vendedor.',
]
