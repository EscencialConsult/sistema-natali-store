// Recetas de clases compartidas por componentes de ui (constantes, no componentes: separadas para Fast Refresh).
import { cn } from '../../lib/cn.js'

// Un botón primario por pantalla (acento). El secundario es tonal (acento suave), no un recuadro con borde.
export const VARIANTES = {
  primario: 'bg-tinta text-sobre-tinta hover:bg-tinta-hover',
  secundario: 'bg-acento-tinte text-tinta hover:bg-acento-tinte-hover',
  fantasma: 'bg-transparent text-texto hover:bg-superficie-2',
  peligro: 'bg-error text-sobre-tinta hover:opacity-90',
  whatsapp: 'bg-whatsapp text-sobre-tinta hover:opacity-90',
}

// Receta de clases compartida con BotonLink: un enlace que se ve como botón (nunca <Link><button>, que anida interactivos).
export const clasesBoton = ({ variante = 'primario', ancho = false, className } = {}) =>
  cn(
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-5 text-[0.9375rem] font-medium tracking-wide transition-[background-color,transform] duration-150 ease-salida',
    'motion-safe:active:not-disabled:scale-[0.98]',
    'disabled:cursor-not-allowed disabled:opacity-50',
    VARIANTES[variante],
    ancho && 'w-full',
    className,
  )
