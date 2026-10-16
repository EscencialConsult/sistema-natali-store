import { cn } from '../../lib/cn.js'

/* Control segmentado: la opción elegida es una "tarjeta" blanca sobre un carril tonal.
   Celular: ocupa todo el ancho en partes iguales (nunca scroll horizontal). Escritorio: se ajusta al contenido. */
// `prefijo` + valor da el id de cada pestaña y `item.panel` el id del panel que controla (opcionales).
export default function Tabs({ items, valor, onChange, className, etiqueta = 'Secciones', prefijo }) {
  const teclado = (e, i) => {
    const salto = { ArrowRight: 1, ArrowLeft: -1 }[e.key]
    const destino = e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : salto ? (i + salto + items.length) % items.length : null
    if (destino === null) return
    e.preventDefault()
    onChange(items[destino].valor)
    e.currentTarget.parentElement.children[destino]?.focus()
  }
  return (
    <div role="tablist" aria-label={etiqueta} className={cn('flex w-full gap-1 rounded-control bg-superficie-2 p-1 ring-1 ring-inset ring-borde sm:inline-flex sm:w-auto sm:self-start', className)}>
      {items.map((t, i) => (
        <button
          key={t.valor}
          role="tab"
          type="button"
          id={prefijo ? `${prefijo}${t.valor}` : undefined}
          aria-controls={t.panel}
          aria-selected={t.valor === valor}
          tabIndex={t.valor === valor ? 0 : -1}
          onKeyDown={(e) => teclado(e, i)}
          onClick={() => onChange(t.valor)}
          className={cn(
            'min-h-11 min-w-0 flex-1 rounded-[0.6rem] px-1.5 text-sm font-medium leading-tight transition-[background-color,color,box-shadow] duration-150 sm:flex-none sm:px-4',
            t.valor === valor ? 'bg-superficie text-texto shadow-tarjeta' : 'text-texto-suave hover:text-texto',
          )}
        >
          {t.etiqueta}
        </button>
      ))}
    </div>
  )
}
