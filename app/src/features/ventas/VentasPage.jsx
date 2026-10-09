import { useMemo, useState } from 'react'
import { Banknote, ChevronRight, Coins, DollarSign, FileSearch, Landmark, ReceiptText, SlidersHorizontal } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge, Button, Dato, Encabezado, EmptyState, ErrorState, FILA, Input, Select, Skeleton, Tabs, TARJETA } from '../../components/ui/index.js'
import { usePerfiles, useVentas } from '../../data/hooks.js'
import { ventas as repoVentas } from '../../data/repos/index.js'
import { fechaCorta } from '../../lib/fechas.js'
import { METODOS_ENTREGA } from '../../lib/entrega.js'
import { contiene, etiquetaDe, nombreArchivo, textoMonedas } from '../../lib/excel.js'
import { formatear, META_MONEDA, MONEDAS, totalesPorMoneda } from '../../lib/moneda.js'
import { desdeDeFecha, hastaDeFecha, PERIODOS, rangoDe } from '../../lib/periodos.js'
import { puede } from '../../lib/permisos.js'
import { useAuth } from '../auth/AuthContext.js'
import ExportarExcel from '../../components/ExportarExcel.jsx'
import FiltroMoneda from '../../components/FiltroMoneda.jsx'
import { libroVentas } from './exportarVentas.js'

const TANDA = 30
const ICONO_MONEDA = { usd: DollarSign, ars: Coins, bs: Banknote }
const TODOS = { valor: '', etiqueta: 'Todos' }
const SYNC = { pending: ['alerta', 'Por enviar'], synced: ['exito', 'Enviada'], error: ['error', 'Con problema'] }
const OPC_PAGO = [TODOS, { valor: 'efectivo', etiqueta: 'Efectivo' }, { valor: 'transferencia', etiqueta: 'Transferencia' }]
const OPC_ENVIO = [TODOS, { valor: 'pending', etiqueta: 'Por enviar' }, { valor: 'synced', etiqueta: 'Enviadas' }, { valor: 'error', etiqueta: 'Con problema' }]
const OPC_ESTADO = [TODOS, { valor: 'activa', etiqueta: 'Activas' }, { valor: 'anulada', etiqueta: 'Anuladas' }]
const OPC_ENTREGA = [TODOS, ...Object.entries(METODOS_ENTREGA).map(([valor, etiqueta]) => ({ valor, etiqueta }))]
const VENDEN = ['vendedor', 'enc_tienda', 'enc_ventas', 'admin', 'superadmin']

const FILTROS_VACIOS = { moneda: '', metodo_pago: '', sync_status: '', estado: '', vendedor_id: '', desde: '', hasta: '' }

