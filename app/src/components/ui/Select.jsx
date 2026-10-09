import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '../../lib/cn.js'
import { CAMPO } from './estilos.js'

const ALTO_OPCION = 44
const MARGEN = 8

// Dónde dibujar la lista: debajo del botón si entra; si no, arriba. Alto máximo = espacio disponible.
function posicionLista(el, cantidad) {
  if (!el) return null
  const r = el.getBoundingClientRect()
  const alto = Math.min(cantidad * ALTO_OPCION + 10, 320)
  const abajo = window.innerHeight - r.bottom - MARGEN
  const arriba = r.top - MARGEN
  const haciaArriba = abajo < Math.min(alto, 200) && arriba > abajo
  const max = Math.max(120, Math.min(alto, haciaArriba ? arriba : abajo))
  return { left: r.left, width: Math.max(r.width, 192), maxHeight: max, ...(haciaArriba ? { bottom: window.innerHeight - r.top + 6 } : { top: r.bottom + 6 }) }
}

/* Lista corta (hasta ~10 opciones). Para listas largas usar BuscadorLista. */
// Sin `etiqueta` visible hay que pasar `ariaLabel`: un combobox no toma su nombre del texto que muestra.
export default function Select({ etiqueta, ariaLabel, opciones, valor, onChange, placeholder = 'Elegir', deshabilitado, className }) {
  const id = useId()
  const [abierto, setAbierto] = useState(false)
  const [activo, setActivo] = useState(0)
  const raiz = useRef(null)
  const seleccionada = opciones.find((o) => o.valor === valor)

  const boton = useRef(null)
  const [pos, setPos] = useState(null)

  useEffect(() => {
    if (!abierto) return
    const fuera = (e) => raiz.current && !raiz.current.contains(e.target) && setAbierto(false)
    document.addEventListener('pointerdown', fuera)
    // La lista flota con posición fija (no la recorta ni la hace scrollear el modal); se reubica si algo se mueve.
    const ubicar = () => setPos(posicionLista(boton.current, opciones.length))
    ubicar()
    window.addEventListener('resize', ubicar)
    window.addEventListener('scroll', ubicar, true)
    return () => {
      document.removeEventListener('pointerdown', fuera)
      window.removeEventListener('resize', ubicar)
      window.removeEventListener('scroll', ubicar, true)
    }
  }, [abierto, opciones.length])

  const abrir = () => {
    setActivo(Math.max(0, opciones.findIndex((o) => o.valor === valor)))
    setAbierto(true)
  }
  const elegir = (o) => {
    onChange(o.valor)
    setAbierto(false)
  }
  const teclas = (e) => {
    // Escape cierra solo la lista; no el modal que la contiene.
    if (e.key === 'Escape' && abierto) {
      e.preventDefault()
      e.stopPropagation()
      return setAbierto(false)
    }
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
        ref={boton}
        role="combobox"
        aria-expanded={abierto}
        aria-controls={`${id}-lista`}
        aria-labelledby={etiqueta ? `${id}-et` : undefined}
        aria-label={etiqueta ? undefined : ariaLabel}
        disabled={deshabilitado}
        onClick={() => (abierto ? setAbierto(false) : abrir())}
        onKeyDown={teclas}
        className={cn(CAMPO, 'flex items-center justify-between gap-2 border-borde-campo text-left', abierto && 'border-tinta ring-4 ring-tinta/12')}
      >
        <span className={cn('truncate', !seleccionada && 'text-texto-tenue')}>{seleccionada?.etiqueta ?? placeholder}</span>
        <ChevronDown size={18} strokeWidth={1.75} aria-hidden className={cn('shrink-0 text-texto-suave transition-transform duration-150', abierto && 'rotate-180')} />
      </button>
      {abierto && pos && (
        <ul
          id={`${id}-lista`}
          role="listbox"
          style={pos}
          className="fixed z-50 overflow-auto overscroll-contain rounded-control border border-borde bg-superficie p-1 shadow-flotante"
        >
          {opciones.map((o, i) => (
            <li
              key={o.valor}
              role="option"
              aria-selected={o.valor === valor}
              onPointerEnter={() => setActivo(i)}
              onClick={() => elegir(o)}
              className={cn('flex min-h-11 cursor-pointer items-center justify-between gap-2 rounded-[0.6rem] px-3 text-base', i === activo && 'bg-superficie-2', o.valor === valor && 'font-medium text-sobre-tinte')}
            >
              {o.etiqueta}
              {o.valor === valor && <Check size={18} strokeWidth={2} aria-hidden className="text-tinta" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
