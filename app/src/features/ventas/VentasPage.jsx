import { useMemo, useState } from 'react'
import { Banknote, Download, FileSearch, Landmark, SlidersHorizontal } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge, Button, EmptyState, ErrorState, Input, Select, Skeleton, Tabs, useToast } from '../../components/ui/index.js'
import { usePerfiles, useVentas } from '../../data/hooks.js'
import { ventas as repoVentas } from '../../data/repos/index.js'
import { fechaCorta } from '../../lib/fechas.js'
import { formatear, META_MONEDA, MONEDAS, totalesPorMoneda } from '../../lib/moneda.js'
import { desdeDeFecha, hastaDeFecha, PERIODOS, rangoDe } from '../../lib/periodos.js'
import { puede } from '../../lib/permisos.js'
import { useAuth } from '../auth/AuthContext.js'
import { crearExcelVentas } from './exportarVentas.js'

const TANDA = 30
const TODOS = { valor: '', etiqueta: 'Todos' }
const SYNC = { pending: ['alerta', 'Por enviar'], synced: ['exito', 'Enviada'], error: ['error', 'Con problema'] }
const OPC_MONEDA = [TODOS, ...MONEDAS.map((m) => ({ valor: m, etiqueta: `${META_MONEDA[m].simbolo} · ${META_MONEDA[m].nombre}` }))]
const OPC_PAGO = [TODOS, { valor: 'efectivo', etiqueta: 'Efectivo' }, { valor: 'transferencia', etiqueta: 'Transferencia' }]
const OPC_ENVIO = [TODOS, { valor: 'pending', etiqueta: 'Por enviar' }, { valor: 'synced', etiqueta: 'Enviadas' }, { valor: 'error', etiqueta: 'Con problema' }]
const OPC_ESTADO = [TODOS, { valor: 'activa', etiqueta: 'Activas' }, { valor: 'anulada', etiqueta: 'Anuladas' }]

const FILTROS_VACIOS = { moneda: '', metodo_pago: '', sync_status: '', estado: '', vendedor_id: '', desde: '', hasta: '' }

