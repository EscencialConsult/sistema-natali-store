import { useMemo, useState } from 'react'
import { AlertTriangle, Banknote, ChevronRight, Coins, DollarSign, PackageCheck, Plus, ReceiptText, ScrollText, Search, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Avatar, Badge, Button, Dato, EmptyState, ErrorState, Skeleton, Tarjeta } from '../../components/ui/index.js'
import { useConfig, usePerfiles, useProductos, useStockResumen, useVentas } from '../../data/hooks.js'
import { fechaCorta } from '../../lib/fechas.js'
import { formatear, META_MONEDA, totalesPorMoneda } from '../../lib/moneda.js'
import { rangoDe } from '../../lib/periodos.js'
import { puede } from '../../lib/permisos.js'
import { useAuth } from '../auth/AuthContext.js'
import FiltroMoneda from '../../components/FiltroMoneda.jsx'
import DescargaOffline from './DescargaOffline.jsx'

const fechaHoy = new Intl.DateTimeFormat('es-BO', { weekday: 'long', day: 'numeric', month: 'long' })
const ICONO_MONEDA = { usd: DollarSign, ars: Coins, bs: Banknote }

// Inicio: lo del día de un vistazo. Quien ve todo (admin, encargadas) ve el negocio; el resto, solo lo suyo.
export default function DashboardPage() {
  const { usuario } = useAuth()
  const global = puede(usuario.rol, 'dashboard.ver_global')
  const [ahora] = useState(() => new Date())
  const rango = useMemo(() => rangoDe('hoy', ahora), [ahora])
  const propio = global ? undefined : usuario.id
  const hoy = useVentas({ estado: 'activa', desde: rango.desde, hasta: rango.hasta, vendedor_id: propio })
  const [monedaUltimas, setMonedaUltimas] = useState('')
  const ultimas = useVentas({ vendedor_id: propio, moneda: monedaUltimas || undefined })
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
    // El stock es por producto.
    for (const p of prods.datos) {
      const n = stock.datos[p.id] ?? 0
      if (n <= 0) agotados++
      else if (n <= umbral) bajos++
    }
    return { agotados, bajos }
  }, [verStock, prods.datos, stock.datos, cfg.datos])

  const totales = hoy.datos ? totalesPorMoneda(hoy.datos) : []
  const maxVentas = Math.max(1, ...porVendedor.map((f) => f.ventas.length))
  const reintentar = () => [hoy, ultimas, equipo, prods, stock, cfg].forEach((c) => c.reintentar())

  return (
    <div className="flex flex-col gap-6">
      <section className="relative overflow-hidden rounded-panel bg-pie p-5 text-sobre-tinta shadow-elevada sm:p-7">
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-tinta/60 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-28 right-1/3 size-56 rounded-full bg-tinta/25 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-sobre-tinta/70 first-letter:uppercase">{fechaHoy.format(ahora)}</p>
            <h1 className="mt-1 text-3xl md:text-4xl">Hola, {usuario.nombre.split(' ')[0]}</h1>
            <p className="mt-1 text-sobre-tinta/75">{global ? 'Así viene el negocio hoy.' : 'Así vienen tus ventas hoy.'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {puede(usuario.rol, 'venta.crear') && (
              <Link to="/venta"><Button variante="claro" icono={Plus}>Nueva venta</Button></Link>
            )}
            {puede(usuario.rol, 'catalogo.ver') && (
              <Link to="/catalogo"><Button variante="contorno_claro" icono={Search}>Buscar modelo</Button></Link>
            )}
          </div>
        </div>
      </section>

      {cargando && (
        <div className="flex flex-col gap-4" role="status" aria-label="Cargando">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-28" />)}</div>
          <Skeleton className="h-64" />
        </div>
      )}
      {fallo && <ErrorState mensaje="No pudimos cargar el inicio." onReintentar={reintentar} />}

      {!cargando && !fallo && (
        <>
          <section aria-label={global ? 'Ventas de hoy' : 'Tus ventas de hoy'} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Dato etiqueta={global ? 'Ventas de hoy' : 'Tus ventas hoy'} valor={hoy.datos.length} icono={ReceiptText} detalle={hoy.datos.length === 0 ? 'Todavía ninguna' : undefined} />
            {totales.map((t) => (
              <Dato key={t.moneda} etiqueta={`En ${META_MONEDA[t.moneda].nombre}`} valor={formatear(t.total_cent, t.moneda)} icono={ICONO_MONEDA[t.moneda]} />
            ))}
            {totales.length === 0 && (
              <div className="col-span-1 flex items-center rounded-tarjeta border border-dashed border-borde-fuerte p-4 text-sm text-texto-suave lg:col-span-3">
                {puede(usuario.rol, 'venta.crear') ? 'Cuando hagas la primera venta del día, los totales aparecen acá.' : 'Todavía no hay ventas hoy.'}
              </div>
            )}
          </section>
          {totales.length > 1 && <p className="-mt-3 text-xs text-texto-suave">Cada moneda se suma por separado: no se mezclan.</p>}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
            <div className="flex flex-col gap-6">
              <Tarjeta titulo="Últimas ventas" icono={ScrollText} enlace={{ a: '/ventas', texto: 'Ver todas' }} cuerpo="px-2 pb-2 sm:px-3 sm:pb-3">
                <FiltroMoneda valor={monedaUltimas} onChange={setMonedaUltimas} className="px-2 pb-2 sm:px-2" />
                {ultimas.datos.length === 0 ? (
                  <EmptyState icono={ScrollText} titulo={monedaUltimas ? `No hay ventas en ${META_MONEDA[monedaUltimas].nombre}` : 'Todavía no hay ventas'} texto={monedaUltimas ? 'Probá con otra moneda.' : 'La primera venta que hagas va a aparecer acá.'} />
                ) : (
                  <ul className="flex flex-col">
                    {ultimas.datos.slice(0, 6).map((v) => (
                      <li key={v.id}>
                        <Link to={`/ventas/${v.id}`} className="group flex min-h-16 items-center gap-3 rounded-control px-2 py-2 transition-colors hover:bg-superficie-2 sm:px-3">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-superficie-2 text-texto-suave group-hover:bg-superficie">
                            <ReceiptText size={18} strokeWidth={1.75} aria-hidden />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block font-medium tabular-nums">{v.numero}</span>
                            <span className="block truncate text-sm text-texto-suave">{v.cliente_nombre || 'Sin nombre de cliente'} · {fechaCorta(v.creada_en)}</span>
                          </span>
                          <span className="flex shrink-0 flex-col items-end gap-0.5">
                            <span className={v.estado === 'anulada' ? 'whitespace-nowrap tabular-nums text-texto-tenue line-through' : 'whitespace-nowrap font-semibold tabular-nums'}>{formatear(v.total_cent, v.moneda)}</span>
                            {v.estado === 'anulada' && <Badge tono="error">Anulada</Badge>}
                          </span>
                          <ChevronRight size={18} strokeWidth={1.75} aria-hidden className="hidden shrink-0 text-texto-tenue sm:block" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Tarjeta>
            </div>

            <div className="flex flex-col gap-6">
              {global && porVendedor.length > 0 && (
                <Tarjeta titulo="Equipo, hoy" icono={Users}>
                  <ul className="flex flex-col gap-4">
                    {porVendedor.map((f) => (
                      <li key={f.id} className="flex items-center gap-3">
                        <Avatar nombre={f.nombre} className="size-9 text-xs" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-3">
                            <span className="truncate text-sm font-medium">{f.nombre}</span>
                            <span className="shrink-0 text-xs text-texto-suave tabular-nums">{f.ventas.length} {f.ventas.length === 1 ? 'venta' : 'ventas'}</span>
                          </div>
                          <div aria-hidden className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-superficie-2">
                            <div className="h-full rounded-full bg-tinta" style={{ width: `${(f.ventas.length / maxVentas) * 100}%` }} />
                          </div>
                          <p className="mt-1 truncate text-xs tabular-nums text-texto-suave">{f.totales.map((t) => formatear(t.total_cent, t.moneda)).join(' · ')}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Tarjeta>
              )}

              {alertas && (
                <Tarjeta titulo="Stock" icono={alertas.agotados + alertas.bajos === 0 ? PackageCheck : AlertTriangle} enlace={{ a: '/stock', texto: 'Inventario' }}>
                  {alertas.agotados + alertas.bajos === 0 ? (
                    <p className="text-sm text-texto-suave">Todo el stock está en niveles normales.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-control bg-error-fondo p-3">
                        <p className="font-titulo text-2xl font-semibold tabular-nums text-error">{alertas.agotados}</p>
                        <p className="text-xs font-medium text-error">productos agotados</p>
                      </div>
                      <div className="rounded-control bg-alerta-fondo p-3">
                        <p className="font-titulo text-2xl font-semibold tabular-nums text-alerta">{alertas.bajos}</p>
                        <p className="text-xs font-medium text-alerta">con stock bajo</p>
                      </div>
                    </div>
                  )}
                </Tarjeta>
              )}

              <DescargaOffline />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
