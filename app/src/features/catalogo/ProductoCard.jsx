import { Badge } from '../../components/ui/index.js'
import Foto from './Foto.jsx'
import Precio from './Precio.jsx'

// Tarjeta de la grilla: la foto manda. Foto, etiqueta "Nuevo", código, nombre y precio.
export default function ProductoCard({ producto, onAbrir, mostrarPrecio = true, agotado = false }) {
  return (
    <button type="button" onClick={() => onAbrir(producto)} className="group flex w-full flex-col gap-3 rounded-tarjeta text-left">
      <span className="relative block overflow-hidden rounded-tarjeta bg-superficie shadow-tarjeta ring-1 ring-borde/70 transition-shadow duration-200 group-hover:shadow-elevada">
        <Foto foto={producto.fotos[0]} alt={producto.nombre} className="aspect-[3/4] w-full transition-transform duration-500 ease-salida motion-safe:group-hover:scale-[1.04]" />
        <span className="absolute inset-x-2.5 top-2.5 flex flex-wrap gap-1.5">
          {producto.nuevo && <Badge tono="tinta" className="shadow-boton">Nuevo</Badge>}
          {agotado && <Badge tono="error" className="bg-superficie">Sin stock</Badge>}
        </span>
        <span className="absolute bottom-2.5 left-2.5 rounded-pildora bg-superficie/90 px-2 py-0.5 text-xs font-semibold tabular-nums text-texto shadow-tarjeta backdrop-blur-sm">
          {producto.codigo}
        </span>
      </span>
      <span className="flex flex-col gap-0.5 px-0.5">
        <span className="line-clamp-2 text-[0.9375rem] font-medium leading-snug group-hover:text-tinta">{producto.nombre}</span>
        {mostrarPrecio && <Precio usdCent={producto.precio_docena_usd_cent} className="text-sm" />}
      </span>
    </button>
  )
}
