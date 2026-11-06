import { Percent } from 'lucide-react'
import { Dato } from './ui/index.js'
import { descuentosPorMoneda } from '../lib/descuentos.js'
import { formatear, META_MONEDA } from '../lib/moneda.js'

// Una cifra por moneda con lo descontado en estas ventas. Sin descuentos no muestra nada.
export default function DatosDescuento({ ventas }) {
  return descuentosPorMoneda(ventas).map((d) => (
    <Dato
      key={d.moneda}
      etiqueta={`Descuentos en ${META_MONEDA[d.moneda].nombre}`}
      valor={`− ${formatear(d.cent, d.moneda)}`}
      icono={Percent}
      tono="alerta"
      detalle={`${d.ventas} ${d.ventas === 1 ? 'venta' : 'ventas'} con descuento`}
    />
  ))
}
