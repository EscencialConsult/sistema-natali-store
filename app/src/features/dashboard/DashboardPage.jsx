import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowRight, Plus, ScrollText, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge, Button, EmptyState, ErrorState, Skeleton } from '../../components/ui/index.js'
import { useConfig, usePerfiles, useProductos, useStockResumen, useVentas } from '../../data/hooks.js'
import { fechaCorta } from '../../lib/fechas.js'
import { formatear, META_MONEDA, totalesPorMoneda } from '../../lib/moneda.js'
import { rangoDe } from '../../lib/periodos.js'
import { puede } from '../../lib/permisos.js'
import { useAuth } from '../auth/AuthContext.js'
import DescargaOffline from './DescargaOffline.jsx'

const fechaHoy = new Intl.DateTimeFormat('es-BO', { weekday: 'long', day: 'numeric', month: 'long' })

function Tarjeta({ titulo, children, enlace }) {
  return (
    <section className="flex flex-col gap-3 rounded-tarjeta border border-borde bg-superficie p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg">{titulo}</h2>
        {enlace && (
          <Link to={enlace.a} className="inline-flex min-h-11 items-center gap-1 text-sm font-medium underline">
            {enlace.texto} <ArrowRight size={16} strokeWidth={1.75} aria-hidden />
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}

// Inicio: lo del día de un vistazo. Quien ve todo (admin, encargadas) ve el negocio; el resto, solo lo suyo.
export default function DashboardPage() {
  const { usuario } = useAuth()
  const global = puede(usuario.rol, 'dashboard.ver_global')
  const [ahora] = useState(() => new Date())
  const rango = useMemo(() => rangoDe('hoy', ahora), [ahora])
  const propio = global ? undefined : usuario.id
  const hoy = useVentas({ estado: 'activa', desde: rango.desde, hasta: rango.hasta, vendedor_id: propio })
  const ultimas = useVentas({ vendedor_id: propio })
  const equipo = usePerfiles({ soloActivos: false })
  const prods = useProductos()
  const stock = useStockResumen()
  const cfg = useConfig()

  const verStock = puede(usuario.rol, 'stock.ver')
  const cargando = hoy.cargando || ultimas.cargando || equipo.cargando || cfg.cargando || (verStock && (prods.cargando || stock.cargando))
  const fallo = hoy.error || ultimas.error || equipo.error || cfg.error || (verStock && (prods.error || stock.error))

  const porVendedor = useMemo(() => {
    if (!hoy.datos || !equipo.datos) return []
    const nombre = new Map(equipo.datos.map((p) => [p.id, p.nombre]))
    const m = new Map()
    for (const v of hoy.datos) {
      const f = m.get(v.vendedor_id) ?? { id: v.vendedor_id, nombre: nombre.get(v.vendedor_id) ?? v.vendedor_nombre, ventas: [] }
      f.ventas.push(v)
      m.set(v.vendedor_id, f)
    }
    return [...m.values()].map((f) => ({ ...f, totales: totalesPorMoneda(f.ventas) })).sort((a, b) => b.ventas.length - a.ventas.length)
  }, [hoy.datos, equipo.datos])

  const alertas = useMemo(() => {
    if (!verStock || !prods.datos || !stock.datos || !cfg.datos) return null
    const umbral = cfg.datos.stock_bajo_unidades
    let agotados = 0
    let bajos = 0
    for (const p of prods.datos) {
      for (const c of p.colores) {
        const n = stock.datos[c.id] ?? 0
        if (n <= 0) agotados++
        else if (n <= umbral) bajos++
      }
    }
    return { agotados, bajos }
  }, [verStock, prods.datos, stock.datos, cfg.datos])

  const totales = hoy.datos ? totalesPorMoneda(hoy.datos) : []
  const reintentar = () => [hoy, ultimas, equipo, prods, stock, cfg].forEach((c) => c.reintentar())

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-sm text-texto-suave first-letter:uppercase">{fechaHoy.format(ahora)}</p>
        <h1 className="text-2xl md:text-3xl">Hola, {usuario.nombre.split(' ')[0]}</h1>
      </header>

      <div className="flex flex-wrap gap-2">
        {puede(usuario.rol, 'venta.crear') && <Link to="/venta"><Button icono={Plus}>Nueva venta</Button></Link>}
        {puede(usuario.rol, 'catalogo.ver') && <Link to="/catalogo"><Button variante="secundario" icono={Search}>Buscar modelo</Button></Link>}
      </div>

      {cargando && <div className="flex flex-col gap-3" role="status" aria-label="Cargando"><Skeleton className="h-28" /><Skeleton className="h-40" /></div>}
      {fallo && <ErrorState mensaje="No pudimos cargar el inicio." onReintentar={reintentar} />}

      {!cargando && !fallo && (
        <>
          <Tarjeta titulo={global ? 'Ventas de hoy' : 'Tus ventas de hoy'} enlace={puede(usuario.rol, 'ventas.ver_propias') || global ? { a: '/ventas', texto: 'Ver todas' } : null}>
            {hoy.datos.length === 0 ? (
              <p className="text-sm text-texto-suave">Todavía no hay ventas hoy. {puede(usuario.rol, 'venta.crear') && 'Cuando hagas una, aparece acá.'}</p>
            ) : (
              <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
                <div>
                  <p className="text-xs text-texto-suave">Ventas</p>
                  <p className="text-3xl font-semibold tabular-nums">{hoy.datos.length}</p>
                </div>
                {totales.map((t) => (
                  <div key={t.moneda}>
                    <p className="text-xs text-texto-suave">En {META_MONEDA[t.moneda].nombre}</p>
                    <p className="text-3xl font-semibold tabular-nums">{formatear(t.total_cent, t.moneda)}</p>
                  </div>
                ))}
              </div>
            )}
          </Tarjeta>

          {global && porVendedor.length > 0 && (
            <Tarjeta titulo="Por vendedor, hoy">
              <ul className="flex flex-col divide-y divide-borde">
                {porVendedor.map((f) => (
                  <li key={f.id} className="flex flex-col gap-0.5 py-2.5">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="font-medium">{f.nombre}</span>
                      <span className="text-sm text-texto-suave tabular-nums">{f.ventas.length} {f.ventas.length === 1 ? 'venta' : 'ventas'}</span>
                    </span>
                    <span className="text-sm tabular-nums text-texto-suave">{f.totales.map((t) => formatear(t.total_cent, t.moneda)).join(' · ')}</span>
                  </li>
                ))}
              </ul>
            </Tarjeta>
          )}

          {alertas && (
            <Tarjeta titulo="Stock" enlace={{ a: '/stock', texto: 'Ir al inventario' }}>
              {alertas.agotados + alertas.bajos === 0 ? (
                <p className="text-sm text-texto-suave">Todo el stock está en niveles normales.</p>
              ) : (
                <p className="flex flex-wrap items-center gap-2 text-sm">
                  <AlertTriangle size={18} strokeWidth={1.75} aria-hidden className="text-alerta" />
                  {alertas.agotados > 0 && <Badge tono="error">{alertas.agotados} colores agotados</Badge>}
                  {alertas.bajos > 0 && <Badge tono="alerta">{alertas.bajos} con stock bajo</Badge>}
                </p>
              )}
            </Tarjeta>
          )}

          <Tarjeta titulo="Últimas ventas" enlace={ultimas.datos.length ? { a: '/ventas', texto: 'Historial' } : null}>
            {ultimas.datos.length === 0 ? (
              <EmptyState icono={ScrollText} titulo="Todavía no hay ventas" texto="La primera venta que hagas va a aparecer acá." />
            ) : (
              <ul className="flex flex-col divide-y divide-borde">
                {ultimas.datos.slice(0, 5).map((v) => (
                  <li key={v.id}>
                    <Link to={`/ventas/${v.id}`} className="flex min-h-14 items-center justify-between gap-3 py-2">
                      <span className="min-w-0">
                        <span className="block font-medium tabular-nums">{v.numero}</span>
                        <span className="block truncate text-sm text-texto-suave">{v.cliente_nombre || 'Sin nombre de cliente'} · {fechaCorta(v.creada_en)}</span>
                      </span>
                      <span className={v.estado === 'anulada' ? 'shrink-0 whitespace-nowrap tabular-nums text-texto-tenue line-through' : 'shrink-0 whitespace-nowrap font-semibold tabular-nums'}>{formatear(v.total_cent, v.moneda)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Tarjeta>
          <DescargaOffline />
        </>
      )}
    </div>
  )
}
