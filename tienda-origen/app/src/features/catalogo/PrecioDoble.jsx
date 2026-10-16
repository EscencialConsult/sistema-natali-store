import { useCambio } from '../../data/hooks.js'
import { bsAPesosCent, formatear, formatearPesos } from '../../lib/moneda.js'
import { cn } from '../../lib/cn.js'

// Un importe de la tienda (guardado en Bs) mostrado en las DOS monedas: bolivianos y pesos argentinos, con el tipo de
// cambio que carga la administración. Si todavía no hay tipo de cambio muestra solo Bs (nunca inventa una conversión).
//   apilado: pesos debajo (tarjetas y totales). Por defecto van en la misma línea.
export default function PrecioDoble({ bsCent, apilado = false, className, claseBs = 'font-medium', clasePesos = 'text-texto-suave' }) {
  const { tasa } = useCambio()
  if (!Number.isFinite(bsCent)) return null
  const pesos = bsAPesosCent(bsCent, tasa)
  return (
    <span className={cn('tabular-nums', apilado && 'flex flex-col', className)}>
      <span className={claseBs}>{formatear(bsCent, 'bs')}</span>
      {pesos != null && <span className={cn(clasePesos, !apilado && 'ml-1.5')}>{apilado ? '' : '· '}{formatearPesos(pesos)}</span>}
    </span>
  )
}
