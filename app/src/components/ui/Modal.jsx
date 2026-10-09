import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/cn.js'

// Bloquea el scroll del fondo mientras haya algún panel abierto (cuenta paneles anidados).
// Se fija el body en su lugar (también funciona en iOS) y al cerrar se vuelve a la misma posición.
let abiertos = 0
let guardado = null
function bloquearFondo() {
  if (abiertos++ > 0) return
  const y = window.scrollY
  const b = document.body.style
  guardado = { y, position: b.position, top: b.top, left: b.left, right: b.right, overflow: document.documentElement.style.overflow }
  Object.assign(b, { position: 'fixed', top: `-${y}px`, left: '0', right: '0' })
  document.documentElement.style.overflow = 'hidden'
}
function liberarFondo() {
  if (--abiertos > 0 || !guardado) return
  const { y, overflow, ...estilos } = guardado
  Object.assign(document.body.style, estilos)
  document.documentElement.style.overflow = overflow
  window.scrollTo(0, y)
  guardado = null
}

const esCelular = () => window.matchMedia('(max-width: 639px)').matches
const UMBRAL_PX = 110
const UMBRAL_VELOCIDAD = 0.6 // px/ms: un gesto rápido cierra aunque sea corto

/* <dialog> nativo: atrapa el foco y cierra con Esc sin código extra.
   abajo: en celular es una hoja inferior que se cierra deslizando hacia abajo desde la barrita o la cabecera. */
export default function Modal({ abierto, onCerrar, titulo, children, abajo = false, cerrarConFondo = true, ancho = 'w-[min(92vw,32rem)]', className }) {
  const ref = useRef(null)
  const arrastre = useRef(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (abierto && !d.open) d.showModal()
    if (!abierto && d.open) d.close()
  }, [abierto])

  useEffect(() => {
    if (!abierto) return
    bloquearFondo()
    return liberarFondo
  }, [abierto])

  const empezar = (e) => {
    if (!abajo || !esCelular() || e.target.closest('button')) return
    arrastre.current = { y0: e.clientY, t0: performance.now(), dy: 0 }
    e.currentTarget.setPointerCapture(e.pointerId)
    ref.current.style.transition = 'none'
  }
  const mover = (e) => {
    const a = arrastre.current
    if (!a) return
    a.dy = Math.max(0, e.clientY - a.y0)
    ref.current.style.transform = `translateY(${a.dy}px)`
  }
  const soltar = () => {
    const a = arrastre.current
    if (!a) return
    arrastre.current = null
    const d = ref.current
    const velocidad = a.dy / Math.max(1, performance.now() - a.t0)
    d.style.transition = 'transform 260ms cubic-bezier(0.32, 0.72, 0, 1)'
    if (a.dy > UMBRAL_PX || (a.dy > 24 && velocidad > UMBRAL_VELOCIDAD)) {
      d.style.transform = 'translateY(100%)'
      setTimeout(() => {
        onCerrar()
        d.style.transform = ''
        d.style.transition = ''
      }, 240)
    } else {
      d.style.transform = ''
      setTimeout(() => (d.style.transition = ''), 260)
    }
  }

  return (
    <dialog
      ref={ref}
      onClose={onCerrar}
      onClick={(e) => cerrarConFondo && e.target === ref.current && onCerrar()}
      className={cn(
        'panel fixed m-auto max-w-none overscroll-contain rounded-panel bg-superficie p-0 text-texto shadow-flotante',
        ancho,
        abajo && 'panel-abajo',
        abajo && 'max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto max-sm:m-0 max-sm:w-full max-sm:max-w-none max-sm:rounded-b-none max-sm:rounded-t-[1.5rem]',
        className,
      )}
    >
      <div className="flex max-h-[88dvh] flex-col">
        <div
          onPointerDown={empezar}
          onPointerMove={mover}
          onPointerUp={soltar}
          onPointerCancel={soltar}
          className={cn(abajo && 'max-sm:cursor-grab max-sm:touch-none max-sm:select-none')}
        >
          {abajo && (
            <div className="flex justify-center pb-1 pt-2.5 sm:hidden">
              <span aria-hidden className="h-1.5 w-11 rounded-full bg-borde-fuerte" />
              <span className="sr-only">Deslizá hacia abajo para cerrar</span>
            </div>
          )}
          <header className="flex items-center justify-between gap-3 px-5 pb-2 pt-3 max-sm:pt-1 sm:pt-4">
            <h2 className="text-lg">{titulo}</h2>
            <button type="button" onClick={onCerrar} aria-label="Cerrar" className="-mr-2 flex size-11 items-center justify-center rounded-full text-texto-suave transition-colors hover:bg-superficie-2 hover:text-texto">
              <X size={20} strokeWidth={1.75} aria-hidden />
            </button>
          </header>
        </div>
        <div className="overflow-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-1">{children}</div>
      </div>
    </dialog>
  )
}
