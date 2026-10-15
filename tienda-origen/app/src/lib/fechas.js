// Único lugar donde se formatean y se cortan fechas. Todo en la zona horaria del negocio (Bolivia, UTC-4 sin horario
// de verano), sin importar dónde esté el dispositivo: Facundo trabaja desde Argentina (UTC-3) y "hoy" tiene que ser el
// "hoy" de la tienda, no el del navegador.
export const ZONA = 'America/La_Paz'
const DESFASE_MS = -4 * 60 * 60 * 1000

// hourCycle h23: es-BO muestra "10:30 p. m." por defecto; en la tienda y el ticket la hora va de 00 a 23.
const fmt = (opciones) => new Intl.DateTimeFormat('es-BO', { timeZone: ZONA, hourCycle: 'h23', ...opciones })
const corta = fmt({ day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
const larga = fmt({ day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const soloDia = fmt({ day: '2-digit', month: '2-digit', year: 'numeric' })
const soloHora = fmt({ hour: '2-digit', minute: '2-digit' })
const iso = fmt({ year: 'numeric', month: '2-digit', day: '2-digit' })

export const fechaCorta = (f) => corta.format(new Date(f))
export const fechaLarga = (f) => larga.format(new Date(f))
export const fechaDia = (f) => soloDia.format(new Date(f))
export const horaCorta = (f) => soloHora.format(new Date(f))
// Fecha y hora como van en el ticket: "09/10/2026 14:32".
export const fechaHoraTicket = (f) => `${soloDia.format(new Date(f))} ${soloHora.format(new Date(f))}`

// "2026-10-09" del día en Bolivia para el instante dado (sirve de clave para agrupar por día).
export function diaLaPaz(f = new Date()) {
  const partes = Object.fromEntries(iso.formatToParts(new Date(f)).map((p) => [p.type, p.value]))
  return `${partes.year}-${partes.month}-${partes.day}`
}

// Instante en que empieza (00:00) un día "AAAA-MM-DD" en Bolivia. Como la zona no tiene horario de verano, el desfase es fijo.
export const inicioDeDiaLaPaz = (dia) => new Date(new Date(`${dia}T00:00:00Z`).getTime() - DESFASE_MS)

export const inicioDelDia = (f = new Date()) => inicioDeDiaLaPaz(diaLaPaz(f))
export const finDelDia = (f = new Date()) => new Date(inicioDelDia(f).getTime() + 24 * 60 * 60 * 1000 - 1)
export const esHoy = (f) => diaLaPaz(f) === diaLaPaz()

// Suma días calendario (en Bolivia) a un instante y devuelve el inicio de ese día.
export function sumarDias(f, dias) {
  const d = new Date(inicioDelDia(f).getTime() + dias * 24 * 60 * 60 * 1000)
  return inicioDelDia(d)
}

// Primer día del mes (en Bolivia) del instante dado.
export function inicioDelMes(f = new Date()) {
  const [a, m] = diaLaPaz(f).split('-')
  return inicioDeDiaLaPaz(`${a}-${m}-01`)
}
