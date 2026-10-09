import { useMemo, useState } from 'react'
import { FileSpreadsheet, PackageSearch, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge, Button, Chip, EmptyState, ErrorState, Skeleton } from '../../components/ui/index.js'
import { useConfig, useProductos, useStockResumen } from '../../data/hooks.js'
import { puede } from '../../lib/permisos.js'
import { useAuth } from '../auth/AuthContext.js'
import Foto from '../catalogo/Foto.jsx'
import MovimientoSheet from './MovimientoSheet.jsx'

const TANDA = 40
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export default function InventarioPage() {
  const { usuario } = useAuth()
  const [texto, setTexto] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [abierto, setAbierto] = useState(null)
  const [visibles, setVisibles] = useState(TANDA)
  const prods = useProductos()
  const stock = useStockResumen()
  const cfg = useConfig()

  const umbral = cfg.datos?.stock_bajo_unidades ?? 24
  const filas = useMemo(() => {
    if (!prods.datos || !stock.datos) return []
    return prods.datos.map((p) => {
      const unidades = p.colores.map((c) => stock.datos[c.id] ?? 0)
      return {
        p,
        total: unidades.reduce((t, n) => t + n, 0),
        agotados: unidades.filter((n) => n <= 0).length,
        bajos: unidades.filter((n) => n > 0 && n <= umbral).length,
      }
    })
  }, [prods.datos, stock.datos, umbral])

  const resumen = filas.reduce((r, f) => ({ prendas: r.prendas + f.total, agotados: r.agotados + f.agotados, bajos: r.bajos + f.bajos }), { prendas: 0, agotados: 0, bajos: 0 })
  const q = norm(texto.trim())
  const lista = filas
    .filter((f) => (filtro === 'agotados' ? f.agotados > 0 : filtro === 'bajos' ? f.bajos > 0 : true))
    .filter((f) => !q || norm(`${f.p.codigo} ${f.p.nombre}`).includes(q))

  const cargando = prods.cargando || stock.cargando || cfg.cargando
  const error = prods.error || stock.error || cfg.error

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl md:text-3xl">Inventario</h1>
        {puede(usuario.rol, 'stock.mover') && <Link to="/stock/importar"><Button variante="secundario" icono={FileSpreadsheet}>Cargar desde Excel</Button></Link>}
      </div>

      {cargando && <Skeleton className="h-64" />}
      {error && <ErrorState mensaje="No pudimos cargar el inventario." onReintentar={() => { prods.reintentar(); stock.reintentar(); cfg.reintentar() }} />}

      {!cargando && !error && (
        <>
          <section aria-label="Resumen" className="grid grid-cols-3 gap-3">
            <div className="rounded-control border border-borde bg-superficie p-3"><p className="text-xs text-texto-suave">Prendas</p><p className="text-xl font-semibold tabular-nums">{resumen.prendas}</p></div>
            <div className="rounded-control border border-borde bg-superficie p-3"><p className="text-xs text-texto-suave">Stock bajo</p><p className="text-xl font-semibold tabular-nums text-alerta">{resumen.bajos}</p></div>
            <div className="rounded-control border border-borde bg-superficie p-3"><p className="text-xs text-texto-suave">Agotados</p><p className="text-xl font-semibold tabular-nums text-error">{resumen.agotados}</p></div>
          </section>
          <p className="-mt-2 text-xs text-texto-suave">Stock bajo y agotados cuentan colores (no productos). Bajo = {umbral} prendas o menos.</p>

          <div role="search" className="relative">
            <label htmlFor="buscar-stock" className="sr-only">Buscar producto</label>
            <Search size={20} strokeWidth={1.75} aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-texto-tenue" />
            <input id="buscar-stock" type="search" autoComplete="off" value={texto} onChange={(e) => { setTexto(e.target.value); setVisibles(TANDA) }} placeholder="Código o nombre" className="min-h-12 w-full rounded-control border border-borde-fuerte bg-superficie pl-12 pr-3 text-base" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip activo={filtro === 'todos'} onClick={() => setFiltro('todos')}>Todos</Chip>
            <Chip activo={filtro === 'bajos'} onClick={() => setFiltro('bajos')}>Con stock bajo</Chip>
            <Chip activo={filtro === 'agotados'} onClick={() => setFiltro('agotados')}>Con colores agotados</Chip>
          </div>

          {lista.length === 0 ? (
            <EmptyState icono={PackageSearch} titulo="No hay productos para mostrar" texto="Probá con otro filtro o búsqueda." />
          ) : (
            <ul className="flex flex-col gap-2">
              {lista.slice(0, visibles).map(({ p, total, agotados, bajos }) => (
                <li key={p.id}>
                  <button type="button" onClick={() => setAbierto(p.id)} className="flex min-h-[4.5rem] w-full items-center gap-3 rounded-control border border-borde bg-superficie p-2 text-left hover:bg-superficie-2">
                    <Foto foto={p.fotos[0]} alt="" className="size-14 shrink-0 rounded-tarjeta" />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-sm font-semibold tabular-nums">{p.codigo}</span>
                      <span className="truncate text-base">{p.nombre}</span>
                      <span className="flex flex-wrap gap-1.5 pt-0.5">
                        {agotados > 0 && <Badge tono="error">{agotados} agotado{agotados > 1 && 's'}</Badge>}
                        {bajos > 0 && <Badge tono="alerta">{bajos} con stock bajo</Badge>}
                      </span>
                    </span>
                    <span className="text-right"><span className="block text-lg font-semibold tabular-nums">{total}</span><span className="text-xs text-texto-suave">prendas</span></span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {visibles < lista.length && <Button variante="secundario" className="self-center" onClick={() => setVisibles((v) => v + TANDA)}>Ver más ({lista.length - visibles})</Button>}
        </>
      )}

      <MovimientoSheet productoId={abierto} onCerrar={() => setAbierto(null)} />
    </div>
  )
}
