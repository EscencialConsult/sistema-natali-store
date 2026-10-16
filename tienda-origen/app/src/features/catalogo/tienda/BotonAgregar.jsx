import { useState } from 'react'
import { Button, useToast } from '../../../components/ui/index.js'
import { carrito } from '../../../data/repos/index.js'
import MiniCarrito from './MiniCarrito.jsx'

// Único botón primario de la ficha. Deshabilitado hasta elegir color; al agregar abre el mini carrito.
export default function BotonAgregar({ producto, color, cantidad, disponible, tamano }) {
  const avisar = useToast()
  const [agregando, setAgregando] = useState(false)
  const [confirmado, setConfirmado] = useState(null)
  const sinStock = color && disponible <= 0
  const motivo = !color ? 'Elegí un color' : sinStock ? 'Sin stock en este color' : null

  const agregar = async () => {
    setAgregando(true)
    try {
      await carrito.agregar({ producto_id: producto.id, color_id: color.id, cantidad })
      setConfirmado({ producto, color, cantidad })
    } catch (e) {
      avisar(e.message, 'error')
    } finally {
      setAgregando(false)
    }
  }

  return (
    <>
      <Button ancho cargando={agregando} deshabilitado={!!motivo} onClick={agregar} className={tamano === 'kiosco' ? 'min-h-control-kiosco text-kiosco' : 'min-h-12'}>
        {motivo ?? 'Agregar al carrito'}
      </Button>
      <MiniCarrito abierto={!!confirmado} onCerrar={() => setConfirmado(null)} producto={confirmado?.producto} color={confirmado?.color} cantidad={confirmado?.cantidad ?? 0} />
    </>
  )
}
