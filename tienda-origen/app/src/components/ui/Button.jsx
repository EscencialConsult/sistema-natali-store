import { Loader2 } from 'lucide-react'
import { clasesBoton } from './estilos.js'

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
      className={clasesBoton({ variante, ancho, className })}
      {...resto}
    >
      {cargando ? <Loader2 size={18} className="animate-spin" aria-hidden /> : Icono && <Icono size={18} strokeWidth={1.75} aria-hidden />}
      {children}
    </button>
  )
}
