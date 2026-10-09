import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '../../lib/cn.js'

/* Lista corta (hasta ~10 opciones). Para listas largas usar BuscadorLista. */
// Sin `etiqueta` visible hay que pasar `ariaLabel`: un combobox no toma su nombre del texto que muestra.
export default function Select({ etiqueta, ariaLabel, opciones, valor, onChange, placeholder = 'Elegir', deshabilitado, className }) {
  const id = useId()
  const [abierto, setAbierto] = useState(false)
  const [activo, setActivo] = useState(0)
  const raiz = useRef(null)
  const seleccionada = opciones.find((o) => o.valor === valor)

  useEffect(() => {
    if (!abierto) return
    const fuera = (e) => raiz.current && !raiz.current.contains(e.target) && setAbierto(false)
    document.addEventListener('pointerdown', fuera)
    return () => document.removeEventListener('pointerdown', fuera)
  }, [abierto])

  const abrir = () => {
    setActivo(Math.max(0, opciones.findIndex((o) => o.valor === valor)))
    setAbierto(true)
  }
  const elegir = (o) => {
    onChange(o.valor)
    setAbierto(false)
  }
  const teclas = (e) => {
    if (e.key === 'Escape') return setAbierto(false)
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (abierto) setActivo((i) => Math.min(i + 1, opciones.length - 1))
      else abrir()
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActivo((i) => Math.max(i - 1, 0))
    }
    if ((e.key === 'Enter' || e.key === ' ') && abierto) {
      e.preventDefault()
      elegir(opciones[activo])
    }
  }

  return (
    <div ref={raiz} className={cn('relative flex flex-col gap-1.5', className)}>
      {etiqueta && <span id={`${id}-et`} className="text-sm font-medium">{etiqueta}</span>}
      <button
        type="button"
        role="combobox"
        aria-expanded={abierto}
        aria-controls={`${id}-lista`}
        aria-labelledby={etiqueta ? `${id}-et` : undefined}
        aria-label={etiqueta ? undefined : ariaLabel}
        disabled={deshabilitado}
        onClick={() => (abierto ? setAbierto(false) : abrir())}
        onKeyDown={teclas}
        className="flex min-h-11 w-full items-center justify-between gap-2 rounded-control border border-borde-fuerte bg-superficie px-3 text-left text-base disabled:opacity-50"
      >
        <span className={seleccionada ? '' : 'text-texto-tenue'}>{seleccionada?.etiqueta ?? placeholder}</span>
        <ChevronDown size={18} strokeWidth={1.75} aria-hidden />
      </button>
      {abierto && (
        <ul
          id={`${id}-lista`}
          role="listbox"
          className="absolute top-full z-30 mt-1 max-h-64 w-full overflow-auto rounded-control border border-borde bg-superficie py-1 shadow-lg"
        >
          {opciones.map((o, i) => (
            <li
              key={o.valor}
              role="option"
              aria-selected={o.valor === valor}
              onPointerEnter={() => setActivo(i)}
              onClick={() => elegir(o)}
              className={cn('flex min-h-11 cursor-pointer items-center justify-between px-3 text-base', i === activo && 'bg-superficie-2')}
            >
              {o.etiqueta}
              {o.valor === valor && <Check size={18} strokeWidth={1.75} aria-hidden />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
