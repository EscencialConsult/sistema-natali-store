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

// Coordenada opcional: acepta número o texto con coma decimal. Devuelve null si no es un número dentro de rango.
const coordenada = (v, max) => {
  if (v === '' || v === null || v === undefined) return null
  const n = Number(String(v).trim().replace(',', '.'))
  return Number.isFinite(n) && Math.abs(n) <= max ? n : null
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
    const hayCoord = [f?.lat, f?.lng].some((c) => c !== '' && c !== null && c !== undefined)
    if (!nombre && !direccion && !indicaciones && !horario && !mapaCrudo && !hayCoord) continue
    if (!nombre) {
      errores.push(`Local ${i + 1}: falta el nombre.`)
      continue
    }
    const mapa = mapaCrudo ? urlMapaSegura(mapaCrudo) : null
    if (mapaCrudo && !mapa) errores.push(`${nombre}: el enlace del mapa tiene que ser de Google Maps (https://maps.app.goo.gl/… o https://www.google.com/maps/…).`)
    const lat = coordenada(f?.lat, 90)
    const lng = coordenada(f?.lng, 180)
    if (hayCoord && (lat === null || lng === null)) errores.push(`${nombre}: la latitud y la longitud tienen que ser dos números válidos (ej. -17.7834 y -63.1821), o dejarse vacías.`)
    const local = { nombre, direccion, indicaciones, horario, mapa: mapa ?? '' }
    // Solo con las dos coordenadas válidas: el mapa de «Quiénes somos» ubica el local con ellas.
    if (lat !== null && lng !== null) Object.assign(local, { lat, lng })
    valor.push(local)
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

// Texto por defecto: solo lo que se sabe del negocio (sin cifras ni años). La administración lo reemplaza desde Ajustes.
export const QUIENES_SOMOS_POR_DEFECTO = [
  'Modas Naty es un negocio de indumentaria femenina por mayor, en Bermejo, Tarija, a pasos de la frontera con Argentina.',
  'Vendemos por docena y media docena: blusas, pantalones, faldas, chalecos, vestidos y más, en talles y colores surtidos.',
  'Atendemos en dos locales y por WhatsApp, con un equipo de ventas que te acompaña desde que elegís hasta que retirás o recibís tu pedido.',
  'Pensamos la tienda para quien revende: ves los modelos con sus fotos y su precio por docena, armás tu pedido a tu ritmo y hablás con una persona real para cerrarlo.',
]

// Cómo se trabaja, en pasos cortos. Es estructura fija de la página, no texto editable.
export const COMO_TRABAJAMOS = [
  { titulo: 'Elegís', texto: 'Recorrés el catálogo, abrís cada modelo y mirás sus fotos y su precio por docena y media docena.' },
  { titulo: 'Armás tu pedido', texto: 'Sumás los modelos que querés y elegís con qué vendedor hablar. Enviar el pedido no lo reserva ni lo cobra.' },
  { titulo: 'Tu vendedor confirma', texto: 'Te escribe por WhatsApp, confirma disponibilidad y precio final y te pasa los datos para transferir.' },
  { titulo: 'Pagás y retirás', texto: 'Transferís o pagás en el local, y retirás por uno de nuestros locales o coordinás la entrega con tu vendedor.' },
]

// Lo que distingue la forma de vender, sin promesas que el negocio no hizo.
export const DIFERENCIALES = [
  { titulo: 'Precio por docena a la vista', texto: 'Cada modelo muestra su precio por docena y por media docena, en dólares, pesos argentinos y bolivianos.' },
  { titulo: 'Surtido pensado para revender', texto: 'La docena y la media docena vienen surtidas en talles y colores. El color no se elige modelo por modelo.' },
  { titulo: 'Una persona del otro lado', texto: 'No hay carrito automático que cobre solo: tu vendedor revisa el pedido y te responde en persona.' },
  { titulo: 'Catálogo siempre al día', texto: 'Los modelos y los precios que ves son los que carga el equipo, con la cotización vigente.' },
]

// Preguntas frecuentes de la ayuda, agrupadas por tema. Son hechos del funcionamiento de la tienda: si cambia, se cambia acá.
// Lo que el negocio no definió (plazos, costos de envío, políticas de cambio) remite al vendedor: no se inventa.
export const TEMAS_AYUDA = [
  { id: 'comprar', titulo: 'Comprar' },
  { id: 'pagos', titulo: 'Pagos y transferencia' },
  { id: 'entrega', titulo: 'Entrega y retiro' },
  { id: 'cambios', titulo: 'Cambios y devoluciones' },
  { id: 'cuenta', titulo: 'Cuenta de transferencia' },
]

export const PREGUNTAS_FRECUENTES = [
  { tema: 'comprar', p: '¿Se vende por unidad?', r: 'No. Se vende por docena o por media docena, y cada una viene surtida en talles y colores.' },
  { tema: 'comprar', p: '¿Puedo elegir el color?', r: 'No. La docena y la media docena vienen surtidas. Si necesitás algo puntual, consultalo con tu vendedor antes de armar el pedido.' },
  { tema: 'comprar', p: '¿Enviar el pedido lo reserva?', r: 'No. Tu vendedor confirma la disponibilidad y el precio final, y recién entonces transferís.' },
  { tema: 'comprar', p: '¿Con quién hablo?', r: 'Elegí un vendedor cuando armás tu pedido, o escribinos por WhatsApp desde Contacto.' },
  { tema: 'comprar', p: '¿Cómo sé si hay stock de un modelo?', r: 'La tienda no muestra el stock: la disponibilidad la confirma tu vendedor cuando recibe tu pedido.' },
  { tema: 'pagos', p: '¿Cómo pago?', r: 'Por transferencia bancaria (los datos de la cuenta están en tu pedido) o en efectivo en el local.' },
  { tema: 'pagos', p: '¿En qué moneda pago?', r: 'Los precios están en dólares y se muestran también en pesos argentinos y en bolivianos, con la cotización del día. La transferencia se hace en pesos argentinos.' },
  { tema: 'pagos', p: '¿Cuándo transfiero?', r: 'Después de que tu vendedor confirme disponibilidad y precio final. Cuando transferís, mandale el comprobante por WhatsApp.' },
  { tema: 'entrega', p: '¿Cómo retiro o recibo mi pedido?', r: 'Pasás por uno de nuestros locales, o coordinás la entrega con tu vendedor.' },
  { tema: 'entrega', p: '¿Hacen envíos? ¿Cuánto tardan y cuánto cuestan?', r: 'Eso se coordina caso por caso. Consultalo con tu vendedor, que te confirma las opciones y los tiempos para tu pedido.' },
  { tema: 'cambios', p: '¿Puedo cambiar o devolver una prenda?', r: 'Las condiciones de cambios y devoluciones las informa tu vendedor al confirmar el pedido. Consultalo con tu vendedor antes de pagar.' },
  { tema: 'cambios', p: '¿Qué hago si algo llega distinto a lo que pedí?', r: 'Escribile a tu vendedor por WhatsApp contándole qué pasó y con una foto, y lo resuelven con vos.' },
  { tema: 'cuenta', p: '¿Dónde veo los datos para transferir?', r: 'En tu pedido, antes de enviarlo. Si todavía no están, pedíselos a tu vendedor.' },
  { tema: 'cuenta', p: '¿Por qué me piden confirmar la cuenta?', r: 'La cuenta de transferencia cambia cada tanto, más o menos cada dos meses. Antes de transferir, confirmá los datos con tu vendedor.' },
]

// Pasos por defecto: salen de lo que pidió la clienta. La administración puede reemplazarlos desde Ajustes.
export const PASOS_POR_DEFECTO = [
  'Mirá el catálogo y abrí el modelo que te gusta.',
  'Elegí la cantidad: se vende por media docena o por docena.',
  'Armá tu pedido y elegí con qué vendedor querés hablar.',
  'Pagá por transferencia (los datos están en tu pedido) o en efectivo en el local.',
  'Pasá por el local o coordiná la entrega con tu vendedor.',
]

/**
 * Enlace "Cómo llegar" de un local: si cargó un enlace de Google Maps (ya validado) se usa ese;
 * si no, una búsqueda de Google Maps con la dirección. Sin dirección ni mapa no hay enlace.
 */
export function enlaceComoLlegar(local) {
  const mapa = local?.mapa ? urlMapaSegura(local.mapa) : null
  if (mapa) return mapa
  const consulta = [local?.direccion].map((t) => cortar(t, 160)).filter(Boolean).join(' ')
  if (!consulta) return null
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(consulta)}`
}

// ── Estado de la tienda: abierta o cerrada al público (modo mantenimiento) ───────────────────────────
export const MENSAJE_CERRADA_POR_DEFECTO = 'Estamos preparando la tienda. Mientras tanto, escribinos por WhatsApp o pasá por el local.'

/** Clave `tienda` de tienda_config: { cerrada, mensaje, actualizado_en }. Sin dato, la tienda está abierta. */
export function validarEstadoTienda(obj) {
  const o = obj && typeof obj === 'object' ? obj : {}
  return {
    valor: { cerrada: o.cerrada === true, mensaje: cortar(o.mensaje, 300), actualizado_en: typeof o.actualizado_en === 'string' ? o.actualizado_en : '' },
    errores: [],
  }
}

// ── Vendedores que ve la clienta ──────────────────────────────────────────────────
/** Los de la vista pública (rol vendedor/a, activos, con teléfono). Si no hay ninguno, la lista manual `contactos` (respaldo). */
export function vendedoresDe(lista, config) {
  const validos = (Array.isArray(lista) ? lista : [])
    .map((v) => ({ nombre: cortar(v?.nombre, 60), telefono: String(v?.telefono ?? '').replace(/\D/g, '') }))
    .filter((v) => v.nombre && v.telefono.length >= 8)
  return validos.length ? validos : validarContactos(config?.contactos).valor
}
