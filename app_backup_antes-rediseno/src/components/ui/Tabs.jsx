import { cn } from '../../lib/cn.js'

export default function Tabs({ items, valor, onChange, className }) {
  return (
    <div role="tablist" className={cn('flex gap-1 overflow-x-auto border-b border-borde', className)}>
      {items.map((t) => (
        <button
          key={t.valor}
          role="tab"
          type="button"
          aria-selected={t.valor === valor}
          onClick={() => onChange(t.valor)}
          className={cn(
            'min-h-11 shrink-0 border-b-2 px-4 text-base font-medium',
            t.valor === valor ? 'border-tinta text-texto' : 'border-transparent text-texto-suave hover:text-texto',
          )}
        >
          {t.etiqueta}
        </button>
      ))}
    </div>
  )
}
