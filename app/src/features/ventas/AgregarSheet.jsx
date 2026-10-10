import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { Button, CAMPO, ErrorState, Sheet, Skeleton } from '../../components/ui/index.js'
import { useConfig, useProducto, useStockDe } from '../../data/hooks.js'
import { formatear } from '../../lib/moneda.js'
import ColorStock from '../catalogo/ColorStock.jsx'
import Foto from '../catalogo/Foto.jsx'
import { normalizarCantidad, PASO_DOCENA, precioDocena, subtotal, textoCantidad, textoDocenas, UNIDADES_POR_DOCENA } from './calculos.js'

function Contenido({ productoId, moneda, onAgregar }) {
  const prod = useProducto(productoId)
  const stock = useStockDe(productoId)
  const cfg = useConfig()
  // Se escribe libre ("1,5"); al salir del campo se ajusta a la media docena más cercana.
  const [texto, setTexto] = useState('1')
  const cantidad = normalizarCantidad(texto.replace(',', '.'))

  if (prod.cargando || cfg.cargando) return <Skeleton className="h-64" />
  if (prod.error || !prod.datos) return <ErrorState mensaje="No pudimos cargar el producto." onReintentar={prod.reintentar} />
  const p = prod.datos
  const precio = precioDocena({ precioUsdCent: p.precio_docena_usd_cent, moneda, tc: cfg.datos.tipo_cambio })
  const disponible = stock.datos ?? 0
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

      <ColorStock colores={p.colores} stock={disponible} umbral={cfg.datos.stock_bajo_unidades} />

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
        </div>
        <p className="text-xs text-texto-suave">Se vende por docena o media docena (de 0,5 en 0,5).</p>
        {pide > disponible && (
          <p role="status" className="rounded-control bg-alerta-fondo p-2 text-sm text-alerta">
            Hay {textoDocenas(disponible, { corto: false })} de este producto. Podés agregarlo igual, pero revisá el stock.
          </p>
        )}
      </section>

      <Button tamano="lg" ancho onClick={() => onAgregar({ productoId: p.id, colorId: p.colores[0]?.id ?? null, cantidad })}>
        {`Agregar · ${formatear(subtotal(cantidad, precio), moneda)}`}
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
