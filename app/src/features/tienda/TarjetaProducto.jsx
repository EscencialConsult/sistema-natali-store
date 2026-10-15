import { Link } from 'react-router-dom'
import { supabaseUrl } from './data/clientePublico.js'
import { fotosDe } from './lib/fotos.js'
import { rutaProducto } from './rutas.js'
import PrecioBloque from './PrecioBloque.jsx'

// Tarjeta de la referencia: foto vertical con esquinas redondeadas, "NUEVO" en vino, nombre y precio.
export default function TarjetaProducto({ producto, ajustes }) {
  const foto = fotosDe(producto, supabaseUrl)[0]
  return (
    <li>
      <Link to={rutaProducto(producto.id)} className="flex flex-col gap-2">
        <span className="t-tarjeta-foto relative block aspect-[3/4] overflow-hidden rounded-2xl bg-(--t-beige)/50">
          {foto ? (
            <img src={foto} alt={producto.nombre} loading="lazy" decoding="async" width="600" height="800" className="size-full object-cover" />
          ) : (
            <span className="t-suave flex size-full items-center justify-center text-sm">Sin foto</span>
          )}
        </span>
        <span className="flex flex-col gap-0.5">
          {producto.nuevo && <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-(--t-vino)">Nuevo</span>}
          <span className="line-clamp-2 font-medium leading-snug">{producto.nombre}</span>
          <span className="t-suave text-xs uppercase tracking-wide">{producto.codigo}</span>
        </span>
        <PrecioBloque producto={producto} ajustes={ajustes} compacto />
      </Link>
    </li>
  )
}
