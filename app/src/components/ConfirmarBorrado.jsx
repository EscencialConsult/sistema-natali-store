import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button, Modal } from './ui/index.js'

// Confirmación de un borrado que no se puede deshacer. onConfirmar() borra; si falla, el error queda a la vista y el modal sigue abierto.
export default function ConfirmarBorrado({ abierto, onCerrar, titulo, children, etiqueta = 'Sí, eliminar', onConfirmar }) {
  const [borrando, setBorrando] = useState(false)
  const [error, setError] = useState('')
  const cerrar = () => {
    if (borrando) return
    setError('')
    onCerrar()
  }
  const confirmar = async () => {
    setBorrando(true)
    setError('')
    try {
      await onConfirmar()
      onCerrar()
    } catch (e) {
      setError(e.message)
    } finally {
      setBorrando(false)
    }
  }
  return (
    <Modal abierto={abierto} onCerrar={cerrar} titulo={titulo}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 text-sm text-texto-suave">{children}</div>
        <p className="rounded-control bg-error-fondo p-3 text-sm text-error"><strong>No se puede deshacer.</strong></p>
        {error && <p role="alert" className="text-sm text-error">{error}</p>}
        <div className="flex flex-wrap justify-end gap-2">
          <Button variante="fantasma" deshabilitado={borrando} onClick={cerrar}>Cancelar</Button>
          <Button variante="peligro" icono={Trash2} cargando={borrando} onClick={confirmar}>{etiqueta}</Button>
        </div>
      </div>
    </Modal>
  )
}
