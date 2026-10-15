import { useEffect, useState } from 'react'
import { useCambio } from '../../data/hooks.js'
import { Button } from '../../components/ui/index.js'

const CLAVE = 'naty.cambio_visto'

const leer = () => {
  try {
    const v = Number(sessionStorage.getItem(CLAVE))
    return Number.isFinite(v) && v > 0 ? v : null
  } catch {
    return null
  }
}
const guardar = (v) => {
  try {
    sessionStorage.setItem(CLAVE, String(v))
  } catch {
    /* sin almacenamiento: el aviso solo se muestra en esta pantalla */
  }
}

// Aviso de que los importes en pesos siguen el tipo de cambio de la administración y pueden actualizarse.
//   recordatorio: en el carrito agrega la nota fija ("conviene finalizar la compra pronto").
// Si el tipo de cambio cambia mientras la persona está comprando, avisa con el valor nuevo hasta que lo confirma.
export default function AvisoCambio({ className, recordatorio = false }) {
  const { tasa, bs, ars, version } = useCambio()
  const [visto, setVisto] = useState(leer)
  // La primera versión que se ve queda como referencia (ajuste de estado durante el render, sin efecto).
  if (visto == null && version != null) setVisto(version)
  useEffect(() => {
    if (visto != null) guardar(visto)
  }, [visto])
  if (tasa == null) return null
  const cambio = version != null && visto != null && visto !== version
  if (cambio) {
    return (
      <div role="status" className={`flex flex-col gap-2 rounded-control bg-alerta-fondo px-4 py-3 text-sm text-alerta sm:flex-row sm:items-center sm:justify-between ${className ?? ''}`}>
        <p><strong className="font-semibold">El tipo de cambio se actualizó:</strong> ahora {bs} Bs = {ars} ARS. Los importes en pesos ya están recalculados; revisá el total antes de pagar.</p>
        <Button variante="secundario" onClick={() => setVisto(version)}>Entendido</Button>
      </div>
    )
  }
  if (!recordatorio) return null
  return (
    <p role="note" className={`rounded-control bg-superficie-2 px-4 py-3 text-sm text-texto-suave ${className ?? ''}`}>
      Los precios en pesos siguen el tipo de cambio del día ({bs} Bs = {ars} ARS). Si cambia mientras comprás, el total se actualiza: conviene finalizar la compra pronto.
    </p>
  )
}
