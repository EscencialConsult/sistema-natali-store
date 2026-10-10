import { cn } from '../../lib/cn.js'
import { estadoStock } from '../../lib/stock.js'

const TONO = { agotado: 'text-error', bajo: 'text-alerta', ok: 'text-exito' }

// Color del producto (uno, opcional, informativo) y su stock (del PRODUCTO, en docenas).
// stock: prendas del producto, o null para no mostrarlo (vista pública).
export default function ColorStock({ colores, stock = null, umbral = 24, className }) {
  const color = colores[0]
  const est = stock === null ? null : estadoStock(stock, umbral)
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <span className="flex min-h-11 items-center gap-2.5 rounded-control border border-borde bg-superficie-2/60 py-1.5 pl-2 pr-3.5">
        {color && <span aria-hidden className="size-7 shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.12)]" style={{ background: color.hex }} />}
        <span className="text-sm font-medium">{color ? color.nombre : 'Sin color'}</span>
      </span>
      {est && (
        <span className="flex min-h-11 items-center rounded-control border border-borde bg-superficie px-3.5 text-sm">
          <span className="mr-1.5 text-texto-suave">Stock:</span>
          <span className={cn('font-semibold tabular-nums', TONO[est.clave])}>{est.texto}</span>
        </span>
      )}
    </div>
  )
}
