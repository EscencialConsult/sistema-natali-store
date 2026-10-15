import { cn } from '../../lib/cn.js'

/* Botón-píldora seleccionable (filtros, colores). muestra: color CSS opcional. */
export default function Chip({ activo = false, muestra, onClick, children, className }) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-pildora px-4 text-sm font-medium transition-colors',
        activo ? 'bg-tinta text-sobre-tinta' : 'bg-superficie-2 text-texto hover:bg-acento-tinte',
        className,
      )}
    >
      {muestra && <span aria-hidden className="size-4 rounded-full ring-1 ring-black/10" style={{ background: muestra }} />}
      {children}
    </button>
  )
}
