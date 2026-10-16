import { cn } from '../../lib/cn.js'
import { disponibilidad, estadoStock } from '../../lib/stock.js'

const TONO = { agotado: 'text-error', bajo: 'text-alerta', ok: 'text-exito' }

// stock: { [color_id]: unidades } o null para ocultarlo. publico: muestra "Disponible / Quedan N / Sin stock" en vez de unidades.
export default function ColoresChips({ colores, stock, umbral = 24, seleccionado, onSelect, publico = false }) {
  if (colores.length === 0) return <p className="text-sm text-texto-suave">Sin colores cargados.</p>
  return (
    <ul className="flex flex-wrap gap-2">
      {colores.map((c) => {
        const est = stock ? (publico ? disponibilidad(stock[c.id] ?? 0, umbral) : estadoStock(stock[c.id] ?? 0, umbral)) : null
        const activo = seleccionado === c.id
        const agotado = publico && est?.clave === 'agotado'
        const Contenido = (
          <>
            <span aria-hidden className="size-6 shrink-0 rounded-full ring-1 ring-black/10" style={{ background: c.hex }} />
            <span className="flex flex-col text-left leading-tight">
              <span className="text-sm font-medium">{c.nombre}</span>
              {est && <span className={cn('text-xs', TONO[est.clave])}>{est.texto}</span>}
            </span>
          </>
        )
        const base = 'flex min-h-11 items-center gap-2 rounded-control px-3 py-1.5'
        return (
          <li key={c.id}>
            {onSelect ? (
              <button
                type="button"
                aria-pressed={activo}
                aria-disabled={agotado || undefined}
                onClick={() => !agotado && onSelect(c.id)}
                className={cn(base, activo ? 'bg-superficie ring-2 ring-tinta' : 'bg-superficie-2 hover:bg-acento-tinte', agotado && 'cursor-not-allowed opacity-60')}
              >
                {Contenido}
              </button>
            ) : (
              <div className={cn(base, 'bg-superficie-2')}>{Contenido}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
