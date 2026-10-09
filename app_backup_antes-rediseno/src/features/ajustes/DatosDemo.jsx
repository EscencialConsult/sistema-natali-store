import { useState } from 'react'
import { FlaskConical, RotateCcw } from 'lucide-react'
import { Button, Modal, useToast } from '../../components/ui/index.js'
import { generarDemo } from '../../data/demo/generarDemo.js'
import { reiniciarDatos } from '../../data/seed/cargar.js'

export default function DatosDemo() {
  const avisar = useToast()
  const [cargando, setCargando] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [reiniciando, setReiniciando] = useState(false)
  const [error, setError] = useState('')

  const cargar = async () => {
    setError('')
    setCargando(true)
    try {
      const r = await generarDemo()
      avisar(`Demo cargada: ${r.ventas} ventas, ${r.anuladas} anuladas y ${r.entradas} reposiciones.`, 'exito')
    } catch (e) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }

  const reiniciar = async () => {
    setReiniciando(true)
    try {
      await reiniciarDatos()
      try {
        localStorage.clear()
      } catch {
        /* nada */
      }
      window.location.assign('/')
    } catch (e) {
      setError(e.message)
      setReiniciando(false)
      setConfirmando(false)
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-tarjeta border border-dashed border-borde-fuerte bg-superficie p-4">
      <div>
        <h2 className="text-lg">Datos de demostración</h2>
        <p className="text-sm text-texto-suave">Para probar el sistema o mostrárselo a alguien: carga una semana de ventas inventadas (varios vendedores, mayoría en dólares, algunas anuladas) y reposiciones de stock. Los nombres de clientas y teléfonos son de mentira.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button icono={FlaskConical} cargando={cargando} onClick={cargar}>Cargar ventas de demostración</Button>
        <Button variante="secundario" icono={RotateCcw} onClick={() => setConfirmando(true)}>Reiniciar todos los datos</Button>
      </div>
      {error && <p role="alert" className="rounded-control bg-error-fondo p-3 text-sm text-error">{error}</p>}
      <Modal abierto={confirmando} onCerrar={() => setConfirmando(false)} titulo="¿Borrar todo?">
        <p className="mb-4 text-sm text-texto-suave">Se borran las ventas, el stock, los ajustes y la sesión de este dispositivo, y vuelve el catálogo de ejemplo. No se puede deshacer.</p>
        <div className="flex gap-2">
          <Button variante="peligro" cargando={reiniciando} onClick={reiniciar}>Sí, borrar todo</Button>
          <Button variante="fantasma" onClick={() => setConfirmando(false)}>Cancelar</Button>
        </div>
      </Modal>
    </section>
  )
}
