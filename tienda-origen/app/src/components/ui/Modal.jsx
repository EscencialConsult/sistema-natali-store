import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/cn.js'

/* <dialog> nativo: atrapa el foco y cierra con Esc sin código extra. */
export default function Modal({ abierto, onCerrar, titulo, children, abajo = false, className }) {
  const ref = useRef(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (abierto && !d.open) d.showModal()
    if (!abierto && d.open) d.close()
  }, [abierto])

  return (
    <dialog
      ref={ref}
      onClose={onCerrar}
      onClick={(e) => e.target === ref.current && onCerrar()}
      className={cn(
        'panel fixed m-auto w-[min(92vw,32rem)] rounded-tarjeta bg-superficie p-0 text-texto shadow-xl',
        abajo && 'panel-abajo',
        abajo && 'max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto max-sm:m-0 max-sm:w-full max-sm:max-w-none max-sm:rounded-b-none max-sm:rounded-t-[1rem]',
        className,
      )}
    >
      <div className="flex max-h-[85dvh] flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-borde px-4 py-3">
          <h2 className="text-lg">{titulo}</h2>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="flex size-11 items-center justify-center rounded-control hover:bg-superficie-2">
            <X size={20} strokeWidth={1.75} aria-hidden />
          </button>
        </header>
        <div className="overflow-auto p-4">{children}</div>
      </div>
    </dialog>
  )
}
