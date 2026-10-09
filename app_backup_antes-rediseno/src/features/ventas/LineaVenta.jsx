import { useState } from 'react'
import { Minus, Pencil, Plus, Trash2 } from 'lucide-react'
import { aCentavos, formatear } from '../../lib/moneda.js'
import Foto from '../catalogo/Foto.jsx'
import { UNIDADES_POR_DOCENA } from './calculos.js'

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
    <li className="flex flex-col gap-2 rounded-control border border-borde bg-superficie p-3">
      <div className="flex gap-3">
        <Foto foto={producto.fotos[0]} alt="" className="size-16 shrink-0 rounded-tarjeta" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold tabular-nums">{producto.codigo}</p>
          <p className="truncate text-base">{producto.nombre}</p>
          <p className="flex items-center gap-1.5 text-sm text-texto-suave">
            <span aria-hidden className="size-3.5 rounded-full border border-borde-fuerte" style={{ background: color?.hex }} />
            {color?.nombre ?? 'Color'}
          </p>
        </div>
        <button type="button" aria-label={`Quitar ${producto.codigo}`} onClick={onQuitar} className="flex size-11 shrink-0 items-center justify-center rounded-control text-error hover:bg-error-fondo">
          <Trash2 size={18} strokeWidth={1.75} aria-hidden />
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Una docena menos" onClick={() => onCantidad(linea.cantidad - 1)} className="flex size-11 items-center justify-center rounded-control border border-borde-fuerte"><Minus size={18} strokeWidth={1.75} aria-hidden /></button>
          <span className="min-w-14 text-center text-lg tabular-nums" aria-label={`${linea.cantidad} docenas`}>{linea.cantidad} doc.</span>
          <button type="button" aria-label="Una docena más" onClick={() => onCantidad(linea.cantidad + 1)} className="flex size-11 items-center justify-center rounded-control border border-borde-fuerte"><Plus size={18} strokeWidth={1.75} aria-hidden /></button>
        </div>
        <div className="text-right">
          <p className="text-lg font-medium tabular-nums">{formatear(linea.cantidad * precioCent, moneda)}</p>
          <p className="text-xs tabular-nums text-texto-suave">
            {formatear(precioCent, moneda)} c/docena{linea.manualCent !== null && ' · precio modificado'}
          </p>
        </div>
      </div>

      {sinStock && <p role="status" className="rounded-control bg-alerta-fondo p-2 text-sm text-alerta">Stock disponible: {stockColor} prendas. Se vende igual si confirmás.</p>}

      {puedeEditarPrecio && (
        editando ? (
          <div className="flex items-center gap-2">
            <input aria-label="Precio por docena" inputMode="decimal" autoFocus value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={aTexto(precioCent)} className="min-h-11 w-32 rounded-control border border-borde-fuerte px-3 text-base" />
            <button type="button" onClick={confirmarPrecio} className="min-h-11 rounded-control bg-tinta px-3 text-sm font-medium text-sobre-tinta">Aplicar</button>
            <button type="button" onClick={() => setEditando(false)} className="min-h-11 px-2 text-sm text-texto-suave">Cancelar</button>
          </div>
        ) : (
          <button type="button" onClick={() => { setTexto(''); setEditando(true) }} className="inline-flex min-h-11 items-center gap-1.5 self-start text-sm text-texto-suave underline">
            <Pencil size={14} strokeWidth={1.75} aria-hidden /> Cambiar precio de esta línea
          </button>
        )
      )}
    </li>
  )
}
