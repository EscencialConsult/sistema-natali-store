import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

// Menú desplegable propio para elegir el orden: botón + lista de opciones (patrón "select-only combobox" de WAI-ARIA).
// Teclado: Enter/Espacio/flechas abren; flechas, Inicio y Fin mueven; Enter o Espacio eligen; Esc y Tab cierran.
// Un clic afuera lo cierra. El foco queda en el botón y la opción activa se anuncia con aria-activedescendant.
export default function MenuOrden({ opciones, valor, onCambiar, etiqueta = 'Ordenar' }) {
  const id = useId()
  const [abierto, setAbierto] = useState(false)
  const [activo, setActivo] = useState(0)
  const raiz = useRef(null)
  const boton = useRef(null)

  const indiceActual = Math.max(0, opciones.findIndex((o) => o.valor === valor))
  const actual = opciones[indiceActual]
  const idOpcion = (i) => `${id}-opcion-${i}`

  useEffect(() => {
    if (!abierto) return undefined
    const afuera = (e) => {
      if (!raiz.current?.contains(e.target)) setAbierto(false)
    }
    document.addEventListener('pointerdown', afuera)
    return () => document.removeEventListener('pointerdown', afuera)
  }, [abierto])

  const abrir = (indice = indiceActual) => {
    setActivo(indice)
    setAbierto(true)
  }
  const cerrar = () => {
    setAbierto(false)
    boton.current?.focus()
  }
  const elegir = (i) => {
    const o = opciones[i]
    if (o) onCambiar(o.valor)
    cerrar()
  }

  const alTeclear = (e) => {
    const ultimo = opciones.length - 1
    if (!abierto) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault()
        abrir(indiceActual)
      }
      return
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActivo((a) => Math.min(ultimo, a + 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActivo((a) => Math.max(0, a - 1))
        break
      case 'Home':
        e.preventDefault()
        setActivo(0)
        break
      case 'End':
        e.preventDefault()
        setActivo(ultimo)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        elegir(activo)
        break
      case 'Escape':
        e.preventDefault()
        cerrar()
        break
      case 'Tab':
        setAbierto(false)
        break
      default:
    }
  }

  return (
    <div ref={raiz} className="relative flex items-center gap-2 text-sm">
      <span id={`${id}-etiqueta`} className="t-suave">{etiqueta}</span>
      <button
        ref={boton}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-controls={`${id}-lista`}
        aria-labelledby={`${id}-etiqueta ${id}-valor`}
        aria-activedescendant={abierto ? idOpcion(activo) : undefined}
        onClick={() => (abierto ? setAbierto(false) : abrir())}
        onKeyDown={alTeclear}
        className="flex min-h-11 min-w-48 items-center justify-between gap-3 rounded-xl border border-(--t-beige) bg-white/80 px-3.5 font-medium transition-colors hover:border-(--t-vino)/50 aria-expanded:border-(--t-vino)"
      >
        <span id={`${id}-valor`}>{actual.etiqueta}</span>
        <ChevronDown size={16} aria-hidden className={`t-suave shrink-0 transition-transform duration-150 ${abierto ? 'rotate-180' : ''}`} />
      </button>
      {abierto && (
        <ul
          id={`${id}-lista`}
          role="listbox"
          aria-labelledby={`${id}-etiqueta`}
          className="absolute right-0 top-full z-30 mt-2 w-max min-w-full overflow-hidden rounded-xl border border-(--t-beige) bg-(--t-crema) p-1 shadow-lg shadow-(--t-vino)/10"
        >
          {opciones.map((o, i) => (
            <li
              key={o.valor}
              id={idOpcion(i)}
              role="option"
              aria-selected={o.valor === valor}
              onPointerEnter={() => setActivo(i)}
              onClick={() => elegir(i)}
              className={`flex min-h-10 cursor-pointer items-center justify-between gap-6 rounded-lg px-3 ${
                i === activo ? 'bg-(--t-beige)/70' : ''
              } ${o.valor === valor ? 'font-semibold text-(--t-vino)' : ''}`}
            >
              {o.etiqueta}
              {o.valor === valor && <Check size={15} aria-hidden />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
