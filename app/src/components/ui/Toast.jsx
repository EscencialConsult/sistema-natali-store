import { createContext, useCallback, useContext, useState } from 'react'
import { CircleAlert, CircleCheck, Info } from 'lucide-react'
import { cn } from '../../lib/cn.js'
import { nuevoId } from '../../lib/id.js'

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
  const avisar = useCallback((texto, tono = 'info') => {
    const id = nuevoId()
    setItems((l) => [...l, { id, texto, tono }])
    setTimeout(() => setItems((l) => l.filter((t) => t.id !== id)), 4000)
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
