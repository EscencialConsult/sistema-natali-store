import { cn } from '../../lib/cn.js'

const TONOS = {
  neutro: 'bg-superficie-2 text-texto-suave ring-borde',
  exito: 'bg-exito-fondo text-exito ring-exito/15',
  alerta: 'bg-alerta-fondo text-alerta ring-alerta/15',
  error: 'bg-error-fondo text-error ring-error/15',
  info: 'bg-info-fondo text-info ring-info/15',
  tinte: 'bg-tinte text-sobre-tinte ring-tinta/15',
  tinta: 'bg-tinta text-sobre-tinta ring-transparent',
}

export default function Badge({ tono = 'neutro', icono: Icono, children, className }) {
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-pildora px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset', TONOS[tono], className)}>
      {Icono && <Icono size={13} strokeWidth={2} aria-hidden />}
      {children}
    </span>
  )
}