export default function VentasPage() {
  const { usuario } = useAuth()
  const verTodas = puede(usuario.rol, 'ventas.ver_todas')
  const [periodo, setPeriodo] = useState('hoy')
  const [f, setF] = useState(FILTROS_VACIOS)
  const [masFiltros, setMasFiltros] = useState(false)
  const [visibles, setVisibles] = useState(TANDA)
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

  // Exportar: período (por defecto este mes), monedas y filtros propios de las ventas.
  const opcVendedor = [TODOS, ...(equipo.datos ?? []).filter((p) => VENDEN.includes(p.rol)).map((p) => ({ valor: p.id, etiqueta: p.nombre }))]
  const camposExportar = [
    ...(verTodas ? [{ tipo: 'select', clave: 'vendedor_id', etiqueta: 'Vendedor/a', opciones: opcVendedor }] : []),
    { tipo: 'texto', clave: 'cliente', etiqueta: 'Cliente', placeholder: 'Nombre, teléfono o correo' },
    { tipo: 'select', clave: 'metodo_pago', etiqueta: 'Forma de pago', opciones: OPC_PAGO },
    { tipo: 'select', clave: 'metodo_entrega', etiqueta: 'Entrega', opciones: OPC_ENTREGA },
    { tipo: 'select', clave: 'estado', etiqueta: 'Estado', opciones: OPC_ESTADO },
  ]
  const generarExcel = async (x) => {
    const lista = (
      await repoVentas.listarConItems({
        metodo_pago: x.metodo_pago || undefined,
        estado: x.estado || undefined,
        vendedor_id: verTodas ? x.vendedor_id || undefined : usuario.id,
        desde: x.desde,
        hasta: x.hasta,
      })
    ).filter((v) => x.monedas.includes(v.moneda) && contiene(x.cliente, v.cliente_nombre, v.cliente_telefono, v.cliente_email) && (!x.metodo_entrega || v.metodo_entrega === x.metodo_entrega))
    const filtrosTexto = [
      ['Período', x.periodoTexto],
      ['Monedas', textoMonedas(x.monedas, MONEDAS)],
      ['Vendedor/a', verTodas ? etiquetaDe(opcVendedor, x.vendedor_id) : usuario.nombre],
      ['Cliente', x.cliente.trim()],
      ['Pago', etiquetaDe(OPC_PAGO, x.metodo_pago)],
      ['Entrega', etiquetaDe(OPC_ENTREGA, x.metodo_entrega)],
      ['Estado', etiquetaDe(OPC_ESTADO, x.estado)],
    ]
    return { libro: libroVentas(lista, filtrosTexto), nombre: nombreArchivo('ventas') }
  }

  return (
    <div className="flex flex-col gap-6">
      <Encabezado
        titulo={verTodas ? 'Ventas' : 'Mis ventas'}
        descripcion="Historial de notas de venta, con filtros y totales por moneda."
        acciones={puede(usuario.rol, 'ventas.exportar') && (
          <ExportarExcel titulo="Exportar ventas a Excel" periodo monedas campos={camposExportar} generar={generarExcel} />
        )}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs items={PERIODOS.map((p) => ({ valor: p.valor, etiqueta: p.etiqueta }))} valor={periodo} onChange={(p) => { setPeriodo(p); setF((x) => ({ ...x, desde: '', hasta: '' })); setVisibles(TANDA) }} />
        <Button variante={masFiltros || hayFiltros ? 'suave' : 'secundario'} icono={SlidersHorizontal} aria-expanded={masFiltros} onClick={() => setMasFiltros(!masFiltros)}>
          Filtros{hayFiltros && ' · activos'}
        </Button>
      </div>

      <FiltroMoneda valor={f.moneda} onChange={cambiar('moneda')} />

      {masFiltros && (
        <div className={`${TARJETA} grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4`}>
          {verTodas && <Select etiqueta="Vendedor/a" opciones={[TODOS, ...(equipo.datos ?? []).filter((p) => VENDEN.includes(p.rol)).map((p) => ({ valor: p.id, etiqueta: p.nombre }))]} valor={f.vendedor_id} onChange={cambiar('vendedor_id')} />}
          <Select etiqueta="Forma de pago" opciones={OPC_PAGO} valor={f.metodo_pago} onChange={cambiar('metodo_pago')} />
          <Select etiqueta="Envío" opciones={OPC_ENVIO} valor={f.sync_status} onChange={cambiar('sync_status')} />
          <Select etiqueta="Estado" opciones={OPC_ESTADO} valor={f.estado} onChange={cambiar('estado')} />
          <Input etiqueta="Desde" type="date" value={f.desde} onChange={(e) => cambiar('desde')(e.target.value)} />
          <Input etiqueta="Hasta" type="date" value={f.hasta} onChange={(e) => cambiar('hasta')(e.target.value)} />
          {hayFiltros && <Button variante="fantasma" className="self-end sm:col-span-2 sm:justify-self-start lg:col-span-1" onClick={() => setF(FILTROS_VACIOS)}>Limpiar filtros</Button>}
        </div>
      )}

      {res.cargando && <div className="flex flex-col gap-2" role="status" aria-label="Cargando ventas">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-20" />)}</div>}
      {res.error && <ErrorState mensaje="No pudimos cargar las ventas." onReintentar={res.reintentar} />}

      {res.datos && (
        <>
          <section aria-label="Totales" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Dato etiqueta="Ventas activas" valor={activas.length} icono={ReceiptText} />
            {totales.map((t) => (
              <Dato key={t.moneda} etiqueta={`Total en ${META_MONEDA[t.moneda].nombre}`} valor={formatear(t.total_cent, t.moneda)} icono={ICONO_MONEDA[t.moneda]} />
            ))}
          </section>
          {totales.length > 1 && <p className="-mt-3 text-xs text-texto-suave">Cada moneda se suma por separado: no se mezclan.</p>}

          {res.datos.length === 0 ? (
            <div className={TARJETA}>
              <EmptyState
                icono={FileSearch}
                titulo={hayFiltros || periodo !== 'todo' ? 'No hay ventas con estos filtros' : 'Todavía no hay ventas'}
                texto="Probá con otro período o limpiá los filtros."
                accion={puede(usuario.rol, 'venta.crear') && <Link to="/venta"><Button>Nueva venta</Button></Link>}
              />
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {res.datos.slice(0, visibles).map((v) => {
                const [tono, texto] = SYNC[v.sync_status] ?? SYNC.pending
                return (
                  <li key={v.id}>
                    <Link to={`/ventas/${v.id}`} className={`group ${FILA} p-3 sm:p-4`}>
                      <span className="hidden size-11 shrink-0 items-center justify-center rounded-control bg-tinte text-tinta sm:flex">
                        <ReceiptText size={20} strokeWidth={1.75} aria-hidden />
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold tabular-nums">{v.numero}</p>
                            <p className="truncate text-sm text-texto-suave">{v.cliente_nombre || 'Sin nombre de cliente'}</p>
                          </div>
                          <p className={v.estado === 'anulada' ? 'shrink-0 whitespace-nowrap text-lg tabular-nums text-texto-tenue line-through' : 'shrink-0 whitespace-nowrap font-titulo text-lg font-semibold tabular-nums'}>{formatear(v.total_cent, v.moneda)}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-texto-suave">
                          <span>{fechaCorta(v.creada_en)}</span>
                          {verTodas && <span>· {v.vendedor_nombre}</span>}
                          <span className="inline-flex items-center gap-1">
                            {v.metodo_pago === 'efectivo' ? <Banknote size={14} strokeWidth={1.75} aria-hidden /> : <Landmark size={14} strokeWidth={1.75} aria-hidden />}
                            {v.metodo_pago === 'efectivo' ? 'Efectivo' : 'Transferencia'}
                          </span>
                          {v.estado === 'anulada' && <Badge tono="error">Anulada</Badge>}
                          <Badge tono={tono}>{texto}</Badge>
                        </div>
                      </div>
                      <ChevronRight size={18} strokeWidth={1.75} aria-hidden className="hidden shrink-0 text-texto-tenue group-hover:text-tinta sm:block" />
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
