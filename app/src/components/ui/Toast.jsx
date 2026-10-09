import { createContext, useCallback, useContext, useState } from 'react'
import { cn } from '../../lib/cn.js'
import { nuevoId } from '../../lib/id.js'

const ToastCtx = createContext(() => {})
// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastCtx)

const TONOS = { info: 'bg-tinta text-sobre-tinta', exito: 'bg-exito text-sobre-tinta', error: 'bg-error text-sobre-tinta' }

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
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6">
        {items.map((t) => (
          <div key={t.id} className={cn('toast pointer-events-auto rounded-control px-4 py-3 text-sm font-medium', TONOS[t.tono])}>
            {t.texto}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
