import Foto from './Foto.jsx'
import Precio from './Precio.jsx'

export default function FilaResultado({ producto, onAbrir, mostrarPrecio = true }) {
  return (
    <button
      type="button"
      onClick={() => onAbrir(producto)}
      className="flex min-h-[4.5rem] w-full items-center gap-3 rounded-control border border-borde bg-superficie p-2 text-left hover:bg-superficie-2"
    >
      <Foto foto={producto.fotos[0]} alt="" className="size-16 shrink-0 rounded-tarjeta" />
      <span className="flex min-w-0 flex-col">
        <span className="text-sm font-semibold tabular-nums">{producto.codigo}</span>
        <span className="truncate text-base">{producto.nombre}</span>
        {mostrarPrecio && <Precio usdCent={producto.precio_docena_usd_cent} className="text-sm" />}
      </span>
    </button>
  )
}
