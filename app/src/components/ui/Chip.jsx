import { cn } from '../../lib/cn.js'

/* Botón-píldora seleccionable (filtros, colores). muestra: color CSS opcional. */
export default function Chip({ activo = false, muestra, onClick, children, className }) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-pildora border px-4 text-sm font-medium transition-colors duration-150',
        activo
          ? 'border-tinta bg-tinta text-sobre-tinta shadow-boton'
          : 'border-borde bg-superficie text-texto-suave hover:border-borde-fuerte hover:text-texto',
        className,
      )}
    >
      {muestra && <span aria-hidden className="size-4 rounded-full ring-1 ring-black/10" style={{ background: muestra }} />}
      {children}
    </button>
  )
}
