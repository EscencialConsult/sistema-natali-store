import { Badge } from '../../components/ui/index.js'
import Foto from './Foto.jsx'
import Precio from './Precio.jsx'

// Tarjeta de la grilla: la foto manda. Foto, etiqueta "Nuevo", código, nombre y precio.
export default function ProductoCard({ producto, onAbrir, mostrarPrecio = true, agotado = false }) {
  return (
    <button
      type="button"
      onClick={() => onAbrir(producto)}
      className="group flex flex-col gap-2 rounded-tarjeta text-left"
    >
      <span className="relative block overflow-hidden rounded-tarjeta border border-borde bg-superficie">
        <Foto foto={producto.fotos[0]} alt={producto.nombre} className="aspect-[3/4] w-full" />
        {producto.nuevo && <Badge tono="tinta" className="absolute left-0 top-0 rounded-none rounded-br-tarjeta px-2.5">Nuevo</Badge>}
        {agotado && <Badge tono="error" className="absolute bottom-2 left-2">Sin stock</Badge>}
      </span>
      <span className="flex flex-col gap-0.5 px-0.5">
        <span className="text-xs font-medium tabular-nums text-texto-suave">{producto.codigo}</span>
        <span className="text-base font-medium leading-snug group-hover:underline">{producto.nombre}</span>
        {mostrarPrecio && <Precio usdCent={producto.precio_docena_usd_cent} className="text-sm" />}
      </span>
    </button>
  )
}
