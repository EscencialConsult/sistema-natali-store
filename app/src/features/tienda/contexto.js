import { createContext, useContext } from 'react'

export { enlaceWhatsApp } from './lib/whatsapp.js'

// Ajustes públicos de la tienda (tipo de cambio, WhatsApp, nombre). Se carga una vez en TiendaApp.
export const AjustesTienda = createContext({ ajustes: null, cargando: true, enCache: false, error: null })
export const useAjustesTienda = () => useContext(AjustesTienda)
