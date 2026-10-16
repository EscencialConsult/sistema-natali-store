import { Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { TEXTO_PROBLEMA } from '../../lib/carrito.js'
import Foto from '../catalogo/Foto.jsx'
import PrecioDoble from '../catalogo/PrecioDoble.jsx'
import SelectorCantidad from '../catalogo/tienda/SelectorCantidad.jsx'

// Una línea del carrito: foto, nombre (enlace a la ficha), color, precio, cantidad y quitar. Aviso si tiene problema.
export default function LineaCarrito({ linea, onCantidad, onQuitar }) {
  const { producto, color, cantidad, precio_cent, disponible, problema } = linea
  const sinProducto = problema === 'sin_producto' || problema === 'sin_color'
  return (
    <li className="flex gap-3 border-b border-borde py-4 last:border-b-0">
      <Foto foto={producto?.fotos[0]} alt="" sizes="96px" className="size-24 shrink-0 rounded-tarjeta" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {producto ? (
              <Link to={`/p/${producto.slug}`} className="block truncate font-medium hover:underline">{producto.nombre}</Link>
            ) : (
              <p className="font-medium text-texto-suave">Modelo no disponible</p>
            )}
            {color && (
              <p className="flex items-center gap-1.5 text-sm text-texto-suave">
                <span aria-hidden className="size-3.5 rounded-full border border-borde-fuerte" style={{ background: color.hex }} /> {color.nombre}
              </p>
            )}
          </div>
          <button type="button" onClick={() => onQuitar(linea)} aria-label={`Quitar ${producto?.nombre ?? 'este artículo'}`} className="flex size-11 shrink-0 items-center justify-center rounded-control text-texto-suave hover:bg-superficie-2 hover:text-error">
            <Trash2 size={18} strokeWidth={1.75} aria-hidden />
          </button>
        </div>
        {problema && <p role="status" className="rounded-control bg-alerta-fondo px-3 py-1.5 text-sm text-alerta">{TEXTO_PROBLEMA[problema]}</p>}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {!sinProducto && problema !== 'sin_stock' ? (
            <SelectorCantidad valor={cantidad} onChange={(n) => onCantidad(linea, n)} maximo={Math.max(1, disponible)} etiqueta={`Cantidad de ${producto.nombre}`} />
          ) : (
            <span />
          )}
          <div className="text-right">
            <PrecioDoble bsCent={precio_cent * cantidad} apilado className="items-end" />
            {cantidad > 1 && <span className="block text-xs tabular-nums text-texto-suave">{cantidad} × <PrecioDoble bsCent={precio_cent} claseBs="" clasePesos="" /></span>}
          </div>
        </div>
      </div>
    </li>
  )
}
