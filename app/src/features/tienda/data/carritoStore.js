// El carrito vive en localStorage con clave propia (nunca en las tablas Dexie de Renzo) y se comparte entre pestañas.
import { useSyncExternalStore } from 'react'
import { carritoVacio, normalizarCarrito } from '../lib/carrito.js'

const CLAVE = 'tienda-v1:carrito'
const oyentes = new Set()
let crudoAnterior = null
let instantanea = carritoVacio()

function leerCrudo() {
  try {
    return localStorage.getItem(CLAVE)
  } catch {
    return null
  }
}

function obtener() {
  const crudo = leerCrudo()
  if (crudo !== crudoAnterior) {
    crudoAnterior = crudo
    try {
      instantanea = crudo ? normalizarCarrito(JSON.parse(crudo)) : carritoVacio()
    } catch {
      instantanea = carritoVacio()
    }
  }
  return instantanea
}

export function guardarCarrito(carrito) {
  const limpio = normalizarCarrito(carrito)
  try {
    localStorage.setItem(CLAVE, JSON.stringify(limpio))
  } catch {
    // Sin almacenamiento: queda solo en memoria hasta cerrar la pestaña.
    instantanea = limpio
  }
  for (const f of oyentes) f()
}

function suscribir(f) {
  oyentes.add(f)
  const alCambiar = (e) => {
    if (e.key === CLAVE || e.key === null) f()
  }
  window.addEventListener('storage', alCambiar)
  return () => {
    oyentes.delete(f)
    window.removeEventListener('storage', alCambiar)
  }
}

export function useCarrito() {
  return useSyncExternalStore(suscribir, obtener, carritoVacio)
}
