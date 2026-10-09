import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/cn.js'

const VARIANTES = {
  primario: 'bg-tinta text-sobre-tinta border-tinta shadow-boton hover:bg-tinta-hover hover:border-tinta-hover',
  secundario: 'bg-superficie text-texto border-borde-fuerte shadow-tarjeta hover:bg-superficie-2',
  suave: 'bg-tinte text-sobre-tinte border-transparent hover:bg-tinte-2',
  fantasma: 'bg-transparent text-texto border-transparent hover:bg-superficie-2',
  peligro: 'bg-error text-sobre-tinta border-error shadow-boton hover:brightness-95',
  peligro_suave: 'bg-transparent text-error border-transparent hover:bg-error-fondo',
  whatsapp: 'bg-whatsapp text-sobre-tinta border-whatsapp shadow-boton hover:brightness-95',
  // Sobre fondos oscuros (banner de inicio, avisos).
  claro: 'bg-superficie text-sobre-tinte border-superficie shadow-boton hover:bg-tinte hover:border-tinte',
  contorno_claro: 'bg-transparent text-sobre-tinta border-sobre-tinta/30 hover:bg-sobre-tinta/10',
}

const TAMANOS = {
  md: 'min-h-11 px-4 text-[0.9375rem]',
  lg: 'min-h-13 px-6 text-base',
}

export default function Button({
  variante = 'primario',
  tamano = 'md',
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
        'inline-flex items-center justify-center gap-2 rounded-control border font-medium transition-[background-color,border-color,transform,filter] duration-150 ease-salida',
        'motion-safe:active:not-disabled:scale-[0.97]',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none',
        TAMANOS[tamano],
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
