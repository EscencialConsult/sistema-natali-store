import { cn } from '../../lib/cn.js'
import { estadoStock } from '../../lib/stock.js'

const TONO = { agotado: 'text-error', bajo: 'text-alerta', ok: 'text-exito' }

// stock: { [color_id]: unidades } o null para ocultarlo (vista pública).
export default function ColoresChips({ colores, stock, umbral = 24, seleccionado, onSelect }) {
  if (colores.length === 0) return <p className="text-sm text-texto-suave">Sin colores cargados.</p>
  return (
    <ul className="flex flex-wrap gap-2">
      {colores.map((c) => {
        const est = stock ? estadoStock(stock[c.id] ?? 0, umbral) : null
        const activo = seleccionado === c.id
        const Contenido = (
          <>
            <span aria-hidden className="size-6 shrink-0 rounded-full border border-borde-fuerte" style={{ background: c.hex }} />
            <span className="flex flex-col text-left leading-tight">
              <span className="text-sm font-medium">{c.nombre}</span>
              {est && <span className={cn('text-xs', TONO[est.clave])}>{est.texto}</span>}
            </span>
          </>
        )
        const base = 'flex min-h-11 items-center gap-2 rounded-control border px-3 py-1.5'
        return (
          <li key={c.id}>
            {onSelect ? (
              <button
                type="button"
                aria-pressed={activo}
                onClick={() => onSelect(c.id)}
                className={cn(base, activo ? 'border-tinta bg-superficie-2' : 'border-borde-fuerte bg-superficie hover:bg-superficie-2')}
              >
                {Contenido}
              </button>
            ) : (
              <div className={cn(base, 'border-borde bg-superficie')}>{Contenido}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
