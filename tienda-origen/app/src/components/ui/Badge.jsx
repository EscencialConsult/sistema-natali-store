import { cn } from '../../lib/cn.js'

const TONOS = {
  neutro: 'bg-superficie-2 text-texto-suave border-borde',
  exito: 'bg-exito-fondo text-exito border-transparent',
  alerta: 'bg-alerta-fondo text-alerta border-transparent',
  error: 'bg-error-fondo text-error border-transparent',
  info: 'bg-info-fondo text-info border-transparent',
  tinta: 'bg-tinta text-sobre-tinta border-transparent',
}

export default function Badge({ tono = 'neutro', icono: Icono, children, className }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-pildora border px-2.5 py-0.5 text-xs font-medium', TONOS[tono], className)}>
      {Icono && <Icono size={13} strokeWidth={1.75} aria-hidden />}
      {children}
    </span>
  )
}
