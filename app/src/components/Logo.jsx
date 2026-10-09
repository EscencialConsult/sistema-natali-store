import { cn } from '../lib/cn.js'

// Marca provisoria (solo texto) hasta recibir el logo de la clienta (bloqueo B2).
export default function Logo({ className }) {
  return <span className={cn('font-titulo text-xl font-semibold tracking-tight', className)}>Modas Naty</span>
}
