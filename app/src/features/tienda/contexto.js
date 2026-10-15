import { createContext, useContext } from 'react'

// Ajustes públicos de la tienda (tipo de cambio, WhatsApp, nombre). Se carga una vez en TiendaApp.
export const AjustesTienda = createContext({ ajustes: null, cargando: true, enCache: false, error: null })
export const useAjustesTienda = () => useContext(AjustesTienda)

// Enlace a WhatsApp: host fijo, teléfono solo dígitos (mínimo de longitud) y mensaje codificado.
export function enlaceWhatsApp(telefono, mensaje = '') {
  const t = String(telefono ?? '').replace(/\D/g, '')
  if (t.length < 8) return null
  return `https://wa.me/${t}${mensaje ? `?text=${encodeURIComponent(mensaje)}` : ''}`
}
