import { ChevronRight } from 'lucide-react'
import { FILA } from '../../components/ui/index.js'
import Foto from './Foto.jsx'
import Precio from './Precio.jsx'

export default function FilaResultado({ producto, onAbrir, mostrarPrecio = true }) {
  return (
    <button type="button" onClick={() => onAbrir(producto)} className={`group min-h-[4.75rem] ${FILA}`}>
      <Foto foto={producto.fotos[0]} alt="" className="size-16 shrink-0 rounded-control" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-xs font-semibold tabular-nums text-tinta">{producto.codigo}</span>
        <span className="truncate text-base font-medium">{producto.nombre}</span>
        {mostrarPrecio && <Precio usdCent={producto.precio_docena_usd_cent} className="text-sm" />}
      </span>
      <ChevronRight size={18} strokeWidth={1.75} aria-hidden className="mr-1 shrink-0 text-texto-tenue transition-colors group-hover:text-tinta" />
    </button>
  )
}
