import { Crown, ShieldCheck, ShoppingBag, Store, UserRound, Warehouse } from 'lucide-react'
import { cn } from '../../lib/cn.js'

// Un ícono por rol: se reconoce a quién corresponde sin leer ni depender de las iniciales.
const ICONO_POR_ROL = {
  superadmin: Crown,
  admin: ShieldCheck,
  enc_tienda: Store,
  enc_deposito: Warehouse,
  vendedor: ShoppingBag,
}

/* Círculo con ícono. Decorativo: el nombre siempre va escrito al lado. */
export default function Avatar({ rol, className }) {
  const Icono = ICONO_POR_ROL[rol] ?? UserRound
  return (
    <span aria-hidden className={cn('flex size-10 shrink-0 items-center justify-center rounded-full bg-tinte text-sobre-tinte', className)}>
      <Icono size={20} strokeWidth={1.75} />
    </span>
  )
}
