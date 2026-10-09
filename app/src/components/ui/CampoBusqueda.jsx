import { Search, X } from 'lucide-react'
import { cn } from '../../lib/cn.js'
import { BUSCADOR } from './estilos.js'

/* Buscador con lupa y botón para borrar. grande: el buscador principal de la pantalla. */
export default function CampoBusqueda({ id, etiqueta, valor, onCambiar, grande = false, className, ...resto }) {
  return (
    <div role="search" className={cn('relative', className)}>
      <label htmlFor={id} className="sr-only">{etiqueta}</label>
      <Search size={grande ? 22 : 20} strokeWidth={1.75} aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-texto-tenue" />
      <input
        id={id}
        type="search"
        autoComplete="off"
        value={valor}
        onChange={(e) => onCambiar(e.target.value)}
        className={cn(BUSCADOR, grande ? 'min-h-14 rounded-tarjeta text-lg' : 'min-h-12')}
        {...resto}
      />
      {valor && (
        <button type="button" aria-label="Borrar búsqueda" onClick={() => onCambiar('')} className="absolute right-1.5 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-texto-suave hover:bg-superficie-2 hover:text-texto">
          <X size={18} strokeWidth={1.75} aria-hidden />
        </button>
      )}
    </div>
  )
}
