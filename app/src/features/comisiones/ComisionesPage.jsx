import { useMemo, useState } from 'react'
import { Info, Wallet } from 'lucide-react'
import { EmptyState, ErrorState, Skeleton, Tabs } from '../../components/ui/index.js'
import { usePerfiles, useVentas } from '../../data/hooks.js'
import { formatear, META_MONEDA, totalesPorMoneda } from '../../lib/moneda.js'
import { PERIODOS, rangoDe } from '../../lib/periodos.js'
import { puede } from '../../lib/permisos.js'
import { useAuth } from '../auth/AuthContext.js'

// ESTRUCTURA lista; el cálculo de la comisión NO está implementado a propósito:
// la regla de Natali llegó cortada ("solo se vende por docena o …", bloqueo B1) y no se inventa.
// Cuando se confirme, se agrega lib/comisiones.js (función pura + tests) y se completa la columna "Comisión".
export default function ComisionesPage() {
  const { usuario } = useAuth()
  const verTodas = puede(usuario.rol, 'comisiones.ver_todas')
  const [periodo, setPeriodo] = useState('mes')
  const rango = useMemo(() => rangoDe(periodo), [periodo])
  const ventas = useVentas({ estado: 'activa', desde: rango.desde ?? undefined, hasta: rango.hasta ?? undefined, vendedor_id: verTodas ? undefined : usuario.id })
  const equipo = usePerfiles({ soloActivos: false })

  const filas = useMemo(() => {
    if (!ventas.datos || !equipo.datos) return []
    const nombre = new Map(equipo.datos.map((p) => [p.id, p.nombre]))
    const porVendedor = new Map()
    for (const v of ventas.datos) {
      const f = porVendedor.get(v.vendedor_id) ?? { id: v.vendedor_id, nombre: nombre.get(v.vendedor_id) ?? v.vendedor_nombre, ventas: [] }
      f.ventas.push(v)
      porVendedor.set(v.vendedor_id, f)
    }
    return [...porVendedor.values()].map((f) => ({ ...f, cantidad: f.ventas.length, totales: totalesPorMoneda(f.ventas) })).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  }, [ventas.datos, equipo.datos])

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl md:text-3xl">{verTodas ? 'Comisiones' : 'Mi comisión'}</h1>

      <p role="status" className="flex gap-3 rounded-control bg-info-fondo p-3 text-sm text-info">
        <Info size={20} strokeWidth={1.75} aria-hidden className="mt-0.5 shrink-0" />
        <span><strong>La regla de comisión todavía no está definida.</strong> Mientras tanto se muestran las ventas de cada persona (sin anuladas); la comisión se calcula cuando se confirme la regla con Natali.</span>
      </p>

      <Tabs items={PERIODOS.map((p) => ({ valor: p.valor, etiqueta: p.etiqueta }))} valor={periodo} onChange={setPeriodo} />

      {(ventas.cargando || equipo.cargando) && <Skeleton className="h-40" />}
      {(ventas.error || equipo.error) && <ErrorState mensaje="No pudimos cargar las ventas." onReintentar={() => { ventas.reintentar(); equipo.reintentar() }} />}
      {ventas.datos && equipo.datos && filas.length === 0 && <EmptyState icono={Wallet} titulo="No hay ventas en este período" texto="Probá con un período más largo." />}

      <ul className="flex flex-col gap-3">
        {filas.map((f) => (
          <li key={f.id} className="flex flex-col gap-2 rounded-control border border-borde bg-superficie p-4">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-lg">{f.nombre}</h2>
              <p className="text-sm text-texto-suave tabular-nums">{f.cantidad} {f.cantidad === 1 ? 'venta' : 'ventas'}</p>
            </div>
            <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
              {f.totales.map((t) => (
                <div key={t.moneda} className="flex justify-between gap-3 text-sm">
                  <dt className="text-texto-suave">Vendido en {META_MONEDA[t.moneda].nombre}</dt>
                  <dd className="font-medium tabular-nums">{formatear(t.total_cent, t.moneda)}</dd>
                </div>
              ))}
              <div className="flex justify-between gap-3 text-sm sm:col-span-2">
                <dt className="text-texto-suave">Comisión</dt>
                <dd className="text-texto-tenue">Pendiente de definir la regla</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </div>
  )
}
