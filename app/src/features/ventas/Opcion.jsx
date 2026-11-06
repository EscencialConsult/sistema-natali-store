import { cn } from '../../lib/cn.js'

// Botón grande de elección (moneda, pago, entrega, tipo de descuento).
export default function Opcion({ activa, onClick, children, icono: Icono }) {
  return (
    <button
      type="button"
      aria-pressed={activa}
      onClick={onClick}
      className={cn(
        'flex min-h-16 flex-1 flex-col items-center justify-center gap-0.5 rounded-control border px-2 text-base font-medium transition-[background-color,border-color,box-shadow] duration-150',
        activa ? 'border-tinta bg-tinte text-sobre-tinte ring-2 ring-tinta/20' : 'border-borde-fuerte bg-superficie text-texto hover:border-texto-tenue',
      )}
    >
      {Icono && <Icono size={20} strokeWidth={1.75} aria-hidden />}
      {children}
    </button>
  )
}
