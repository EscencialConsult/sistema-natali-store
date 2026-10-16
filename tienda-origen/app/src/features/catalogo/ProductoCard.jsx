import { Link } from 'react-router-dom'
import { Badge } from '../../components/ui/index.js'
import PrecioDoble from './PrecioDoble.jsx'
import Foto from './Foto.jsx'
import Precio from './Precio.jsx'

// Tarjeta de la grilla: la foto manda. Foto, etiqueta "Nuevo", código, nombre y precio.
// Dos modos: en la tienda es un enlace a /p/:slug con precio minorista en Bs; en el panel es un botón que abre la ficha
// con el precio por docena en USD (lo que usa el sistema de nota).
export default function ProductoCard({ producto, onAbrir, modo = 'panel', mostrarPrecio = true, agotado = false, prioridad = false }) {
  const tienda = modo === 'tienda'
  const contenido = (
    <>
      <span className="relative block overflow-hidden rounded-tarjeta bg-superficie-2">
        {/* alt vacío: el nombre ya está en el texto del enlace; repetirlo duplica el nombre accesible. */}
        <Foto foto={producto.fotos[0]} alt="" prioridad={prioridad} className="aspect-[3/4] w-full" />
        {agotado && <Badge tono="error" className="absolute bottom-2 left-2">Sin stock</Badge>}
      </span>
      <span className="flex flex-col gap-0.5 px-0.5">
        {!tienda && <span className="text-xs font-medium tabular-nums text-texto-suave">{producto.codigo}</span>}
        {producto.nuevo && <span className="text-xs font-semibold uppercase tracking-wider text-tinta">Nuevo</span>}
        <span className="text-base font-medium leading-snug group-hover:underline">{producto.nombre}</span>
        {mostrarPrecio && tienda && Number.isInteger(producto.precio_unidad_bs_cent) && (
          <PrecioDoble bsCent={producto.precio_unidad_bs_cent} className="text-sm" />
        )}
        {mostrarPrecio && !tienda && <Precio usdCent={producto.precio_docena_usd_cent} className="text-sm" />}
      </span>
    </>
  )
  const clase = 'group flex flex-col gap-2 rounded-tarjeta text-left'
  if (tienda) {
    return (
      <Link to={`/p/${producto.slug}`} className={clase}>
        {contenido}
      </Link>
    )
  }
  return (
    <button type="button" onClick={() => onAbrir(producto)} className={clase}>
      {contenido}
    </button>
  )
}
