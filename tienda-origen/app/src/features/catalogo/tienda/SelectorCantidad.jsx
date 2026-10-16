import { Minus, Plus } from 'lucide-react'

// Cantidad con botones grandes (+ / −), limitada al disponible. El número es editable pero nunca sale del rango.
export default function SelectorCantidad({ valor, onChange, maximo = 999, minimo = 1, etiqueta = 'Cantidad', tamano = 'normal' }) {
  const fijar = (n) => onChange(Math.max(minimo, Math.min(maximo, Number.isFinite(n) ? Math.trunc(n) : minimo)))
  const alto = tamano === 'kiosco' ? 'min-h-control-kiosco size-control-kiosco text-kiosco' : 'size-11'
  return (
    <div className="inline-flex items-center rounded-control bg-superficie-2" role="group" aria-label={etiqueta}>
      <button type="button" onClick={() => fijar(valor - 1)} disabled={valor <= minimo} aria-label="Una menos" className={`flex items-center justify-center rounded-l-control disabled:opacity-40 ${alto}`}>
        <Minus size={18} strokeWidth={1.75} aria-hidden />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={minimo}
        max={maximo}
        value={valor}
        onChange={(e) => fijar(Number(e.target.value))}
        aria-label={etiqueta}
        className="w-12 bg-transparent text-center font-medium text-base tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button type="button" onClick={() => fijar(valor + 1)} disabled={valor >= maximo} aria-label="Una más" className={`flex items-center justify-center rounded-r-control disabled:opacity-40 ${alto}`}>
        <Plus size={18} strokeWidth={1.75} aria-hidden />
      </button>
    </div>
  )
}
