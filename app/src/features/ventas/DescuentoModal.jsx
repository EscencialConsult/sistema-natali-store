import { useState } from 'react'
import { Banknote, Percent } from 'lucide-react'
import { Button, Input, Modal } from '../../components/ui/index.js'
import { leerDescuento } from '../../lib/descuentos.js'
import { formatear, META_MONEDA, montoEditable } from '../../lib/moneda.js'
import Opcion from './Opcion.jsx'

const textoInicial = (d) => (!d ? '' : d.modo === 'monto' ? montoEditable(d.valor) : String(d.valor).replace('.', ','))

// Elegir el descuento de la venta en curso: porcentaje o monto fijo, viendo cómo queda el total antes de aplicarlo.
export default function DescuentoModal({ descuento, subtotalCent, moneda, onAplicar, onCerrar }) {
  const [modo, setModo] = useState(descuento?.modo ?? 'porcentaje')
  const [texto, setTexto] = useState(() => textoInicial(descuento))
  const leido = leerDescuento(modo, texto, subtotalCent, moneda)
  const elegirModo = (m) => {
    if (m === modo) return
    setModo(m)
    setTexto('')
  }
  const aplicar = (e) => {
    e.preventDefault()
    if (leido.descuento) onAplicar(leido.descuento)
  }

  return (
    <Modal abierto abajo onCerrar={onCerrar} titulo="Descuento de la venta">
      <form onSubmit={aplicar} className="flex flex-col gap-4">
        <div className="flex gap-2">
          <Opcion icono={Percent} activa={modo === 'porcentaje'} onClick={() => elegirModo('porcentaje')}>Porcentaje</Opcion>
          <Opcion icono={Banknote} activa={modo === 'monto'} onClick={() => elegirModo('monto')}>Monto fijo</Opcion>
        </div>
        <Input
          etiqueta={modo === 'porcentaje' ? 'Porcentaje a descontar' : `Monto a descontar (${META_MONEDA[moneda].simbolo})`}
          inputMode="decimal"
          autoComplete="off"
          autoFocus
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={modo === 'porcentaje' ? 'Ej. 10' : 'Ej. 50,00'}
          error={leido.error}
        />
        <dl className="flex flex-col gap-1.5 rounded-control bg-superficie-2 p-3 text-sm tabular-nums">
          <div className="flex justify-between gap-3"><dt className="text-texto-suave">Subtotal</dt><dd>{formatear(subtotalCent, moneda)}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-texto-suave">Descuento</dt><dd>− {formatear(leido.cent ?? 0, moneda)}</dd></div>
          <div className="flex justify-between gap-3 border-t border-borde pt-1.5 text-base font-semibold"><dt>Total</dt><dd aria-live="polite">{formatear(subtotalCent - (leido.cent ?? 0), moneda)}</dd></div>
        </dl>
        <div className="flex flex-wrap justify-end gap-2">
          {descuento && <Button type="button" variante="peligro_suave" className="mr-auto" onClick={() => onAplicar(null)}>Quitar descuento</Button>}
          <Button type="button" variante="fantasma" onClick={onCerrar}>Cancelar</Button>
          <Button type="submit" deshabilitado={!leido.descuento}>Aplicar</Button>
        </div>
      </form>
    </Modal>
  )
}
