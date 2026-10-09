import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { Button, CAMPO, ErrorState, Sheet, Skeleton } from '../../components/ui/index.js'
import { useConfig, useProducto, useStockPorColor } from '../../data/hooks.js'
import { formatear } from '../../lib/moneda.js'
import ColoresChips from '../catalogo/ColoresChips.jsx'
import Foto from '../catalogo/Foto.jsx'
import { normalizarCantidad, PASO_DOCENA, precioDocena, subtotal, textoCantidad, UNIDADES_POR_DOCENA } from './calculos.js'

function Contenido({ productoId, moneda, onAgregar }) {
  const prod = useProducto(productoId)
  const stock = useStockPorColor(productoId)
  const cfg = useConfig()
  const [colorId, setColorId] = useState(null)
  // Se escribe libre ("1,5"); al salir del campo se ajusta a la media docena más cercana.
  const [texto, setTexto] = useState('1')
  const cantidad = normalizarCantidad(texto.replace(',', '.'))

  if (prod.cargando || cfg.cargando) return <Skeleton className="h-64" />
  if (prod.error || !prod.datos) return <ErrorState mensaje="No pudimos cargar el producto." onReintentar={prod.reintentar} />
  const p = prod.datos
  const precio = precioDocena({ precioUsdCent: p.precio_docena_usd_cent, moneda, tc: cfg.datos.tipo_cambio })
  const disponible = colorId ? (stock.datos?.[colorId] ?? 0) : null
  const pide = cantidad * UNIDADES_POR_DOCENA
  const cambiar = (n) => setTexto(textoCantidad(normalizarCantidad(n)))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Foto foto={p.fotos[0]} alt="" className="size-20 shrink-0 rounded-control" />
        <div className="min-w-0">
          <p className="text-xs font-semibold tabular-nums text-tinta">{p.codigo}</p>
          <p className="text-base font-medium leading-snug">{p.nombre}</p>
          <p className="text-sm tabular-nums text-texto-suave">{formatear(precio, moneda)} por docena</p>
        </div>
      </div>

      <section aria-label="Elegí el color" className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-texto-suave">Color</h3>
        <ColoresChips colores={p.colores} stock={stock.datos ?? {}} seleccionado={colorId} onSelect={setColorId} />
      </section>

      <section aria-label="Cantidad" className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-texto-suave">Docenas</h3>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" aria-label="Media docena menos" disabled={cantidad <= PASO_DOCENA} onClick={() => cambiar(cantidad - PASO_DOCENA)} className="flex size-12 items-center justify-center rounded-control border border-borde-fuerte bg-superficie hover:bg-superficie-2 disabled:opacity-40"><Minus size={20} strokeWidth={1.75} aria-hidden /></button>
          <input
            aria-label="Cantidad de docenas"
            inputMode="decimal"
            value={texto}
            onChange={(e) => setTexto(e.target.value.replace(/[^\d.,]/g, ''))}
            onBlur={() => cambiar(cantidad)}
            className={`${CAMPO} h-12 w-24 border-borde-campo text-center text-xl tabular-nums`}
          />
          <button type="button" aria-label="Media docena más" onClick={() => cambiar(cantidad + PASO_DOCENA)} className="flex size-12 items-center justify-center rounded-control border border-borde-fuerte bg-superficie hover:bg-superficie-2"><Plus size={20} strokeWidth={1.75} aria-hidden /></button>
          <span className="text-sm text-texto-suave">= {pide} prendas</span>
        </div>
        <p className="text-xs text-texto-suave">Se vende por docena o media docena (de 0,5 en 0,5).</p>
        {colorId && pide > disponible && (
          <p role="status" className="rounded-control bg-alerta-fondo p-2 text-sm text-alerta">
            Hay {disponible} prendas de este color. Podés agregarlo igual, pero revisá el stock.
          </p>
        )}
      </section>

      <Button tamano="lg" ancho deshabilitado={!colorId} onClick={() => onAgregar({ productoId: p.id, colorId, cantidad })}>
        {colorId ? `Agregar · ${formatear(subtotal(cantidad, precio), moneda)}` : 'Elegí un color'}
      </Button>
    </div>
  )
}

export default function AgregarSheet({ productoId, moneda, onCerrar, onAgregar }) {
  return (
    <Sheet abierto={!!productoId} onCerrar={onCerrar} titulo="Agregar a la venta">
      {productoId && <Contenido key={productoId} productoId={productoId} moneda={moneda} onAgregar={onAgregar} />}
    </Sheet>
  )
}
