import { useSyncExternalStore } from 'react'
import { clasificar } from './errores.js'

// Salud de la sincronización, a la vista de la persona. Antes un fallo al bajar los datos se tragaba en silencio y el sistema
// quedaba «sin actualizar» sin que nadie lo supiera. Se guarda en el dispositivo para que sobreviva a cerrar la app.
//   ok_en  última vez que se envió y bajó todo bien
//   fallo  { tipo: 'sesion'|'red'|'rechazo', texto, desde } mientras algo siga fallando
const CLAVE = 'one.sync'

function leer() {
  try {
    const v = JSON.parse(localStorage.getItem(CLAVE) ?? 'null')
    return { ok_en: v?.ok_en ?? null, fallo: v?.fallo ?? null }
  } catch {
    return { ok_en: null, fallo: null }
  }
}

let estado = leer()
const oyentes = new Set()
const poner = (nuevo) => {
  if (nuevo.ok_en === estado.ok_en && nuevo.fallo?.tipo === estado.fallo?.tipo && nuevo.fallo?.texto === estado.fallo?.texto && nuevo.fallo?.desde === estado.fallo?.desde) return
  estado = nuevo
  try {
    localStorage.setItem(CLAVE, JSON.stringify(nuevo))
  } catch {
    /* sin almacenamiento: queda solo en memoria */
  }
  oyentes.forEach((o) => o())
}

export const registrarExito = (ahora = new Date()) => poner({ ok_en: ahora.toISOString(), fallo: null })

export function registrarFallo(error, ahora = new Date()) {
  const texto = String(error?.message ?? error).slice(0, 300)
  poner({ ...estado, fallo: { tipo: clasificar(error), texto, desde: estado.fallo?.desde ?? ahora.toISOString() } })
}

export const estadoSync = () => estado
const suscribir = (o) => {
  oyentes.add(o)
  return () => oyentes.delete(o)
}
export const useEstadoSync = () => useSyncExternalStore(suscribir, estadoSync, estadoSync)
