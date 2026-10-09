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
            <span aria-hidden className="size-7 shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.12)]" style={{ background: c.hex }} />
            <span className="flex flex-col text-left leading-tight">
              <span className="text-sm font-medium">{c.nombre}</span>
              {est && <span className={cn('text-xs', TONO[est.clave])}>{est.texto}</span>}
            </span>
          </>
        )
        const base = 'flex min-h-12 items-center gap-2.5 rounded-control border py-1.5 pl-2 pr-3.5 transition-[border-color,box-shadow,background-color] duration-150'
        return (
          <li key={c.id}>
            {onSelect ? (
              <button
                type="button"
                aria-pressed={activo}
                onClick={() => onSelect(c.id)}
                className={cn(base, activo ? 'border-tinta bg-tinte ring-2 ring-tinta/20' : 'border-borde-fuerte bg-superficie hover:border-texto-tenue')}
              >
                {Contenido}
              </button>
            ) : (
              <div className={cn(base, 'border-borde bg-superficie-2/60')}>{Contenido}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
