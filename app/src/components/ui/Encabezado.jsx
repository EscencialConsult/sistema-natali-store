import { ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn.js'

/* Cabecera de pantalla: volver (opcional), antetítulo, título, bajada y acciones a la derecha. */
export default function Encabezado({ titulo, antetitulo, descripcion, volver, acciones, className }) {
  return (
    <header className={cn('flex flex-col gap-3', className)}>
      {volver && (
        <Link to={volver.a} className="-ml-2 inline-flex min-h-11 items-center gap-1 self-start rounded-control px-2 text-sm font-medium text-texto-suave hover:bg-superficie-2 hover:text-texto">
          <ChevronLeft size={18} strokeWidth={1.75} aria-hidden /> {volver.texto}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          {antetitulo && <p className="mb-1 text-sm font-medium text-texto-suave first-letter:uppercase">{antetitulo}</p>}
          <h1 className="text-[1.75rem] leading-tight tracking-tight md:text-[2rem]">{titulo}</h1>
          {descripcion && <p className="mt-1 max-w-2xl text-texto-suave">{descripcion}</p>}
        </div>
        {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
      </div>
    </header>
  )
}
