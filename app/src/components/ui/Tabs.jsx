import { cn } from '../../lib/cn.js'

/* Control segmentado: la opción elegida es una "tarjeta" blanca sobre un carril tonal.
   Celular: ocupa todo el ancho en partes iguales (nunca scroll horizontal). Escritorio: se ajusta al contenido. */
export default function Tabs({ items, valor, onChange, className }) {
  return (
    <div role="tablist" className={cn('flex w-full gap-1 rounded-control bg-superficie-2 p-1 ring-1 ring-inset ring-borde sm:inline-flex sm:w-auto sm:self-start', className)}>
      {items.map((t) => (
        <button
          key={t.valor}
          role="tab"
          type="button"
          aria-selected={t.valor === valor}
          onClick={() => onChange(t.valor)}
          className={cn(
            'min-h-10 min-w-0 flex-1 rounded-[0.6rem] px-1.5 text-sm font-medium leading-tight transition-[background-color,color,box-shadow] duration-150 sm:flex-none sm:px-4',
            t.valor === valor ? 'bg-superficie text-texto shadow-tarjeta' : 'text-texto-suave hover:text-texto',
          )}
        >
          {t.etiqueta}
        </button>
      ))}
    </div>
  )
}
