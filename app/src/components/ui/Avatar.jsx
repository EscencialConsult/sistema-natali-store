import { cn } from '../../lib/cn.js'

const iniciales = (nombre = '') =>
  nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')

/* Círculo con iniciales. Decorativo: el nombre siempre va escrito al lado. */
export default function Avatar({ nombre, className }) {
  return (
    <span aria-hidden className={cn('flex size-10 shrink-0 items-center justify-center rounded-full bg-tinte font-titulo text-sm font-semibold text-sobre-tinte', className)}>
      {iniciales(nombre)}
    </span>
  )
}
