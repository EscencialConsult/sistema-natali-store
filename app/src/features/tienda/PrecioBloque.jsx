import { formatear, META_MONEDA } from '../../lib/moneda.js'
import { precioPublico } from './lib/precioPublico.js'

// Precio por docena y por media docena en las monedas disponibles. Precio oculto = "a consultar" (nunca un cero).
export default function PrecioBloque({ producto, ajustes, compacto = false }) {
  const p = precioPublico({ precioUsdCent: producto?.precio_docena_usd_cent, ajustes })
  if (p.oculto) return <p className="text-sm text-texto-suave">Precio a consultar con tu vendedor</p>

  const [principal, ...otras] = p.monedas
  if (compacto) {
    return (
      <p className="text-sm">
        <span className="font-semibold">{formatear(principal.docena, principal.moneda)}</span>
        <span className="text-texto-suave"> · docena</span>
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-3">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-texto-suave">
            <th className="py-1 font-medium">Moneda</th>
            <th className="py-1 text-right font-medium">Docena ({p.unidadesDocena})</th>
            <th className="py-1 text-right font-medium">Media docena ({p.unidadesDocena / 2})</th>
          </tr>
        </thead>
        <tbody>
          {[principal, ...otras].map((m) => (
            <tr key={m.moneda} className="border-t border-borde/60">
              <th scope="row" className="py-2 font-medium">{META_MONEDA[m.moneda].nombre}</th>
              <td className="py-2 text-right tabular-nums">{formatear(m.docena, m.moneda)}</td>
              <td className="py-2 text-right tabular-nums">{formatear(m.media, m.moneda)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {p.monedas.length === 1 && <p className="text-xs text-texto-suave">Consultá a tu vendedor el importe en pesos o bolivianos.</p>}
    </div>
  )
}
