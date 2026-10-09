import { useConfig } from '../../data/hooks.js'
import { convertirDesdeUsd, formatear } from '../../lib/moneda.js'

// Precio por docena en USD y, en chico, su equivalente en Bs y ARS con el tipo de cambio vigente.
export default function Precio({ usdCent, equivalentes = false, className = '' }) {
  const { datos } = useConfig()
  const tc = datos?.tipo_cambio
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
