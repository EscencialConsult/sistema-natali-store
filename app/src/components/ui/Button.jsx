import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/cn.js'

const VARIANTES = {
  primario: 'bg-tinta text-sobre-tinta hover:bg-tinta-hover border-tinta',
  secundario: 'bg-superficie text-texto border-borde-fuerte hover:bg-superficie-2',
  fantasma: 'bg-transparent text-texto border-transparent hover:bg-superficie-2',
  peligro: 'bg-error text-sobre-tinta border-error hover:opacity-90',
  whatsapp: 'bg-whatsapp text-sobre-tinta border-whatsapp hover:opacity-90',
}

export default function Button({
  variante = 'primario',
  cargando = false,
  deshabilitado = false,
  icono: Icono,
  ancho = false,
  type = 'button',
  className,
  children,
  ...resto
}) {
  return (
    <button
      type={type}
      disabled={deshabilitado || cargando}
      aria-busy={cargando || undefined}
      className={cn(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-control border px-4 text-base font-medium transition-[background-color,transform] duration-150 ease-salida',
        'motion-safe:active:not-disabled:scale-[0.97]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTES[variante],
        ancho && 'w-full',
        className,
      )}
      {...resto}
    >
      {cargando ? <Loader2 size={18} className="animate-spin" aria-hidden /> : Icono && <Icono size={18} strokeWidth={1.75} aria-hidden />}
      {children}
    </button>
  )
}
