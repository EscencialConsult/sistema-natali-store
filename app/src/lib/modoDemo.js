import { hayBackend } from '../data/supabase.js'

// Solo en desarrollo o con VITE_MODO_DEMO=1 (para mostrarle el sistema a la clienta): habilita los datos de demostración.
// Nunca con servidor: la demo escribe datos inventados que no deben mezclarse con los reales.
export const MODO_DEMO = !hayBackend && (import.meta.env.DEV || import.meta.env.VITE_MODO_DEMO === '1')
