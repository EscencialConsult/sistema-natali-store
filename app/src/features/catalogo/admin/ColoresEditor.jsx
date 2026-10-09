import { useState } from 'react'
import { ChevronDown, Palette, Plus, Trash2 } from 'lucide-react'
import { Button, CAMPO, Chip } from '../../../components/ui/index.js'
import { cn } from '../../../lib/cn.js'
import { COLORES_CONOCIDOS, hexDeNombre } from '../../../lib/colores.js'
import { nuevoId } from '../../../lib/id.js'

const VISIBLES = 10

// colores: [{ id, nombre, hex, existente, stock_inicial }]. El stock inicial solo se pide para colores nuevos;
// después el stock se mueve desde Inventario (queda el historial).
export default function ColoresEditor({ colores, onChange, error }) {
  const [verTodos, setVerTodos] = useState(false)
  const cambiar = (i, parcial) => onChange(colores.map((c, k) => (k === i ? { ...c, ...parcial } : c)))
  const quitar = (i) => onChange(colores.filter((_, k) => k !== i))
  const agregar = (nombre = '') => onChange([...colores, { id: nuevoId(), nombre, hex: nombre ? hexDeNombre(nombre) : '#cccccc', existente: false, stock_inicial: '' }])
  const usados = new Set(colores.map((c) => c.nombre.toLowerCase()))
  const sugeridos = COLORES_CONOCIDOS.filter(([n]) => !usados.has(n.toLowerCase()))

  return (
    <div className="flex flex-col gap-4">
      {colores.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-tarjeta border border-dashed border-borde-fuerte p-5 text-center">
          <Palette size={22} strokeWidth={1.75} aria-hidden className="text-tinta" />
          <p className="text-sm text-texto-suave">Todavía no hay colores. Agregá uno o elegí de los comunes.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {colores.map((c, i) => (
            <li key={c.id} className="flex items-center gap-2 rounded-control border border-borde bg-superficie p-2">
              <label className="relative size-10 shrink-0 cursor-pointer overflow-hidden rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.12)] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-tinta" style={{ background: c.hex }}>
                <span className="sr-only">Muestra de {c.nombre || 'color'}</span>
                <input type="color" value={c.hex} onChange={(e) => cambiar(i, { hex: e.target.value })} className="absolute inset-0 cursor-pointer opacity-0" />
              </label>
              <input aria-label="Nombre del color" value={c.nombre} onChange={(e) => cambiar(i, { nombre: e.target.value })} placeholder="Nombre (ej. Rojo)" className={cn(CAMPO, 'min-w-0 flex-1 border-borde-campo')} />
              {c.existente ? (
                <span className="hidden shrink-0 px-1 text-xs text-texto-tenue sm:block">Ya cargado</span>
              ) : (
                <div className="relative w-24 shrink-0 sm:w-28">
                  <input aria-label={`Stock inicial de ${c.nombre || 'este color'} en prendas`} inputMode="numeric" value={c.stock_inicial} onChange={(e) => cambiar(i, { stock_inicial: e.target.value.replace(/\D/g, '') })} placeholder="Stock" className={cn(CAMPO, 'border-borde-campo pr-8 text-right tabular-nums')} />
                  <span aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-texto-tenue">u.</span>
                </div>
              )}
              <button type="button" aria-label={`Quitar ${c.nombre || 'color'}`} onClick={() => quitar(i)} className="flex size-10 shrink-0 items-center justify-center rounded-full text-texto-tenue transition-colors hover:bg-error-fondo hover:text-error">
                <Trash2 size={18} strokeWidth={1.75} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p role="alert" className="text-sm text-error">{error}</p>}

      <Button variante="secundario" icono={Plus} onClick={() => agregar()} className="self-start">Agregar color</Button>

      {sugeridos.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-borde pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave">Colores comunes</p>
          <div className="flex flex-wrap gap-2">
            {(verTodos ? sugeridos : sugeridos.slice(0, VISIBLES)).map(([n, hex]) => (
              <Chip key={n} muestra={hex} onClick={() => agregar(n)} className="min-h-9 px-3">{n}</Chip>
            ))}
            {sugeridos.length > VISIBLES && (
              <button type="button" aria-expanded={verTodos} onClick={() => setVerTodos(!verTodos)} className="inline-flex min-h-9 items-center gap-1 rounded-pildora px-3 text-sm font-medium text-tinta hover:bg-tinte">
                {verTodos ? 'Ver menos' : `Ver ${sugeridos.length - VISIBLES} más`}
                <ChevronDown size={16} strokeWidth={1.75} aria-hidden className={cn('transition-transform', verTodos && 'rotate-180')} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
