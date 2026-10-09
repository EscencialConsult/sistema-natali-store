import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn.js'
import { TARJETA } from './estilos.js'

/* Bloque de contenido. titulo/enlace opcionales: arman la cabecera de la tarjeta. */
export default function Tarjeta({ titulo, descripcion, enlace, accion, icono: Icono, as: Comp = 'section', className, cuerpo = 'p-4 sm:p-5', children }) {
  const cabecera = titulo || enlace || accion
  return (
    <Comp className={cn(TARJETA, 'flex flex-col', className)}>
      {cabecera && (
        <div className="flex items-start justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
          <div className="flex min-w-0 items-center gap-3">
            {Icono && (
              <span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-tinte text-tinta">
                <Icono size={18} strokeWidth={1.75} aria-hidden />
              </span>
            )}
            <div className="min-w-0">
              {titulo && <h2 className="text-base sm:text-lg">{titulo}</h2>}
              {descripcion && <p className="text-sm text-texto-suave">{descripcion}</p>}
            </div>
          </div>
          {accion}
          {enlace && (
            <Link to={enlace.a} className="-my-2 inline-flex min-h-11 shrink-0 items-center gap-1 rounded-control px-2 text-sm font-medium text-tinta hover:bg-tinte">
              {enlace.texto} <ArrowRight size={16} strokeWidth={1.75} aria-hidden />
            </Link>
          )}
        </div>
      )}
      <div className={cn(cuerpo, cabecera && 'pt-3 sm:pt-3')}>{children}</div>
    </Comp>
  )
}
