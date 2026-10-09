import { useState } from 'react'
import { Minus, Pencil, Plus, Trash2 } from 'lucide-react'
import { CAMPO } from '../../components/ui/index.js'
import { aCentavos, formatear } from '../../lib/moneda.js'
import Foto from '../catalogo/Foto.jsx'
import { PASO_DOCENA, subtotal, textoCantidad, UNIDADES_POR_DOCENA } from './calculos.js'

const aTexto = (cent) => (cent / 100).toFixed(2).replace('.', ',')

// Una línea de la venta: producto, color, docenas y precio. El precio solo se edita con permiso.
export default function LineaVenta({ linea, producto, precioCent, moneda, stockColor, puedeEditarPrecio, onCantidad, onPrecio, onQuitar }) {
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState('')
  const color = producto?.colores.find((c) => c.id === linea.colorId)
  const sinStock = linea.cantidad * UNIDADES_POR_DOCENA > stockColor

  const confirmarPrecio = () => {
    const n = Number(texto.replace(',', '.'))
    onPrecio(texto.trim() === '' ? null : Number.isFinite(n) && n >= 0 ? aCentavos(n) : linea.manualCent)
    setEditando(false)
  }

  if (!producto) return null
  return (
    <li className="flex flex-col gap-3 rounded-tarjeta border border-borde bg-superficie-2/40 p-3">
      <div className="flex gap-3">
        <Foto foto={producto.fotos[0]} alt="" className="size-16 shrink-0 rounded-control" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold tabular-nums text-tinta">{producto.codigo}</p>
          <p className="truncate text-base font-medium">{producto.nombre}</p>
          <p className="flex items-center gap-1.5 text-sm text-texto-suave">
            <span aria-hidden className="size-3.5 rounded-full border border-borde-fuerte" style={{ background: color?.hex }} />
            {color?.nombre ?? 'Color'}
          </p>
        </div>
        <button type="button" aria-label={`Quitar ${producto.codigo}`} onClick={onQuitar} className="-mr-1 -mt-1 flex size-11 shrink-0 items-center justify-center rounded-full text-texto-tenue hover:bg-error-fondo hover:text-error">
          <Trash2 size={18} strokeWidth={1.75} aria-hidden />
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 rounded-control border border-borde-fuerte bg-superficie p-0.5">
          <button type="button" aria-label="Media docena menos" onClick={() => onCantidad(linea.cantidad - PASO_DOCENA)} disabled={linea.cantidad <= PASO_DOCENA} className="flex size-10 items-center justify-center rounded-[0.6rem] hover:bg-superficie-2 disabled:opacity-40"><Minus size={18} strokeWidth={1.75} aria-hidden /></button>
          <span className="min-w-16 text-center text-base font-medium tabular-nums" aria-label={`${textoCantidad(linea.cantidad)} docenas`}>{textoCantidad(linea.cantidad)} doc.</span>
          <button type="button" aria-label="Media docena más" onClick={() => onCantidad(linea.cantidad + PASO_DOCENA)} className="flex size-10 items-center justify-center rounded-[0.6rem] hover:bg-superficie-2"><Plus size={18} strokeWidth={1.75} aria-hidden /></button>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold tabular-nums">{formatear(subtotal(linea.cantidad, precioCent), moneda)}</p>
          <p className="text-xs tabular-nums text-texto-suave">
            {formatear(precioCent, moneda)} c/docena{linea.manualCent !== null && ' · precio modificado'}
          </p>
        </div>
      </div>

      {sinStock && <p role="status" className="rounded-control bg-alerta-fondo p-2 text-sm text-alerta">Stock disponible: {stockColor} prendas. Se vende igual si confirmás.</p>}

      {puedeEditarPrecio && (
        editando ? (
          <div className="flex items-center gap-1 rounded-control border border-borde-fuerte bg-superficie p-0.5">
            <input aria-label="Precio por docena" inputMode="decimal" autoFocus value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={aTexto(precioCent)} className={`${CAMPO} w-32 border-borde-campo`} />
            <button type="button" onClick={confirmarPrecio} className="min-h-11 rounded-control bg-tinta px-4 text-sm font-medium text-sobre-tinta hover:bg-tinta-hover">Aplicar</button>
            <button type="button" onClick={() => setEditando(false)} className="min-h-11 px-2 text-sm text-texto-suave">Cancelar</button>
          </div>
        ) : (
          <button type="button" onClick={() => { setTexto(''); setEditando(true) }} className="-ml-2 inline-flex min-h-11 items-center gap-1.5 self-start rounded-control px-2 text-sm font-medium text-tinta hover:bg-tinte">
            <Pencil size={14} strokeWidth={1.75} aria-hidden /> Cambiar precio de esta línea
          </button>
        )
      )}
    </li>
  )
}
