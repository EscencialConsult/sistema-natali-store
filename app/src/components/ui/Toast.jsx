import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { CircleAlert, CircleCheck, Info } from 'lucide-react'
import { cn } from '../../lib/cn.js'
import { nuevoId } from '../../lib/id.js'

const DURACION_MS = 4000
const MAXIMO = 3

const ToastCtx = createContext(() => {})
// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastCtx)

const TONOS = {
  info: { clase: 'bg-pie text-sobre-tinta', icono: Info },
  exito: { clase: 'bg-exito text-sobre-tinta', icono: CircleCheck },
  error: { clase: 'bg-error text-sobre-tinta', icono: CircleAlert },
}

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const timers = useRef(new Map())
  // Un mismo mensaje no se apila: se renueva el que ya está. Como máximo se ven los 3 más recientes.
  const avisar = useCallback((texto, tono = 'info') => {
    const clave = `${tono}:${texto}`
    clearTimeout(timers.current.get(clave))
    setItems((l) => [...l.filter((t) => t.clave !== clave), { id: nuevoId(), clave, texto, tono }].slice(-MAXIMO))
    timers.current.set(
      clave,
      setTimeout(() => {
        timers.current.delete(clave)
        setItems((l) => l.filter((t) => t.clave !== clave))
      }, DURACION_MS),
    )
  }, [])

  return (
    <ToastCtx.Provider value={avisar}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6">
        {items.map((t) => {
          const { clase, icono: Icono } = TONOS[t.tono]
          return (
            <div key={t.id} className={cn('toast pointer-events-auto flex max-w-md items-center gap-2.5 rounded-control px-4 py-3 text-sm font-medium shadow-flotante', clase)}>
              <Icono size={18} strokeWidth={2} aria-hidden className="shrink-0" />
              {t.texto}
            </div>
          )
        })}
      </div>
    </ToastCtx.Provider>
  )
}
