import { useConfig } from '../data/hooks.js'
import { urlDeImagen } from '../lib/blobUrl.js'

// Logos de fábrica de Modas Naty (app/public/brand). Se usan mientras nadie suba otro logo en Ajustes.
export const IMAGOTIPO = '/brand/imagotipo.png'
export const ISOTIPO = '/brand/isotipo.png'

// Logo y nombre del negocio cargados en Ajustes (logo = URL de imagen o null; sin logo propio se usan los de fábrica).
export function useMarca() {
  const { datos } = useConfig()
  const nombre = datos?.negocio?.nombre?.trim() || 'Modas Naty'
  return { nombre, logo: urlDeImagen(datos?.logo), imagotipo: IMAGOTIPO, isotipo: ISOTIPO }
}