export default function VentasPage() {
  const { usuario } = useAuth()
  const avisar = useToast()
  const verTodas = puede(usuario.rol, 'ventas.ver_todas')
  const [periodo, setPeriodo] = useState('hoy')
  const [f, setF] = useState(FILTROS_VACIOS)
  const [masFiltros, setMasFiltros] = useState(false)
  const [visibles, setVisibles] = useState(TANDA)
  const [exportando, setExportando] = useState(false)
  const equipo = usePerfiles({ soloActivos: false })

  // Un vendedor sin permiso para ver todas solo ve las suyas, sin importar los filtros.
  const filtros = useMemo(() => {
    const r = rangoDe(periodo)
    return {
      moneda: f.moneda || undefined,
      metodo_pago: f.metodo_pago || undefined,
      sync_status: f.sync_status || undefined,
      estado: f.estado || undefined,
      vendedor_id: verTodas ? f.vendedor_id || undefined : usuario.id,
      desde: desdeDeFecha(f.desde) ?? r.desde ?? undefined,
      hasta: hastaDeFecha(f.hasta) ?? r.hasta ?? undefined,
    }
  }, [periodo, f, verTodas, usuario.id])
  const res = useVentas(filtros)

  const activas = (res.datos ?? []).filter((v) => v.estado === 'activa')
  const totales = totalesPorMoneda(activas)
  const hayFiltros = JSON.stringify(f) !== JSON.stringify(FILTROS_VACIOS)
  const cambiar = (campo) => (valor) => {
    setF((x) => ({ ...x, [campo]: valor }))
    setVisibles(TANDA)
  }

  const exportar = async () => {
    setExportando(true)
    try {
      const blob = await crearExcelVentas(await repoVentas.listarConItems(filtros))
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ventas-${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (e) {
      avisar(e.message, 'error')
    } finally {
      setExportando(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl md:text-3xl">{verTodas ? 'Ventas' : 'Mis ventas'}</h1>
        {puede(usuario.rol, 'ventas.exportar') && (
          <Button variante="secundario" icono={Download} cargando={exportando} deshabilitado={!res.datos?.length} onClick={exportar}>Exportar a Excel</Button>
        )}
      </div>

      <Tabs items={PERIODOS.map((p) => ({ valor: p.valor, etiqueta: p.etiqueta }))} valor={periodo} onChange={(p) => { setPeriodo(p); setF((x) => ({ ...x, desde: '', hasta: '' })); setVisibles(TANDA) }} />

      <div className="flex flex-col gap-3">
        <button type="button" aria-expanded={masFiltros} onClick={() => setMasFiltros(!masFiltros)} className="inline-flex min-h-11 items-center gap-2 self-start text-sm font-medium">
          <SlidersHorizontal size={18} strokeWidth={1.75} aria-hidden /> Filtros{hayFiltros && ' (activos)'}
        </button>
        {masFiltros && (
          <div className="grid gap-3 rounded-tarjeta border border-borde bg-superficie p-3 sm:grid-cols-2">
            {verTodas && <Select etiqueta="Vendedor/a" opciones={[TODOS, ...(equipo.datos ?? []).filter((p) => ['vendedor', 'enc_tienda', 'enc_ventas', 'admin'].includes(p.rol)).map((p) => ({ valor: p.id, etiqueta: p.nombre }))]} valor={f.vendedor_id} onChange={cambiar('vendedor_id')} />}
            <Select etiqueta="Moneda" opciones={OPC_MONEDA} valor={f.moneda} onChange={cambiar('moneda')} />
            <Select etiqueta="Forma de pago" opciones={OPC_PAGO} valor={f.metodo_pago} onChange={cambiar('metodo_pago')} />
            <Select etiqueta="Envío" opciones={OPC_ENVIO} valor={f.sync_status} onChange={cambiar('sync_status')} />
            <Select etiqueta="Estado" opciones={OPC_ESTADO} valor={f.estado} onChange={cambiar('estado')} />
            <Input etiqueta="Desde" type="date" value={f.desde} onChange={(e) => cambiar('desde')(e.target.value)} />
            <Input etiqueta="Hasta" type="date" value={f.hasta} onChange={(e) => cambiar('hasta')(e.target.value)} />
            {hayFiltros && <Button variante="fantasma" className="self-end sm:col-span-2 sm:justify-self-start" onClick={() => setF(FILTROS_VACIOS)}>Limpiar filtros</Button>}
          </div>
        )}
      </div>

      {res.cargando && <div className="flex flex-col gap-2" role="status" aria-label="Cargando ventas">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-20" />)}</div>}
      {res.error && <ErrorState mensaje="No pudimos cargar las ventas." onReintentar={res.reintentar} />}

      {res.datos && (
        <>
          <section aria-label="Totales" className="flex flex-wrap gap-3">
            <div className="min-w-32 rounded-control border border-borde bg-superficie p-3">
              <p className="text-xs text-texto-suave">Ventas activas</p>
              <p className="text-2xl font-semibold tabular-nums">{activas.length}</p>
            </div>
            {totales.map((t) => (
              <div key={t.moneda} className="min-w-40 rounded-control border border-borde bg-superficie p-3">
                <p className="text-xs text-texto-suave">Total en {META_MONEDA[t.moneda].nombre}</p>
                <p className="text-2xl font-semibold tabular-nums">{formatear(t.total_cent, t.moneda)}</p>
              </div>
            ))}
          </section>
          {totales.length > 1 && <p className="-mt-2 text-xs text-texto-suave">Cada moneda se suma por separado: no se mezclan.</p>}

          {res.datos.length === 0 ? (
            <EmptyState
              icono={FileSearch}
              titulo={hayFiltros || periodo !== 'todo' ? 'No hay ventas con estos filtros' : 'Todavía no hay ventas'}
              texto="Probá con otro período o limpiá los filtros."
              accion={puede(usuario.rol, 'venta.crear') && <Link to="/venta"><Button>Nueva venta</Button></Link>}
            />
          ) : (
            <ul className="flex flex-col gap-2">
              {res.datos.slice(0, visibles).map((v) => {
                const [tono, texto] = SYNC[v.sync_status] ?? SYNC.pending
                return (
                  <li key={v.id}>
                    <Link to={`/ventas/${v.id}`} className="flex flex-col gap-1.5 rounded-control border border-borde bg-superficie p-3 hover:bg-superficie-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold tabular-nums">{v.numero}</p>
                          <p className="truncate text-sm text-texto-suave">{v.cliente_nombre || 'Sin nombre de cliente'}</p>
                        </div>
                        <p className={v.estado === 'anulada' ? 'shrink-0 whitespace-nowrap text-lg tabular-nums text-texto-tenue line-through' : 'shrink-0 whitespace-nowrap text-lg font-semibold tabular-nums'}>{formatear(v.total_cent, v.moneda)}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-texto-suave">
                        <span>{fechaCorta(v.creada_en)}</span>
                        {verTodas && <span>{v.vendedor_nombre}</span>}
                        <span className="inline-flex items-center gap-1">
                          {v.metodo_pago === 'efectivo' ? <Banknote size={14} strokeWidth={1.75} aria-hidden /> : <Landmark size={14} strokeWidth={1.75} aria-hidden />}
                          {v.metodo_pago === 'efectivo' ? 'Efectivo' : 'Transferencia'}
                        </span>
                        {v.estado === 'anulada' && <Badge tono="error">Anulada</Badge>}
                        <Badge tono={tono}>{texto}</Badge>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
          {visibles < res.datos.length && <Button variante="secundario" className="self-center" onClick={() => setVisibles((v) => v + TANDA)}>Ver más ({res.datos.length - visibles})</Button>}
        </>
      )}
    </div>
  )
}
