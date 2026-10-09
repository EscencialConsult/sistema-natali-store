import { cn } from '../../lib/cn.js'
import { TARJETA } from './estilos.js'

const TONOS = {
  tinta: 'bg-tinte text-tinta',
  exito: 'bg-exito-fondo text-exito',
  alerta: 'bg-alerta-fondo text-alerta',
  error: 'bg-error-fondo text-error',
  info: 'bg-info-fondo text-info',
}

/* Cifra destacada (KPI): etiqueta, valor grande y un detalle opcional. */
export default function Dato({ etiqueta, valor, detalle, icono: Icono, tono = 'tinta', className, claseValor }) {
  return (
    <div className={cn(TARJETA, 'flex min-w-0 flex-col gap-3 p-4', className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-medium text-texto-suave">{etiqueta}</p>
        {Icono && (
          <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-[0.6rem]', TONOS[tono])}>
            <Icono size={16} strokeWidth={1.9} aria-hidden />
          </span>
        )}
      </div>
      <p className={cn('truncate font-titulo text-2xl font-semibold tracking-tight tabular-nums sm:text-[1.75rem]', claseValor)}>{valor}</p>
      {detalle && <p className="-mt-2 text-xs text-texto-suave">{detalle}</p>}
    </div>
  )
}
