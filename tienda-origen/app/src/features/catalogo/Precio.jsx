import { useConfig } from '../../data/hooks.js'
import { convertirDesdeUsd, formatear } from '../../lib/moneda.js'
import PrecioDoble from './PrecioDoble.jsx'

// Dos modos. Tienda (`bsCent`): precio por unidad en Bs y, si está activado, su equivalente en USD.
// Panel (`usdCent`): precio por docena en USD con equivalentes en Bs y ARS (lo que usa el sistema de nota).
export default function Precio({ usdCent, bsCent, equivalentes = false, mostrarUsd = false, className = '' }) {
  const { datos } = useConfig()
  const tc = datos?.tipo_cambio
  if (Number.isInteger(bsCent)) {
    return (
      <p className={className}>
        <PrecioDoble bsCent={bsCent} />
        {mostrarUsd && tc?.bs > 0 && <span className="ml-2 text-sm tabular-nums text-texto-suave">≈ {formatear(Math.round(bsCent / tc.bs), 'usd')}</span>}
      </p>
    )
  }
  return (
    <p className={className}>
      <span className="font-medium tabular-nums">{formatear(usdCent, 'usd')}</span>
      <span className="text-texto-suave"> por docena</span>
      {equivalentes && tc && (
        <span className="mt-0.5 block text-sm tabular-nums text-texto-suave">
          {formatear(convertirDesdeUsd(usdCent, 'bs', tc), 'bs')} · {formatear(convertirDesdeUsd(usdCent, 'ars', tc), 'ars')}
        </span>
      )}
    </p>
  )
}
