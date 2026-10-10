import { useState } from 'react'
import { ChevronDown, Trash2 } from 'lucide-react'
import { CAMPO, Chip } from '../../../components/ui/index.js'
import { cn } from '../../../lib/cn.js'
import { COLORES_CONOCIDOS, hexDeNombre } from '../../../lib/colores.js'
import { nuevoId } from '../../../lib/id.js'

const VISIBLES = 10

// Un solo color por producto, opcional e informativo (el stock es del producto, no del color).
// color: { id, nombre, hex } | null. Cambiar el color conserva su id (las notas viejas guardan su propia copia del nombre).
export default function ColorEditor({ color, onChange, error }) {
  const [verTodos, setVerTodos] = useState(false)
  const elegir = (nombre, hex = hexDeNombre(nombre)) => onChange({ id: color?.id ?? nuevoId(), nombre, hex })
  const sugeridos = COLORES_CONOCIDOS.filter(([n]) => n.toLowerCase() !== color?.nombre.toLowerCase())

  return (
    <div className="flex flex-col gap-4">
      {color ? (
        <div className="flex items-center gap-2 rounded-control border border-borde bg-superficie p-2">
          <label className="relative size-10 shrink-0 cursor-pointer overflow-hidden rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.12)] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-tinta" style={{ background: color.hex }}>
            <span className="sr-only">Muestra de {color.nombre || 'color'}</span>
            <input type="color" value={color.hex} onChange={(e) => onChange({ ...color, hex: e.target.value })} className="absolute inset-0 cursor-pointer opacity-0" />
          </label>
          <input aria-label="Nombre del color" value={color.nombre} onChange={(e) => onChange({ ...color, nombre: e.target.value })} placeholder="Nombre (ej. Rojo)" className={cn(CAMPO, 'min-w-0 flex-1 border-borde-campo')} />
          <button type="button" aria-label="Quitar el color" onClick={() => onChange(null)} className="flex size-10 shrink-0 items-center justify-center rounded-full text-texto-tenue transition-colors hover:bg-error-fondo hover:text-error">
            <Trash2 size={18} strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => elegir('', '#cccccc')} className="rounded-tarjeta border border-dashed border-borde-fuerte p-4 text-center text-sm text-texto-suave hover:bg-superficie-2">
          Sin color. Elegí uno de los comunes o tocá acá para escribirlo (opcional).
        </button>
      )}
      {error && <p role="alert" className="text-sm text-error">{error}</p>}

      <div className="flex flex-col gap-2 border-t border-borde pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave">Colores comunes</p>
        <div className="flex flex-wrap gap-2">
          {(verTodos ? sugeridos : sugeridos.slice(0, VISIBLES)).map(([n, hex]) => (
            <Chip key={n} muestra={hex} onClick={() => elegir(n, hex)} className="min-h-9 px-3">{n}</Chip>
          ))}
          {sugeridos.length > VISIBLES && (
            <button type="button" aria-expanded={verTodos} onClick={() => setVerTodos(!verTodos)} className="inline-flex min-h-9 items-center gap-1 rounded-pildora px-3 text-sm font-medium text-tinta hover:bg-tinte">
              {verTodos ? 'Ver menos' : `Ver ${sugeridos.length - VISIBLES} más`}
              <ChevronDown size={16} strokeWidth={1.75} aria-hidden className={cn('transition-transform', verTodos && 'rotate-180')} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
