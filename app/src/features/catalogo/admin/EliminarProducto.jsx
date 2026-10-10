import { useToast } from '../../../components/ui/index.js'
import ConfirmarBorrado from '../../../components/ConfirmarBorrado.jsx'
import { limpieza } from '../../../data/limpieza.js'

// Eliminar un producto del todo (administración). Distinto de "Dar de baja", que solo lo oculta.
export function ConfirmarEliminarProducto({ producto, onCerrar, onListo }) {
  const avisar = useToast()
  const eliminar = async () => {
    await limpieza.eliminarProductos([producto.id])
    avisar(`${producto.codigo} eliminado`, 'exito')
    onListo?.()
  }
  return (
    <ConfirmarBorrado abierto={!!producto} onCerrar={onCerrar} titulo={`¿Eliminar ${producto?.codigo ?? ''}?`} onConfirmar={eliminar}>
      <p>Se elimina “{producto?.nombre}” del todo: fotos, colores, stock e historial de stock.</p>
      <p>Las notas de venta donde aparece se conservan con su código y nombre.</p>
      <p>Si solo querés que no se venda más, usá <strong>Dar de baja</strong> (se puede reactivar).</p>
    </ConfirmarBorrado>
  )
}

// Todos los dados de baja de una vez.
export function ConfirmarEliminarDeBaja({ abierto, cantidad, onCerrar }) {
  const avisar = useToast()
  const eliminar = async () => {
    const n = await limpieza.eliminarProductosDeBaja()
    avisar(n === 1 ? 'Se eliminó 1 producto' : `Se eliminaron ${n} productos`, 'exito')
  }
  return (
    <ConfirmarBorrado abierto={abierto} onCerrar={onCerrar} titulo="¿Eliminar los productos dados de baja?" etiqueta="Sí, eliminar todos" onConfirmar={eliminar}>
      <p>Se eliminan del todo los <strong>{cantidad}</strong> productos dados de baja, con sus fotos, colores, stock e historial de stock.</p>
      <p>Las notas de venta donde aparecen se conservan con su código y nombre.</p>
    </ConfirmarBorrado>
  )
}
