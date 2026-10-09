import { useConfig } from '../data/hooks.js'
import { urlDeImagen } from '../lib/blobUrl.js'

// Logo y nombre del negocio cargados en Ajustes (logo = URL de imagen o null).
export function useMarca() {
  const { datos } = useConfig()
  const nombre = datos?.negocio?.nombre?.trim() || 'Modas Naty'
  return { nombre, logo: urlDeImagen(datos?.logo) }
}
