import { WifiOff } from 'lucide-react'
import { useConexion } from '../../lib/useConexion.js'

// Franja cuando se corta internet: el catálogo guardado se sigue viendo, pero no se puede confirmar ni pagar un pedido.
export default function AvisoSinConexion() {
  const estado = useConexion()
  if (estado !== 'sin_conexion') return null
  return (
    <div role="status" className="flex items-center justify-center gap-2 bg-alerta-fondo px-4 py-2 text-center text-sm text-alerta">
      <WifiOff size={16} strokeWidth={1.75} aria-hidden />
      Sin conexión: podés mirar el catálogo, pero para confirmar un pedido necesitás internet.
    </div>
  )
}
