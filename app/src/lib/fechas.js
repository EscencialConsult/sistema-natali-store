const corta = new Intl.DateTimeFormat('es-BO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
const larga = new Intl.DateTimeFormat('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const soloDia = new Intl.DateTimeFormat('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' })

export const fechaCorta = (iso) => corta.format(new Date(iso))
export const fechaLarga = (iso) => larga.format(new Date(iso))
export const fechaDia = (iso) => soloDia.format(new Date(iso))

export const inicioDelDia = (d = new Date()) => {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
export const finDelDia = (d = new Date()) => {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}
export const esHoy = (iso) => new Date(iso).toDateString() === new Date().toDateString()
