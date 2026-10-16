import { Check } from 'lucide-react'
import { BotonLink, Button, Sheet } from '../../../components/ui/index.js'
import PrecioDoble from '../PrecioDoble.jsx'
import Foto from '../Foto.jsx'

// Confirmación al agregar: qué se agregó y dos salidas claras. "Ir al carrito" es el único primario.
export default function MiniCarrito({ abierto, onCerrar, producto, color, cantidad }) {
  return (
    <Sheet abierto={abierto} onCerrar={onCerrar} titulo="Agregado al carrito">
      {producto && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Foto foto={producto.fotos[0]} alt="" sizes="80px" className="size-20 shrink-0 rounded-tarjeta" />
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="flex items-center gap-1.5 text-sm text-exito"><Check size={16} strokeWidth={2} aria-hidden /> Listo</p>
              <p className="truncate font-medium">{producto.nombre}</p>
              <p className="text-sm text-texto-suave">{color?.nombre} · {cantidad} {cantidad === 1 ? 'unidad' : 'unidades'} · <PrecioDoble bsCent={producto.precio_unidad_bs_cent * cantidad} claseBs="" clasePesos="" /></p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variante="secundario" ancho onClick={onCerrar}>Seguir viendo</Button>
            <BotonLink to="/carrito" className="w-full" ancho>Ir al carrito</BotonLink>
          </div>
        </div>
      )}
    </Sheet>
  )
}
